import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { logAudit, requireTenantAccess } from "../_shared/auth.ts";
import {
  type AuditPeriodConfig,
  closedBackAuditRange,
  fetchTenantAuditPeriodConfig,
} from "../_shared/auditPeriods.ts";

const PAGE_SIZE = 2000;
const MAX_PAGES = 50;

function resolveDateRange(
  body: Record<string, unknown>,
  auditConfig: AuditPeriodConfig,
): { start_date: string; end_date: string } {
  const defaults = closedBackAuditRange(auditConfig);
  const start_date = body.start_date ? String(body.start_date).trim() : defaults.start_date;
  const end_date = body.end_date ? String(body.end_date).trim() : defaults.end_date;

  const start = new Date(start_date);
  const end = new Date(end_date);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Invalid start_date or end_date");
  }
  if (start > end) {
    throw new Error("start_date must be on or before end_date");
  }

  const currentYearStart = new Date(auditConfig.currentAuditYear, 0, 1);
  if (end >= currentYearStart && !body.force) {
    throw new Error(
      `Back audit covers closed periods only (before ${auditConfig.currentAuditYear}-01-01). ` +
        "Use Run Reconciliation for the current audit year, or pass force: true to override.",
    );
  }

  return { start_date, end_date };
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    if (typeof record.message === "string" && record.message) return record.message;
    if (typeof record.error === "string" && record.error) return record.error;
  }
  return "Back audit failed";
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  const startTime = Date.now();
  let jobId: number | null = null;
  // deno-lint-ignore no-explicit-any
  let jobSupabase: any = null;

  try {
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const tenantId = String(body.tenant_id || "").trim();
    const product_type = (body.product_type as string | null | undefined) ?? null;
    const min_amount = Number(body.min_amount) || 0;

    if (!tenantId) {
      throw new Error("tenant_id is required");
    }

    const access = await requireTenantAccess(req, tenantId, "auditor");
    if (access instanceof Response) return access;

    const { user, supabase } = access;
    jobSupabase = supabase;

    const auditConfig = await fetchTenantAuditPeriodConfig(supabase, tenantId);
    const { start_date, end_date } = resolveDateRange(body, auditConfig);

    const { data: job, error: jobError } = await supabase
      .from("back_audit_jobs")
      .insert({
        tenant_id: tenantId,
        start_date,
        end_date,
        product_type,
        min_amount,
        status: "running",
        job_started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (jobError) throw jobError;
    jobId = job.id as number;

    let total_scanned = 0;
    let discrepancies_found = 0;
    let page = 0;
    let hasMore = true;

    while (hasMore && page < MAX_PAGES) {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("master_ledger")
        .select("transaction_id, transaction_date, product_type, amount, fee, reference, status")
        .eq("tenant_id", tenantId)
        .gte("transaction_date", start_date)
        .lte("transaction_date", end_date)
        .order("transaction_date", { ascending: true })
        .range(from, to);

      if (product_type) query = query.eq("product_type", product_type);
      if (min_amount > 0) query = query.gte("amount", min_amount);

      const { data: transactions, error } = await query;
      if (error) throw error;

      if (!transactions || transactions.length === 0) {
        hasMore = false;
        break;
      }

      total_scanned += transactions.length;
      const inserts: Record<string, unknown>[] = [];

      for (const tx of transactions) {
        const amount = Number(tx.amount);
        const fee = Number(tx.fee ?? 0);
        let discrepancy = 0;
        let lossCategory = "standard";

        if (fee > amount * 0.05) {
          discrepancy = Math.round(fee - amount * 0.05);
          lossCategory = "fee_overcharge";
        } else if (tx.status === "unmatched") {
          discrepancy = Math.round(amount * 0.01);
          lossCategory = "unmatched_exposure";
        } else if (!tx.reference) {
          discrepancy = Math.round(amount * 0.005);
          lossCategory = "missing_reference";
        }

        if (discrepancy > 100) {
          inserts.push({
            tenant_id: tenantId,
            transaction_id: tx.transaction_id,
            original_transaction_date: tx.transaction_date,
            product_type: tx.product_type,
            discrepancy_amount: discrepancy,
            expected_amount: amount,
            actual_amount: amount - discrepancy,
            recovery_amount: 0,
            recovery_cost: Math.round(discrepancy * 0.15),
            loss_category: discrepancy > 500000 ? "high_value" : lossCategory,
            status: "identified",
            audit_notes: `Rule-based back audit job #${jobId}`,
            auditor_id: user.id,
          });
          discrepancies_found++;
        }
      }

      if (inserts.length > 0) {
        const { error: insertError } = await supabase
          .from("revenue_recovery_audit")
          .insert(inserts);
        if (insertError) throw insertError;
      }

      page++;
      if (Date.now() - startTime > 100000) break;
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    await supabase
      .from("back_audit_jobs")
      .update({
        status: "completed",
        job_completed_at: new Date().toISOString(),
        transactions_scanned: total_scanned,
        discrepancies_found,
      })
      .eq("id", jobId);

    await logAudit(supabase, {
      tenant_id: tenantId,
      user_id: user.id,
      action: "back_audit.completed",
      resource_type: "back_audit",
      resource_id: String(jobId),
      metadata: { total_scanned, discrepancies_found, start_date, end_date },
    });

    return new Response(
      JSON.stringify({
        success: true,
        job_id: jobId,
        total_scanned,
        discrepancies_found,
        inserted_into_recovery: discrepancies_found,
        pages_processed: page,
        duration_seconds: duration,
        period: `${start_date} → ${end_date}`,
        product_type: product_type || "All Products",
        message: `Back audit complete: scanned ${total_scanned.toLocaleString()} transactions, found ${discrepancies_found} discrepancies`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const message = errorMessage(error);
    console.error("Back Audit Failed:", message, error);

    if (jobId && jobSupabase) {
      await jobSupabase
        .from("back_audit_jobs")
        .update({
          status: "failed",
          job_completed_at: new Date().toISOString(),
          error_message: message,
        })
        .eq("id", jobId);
    }

    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { logAudit, requireTenantAccess } from "../_shared/auth.ts";
import { processCsvIngest } from "../_shared/ingestProcessor.ts";
import {
  resolveReportSide,
  type ReportSide,
  type ReportType,
} from "../_shared/reportMappers.ts";
import { notifyTenantWebhook } from "../_shared/webhookNotify.ts";

const MAX_FILE_BYTES = 50 * 1024 * 1024;
const INSERT_BATCH = 500;

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    if (typeof record.message === "string" && record.message) return record.message;
    if (typeof record.error === "string" && record.error) return record.error;
    if (record.code === "23505") {
      return "Duplicate transactions detected (same transaction_id + date already in ledger). Clear the ledger or upload only new rows.";
    }
  }
  return "Upload failed";
}

async function insertLedgerRows(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  tenantId: string,
  records: Record<string, unknown>[],
): Promise<{ inserted: number; duplicates: number }> {
  const { count: beforeCount } = await supabase
    .from("master_ledger")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  for (let i = 0; i < records.length; i += INSERT_BATCH) {
    const batch = records.slice(i, i + INSERT_BATCH);
    const { error } = await supabase
      .from("master_ledger")
      .upsert(batch, {
        onConflict: "transaction_id,transaction_date",
        ignoreDuplicates: true,
      });
    if (error) throw error;
  }

  const { count: afterCount } = await supabase
    .from("master_ledger")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  const inserted = Math.max(0, (afterCount ?? 0) - (beforeCount ?? 0));
  return {
    inserted,
    duplicates: Math.max(0, records.length - inserted),
  };
}

const REPORT_TYPES = new Set<ReportType>([
  "generic",
  "pos_settlement",
  "ussd_transaction",
  "bank_transfer",
  "wallet_statement",
  "card_transaction",
  "fee_commission",
  "chargeback_reversal",
  "agent_terminal",
  "qr_payment",
  "bulk_payout",
]);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const tenantId = String(formData.get("tenant_id") || "").trim();
    const reportTypeRaw = String(formData.get("report_type") || "generic").trim() as ReportType;
    const reportSideRaw = String(formData.get("report_side") || "").trim() as ReportSide;

    if (!file) {
      return new Response(
        JSON.stringify({ success: false, error: "No file received" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const access = await requireTenantAccess(req, tenantId, "auditor");
    if (access instanceof Response) return access;

    const { user, supabase } = access;

    if (file.size > MAX_FILE_BYTES) {
      return new Response(
        JSON.stringify({ success: false, error: "File exceeds 50MB limit" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const reportType = REPORT_TYPES.has(reportTypeRaw) ? reportTypeRaw : "generic";
    const reportSide = resolveReportSide(reportType, reportSideRaw || undefined);

    const result = processCsvIngest(tenantId, await file.text(), reportType, reportSide);
    if (result.errors.length) {
      return new Response(
        JSON.stringify({ success: false, error: result.errors.join("; ") }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const records = result.records.map((r) => ({
      tenant_id: r.tenant_id,
      transaction_id: r.transaction_id,
      product_type: r.product_type,
      amount: r.amount,
      fee: r.fee,
      transaction_date: r.transaction_date,
      reference: r.reference,
      source: r.source,
      status: r.status,
    }));

    const { inserted, duplicates } = await insertLedgerRows(supabase, tenantId, records);

    if (inserted === 0 && duplicates > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            `All ${duplicates} rows already exist in the master ledger (duplicate transaction_id + date). ` +
            "Delete existing rows or upload a file with new transactions.",
          duplicates,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { error: uploadLogError } = await supabase.from("uploads").insert({
      tenant_id: tenantId,
      file_name: file.name,
      file_path: `uploads/${file.name}`,
      file_size: file.size,
      uploaded_by: user.email ?? user.id,
      status: "completed",
      upload_type: reportType,
      file_type: "csv",
      processed_at: new Date().toISOString(),
      report_type: reportType,
      report_side: reportSide,
    });
    if (uploadLogError) {
      console.error("uploads log insert:", uploadLogError.message);
    }

    await supabase.from("ingest_runs").insert({
      tenant_id: tenantId,
      source_type: "upload",
      report_type: reportType,
      status: "completed",
      records_inserted: inserted,
      records_skipped: result.skipped + duplicates,
      completed_at: new Date().toISOString(),
      metadata: {
        filename: file.name,
        report_side: reportSide,
        file_size: file.size,
      },
    });

    await logAudit(supabase, {
      tenant_id: tenantId,
      user_id: user.id,
      action: "upload.completed",
      resource_type: "upload",
      resource_id: file.name,
      metadata: {
        records_count: inserted,
        duplicates_skipped: duplicates,
        report_type: reportType,
        report_side: reportSide,
      },
    });

    await notifyTenantWebhook(supabase, tenantId, "ingest.completed", {
      report_type: reportType,
      inserted: records.length,
      source: "manual_upload",
    });

    return new Response(
      JSON.stringify({
        success: true,
        inserted,
        skipped: result.skipped,
        duplicates_skipped: duplicates,
        tenant_id: tenantId,
        report_type: reportType,
        report_side: reportSide,
        message: duplicates > 0
          ? `Inserted ${inserted} new records; ${duplicates} duplicate row(s) skipped (${reportType}/${reportSide})`
          : `Successfully inserted ${inserted} records (${reportType}/${reportSide})`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const message = errorMessage(error);
    console.error("Process Upload Error:", message, error);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
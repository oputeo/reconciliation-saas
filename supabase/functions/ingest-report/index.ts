import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import {
  createServiceClient,
  logAudit,
  requireTenantAccess,
} from "../_shared/auth.ts";
import {
  processCsvIngest,
  processJsonIngest,
} from "../_shared/ingestProcessor.ts";
import type { ReportSide, ReportType } from "../_shared/reportMappers.ts";
import { notifyTenantWebhook } from "../_shared/webhookNotify.ts";

async function verifyIngestKey(
  supabase: ReturnType<typeof createServiceClient>,
  tenantId: string,
  apiKey: string,
): Promise<boolean> {
  const prefix = apiKey.slice(0, 12);
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(apiKey),
  );
  const hashHex = [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");

  const { data } = await supabase
    .from("tenant_ingest_keys")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("key_prefix", prefix)
    .eq("key_hash", hashHex)
    .eq("active", true)
    .maybeSingle();

  if (data?.id) {
    await supabase
      .from("tenant_ingest_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", data.id);
    return true;
  }
  return false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createServiceClient();
    let tenantId = "";
    let userId: string | null = null;

    const ingestKey = req.headers.get("x-ingest-key") ?? "";
    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      tenantId = String(formData.get("tenant_id") || "").trim();
      const access = await requireTenantAccess(req, tenantId, "auditor");
      if (access instanceof Response) return access;
      userId = access.user.id;

      const file = formData.get("file") as File | null;
      const reportType = String(formData.get("report_type") || "generic") as ReportType;
      const reportSide = String(formData.get("report_side") || "") as ReportSide;
      if (!file) throw new Error("file is required");

      const result = processCsvIngest(tenantId, await file.text(), reportType, reportSide || undefined);
      if (result.errors.length) throw new Error(result.errors.join("; "));

      const { error } = await supabase.from("master_ledger").insert(
        result.records.map((r) => ({
          tenant_id: r.tenant_id,
          transaction_id: r.transaction_id,
          product_type: r.product_type,
          amount: r.amount,
          fee: r.fee,
          transaction_date: r.transaction_date,
          reference: r.reference,
          source: r.source,
          status: r.status,
        })),
      );
      if (error) throw error;

      await supabase.from("ingest_runs").insert({
        tenant_id: tenantId,
        source_type: "api",
        report_type: reportType,
        status: "completed",
        records_inserted: result.records.length,
        records_skipped: result.skipped,
        completed_at: new Date().toISOString(),
      });

      await notifyTenantWebhook(supabase, tenantId, "ingest.completed", {
        report_type: reportType,
        inserted: result.records.length,
        source: "api",
      });

      return new Response(
        JSON.stringify({
          success: true,
          inserted: result.records.length,
          skipped: result.skipped,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    tenantId = String(body.tenant_id || "").trim();
    const reportType = String(body.report_type || "generic") as ReportType;
    const reportSide = body.report_side as ReportSide | undefined;

    if (ingestKey) {
      const ok = await verifyIngestKey(supabase, tenantId, ingestKey);
      if (!ok) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid ingest API key" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    } else {
      const access = await requireTenantAccess(req, tenantId, "auditor");
      if (access instanceof Response) return access;
      userId = access.user.id;
    }

    const rows = Array.isArray(body.rows) ? body.rows : [];
    const result = body.csv
      ? processCsvIngest(tenantId, String(body.csv), reportType, reportSide)
      : processJsonIngest(tenantId, rows, reportType, reportSide);

    if (result.errors.length) throw new Error(result.errors.join("; "));

    const { error } = await supabase.from("master_ledger").insert(
      result.records.map((r) => ({
        tenant_id: r.tenant_id,
        transaction_id: r.transaction_id,
        product_type: r.product_type,
        amount: r.amount,
        fee: r.fee,
        transaction_date: r.transaction_date,
        reference: r.reference,
        source: r.source,
        status: r.status,
      })),
    );
    if (error) throw error;

    const runMeta = {
      tenant_id: tenantId,
      source_type: "api",
      report_type: reportType,
      status: "completed",
      records_inserted: result.records.length,
      records_skipped: result.skipped,
      completed_at: new Date().toISOString(),
    };
    await supabase.from("ingest_runs").insert(runMeta);

    if (userId) {
      await logAudit(supabase, {
        tenant_id: tenantId,
        user_id: userId,
        action: "ingest.api_completed",
        resource_type: "ingest",
        resource_id: reportType,
        metadata: { inserted: result.records.length },
      });
    }

    await notifyTenantWebhook(supabase, tenantId, "ingest.completed", {
      report_type: reportType,
      inserted: result.records.length,
      source: "api",
    });

    return new Response(
      JSON.stringify({
        success: true,
        inserted: result.records.length,
        skipped: result.skipped,
        report_type: reportType,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Ingest failed";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
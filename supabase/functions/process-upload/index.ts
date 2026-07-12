import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { logAudit, requireTenantAccess } from "../_shared/auth.ts";
import {
  beginIngestRun,
  completeIngestRun,
  failIngestRun,
  logFailedUpload,
} from "../_shared/ingestRunHelpers.ts";
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
      return "Duplicate transactions detected (same transaction_id + date already in ledger). Delete the prior upload or clear workspace, then re-upload.";
    }
  }
  return "Upload failed";
}

async function insertLedgerRows(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  tenantId: string,
  ingestRunId: string,
  records: Record<string, unknown>[],
): Promise<{ inserted: number; duplicates: number }> {
  const { count: beforeCount } = await supabase
    .from("master_ledger")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  for (let i = 0; i < records.length; i += INSERT_BATCH) {
    const batch = records.slice(i, i + INSERT_BATCH).map((row) => ({
      ...row,
      ingest_run_id: ingestRunId,
    }));
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
  "smartdelta_paystack",
  "pay_direct_igr",
  "pay_direct_psp",
  "pay_direct_platform",
]);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let ingestRunId: string | null = null;
  // deno-lint-ignore no-explicit-any
  let supabase: any = null;
  let tenantId = "";
  let userId = "";
  let userEmail: string | undefined;
  const runMeta = {
    filename: "",
    report_type: "generic",
    report_side: "internal",
    file_size: 0,
  };

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    tenantId = String(formData.get("tenant_id") || "").trim();
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

    const { user } = access;
    supabase = access.supabase;
    userId = user.id;
    userEmail = user.email;

    if (file.size > MAX_FILE_BYTES) {
      const msg = "File exceeds 50MB limit";
      await logFailedUpload(supabase, tenantId, {
        filename: file.name,
        report_type: reportTypeRaw,
        report_side: reportSideRaw,
        file_size: file.size,
      }, msg, userEmail);
      return new Response(
        JSON.stringify({ success: false, error: msg }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const reportType = REPORT_TYPES.has(reportTypeRaw) ? reportTypeRaw : "generic";
    const reportSide = resolveReportSide(reportType, reportSideRaw || undefined);

    runMeta.filename = file.name;
    runMeta.report_type = reportType;
    runMeta.report_side = reportSide;
    runMeta.file_size = file.size;

    ingestRunId = await beginIngestRun(supabase, tenantId, runMeta);

    const result = processCsvIngest(tenantId, await file.text(), reportType, reportSide);
    if (result.errors.length) {
      const msg = result.errors.join("; ");
      await failIngestRun(supabase, ingestRunId, msg);
      await supabase.from("uploads").insert({
        tenant_id: tenantId,
        file_name: file.name,
        file_path: `uploads/${file.name}`,
        file_size: file.size,
        uploaded_by: userEmail ?? userId,
        status: "failed",
        upload_type: reportType,
        file_type: "csv",
        report_type: reportType,
        report_side: reportSide,
        error_message: msg.slice(0, 2000),
        ingest_run_id: ingestRunId,
      });
      return new Response(
        JSON.stringify({ success: false, error: msg, ingest_run_id: ingestRunId }),
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

    const { inserted, duplicates } = await insertLedgerRows(
      supabase,
      tenantId,
      ingestRunId,
      records,
    );

    if (inserted === 0 && duplicates > 0) {
      const msg =
        `All ${duplicates} rows already exist in the master ledger (duplicate transaction_id + date). ` +
        "Delete the prior upload from history or clear workspace, then re-upload.";
      await failIngestRun(supabase, ingestRunId, msg, { inserted: 0, skipped: duplicates });
      await supabase.from("uploads").insert({
        tenant_id: tenantId,
        file_name: file.name,
        file_path: `uploads/${file.name}`,
        file_size: file.size,
        uploaded_by: userEmail ?? userId,
        status: "failed",
        upload_type: reportType,
        file_type: "csv",
        report_type: reportType,
        report_side: reportSide,
        error_message: msg.slice(0, 2000),
        ingest_run_id: ingestRunId,
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: msg,
          duplicates,
          ingest_run_id: ingestRunId,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { error: uploadLogError } = await supabase.from("uploads").insert({
      tenant_id: tenantId,
      file_name: file.name,
      file_path: `uploads/${file.name}`,
      file_size: file.size,
      uploaded_by: userEmail ?? userId,
      status: "completed",
      upload_type: reportType,
      file_type: "csv",
      processed_at: new Date().toISOString(),
      report_type: reportType,
      report_side: reportSide,
      ingest_run_id: ingestRunId,
    });
    if (uploadLogError) {
      console.error("uploads log insert:", uploadLogError.message);
    }

    await completeIngestRun(supabase, ingestRunId, {
      inserted,
      skipped: result.skipped,
      duplicates,
    });

    await logAudit(supabase, {
      tenant_id: tenantId,
      user_id: userId,
      action: "upload.completed",
      resource_type: "upload",
      resource_id: ingestRunId,
      metadata: {
        filename: file.name,
        records_count: inserted,
        duplicates_skipped: duplicates,
        report_type: reportType,
        report_side: reportSide,
      },
    });

    await notifyTenantWebhook(supabase, tenantId, "ingest.completed", {
      report_type: reportType,
      inserted,
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
        ingest_run_id: ingestRunId,
        message: duplicates > 0
          ? `Inserted ${inserted} new records; ${duplicates} duplicate row(s) skipped (${reportType}/${reportSide})`
          : `Successfully inserted ${inserted} records (${reportType}/${reportSide})`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const message = errorMessage(error);
    console.error("Process Upload Error:", message, error);

    if (supabase && tenantId) {
      if (ingestRunId) {
        await failIngestRun(supabase, ingestRunId, message);
        if (runMeta.filename) {
          await supabase.from("uploads").insert({
            tenant_id: tenantId,
            file_name: runMeta.filename,
            file_path: `uploads/${runMeta.filename}`,
            file_size: runMeta.file_size,
            uploaded_by: userEmail ?? userId,
            status: "failed",
            upload_type: runMeta.report_type,
            file_type: "csv",
            report_type: runMeta.report_type,
            report_side: runMeta.report_side,
            error_message: message.slice(0, 2000),
            ingest_run_id: ingestRunId,
          });
        }
      } else if (runMeta.filename) {
        await logFailedUpload(
          supabase,
          tenantId,
          runMeta,
          message,
          userEmail ?? userId,
        );
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: message, ingest_run_id: ingestRunId }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
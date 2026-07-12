import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type IngestRunMeta = {
  filename?: string;
  report_type?: string;
  report_side?: string;
  file_size?: number;
  [key: string]: unknown;
};

export async function beginIngestRun(
  supabase: SupabaseClient,
  tenantId: string,
  meta: IngestRunMeta,
): Promise<string> {
  const { data, error } = await supabase
    .from("ingest_runs")
    .insert({
      tenant_id: tenantId,
      source_type: "upload",
      report_type: meta.report_type ?? "generic",
      status: "running",
      metadata: meta,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error(error?.message ?? "Failed to start ingest run");
  }
  return data.id as string;
}

export async function completeIngestRun(
  supabase: SupabaseClient,
  ingestRunId: string,
  stats: { inserted: number; skipped: number; duplicates?: number },
): Promise<void> {
  const { error } = await supabase
    .from("ingest_runs")
    .update({
      status: "completed",
      records_inserted: stats.inserted,
      records_skipped: stats.skipped + (stats.duplicates ?? 0),
      error_message: null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", ingestRunId);

  if (error) console.error("completeIngestRun:", error.message);
}

export async function failIngestRun(
  supabase: SupabaseClient,
  ingestRunId: string,
  message: string,
  partial?: { inserted?: number; skipped?: number },
): Promise<void> {
  const { error } = await supabase
    .from("ingest_runs")
    .update({
      status: "failed",
      error_message: message.slice(0, 2000),
      records_inserted: partial?.inserted ?? 0,
      records_skipped: partial?.skipped ?? 0,
      completed_at: new Date().toISOString(),
    })
    .eq("id", ingestRunId);

  if (error) console.error("failIngestRun:", error.message);
}

export async function logFailedUpload(
  supabase: SupabaseClient,
  tenantId: string,
  meta: IngestRunMeta,
  message: string,
  uploadedBy?: string,
): Promise<string | null> {
  const ingestRunId = await beginIngestRun(supabase, tenantId, meta).catch(() => null);
  if (ingestRunId) {
    await failIngestRun(supabase, ingestRunId, message);
  }

  await supabase.from("uploads").insert({
    tenant_id: tenantId,
    file_name: meta.filename ?? "unknown.csv",
    file_path: `uploads/${meta.filename ?? "unknown.csv"}`,
    file_size: meta.file_size ?? 0,
    uploaded_by: uploadedBy ?? null,
    status: "failed",
    upload_type: meta.report_type ?? "generic",
    file_type: "csv",
    report_type: meta.report_type ?? "generic",
    report_side: meta.report_side ?? "internal",
    error_message: message.slice(0, 2000),
    ingest_run_id: ingestRunId,
  });

  return ingestRunId;
}
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createServiceClient, logAudit } from "../_shared/auth.ts";
import { notifyTenantWebhook } from "../_shared/webhookNotify.ts";

function nextRunAt(frequency: string, from = new Date()): string {
  const d = new Date(from);
  if (frequency === "hourly") {
    d.setHours(d.getHours() + 1, 0, 0, 0);
  } else if (frequency === "weekly") {
    d.setDate(d.getDate() + 7);
    d.setUTCHours(6, 0, 0, 0);
  } else if (frequency === "biweekly") {
    d.setDate(d.getDate() + 14);
    d.setUTCHours(6, 0, 0, 0);
  } else {
    d.setUTCDate(d.getUTCDate() + 1);
    d.setUTCHours(6, 0, 0, 0);
  }
  return d.toISOString();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createServiceClient();
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const tenantFilter = body.tenant_id ? String(body.tenant_id) : null;

    let query = supabase
      .from("ingest_schedules")
      .select("*")
      .eq("enabled", true)
      .lte("next_run_at", new Date().toISOString());

    if (tenantFilter) query = query.eq("tenant_id", tenantFilter);

    const { data: schedules, error } = await query;
    if (error) throw error;

    const results: Record<string, unknown>[] = [];

    for (const schedule of schedules ?? []) {
      const runStart = new Date().toISOString();
      let status = "completed";
      let errorMessage: string | null = null;
      let recordsInserted = 0;
      const metadata: Record<string, unknown> = { schedule_name: schedule.name };

      try {
        if (schedule.source_type === "sftp") {
          status = "skipped";
          errorMessage = "SFTP pull requires connector config (Phase 3 scaffold)";
          metadata.note = "Configure SFTP host/path in schedule.config";
        } else if (schedule.source_type === "reconcile" || schedule.auto_reconcile) {
          const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
          const { data: reconData, error: reconError } = await supabase.functions.invoke(
            "run-reconciliation",
            {
              body: { tenant_id: schedule.tenant_id, period: "day" },
              headers: serviceKey ? { Authorization: `Bearer ${serviceKey}` } : undefined,
            },
          );
          if (reconError) throw reconError;
          metadata.reconciliation = reconData;
          recordsInserted = Number(reconData?.matched ?? 0);
        }

        await notifyTenantWebhook(supabase, schedule.tenant_id, "schedule.completed", {
          schedule_id: schedule.id,
          schedule_name: schedule.name,
          status,
          ...metadata,
        });
      } catch (err) {
        status = "failed";
        errorMessage = err instanceof Error ? err.message : "Schedule run failed";
      }

      await supabase.from("ingest_runs").insert({
        tenant_id: schedule.tenant_id,
        schedule_id: schedule.id,
        source_type: schedule.source_type,
        report_type: schedule.report_type,
        status,
        records_inserted: recordsInserted,
        error_message: errorMessage,
        metadata,
        started_at: runStart,
        completed_at: new Date().toISOString(),
      });

      await supabase
        .from("ingest_schedules")
        .update({
          last_run_at: new Date().toISOString(),
          next_run_at: nextRunAt(schedule.frequency),
        })
        .eq("id", schedule.id);

      results.push({
        schedule_id: schedule.id,
        tenant_id: schedule.tenant_id,
        name: schedule.name,
        status,
        error: errorMessage,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Scheduler failed";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { logAudit, requireTenantAccess } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const tenantId = String(body.tenant_id || "").trim();
    const ingestRunId = String(body.ingest_run_id || "").trim();

    if (!ingestRunId) {
      return new Response(
        JSON.stringify({ success: false, error: "ingest_run_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const access = await requireTenantAccess(req, tenantId, "auditor");
    if (access instanceof Response) return access;

    const { user, supabase } = access;

    const { data: run, error: runError } = await supabase
      .from("ingest_runs")
      .select("id, tenant_id, status, metadata")
      .eq("id", ingestRunId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (runError || !run) {
      return new Response(
        JSON.stringify({ success: false, error: "Upload run not found for this workspace" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: ledgerRows, error: ledgerFetchError } = await supabase
      .from("master_ledger")
      .select("id, transaction_id")
      .eq("tenant_id", tenantId)
      .eq("ingest_run_id", ingestRunId);

    if (ledgerFetchError) throw ledgerFetchError;

    const ledgerIds = (ledgerRows ?? []).map((r) => r.id);
    const transactionIds = (ledgerRows ?? []).map((r) => r.transaction_id).filter(Boolean);
    const anomalyIds = transactionIds.map((tx) => `AN-${tx}`);

    let anomaliesRemoved = 0;
    if (ledgerIds.length > 0) {
      const { count: byLedger } = await supabase
        .from("anomalies")
        .delete({ count: "exact" })
        .eq("tenant_id", tenantId)
        .in("ledger_id", ledgerIds);
      anomaliesRemoved += byLedger ?? 0;
    }
    if (anomalyIds.length > 0) {
      const { count: byAnomalyId } = await supabase
        .from("anomalies")
        .delete({ count: "exact" })
        .eq("tenant_id", tenantId)
        .in("anomaly_id", anomalyIds);
      anomaliesRemoved += byAnomalyId ?? 0;
    }

    const { count: ledgerRemoved, error: ledgerDeleteError } = await supabase
      .from("master_ledger")
      .delete({ count: "exact" })
      .eq("tenant_id", tenantId)
      .eq("ingest_run_id", ingestRunId);

    if (ledgerDeleteError) throw ledgerDeleteError;

    await supabase
      .from("uploads")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("ingest_run_id", ingestRunId);

    await supabase
      .from("ingest_runs")
      .update({
        status: "rolled_back",
        error_message: "Rolled back by user",
        completed_at: new Date().toISOString(),
      })
      .eq("id", ingestRunId);

    await logAudit(supabase, {
      tenant_id: tenantId,
      user_id: user.id,
      action: "upload.rolled_back",
      resource_type: "ingest_run",
      resource_id: ingestRunId,
      metadata: {
        ledger_removed: ledgerRemoved ?? 0,
        anomalies_removed: anomaliesRemoved,
        prior_status: run.status,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message:
          ledgerRemoved && ledgerRemoved > 0
            ? `Removed ${ledgerRemoved} ledger row(s). Re-upload the file when ready.`
            : "Upload marked rolled back (no ledger rows were linked to this run). You can re-upload.",
        ledger_removed: ledgerRemoved ?? 0,
        anomalies_removed: anomaliesRemoved,
        ingest_run_id: ingestRunId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Delete upload failed";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
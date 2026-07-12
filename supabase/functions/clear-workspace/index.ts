import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { logAudit, requireTenantAccess } from "../_shared/auth.ts";

const CLEAR_TABLES = [
  "anomalies",
  "revenue_recovery_audit",
  "reconciliation_rule_changes",
  "master_ledger",
  "uploads",
  "ingest_runs",
  "back_audit_jobs",
  "reconciliation_runs",
] as const;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const tenantId = String(body.tenant_id || "").trim();
    const confirm = String(body.confirm || "").trim();

    if (confirm !== "CLEAR") {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Confirmation required. Send { "confirm": "CLEAR" } to wipe demo data for this workspace.',
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const access = await requireTenantAccess(req, tenantId, "admin");
    if (access instanceof Response) return access;

    const { user, supabase } = access;
    const cleared: Record<string, number> = {};

    for (const table of CLEAR_TABLES) {
      const { count } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId);

      const { error } = await supabase.from(table).delete().eq("tenant_id", tenantId);
      if (error) {
        console.warn(`clear-workspace skip ${table}:`, error.message);
        cleared[table] = 0;
        continue;
      }
      cleared[table] = count ?? 0;
    }

    await logAudit(supabase, {
      tenant_id: tenantId,
      user_id: user.id,
      action: "workspace.cleared",
      resource_type: "tenant",
      resource_id: tenantId,
      metadata: cleared,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Workspace demo data cleared. Re-upload platform then settlement chunks.",
        cleared,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Clear workspace failed";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { logAudit, requireServiceOrTenantAccess } from "../_shared/auth.ts";
import {
  runReconciliation,
  type LedgerRecord,
} from "../_shared/reconciliationEngine.ts";
import {
  DEFAULT_RECONCILIATION_RULES,
  mergeTenantReconciliationSettings,
} from "../_shared/reconciliationRules.ts";
import { runFeeAssurancePass } from "../_shared/feeAssurance.ts";
import { notifyTenantWebhook } from "../_shared/webhookNotify.ts";
import { fetchTenantAuditPeriodConfig } from "../_shared/auditPeriods.ts";
import { inferChannelLabel } from "../_shared/channelInference.ts";
import { currentBiweekPeriod, parseBiweekPeriod } from "../_shared/biweekPeriod.ts";

function periodBounds(period: string, year: number) {
  const now = new Date();
  const currentYear = year || now.getFullYear();

  switch (period) {
    case "day": {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    case "week": {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    case "month": {
      const start = new Date(currentYear, now.getMonth(), 1);
      const end = new Date(currentYear, now.getMonth() + 1, 1);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    case "quarter": {
      const quarter = Math.floor(now.getMonth() / 3);
      const start = new Date(currentYear, quarter * 3, 1);
      const end = new Date(currentYear, quarter * 3 + 3, 1);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    case "biweekly": {
      const bounds = currentBiweekPeriod(now);
      return { startDate: bounds.startDate, endDate: bounds.endDate };
    }
    default:
      return {
        startDate: `${currentYear}-01-01T00:00:00.000Z`,
        endDate: `${currentYear + 1}-01-01T00:00:00.000Z`,
      };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const tenantId = String(body.tenant_id || "").trim();
    const period = String(body.period || "year");

    const access = await requireServiceOrTenantAccess(req, tenantId, "auditor");
    if (access instanceof Response) return access;

    const { user, supabase } = access;
    const auditConfig = await fetchTenantAuditPeriodConfig(supabase, tenantId);
    const year = Number(body.year) || auditConfig.currentAuditYear;

    let startDate: string;
    let endDate: string;
    if (body.start_date && body.end_date) {
      startDate = new Date(String(body.start_date)).toISOString();
      endDate = new Date(String(body.end_date)).toISOString();
    } else if (body.biweek_period) {
      const bw = parseBiweekPeriod(String(body.biweek_period));
      if (!bw) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid biweek_period (use BW01-2026 format)" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      startDate = bw.startDate;
      endDate = bw.endDate;
    } else {
      const bounds = periodBounds(period, year);
      startDate = bounds.startDate;
      endDate = bounds.endDate;
    }

    const { data: activeRun } = await supabase
      .from("reconciliation_runs")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("status", "running")
      .gte("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .maybeSingle();

    if (activeRun) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "A reconciliation run is already in progress for this workspace",
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: runRow, error: runError } = await supabase
      .from("reconciliation_runs")
      .insert({
        tenant_id: tenantId,
        run_by: user?.id ?? null,
        period,
        start_date: startDate,
        end_date: endDate,
        status: "running",
      })
      .select("id")
      .single();

    if (runError) throw runError;

    const { data: pendingRows, error: pendingError } = await supabase
      .from("master_ledger")
      .select("id, transaction_id, reference, amount, fee, product_type, source, transaction_date, status")
      .eq("tenant_id", tenantId)
      .eq("status", "pending")
      .gte("transaction_date", startDate)
      .lt("transaction_date", endDate);

    if (pendingError) throw pendingError;

    const { data: poolRows, error: poolError } = await supabase
      .from("master_ledger")
      .select("id, transaction_id, reference, amount, fee, product_type, source, transaction_date, status")
      .eq("tenant_id", tenantId)
      .neq("status", "pending")
      .gte("transaction_date", startDate)
      .lt("transaction_date", endDate);

    if (poolError) throw poolError;

    const { data: ruleRows } = await supabase
      .from("reconciliation_rule_catalog")
      .select("rule_code, category, name, description, config, priority, active")
      .eq("tenant_id", tenantId)
      .eq("active", true)
      .order("priority", { ascending: false });

    if (!ruleRows?.length) {
      await supabase.rpc("seed_reconciliation_rule_catalog", { p_tenant_id: tenantId });
    }

    const { data: loadedRules } = await supabase
      .from("reconciliation_rule_catalog")
      .select("rule_code, category, name, description, config, priority, active")
      .eq("tenant_id", tenantId)
      .order("priority", { ascending: false });

    const { data: tenantRow } = await supabase
      .from("tenants")
      .select("settings")
      .eq("id", tenantId)
      .maybeSingle();

    const pending = (pendingRows ?? []) as LedgerRecord[];
    const pool = (poolRows ?? []) as LedgerRecord[];
    const outcome = runReconciliation(pending, pool, {
      rules: (loadedRules?.length ? loadedRules : DEFAULT_RECONCILIATION_RULES) as typeof DEFAULT_RECONCILIATION_RULES,
      tenantSettings: tenantRow?.settings ?? null,
    });
    const reconSettings = mergeTenantReconciliationSettings(tenantRow?.settings);

    const flaggedMatchThreshold = 70;

    for (const update of outcome.updates) {
      const auditFlag = update.status === "unmatched" ||
        (update.status === "matched" && update.match_score < flaggedMatchThreshold);
      const { error } = await supabase
        .from("master_ledger")
        .update({
          status: update.status,
          match_score: update.match_score,
          audit_score: update.match_score,
          audit_flag: auditFlag,
          matched_rule_code: update.matched_rule_code ?? null,
          enrichment_status: update.status === "matched" ? "enriched" : "needs_review",
          updated_at: new Date().toISOString(),
        })
        .eq("id", update.id)
        .eq("tenant_id", tenantId);

      if (error) console.error("Update error:", error);
    }

    // Phase 1: post-match fee assurance pass
    const { data: feeBenchmarks } = await supabase
      .from("master_ledger")
      .select("id, reference, amount, fee, product_type, status")
      .eq("tenant_id", tenantId)
      .eq("source", "fee_assurance_report")
      .eq("status", "assurance")
      .gte("transaction_date", startDate)
      .lt("transaction_date", endDate);

    const { data: matchedLedger } = await supabase
      .from("master_ledger")
      .select("id, reference, amount, fee, product_type, status")
      .eq("tenant_id", tenantId)
      .eq("status", "matched")
      .gte("transaction_date", startDate)
      .lt("transaction_date", endDate);

    const feeRule = (loadedRules ?? DEFAULT_RECONCILIATION_RULES).find(
      (r) => r.rule_code === "EXC_FEE_LEAKAGE",
    );
    const maxFeePct = typeof feeRule?.config?.max_fee_pct === "number"
      ? feeRule.config.max_fee_pct as number
      : 5;

    const feeAnomalies = runFeeAssurancePass(
      (feeBenchmarks ?? []).map((r) => ({
        id: r.id,
        reference: r.reference,
        product_type: r.product_type,
        amount: Number(r.amount),
        fee: Number(r.fee ?? 0),
      })),
      (matchedLedger ?? []).map((r) => ({
        id: r.id,
        reference: r.reference,
        product_type: r.product_type,
        amount: Number(r.amount),
        fee: Number(r.fee ?? 0),
        status: r.status,
      })),
      maxFeePct,
      reconSettings.fuzzy_tolerance_ngn,
    );

    const allAnomalies = [...outcome.anomalies, ...feeAnomalies];

    if (allAnomalies.length > 0) {
      const ruleTag = (code: string) => `rule:${code}`;
      const anomalyRows = allAnomalies.map((a) => ({
        tenant_id: tenantId,
        anomaly_id: `AN-${a.transaction_id}`,
        date: new Date().toISOString().split("T")[0],
        bank: inferChannelLabel(a.transaction_id, a.reference) ?? null,
        product_type: "product_type" in a ? (a as { product_type?: string }).product_type ?? null : null,
        type: a.type,
        variance: a.amount,
        severity: a.severity,
        status: "Open",
        description: a.description,
        root_cause: a.root_cause,
        suggested_action: ruleTag(a.rule_code),
        notes: ruleTag(a.rule_code),
        ledger_id: "ledger_id" in a ? (a as { ledger_id?: string }).ledger_id ?? null : null,
        created_at: new Date().toISOString(),
      }));

      const { error: anomalyError } = await supabase
        .from("anomalies")
        .upsert(anomalyRows, { onConflict: "tenant_id,anomaly_id", ignoreDuplicates: false });

      if (anomalyError) {
        console.error("Anomaly insert error:", anomalyError);
        throw new Error(`Failed to persist anomalies: ${anomalyError.message}`);
      }
    }

    await supabase
      .from("reconciliation_runs")
      .update({
        status: "completed",
        processed: pending.length,
        matched: outcome.matched,
        unmatched: outcome.unmatched,
        match_rate: outcome.matchRate,
        completed_at: new Date().toISOString(),
      })
      .eq("id", runRow.id);

    if (user) {
      await logAudit(supabase, {
        tenant_id: tenantId,
        user_id: user.id,
        action: "reconciliation.completed",
        resource_type: "reconciliation_run",
        resource_id: runRow.id,
        metadata: {
          period,
          processed: pending.length,
          matched: outcome.matched,
          unmatched: outcome.unmatched,
          match_rate: outcome.matchRate,
          fuzzy_tolerance_ngn: reconSettings.fuzzy_tolerance_ngn,
          rules_applied: (loadedRules ?? DEFAULT_RECONCILIATION_RULES).filter((r) => r.active).length,
          fee_assurance_flags: feeAnomalies.length,
        },
      });
    }

    await notifyTenantWebhook(supabase, tenantId, "reconciliation.completed", {
      run_id: runRow.id,
      processed: pending.length,
      matched: outcome.matched,
      unmatched: outcome.unmatched,
      match_rate: outcome.matchRate,
      fee_assurance_flags: feeAnomalies.length,
    });

    return new Response(
      JSON.stringify({
        success: true,
        run_id: runRow.id,
        period,
        processed: pending.length,
        matched: outcome.matched,
        unmatched: outcome.unmatched,
        match_rate: outcome.matchRate,
        confidence_score: outcome.confidenceScore,
        total_variance: outcome.totalVariance,
        anomalies_created: allAnomalies.length,
        fee_assurance_flags: feeAnomalies.length,
        start_date: startDate,
        end_date: endDate,
        message: `Reconciled ${outcome.matched} of ${pending.length} pending records`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Reconciliation failed";
    console.error(error);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
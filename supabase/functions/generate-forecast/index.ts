import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { requireTenantAccess } from "../_shared/auth.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const {
      tenant_id,
      months = 3,
    } = await req.json();

    const tenantId = String(tenant_id || "").trim();
    const access = await requireTenantAccess(req, tenantId, "viewer");
    if (access instanceof Response) return access;

    const { supabase } = access;
    const horizon = Math.min(Math.max(Number(months) || 3, 1), 12);

    const { data: ledgerRows } = await supabase
      .from("master_ledger")
      .select("amount, transaction_date, status")
      .eq("tenant_id", tenantId)
      .order("transaction_date", { ascending: true });

    const monthlyTotals = new Map<string, number>();
    for (const row of ledgerRows ?? []) {
      const month = String(row.transaction_date).slice(0, 7);
      monthlyTotals.set(month, (monthlyTotals.get(month) ?? 0) + Number(row.amount || 0));
    }

    const history = [...monthlyTotals.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => ({ month, revenue }));

    const lastRevenue = history[history.length - 1]?.revenue || 0;
    const growthRates: number[] = [];
    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1].revenue;
      const curr = history[i].revenue;
      if (prev > 0) growthRates.push((curr - prev) / prev);
    }
    const avgGrowth = growthRates.length
      ? growthRates.reduce((a, b) => a + b, 0) / growthRates.length
      : 0.02;

    const forecastSeries = [];
    let currentRevenue = lastRevenue || 1;

    for (let i = 1; i <= horizon; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      const monthName = date.toLocaleString("default", { month: "short", year: "2-digit" });
      currentRevenue = Math.round(currentRevenue * (1 + avgGrowth));
      forecastSeries.push({
        month: monthName,
        historical: i === 1 ? lastRevenue : null,
        projected: currentRevenue,
        lower_bound: Math.round(currentRevenue * 0.92),
        upper_bound: Math.round(currentRevenue * 1.08),
      });
    }

    const projectedRevenue = forecastSeries.reduce((sum, item) => sum + item.projected, 0);
    const { count: unmatchedCount } = await supabase
      .from("master_ledger")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "unmatched");

    const recoveryRate = ledgerRows?.length
      ? Math.max(0.5, 1 - (unmatchedCount ?? 0) / ledgerRows.length)
      : 0.76;

    const response = {
      success: true,
      months: horizon,
      projected_revenue: Math.round(projectedRevenue),
      expected_recovery: Math.round(projectedRevenue * recoveryRate),
      growth_rate: (avgGrowth * 100 * horizon).toFixed(1),
      confidence_interval: history.length >= 3 ? 84 : 62,
      forecast_series: forecastSeries,
      generated_at: new Date().toISOString(),
      note: "Forecast derived from master_ledger monthly totals",
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Forecast failed";
    console.error("Forecast Error:", message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
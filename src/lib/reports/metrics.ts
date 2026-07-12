import type { SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

async function getSupabase() {
  if (!supabaseClient) {
    const { supabase } = await import('@/lib/supabase');
    supabaseClient = supabase;
  }
  return supabaseClient;
}

export type ReportMetrics = {
  totalRecords: number;
  matchedRecords: number;
  unmatchedRecords: number;
  pendingRecords: number;
  accuracy: number;
  totalLeakage: number;
  riskScore: number;
  openAnomalies: number;
  lastUpdated: string;
};

export type TrendPoint = {
  month: string;
  accuracy: number;
  leakage: number;
};

export type ProductBreakdown = {
  name: string;
  volume: number;
  amount: number;
};

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function monthLabel(isoDate: string): string {
  const month = Number(isoDate.slice(5, 7)) - 1;
  return MONTH_LABELS[month] ?? isoDate.slice(0, 7);
}

export async function fetchReportMetrics(tenantId: string): Promise<ReportMetrics> {
  const supabase = await getSupabase();
  const [totalRes, matchedRes, unmatchedRes, pendingRes, anomalyRes, unmatchedAmountRes] = await Promise.all([
    supabase.from('master_ledger').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('master_ledger').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'matched'),
    supabase.from('master_ledger').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'unmatched'),
    supabase.from('master_ledger').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'pending'),
    supabase.from('anomalies').select('variance', { count: 'exact' }).eq('tenant_id', tenantId).eq('status', 'Open'),
    supabase.from('master_ledger').select('amount').eq('tenant_id', tenantId).eq('status', 'unmatched'),
  ]);

  const totalRecords = totalRes.count ?? 0;
  const matchedRecords = matchedRes.count ?? 0;
  const unmatchedRecords = unmatchedRes.count ?? 0;
  const pendingRecords = pendingRes.count ?? 0;
  const openAnomalies = anomalyRes.count ?? 0;

  const resolvedBase = matchedRecords + unmatchedRecords;
  const accuracy = resolvedBase > 0
    ? Math.round((matchedRecords / resolvedBase) * 1000) / 10
    : 0;

  const anomalyLeakage = (anomalyRes.data ?? []).reduce(
    (sum, row) => sum + Math.abs(Number(row.variance ?? 0)),
    0,
  );
  const unmatchedLeakage = (unmatchedAmountRes.data ?? []).reduce(
    (sum, row) => sum + Math.abs(Number(row.amount ?? 0)),
    0,
  );
  const totalLeakage = anomalyLeakage > 0 ? anomalyLeakage : unmatchedLeakage;

  const riskScore = Math.min(
    99,
    Math.max(
      10,
      Math.round((unmatchedRecords / Math.max(totalRecords, 1)) * 100 + openAnomalies * 2),
    ),
  );

  return {
    totalRecords,
    matchedRecords,
    unmatchedRecords,
    pendingRecords,
    accuracy,
    totalLeakage,
    riskScore,
    openAnomalies,
    lastUpdated: new Date().toLocaleTimeString(),
  };
}

export async function fetchTrendData(tenantId: string): Promise<TrendPoint[]> {
  const supabase = await getSupabase();
  const { data } = await supabase
    .from('master_ledger')
    .select('transaction_date, status, amount')
    .eq('tenant_id', tenantId);

  const buckets = new Map<string, { matched: number; unmatched: number; leakage: number }>();

  for (const row of data ?? []) {
    const key = String(row.transaction_date).slice(0, 7);
    const bucket = buckets.get(key) ?? { matched: 0, unmatched: 0, leakage: 0 };
    if (row.status === 'matched') bucket.matched++;
    if (row.status === 'unmatched') {
      bucket.unmatched++;
      bucket.leakage += Math.abs(Number(row.amount ?? 0));
    }
    buckets.set(key, bucket);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([monthKey, bucket]) => {
      const resolved = bucket.matched + bucket.unmatched;
      return {
        month: monthLabel(`${monthKey}-01`),
        accuracy: resolved > 0 ? Math.round((bucket.matched / resolved) * 1000) / 10 : 0,
        leakage: bucket.leakage,
      };
    });
}

export async function fetchProductBreakdown(tenantId: string): Promise<ProductBreakdown[]> {
  const supabase = await getSupabase();
  const { data } = await supabase
    .from('master_ledger')
    .select('product_type, amount')
    .eq('tenant_id', tenantId);

  const grouped = new Map<string, { volume: number; amount: number }>();
  for (const row of data ?? []) {
    const name = row.product_type || 'Unknown';
    const current = grouped.get(name) ?? { volume: 0, amount: 0 };
    current.volume++;
    current.amount += Number(row.amount ?? 0);
    grouped.set(name, current);
  }

  return [...grouped.entries()]
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);
}

export function exportMetricsCsv(metrics: ReportMetrics, trend: TrendPoint[]): string {
  const lines = [
    'metric,value',
    `total_records,${metrics.totalRecords}`,
    `accuracy,${metrics.accuracy}`,
    `total_leakage,${metrics.totalLeakage}`,
    `risk_score,${metrics.riskScore}`,
    `open_anomalies,${metrics.openAnomalies}`,
    '',
    'month,accuracy,leakage',
    ...trend.map((t) => `${t.month},${t.accuracy},${t.leakage}`),
  ];
  return lines.join('\n');
}
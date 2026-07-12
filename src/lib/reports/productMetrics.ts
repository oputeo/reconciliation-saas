import { supabase } from '@/lib/supabase';

export type ProductReconMetrics = {
  product_type: string;
  label: string;
  total: number;
  matched: number;
  unmatched: number;
  pending: number;
  matchRate: number;
  leakage: number;
  avgUnmatchedAgeDays: number;
};

const PRODUCT_LABELS: Record<string, string> = {
  pos: 'POS',
  moniepoint_pos: 'Moniepoint POS',
  ussd: 'USSD',
  moniepoint_ussd: 'Moniepoint USSD',
  bank_transfer: 'Bank Transfer',
  moniepoint_bank_transfer: 'Moniepoint Transfer',
  wallet: 'Wallet',
  moniepoint_wallet: 'Moniepoint Wallet',
  card: 'Card',
  agent_banking: 'Agent Banking',
  moniepoint_agent_banking: 'Moniepoint Agent',
  qr_payment: 'QR Payment',
  bulk_payout: 'Bulk Payout',
  chargeback: 'Chargeback',
  gateway: 'Gateway',
  moniepoint_gateway: 'Moniepoint Gateway',
};

function productLabel(key: string): string {
  return PRODUCT_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function daysSince(isoDate: string): number {
  const then = new Date(isoDate).getTime();
  if (Number.isNaN(then)) return 0;
  return Math.max(0, Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24)));
}

export async function fetchProductReconMetrics(tenantId: string): Promise<ProductReconMetrics[]> {
  const { data, error } = await supabase
    .from('master_ledger')
    .select('product_type, status, amount, transaction_date')
    .eq('tenant_id', tenantId);

  if (error) throw new Error(error.message);

  const grouped = new Map<
    string,
    {
      total: number;
      matched: number;
      unmatched: number;
      pending: number;
      leakage: number;
      ageSum: number;
      ageCount: number;
    }
  >();

  for (const row of data ?? []) {
    const key = row.product_type || 'unknown';
    const bucket = grouped.get(key) ?? {
      total: 0,
      matched: 0,
      unmatched: 0,
      pending: 0,
      leakage: 0,
      ageSum: 0,
      ageCount: 0,
    };

    bucket.total++;
    const status = String(row.status ?? '');
    if (status === 'matched') bucket.matched++;
    else if (status === 'unmatched') {
      bucket.unmatched++;
      bucket.leakage += Math.abs(Number(row.amount ?? 0));
      bucket.ageSum += daysSince(String(row.transaction_date));
      bucket.ageCount++;
    } else if (status === 'pending') {
      bucket.pending++;
      bucket.ageSum += daysSince(String(row.transaction_date));
      bucket.ageCount++;
    }

    grouped.set(key, bucket);
  }

  return [...grouped.entries()]
    .map(([product_type, stats]) => {
      const resolved = stats.matched + stats.unmatched;
      return {
        product_type,
        label: productLabel(product_type),
        total: stats.total,
        matched: stats.matched,
        unmatched: stats.unmatched,
        pending: stats.pending,
        matchRate: resolved > 0 ? Math.round((stats.matched / resolved) * 1000) / 10 : 0,
        leakage: stats.leakage,
        avgUnmatchedAgeDays: stats.ageCount > 0
          ? Math.round(stats.ageSum / stats.ageCount)
          : 0,
      };
    })
    .sort((a, b) => b.total - a.total);
}

export function exportProductMetricsCsv(rows: ProductReconMetrics[]): string {
  const header =
    'product_type,label,total,matched,unmatched,pending,match_rate_pct,leakage_ngn,avg_unmatched_age_days';
  const lines = rows.map(
    (r) =>
      `${r.product_type},${r.label},${r.total},${r.matched},${r.unmatched},${r.pending},${r.matchRate},${r.leakage},${r.avgUnmatchedAgeDays}`,
  );
  return [header, ...lines].join('\n');
}
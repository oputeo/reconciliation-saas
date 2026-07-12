export type LedgerAuditRow = {
  product_type?: string | null;
  amount?: number | string | null;
  status?: string | null;
  match_score?: number | string | null;
  audit_flag?: boolean | null;
  audit_score?: number | string | null;
};

export const FLAGGED_MATCH_SCORE_THRESHOLD = 70;

/** A row is flagged when reconciliation marked it unmatched or audit_flag is set. */
export function isFlaggedLedgerRow(row: LedgerAuditRow): boolean {
  if (row.audit_flag === true) return true;
  if (row.status === 'unmatched') return true;
  const score = resolveAuditScore(row);
  if (row.status === 'matched' && score != null && score < FLAGGED_MATCH_SCORE_THRESHOLD) {
    return true;
  }
  return false;
}

/** Prefer persisted audit_score; fall back to reconciliation match_score. */
export function resolveAuditScore(row: LedgerAuditRow): number | null {
  const audit = Number(row.audit_score);
  if (Number.isFinite(audit) && audit > 0) return audit;
  const match = Number(row.match_score);
  if (Number.isFinite(match) && (row.status === 'matched' || row.status === 'unmatched')) {
    return match;
  }
  return null;
}

export function riskLabelFromAvgScore(avg: number, reconciledCount: number): 'High' | 'Medium' | 'Low' | 'Pending' {
  if (reconciledCount === 0) return 'Pending';
  if (avg < 50) return 'High';
  if (avg < 70) return 'Medium';
  return 'Low';
}

export type ProductAuditSummary = {
  product_type: string;
  total_txns: number;
  total_value: number;
  flagged: number;
  flagged_percent: number;
  avg_audit_score: number;
  reconciled_txns: number;
  risk: 'High' | 'Medium' | 'Low' | 'Pending';
};

export function aggregateProductAudit(rows: LedgerAuditRow[]): ProductAuditSummary[] {
  const grouped = rows.reduce<Record<string, {
    product_type: string;
    total_txns: number;
    total_value: number;
    flagged: number;
    scores: number[];
    reconciled_txns: number;
  }>>((acc, row) => {
    const prod = (row.product_type || 'unknown').toLowerCase();
    if (!acc[prod]) {
      acc[prod] = {
        product_type: prod,
        total_txns: 0,
        total_value: 0,
        flagged: 0,
        scores: [],
        reconciled_txns: 0,
      };
    }
    acc[prod].total_txns += 1;
    acc[prod].total_value += Number(row.amount) || 0;
    if (isFlaggedLedgerRow(row)) acc[prod].flagged += 1;
    const score = resolveAuditScore(row);
    if (score != null) {
      acc[prod].scores.push(score);
      acc[prod].reconciled_txns += 1;
    }
    return acc;
  }, {});

  return Object.values(grouped)
    .map((p) => {
      const avg = p.scores.length
        ? p.scores.reduce((a, b) => a + b, 0) / p.scores.length
        : 0;
      return {
        product_type: p.product_type,
        total_txns: p.total_txns,
        total_value: p.total_value,
        flagged: p.flagged,
        flagged_percent: p.total_txns ? (p.flagged / p.total_txns) * 100 : 0,
        avg_audit_score: avg,
        reconciled_txns: p.reconciled_txns,
        risk: riskLabelFromAvgScore(avg, p.reconciled_txns),
      };
    })
    .sort((a, b) => b.flagged_percent - a.flagged_percent);
}
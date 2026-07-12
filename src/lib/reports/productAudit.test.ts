import { describe, expect, it } from 'vitest';
import { aggregateProductAudit, isFlaggedLedgerRow, resolveAuditScore } from './productAudit';

describe('productAudit', () => {
  it('flags unmatched rows using match_score', () => {
    expect(isFlaggedLedgerRow({ status: 'unmatched', match_score: 40 })).toBe(true);
    expect(isFlaggedLedgerRow({ status: 'pending', match_score: 40 })).toBe(false);
  });

  it('resolves audit score from match_score after reconciliation', () => {
    expect(resolveAuditScore({ status: 'matched', match_score: 79, audit_score: 0 })).toBe(79);
  });

  it('aggregates flagged counts per product', () => {
    const result = aggregateProductAudit([
      { product_type: 'pos', amount: 1000, status: 'matched', match_score: 85 },
      { product_type: 'pos', amount: 2000, status: 'unmatched', match_score: 40 },
      { product_type: 'wallet', amount: 500, status: 'pending', match_score: 0 },
    ]);
    const pos = result.find((p) => p.product_type === 'pos');
    expect(pos?.flagged).toBe(1);
    expect(pos?.avg_audit_score).toBeCloseTo(62.5);
    expect(pos?.flagged_percent).toBeCloseTo(50);
  });
});
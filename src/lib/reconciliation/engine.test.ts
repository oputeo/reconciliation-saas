import { describe, expect, it } from 'vitest';
import { DEFAULT_RECONCILIATION_RULES } from './rulesCatalog';

type LedgerRecord = {
  id: string;
  transaction_id: string;
  reference: string | null;
  amount: number;
  fee?: number;
  product_type?: string;
  source?: string;
  transaction_date: string;
  status: string;
};

// Mirror of edge engine behaviour for unit tests (keep aligned with _shared/reconciliationEngine.ts)
function runSimpleMatch(pending: LedgerRecord[], pool: LedgerRecord[]) {
  let matched = 0;
  for (const p of pending) {
    const hit = pool.find(
      (c) =>
        c.reference === p.reference &&
        Math.abs(c.amount - p.amount) <= 50,
    );
    if (hit) matched++;
  }
  return { matched, total: pending.length };
}

describe('reconciliation rules catalog', () => {
  it('seeds all 21 default rules', () => {
    expect(DEFAULT_RECONCILIATION_RULES).toHaveLength(21);
    const codes = DEFAULT_RECONCILIATION_RULES.map((r) => r.rule_code);
    expect(codes).toContain('MATCH_AMOUNT_REFERENCE');
    expect(codes).toContain('CH_CARD_ACQUIRER');
    expect(codes).toContain('CH_PAYOUT_SETTLEMENT');
    expect(codes).toContain('CH_QR_PAYMENT');
    expect(codes).toContain('EXC_HIGH_VALUE');
    expect(codes).toContain('ADV_TX_RISK_SCORE');
  });
});

describe('amount + reference tolerance', () => {
  it('matches within ₦50 tolerance', () => {
    const pending: LedgerRecord[] = [{
      id: '1', transaction_id: 'TX-1', reference: 'REF-A', amount: 1000,
      transaction_date: '2026-06-01', status: 'pending',
    }];
    const pool: LedgerRecord[] = [{
      id: '2', transaction_id: 'TX-2', reference: 'REF-A', amount: 1040,
      transaction_date: '2026-06-01', status: 'settled',
    }];
    const result = runSimpleMatch(pending, pool);
    expect(result.matched).toBe(1);
  });
});
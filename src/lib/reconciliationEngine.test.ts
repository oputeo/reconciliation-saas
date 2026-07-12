import { describe, expect, it } from 'vitest';
import { ReconciliationEngine, type Transaction } from './reconciliationEngine';

describe('ReconciliationEngine.run', () => {
  it('matches exact reference and amount pairs', async () => {
    const uploaded: Transaction[] = [
      { reference: 'REF-1', amount: 1000, date: '2026-01-01', type: 'credit' },
    ];
    const ledger: Transaction[] = [
      { reference: 'REF-1', amount: 1000, date: '2026-01-01', type: 'credit' },
    ];

    const result = await ReconciliationEngine.run(uploaded, ledger);
    expect(result.matched).toBe(1);
    expect(result.unmatched).toBe(0);
    expect(result.matchRate).toBe(100);
  });

  it('records anomalies for unmatched transactions', async () => {
    const uploaded: Transaction[] = [
      { reference: 'REF-404', amount: 250000, date: '2026-01-01', type: 'credit' },
    ];

    const result = await ReconciliationEngine.run(uploaded, []);
    expect(result.unmatched).toBe(1);
    expect(result.anomalies).toHaveLength(1);
    expect(result.anomalies[0].severity).toBe('Medium');
  });
});
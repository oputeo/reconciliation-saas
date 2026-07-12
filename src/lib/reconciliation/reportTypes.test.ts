import { describe, expect, it } from 'vitest';
import { REPORT_TYPES, resolveReportSide } from './reportTypes';

describe('Report types', () => {
  it('includes Phase 1 and Phase 2 templates', () => {
    const ids = REPORT_TYPES.map((r) => r.id);
    expect(ids).toContain('pos_settlement');
    expect(ids).toContain('fee_commission');
    expect(ids).toContain('agent_terminal');
    expect(ids).toContain('qr_payment');
    expect(ids).toContain('bulk_payout');
  });

  it('locks fee and chargeback sides', () => {
    expect(resolveReportSide('fee_commission', 'internal')).toBe('assurance');
    expect(resolveReportSide('chargeback_reversal', 'settlement')).toBe('exception');
  });

  it('allows settlement side for Phase 2 payout', () => {
    expect(resolveReportSide('bulk_payout', 'settlement')).toBe('settlement');
    expect(resolveReportSide('agent_terminal', 'internal')).toBe('internal');
  });
});
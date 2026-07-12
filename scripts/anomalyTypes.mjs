/** Map reconciliation rule codes to anomaly display types. */
export function ruleCodeToAnomalyType(ruleCode, { missingReference = false } = {}) {
  if (missingReference) return 'Missing Reference';
  switch (ruleCode) {
    case 'MATCH_SAME_DAY_DUPLICATE':
      return 'Duplicate Transaction';
    case 'EXC_DOUBLE_POSTING':
      return 'Double Posting';
    case 'EXC_FEE_LEAKAGE':
      return 'Fee Leakage';
    case 'EXC_REVERSED_NOT_REFUNDED':
      return 'Reversal Without Refund';
    case 'ADV_ANOMALY_SPIKE':
      return 'Volume Spike';
    case 'EXC_HIGH_VALUE':
      return 'High-Value Unmatched';
    case 'EXC_FEE_ASSURANCE':
    case 'EXC_FEE_LEAKAGE':
      return 'Fee Leakage';
    default:
      return 'Unmatched Transaction';
  }
}

export function rootCauseForType(type, ctx = {}) {
  const { ruleCode, fee, maxFeePct = 5, transactionId } = ctx;
  switch (type) {
    case 'Duplicate Transaction':
      return 'Same-day duplicate reference and amount detected';
    case 'Double Posting':
      return 'Repeated posting with identical reference and amount';
    case 'Fee Leakage':
      return fee != null
        ? `Fee (₦${fee}) exceeds ${maxFeePct}% of transaction amount`
        : 'Fee exceeds configured MDR threshold';
    case 'Reversal Without Refund':
      return 'Reversal posted without matching refund settlement pair';
    case 'Volume Spike':
      return 'Daily volume exceeds 200% above 7-day baseline';
    case 'Missing Reference':
      return 'Missing reference prevents automated matching';
    case 'Fee Assurance Variance':
      return 'Ledger fee differs from fee assurance benchmark beyond tolerance';
    case 'High-Value Unmatched':
      return `Unmatched transaction above high-value threshold (${transactionId || 'n/a'})`;
    default:
      return 'No matching rule found a counterpart in the ledger pool';
  }
}

export function severityForAmount(amount) {
  const abs = Math.abs(Number(amount));
  if (abs >= 1_000_000) return 'High';
  if (abs >= 100_000) return 'Medium';
  return 'Low';
}

export function formatProductLabel(productType) {
  if (!productType) return '—';
  return String(productType)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
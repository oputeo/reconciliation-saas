/** Keep in sync with supabase/functions/_shared/reconciliationRules.ts */

export type RuleCategory = 'matching' | 'exception' | 'channel' | 'advanced';

export interface ReconciliationRuleRecord {
  id?: string;
  tenant_id?: string;
  rule_code: string;
  category: RuleCategory;
  name: string;
  description: string;
  config: Record<string, unknown>;
  priority: number;
  active: boolean;
  version?: number;
  updated_at?: string;
}

export interface TenantReconciliationSettings {
  default_tolerance: number;
  auto_resolve_low_risk: boolean;
  default_channel: string;
  fuzzy_tolerance_ngn: number;
  high_value_threshold_ngn: number;
}

export const DEFAULT_TENANT_RECONCILIATION: TenantReconciliationSettings = {
  default_tolerance: 2.0,
  auto_resolve_low_risk: false,
  default_channel: 'ALL',
  fuzzy_tolerance_ngn: 50,
  high_value_threshold_ngn: 500_000,
};

export const RULE_CATEGORIES: { id: RuleCategory; label: string }[] = [
  { id: 'matching', label: 'Core Matching' },
  { id: 'exception', label: 'Exception & Leakage' },
  { id: 'channel', label: 'Channel-Specific' },
  { id: 'advanced', label: 'Advanced / Predictive' },
];

export const CONFIG_FIELD_HINTS: Record<string, { key: string; label: string; type: 'number' | 'text' }[]> = {
  MATCH_AMOUNT_REFERENCE: [{ key: 'tolerance_ngn', label: 'Amount tolerance (₦)', type: 'number' }],
  MATCH_FUZZY_AMOUNT: [
    { key: 'tolerance_ngn', label: 'Amount tolerance (₦)', type: 'number' },
    { key: 'similarity_threshold', label: 'Similarity threshold (0–1)', type: 'number' },
  ],
  MATCH_MULTI_FIELD: [{ key: 'tolerance_ngn', label: 'Amount tolerance (₦)', type: 'number' }],
  MATCH_CROSS_CHANNEL: [{ key: 'tolerance_ngn', label: 'Amount tolerance (₦)', type: 'number' }],
  EXC_FEE_LEAKAGE: [{ key: 'max_fee_pct', label: 'Max fee % of amount', type: 'number' }],
  EXC_HIGH_VALUE: [{ key: 'threshold_ngn', label: 'High-value threshold (₦)', type: 'number' }],
  CH_WALLET_FUNDING: [{ key: 'min_amount', label: 'Minimum amount (₦)', type: 'number' }],
  CH_CARD_ACQUIRER: [{ key: 'tolerance_ngn', label: 'Amount tolerance (₦)', type: 'number' }],
  CH_PAYOUT_SETTLEMENT: [{ key: 'tolerance_ngn', label: 'Amount tolerance (₦)', type: 'number' }],
  CH_AGENT_TERMINAL: [{ key: 'tolerance_ngn', label: 'Amount tolerance (₦)', type: 'number' }],
  CH_QR_PAYMENT: [{ key: 'tolerance_ngn', label: 'Amount tolerance (₦)', type: 'number' }],
  ADV_ANOMALY_SPIKE: [{ key: 'spike_pct', label: 'Spike % above baseline', type: 'number' }],
  ADV_30_DAY_PROJECTION: [{ key: 'horizon_days', label: 'Projection horizon (days)', type: 'number' }],
  ADV_TX_RISK_SCORE: [
    { key: 'high_value_weight', label: 'High-value weight', type: 'number' },
    { key: 'unmatched_weight', label: 'Unmatched weight', type: 'number' },
    { key: 'fee_weight', label: 'Fee weight', type: 'number' },
  ],
};

export const DEFAULT_RECONCILIATION_RULES: Omit<ReconciliationRuleRecord, 'id' | 'tenant_id'>[] = [
  { rule_code: 'MATCH_AMOUNT_REFERENCE', category: 'matching', name: 'Smart Amount + Reference Match', description: 'Primary match on normalized reference with amount tolerance (₦).', config: { tolerance_ngn: 50, require_reference: true }, priority: 100, active: true },
  { rule_code: 'MATCH_FUZZY_AMOUNT', category: 'matching', name: 'Fuzzy Amount Match', description: 'Match when amount is within ±₦ tolerance and product context is similar.', config: { tolerance_ngn: 50, similarity_threshold: 0.55 }, priority: 90, active: true },
  { rule_code: 'MATCH_MULTI_FIELD', category: 'matching', name: 'Multi-Field Match', description: 'Match on amount, same calendar date, and channel/product alignment.', config: { tolerance_ngn: 50, fields: ['amount', 'date', 'channel'] }, priority: 85, active: true },
  { rule_code: 'MATCH_SAME_DAY_DUPLICATE', category: 'matching', name: 'Same-Day Duplicate Detector', description: 'Flags duplicate reference+amount on the same transaction date.', config: { action: 'flag_duplicate' }, priority: 80, active: true },
  { rule_code: 'MATCH_CROSS_CHANNEL', category: 'matching', name: 'Cross-Channel Reconciliation', description: 'Links POS settlements to bank transfer counterparts.', config: { from_channels: ['pos', 'mp_pos', 'moniepoint_pos'], to_channels: ['bank_transfer', 'mp_trf', 'transfer'], tolerance_ngn: 100 }, priority: 75, active: true },
  { rule_code: 'EXC_UNMATCHED', category: 'exception', name: 'Unmatched Transaction Rule', description: 'Creates an anomaly when no matching rule succeeds.', config: {}, priority: 70, active: true },
  { rule_code: 'EXC_DOUBLE_POSTING', category: 'exception', name: 'Double Posting Rule', description: 'Detects repeated postings with same reference and amount.', config: { window_hours: 24 }, priority: 65, active: true },
  { rule_code: 'EXC_FEE_LEAKAGE', category: 'exception', name: 'Fee Leakage Rule', description: 'Flags when actual fee exceeds calculated threshold vs amount.', config: { max_fee_pct: 5, compare_to_calculated: true }, priority: 60, active: true },
  { rule_code: 'EXC_REVERSED_NOT_REFUNDED', category: 'exception', name: 'Reversed but Not Refunded Rule', description: 'Detects reversal postings without a matching refund entry.', config: { keywords: ['reversal', 'reversed', 'refund', 'chargeback'] }, priority: 55, active: true },
  { rule_code: 'EXC_HIGH_VALUE', category: 'exception', name: 'High-Value Unmatched Rule', description: 'Escalates unmatched items above ₦500k (configurable).', config: { threshold_ngn: 500_000 }, priority: 50, active: true },
  { rule_code: 'CH_POS_SYNC', category: 'channel', name: 'POS Terminal Sync Rule', description: 'POS batch settlement reference matching.', config: { channels: ['pos', 'mp_pos', 'moniepoint_pos'], settlement_keyword: 'settlement' }, priority: 45, active: true },
  { rule_code: 'CH_MONNIFY_GATEWAY', category: 'channel', name: 'Monnify Gateway Rule', description: 'Gateway collection reference and fee alignment.', config: { channels: ['gateway', 'mp_gtw', 'monnify', 'moniepoint_gateway'] }, priority: 44, active: true },
  { rule_code: 'CH_BANK_TRANSFER_REF', category: 'channel', name: 'Bank Transfer Reference Rule', description: 'Strict reference match for NIP/transfer rails.', config: { channels: ['bank_transfer', 'mp_trf', 'transfer', 'nip'] }, priority: 43, active: true },
  { rule_code: 'CH_WALLET_FUNDING', category: 'channel', name: 'Wallet Funding Validation Rule', description: 'Validates wallet funding amounts and references.', config: { channels: ['wallet', 'mp_wlt', 'moniepoint_wallet'], min_amount: 100 }, priority: 42, active: true },
  { rule_code: 'CH_CARD_ACQUIRER', category: 'channel', name: 'Card Acquirer Reference Rule', description: 'Strict RRN / acquirer reference match for card settlements.', config: { channels: ['card', 'mp_card', 'acquirer', 'visa', 'mastercard', 'verve'], tolerance_ngn: 50 }, priority: 41, active: true },
  { rule_code: 'CH_PAYOUT_SETTLEMENT', category: 'channel', name: 'Bulk Payout Settlement Rule', description: 'Links outbound payout records to bank settlement confirmations.', config: { from_channels: ['bulk_payout', 'payout', 'mp_payout'], to_channels: ['bank_transfer', 'mp_trf', 'settlement', 'nip'], tolerance_ngn: 100 }, priority: 40, active: true },
  { rule_code: 'CH_AGENT_TERMINAL', category: 'channel', name: 'Agent Terminal Sync Rule', description: 'Agent terminal collection reference and amount alignment.', config: { channels: ['agent_banking', 'mp_agb', 'moniepoint_agent_banking', 'agent_terminal'], tolerance_ngn: 50 }, priority: 39, active: true },
  { rule_code: 'CH_QR_PAYMENT', category: 'channel', name: 'QR Payment Rule', description: 'QR code reference match for scan-to-pay collections.', config: { channels: ['qr_payment', 'qr', 'mp_qr', 'scan_to_pay'], tolerance_ngn: 50 }, priority: 38, active: true },
  { rule_code: 'ADV_ANOMALY_SPIKE', category: 'advanced', name: 'Anomaly Detection Rule', description: 'Flags sudden volume or value spikes vs 7-day baseline.', config: { spike_pct: 200, window_days: 7 }, priority: 30, active: true },
  { rule_code: 'ADV_30_DAY_PROJECTION', category: 'advanced', name: '30-Day Projection Rule', description: 'Informational forecast horizon for reconciliation planning.', config: { horizon_days: 30 }, priority: 20, active: true },
  { rule_code: 'ADV_TX_RISK_SCORE', category: 'advanced', name: 'Risk Scoring Rule', description: 'Assigns a 0–100 risk score per transaction during reconciliation.', config: { high_value_weight: 30, unmatched_weight: 40, fee_weight: 20 }, priority: 10, active: true },
];
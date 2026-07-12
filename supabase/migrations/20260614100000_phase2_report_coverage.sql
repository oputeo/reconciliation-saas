-- Phase 2: agent, QR, payout rules + seed update

INSERT INTO public.reconciliation_rule_catalog (
  tenant_id, rule_code, category, name, description, config, priority, active, version
)
SELECT
  t.id,
  v.rule_code,
  v.category,
  v.name,
  v.description,
  v.config::jsonb,
  v.priority,
  true,
  1
FROM public.tenants t
CROSS JOIN (VALUES
  ('CH_PAYOUT_SETTLEMENT', 'channel', 'Bulk Payout Settlement Rule',
   'Links outbound payout records to bank settlement confirmations.',
   '{"from_channels":["bulk_payout","payout","mp_payout"],"to_channels":["bank_transfer","mp_trf","settlement","nip","bank_settlement"],"tolerance_ngn":100}',
   40),
  ('CH_AGENT_TERMINAL', 'channel', 'Agent Terminal Sync Rule',
   'Agent terminal collection reference and amount alignment.',
   '{"channels":["agent_banking","mp_agb","moniepoint_agent_banking","agent_terminal"],"tolerance_ngn":50}',
   39),
  ('CH_QR_PAYMENT', 'channel', 'QR Payment Rule',
   'QR code reference match for scan-to-pay collections.',
   '{"channels":["qr_payment","qr","mp_qr","scan_to_pay"],"tolerance_ngn":50}',
   38)
) AS v(rule_code, category, name, description, config, priority)
ON CONFLICT (tenant_id, rule_code) DO NOTHING;

-- Refresh seed function (21 rules)
CREATE OR REPLACE FUNCTION public.seed_reconciliation_rule_catalog(p_tenant_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_count integer;
BEGIN
  INSERT INTO public.reconciliation_rule_catalog (
    tenant_id, rule_code, category, name, description, config, priority, active, version
  ) VALUES
    (p_tenant_id, 'MATCH_AMOUNT_REFERENCE', 'matching', 'Smart Amount + Reference Match',
     'Primary match on normalized reference with amount tolerance (₦).',
     '{"tolerance_ngn":50,"require_reference":true}'::jsonb, 100, true, 1),
    (p_tenant_id, 'MATCH_FUZZY_AMOUNT', 'matching', 'Fuzzy Amount Match',
     'Match when amount is within ±₦ tolerance and product context is similar.',
     '{"tolerance_ngn":50,"similarity_threshold":0.55}'::jsonb, 90, true, 1),
    (p_tenant_id, 'MATCH_MULTI_FIELD', 'matching', 'Multi-Field Match',
     'Match on amount, same calendar date, and channel/product alignment.',
     '{"tolerance_ngn":50,"fields":["amount","date","channel"]}'::jsonb, 85, true, 1),
    (p_tenant_id, 'MATCH_SAME_DAY_DUPLICATE', 'matching', 'Same-Day Duplicate Detector',
     'Flags duplicate reference+amount on the same transaction date.',
     '{"action":"flag_duplicate"}'::jsonb, 80, true, 1),
    (p_tenant_id, 'MATCH_CROSS_CHANNEL', 'matching', 'Cross-Channel Reconciliation',
     'Links POS settlements to bank transfer counterparts.',
     '{"from_channels":["pos","mp_pos","moniepoint_pos"],"to_channels":["bank_transfer","mp_trf","transfer"],"tolerance_ngn":100}'::jsonb, 75, true, 1),
    (p_tenant_id, 'EXC_UNMATCHED', 'exception', 'Unmatched Transaction Rule',
     'Creates an anomaly when no matching rule succeeds.', '{}'::jsonb, 70, true, 1),
    (p_tenant_id, 'EXC_DOUBLE_POSTING', 'exception', 'Double Posting Rule',
     'Detects repeated postings with same reference and amount.',
     '{"window_hours":24}'::jsonb, 65, true, 1),
    (p_tenant_id, 'EXC_FEE_LEAKAGE', 'exception', 'Fee Leakage Rule',
     'Flags when actual fee exceeds calculated threshold vs amount.',
     '{"max_fee_pct":5,"compare_to_calculated":true}'::jsonb, 60, true, 1),
    (p_tenant_id, 'EXC_REVERSED_NOT_REFUNDED', 'exception', 'Reversed but Not Refunded Rule',
     'Detects reversal postings without a matching refund entry.',
     '{"keywords":["reversal","reversed","refund","chargeback"]}'::jsonb, 55, true, 1),
    (p_tenant_id, 'EXC_HIGH_VALUE', 'exception', 'High-Value Unmatched Rule',
     'Escalates unmatched items above ₦500k (configurable).',
     '{"threshold_ngn":500000}'::jsonb, 50, true, 1),
    (p_tenant_id, 'CH_POS_SYNC', 'channel', 'POS Terminal Sync Rule',
     'POS batch settlement reference matching.',
     '{"channels":["pos","mp_pos","moniepoint_pos"],"settlement_keyword":"settlement"}'::jsonb, 45, true, 1),
    (p_tenant_id, 'CH_MONNIFY_GATEWAY', 'channel', 'Monnify Gateway Rule',
     'Gateway collection reference and fee alignment.',
     '{"channels":["gateway","mp_gtw","monnify","moniepoint_gateway"]}'::jsonb, 44, true, 1),
    (p_tenant_id, 'CH_BANK_TRANSFER_REF', 'channel', 'Bank Transfer Reference Rule',
     'Strict reference match for NIP/transfer rails.',
     '{"channels":["bank_transfer","mp_trf","transfer","nip"]}'::jsonb, 43, true, 1),
    (p_tenant_id, 'CH_WALLET_FUNDING', 'channel', 'Wallet Funding Validation Rule',
     'Validates wallet funding amounts and references.',
     '{"channels":["wallet","mp_wlt","moniepoint_wallet"],"min_amount":100}'::jsonb, 42, true, 1),
    (p_tenant_id, 'CH_CARD_ACQUIRER', 'channel', 'Card Acquirer Reference Rule',
     'Strict RRN / acquirer reference match for card settlements.',
     '{"channels":["card","mp_card","acquirer","visa","mastercard","verve"],"tolerance_ngn":50}'::jsonb, 41, true, 1),
    (p_tenant_id, 'CH_PAYOUT_SETTLEMENT', 'channel', 'Bulk Payout Settlement Rule',
     'Links outbound payout records to bank settlement confirmations.',
     '{"from_channels":["bulk_payout","payout","mp_payout"],"to_channels":["bank_transfer","mp_trf","settlement","nip","bank_settlement"],"tolerance_ngn":100}'::jsonb, 40, true, 1),
    (p_tenant_id, 'CH_AGENT_TERMINAL', 'channel', 'Agent Terminal Sync Rule',
     'Agent terminal collection reference and amount alignment.',
     '{"channels":["agent_banking","mp_agb","moniepoint_agent_banking","agent_terminal"],"tolerance_ngn":50}'::jsonb, 39, true, 1),
    (p_tenant_id, 'CH_QR_PAYMENT', 'channel', 'QR Payment Rule',
     'QR code reference match for scan-to-pay collections.',
     '{"channels":["qr_payment","qr","mp_qr","scan_to_pay"],"tolerance_ngn":50}'::jsonb, 38, true, 1),
    (p_tenant_id, 'ADV_ANOMALY_SPIKE', 'advanced', 'Anomaly Detection Rule',
     'Flags sudden volume or value spikes vs 7-day baseline.',
     '{"spike_pct":200,"window_days":7}'::jsonb, 30, true, 1),
    (p_tenant_id, 'ADV_30_DAY_PROJECTION', 'advanced', '30-Day Projection Rule',
     'Informational forecast horizon for reconciliation planning.',
     '{"horizon_days":30}'::jsonb, 20, true, 1),
    (p_tenant_id, 'ADV_TX_RISK_SCORE', 'advanced', 'Risk Scoring Rule',
     'Assigns a 0–100 risk score per transaction during reconciliation.',
     '{"high_value_weight":30,"unmatched_weight":40,"fee_weight":20}'::jsonb, 10, true, 1)
  ON CONFLICT (tenant_id, rule_code) DO NOTHING;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$;
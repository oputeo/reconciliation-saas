-- ============================================================
-- ReconFlow Phase 2: Agent, QR, Payout + product dashboards
-- Run after RUN_PHASE1.sql (or full RUN_RECONCILIATION_RULES.sql)
-- ============================================================

INSERT INTO public.reconciliation_rule_catalog (
  tenant_id, rule_code, category, name, description, config, priority, active, version
)
SELECT
  '0771c1a1-4ff0-46a1-9f98-c6b30fdff049',
  v.rule_code,
  v.category,
  v.name,
  v.description,
  v.config::jsonb,
  v.priority,
  true,
  1
FROM (VALUES
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

SELECT COUNT(*) AS total_rules
FROM public.reconciliation_rule_catalog
WHERE tenant_id = '0771c1a1-4ff0-46a1-9f98-c6b30fdff049';

SELECT rule_code, priority, active
FROM public.reconciliation_rule_catalog
WHERE tenant_id = '0771c1a1-4ff0-46a1-9f98-c6b30fdff049'
  AND rule_code IN ('CH_PAYOUT_SETTLEMENT', 'CH_AGENT_TERMINAL', 'CH_QR_PAYMENT')
ORDER BY priority DESC;

NOTIFY pgrst, 'reload schema';
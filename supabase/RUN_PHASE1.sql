-- ============================================================
-- ReconFlow Phase 1: Report coverage + CH_CARD_ACQUIRER
-- Run in Supabase SQL Editor after RUN_RECONCILIATION_RULES.sql
-- ============================================================

ALTER TABLE public.uploads
  ADD COLUMN IF NOT EXISTS report_type text DEFAULT 'generic',
  ADD COLUMN IF NOT EXISTS report_side text DEFAULT 'internal';

INSERT INTO public.reconciliation_rule_catalog (
  tenant_id, rule_code, category, name, description, config, priority, active, version
)
SELECT
  '0771c1a1-4ff0-46a1-9f98-c6b30fdff049',
  'CH_CARD_ACQUIRER',
  'channel',
  'Card Acquirer Reference Rule',
  'Strict RRN / acquirer reference match for card settlements.',
  '{"channels":["card","mp_card","acquirer","visa","mastercard","verve"],"tolerance_ngn":50}'::jsonb,
  41,
  true,
  1
ON CONFLICT (tenant_id, rule_code) DO NOTHING;

SELECT rule_code, category, priority, active
FROM public.reconciliation_rule_catalog
WHERE tenant_id = '0771c1a1-4ff0-46a1-9f98-c6b30fdff049'
  AND rule_code = 'CH_CARD_ACQUIRER';

NOTIFY pgrst, 'reload schema';
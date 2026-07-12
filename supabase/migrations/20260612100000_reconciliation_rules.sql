-- Reconciliation rules registry (Phase A): 17 default rules per tenant

-- Legacy control-gate table (different schema) is left as reconciliation_rules.
CREATE TABLE IF NOT EXISTS public.reconciliation_rule_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  rule_code text NOT NULL,
  category text NOT NULL CHECK (category IN ('matching', 'exception', 'channel', 'advanced')),
  name text NOT NULL,
  description text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  priority integer NOT NULL DEFAULT 50,
  active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, rule_code)
);

CREATE INDEX IF NOT EXISTS reconciliation_rule_catalog_tenant_active_idx
  ON public.reconciliation_rule_catalog (tenant_id, active, priority DESC);

ALTER TABLE public.master_ledger
  ADD COLUMN IF NOT EXISTS matched_rule_code text;

-- Seed function (run for each tenant)
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

SELECT public.seed_reconciliation_rule_catalog('0771c1a1-4ff0-46a1-9f98-c6b30fdff049');

-- Extend tenant reconciliation defaults
UPDATE public.tenants
SET settings = jsonb_set(
  jsonb_set(
    settings,
    '{reconciliation,fuzzy_tolerance_ngn}',
    '50'::jsonb,
    true
  ),
  '{reconciliation,high_value_threshold_ngn}',
  '500000'::jsonb,
  true
)
WHERE id = '0771c1a1-4ff0-46a1-9f98-c6b30fdff049';

-- RLS
ALTER TABLE public.reconciliation_rule_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant members view rule catalog" ON public.reconciliation_rule_catalog;
CREATE POLICY "Tenant members view rule catalog"
ON public.reconciliation_rule_catalog FOR SELECT TO authenticated
USING (public.user_has_tenant_access(tenant_id));

DROP POLICY IF EXISTS "Auditors update rule catalog" ON public.reconciliation_rule_catalog;
CREATE POLICY "Auditors update rule catalog"
ON public.reconciliation_rule_catalog FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND tenant_id = reconciliation_rule_catalog.tenant_id
      AND role IN ('admin', 'auditor', 'approver')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND tenant_id = reconciliation_rule_catalog.tenant_id
      AND role IN ('admin', 'auditor', 'approver')
  )
);

DROP POLICY IF EXISTS "Admins insert rule catalog" ON public.reconciliation_rule_catalog;
CREATE POLICY "Admins insert rule catalog"
ON public.reconciliation_rule_catalog FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND tenant_id = reconciliation_rule_catalog.tenant_id
      AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins delete rule catalog" ON public.reconciliation_rule_catalog;
CREATE POLICY "Admins delete rule catalog"
ON public.reconciliation_rule_catalog FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND tenant_id = reconciliation_rule_catalog.tenant_id
      AND role = 'admin'
  )
);

GRANT SELECT, UPDATE, DELETE ON public.reconciliation_rule_catalog TO authenticated;
GRANT INSERT ON public.reconciliation_rule_catalog TO authenticated;
GRANT EXECUTE ON FUNCTION public.seed_reconciliation_rule_catalog(uuid) TO authenticated;

DROP TRIGGER IF EXISTS reconciliation_rule_catalog_updated_at ON public.reconciliation_rule_catalog;
CREATE TRIGGER reconciliation_rule_catalog_updated_at
  BEFORE UPDATE ON public.reconciliation_rule_catalog
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
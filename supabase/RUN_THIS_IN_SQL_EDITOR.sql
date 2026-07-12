-- ============================================================
-- ReconFlow: COPY ALL OF THIS into Supabase SQL Editor → Run
-- Dashboard: SQL Editor → New query → paste → Run
-- ============================================================

-- ========== PART 1: Tenants & settings ==========

CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  billing_email text,
  timezone text NOT NULL DEFAULT 'Africa/Lagos',
  currency text NOT NULL DEFAULT 'NGN',
  logo_url text,
  plan text NOT NULL DEFAULT 'professional',
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Fix: table may already exist with an older schema — add any missing columns
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS billing_email text;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'Africa/Lagos';
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS currency text DEFAULT 'NGN';
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS plan text DEFAULT 'professional';
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

INSERT INTO public.tenants (id, name, slug, billing_email, plan, settings)
VALUES (
  '0771c1a1-4ff0-46a1-9f98-c6b30fdff049',
  'OEO Solution',
  'oeo-solution',
  'admin@oeosolution.com',
  'professional',
  jsonb_build_object(
    'notifications', jsonb_build_object('email_alerts', true, 'anomaly_threshold', 85, 'daily_digest', false),
    'reconciliation', jsonb_build_object('default_tolerance', 2.0, 'auto_resolve_low_risk', false, 'default_channel', 'ALL'),
    'security', jsonb_build_object('session_timeout_minutes', 480, 'require_email_verification', true, 'ip_allowlist_enabled', false),
    'integrations', jsonb_build_object('power_bi_enabled', false, 'webhook_url', null)
  )
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = COALESCE(public.tenants.slug, EXCLUDED.slug),
  billing_email = COALESCE(public.tenants.billing_email, EXCLUDED.billing_email),
  plan = COALESCE(public.tenants.plan, EXCLUDED.plan),
  settings = CASE
    WHEN public.tenants.settings IS NULL OR public.tenants.settings = '{}'::jsonb
    THEN EXCLUDED.settings
    ELSE public.tenants.settings
  END,
  updated_at = now();

ALTER TABLE public.access_requests
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id),
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'viewer',
  ADD COLUMN IF NOT EXISTS invited_by uuid,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tenants_updated_at ON public.tenants;
CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own tenant" ON public.tenants;
CREATE POLICY "Users can view their own tenant"
ON public.tenants FOR SELECT TO authenticated
USING (id IN (SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can update their tenant" ON public.tenants;
CREATE POLICY "Admins can update their tenant"
ON public.tenants FOR UPDATE TO authenticated
USING (id IN (SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
WITH CHECK (id IN (SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_tenant_unique ON public.user_roles (user_id, tenant_id);

-- Link auth users missing from user_roles (run if ai-insight returns 403)
-- INSERT INTO public.user_roles (user_id, tenant_id, role)
-- SELECT id, '0771c1a1-4ff0-46a1-9f98-c6b30fdff049', 'admin'
-- FROM auth.users WHERE email = 'admin@oeosolution.com'
-- ON CONFLICT (user_id, tenant_id) DO UPDATE SET role = EXCLUDED.role;

GRANT SELECT, UPDATE ON public.tenants TO authenticated;
GRANT ALL ON public.tenants TO service_role;

-- ========== PART 2: Security, RLS, audit tables ==========

CREATE TABLE IF NOT EXISTS public.reconciliation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  run_by uuid,
  period text NOT NULL DEFAULT 'year',
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'running',
  processed int NOT NULL DEFAULT 0,
  matched int NOT NULL DEFAULT 0,
  unmatched int NOT NULL DEFAULT 0,
  match_rate numeric(5,2) DEFAULT 0,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS reconciliation_runs_tenant_created_idx
  ON public.reconciliation_runs (tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  user_id uuid,
  action text NOT NULL,
  resource_type text,
  resource_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_tenant_created_idx
  ON public.audit_log (tenant_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.user_has_tenant_access(p_tenant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND tenant_id = p_tenant_id
  );
$$;

CREATE OR REPLACE FUNCTION public.user_is_tenant_admin(p_tenant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND tenant_id = p_tenant_id AND role = 'admin'
  );
$$;

ALTER TABLE public.master_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant members can view ledger" ON public.master_ledger;
CREATE POLICY "Tenant members can view ledger" ON public.master_ledger FOR SELECT TO authenticated
USING (public.user_has_tenant_access(tenant_id));
DROP POLICY IF EXISTS "Auditors can insert ledger" ON public.master_ledger;
CREATE POLICY "Auditors can insert ledger" ON public.master_ledger FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND tenant_id = master_ledger.tenant_id AND role IN ('admin', 'auditor', 'approver')));
DROP POLICY IF EXISTS "Auditors can update ledger" ON public.master_ledger;
CREATE POLICY "Auditors can update ledger" ON public.master_ledger FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND tenant_id = master_ledger.tenant_id AND role IN ('admin', 'auditor', 'approver')));

ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant members can view uploads" ON public.uploads;
CREATE POLICY "Tenant members can view uploads" ON public.uploads FOR SELECT TO authenticated
USING (public.user_has_tenant_access(tenant_id));
DROP POLICY IF EXISTS "Auditors can insert uploads" ON public.uploads;
CREATE POLICY "Auditors can insert uploads" ON public.uploads FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND tenant_id = uploads.tenant_id AND role IN ('admin', 'auditor', 'approver')));

ALTER TABLE public.anomalies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant members can view anomalies" ON public.anomalies;
CREATE POLICY "Tenant members can view anomalies" ON public.anomalies FOR SELECT TO authenticated
USING (public.user_has_tenant_access(tenant_id));
DROP POLICY IF EXISTS "Auditors can manage anomalies" ON public.anomalies;
CREATE POLICY "Auditors can manage anomalies" ON public.anomalies FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND tenant_id = anomalies.tenant_id AND role IN ('admin', 'auditor', 'approver')))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND tenant_id = anomalies.tenant_id AND role IN ('admin', 'auditor', 'approver')));

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view roles in their tenants" ON public.user_roles;
CREATE POLICY "Users can view roles in their tenants" ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.user_has_tenant_access(tenant_id));
DROP POLICY IF EXISTS "Admins manage tenant roles" ON public.user_roles;
CREATE POLICY "Admins manage tenant roles" ON public.user_roles FOR ALL TO authenticated
USING (public.user_is_tenant_admin(tenant_id)) WITH CHECK (public.user_is_tenant_admin(tenant_id));

ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins view access requests" ON public.access_requests;
CREATE POLICY "Admins view access requests" ON public.access_requests FOR SELECT TO authenticated
USING (tenant_id IS NULL OR public.user_is_tenant_admin(tenant_id) OR lower(email) = lower(auth.jwt() ->> 'email'));
DROP POLICY IF EXISTS "Admins manage access requests" ON public.access_requests;
CREATE POLICY "Admins manage access requests" ON public.access_requests FOR INSERT TO authenticated
WITH CHECK (tenant_id IS NULL OR public.user_is_tenant_admin(tenant_id));
DROP POLICY IF EXISTS "Admins update access requests" ON public.access_requests;
CREATE POLICY "Admins update access requests" ON public.access_requests FOR UPDATE TO authenticated
USING (tenant_id IS NULL OR public.user_is_tenant_admin(tenant_id));

ALTER TABLE public.reconciliation_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant members view reconciliation runs" ON public.reconciliation_runs;
CREATE POLICY "Tenant members view reconciliation runs" ON public.reconciliation_runs FOR SELECT TO authenticated
USING (public.user_has_tenant_access(tenant_id));

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant members view audit log" ON public.audit_log;
CREATE POLICY "Tenant members view audit log" ON public.audit_log FOR SELECT TO authenticated
USING (tenant_id IS NULL OR public.user_has_tenant_access(tenant_id));

GRANT SELECT, INSERT, UPDATE ON public.master_ledger TO authenticated;
GRANT SELECT, INSERT ON public.uploads TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.anomalies TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.access_requests TO authenticated;
GRANT SELECT ON public.reconciliation_runs TO authenticated;
GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.reconciliation_runs TO service_role;
GRANT ALL ON public.audit_log TO service_role;

NOTIFY pgrst, 'reload schema';

-- ========== VERIFY (should return rows) ==========
SELECT id, name, plan FROM public.tenants;
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('tenants','master_ledger','uploads','anomalies','reconciliation_runs','audit_log');

-- ========== PHASE A: RECONCILIATION RULES (paste if not yet applied) ==========
-- Full script: supabase/migrations/20260612100000_reconciliation_rules.sql
-- Creates reconciliation_rules table, seeds 17 rules, adds matched_rule_code to master_ledger.
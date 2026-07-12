-- Phase 0/3: Tenant isolation, reconciliation runs, audit log

-- Reconciliation run tracking (idempotent jobs)
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

-- Immutable audit trail
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

-- Helper: tenant membership check
CREATE OR REPLACE FUNCTION public.user_has_tenant_access(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND tenant_id = p_tenant_id
  );
$$;

CREATE OR REPLACE FUNCTION public.user_is_tenant_admin(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND tenant_id = p_tenant_id
      AND role = 'admin'
  );
$$;

-- master_ledger RLS
ALTER TABLE public.master_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant members can view ledger" ON public.master_ledger;
CREATE POLICY "Tenant members can view ledger"
ON public.master_ledger FOR SELECT TO authenticated
USING (public.user_has_tenant_access(tenant_id));

DROP POLICY IF EXISTS "Auditors can insert ledger" ON public.master_ledger;
CREATE POLICY "Auditors can insert ledger"
ON public.master_ledger FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND tenant_id = master_ledger.tenant_id
      AND role IN ('admin', 'auditor', 'approver')
  )
);

DROP POLICY IF EXISTS "Auditors can update ledger" ON public.master_ledger;
CREATE POLICY "Auditors can update ledger"
ON public.master_ledger FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND tenant_id = master_ledger.tenant_id
      AND role IN ('admin', 'auditor', 'approver')
  )
);

-- uploads RLS
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant members can view uploads" ON public.uploads;
CREATE POLICY "Tenant members can view uploads"
ON public.uploads FOR SELECT TO authenticated
USING (public.user_has_tenant_access(tenant_id));

DROP POLICY IF EXISTS "Auditors can insert uploads" ON public.uploads;
CREATE POLICY "Auditors can insert uploads"
ON public.uploads FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND tenant_id = uploads.tenant_id
      AND role IN ('admin', 'auditor', 'approver')
  )
);

-- anomalies RLS
ALTER TABLE public.anomalies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant members can view anomalies" ON public.anomalies;
CREATE POLICY "Tenant members can view anomalies"
ON public.anomalies FOR SELECT TO authenticated
USING (public.user_has_tenant_access(tenant_id));

DROP POLICY IF EXISTS "Auditors can manage anomalies" ON public.anomalies;
CREATE POLICY "Auditors can manage anomalies"
ON public.anomalies FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND tenant_id = anomalies.tenant_id
      AND role IN ('admin', 'auditor', 'approver')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND tenant_id = anomalies.tenant_id
      AND role IN ('admin', 'auditor', 'approver')
  )
);

-- user_roles RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view roles in their tenants" ON public.user_roles;
CREATE POLICY "Users can view roles in their tenants"
ON public.user_roles FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.user_has_tenant_access(tenant_id)
);

DROP POLICY IF EXISTS "Admins manage tenant roles" ON public.user_roles;
CREATE POLICY "Admins manage tenant roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.user_is_tenant_admin(tenant_id))
WITH CHECK (public.user_is_tenant_admin(tenant_id));

-- access_requests RLS
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view access requests" ON public.access_requests;
CREATE POLICY "Admins view access requests"
ON public.access_requests FOR SELECT TO authenticated
USING (
  tenant_id IS NULL
  OR public.user_is_tenant_admin(tenant_id)
  OR lower(email) = lower(auth.jwt() ->> 'email')
);

DROP POLICY IF EXISTS "Admins manage access requests" ON public.access_requests;
CREATE POLICY "Admins manage access requests"
ON public.access_requests FOR INSERT TO authenticated
WITH CHECK (
  tenant_id IS NULL
  OR public.user_is_tenant_admin(tenant_id)
);

DROP POLICY IF EXISTS "Admins update access requests" ON public.access_requests;
CREATE POLICY "Admins update access requests"
ON public.access_requests FOR UPDATE TO authenticated
USING (tenant_id IS NULL OR public.user_is_tenant_admin(tenant_id));

-- reconciliation_runs RLS
ALTER TABLE public.reconciliation_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant members view reconciliation runs" ON public.reconciliation_runs;
CREATE POLICY "Tenant members view reconciliation runs"
ON public.reconciliation_runs FOR SELECT TO authenticated
USING (public.user_has_tenant_access(tenant_id));

-- audit_log RLS (read-only for tenant members)
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant members view audit log" ON public.audit_log;
CREATE POLICY "Tenant members view audit log"
ON public.audit_log FOR SELECT TO authenticated
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
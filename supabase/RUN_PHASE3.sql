-- ============================================================
-- ReconFlow Phase 3: Scheduled ingest, API keys, ingest monitoring
-- Run in Supabase SQL Editor after RUN_PHASE2.sql
-- Project: dfefeuxkhhvsiuluizzn
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.ingest_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  report_type text DEFAULT 'reconcile_only',
  report_side text DEFAULT 'internal',
  source_type text NOT NULL DEFAULT 'reconcile'
    CHECK (source_type IN ('api', 'sftp', 'reconcile')),
  frequency text NOT NULL DEFAULT 'daily'
    CHECK (frequency IN ('hourly', 'daily', 'weekly')),
  enabled boolean NOT NULL DEFAULT true,
  auto_reconcile boolean NOT NULL DEFAULT true,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_run_at timestamptz,
  next_run_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ingest_schedules_due_idx
  ON public.ingest_schedules (enabled, next_run_at)
  WHERE enabled = true;

CREATE INDEX IF NOT EXISTS ingest_schedules_tenant_idx
  ON public.ingest_schedules (tenant_id, enabled);

CREATE TABLE IF NOT EXISTS public.ingest_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  schedule_id uuid REFERENCES public.ingest_schedules(id) ON DELETE SET NULL,
  source_type text NOT NULL DEFAULT 'api',
  report_type text,
  status text NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'completed', 'failed', 'skipped')),
  records_inserted integer NOT NULL DEFAULT 0,
  records_skipped integer NOT NULL DEFAULT 0,
  error_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS ingest_runs_tenant_started_idx
  ON public.ingest_runs (tenant_id, started_at DESC);

CREATE TABLE IF NOT EXISTS public.tenant_ingest_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  key_prefix text NOT NULL,
  key_hash text NOT NULL,
  label text NOT NULL DEFAULT 'default',
  active boolean NOT NULL DEFAULT true,
  created_by uuid,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, key_prefix)
);

-- Default daily reconciliation schedule per tenant
INSERT INTO public.ingest_schedules (
  tenant_id, name, report_type, source_type, frequency, auto_reconcile, config, next_run_at
)
SELECT
  t.id,
  'Daily collective reconciliation',
  'reconcile_only',
  'reconcile',
  'daily',
  true,
  '{"description":"Auto-run collective reconciliation","hour_utc":6}'::jsonb,
  date_trunc('day', now() AT TIME ZONE 'UTC') + interval '1 day' + interval '6 hours'
FROM public.tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM public.ingest_schedules s
  WHERE s.tenant_id = t.id AND s.source_type = 'reconcile'
);

-- RLS
ALTER TABLE public.ingest_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingest_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_ingest_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant members view ingest schedules" ON public.ingest_schedules;
CREATE POLICY "Tenant members view ingest schedules"
ON public.ingest_schedules FOR SELECT TO authenticated
USING (public.user_has_tenant_access(tenant_id));

DROP POLICY IF EXISTS "Auditors manage ingest schedules" ON public.ingest_schedules;
CREATE POLICY "Auditors manage ingest schedules"
ON public.ingest_schedules FOR ALL TO authenticated
USING (public.user_has_min_role(tenant_id, 'auditor'))
WITH CHECK (public.user_has_min_role(tenant_id, 'auditor'));

DROP POLICY IF EXISTS "Tenant members view ingest runs" ON public.ingest_runs;
CREATE POLICY "Tenant members view ingest runs"
ON public.ingest_runs FOR SELECT TO authenticated
USING (public.user_has_tenant_access(tenant_id));

DROP POLICY IF EXISTS "Admins view ingest keys" ON public.tenant_ingest_keys;
CREATE POLICY "Admins view ingest keys"
ON public.tenant_ingest_keys FOR SELECT TO authenticated
USING (public.user_is_tenant_admin(tenant_id));

DROP POLICY IF EXISTS "Admins manage ingest keys" ON public.tenant_ingest_keys;
CREATE POLICY "Admins manage ingest keys"
ON public.tenant_ingest_keys FOR ALL TO authenticated
USING (public.user_is_tenant_admin(tenant_id))
WITH CHECK (public.user_is_tenant_admin(tenant_id));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ingest_schedules TO authenticated;
GRANT SELECT ON public.ingest_runs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_ingest_keys TO authenticated;
GRANT ALL ON public.ingest_schedules TO service_role;
GRANT ALL ON public.ingest_runs TO service_role;
GRANT ALL ON public.tenant_ingest_keys TO service_role;

-- Create ingest API key (returns plaintext once)
CREATE OR REPLACE FUNCTION public.create_tenant_ingest_key(
  p_tenant_id uuid,
  p_label text DEFAULT 'default'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plain text;
  v_prefix text;
  v_hash text;
BEGIN
  IF NOT public.user_is_tenant_admin(p_tenant_id) THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  v_plain := 'rfk_' || encode(gen_random_bytes(24), 'hex');
  v_prefix := left(v_plain, 12);
  v_hash := encode(digest(v_plain, 'sha256'), 'hex');

  INSERT INTO public.tenant_ingest_keys (tenant_id, key_prefix, key_hash, label, created_by)
  VALUES (p_tenant_id, v_prefix, v_hash, COALESCE(p_label, 'default'), auth.uid());

  RETURN jsonb_build_object('success', true, 'api_key', v_plain, 'prefix', v_prefix);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_tenant_ingest_key(uuid, text) TO authenticated;

DROP TRIGGER IF EXISTS ingest_schedules_updated_at ON public.ingest_schedules;
CREATE TRIGGER ingest_schedules_updated_at
  BEFORE UPDATE ON public.ingest_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Verification
SELECT COUNT(*) AS ingest_schedules_count FROM public.ingest_schedules;

SELECT tenant_id, name, source_type, frequency, enabled, next_run_at
FROM public.ingest_schedules
ORDER BY tenant_id, name;

SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('ingest_schedules', 'ingest_runs', 'tenant_ingest_keys')
ORDER BY tablename, policyname;

NOTIFY pgrst, 'reload schema';
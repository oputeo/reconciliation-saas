-- Multi-tenant organization & settings schema for ReconFlow

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

-- Seed default tenant if missing
INSERT INTO public.tenants (id, name, slug, billing_email, plan, settings)
VALUES (
  '0771c1a1-4ff0-46a1-9f98-c6b30fdff049',
  'OEO Solution',
  'oeo-solution',
  'admin@oeosolution.com',
  'professional',
  jsonb_build_object(
    'notifications', jsonb_build_object(
      'email_alerts', true,
      'anomaly_threshold', 85,
      'daily_digest', false
    ),
    'reconciliation', jsonb_build_object(
      'default_tolerance', 2.0,
      'auto_resolve_low_risk', false,
      'default_channel', 'ALL'
    ),
    'security', jsonb_build_object(
      'session_timeout_minutes', 480,
      'require_email_verification', true,
      'ip_allowlist_enabled', false
    ),
    'integrations', jsonb_build_object(
      'power_bi_enabled', false,
      'webhook_url', null
    )
  )
)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.access_requests
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id),
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'viewer',
  ADD COLUMN IF NOT EXISTS invited_by uuid,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tenants_updated_at ON public.tenants;
CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tenant"
ON public.tenants FOR SELECT TO authenticated
USING (
  id IN (
    SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can update their tenant"
ON public.tenants FOR UPDATE TO authenticated
USING (
  id IN (
    SELECT tenant_id FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  id IN (
    SELECT tenant_id FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_tenant_unique
ON public.user_roles (user_id, tenant_id);

CREATE OR REPLACE FUNCTION public.complete_onboarding_for_email(p_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_request record;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE lower(email) = lower(p_email)
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  SELECT id, tenant_id, role
  INTO v_request
  FROM public.access_requests
  WHERE lower(email) = lower(p_email)
    AND status = 'pending'
    AND tenant_id IS NOT NULL
  ORDER BY requested_at DESC
  LIMIT 1;

  IF v_request IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No pending invite');
  END IF;

  INSERT INTO public.user_roles (user_id, tenant_id, role)
  VALUES (v_user_id, v_request.tenant_id, v_request.role)
  ON CONFLICT (user_id, tenant_id) DO UPDATE SET role = EXCLUDED.role;

  UPDATE public.access_requests
  SET status = 'approved', updated_at = now()
  WHERE id = v_request.id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'tenant_id', v_request.tenant_id,
    'role', v_request.role
  );
END;
$$;
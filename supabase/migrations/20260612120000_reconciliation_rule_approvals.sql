-- Phase B: Reconciliation rule change approval workflow

CREATE TABLE IF NOT EXISTS public.reconciliation_rule_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  rule_id uuid NOT NULL REFERENCES public.reconciliation_rule_catalog(id) ON DELETE CASCADE,
  rule_code text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  proposed_name text,
  proposed_description text,
  proposed_config jsonb,
  proposed_active boolean,
  proposed_priority integer,
  previous_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  change_summary text,
  proposed_by uuid,
  reviewed_by uuid,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS reconciliation_rule_changes_one_pending_per_rule
  ON public.reconciliation_rule_changes (rule_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS reconciliation_rule_changes_tenant_status_idx
  ON public.reconciliation_rule_changes (tenant_id, status, created_at DESC);

-- Minimum role helper
CREATE OR REPLACE FUNCTION public.user_has_min_role(p_tenant_id uuid, p_min_role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.tenant_id = p_tenant_id
      AND CASE ur.role
        WHEN 'admin' THEN 4
        WHEN 'approver' THEN 3
        WHEN 'auditor' THEN 2
        WHEN 'viewer' THEN 1
        ELSE 0
      END >= CASE p_min_role
        WHEN 'admin' THEN 4
        WHEN 'approver' THEN 3
        WHEN 'auditor' THEN 2
        WHEN 'viewer' THEN 1
        ELSE 99
      END
  );
$$;

GRANT EXECUTE ON FUNCTION public.user_has_min_role(uuid, text) TO authenticated;

-- Approve pending change and publish to catalog
CREATE OR REPLACE FUNCTION public.approve_reconciliation_rule_change(
  p_change_id uuid,
  p_review_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_change public.reconciliation_rule_changes%ROWTYPE;
  v_rule public.reconciliation_rule_catalog%ROWTYPE;
BEGIN
  SELECT * INTO v_change
  FROM public.reconciliation_rule_changes
  WHERE id = p_change_id AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Change request not found or already processed';
  END IF;

  IF NOT public.user_has_min_role(v_change.tenant_id, 'approver') THEN
    RAISE EXCEPTION 'Approver or admin role required';
  END IF;

  UPDATE public.reconciliation_rule_catalog
  SET
    name = COALESCE(v_change.proposed_name, name),
    description = COALESCE(v_change.proposed_description, description),
    config = COALESCE(v_change.proposed_config, config),
    active = COALESCE(v_change.proposed_active, active),
    priority = COALESCE(v_change.proposed_priority, priority),
    version = version + 1,
    updated_by = auth.uid(),
    updated_at = now()
  WHERE id = v_change.rule_id
  RETURNING * INTO v_rule;

  UPDATE public.reconciliation_rule_changes
  SET
    status = 'approved',
    reviewed_by = auth.uid(),
    review_notes = p_review_notes,
    reviewed_at = now()
  WHERE id = p_change_id;

  INSERT INTO public.audit_log (tenant_id, user_id, action, resource_type, resource_id, metadata)
  VALUES (
    v_change.tenant_id,
    auth.uid(),
    'rule_change.approved',
    'reconciliation_rule',
    v_change.rule_code,
    jsonb_build_object(
      'change_id', p_change_id,
      'rule_id', v_change.rule_id,
      'new_version', v_rule.version,
      'review_notes', p_review_notes,
      'change_summary', v_change.change_summary
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'rule_code', v_change.rule_code,
    'version', v_rule.version
  );
END;
$$;

-- Reject pending change
CREATE OR REPLACE FUNCTION public.reject_reconciliation_rule_change(
  p_change_id uuid,
  p_review_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_change public.reconciliation_rule_changes%ROWTYPE;
BEGIN
  SELECT * INTO v_change
  FROM public.reconciliation_rule_changes
  WHERE id = p_change_id AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Change request not found or already processed';
  END IF;

  IF NOT public.user_has_min_role(v_change.tenant_id, 'approver') THEN
    RAISE EXCEPTION 'Approver or admin role required';
  END IF;

  UPDATE public.reconciliation_rule_changes
  SET
    status = 'rejected',
    reviewed_by = auth.uid(),
    review_notes = p_review_notes,
    reviewed_at = now()
  WHERE id = p_change_id;

  INSERT INTO public.audit_log (tenant_id, user_id, action, resource_type, resource_id, metadata)
  VALUES (
    v_change.tenant_id,
    auth.uid(),
    'rule_change.rejected',
    'reconciliation_rule',
    v_change.rule_code,
    jsonb_build_object(
      'change_id', p_change_id,
      'review_notes', p_review_notes,
      'change_summary', v_change.change_summary
    )
  );

  RETURN jsonb_build_object('success', true, 'rule_code', v_change.rule_code);
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_reconciliation_rule_change(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_reconciliation_rule_change(uuid, text) TO authenticated;

-- RLS: rule changes
ALTER TABLE public.reconciliation_rule_changes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant members view rule changes" ON public.reconciliation_rule_changes;
CREATE POLICY "Tenant members view rule changes"
ON public.reconciliation_rule_changes FOR SELECT TO authenticated
USING (public.user_has_tenant_access(tenant_id));

DROP POLICY IF EXISTS "Auditors propose rule changes" ON public.reconciliation_rule_changes;
CREATE POLICY "Auditors propose rule changes"
ON public.reconciliation_rule_changes FOR INSERT TO authenticated
WITH CHECK (
  public.user_has_min_role(tenant_id, 'auditor')
  AND proposed_by = auth.uid()
  AND status = 'pending'
);

DROP POLICY IF EXISTS "Proposer cancels own pending change" ON public.reconciliation_rule_changes;
CREATE POLICY "Proposer cancels own pending change"
ON public.reconciliation_rule_changes FOR UPDATE TO authenticated
USING (
  status = 'pending'
  AND proposed_by = auth.uid()
  AND public.user_has_tenant_access(tenant_id)
)
WITH CHECK (status = 'cancelled');

-- Restrict direct catalog edits to admin only (auditors use approval workflow)
DROP POLICY IF EXISTS "Auditors update rule catalog" ON public.reconciliation_rule_catalog;

DROP POLICY IF EXISTS "Admins direct update rule catalog" ON public.reconciliation_rule_catalog;
CREATE POLICY "Admins direct update rule catalog"
ON public.reconciliation_rule_catalog FOR UPDATE TO authenticated
USING (public.user_is_tenant_admin(tenant_id))
WITH CHECK (public.user_is_tenant_admin(tenant_id));

GRANT SELECT, INSERT, UPDATE ON public.reconciliation_rule_changes TO authenticated;

-- Allow authenticated users to write audit entries for their tenant
DROP POLICY IF EXISTS "Tenant members insert audit log" ON public.audit_log;
CREATE POLICY "Tenant members insert audit log"
ON public.audit_log FOR INSERT TO authenticated
WITH CHECK (tenant_id IS NULL OR public.user_has_tenant_access(tenant_id));

GRANT INSERT ON public.audit_log TO authenticated;

NOTIFY pgrst, 'reload schema';
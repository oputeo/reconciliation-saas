-- Run in Supabase SQL Editor after core ReconFlow bootstrap
-- Adds biweekly frequency + SmartDelta Delta tenant

ALTER TABLE public.ingest_schedules DROP CONSTRAINT IF EXISTS ingest_schedules_frequency_check;
ALTER TABLE public.ingest_schedules ADD CONSTRAINT ingest_schedules_frequency_check
  CHECK (frequency IN ('hourly', 'daily', 'weekly', 'biweekly'));

INSERT INTO public.tenants (id, name, slug, billing_email, plan, settings)
VALUES (
  '8f3e2a1b-4c5d-6e7f-8a9b-0c1d2e3f4a5b',
  'SmartDelta Waste - Delta State',
  'smartdelta-delta',
  'support@smartdelta.ng',
  'professional',
  jsonb_build_object(
    'reconciliation', jsonb_build_object('current_audit_year', 2026, 'fuzzy_tolerance_ngn', 50),
    'integrations', jsonb_build_object('smartdelta_api_url', 'https://smartdelta-waste-delta-api-production.up.railway.app')
  )
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, updated_at = now();

SELECT seed_reconciliation_rule_catalog('8f3e2a1b-4c5d-6e7f-8a9b-0c1d2e3f4a5b');

INSERT INTO public.ingest_schedules (tenant_id, name, report_type, source_type, frequency, auto_reconcile, next_run_at, enabled)
SELECT '8f3e2a1b-4c5d-6e7f-8a9b-0c1d2e3f4a5b', 'SmartDelta Bi-weekly Reconcile', 'qr_payment', 'api', 'biweekly', true, now() + interval '14 days', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.ingest_schedules WHERE tenant_id = '8f3e2a1b-4c5d-6e7f-8a9b-0c1d2e3f4a5b' AND name = 'SmartDelta Bi-weekly Reconcile'
);

SELECT id, name, slug FROM public.tenants WHERE slug = 'smartdelta-delta';
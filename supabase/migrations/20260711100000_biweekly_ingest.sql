-- Bi-weekly ingest frequency + SmartDelta tenant scaffold

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
    'notifications', jsonb_build_object('email_alerts', true, 'anomaly_threshold', 85, 'daily_digest', true),
    'reconciliation', jsonb_build_object(
      'default_tolerance', 2.0,
      'auto_resolve_low_risk', false,
      'default_channel', 'ALL',
      'fuzzy_tolerance_ngn', 50,
      'high_value_threshold_ngn', 500000,
      'current_audit_year', 2026,
      'back_audit_years', 10
    ),
    'integrations', jsonb_build_object(
      'smartdelta_api_url', 'https://smartdelta-waste-delta-api-production.up.railway.app',
      'webhook_url', null
    )
  )
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  billing_email = EXCLUDED.billing_email,
  updated_at = now();

INSERT INTO public.ingest_schedules (
  tenant_id, name, report_type, source_type, frequency, auto_reconcile, config, next_run_at, enabled
)
SELECT
  '8f3e2a1b-4c5d-6e7f-8a9b-0c1d2e3f4a5b',
  'SmartDelta Bi-weekly Platform Ingest',
  'qr_payment',
  'api',
  'biweekly',
  true,
  jsonb_build_object(
    'smartdelta_export_url', '/api/finance/recon-export',
    'stream', 'gross'
  ),
  now() + interval '14 days',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.ingest_schedules s
  WHERE s.tenant_id = '8f3e2a1b-4c5d-6e7f-8a9b-0c1d2e3f4a5b'
    AND s.name = 'SmartDelta Bi-weekly Platform Ingest'
);
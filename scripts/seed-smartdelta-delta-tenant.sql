-- Run in Supabase SQL Editor after RUN_THIS_IN_SQL_EDITOR.sql + RUN_RECONCILIATION_RULES.sql
-- Creates SmartDelta Waste - Delta State tenant + bi-weekly ingest schedule

\i ../supabase/migrations/20260711100000_biweekly_ingest.sql

-- Seed reconciliation rules for SmartDelta tenant
SELECT public.seed_reconciliation_rule_catalog('8f3e2a1b-4c5d-6e7f-8a9b-0c1d2e3f4a5b');

-- After running scripts/setup-smartdelta-delta-tenant.mjs, paste ingest key into SmartDelta API env:
-- RECONFLOW_TENANT_ID=8f3e2a1b-4c5d-6e7f-8a9b-0c1d2e3f4a5b
-- RECONFLOW_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
-- RECONFLOW_INGEST_KEY=rf_...

SELECT id, name, slug FROM public.tenants WHERE slug = 'smartdelta-delta';
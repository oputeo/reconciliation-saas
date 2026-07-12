-- ============================================================
-- ReconFlow: CLEAN SLATE for SmartDelta Waste - Delta State
-- Run in Supabase SQL Editor BEFORE fresh upload + BW06-2026 recon
-- Dashboard: https://supabase.com/dashboard/project/dfefeuxkhhvsiuluizzn/sql
-- ============================================================
-- Tenant: SmartDelta Waste - Delta State
-- ID:    8f3e2a1b-4c5d-6e7f-8a9b-0c1d2e3f4a5b
--
-- KEEPS: tenants, user_roles, reconciliation rules, ingest keys, schedules
-- CLEARS: ledger, uploads, anomalies, runs, back-audit (demo data only)
-- ============================================================

BEGIN;

-- 1. Dependent rows first
DELETE FROM public.anomalies
WHERE tenant_id = '8f3e2a1b-4c5d-6e7f-8a9b-0c1d2e3f4a5b';

DELETE FROM public.revenue_recovery_audit
WHERE tenant_id = '8f3e2a1b-4c5d-6e7f-8a9b-0c1d2e3f4a5b';

-- Optional: pending rule-change workflow (safe to clear for demo)
DELETE FROM public.reconciliation_rule_changes
WHERE tenant_id = '8f3e2a1b-4c5d-6e7f-8a9b-0c1d2e3f4a5b';

-- 2. Core ledger + upload history
DELETE FROM public.master_ledger
WHERE tenant_id = '8f3e2a1b-4c5d-6e7f-8a9b-0c1d2e3f4a5b';

DELETE FROM public.uploads
WHERE tenant_id = '8f3e2a1b-4c5d-6e7f-8a9b-0c1d2e3f4a5b';

-- 3. Ingest + reconciliation run history
DELETE FROM public.ingest_runs
WHERE tenant_id = '8f3e2a1b-4c5d-6e7f-8a9b-0c1d2e3f4a5b';

DELETE FROM public.back_audit_jobs
WHERE tenant_id = '8f3e2a1b-4c5d-6e7f-8a9b-0c1d2e3f4a5b';

DELETE FROM public.reconciliation_runs
WHERE tenant_id = '8f3e2a1b-4c5d-6e7f-8a9b-0c1d2e3f4a5b';

-- Optional: clear audit trail so Upload history is empty in UI
DELETE FROM public.audit_log
WHERE tenant_id = '8f3e2a1b-4c5d-6e7f-8a9b-0c1d2e3f4a5b';

COMMIT;

-- ============================================================
-- VERIFY (all counts should be 0)
-- ============================================================
SELECT 'anomalies' AS table_name, COUNT(*) AS rows
FROM public.anomalies WHERE tenant_id = '8f3e2a1b-4c5d-6e7f-8a9b-0c1d2e3f4a5b'
UNION ALL
SELECT 'master_ledger', COUNT(*) FROM public.master_ledger
WHERE tenant_id = '8f3e2a1b-4c5d-6e7f-8a9b-0c1d2e3f4a5b'
UNION ALL
SELECT 'uploads', COUNT(*) FROM public.uploads
WHERE tenant_id = '8f3e2a1b-4c5d-6e7f-8a9b-0c1d2e3f4a5b'
UNION ALL
SELECT 'ingest_runs', COUNT(*) FROM public.ingest_runs
WHERE tenant_id = '8f3e2a1b-4c5d-6e7f-8a9b-0c1d2e3f4a5b'
UNION ALL
SELECT 'reconciliation_runs', COUNT(*) FROM public.reconciliation_runs
WHERE tenant_id = '8f3e2a1b-4c5d-6e7f-8a9b-0c1d2e3f4a5b'
UNION ALL
SELECT 'back_audit_jobs', COUNT(*) FROM public.back_audit_jobs
WHERE tenant_id = '8f3e2a1b-4c5d-6e7f-8a9b-0c1d2e3f4a5b';
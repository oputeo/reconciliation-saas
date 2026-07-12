-- Run in Supabase SQL Editor after Phase 3 ingest tables exist
-- Enables per-upload delete and failed upload logging

ALTER TABLE public.master_ledger
  ADD COLUMN IF NOT EXISTS ingest_run_id uuid REFERENCES public.ingest_runs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS master_ledger_ingest_run_idx
  ON public.master_ledger (tenant_id, ingest_run_id)
  WHERE ingest_run_id IS NOT NULL;

ALTER TABLE public.uploads
  ADD COLUMN IF NOT EXISTS ingest_run_id uuid REFERENCES public.ingest_runs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS error_message text;

ALTER TABLE public.ingest_runs DROP CONSTRAINT IF EXISTS ingest_runs_status_check;
ALTER TABLE public.ingest_runs ADD CONSTRAINT ingest_runs_status_check
  CHECK (status IN ('running', 'completed', 'failed', 'skipped', 'rolled_back'));

NOTIFY pgrst, 'reload schema';
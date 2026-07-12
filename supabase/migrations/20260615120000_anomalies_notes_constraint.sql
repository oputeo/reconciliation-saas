-- Align anomalies table with reconciliation engine + UI expectations.

ALTER TABLE public.anomalies
  ADD COLUMN IF NOT EXISTS notes text;

COMMENT ON COLUMN public.anomalies.notes IS 'Investigation notes and rule tags (e.g. rule:EXC_UNMATCHED).';

-- Idempotent upserts per workspace.
CREATE UNIQUE INDEX IF NOT EXISTS anomalies_tenant_anomaly_id_uidx
  ON public.anomalies (tenant_id, anomaly_id);
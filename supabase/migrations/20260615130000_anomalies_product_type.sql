ALTER TABLE public.anomalies
  ADD COLUMN IF NOT EXISTS product_type text;

COMMENT ON COLUMN public.anomalies.product_type IS 'Ledger product/channel (pos, wallet, card, bank_transfer, etc.).';

CREATE INDEX IF NOT EXISTS anomalies_tenant_type_idx
  ON public.anomalies (tenant_id, type);

CREATE INDEX IF NOT EXISTS anomalies_tenant_product_idx
  ON public.anomalies (tenant_id, product_type);
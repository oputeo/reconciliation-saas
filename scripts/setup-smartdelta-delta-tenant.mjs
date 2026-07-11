#!/usr/bin/env node
/**
 * Create SmartDelta Delta ingest API key in ReconFlow (Supabase).
 * Usage:
 *   RECONFLOW_SUPABASE_URL=... RECONFLOW_SERVICE_ROLE_KEY=... node scripts/setup-smartdelta-delta-tenant.mjs
 */

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const TENANT_ID = '8f3e2a1b-4c5d-6e7f-8a9b-0c1d2e3f4a5b';
const TENANT_NAME = 'SmartDelta Waste - Delta State';

const url = process.env.RECONFLOW_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.RECONFLOW_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Set RECONFLOW_SUPABASE_URL and RECONFLOW_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

function hashKey(apiKey) {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

async function main() {
  const { data: tenant, error: tenantErr } = await supabase
    .from('tenants')
    .upsert({
      id: TENANT_ID,
      name: TENANT_NAME,
      slug: 'smartdelta-delta',
      billing_email: 'support@smartdelta.ng',
      plan: 'professional',
      settings: {
        reconciliation: {
          current_audit_year: 2026,
          fuzzy_tolerance_ngn: 50,
          high_value_threshold_ngn: 500000,
        },
        integrations: {
          smartdelta_api_url: 'https://smartdelta-waste-delta-api-production.up.railway.app',
        },
      },
    }, { onConflict: 'id' })
    .select('id, name, slug')
    .single();

  if (tenantErr) throw tenantErr;
  console.log('Tenant:', tenant);

  const apiKey = `rf_sd_${crypto.randomBytes(24).toString('hex')}`;
  const prefix = apiKey.slice(0, 12);
  const keyHash = hashKey(apiKey);

  const { error: keyErr } = await supabase.from('tenant_ingest_keys').insert({
    tenant_id: TENANT_ID,
    name: 'SmartDelta API Push',
    key_prefix: prefix,
    key_hash: keyHash,
    active: true,
  });

  if (keyErr) throw keyErr;

  console.log('\n=== Add to SmartDelta API (Railway) ===');
  console.log(`RECONFLOW_SUPABASE_URL=${url}`);
  console.log(`RECONFLOW_TENANT_ID=${TENANT_ID}`);
  console.log(`RECONFLOW_INGEST_KEY=${apiKey}`);
  console.log('\nStore the ingest key securely — it is shown once.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
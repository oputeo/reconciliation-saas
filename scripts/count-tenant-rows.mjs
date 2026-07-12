#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = Object.fromEntries(
  fs.readFileSync(path.join(root, '.env.local'), 'utf8').split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const sb = createClient(env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const tenants = [
  ['SmartDelta', '8f3e2a1b-4c5d-6e7f-8a9b-0c1d2e3f4a5b'],
  ['OEO Demo', '0771c1a1-4ff0-46a1-9f98-c6b30fdff049'],
];
const tables = ['master_ledger', 'anomalies', 'uploads', 'ingest_runs', 'reconciliation_runs'];
for (const [name, tid] of tenants) {
  console.log('\n' + name + ' (' + tid + ')');
  for (const t of tables) {
    const { count } = await sb.from(t).select('*', { count: 'exact', head: true }).eq('tenant_id', tid);
    console.log('  ' + t + ': ' + (count ?? 0));
  }
}
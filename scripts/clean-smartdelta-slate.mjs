#!/usr/bin/env node
/**
 * Clean SmartDelta tenant demo data in ReconFlow (Supabase).
 * Usage: node scripts/clean-smartdelta-slate.mjs [--dry-run]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env.local');

const TENANT_ID = '8f3e2a1b-4c5d-6e7f-8a9b-0c1d2e3f4a5b';
const DRY_RUN = process.argv.includes('--dry-run');

const env = Object.fromEntries(
  fs
    .readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      let val = l.slice(i + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      return [l.slice(0, i).trim(), val];
    }),
);

const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TABLES_IN_ORDER = [
  'anomalies',
  'revenue_recovery_audit',
  'reconciliation_rule_changes',
  'master_ledger',
  'uploads',
  'ingest_runs',
  'back_audit_jobs',
  'reconciliation_runs',
  'audit_log',
];

async function countTable(table) {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', TENANT_ID);
  if (error) return { error: error.message };
  return { count: count ?? 0 };
}

async function deleteTable(table) {
  const { error } = await supabase.from(table).delete().eq('tenant_id', TENANT_ID);
  if (error) throw new Error(`${table}: ${error.message}`);
}

async function main() {
  console.log(`SmartDelta clean slate | tenant ${TENANT_ID}`);
  console.log(DRY_RUN ? 'MODE: dry-run (counts only)' : 'MODE: DELETE');

  console.log('\nBEFORE:');
  for (const table of TABLES_IN_ORDER) {
    const r = await countTable(table);
    console.log(`  ${table}: ${r.error ?? r.count}`);
  }

  if (DRY_RUN) {
    console.log('\nDry-run complete. Re-run without --dry-run to delete.');
    return;
  }

  console.log('\nDELETING...');
  for (const table of TABLES_IN_ORDER) {
    await deleteTable(table);
    console.log(`  cleared ${table}`);
  }

  console.log('\nAFTER:');
  for (const table of TABLES_IN_ORDER) {
    const r = await countTable(table);
    console.log(`  ${table}: ${r.error ?? r.count}`);
  }

  console.log('\nDone. Refresh ReconFlow UI — Master ledger should show 0.');
}

main().catch((err) => {
  console.error('FAILED:', err.message);
  process.exit(1);
});
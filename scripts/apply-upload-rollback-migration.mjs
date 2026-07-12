#!/usr/bin/env node
/**
 * Apply ingest_run_id migration via Supabase service role.
 * Usage: node scripts/apply-upload-rollback-migration.mjs
 */
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

const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sql = fs.readFileSync(path.join(root, 'supabase/RUN_UPLOAD_ROLLBACK.sql'), 'utf8');
const statements = sql
  .split(';')
  .map((s) => s.trim())
  .filter((s) => s && !s.startsWith('--') && s !== 'NOTIFY pgrst, \'reload schema\'');

const sb = createClient(url, key);
for (const statement of statements) {
  const { error } = await sb.rpc('exec_sql', { query: statement });
  if (error) {
    console.log('rpc exec_sql unavailable, run RUN_UPLOAD_ROLLBACK.sql in Supabase SQL Editor.');
    console.error(error.message);
    process.exit(1);
  }
  console.log('OK:', statement.slice(0, 60).replace(/\s+/g, ' ') + '…');
}
console.log('Migration applied.');
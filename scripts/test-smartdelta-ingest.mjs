#!/usr/bin/env node
/**
 * Test ingest + reconciliation for SmartDelta demo (step 4 smoke test).
 * Usage:
 *   RECONFLOW_INGEST_KEY=rf_sd_... node scripts/test-smartdelta-ingest.mjs
 */

import fs from 'fs';
import path from 'path';

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(',');
  return lines.slice(1).map((line) => {
    const vals = line.split(',');
    const row = {};
    headers.forEach((h, i) => { row[h] = vals[i] ?? ''; });
    return row;
  });
}

const SUPABASE_URL = process.env.RECONFLOW_SUPABASE_URL || process.env.SUPABASE_URL;
const INGEST_KEY = process.env.RECONFLOW_INGEST_KEY;
const TENANT_ID = process.env.RECONFLOW_TENANT_ID || '8f3e2a1b-4c5d-6e7f-8a9b-0c1d2e3f4a5b';
const CHUNK_DIR = process.env.SMARTDELTA_CHUNK_DIR || String.raw`C:\ReconFlow-TestData\SmartDelta-Delta\upload_ready\chunks_platform`;
const ROW_LIMIT = parseInt(process.env.ROW_LIMIT || '50', 10);

if (!SUPABASE_URL || !INGEST_KEY) {
  console.error('Set RECONFLOW_SUPABASE_URL and RECONFLOW_INGEST_KEY');
  process.exit(1);
}

const base = SUPABASE_URL.replace(/\/$/, '');

function readChunkRows(limit) {
  const files = fs.readdirSync(CHUNK_DIR).filter((f) => f.endsWith('.csv')).sort();
  if (!files.length) throw new Error(`No CSV in ${CHUNK_DIR}`);
  const csv = fs.readFileSync(path.join(CHUNK_DIR, files[0]), 'utf8');
  const rows = parseCsv(csv);
  return rows.slice(0, limit);
}

async function ingest(rows, reportSide) {
  const res = await fetch(`${base}/functions/v1/ingest-report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-ingest-key': INGEST_KEY,
    },
    body: JSON.stringify({
      tenant_id: TENANT_ID,
      report_type: 'qr_payment',
      report_side: reportSide,
      rows,
    }),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) throw new Error(`Ingest ${reportSide} failed (${res.status}): ${text.slice(0, 300)}`);
  return data;
}

async function reconcile() {
  const res = await fetch(`${base}/functions/v1/run-reconciliation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-ingest-key': INGEST_KEY,
    },
    body: JSON.stringify({
      tenant_id: TENANT_ID,
      period: 'biweekly',
      biweek_period: 'BW06-2026',
      year: 2026,
    }),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { status: res.status, data };
}

async function main() {
  const platformRows = readChunkRows(ROW_LIMIT);
  console.log(`Testing with ${platformRows.length} platform rows from first chunk...`);

  const platform = await ingest(platformRows, 'internal');
  console.log('Platform ingest:', platform);

  const settlementDir = CHUNK_DIR.replace('chunks_platform', 'chunks_settlement');
  if (fs.existsSync(settlementDir)) {
    const stlFile = fs.readdirSync(settlementDir).filter((f) => f.endsWith('.csv')).sort()[0];
    const stlRows = parseCsv(fs.readFileSync(path.join(settlementDir, stlFile), 'utf8')).slice(0, ROW_LIMIT);
    const settlement = await ingest(stlRows, 'settlement');
    console.log('Settlement ingest:', settlement);
  }

  const recon = await reconcile();
  console.log('Reconciliation:', recon.status, recon.data);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
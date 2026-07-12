/**
 * Run reconciliation engine against rules_test_pack CSVs and report matched_rule_code.
 * Usage: node scripts/verify_rules_test_pack.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PACK_DIR = 'C:\\ReconFlow-TestData\\upload_ready\\rules_test_pack';

const engineUrl = pathToFileURL(
  path.join(ROOT, 'supabase/functions/_shared/reconciliationEngine.ts'),
).href;
const rulesUrl = pathToFileURL(
  path.join(ROOT, 'supabase/functions/_shared/reconciliationRules.ts'),
).href;

const { runReconciliation } = await import(engineUrl);
const { DEFAULT_RECONCILIATION_RULES, DEFAULT_TENANT_RECONCILIATION } = await import(rulesUrl);

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(',');
  return lines.slice(1).filter(Boolean).map((line) => {
    const values = line.split(',');
    const row = {};
    headers.forEach((h, i) => {
      row[h] = values[i] ?? '';
    });
    return row;
  });
}

function toLedger(row, idx, status) {
  const amount = Number(row.amount);
  const fee = row.fee ? Number(row.fee) : 0;
  const productType = row.product_type || '';
  const channelCode = (row.channel_code || '').toLowerCase();
  // Engine resolves channel from product_type + source; fold channel_code into product_type when helpful.
  const enrichedProduct =
    channelCode && !productType.toLowerCase().includes(channelCode.replace('mp_', ''))
      ? `${productType} ${channelCode}`
      : productType;

  return {
    id: `id-${row.transaction_id || idx}`,
    transaction_id: row.transaction_id || `TX-${idx}`,
    reference: row.reference || null,
    amount: Number.isFinite(amount) ? amount : 0,
    fee: Number.isFinite(fee) ? fee : 0,
    product_type: enrichedProduct,
    source: row.source || 'bulk_upload',
    transaction_date: row.transaction_date || '2026-01-01',
    status,
  };
}

function expectedRuleFromFilename(filename) {
  const m = filename.match(/^rule_(.+)_sample\.csv$/i);
  if (!m) return null;
  return m[1].toUpperCase().replace(/-/g, '_');
}

function summarizePack(filename) {
  const fullPath = path.join(PACK_DIR, filename);
  const rows = parseCsv(fs.readFileSync(fullPath, 'utf8'));
  const pending = [];
  const pool = [];

  rows.forEach((row, idx) => {
    const source = (row.source || '').toLowerCase();
    if (source === 'bank_settlement') {
      pool.push(toLedger(row, idx, 'settled'));
    } else {
      pending.push(toLedger(row, idx, 'pending'));
    }
  });

  const outcome = runReconciliation(pending, pool, {
    rules: DEFAULT_RECONCILIATION_RULES,
    tenantSettings: { reconciliation: DEFAULT_TENANT_RECONCILIATION },
  });

  const ruleCounts = {};
  const statusCounts = { matched: 0, unmatched: 0 };
  for (const u of outcome.updates) {
    const code = u.matched_rule_code || '(none)';
    ruleCounts[code] = (ruleCounts[code] || 0) + 1;
    statusCounts[u.status] = (statusCounts[u.status] || 0) + 1;
  }

  const anomalyRules = {};
  for (const a of outcome.anomalies) {
    anomalyRules[a.rule_code] = (anomalyRules[a.rule_code] || 0) + 1;
  }

  return {
    filename,
    expected: expectedRuleFromFilename(filename),
    pending: pending.length,
    pool: pool.length,
    matched: outcome.matched,
    unmatched: outcome.unmatched,
    matchRate: outcome.matchRate,
    ruleCounts,
    anomalyRules,
    samples: outcome.updates.slice(0, 3).map((u) => ({
      id: u.id,
      status: u.status,
      matched_rule_code: u.matched_rule_code,
      match_score: u.match_score,
    })),
  };
}

const files = fs
  .readdirSync(PACK_DIR)
  .filter((f) => f.endsWith('.csv'))
  .sort();

const results = files.map(summarizePack);

console.log('\n=== Rules Test Pack Verification ===\n');
console.log(
  'Pack'.padEnd(42),
  'Expected'.padEnd(28),
  'Match%'.padStart(6),
  '  Actual rule codes (pending rows)',
);
console.log('-'.repeat(110));

for (const r of results) {
  const codes = Object.entries(r.ruleCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}:${v}`)
    .join(', ');
  const expected = r.expected || '?';
  const primary = Object.keys(r.ruleCounts).sort((a, b) => r.ruleCounts[b] - r.ruleCounts[a])[0];
  const ok =
    r.unmatched > 0 && r.ruleCounts[expected]
      ? r.ruleCounts[expected] === r.unmatched
      : r.matched > 0 && primary === expected;

  console.log(
    r.filename.padEnd(42),
    expected.padEnd(28),
    String(r.matchRate).padStart(5) + '%',
    `  ${codes || '(no updates)'}`,
    ok ? '✓' : '⚠',
  );
}

console.log('\n=== Detail (samples) ===\n');
for (const r of results) {
  console.log(`--- ${r.filename} (expected: ${r.expected}) ---`);
  console.log(`  pending=${r.pending}, pool=${r.pool}, matched=${r.matched}, unmatched=${r.unmatched}`);
  console.log(`  ruleCounts:`, r.ruleCounts);
  if (Object.keys(r.anomalyRules).length) console.log(`  anomalyRules:`, r.anomalyRules);
  console.log(`  samples:`, r.samples);
  console.log('');
}
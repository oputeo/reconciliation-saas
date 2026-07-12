/**
 * Backfill anomalies for unmatched master_ledger rows that have no anomaly yet.
 * Usage: node scripts/backfill_anomalies.mjs [tenant_id]
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function loadEnv() {
  const candidates = ['.env.local', '.env'];
  for (const file of candidates) {
    try {
      const raw = readFileSync(resolve(root, file), 'utf8').replace(/^\uFEFF/, '');
      for (const line of raw.split(/\r?\n/)) {
        const m = line.match(/^([^#=]+)=(.*)$/);
        if (m) process.env[m[1].trim()] = m[2].trim();
      }
      return;
    } catch {
      // try next file
    }
  }
}

loadEnv();

const tenantId = process.argv[2] || '0771c1a1-4ff0-46a1-9f98-c6b30fdff049';
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

function inferChannel(transactionId, reference) {
  const tx = String(transactionId ?? '').trim();
  const txMatch = tx.match(/^TX-([a-z0-9_]+)-/i);
  if (txMatch?.[1]) {
    return txMatch[1].replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
  const ref = String(reference ?? '').trim();
  const refMatch = ref.match(/^([A-Za-z]+)-/);
  if (refMatch?.[1] && refMatch[1].length >= 2) {
    const raw = refMatch[1];
    return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  }
  return null;
}

function severityForAmount(amount) {
  const abs = Math.abs(Number(amount));
  if (abs >= 1_000_000) return 'High';
  if (abs >= 100_000) return 'Medium';
  return 'Low';
}

async function main() {
  const { data: unmatched, error } = await supabase
    .from('master_ledger')
    .select('id, transaction_id, transaction_date, amount, matched_rule_code, reference, product_type')
    .eq('tenant_id', tenantId)
    .eq('status', 'unmatched');

  if (error) throw error;
  if (!unmatched?.length) {
    console.log('No unmatched ledger rows to backfill.');
    return;
  }

  const rows = unmatched.map((row) => {
    const ruleCode = row.matched_rule_code || 'EXC_UNMATCHED';
    const ruleTag = `rule:${ruleCode}`;
    return {
      tenant_id: tenantId,
      anomaly_id: `AN-${row.transaction_id}`,
      date: String(row.transaction_date).slice(0, 10),
      bank: inferChannel(row.transaction_id, row.reference),
      type: 'Unmatched Transaction',
      variance: Number(row.amount ?? 0),
      severity: severityForAmount(row.amount),
      status: 'Open',
      description: `Unmatched transaction ${row.transaction_id}`,
      root_cause: 'No matching rule found a counterpart in the ledger pool',
      suggested_action: ruleTag,
      notes: ruleTag,
      ledger_id: row.id,
      created_at: new Date().toISOString(),
    };
  });

  const chunkSize = 200;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error: upsertError } = await supabase
      .from('anomalies')
      .upsert(chunk, { onConflict: 'tenant_id,anomaly_id', ignoreDuplicates: false });
    if (upsertError) throw upsertError;
    inserted += chunk.length;
    console.log(`Upserted ${inserted}/${rows.length}`);
  }

  console.log(`Backfill complete: ${rows.length} anomalies for tenant ${tenantId}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
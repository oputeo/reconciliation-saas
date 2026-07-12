/**
 * Sync audit_flag / audit_score from reconciliation match_score + status.
 * Usage: node scripts/backfill_audit_scores.mjs [tenant_id]
 */
import { createClient } from '@supabase/supabase-js';

const tenantId = process.argv[2] || '0771c1a1-4ff0-46a1-9f98-c6b30fdff049';
const THRESHOLD = 70;

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://dfefeuxkhhvsiuluizzn.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function main() {
  let from = 0;
  const pageSize = 1000;
  let updated = 0;

  while (true) {
    const { data: rows, error } = await supabase
      .from('master_ledger')
      .select('id, status, match_score')
      .eq('tenant_id', tenantId)
      .in('status', ['matched', 'unmatched'])
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (!rows?.length) break;

    for (const row of rows) {
    const score = Number(row.match_score ?? 0);
    const audit_flag = row.status === 'unmatched' ||
      (row.status === 'matched' && score < THRESHOLD);
    const { error: updateError } = await supabase
      .from('master_ledger')
      .update({ audit_score: score, audit_flag })
      .eq('id', row.id);
    if (updateError) throw updateError;
    updated++;
    if (updated % 200 === 0) console.log(`Updated ${updated}...`);
    }
    if (rows.length < pageSize) break;
    from += pageSize;
  }

  console.log(`Backfilled audit_score/audit_flag on ${updated} rows.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
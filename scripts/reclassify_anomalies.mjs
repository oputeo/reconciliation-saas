/**
 * Reclassify anomalies from master_ledger matched_rule_code + product_type.
 * Usage: node scripts/reclassify_anomalies.mjs [tenant_id]
 */
import { createClient } from '@supabase/supabase-js';
import {
  formatProductLabel,
  rootCauseForType,
  ruleCodeToAnomalyType,
  severityForAmount,
} from './anomalyTypes.mjs';

const tenantId = process.argv[2] || '0771c1a1-4ff0-46a1-9f98-c6b30fdff049';
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://dfefeuxkhhvsiuluizzn.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function main() {
  const { data: anomalies, error } = await supabase
    .from('anomalies')
    .select('id, anomaly_id, ledger_id, type, notes, suggested_action')
    .eq('tenant_id', tenantId);

  if (error) throw error;
  if (!anomalies?.length) {
    console.log('No anomalies to reclassify.');
    return;
  }

  const ledgerIds = anomalies.map((a) => a.ledger_id).filter(Boolean);
  const { data: ledgerRows } = await supabase
    .from('master_ledger')
    .select('id, transaction_id, amount, fee, product_type, reference, matched_rule_code, source')
    .in('id', ledgerIds.length ? ledgerIds : ['00000000-0000-0000-0000-000000000000']);

  const ledgerById = new Map((ledgerRows ?? []).map((r) => [r.id, r]));

  const typeCounts = {};
  let updated = 0;

  for (const anomaly of anomalies) {
    const ledger = anomaly.ledger_id ? ledgerById.get(anomaly.ledger_id) : null;
    const ruleTag = anomaly.notes || anomaly.suggested_action || '';
    const ruleCode = ledger?.matched_rule_code
      || (ruleTag.startsWith('rule:') ? ruleTag.slice(5) : null)
      || 'EXC_UNMATCHED';

    const missingReference = Boolean(ledger && !String(ledger.reference ?? '').trim());
    const type = ruleCodeToAnomalyType(ruleCode, { missingReference });
    const product_type = ledger?.product_type ?? null;
    const variance = Number(ledger?.amount ?? 0);
    const severity = severityForAmount(variance);
    const root_cause = rootCauseForType(type, {
      ruleCode,
      fee: ledger?.fee,
      transactionId: ledger?.transaction_id,
    });

    typeCounts[type] = (typeCounts[type] || 0) + 1;

    const { error: updateError } = await supabase
      .from('anomalies')
      .update({
        type,
        product_type,
        severity,
        root_cause,
        description: `${type} — ${formatProductLabel(product_type)} (${ledger?.transaction_id || anomaly.anomaly_id.replace('AN-', '')})`,
        suggested_action: `rule:${ruleCode}`,
        notes: `rule:${ruleCode}`,
      })
      .eq('id', anomaly.id);

    if (updateError) throw updateError;
    updated++;
  }

  console.log(`Reclassified ${updated} anomalies.`);
  console.log('Type breakdown:', typeCounts);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
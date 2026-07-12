/**
 * Seed curated demo anomalies across products & exception types (client showcase).
 * Usage: node scripts/seed_demo_anomalies.mjs [tenant_id]
 */
import { createClient } from '@supabase/supabase-js';
import { rootCauseForType, severityForAmount } from './anomalyTypes.mjs';

const tenantId = process.argv[2] || '0771c1a1-4ff0-46a1-9f98-c6b30fdff049';
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://dfefeuxkhhvsiuluizzn.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

/** Showcase rows inspired by multi-product ledger patterns (Partner Bank / Gateway / Internal). */
const DEMO_ROWS = [
  { tx: 'TXN-00000244', product: 'card', bank: 'Partner Bank', type: 'Reversal Without Refund', rule: 'EXC_REVERSED_NOT_REFUNDED', amount: 137964.94, date: '2026-05-15', source: 'Partner Bank' },
  { tx: 'TXN-00000839', product: 'wallet', bank: 'Payment Gateway', type: 'Fee Leakage', rule: 'EXC_FEE_LEAKAGE', amount: 2141.61, fee: 1407.27, date: '2026-03-11', source: 'Payment Gateway' },
  { tx: 'TXN-00001982', product: 'ussd', bank: 'Internal', type: 'Reversal Without Refund', rule: 'EXC_REVERSED_NOT_REFUNDED', amount: 93665.26, date: '2026-03-31', source: 'Internal' },
  { tx: 'TXN-00001547', product: 'pos', bank: 'Internal', type: 'Reversal Without Refund', rule: 'EXC_REVERSED_NOT_REFUNDED', amount: 142900.27, date: '2026-04-15', source: 'Internal' },
  { tx: 'TXN-00001858', product: 'card', bank: 'Payment Gateway', type: 'Unmatched Transaction', rule: 'EXC_UNMATCHED', amount: 76558.57, date: '2026-05-03', source: 'Payment Gateway' },
  { tx: 'TXN-00002102', product: 'bank_transfer', bank: 'Payment Gateway', type: 'Unmatched Transaction', rule: 'EXC_UNMATCHED', amount: 147390.95, date: '2026-04-08', source: 'Payment Gateway' },
  { tx: 'TXN-00001161', product: 'pos', bank: 'Partner Bank', type: 'Fee Leakage', rule: 'EXC_FEE_LEAKAGE', amount: 8321.09, fee: 1374.06, date: '2026-03-13', source: 'Partner Bank' },
  { tx: 'TXN-00002444', product: 'ussd', bank: 'Internal', type: 'Missing Reference', rule: 'EXC_UNMATCHED', amount: 7412.11, date: '2026-03-04', source: 'Internal', ref: null },
  { tx: 'TXN-00000650', product: 'card', bank: 'Partner Bank', type: 'Duplicate Transaction', rule: 'MATCH_SAME_DAY_DUPLICATE', amount: 142705.72, date: '2026-04-04', source: 'Partner Bank' },
  { tx: 'TXN-00002009', product: 'wallet', bank: 'Partner Bank', type: 'Duplicate Transaction', rule: 'MATCH_SAME_DAY_DUPLICATE', amount: 118143.56, date: '2026-04-07', source: 'Partner Bank' },
  { tx: 'TXN-00001692', product: 'bank_transfer', bank: 'Internal', type: 'Double Posting', rule: 'EXC_DOUBLE_POSTING', amount: 114879.49, date: '2026-04-20', source: 'Internal' },
  { tx: 'TXN-00001345', product: 'bank_transfer', bank: 'Payment Gateway', type: 'Double Posting', rule: 'EXC_DOUBLE_POSTING', amount: 108811.11, date: '2026-04-28', source: 'Payment Gateway' },
  { tx: 'TXN-DEMO-GTW-001', product: 'gateway', bank: 'Monnify', type: 'Fee Assurance Variance', rule: 'EXC_FEE_LEAKAGE', amount: 520000, fee: 42000, date: '2026-05-15', source: 'Payment Gateway' },
  { tx: 'TXN-DEMO-POS-002', product: 'pos', bank: 'Moniepoint', type: 'Volume Spike', rule: 'ADV_ANOMALY_SPIKE', amount: 8900000, date: '2026-05-15', source: 'Internal' },
  { tx: 'TXN-DEMO-PAY-003', product: 'bulk_payout', bank: 'GTBank', type: 'High-Value Unmatched', rule: 'EXC_HIGH_VALUE', amount: 12500000, date: '2026-04-22', source: 'Internal' },
  { tx: 'TXN-DEMO-WLT-004', product: 'wallet', bank: 'Opay', type: 'Fee Leakage', rule: 'EXC_FEE_LEAKAGE', amount: 45200, fee: 8900, date: '2026-03-18', source: 'Partner Bank' },
  { tx: 'TXN-DEMO-AGB-005', product: 'agent_banking', bank: 'Moniepoint', type: 'Unmatched Transaction', rule: 'EXC_UNMATCHED', amount: 198400, date: '2026-02-14', source: 'Internal' },
  { tx: 'TXN-DEMO-QR-006', product: 'qr_payment', bank: 'Kuda', type: 'Unmatched Transaction', rule: 'EXC_UNMATCHED', amount: 67320, date: '2026-02-28', source: 'Partner Bank' },
  { tx: 'TXN-DEMO-BILL-007', product: 'bill_payment', bank: 'Flutterwave', type: 'Reversal Without Refund', rule: 'EXC_REVERSED_NOT_REFUNDED', amount: 28450, date: '2026-01-19', source: 'Payment Gateway' },
  { tx: 'TXN-DEMO-AIR-008', product: 'airtime', bank: 'Interswitch', type: 'Missing Reference', rule: 'EXC_UNMATCHED', amount: 4500, date: '2026-01-08', source: 'Internal', ref: null },
  { tx: 'TXN-DEMO-BBG-009', product: 'business_banking', bank: 'Access Bank', type: 'Volume Spike', rule: 'ADV_ANOMALY_SPIKE', amount: 3200000, date: '2026-05-15', source: 'Partner Bank' },
  { tx: 'TXN-DEMO-TRF-010', product: 'bank_transfer', bank: 'Zenith Bank', type: 'High-Value Unmatched', rule: 'EXC_HIGH_VALUE', amount: 890000, date: '2026-03-02', source: 'Internal' },
];

async function main() {
  const rows = DEMO_ROWS.map((d) => {
    const ruleTag = `rule:${d.rule}`;
    return {
      tenant_id: tenantId,
      anomaly_id: `AN-DEMO-${d.tx}`,
      date: d.date,
      bank: d.bank,
      product_type: d.product,
      type: d.type,
      variance: d.amount,
      severity: severityForAmount(d.amount),
      status: 'Open',
      description: `${d.type} — ${d.product.replace(/_/g, ' ')} via ${d.source}`,
      root_cause: rootCauseForType(d.type, { fee: d.fee, transactionId: d.tx }),
      suggested_action: ruleTag,
      notes: ruleTag,
      created_at: new Date().toISOString(),
    };
  });

  const { error } = await supabase
    .from('anomalies')
    .upsert(rows, { onConflict: 'tenant_id,anomaly_id', ignoreDuplicates: false });

  if (error) throw error;
  console.log(`Seeded ${rows.length} demo showcase anomalies.`);
  const types = {};
  const products = {};
  for (const r of rows) {
    types[r.type] = (types[r.type] || 0) + 1;
    products[r.product_type] = (products[r.product_type] || 0) + 1;
  }
  console.log('Types:', types);
  console.log('Products:', products);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
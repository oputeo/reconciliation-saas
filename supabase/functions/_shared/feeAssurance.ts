/**
 * Phase 1: post-match fee validation against fee_assurance_report benchmarks.
 */

export type FeeBenchmarkRow = {
  id: string;
  reference: string | null;
  product_type?: string;
  amount: number;
  fee: number;
};

export type MatchedLedgerRow = {
  id: string;
  reference: string | null;
  product_type?: string;
  amount: number;
  fee?: number;
  status: string;
};

export type FeeAssuranceAnomaly = {
  reference: string;
  amount: number;
  type: string;
  severity: string;
  description: string;
  root_cause: string;
  transaction_id: string;
  rule_code: string;
  ledger_id?: string;
};

function normalizeRef(value: string | null | undefined): string {
  return String(value ?? "").trim().toLowerCase();
}

export function runFeeAssurancePass(
  benchmarks: FeeBenchmarkRow[],
  ledger: MatchedLedgerRow[],
  maxFeePct = 5,
  toleranceNgn = 50,
): FeeAssuranceAnomaly[] {
  const anomalies: FeeAssuranceAnomaly[] = [];
  const matchedLedger = ledger.filter((r) => r.status === "matched");

  const ledgerByRef = new Map<string, MatchedLedgerRow[]>();
  for (const row of matchedLedger) {
    const key = normalizeRef(row.reference);
    if (!key) continue;
    const bucket = ledgerByRef.get(key) ?? [];
    bucket.push(row);
    ledgerByRef.set(key, bucket);
  }

  for (const bench of benchmarks) {
    const key = normalizeRef(bench.reference);
    if (!key) continue;

    const candidates = (ledgerByRef.get(key) ?? []).filter((row) => {
      if (!bench.product_type || !row.product_type) return true;
      return normalizeRef(row.product_type).includes(normalizeRef(bench.product_type)) ||
        normalizeRef(bench.product_type).includes(normalizeRef(row.product_type));
    });

    const hit = candidates.find(
      (row) => Math.abs(Number(row.amount) - Number(bench.amount)) <= toleranceNgn,
    );

    if (!hit) {
      anomalies.push({
        reference: bench.reference ?? bench.id,
        amount: bench.amount,
        type: "Fee Benchmark Unmatched",
        severity: "Medium",
        description: `Fee report row has no matched ledger counterpart for ${bench.reference}`,
        root_cause: "Fee assurance benchmark could not be linked to a matched transaction",
        transaction_id: bench.id,
        rule_code: "EXC_FEE_LEAKAGE",
      });
      continue;
    }

    const ledgerFee = Number(hit.fee ?? 0);
    const expectedFee = Number(bench.fee);
    const feeDelta = Math.abs(ledgerFee - expectedFee);
    const maxAllowed = Math.max(expectedFee, hit.amount * (maxFeePct / 100));

    if (feeDelta > toleranceNgn && ledgerFee > maxAllowed) {
      anomalies.push({
        reference: hit.reference ?? bench.reference ?? hit.id,
        amount: hit.amount,
        type: "Fee Assurance Variance",
        severity: ledgerFee > hit.amount * 0.05 ? "High" : "Medium",
        description: `Ledger fee ₦${ledgerFee} vs fee report ₦${expectedFee} for ${hit.reference}`,
        root_cause: `Fee variance exceeds ₦${toleranceNgn} tolerance or ${maxFeePct}% threshold`,
        transaction_id: hit.id,
        rule_code: "EXC_FEE_LEAKAGE",
        ledger_id: hit.id,
      });
    }
  }

  return anomalies;
}
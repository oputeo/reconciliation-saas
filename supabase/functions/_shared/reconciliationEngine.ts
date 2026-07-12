import {
  DEFAULT_RECONCILIATION_RULES,
  type ReconciliationRuleRow,
  type TenantReconciliationSettings,
  mergeTenantReconciliationSettings,
} from "./reconciliationRules.ts";

export type LedgerRecord = {
  id: string;
  transaction_id: string;
  reference: string | null;
  amount: number;
  fee?: number;
  product_type?: string;
  source?: string;
  transaction_date: string;
  status: string;
};

export type ReconciliationOutcome = {
  matched: number;
  unmatched: number;
  matchRate: number;
  totalVariance: number;
  confidenceScore: number;
  updates: Array<{
    id: string;
    status: "matched" | "unmatched";
    match_score: number;
    matched_reference?: string;
    matched_rule_code?: string;
  }>;
  anomalies: Array<{
    reference: string;
    amount: number;
    type: string;
    severity: string;
    description: string;
    root_cause: string;
    transaction_id: string;
    rule_code: string;
    product_type?: string;
  }>;
};

type EngineContext = {
  rules: ReconciliationRuleRow[];
  settings: TenantReconciliationSettings;
  duplicateKeys: Set<string>;
  dailyTotals: Map<string, number>;
};

function normalizeRef(value: string | null | undefined): string {
  return String(value ?? "").trim().toLowerCase();
}

function resolveChannel(record: LedgerRecord): string {
  const parts = [
    record.product_type,
    record.source,
  ].map((v) => String(v ?? "").toLowerCase());
  return parts.join(" ");
}

function channelMatches(record: LedgerRecord, channels: string[]): boolean {
  const hay = resolveChannel(record);
  return channels.some((c) => hay.includes(c.toLowerCase()));
}

function sameCalendarDay(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10);
}

function getRule(
  rules: ReconciliationRuleRow[],
  code: string,
): ReconciliationRuleRow | undefined {
  return rules.find((r) => r.rule_code === code && r.active);
}

function numConfig(rule: ReconciliationRuleRow | undefined, key: string, fallback: number) {
  const value = rule?.config?.[key];
  return typeof value === "number" ? value : fallback;
}

function strConfig(rule: ReconciliationRuleRow | undefined, key: string, fallback: string) {
  const value = rule?.config?.[key];
  return typeof value === "string" ? value : fallback;
}

function tokenSimilarity(a: string, b: string): number {
  const set1 = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
  const set2 = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));
  if (!set1.size && !set2.size) return 0;
  const intersection = [...set1].filter((x) => set2.has(x)).length;
  const union = set1.size + set2.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function computeRiskScore(
  pending: LedgerRecord,
  settings: TenantReconciliationSettings,
  rule?: ReconciliationRuleRow,
  matched = false,
): number {
  if (!rule?.active) return matched ? 15 : 50;

  const amount = Number(pending.amount);
  const fee = Number(pending.fee ?? 0);
  const highValueWeight = numConfig(rule, "high_value_weight", 30);
  const unmatchedWeight = numConfig(rule, "unmatched_weight", 40);
  const feeWeight = numConfig(rule, "fee_weight", 20);

  let score = matched ? 10 : unmatchedWeight;
  if (amount >= settings.high_value_threshold_ngn) score += highValueWeight;
  if (fee > amount * 0.05) score += feeWeight;
  if (!pending.reference) score += 10;
  return Math.min(100, Math.max(0, Math.round(score)));
}

function tryAmountReferenceMatch(
  pending: LedgerRecord,
  candidates: LedgerRecord[],
  usedIds: Set<string>,
  toleranceNgn: number,
): LedgerRecord | null {
  const ref = normalizeRef(pending.reference);
  if (!ref) return null;

  return candidates.find((c) => {
    if (usedIds.has(c.id) || c.id === pending.id) return false;
    return (
      normalizeRef(c.reference) === ref &&
      Math.abs(Number(c.amount) - Number(pending.amount)) <= toleranceNgn
    );
  }) ?? null;
}

function tryMultiFieldMatch(
  pending: LedgerRecord,
  candidates: LedgerRecord[],
  usedIds: Set<string>,
  toleranceNgn: number,
  defaultChannel: string,
): LedgerRecord | null {
  const pendingChannel = resolveChannel(pending);

  return candidates.find((c) => {
    if (usedIds.has(c.id) || c.id === pending.id) return false;
    const channelOk = defaultChannel === "ALL" ||
      tokenSimilarity(resolveChannel(c), pendingChannel) > 0.2;
    return (
      channelOk &&
      sameCalendarDay(c.transaction_date, pending.transaction_date) &&
      Math.abs(Number(c.amount) - Number(pending.amount)) <= toleranceNgn
    );
  }) ?? null;
}

function tryFuzzyMatch(
  pending: LedgerRecord,
  candidates: LedgerRecord[],
  usedIds: Set<string>,
  toleranceNgn: number,
  similarityThreshold: number,
  defaultTolerancePct: number,
): LedgerRecord | null {
  const pendingDesc = resolveChannel(pending);

  return candidates.find((c) => {
    if (usedIds.has(c.id) || c.id === pending.id) return false;
    const amountDiff = Math.abs(Number(c.amount) - Number(pending.amount));
    const pctDiff = amountDiff / Math.max(Number(pending.amount), 1) * 100;
    return (
      (amountDiff <= toleranceNgn || pctDiff <= defaultTolerancePct) &&
      tokenSimilarity(resolveChannel(c), pendingDesc) >= similarityThreshold
    );
  }) ?? null;
}

function tryCrossChannelMatch(
  pending: LedgerRecord,
  candidates: LedgerRecord[],
  usedIds: Set<string>,
  rule: ReconciliationRuleRow,
): LedgerRecord | null {
  const fromChannels = (rule.config.from_channels as string[]) ?? [];
  const toChannels = (rule.config.to_channels as string[]) ?? [];
  const tolerance = numConfig(rule, "tolerance_ngn", 100);

  if (!channelMatches(pending, fromChannels)) return null;

  return candidates.find((c) => {
    if (usedIds.has(c.id) || c.id === pending.id) return false;
    return (
      channelMatches(c, toChannels) &&
      Math.abs(Number(c.amount) - Number(pending.amount)) <= tolerance &&
      sameCalendarDay(c.transaction_date, pending.transaction_date)
    );
  }) ?? null;
}

function tryChannelRuleMatch(
  pending: LedgerRecord,
  candidates: LedgerRecord[],
  usedIds: Set<string>,
  rule: ReconciliationRuleRow,
  toleranceNgn: number,
): LedgerRecord | null {
  const channels = (rule.config.channels as string[]) ?? [];
  if (!channelMatches(pending, channels)) return null;

  const keyword = String(rule.config.settlement_keyword ?? "").toLowerCase();
  const ref = normalizeRef(pending.reference);

  return candidates.find((c) => {
    if (usedIds.has(c.id) || c.id === pending.id) return false;
    const refOk = keyword
      ? ref.includes(keyword) || normalizeRef(c.reference).includes(keyword)
      : normalizeRef(c.reference) === ref || !ref;
    const minAmount = numConfig(rule, "min_amount", 0);
    return (
      refOk &&
      Number(pending.amount) >= minAmount &&
      Math.abs(Number(c.amount) - Number(pending.amount)) <= toleranceNgn
    );
  }) ?? null;
}

function duplicateKey(record: LedgerRecord): string {
  return `${record.transaction_date.slice(0, 10)}|${normalizeRef(record.reference)}|${Number(record.amount)}`;
}

function buildDuplicateIndex(records: LedgerRecord[]): Set<string> {
  const counts = new Map<string, number>();
  for (const r of records) {
    const key = duplicateKey(r);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return new Set([...counts.entries()].filter(([, n]) => n > 1).map(([k]) => k));
}

function buildDailyTotals(records: LedgerRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const r of records) {
    const day = r.transaction_date.slice(0, 10);
    totals.set(day, (totals.get(day) ?? 0) + Number(r.amount));
  }
  return totals;
}

function classifyException(
  pending: LedgerRecord,
  ctx: EngineContext,
): { type: string; root_cause: string; rule_code: string; severity: string } {
  const amount = Number(pending.amount);
  const fee = Number(pending.fee ?? 0);
  const highValueRule = getRule(ctx.rules, "EXC_HIGH_VALUE");
  const highThreshold = numConfig(
    highValueRule,
    "threshold_ngn",
    ctx.settings.high_value_threshold_ngn,
  );

  const dupRule = getRule(ctx.rules, "MATCH_SAME_DAY_DUPLICATE");
  if (dupRule && ctx.duplicateKeys.has(duplicateKey(pending))) {
    return {
      type: "Duplicate Transaction",
      root_cause: "Same-day duplicate reference and amount detected",
      rule_code: "MATCH_SAME_DAY_DUPLICATE",
      severity: amount >= highThreshold ? "High" : "Medium",
    };
  }

  const doubleRule = getRule(ctx.rules, "EXC_DOUBLE_POSTING");
  if (doubleRule && ctx.duplicateKeys.has(duplicateKey(pending))) {
    return {
      type: "Double Posting",
      root_cause: "Repeated posting with identical reference and amount",
      rule_code: "EXC_DOUBLE_POSTING",
      severity: "High",
    };
  }

  const feeRule = getRule(ctx.rules, "EXC_FEE_LEAKAGE");
  const maxFeePct = numConfig(feeRule, "max_fee_pct", 5);
  if (feeRule && fee > amount * (maxFeePct / 100)) {
    return {
      type: "Fee Leakage",
      root_cause: `Fee (${fee}) exceeds ${maxFeePct}% of transaction amount`,
      rule_code: "EXC_FEE_LEAKAGE",
      severity: amount >= highThreshold ? "High" : "Medium",
    };
  }

  const reversalRule = getRule(ctx.rules, "EXC_REVERSED_NOT_REFUNDED");
  const keywords = (reversalRule?.config.keywords as string[]) ?? ["reversal", "refund"];
  const hay = `${pending.reference ?? ""} ${pending.product_type ?? ""} ${pending.source ?? ""}`.toLowerCase();
  if (reversalRule && keywords.some((k) => hay.includes(k.toLowerCase()))) {
    return {
      type: "Reversal Without Refund",
      root_cause: "Reversal keyword detected without matching refund pair",
      rule_code: "EXC_REVERSED_NOT_REFUNDED",
      severity: "Medium",
    };
  }

  const spikeRule = getRule(ctx.rules, "ADV_ANOMALY_SPIKE");
  if (spikeRule) {
    const day = pending.transaction_date.slice(0, 10);
    const dayTotal = ctx.dailyTotals.get(day) ?? 0;
    const baselineDays = [...ctx.dailyTotals.entries()]
      .filter(([d]) => d !== day)
      .slice(-7);
    const baseline = baselineDays.length
      ? baselineDays.reduce((s, [, v]) => s + v, 0) / baselineDays.length
      : 0;
    const spikePct = numConfig(spikeRule, "spike_pct", 200);
    if (baseline > 0 && dayTotal > baseline * (1 + spikePct / 100)) {
      return {
        type: "Volume Spike",
        root_cause: `Daily total exceeds ${spikePct}% above 7-day baseline`,
        rule_code: "ADV_ANOMALY_SPIKE",
        severity: "High",
      };
    }
  }

  const unmatchedRule = getRule(ctx.rules, "EXC_UNMATCHED");
  const severity = amount >= highThreshold
    ? "High"
    : amount > 100_000
    ? "Medium"
    : "Low";

  if (!pending.reference) {
    return {
      type: "Missing Reference",
      root_cause: "Missing reference prevents automated matching",
      rule_code: unmatchedRule?.rule_code ?? "EXC_UNMATCHED",
      severity,
    };
  }

  return {
    type: "Unmatched Transaction",
    root_cause: "No matching rule found a counterpart in the ledger pool",
    rule_code: unmatchedRule?.rule_code ?? "EXC_UNMATCHED",
    severity,
  };
}

function attemptMatch(
  pending: LedgerRecord,
  pool: LedgerRecord[],
  usedIds: Set<string>,
  ctx: EngineContext,
): { match: LedgerRecord | null; ruleCode: string; score: number } {
  const fuzzyTolerance = ctx.settings.fuzzy_tolerance_ngn;
  const matchRefRule = getRule(ctx.rules, "MATCH_AMOUNT_REFERENCE");
  const fuzzyRule = getRule(ctx.rules, "MATCH_FUZZY_AMOUNT");
  const multiRule = getRule(ctx.rules, "MATCH_MULTI_FIELD");
  const crossRule = getRule(ctx.rules, "MATCH_CROSS_CHANNEL");

  if (matchRefRule) {
    const tolerance = numConfig(matchRefRule, "tolerance_ngn", fuzzyTolerance);
    const hit = tryAmountReferenceMatch(pending, pool, usedIds, tolerance);
    if (hit) return { match: hit, ruleCode: matchRefRule.rule_code, score: 98 };
  }

  if (multiRule?.active) {
    const tolerance = numConfig(multiRule, "tolerance_ngn", fuzzyTolerance);
    const hit = tryMultiFieldMatch(
      pending,
      pool,
      usedIds,
      tolerance,
      ctx.settings.default_channel,
    );
    if (hit) return { match: hit, ruleCode: multiRule.rule_code, score: 94 };
  }

  if (fuzzyRule?.active) {
    const tolerance = numConfig(fuzzyRule, "tolerance_ngn", fuzzyTolerance);
    const similarity = numConfig(fuzzyRule, "similarity_threshold", 0.55);
    const hit = tryFuzzyMatch(
      pending,
      pool,
      usedIds,
      tolerance,
      similarity,
      ctx.settings.default_tolerance,
    );
    if (hit) return { match: hit, ruleCode: fuzzyRule.rule_code, score: 86 };
  }

  if (crossRule?.active) {
    const hit = tryCrossChannelMatch(pending, pool, usedIds, crossRule);
    if (hit) return { match: hit, ruleCode: crossRule.rule_code, score: 88 };
  }

  const payoutRule = getRule(ctx.rules, "CH_PAYOUT_SETTLEMENT");
  if (payoutRule?.active) {
    const hit = tryCrossChannelMatch(pending, pool, usedIds, payoutRule);
    if (hit) return { match: hit, ruleCode: payoutRule.rule_code, score: 87 };
  }

  const channelRules = ctx.rules
    .filter((r) => r.category === "channel" && r.active)
    .sort((a, b) => b.priority - a.priority);

  for (const rule of channelRules) {
    const hit = tryChannelRuleMatch(pending, pool, usedIds, rule, fuzzyTolerance);
    if (hit) return { match: hit, ruleCode: rule.rule_code, score: 90 };
  }

  return { match: null, ruleCode: "", score: 0 };
}

export function runReconciliation(
  pendingRecords: LedgerRecord[],
  ledgerPool: LedgerRecord[],
  options?: {
    rules?: ReconciliationRuleRow[];
    tenantSettings?: Record<string, unknown> | null;
  },
): ReconciliationOutcome {
  const rules = (options?.rules?.length
    ? options.rules
    : DEFAULT_RECONCILIATION_RULES) as ReconciliationRuleRow[];
  const settings = mergeTenantReconciliationSettings(options?.tenantSettings);
  const allRecords = [...pendingRecords, ...ledgerPool];

  const ctx: EngineContext = {
    rules,
    settings,
    duplicateKeys: buildDuplicateIndex(allRecords),
    dailyTotals: buildDailyTotals(allRecords),
  };

  const outcome: ReconciliationOutcome = {
    matched: 0,
    unmatched: 0,
    matchRate: 0,
    totalVariance: 0,
    confidenceScore: 0,
    updates: [],
    anomalies: [],
  };

  const usedCandidateIds = new Set<string>();
  const riskRule = getRule(rules, "ADV_TX_RISK_SCORE");

  for (const pending of pendingRecords) {
    const { match, ruleCode, score: baseScore } = attemptMatch(
      pending,
      ledgerPool,
      usedCandidateIds,
      ctx,
    );

    if (match) {
      usedCandidateIds.add(match.id);
      const riskScore = computeRiskScore(pending, settings, riskRule, true);
      const matchScore = Math.min(100, Math.round((baseScore + (100 - riskScore)) / 2));
      outcome.matched++;
      outcome.updates.push({
        id: pending.id,
        status: "matched",
        match_score: matchScore,
        matched_reference: match.reference ?? undefined,
        matched_rule_code: ruleCode,
      });
      continue;
    }

    const exception = classifyException(pending, ctx);
    const riskScore = computeRiskScore(pending, settings, riskRule, false);
    outcome.unmatched++;
    outcome.totalVariance += Math.abs(Number(pending.amount));
    outcome.updates.push({
      id: pending.id,
      status: "unmatched",
      match_score: riskScore,
      matched_rule_code: exception.rule_code,
    });
    outcome.anomalies.push({
      reference: pending.reference ?? pending.transaction_id,
      amount: Number(pending.amount),
      type: exception.type,
      severity: exception.severity,
      description: `${exception.type} for ${pending.transaction_id}`,
      root_cause: exception.root_cause,
      transaction_id: pending.transaction_id,
      rule_code: exception.rule_code,
      product_type: pending.product_type ?? undefined,
    });
  }

  const total = pendingRecords.length;
  outcome.matchRate = total > 0 ? Math.round((outcome.matched / total) * 100) : 0;
  outcome.confidenceScore = Math.min(98, Math.floor(outcome.matchRate * 0.9));

  return outcome;
}
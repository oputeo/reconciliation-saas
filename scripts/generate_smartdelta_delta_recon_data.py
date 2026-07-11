#!/usr/bin/env python3
"""
Generate 30,000 SmartDelta Waste — Delta State reconciliation records for ReconFlow.
Models bi-weekly remittance reconciliation across Pay Direct, Paystack (platform),
IGR (25%), PSP (65%), and Platform fee (10%) accounts.

Output: C:\\ReconFlow-TestData\\SmartDelta-Delta\\
"""

from __future__ import annotations

import csv
import json
import random
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path

OUTPUT_ROOT = Path(r"C:\ReconFlow-TestData\SmartDelta-Delta")
TOTAL_INTERNAL = 30_000
SEED = 20260710
CHUNK_SIZE = 3_000
SPIKE_BIWEEK = "BW06-2026"  # volume spike period

# Revenue split (live SmartDelta production model)
PSP_PCT = 0.65
IGR_PCT = 0.25
PLATFORM_PCT = 0.10
PAYSTACK_FEE_PCT = 0.015  # 1.5% normal

LGAS = [
    ("Oshimili South", "OSH"),
    ("Warri South", "WSU"),
    ("Uvwie", "UVW"),
    ("Ethiope East", "ETH"),
    ("Sapele", "SAP"),
    ("Okpe", "OKP"),
]

PSPS = [
    ("Delta Waste Services Ltd", "DWS"),
    ("GreenField Sanitation", "GFS"),
    ("Asaba Clean Partners", "ACP"),
]

# scenario_key -> (count, rule_code, description)
SCENARIOS: list[tuple[str, int, str, str]] = [
    ("paystack_exact_match", 10_000, "MATCH_AMOUNT_REFERENCE", "Paystack collection matched to bank settlement"),
    ("igr_share_match", 2_400, "MATCH_AMOUNT_REFERENCE", "25% IGR remittance matched to Pay Direct credit"),
    ("psp_share_match", 2_400, "MATCH_AMOUNT_REFERENCE", "65% PSP payout matched to operator account"),
    ("platform_fee_match", 1_200, "MATCH_AMOUNT_REFERENCE", "10% platform fee matched to OEO account"),
    ("pay_direct_bank_sync", 1_500, "CH_BANK_TRANSFER_REF", "Pay Direct NIP reference alignment"),
    ("qr_collection_match", 1_200, "CH_QR_PAYMENT", "Waste QR Paystack payment reconciliation"),
    ("fuzzy_amount_match", 1_200, "MATCH_FUZZY_AMOUNT", "Settlement within +/- NGN 50 tolerance"),
    ("multi_field_biwk", 1_000, "MATCH_MULTI_FIELD", "Same bi-weekly period + channel + amount"),
    ("duplicate_same_day", 900, "MATCH_SAME_DAY_DUPLICATE", "Duplicate Paystack ref same day"),
    ("double_posting", 600, "EXC_DOUBLE_POSTING", "Repeated identical collection posting"),
    ("unmatched_paystack", 2_000, "EXC_UNMATCHED", "Paystack success — no bank remittance"),
    ("igr_shortfall", 800, "EXC_UNMATCHED", "IGR credited below 25% share"),
    ("psp_overcredit", 500, "EXC_UNMATCHED", "PSP received more than 65% share"),
    ("fee_overcharge", 1_000, "EXC_FEE_LEAKAGE", "Paystack/processing fee > 5%"),
    ("missing_reference", 700, "EXC_UNMATCHED", "Missing Pay Direct / Paystack reference"),
    ("reversal_no_refund", 400, "EXC_REVERSED_NOT_REFUNDED", "Chargeback without refund pair"),
    ("high_value_unmatched", 700, "EXC_HIGH_VALUE", "Collection >= NGN 500k unmatched"),
    ("amount_variance", 600, "EXC_UNMATCHED", "Split variance beyond tolerance"),
    ("biweekly_late_settlement", 500, "EXC_UNMATCHED", "Remittance posted in wrong bi-week"),
    ("volume_spike_biwk", 400, "ADV_ANOMALY_SPIKE", f"Spike in collections period {SPIKE_BIWEEK}"),
]

assert sum(c for _, c, _, _ in SCENARIOS) == TOTAL_INTERNAL

CSV_FIELDS = [
    "transaction_id", "reference", "amount", "fee", "product_type", "transaction_date",
    "institution", "institution_code", "source", "channel", "channel_code",
    "lga", "lga_code", "biweek_period", "revenue_stream", "customer_ref",
    "status_hint", "anomaly_type", "rule_scenario", "target_rule",
]

UPLOAD_FIELDS = [
    "transaction_id", "reference", "amount", "fee", "product_type",
    "transaction_date", "source", "channel_code",
]

BIWEEKS_2026 = [f"BW{i:02d}-2026" for i in range(1, 14)]

random.seed(SEED)


def round2(v: float) -> float:
    return round(v, 2)


def biweek_to_date(biw: str, day_offset: int = 0) -> str:
    idx = int(biw.split("-")[0].replace("BW", "")) - 1
    start = datetime(2026, 1, 1) + timedelta(days=idx * 14 + day_offset)
    return start.strftime("%Y-%m-%d")


def random_biwweek(exclude: str | None = None) -> str:
    choices = [b for b in BIWEEKS_2026 if b != exclude]
    return random.choice(choices)


def collection_amount() -> float:
    # Waste collection fees NGN 2,500 - 45,000 (monthly/recurring)
    return round2(random.uniform(2_500, 45_000))


def make_paystack_ref(seq: int, lga_code: str) -> str:
    return f"SDW-{1783600000000 + seq}-{random.randint(1000, 9999)}-{lga_code}"


def split_amounts(gross: float) -> tuple[float, float, float]:
    igr = round2(gross * IGR_PCT)
    psp = round2(gross * PSP_PCT)
    platform = round2(gross - igr - psp)  # remainder for 10%
    return igr, psp, platform


def write_csv(path: Path, rows: list[dict], fields: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)


def upload_rows(rows: list[dict]) -> list[dict]:
    return [{k: r.get(k, "") for k in UPLOAD_FIELDS} for r in rows]


def write_chunks(rows: list[dict], out_dir: Path, prefix: str) -> list[str]:
    out_dir.mkdir(parents=True, exist_ok=True)
    paths = []
    n_chunks = (len(rows) + CHUNK_SIZE - 1) // CHUNK_SIZE
    for i in range(n_chunks):
        chunk = rows[i * CHUNK_SIZE : (i + 1) * CHUNK_SIZE]
        name = f"{prefix}_chunk_{i + 1:02d}_of_{n_chunks:02d}.csv"
        p = out_dir / name
        write_csv(p, upload_rows(chunk), UPLOAD_FIELDS)
        paths.append(str(p))
    return paths


def build_internal(seq: int, scenario: str, rule: str) -> dict:
    lga_name, lga_code = random.choice(LGAS)
    psp_name, psp_code = random.choice(PSPS)
    biweek = SPIKE_BIWEEK if scenario == "volume_spike_biwk" else random_biwweek()
    tx_date = biweek_to_date(biweek, random.randint(0, 13))
    gross = collection_amount()
    if scenario == "high_value_unmatched":
        gross = round2(random.uniform(500_000, 2_500_000))
    fee = round2(gross * PAYSTACK_FEE_PCT)
    if scenario == "fee_overcharge":
        fee = round2(gross * random.uniform(0.06, 0.12))

    ref = make_paystack_ref(seq, lga_code)
    if scenario == "missing_reference":
        ref = ""
    elif scenario == "reversal_no_refund":
        ref = f"{ref}-REVERSAL-CHARGEBACK"
    elif scenario == "pay_direct_bank_sync":
        ref = f"PD-NIP-{lga_code}-{seq:07d}"

    product = "paystack_waste_collection"
    channel_code = "SDW_PAYSTACK"
    institution = "Paystack"
    institution_code = "paystack"
    revenue_stream = "gross_collection"

    if scenario in {"igr_share_match", "igr_shortfall"}:
        product = "igr_remittance"
        channel_code = "SDW_IGR"
        institution = "Delta State IGR"
        institution_code = "delta_igr"
        revenue_stream = "igr_25pct"
        base = gross
        igr_amt, _, _ = split_amounts(base)
        gross = igr_amt if scenario == "igr_share_match" else round2(base * 0.18)
    elif scenario in {"psp_share_match", "psp_overcredit"}:
        product = "psp_payout"
        channel_code = "SDW_PSP"
        institution = psp_name
        institution_code = psp_code.lower()
        revenue_stream = "psp_65pct"
        gross = split_amounts(gross)[1]
        if scenario == "psp_overcredit":
            gross = round2(gross * 1.08)
    elif scenario in {"platform_fee_match"}:
        product = "platform_fee"
        channel_code = "SDW_PLATFORM"
        institution = "OEO Solution / SmartDelta"
        institution_code = "oeo_platform"
        revenue_stream = "platform_10pct"
        gross = split_amounts(gross)[2]
    elif scenario == "pay_direct_bank_sync":
        product = "pay_direct_remittance"
        institution = "Pay Direct / NIBSS"
        institution_code = "pay_direct"
        channel_code = "PD_TRF"
        revenue_stream = "pay_direct_settlement"
    elif scenario == "qr_collection_match":
        product = "qr_payment"
        channel_code = "SDW_QR"
        ref = f"SMARTDELTA-BIN-{1783600000000 + seq}-{random.randint(1000, 9999)}"

    return {
        "transaction_id": f"SDW-TX-{seq:07d}",
        "reference": ref,
        "amount": gross,
        "fee": fee,
        "product_type": product,
        "transaction_date": tx_date,
        "institution": institution,
        "institution_code": institution_code,
        "source": "bulk_upload",
        "channel": product,
        "channel_code": channel_code,
        "lga": lga_name,
        "lga_code": lga_code,
        "biweek_period": biweek,
        "revenue_stream": revenue_stream,
        "customer_ref": f"CUST-{lga_code}-{random.randint(100, 999):03d}",
        "status_hint": scenario,
        "anomaly_type": scenario,
        "rule_scenario": scenario,
        "target_rule": rule,
    }


def build_settlement(internal: dict, scenario: str, amount_override: float | None = None,
                     ref_override: str | None = None, date_override: str | None = None) -> dict:
    row = dict(internal)
    row["transaction_id"] = f"STL-{internal['transaction_id']}"
    row["source"] = "bank_settlement"
    row["status_hint"] = "settlement_counterpart"
    row["amount"] = round2(amount_override if amount_override is not None else internal["amount"])
    row["reference"] = ref_override or internal["reference"]
    row["transaction_date"] = date_override or internal["transaction_date"]
    row["fee"] = 0
    return row


def settlement_for(internal: dict, scenario: str, seq: int) -> list[dict]:
    no_settlement = {
        "unmatched_paystack", "fee_overcharge", "missing_reference", "reversal_no_refund",
        "high_value_unmatched", "amount_variance", "volume_spike_biwk", "duplicate_same_day",
        "double_posting", "igr_shortfall", "psp_overcredit", "biweekly_late_settlement",
    }
    if scenario in no_settlement:
        return []

    if scenario == "fuzzy_amount_match":
        delta = random.choice([d for d in range(-50, 51) if d != 0])
        return [build_settlement(internal, scenario, amount_override=internal["amount"] + delta,
                                ref_override=f"{internal['reference']}-FUZZY")]

    if scenario == "multi_field_biwk":
        return [build_settlement(internal, scenario, ref_override=f"{internal['reference']}-MULTI")]

    if scenario in {
        "paystack_exact_match", "igr_share_match", "psp_share_match",
        "platform_fee_match", "qr_collection_match", "pay_direct_bank_sync",
    }:
        return [build_settlement(internal, scenario)]

    return [build_settlement(internal, scenario)]


def main() -> None:
    plan: list[str] = []
    for scenario, count, _, _ in SCENARIOS:
        plan.extend([scenario] * count)
    random.shuffle(plan)

    internal_rows: list[dict] = []
    settlement_rows: list[dict] = []
    by_scenario: dict[str, list[dict]] = defaultdict(list)
    by_lga: dict[str, list[dict]] = defaultdict(list)
    by_biwweek: dict[str, list[dict]] = defaultdict(list)
    scenario_stats: dict[str, int] = defaultdict(int)
    rule_stats: dict[str, int] = defaultdict(int)
    dup_refs: dict[str, dict] = {}

    seq = 0
    for scenario in plan:
        seq += 1
        rule = next(r for s, _, r, _ in SCENARIOS if s == scenario)
        scenario_stats[scenario] += 1
        rule_stats[rule] += 1

        internal = build_internal(seq, scenario, rule)

        if scenario in {"duplicate_same_day", "double_posting"} and dup_refs:
            pick = random.choice(list(dup_refs.keys()))
            internal["reference"] = pick
            internal["amount"] = dup_refs[pick]["amount"]
            internal["transaction_date"] = dup_refs[pick]["transaction_date"]

        if scenario == "biweekly_late_settlement":
            late = random_biwweek(exclude=internal["biweek_period"])
            stl = build_settlement(internal, scenario, date_override=biweek_to_date(late))
            settlement_rows.append(stl)
            internal_rows.append(internal)
            by_scenario[scenario].append(internal)
            by_lga[internal["lga_code"]].append(internal)
            by_biwweek[internal["biweek_period"]].append(internal)
            continue

        internal_rows.append(internal)
        by_scenario[scenario].append(internal)
        by_lga[internal["lga_code"]].append(internal)
        by_biwweek[internal["biweek_period"]].append(internal)

        if internal["reference"]:
            dup_refs[internal["reference"]] = internal

        for stl in settlement_for(internal, scenario, seq):
            settlement_rows.append(stl)

    # Orphan bank credits (Pay Direct without platform record)
    for i in range(600):
        seq += 1
        lga_name, lga_code = random.choice(LGAS)
        biweek = random_biwweek()
        gross = collection_amount()
        row = build_internal(seq, "unmatched_paystack", "EXC_UNMATCHED")
        row["source"] = "bank_settlement"
        row["transaction_id"] = f"STL-ORPHAN-PD-{i:05d}"
        row["reference"] = f"PD-ORPHAN-{lga_code}-{i:05d}"
        row["amount"] = gross
        row["institution"] = "Pay Direct / NIBSS"
        row["institution_code"] = "pay_direct"
        row["product_type"] = "pay_direct_remittance"
        row["anomaly_type"] = "orphan_bank_credit"
        settlement_rows.append(row)

    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)

    write_csv(OUTPUT_ROOT / "MASTER_internal_30000.csv", internal_rows, CSV_FIELDS)
    write_csv(OUTPUT_ROOT / "MASTER_settlement_counterparts.csv", settlement_rows, CSV_FIELDS)
    write_csv(OUTPUT_ROOT / "upload_ready" / "MASTER_platform_ledger.csv", upload_rows(internal_rows), UPLOAD_FIELDS)
    write_csv(OUTPUT_ROOT / "upload_ready" / "MASTER_bank_settlement.csv", upload_rows(settlement_rows), UPLOAD_FIELDS)

    bulk_chunks = write_chunks(internal_rows, OUTPUT_ROOT / "upload_ready" / "chunks_platform", "smartdelta_platform")
    stl_chunks = write_chunks(settlement_rows, OUTPUT_ROOT / "upload_ready" / "chunks_settlement", "smartdelta_settlement")

    # Per-stream uploads for demo narrative
    streams = {
        "paystack_collections": [r for r in internal_rows if r["institution_code"] == "paystack"],
        "igr_remittances": [r for r in internal_rows if r["revenue_stream"] == "igr_25pct"],
        "psp_payouts": [r for r in internal_rows if r["revenue_stream"] == "psp_65pct"],
        "platform_fees": [r for r in internal_rows if r["revenue_stream"] == "platform_10pct"],
        "pay_direct": [r for r in internal_rows if r["institution_code"] == "pay_direct"],
    }
    for name, rows in streams.items():
        if rows:
            write_csv(OUTPUT_ROOT / "by_stream" / f"{name}.csv", rows, CSV_FIELDS)
            write_csv(OUTPUT_ROOT / "upload_ready" / "by_stream" / f"{name}_upload.csv", upload_rows(rows), UPLOAD_FIELDS)

    for lga_code, rows in by_lga.items():
        write_csv(OUTPUT_ROOT / "by_lga" / f"{lga_code}_upload.csv", upload_rows(rows), UPLOAD_FIELDS)

    # Bi-weekly summary for presentation
    biweek_summary = []
    for bw in BIWEEKS_2026:
        rows = by_biwweek.get(bw, [])
        gross = sum(r["amount"] for r in rows if r["revenue_stream"] == "gross_collection")
        anomalies = sum(1 for r in rows if r["target_rule"].startswith("EXC_") or r["target_rule"].startswith("ADV_"))
        biweek_summary.append({
            "biweek_period": bw,
            "transaction_count": len(rows),
            "gross_collections_ngn": round2(gross),
            "expected_igr_25pct": round2(gross * IGR_PCT),
            "expected_psp_65pct": round2(gross * PSP_PCT),
            "expected_platform_10pct": round2(gross * PLATFORM_PCT),
            "seeded_anomaly_rows": anomalies,
        })
    write_csv(OUTPUT_ROOT / "biweekly_summary.csv", biweek_summary,
              ["biweek_period", "transaction_count", "gross_collections_ngn",
               "expected_igr_25pct", "expected_psp_65pct", "expected_platform_10pct", "seeded_anomaly_rows"])

    manifest = {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "project": "SmartDelta Waste - Delta State",
        "reconciliation_product": "ReconFlow",
        "total_internal_records": len(internal_rows),
        "total_settlement_records": len(settlement_rows),
        "revenue_model": {"psp_pct": PSP_PCT, "igr_pct": IGR_PCT, "platform_pct": PLATFORM_PCT},
        "biweekly_cadence": "Every 14 days — reconcile Pay Direct + Paystack vs IGR/PSP/Platform accounts",
        "output_root": str(OUTPUT_ROOT),
        "scenario_distribution": dict(scenario_stats),
        "rule_coverage": dict(rule_stats),
        "scenarios": [{"scenario": s, "count": c, "rule_code": r, "description": d} for s, c, r, d in SCENARIOS],
        "platform_upload_chunks": bulk_chunks,
        "settlement_upload_chunks": stl_chunks,
        "upload_instructions": [
            "1. ReconFlow -> Uploads -> Platform ledger: upload_ready/chunks_platform/ (10 x 3,000)",
            "2. Uploads -> Bank settlement: upload_ready/chunks_settlement/",
            "3. Settings -> Reconciliation -> current_audit_year = 2026",
            "4. Run Reconciliation (period: year or month)",
            "5. Review Anomalies: IGR shortfall, unmatched Paystack, fee leakage, duplicates",
            "6. Executive dashboard: match rate, variance by bi-week, LGA drill-down",
        ],
        "expected_anomaly_highlights": {
            "EXC_UNMATCHED": "~5,600 rows (unmatched Paystack, IGR shortfall, PSP overcredits, late settlement)",
            "EXC_FEE_LEAKAGE": "~1,000 Paystack fee overcharges",
            "EXC_HIGH_VALUE": "~700 high-value unmatched collections",
            "MATCH_SAME_DAY_DUPLICATE": "~900 duplicate references",
            "EXC_DOUBLE_POSTING": "~600 double postings",
            "EXC_REVERSED_NOT_REFUNDED": "~400 chargebacks without refund",
            "ADV_ANOMALY_SPIKE": f"~400 rows in {SPIKE_BIWEEK}",
            "MATCH_AMOUNT_REFERENCE": "~15,000+ clean matches across Paystack/IGR/PSP/Platform",
        },
    }
    with (OUTPUT_ROOT / "manifest.json").open("w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    readme = f"""SmartDelta Waste — Delta State | ReconFlow Test Pack
=====================================================
Generated: {manifest['generated_at']}
Internal (platform ledger): {len(internal_rows):,}
Settlement (bank remittance): {len(settlement_rows):,}

REVENUE MODEL: 65% PSP | 25% IGR | 10% Platform (OEO/SmartDelta)
BI-WEEKLY: 13 periods BW01-2026 to BW13-2026

UPLOAD ORDER (ReconFlow UI):
  1. upload_ready/chunks_platform/  — Paystack + platform collections
  2. upload_ready/chunks_settlement/ — Pay Direct + bank credits to IGR/PSP/Platform
  3. Run Reconciliation for 2026

STREAM SPLITS (presentation):
  upload_ready/by_stream/paystack_collections_upload.csv
  upload_ready/by_stream/igr_remittances_upload.csv
  upload_ready/by_stream/psp_payouts_upload.csv
  upload_ready/by_stream/platform_fees_upload.csv

See biweekly_summary.csv for period totals and manifest.json for rule coverage.
"""
    (OUTPUT_ROOT / "README.txt").write_text(readme, encoding="utf-8")

    print(f"Done: {OUTPUT_ROOT}")
    print(f"Internal: {len(internal_rows):,} | Settlement: {len(settlement_rows):,}")
    print("Top rules:", dict(sorted(rule_stats.items(), key=lambda x: -x[1])[:8]))


if __name__ == "__main__":
    main()
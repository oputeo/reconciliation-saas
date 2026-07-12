#!/usr/bin/env python3
"""
Generate ReconFlow test transaction CSVs (~40k rows) tuned for all 20 reconciliation rule scenarios.
Output: C:\\ReconFlow-TestData\\
"""

from __future__ import annotations

import csv
import json
import random
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path

OUTPUT_ROOT = Path(r"C:\ReconFlow-TestData")
TOTAL_RECORDS = 40_000
SEED = 42
SPIKE_DATE = "2026-05-15"

# scenario_key -> (count, primary_rule_code, description)
RULE_SCENARIOS: list[tuple[str, int, str, str]] = [
    ("success_exact_match", 15_600, "MATCH_AMOUNT_REFERENCE", "Exact reference + amount settlement pair"),
    ("fuzzy_amount_match", 2_000, "MATCH_FUZZY_AMOUNT", "Settlement within ±₦50 amount tolerance"),
    ("multi_field_match", 1_600, "MATCH_MULTI_FIELD", "Same date + channel + amount match"),
    ("cross_channel_match", 1_200, "MATCH_CROSS_CHANNEL", "POS internal → bank transfer settlement"),
    ("pos_settlement_sync", 800, "CH_POS_SYNC", "POS batch with SETTLEMENT reference keyword"),
    ("bank_transfer_ref_match", 800, "CH_BANK_TRANSFER_REF", "MP_TRF strict reference match"),
    ("wallet_funding", 800, "CH_WALLET_FUNDING", "MP_WLT wallet funding validation"),
    ("monnify_gateway", 400, "CH_MONNIFY_GATEWAY", "Gateway collection lines"),
    ("duplicate_same_day", 1_600, "MATCH_SAME_DAY_DUPLICATE", "Duplicate ref+amount same calendar day"),
    ("double_posting", 800, "EXC_DOUBLE_POSTING", "Repeated identical postings"),
    ("unmatched_internal_only", 4_000, "EXC_UNMATCHED", "No settlement counterpart"),
    ("fee_overcharge", 2_000, "EXC_FEE_LEAKAGE", "Fee > 5% of amount"),
    ("missing_reference", 1_600, "EXC_UNMATCHED", "Missing reference field"),
    ("reversal_without_refund", 800, "EXC_REVERSED_NOT_REFUNDED", "REVERSAL keyword without refund pair"),
    ("high_value_unmatched", 1_600, "EXC_HIGH_VALUE", "Amount ≥ ₦500k unmatched"),
    ("amount_variance", 1_200, "EXC_UNMATCHED", "Amount variance beyond fuzzy tolerance"),
    ("volume_spike_day", 800, "ADV_ANOMALY_SPIKE", "Clustered high volume on spike date"),
    ("agent_terminal_sync", 800, "CH_AGENT_TERMINAL", "Agent terminal collection + settlement pair"),
    ("qr_payment_match", 800, "CH_QR_PAYMENT", "QR scan-to-pay reference alignment"),
    ("payout_settlement", 800, "CH_PAYOUT_SETTLEMENT", "Bulk payout → bank settlement cross-match"),
]

assert sum(c for _, c, _, _ in RULE_SCENARIOS) == TOTAL_RECORDS

PRODUCTS = {
    "card": (500, 2_500_000, (0.015, 0.025)),
    "wallet": (100, 500_000, (0.005, 0.015)),
    "ussd": (50, 200_000, (0.008, 0.020)),
    "bank_transfer": (1_000, 10_000_000, (0.010, 0.030)),
    "pos": (200, 1_500_000, (0.012, 0.022)),
    "airtime": (50, 50_000, (0.003, 0.010)),
    "bill_payment": (500, 500_000, (0.010, 0.018)),
    "gateway": (500, 5_000_000, (0.012, 0.028)),
    "agent_banking": (200, 800_000, (0.010, 0.020)),
    "business_banking": (1_000, 3_000_000, (0.011, 0.022)),
    "qr_payment": (100, 300_000, (0.008, 0.018)),
    "bulk_payout": (5_000, 15_000_000, (0.005, 0.012)),
}

MONIEPOINT_CHANNELS = [
    ("MP_POS", "pos"),
    ("MP_AGB", "agent_banking"),
    ("MP_BBG", "business_banking"),
    ("MP_TRF", "bank_transfer"),
    ("MP_WLT", "wallet"),
    ("MP_USSD", "ussd"),
    ("MP_GTW", "gateway"),
    ("MP_QR", "qr_payment"),
    ("MP_PAYOUT", "bulk_payout"),
]

INSTITUTIONS = [
    ("GTBank", "gtbank"),
    ("Access Bank", "access"),
    ("Zenith Bank", "zenith"),
    ("UBA", "uba"),
    ("First Bank", "firstbank"),
    ("Moniepoint", "moniepoint"),
    ("Interswitch", "interswitch"),
    ("NIBSS", "nibss"),
    ("Paystack", "paystack"),
    ("Flutterwave", "flutterwave"),
    ("Opay", "opay"),
    ("PalmPay", "palmpay"),
    ("Kuda", "kuda"),
    ("Stanbic IBTC", "stanbic"),
    ("FCMB", "fcmb"),
]

CSV_FIELDS = [
    "transaction_id",
    "reference",
    "amount",
    "fee",
    "product_type",
    "transaction_date",
    "institution",
    "institution_code",
    "source",
    "channel",
    "channel_code",
    "status_hint",
    "anomaly_type",
    "rule_scenario",
    "target_rule",
]

UPLOAD_FIELDS = [
    "transaction_id",
    "reference",
    "amount",
    "fee",
    "product_type",
    "transaction_date",
    "source",
    "channel_code",
]

CHUNK_SIZE = 4_000
RULE_PACK_SIZE = 80

random.seed(SEED)


def round_amount(value: float) -> float:
    return round(value, 2)


def random_date() -> str:
    start = datetime(2025, 10, 1)
    end = datetime(2026, 6, 10)
    delta = (end - start).days
    day = start + timedelta(days=random.randint(0, delta))
    return day.strftime("%Y-%m-%d")


def fee_for_amount(amount: float, product_key: str, overcharge: bool = False) -> float:
    low, high = PRODUCTS[product_key][2]
    if overcharge:
        return round_amount(amount * random.uniform(0.06, 0.14))
    return round_amount(amount * random.uniform(low, high))


def make_reference(inst_code: str, tag: str, seq: int, suffix: str = "") -> str:
    base = f"{inst_code.upper()}-{tag}-{seq:06d}"
    return f"{base}{suffix}" if suffix else base


def product_type_name(inst_code: str, product_key: str) -> str:
    return f"moniepoint_{product_key}" if inst_code == "moniepoint" else product_key


def build_scenario_plan() -> list[str]:
    plan: list[str] = []
    for scenario, count, _, _ in RULE_SCENARIOS:
        plan.extend([scenario] * count)
    random.shuffle(plan)
    return plan


def scenario_context(scenario: str, seq: int) -> dict:
    """Return institution, product, channel overrides for a scenario."""
    inst = random.choice(INSTITUTIONS)
    inst_name, inst_code = inst
    channel_code = ""
    product_key = random.choice(list(PRODUCTS.keys()))

    if scenario in {
        "cross_channel_match",
        "pos_settlement_sync",
        "bank_transfer_ref_match",
        "wallet_funding",
        "monnify_gateway",
        "multi_field_match",
        "fuzzy_amount_match",
        "success_exact_match",
    }:
        inst_name, inst_code = "Moniepoint", "moniepoint"

    if scenario == "cross_channel_match":
        channel_code, product_key = "MP_POS", "pos"
    elif scenario == "pos_settlement_sync":
        channel_code, product_key = "MP_POS", "pos"
    elif scenario == "bank_transfer_ref_match":
        channel_code, product_key = "MP_TRF", "bank_transfer"
    elif scenario == "wallet_funding":
        channel_code, product_key = "MP_WLT", "wallet"
    elif scenario == "monnify_gateway":
        channel_code, product_key = "MP_GTW", "gateway"
    elif scenario in {"multi_field_match", "fuzzy_amount_match", "success_exact_match"}:
        channel_code, product_key = random.choice(MONIEPOINT_CHANNELS)
    elif inst_code == "moniepoint":
        channel_code, product_key = random.choice(MONIEPOINT_CHANNELS)

    amount_min, amount_max = PRODUCTS[product_key][:2]
    amount = round_amount(random.uniform(amount_min, amount_max))
    tx_date = SPIKE_DATE if scenario == "volume_spike_day" else random_date()
    reference = make_reference(inst_code, channel_code or product_key.upper()[:4], seq)
    fee = fee_for_amount(amount, product_key)
    status_hint = "pending"
    suffix = ""

    if scenario == "success_exact_match":
        status_hint = "match_expected"
    elif scenario == "fuzzy_amount_match":
        status_hint = "fuzzy_match_expected"
    elif scenario == "multi_field_match":
        status_hint = "multi_field_match_expected"
    elif scenario == "cross_channel_match":
        status_hint = "cross_channel_expected"
        suffix = "-POS-SETTLEMENT"
        reference = make_reference(inst_code, "POS", seq, suffix)
    elif scenario == "pos_settlement_sync":
        status_hint = "pos_sync_expected"
        reference = make_reference(inst_code, "POS", seq, "-SETTLEMENT-BATCH")
    elif scenario == "bank_transfer_ref_match":
        status_hint = "transfer_ref_expected"
        reference = make_reference(inst_code, "NIP", seq)
    elif scenario == "wallet_funding":
        status_hint = "wallet_funding_expected"
        amount = round_amount(max(100, random.uniform(500, 250_000)))
    elif scenario == "monnify_gateway":
        status_hint = "gateway_expected"
        reference = make_reference(inst_code, "GTW", seq, "-COLLECTION")
    elif scenario == "duplicate_same_day":
        status_hint = "duplicate_same_day"
    elif scenario == "double_posting":
        status_hint = "double_posting"
    elif scenario == "unmatched_internal_only":
        status_hint = "anomaly_unmatched"
    elif scenario == "fee_overcharge":
        fee = fee_for_amount(amount, product_key, overcharge=True)
        status_hint = "anomaly_fee"
    elif scenario == "missing_reference":
        reference = ""
        status_hint = "anomaly_missing_ref"
    elif scenario == "reversal_without_refund":
        reference = make_reference(inst_code, "REV", seq, "-REVERSAL-NO-REFUND")
        status_hint = "reversal_no_refund"
    elif scenario == "high_value_unmatched":
        amount = round_amount(random.uniform(500_000, 4_000_000))
        fee = fee_for_amount(amount, product_key)
        status_hint = "high_value_unmatched"
    elif scenario == "amount_variance":
        amount = round_amount(amount * random.uniform(1.10, 1.25))
        status_hint = "anomaly_variance"
    elif scenario == "volume_spike_day":
        amount = round_amount(random.uniform(50_000, 800_000))
        status_hint = "spike_cluster"
    elif scenario == "agent_terminal_sync":
        channel_code, product_key = "MP_AGB", "agent_banking"
        inst_name, inst_code = "Moniepoint", "moniepoint"
        reference = make_reference(inst_code, "AGT", seq, "-TERMINAL")
        status_hint = "agent_terminal_expected"
    elif scenario == "qr_payment_match":
        channel_code, product_key = "MP_QR", "qr_payment"
        inst_name, inst_code = "Moniepoint", "moniepoint"
        reference = make_reference(inst_code, "QR", seq, "-SCAN")
        status_hint = "qr_payment_expected"
    elif scenario == "payout_settlement":
        channel_code, product_key = "MP_PAYOUT", "bulk_payout"
        inst_name, inst_code = "Moniepoint", "moniepoint"
        reference = make_reference(inst_code, "PAYOUT", seq)
        status_hint = "payout_settlement_expected"

    rule_code = next(r for s, _, r, _ in RULE_SCENARIOS if s == scenario)

    return {
        "institution": inst_name,
        "institution_code": inst_code,
        "product_key": product_key,
        "channel_code": channel_code,
        "channel": product_key,
        "amount": amount,
        "fee": fee,
        "reference": reference,
        "transaction_date": tx_date,
        "status_hint": status_hint,
        "anomaly_type": scenario,
        "rule_scenario": scenario,
        "target_rule": rule_code,
    }


def build_internal_row(seq: int, scenario: str, ctx: dict, pair_ref: str | None = None) -> dict:
    ref = pair_ref or ctx["reference"]
    return {
        "transaction_id": f"TX-{ctx['institution_code']}-{seq:07d}",
        "reference": ref,
        "amount": ctx["amount"],
        "fee": ctx["fee"],
        "product_type": product_type_name(ctx["institution_code"], ctx["product_key"]),
        "transaction_date": ctx["transaction_date"],
        "institution": ctx["institution"],
        "institution_code": ctx["institution_code"],
        "source": "bulk_upload",
        "channel": ctx["channel"],
        "channel_code": ctx["channel_code"],
        "status_hint": ctx["status_hint"],
        "anomaly_type": ctx["anomaly_type"],
        "rule_scenario": ctx["rule_scenario"],
        "target_rule": ctx["target_rule"],
    }


def build_settlement(
    internal: dict,
    scenario: str,
    seq: int,
    amount_override: float | None = None,
    product_override: str | None = None,
    reference_override: str | None = None,
    date_override: str | None = None,
) -> dict:
    settlement = dict(internal)
    settlement["transaction_id"] = f"STL-{internal['transaction_id']}"
    settlement["source"] = "bank_settlement"
    settlement["status_hint"] = "settlement_counterpart"
    settlement["amount"] = round_amount(amount_override if amount_override is not None else internal["amount"])
    settlement["reference"] = reference_override or internal["reference"]
    settlement["transaction_date"] = date_override or internal["transaction_date"]
    if product_override:
        settlement["product_type"] = product_override
        settlement["channel"] = product_override.replace("moniepoint_", "")
        if "pos" in product_override:
            settlement["channel_code"] = "MP_POS"
        elif "bank_transfer" in product_override:
            settlement["channel_code"] = "MP_TRF"
        elif "wallet" in product_override:
            settlement["channel_code"] = "MP_WLT"
        elif "gateway" in product_override:
            settlement["channel_code"] = "MP_GTW"
        elif "qr_payment" in product_override:
            settlement["channel_code"] = "MP_QR"
        elif "bulk_payout" in product_override or "payout" in product_override:
            settlement["channel_code"] = "MP_PAYOUT"
    return settlement


def settlement_for_scenario(internal: dict, scenario: str, seq: int) -> dict | None:
    if scenario in {
        "unmatched_internal_only",
        "fee_overcharge",
        "missing_reference",
        "reversal_without_refund",
        "high_value_unmatched",
        "amount_variance",
        "volume_spike_day",
        "duplicate_same_day",
        "double_posting",
    }:
        return None

    if scenario == "fuzzy_amount_match":
        # Different reference so MATCH_AMOUNT_REFERENCE does not win before fuzzy rule.
        delta = random.choice([d for d in range(-50, 51) if d != 0])
        return build_settlement(
            internal,
            scenario,
            seq,
            amount_override=internal["amount"] + delta,
            reference_override=f"{internal['reference']}-FUZZY",
        )

    if scenario == "multi_field_match":
        return build_settlement(
            internal,
            scenario,
            seq,
            date_override=internal["transaction_date"],
            reference_override=f"{internal['reference']}-MULTI",
        )

    if scenario == "cross_channel_match":
        return build_settlement(
            internal,
            scenario,
            seq,
            product_override="moniepoint_bank_transfer",
            reference_override=internal["reference"].replace("-POS-SETTLEMENT", "-NIP-SETTLEMENT"),
            date_override=internal["transaction_date"],
        )

    if scenario == "payout_settlement":
        return build_settlement(
            internal,
            scenario,
            seq,
            product_override="moniepoint_bank_transfer",
            reference_override=f"{internal['reference']}-BANK-CONFIRM",
            date_override=internal["transaction_date"],
        )

    if scenario in {"agent_terminal_sync", "qr_payment_match"}:
        return build_settlement(internal, scenario, seq)

    if scenario in {
        "success_exact_match",
        "pos_settlement_sync",
        "bank_transfer_ref_match",
        "wallet_funding",
        "monnify_gateway",
    }:
        return build_settlement(internal, scenario, seq)

    return None


def write_csv(path: Path, rows: list[dict], fieldnames: list[str] | None = None) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    cols = fieldnames or CSV_FIELDS
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def upload_ready_rows(rows: list[dict]) -> list[dict]:
    return [{k: r.get(k, "") for k in UPLOAD_FIELDS} for r in rows]


def write_chunks(rows: list[dict], out_dir: Path, prefix: str) -> list[str]:
    out_dir.mkdir(parents=True, exist_ok=True)
    paths: list[str] = []
    total_chunks = (len(rows) + CHUNK_SIZE - 1) // CHUNK_SIZE
    for i in range(total_chunks):
        chunk = rows[i * CHUNK_SIZE : (i + 1) * CHUNK_SIZE]
        name = f"{prefix}_chunk_{i + 1:02d}_of_{total_chunks:02d}.csv"
        path = out_dir / name
        write_csv(path, upload_ready_rows(chunk), UPLOAD_FIELDS)
        paths.append(str(path))
    return paths


def main() -> None:
    plan = build_scenario_plan()
    internal_rows: list[dict] = []
    settlement_rows: list[dict] = []
    by_scenario: dict[str, list[dict]] = defaultdict(list)
    duplicate_pairs: dict[str, dict] = {}
    scenario_stats: dict[str, int] = defaultdict(int)
    rule_stats: dict[str, int] = defaultdict(int)

    seq = 0
    for scenario in plan:
        seq += 1
        ctx = scenario_context(scenario, seq)
        scenario_stats[scenario] += 1
        rule_stats[ctx["target_rule"]] += 1

        pair_ref = None
        if scenario in {"duplicate_same_day", "double_posting"} and duplicate_pairs:
            pair_ref = random.choice(list(duplicate_pairs.keys()))
            if pair_ref:
                ctx["amount"] = duplicate_pairs[pair_ref]["amount"]
                ctx["transaction_date"] = duplicate_pairs[pair_ref]["transaction_date"]

        internal = build_internal_row(seq, scenario, ctx, pair_ref)
        internal_rows.append(internal)
        by_scenario[scenario].append(internal)

        if scenario in {"duplicate_same_day", "double_posting"} and internal["reference"]:
            duplicate_pairs[internal["reference"]] = internal

        settlement = settlement_for_scenario(internal, scenario, seq)
        if settlement:
            settlement_rows.append(settlement)

    # Orphan settlement lines (unmatched bank-only)
    for i in range(500):
        seq += 1
        ctx = scenario_context("unmatched_internal_only", seq)
        row = build_internal_row(seq, "unmatched_internal_only", ctx)
        row["source"] = "bank_settlement"
        row["transaction_id"] = f"STL-ORPHAN-{i:05d}"
        settlement_rows.append(row)

    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)

    write_csv(OUTPUT_ROOT / "MASTER_internal_40000.csv", internal_rows)
    write_csv(OUTPUT_ROOT / "MASTER_settlement_counterparts.csv", settlement_rows)
    write_csv(
        OUTPUT_ROOT / "upload_ready" / "MASTER_upload_bulk.csv",
        upload_ready_rows(internal_rows),
        UPLOAD_FIELDS,
    )
    write_csv(
        OUTPUT_ROOT / "upload_ready" / "MASTER_upload_settlement.csv",
        upload_ready_rows(settlement_rows),
        UPLOAD_FIELDS,
    )

    bulk_chunks = write_chunks(internal_rows, OUTPUT_ROOT / "upload_ready" / "chunks_bulk", "MASTER_upload_bulk")
    settlement_chunks = write_chunks(
        settlement_rows,
        OUTPUT_ROOT / "upload_ready" / "chunks_settlement",
        "MASTER_upload_settlement",
    )

    # Per-rule mini packs for isolated testing (internal + settlement counterparts)
    rules_dir = OUTPUT_ROOT / "upload_ready" / "rules_test_pack"
    rules_dir.mkdir(parents=True, exist_ok=True)
    rule_pack_manifest: dict[str, str] = {}
    settlement_by_internal_id = {
        r["transaction_id"].replace("STL-", "", 1): r
        for r in settlement_rows
        if r["transaction_id"].startswith("STL-") and not r["transaction_id"].startswith("STL-ORPHAN")
    }
    for scenario, _, rule_code, _ in RULE_SCENARIOS:
        sample = by_scenario[scenario][:RULE_PACK_SIZE]
        if not sample:
            continue
        pack_rows = list(sample)
        for row in sample:
            stl = settlement_by_internal_id.get(row["transaction_id"])
            if stl:
                pack_rows.append(stl)
        fname = f"rule_{rule_code.lower()}_sample.csv"
        write_csv(rules_dir / fname, upload_ready_rows(pack_rows), UPLOAD_FIELDS)
        rule_pack_manifest[rule_code] = str(rules_dir / fname)

    # Institution and product splits (upload-ready)
    by_inst: dict[str, list[dict]] = defaultdict(list)
    by_prod: dict[str, list[dict]] = defaultdict(list)
    for row in internal_rows:
        by_inst[row["institution_code"]].append(row)
        by_prod[row["product_type"]].append(row)
    for code, rows in by_inst.items():
        write_csv(OUTPUT_ROOT / "by_institution" / f"{code}.csv", rows)
        write_csv(
            OUTPUT_ROOT / "upload_ready" / "by_institution" / f"{code}_upload.csv",
            upload_ready_rows(rows),
            UPLOAD_FIELDS,
        )
    for code, rows in by_prod.items():
        write_csv(OUTPUT_ROOT / "by_product" / f"{code}.csv", rows)
        write_csv(
            OUTPUT_ROOT / "upload_ready" / "by_product" / f"{code}_upload.csv",
            upload_ready_rows(rows),
            UPLOAD_FIELDS,
        )

    # Moniepoint channel uploads
    moniepoint_rows = [r for r in internal_rows if r["institution_code"] == "moniepoint"]
    write_csv(
        OUTPUT_ROOT / "upload_ready" / "moniepoint" / "moniepoint_all_upload.csv",
        upload_ready_rows(moniepoint_rows),
        UPLOAD_FIELDS,
    )
    by_channel: dict[str, list[dict]] = defaultdict(list)
    for row in moniepoint_rows:
        code = row.get("channel_code") or "unknown"
        by_channel[code].append(row)
    for code, rows in by_channel.items():
        write_csv(
            OUTPUT_ROOT / "upload_ready" / "moniepoint" / f"{code.lower()}_upload.csv",
            upload_ready_rows(rows),
            UPLOAD_FIELDS,
        )

    manifest = {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "generator_version": "rules_v3",
        "total_internal_records": len(internal_rows),
        "total_settlement_records": len(settlement_rows),
        "output_root": str(OUTPUT_ROOT),
        "scenario_distribution": dict(scenario_stats),
        "rule_coverage": dict(rule_stats),
        "rule_scenarios": [
            {"scenario": s, "count": c, "rule_code": r, "description": d}
            for s, c, r, d in RULE_SCENARIOS
        ],
        "bulk_upload_chunks": bulk_chunks,
        "settlement_upload_chunks": settlement_chunks,
        "rules_test_pack": rule_pack_manifest,
        "spike_date": SPIKE_DATE,
        "upload_instructions": [
            "1. Upload upload_ready/chunks_bulk/ (10 x 4,000 rows)",
            "2. Upload upload_ready/chunks_settlement/ (settlement counterparts)",
            "3. Optional: upload_ready/rules_test_pack/ for per-rule isolated tests",
            "4. Run Reconciliation — verify matched_rule_code on master_ledger",
            "5. Check anomalies for EXC_* and ADV_* rule tags in notes",
        ],
        "expected_rule_triggers": {
            "MATCH_AMOUNT_REFERENCE": "~15.6k exact pairs",
            "CH_AGENT_TERMINAL": "~800 agent terminal pairs (may match MATCH_AMOUNT_REFERENCE first)",
            "CH_QR_PAYMENT": "~800 QR pairs (may match MATCH_AMOUNT_REFERENCE first)",
            "CH_PAYOUT_SETTLEMENT": "~800 payout→bank cross-channel",
            "MATCH_FUZZY_AMOUNT": "~2k within ±₦50",
            "MATCH_MULTI_FIELD": "~1.6k same-day/channel",
            "MATCH_CROSS_CHANNEL": "~1.2k POS→transfer",
            "MATCH_SAME_DAY_DUPLICATE": "~1.6k duplicate refs",
            "EXC_DOUBLE_POSTING": "~800 double posts",
            "EXC_FEE_LEAKAGE": "~2k fee >5%",
            "EXC_HIGH_VALUE": "~1.6k ≥₦500k unmatched",
            "EXC_REVERSED_NOT_REFUNDED": "~800 reversal keywords",
            "ADV_ANOMALY_SPIKE": f"~800 rows on {SPIKE_DATE}",
            "ADV_TX_RISK_SCORE": "scored on all rows during reconciliation",
            "ADV_30_DAY_PROJECTION": "informational — uses date range Oct 2025–Jun 2026",
        },
    }

    with (OUTPUT_ROOT / "manifest.json").open("w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    (OUTPUT_ROOT / "README.txt").write_text(
        "\n".join(
            [
                "ReconFlow Test Pack — Rules v2",
                "==============================",
                f"Generated: {manifest['generated_at']}",
                f"Internal: {len(internal_rows):,} | Settlement: {len(settlement_rows):,}",
                "",
                "RULE COVERAGE (20 rule scenarios):",
                *[f"  - {code}: {count:,} rows" for code, count in sorted(rule_stats.items())],
                "",
                "UPLOAD ORDER:",
                "  1. upload_ready/chunks_bulk/ (10 files)",
                "  2. upload_ready/chunks_settlement/",
                "  3. Run Reconciliation in ReconFlow",
                "",
                "ISOLATED RULE TESTS:",
                "  upload_ready/rules_test_pack/rule_<code>_sample.csv (80 rows each)",
                "",
                f"SPIKE DATE for ADV_ANOMALY_SPIKE: {SPIKE_DATE}",
                "",
                "See manifest.json for full scenario breakdown.",
            ]
        ),
        encoding="utf-8",
    )

    print(f"Done. Output: {OUTPUT_ROOT}")
    print(f"Internal: {len(internal_rows):,} | Settlement: {len(settlement_rows):,}")
    print("Rule coverage:", dict(rule_stats))


if __name__ == "__main__":
    main()
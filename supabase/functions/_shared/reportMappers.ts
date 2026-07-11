/**
 * Phase 1–2: normalize product report CSV columns → master_ledger rows.
 * Keep aligned with src/lib/reconciliation/reportTypes.ts
 */

export type ReportType =
  | "generic"
  | "pos_settlement"
  | "ussd_transaction"
  | "bank_transfer"
  | "wallet_statement"
  | "card_transaction"
  | "fee_commission"
  | "chargeback_reversal"
  | "agent_terminal"
  | "qr_payment"
  | "bulk_payout"
  | "smartdelta_paystack"
  | "pay_direct_igr"
  | "pay_direct_psp"
  | "pay_direct_platform";

export type ReportSide = "internal" | "settlement" | "assurance" | "exception";

export type MappedLedgerRow = {
  transaction_id: string;
  product_type: string;
  amount: number;
  fee: number;
  transaction_date: string;
  reference: string | null;
  source: string;
  status: string;
  channel_code?: string;
};

const AMOUNT_ALIASES = [
  "amount",
  "gross_amount",
  "chargeback_amount",
  "transaction_amount",
  "txn_amount",
  "value",
];

const FEE_ALIASES = ["fee", "commission", "charges", "mdr"];
const DATE_ALIASES = ["transaction_date", "date", "txn_date", "created_at", "posted_date"];
const TXN_ID_ALIASES = ["transaction_id", "txn_id", "id", "payout_id"];

function pick(headers: string[], values: string[], aliases: string[]): string {
  for (const alias of aliases) {
    const idx = headers.indexOf(alias.toLowerCase());
    if (idx >= 0) {
      const value = String(values[idx] ?? "").trim().replace(/^"|"$/g, "");
      if (value) return value;
    }
  }
  return "";
}

function parseAmount(headers: string[], values: string[]): number {
  const raw = pick(headers, values, AMOUNT_ALIASES);
  const amount = parseFloat(raw);
  return Number.isFinite(amount) ? amount : NaN;
}

function parseFee(headers: string[], values: string[]): number {
  const raw = pick(headers, values, FEE_ALIASES);
  const fee = parseFloat(raw);
  return Number.isFinite(fee) ? fee : 0;
}

function parseDate(headers: string[], values: string[]): string {
  const raw = pick(headers, values, DATE_ALIASES);
  if (!raw) return new Date().toISOString();
  return raw.length === 10 ? `${raw}T00:00:00.000Z` : raw;
}

function sideDefaults(side: ReportSide): Pick<MappedLedgerRow, "source" | "status"> {
  switch (side) {
    case "settlement":
      return { source: "bank_settlement", status: "settled" };
    case "assurance":
      return { source: "fee_assurance_report", status: "assurance" };
    case "exception":
      return { source: "chargeback_report", status: "pending" };
    default:
      return { source: "bulk_upload", status: "pending" };
  }
}

export function resolveReportSide(
  reportType: ReportType,
  side?: ReportSide,
): ReportSide {
  const locked: Partial<Record<ReportType, ReportSide>> = {
    fee_commission: "assurance",
    chargeback_reversal: "exception",
  };
  if (locked[reportType]) return locked[reportType]!;
  if (side === "settlement" || side === "internal") return side;
  if (reportType === "pos_settlement") return "settlement";
  return "internal";
}

export function mapCsvRowToLedger(
  headers: string[],
  values: string[],
  reportType: ReportType,
  side: ReportSide,
  rowIndex: number,
): MappedLedgerRow | null {
  const amount = parseAmount(headers, values);
  if (Number.isNaN(amount) || amount <= 0) return null;

  const defaults = sideDefaults(side);
  const fee = parseFee(headers, values);
  const transaction_date = parseDate(headers, values);
  let transaction_id = pick(headers, values, TXN_ID_ALIASES) ||
    `TX-${reportType}-${Date.now()}-${rowIndex}`;

  let product_type = "unknown";
  let reference: string | null = null;
  let channel_code = "";

  switch (reportType) {
    case "pos_settlement": {
      product_type = "pos";
      channel_code = "MP_POS";
      const terminal = pick(headers, values, ["terminal_id", "terminal"]);
      const ref = pick(headers, values, ["reference", "settlement_ref"]);
      reference = ref || (terminal ? `${terminal}-${transaction_id}` : transaction_id);
      break;
    }
    case "ussd_transaction": {
      product_type = "ussd";
      channel_code = "MP_USSD";
      reference = pick(headers, values, ["reference", "session_id", "ussd_ref"]) || transaction_id;
      break;
    }
    case "bank_transfer": {
      product_type = "bank_transfer";
      channel_code = "MP_TRF";
      const transferRef = pick(headers, values, ["transfer_ref", "reference", "nip_ref"]);
      const bankCode = pick(headers, values, ["bank_code", "destination_account"]);
      reference = transferRef || (bankCode ? `${bankCode}-${transaction_id}` : transaction_id);
      break;
    }
    case "wallet_statement": {
      product_type = "wallet";
      channel_code = "MP_WLT";
      const walletId = pick(headers, values, ["wallet_id", "wallet"]);
      const ref = pick(headers, values, ["reference", "transaction_type"]);
      reference = ref || (walletId ? `WLT-${walletId}-${rowIndex}` : transaction_id);
      break;
    }
    case "card_transaction": {
      product_type = "card";
      channel_code = "CARD";
      reference = pick(headers, values, ["rrn", "acquirer_ref", "reference", "stan"]) ||
        transaction_id;
      break;
    }
    case "fee_commission": {
      product_type = pick(headers, values, ["product_type", "product", "channel"]) || "unknown";
      reference = pick(headers, values, ["reference", "transaction_id", "txn_id"]) ||
        `${product_type}-${amount}-${rowIndex}`;
      break;
    }
    case "chargeback_reversal": {
      product_type = "chargeback";
      const originalTxn = pick(headers, values, ["original_txn_id", "original_reference", "txn_id"]);
      const reason = pick(headers, values, ["reason", "chargeback_reason", "type"]);
      reference = originalTxn
        ? `${originalTxn}-CHARGEBACK${reason ? `-${reason.replace(/\s+/g, "_").slice(0, 24)}` : ""}`
        : `CHARGEBACK-${transaction_id}`;
      break;
    }
    case "agent_terminal": {
      product_type = "agent_banking";
      channel_code = "MP_AGB";
      const agentId = pick(headers, values, ["agent_id", "agent"]);
      const terminalId = pick(headers, values, ["terminal_id", "terminal"]);
      const ref = pick(headers, values, ["reference", "transaction_id"]);
      reference = ref ||
        (agentId && terminalId
          ? `AGT-${agentId}-${terminalId}`
          : agentId
          ? `AGT-${agentId}-${rowIndex}`
          : transaction_id);
      break;
    }
    case "qr_payment": {
      product_type = "qr_payment";
      channel_code = "MP_QR";
      reference = pick(headers, values, ["qr_code", "reference", "transaction_id"]) ||
        transaction_id;
      break;
    }
    case "bulk_payout": {
      product_type = "bulk_payout";
      channel_code = "MP_PAYOUT";
      const payoutId = pick(headers, values, ["payout_id", "reference", "transaction_id"]);
      const beneficiary = pick(headers, values, ["beneficiary_account", "account_number"]);
      reference = payoutId ||
        (beneficiary ? `PAYOUT-${beneficiary}-${rowIndex}` : transaction_id);
      transaction_id = payoutId || transaction_id;
      break;
    }
    case "smartdelta_paystack": {
      product_type = "paystack_waste_collection";
      channel_code = pick(headers, values, ["channel_code"]) || "SDW_PAYSTACK";
      reference = pick(headers, values, ["reference", "transaction_id"]) || transaction_id;
      break;
    }
    case "pay_direct_igr": {
      product_type = "igr_remittance";
      channel_code = "SDW_IGR";
      reference = pick(headers, values, ["transfer_ref", "reference"]) || transaction_id;
      break;
    }
    case "pay_direct_psp": {
      product_type = "psp_payout";
      channel_code = "SDW_PSP";
      reference = pick(headers, values, ["transfer_ref", "reference"]) || transaction_id;
      break;
    }
    case "pay_direct_platform": {
      product_type = "platform_fee";
      channel_code = "SDW_PLATFORM";
      reference = pick(headers, values, ["transfer_ref", "reference"]) || transaction_id;
      break;
    }
    default: {
      product_type = pick(headers, values, ["product_type", "product", "channel"]) || "unknown";
      channel_code = pick(headers, values, ["channel_code", "channel"]);
      reference = pick(headers, values, [
        "reference",
        "transfer_ref",
        "session_id",
        "rrn",
        "acquirer_ref",
        "original_txn_id",
      ]) || (channel_code ? `${channel_code}-${rowIndex}` : null);
      if (channel_code && !product_type.startsWith("moniepoint_")) {
        const normalized = channel_code.toLowerCase().replace("mp_", "");
        if (["pos", "ussd", "wlt", "trf", "gtw", "agb", "bbg"].includes(normalized)) {
          product_type = `moniepoint_${normalized === "wlt" ? "wallet" : normalized === "trf" ? "bank_transfer" : normalized === "gtw" ? "gateway" : normalized === "agb" ? "agent_banking" : normalized === "bbg" ? "business_banking" : "pos"}`;
        }
      }
      break;
    }
  }

  return {
    transaction_id,
    product_type,
    amount,
    fee,
    transaction_date,
    reference,
    source: defaults.source,
    status: defaults.status,
    ...(channel_code ? { channel_code } : {}),
  };
}

export function validateReportHeaders(
  headers: string[],
  reportType: ReportType,
): { ok: boolean; missing: string[] } {
  const lower = headers.map((h) => h.toLowerCase());

  const hasAny = (aliases: string[]) => aliases.some((a) => lower.includes(a));

  if (!hasAny(AMOUNT_ALIASES)) {
    return { ok: false, missing: ["amount (or gross_amount / chargeback_amount)"] };
  }

  const requiredByType: Record<ReportType, string[][]> = {
    generic: [],
    pos_settlement: [["terminal_id", "transaction_id", "reference"]],
    ussd_transaction: [["session_id", "reference"]],
    bank_transfer: [["transfer_ref", "reference"]],
    wallet_statement: [["wallet_id"], ["amount"]],
    card_transaction: [["rrn", "acquirer_ref", "reference"]],
    fee_commission: [["gross_amount", "amount"], ["fee"]],
    chargeback_reversal: [["original_txn_id", "original_reference"], ["chargeback_amount", "amount"]],
    agent_terminal: [["agent_id", "terminal_id", "reference"]],
    qr_payment: [["qr_code", "reference"]],
    bulk_payout: [["payout_id", "reference"], ["beneficiary_account", "account_number"]],
  };

  const groups = requiredByType[reportType] ?? [];
  const missing: string[] = [];
  for (const group of groups) {
    if (!hasAny(group)) missing.push(group.join(" or "));
  }

  return { ok: missing.length === 0, missing };
}
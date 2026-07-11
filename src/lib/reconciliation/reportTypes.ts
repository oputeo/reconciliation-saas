/** Report types — keep aligned with supabase/functions/_shared/reportMappers.ts */

export type ReportType =
  | 'generic'
  | 'pos_settlement'
  | 'ussd_transaction'
  | 'bank_transfer'
  | 'wallet_statement'
  | 'card_transaction'
  | 'fee_commission'
  | 'chargeback_reversal'
  | 'agent_terminal'
  | 'qr_payment'
  | 'bulk_payout'
  | 'smartdelta_paystack'
  | 'pay_direct_igr'
  | 'pay_direct_psp'
  | 'pay_direct_platform';

export type ReportSide = 'internal' | 'settlement' | 'assurance' | 'exception';

export interface ReportTypeOption {
  id: ReportType;
  label: string;
  description: string;
  defaultSide: ReportSide;
  allowedSides: ReportSide[];
  expectedColumns: string[];
  phase: 1 | 2;
}

export const REPORT_TYPES: ReportTypeOption[] = [
  {
    id: 'generic',
    label: 'Generic CSV',
    description: 'Standard master ledger columns (reference, amount, fee, product_type)',
    defaultSide: 'internal',
    allowedSides: ['internal', 'settlement'],
    expectedColumns: ['amount', 'reference', 'product_type', 'transaction_date', 'fee'],
    phase: 1,
  },
  {
    id: 'pos_settlement',
    label: 'POS Settlement Report',
    description: 'Daily POS terminal settlement file',
    defaultSide: 'settlement',
    allowedSides: ['internal', 'settlement'],
    expectedColumns: ['terminal_id', 'transaction_id', 'amount', 'fee', 'reference', 'transaction_date'],
    phase: 1,
  },
  {
    id: 'ussd_transaction',
    label: 'USSD Transaction Log',
    description: 'USSD session and collection log',
    defaultSide: 'internal',
    allowedSides: ['internal', 'settlement'],
    expectedColumns: ['session_id', 'amount', 'reference', 'transaction_date', 'status'],
    phase: 1,
  },
  {
    id: 'bank_transfer',
    label: 'Bank Transfer / Collections',
    description: 'NIP transfers and bank collection reports',
    defaultSide: 'internal',
    allowedSides: ['internal', 'settlement'],
    expectedColumns: ['transfer_ref', 'amount', 'destination_account', 'bank_code', 'transaction_date'],
    phase: 1,
  },
  {
    id: 'wallet_statement',
    label: 'Wallet Statement',
    description: 'Wallet funding and movement statement',
    defaultSide: 'internal',
    allowedSides: ['internal', 'settlement'],
    expectedColumns: ['wallet_id', 'transaction_type', 'amount', 'transaction_date'],
    phase: 1,
  },
  {
    id: 'card_transaction',
    label: 'Card Transaction Report',
    description: 'Card acquirer file (RRN / acquirer reference)',
    defaultSide: 'internal',
    allowedSides: ['internal', 'settlement'],
    expectedColumns: ['rrn', 'acquirer_ref', 'amount', 'transaction_date'],
    phase: 1,
  },
  {
    id: 'fee_commission',
    label: 'Fee & Commission Breakdown',
    description: 'Revenue assurance benchmark (post-match validation)',
    defaultSide: 'assurance',
    allowedSides: ['assurance'],
    expectedColumns: ['product_type', 'gross_amount', 'fee', 'net_amount', 'reference'],
    phase: 1,
  },
  {
    id: 'chargeback_reversal',
    label: 'Chargeback & Reversal Report',
    description: 'Exception file linked via original_txn_id',
    defaultSide: 'exception',
    allowedSides: ['exception'],
    expectedColumns: ['original_txn_id', 'chargeback_amount', 'reason', 'transaction_date'],
    phase: 1,
  },
  {
    id: 'agent_terminal',
    label: 'Agent Terminal Report',
    description: 'Agent banking terminal collections',
    defaultSide: 'internal',
    allowedSides: ['internal', 'settlement'],
    expectedColumns: ['agent_id', 'terminal_id', 'amount', 'transaction_date', 'reference'],
    phase: 2,
  },
  {
    id: 'qr_payment',
    label: 'QR Payment Report',
    description: 'QR code payment collections',
    defaultSide: 'internal',
    allowedSides: ['internal', 'settlement'],
    expectedColumns: ['qr_code', 'amount', 'reference', 'transaction_date'],
    phase: 2,
  },
  {
    id: 'bulk_payout',
    label: 'Bulk Payout Report',
    description: 'Outbound payout file linked to bank settlement',
    defaultSide: 'internal',
    allowedSides: ['internal', 'settlement'],
    expectedColumns: ['payout_id', 'beneficiary_account', 'amount', 'status', 'transaction_date'],
    phase: 2,
  },
  {
    id: 'smartdelta_paystack',
    label: 'SmartDelta Paystack Collections',
    description: 'Waste subscription payments from SmartDelta API export',
    defaultSide: 'internal',
    allowedSides: ['internal'],
    expectedColumns: ['transaction_id', 'reference', 'amount', 'fee', 'transaction_date', 'channel_code'],
    phase: 2,
  },
  {
    id: 'pay_direct_igr',
    label: 'Pay Direct — IGR Remittance (25%)',
    description: 'Delta State IGR account credits via Pay Direct',
    defaultSide: 'settlement',
    allowedSides: ['settlement'],
    expectedColumns: ['reference', 'amount', 'transaction_date', 'transfer_ref'],
    phase: 2,
  },
  {
    id: 'pay_direct_psp',
    label: 'Pay Direct — PSP Payout (65%)',
    description: 'PSP operator settlement via Pay Direct',
    defaultSide: 'settlement',
    allowedSides: ['settlement'],
    expectedColumns: ['reference', 'amount', 'transaction_date', 'transfer_ref'],
    phase: 2,
  },
  {
    id: 'pay_direct_platform',
    label: 'Pay Direct — Platform Fee (10%)',
    description: 'OEO / SmartDelta platform fee remittance',
    defaultSide: 'settlement',
    allowedSides: ['settlement'],
    expectedColumns: ['reference', 'amount', 'transaction_date', 'transfer_ref'],
    phase: 2,
  },
];

/** @deprecated use REPORT_TYPES */
export const PHASE1_REPORT_TYPES = REPORT_TYPES.filter((r) => r.phase === 1);

export function resolveReportSide(reportType: ReportType, side?: ReportSide): ReportSide {
  const option = REPORT_TYPES.find((r) => r.id === reportType);
  if (!option) return side ?? 'internal';
  if (side && option.allowedSides.includes(side)) return side;
  return option.defaultSide;
}
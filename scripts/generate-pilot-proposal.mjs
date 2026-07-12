/**
 * Generate OEO Solution — ReconFlow 90-Day Pilot Proposal (.docx)
 * Usage: node scripts/generate-pilot-proposal.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  LevelFormat,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'deliverables');
const OUT_FILE = path.join(OUT_DIR, 'OEO-ReconFlow-90-Day-Pilot-Proposal.docx');

const BRAND = {
  name: 'OEO Solution',
  product: 'ReconFlow',
  tagline: 'Real-Time Revenue Assurance Intelligence',
  website: 'https://oeosolution.com',
  email: 'admin@oeosolution.com',
  billing: 'billing@oeosolution.com',
  phone: '+234 (0) 800 OEO-SOLUTION',
  address: 'Lagos, Nigeria',
};

const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: border, bottom: border, left: border, right: border };
const headerFill = '1E3A5F';
const altFill = 'E8F0F8';

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ heading: level, children: [new TextRun(text)] });
}

function body(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 160 },
    children: [new TextRun({ text, size: 22, ...opts })],
  });
}

function bullet(ref, text) {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    spacing: { after: 100 },
    children: [new TextRun({ text, size: 22 })],
  });
}

function cell(text, opts = {}) {
  const { bold, fill, width, align } = opts;
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: fill ? { fill, type: ShadingType.CLEAR } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [
      new Paragraph({
        alignment: align,
        children: [new TextRun({ text, bold: !!bold, size: 20 })],
      }),
    ],
  });
}

function money(n) {
  return `₦${n.toLocaleString('en-NG')}`;
}

const PRICING = {
  setup: 750_000,
  monthly: 350_000,
  months: 3,
  backAuditAddon: 200_000,
  volumeCap: '100,000 transactions / month',
};

const total = PRICING.setup + PRICING.monthly * PRICING.months;
const m1 = Math.round(total * 0.4);
const m2 = Math.round(total * 0.3);
const m3 = total - m1 - m2;

const doc = new Document({
  styles: {
    default: { document: { run: { font: 'Arial', size: 22 } } },
    paragraphStyles: [
      {
        id: 'Heading1',
        name: 'Heading 1',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: 32, bold: true, color: headerFill, font: 'Arial' },
        paragraph: { spacing: { before: 280, after: 200 }, outlineLevel: 0 },
      },
      {
        id: 'Heading2',
        name: 'Heading 2',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: 26, bold: true, color: headerFill, font: 'Arial' },
        paragraph: { spacing: { before: 200, after: 140 }, outlineLevel: 1 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [{
          level: 0,
          format: LevelFormat.BULLET,
          text: '\u2022',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
      {
        reference: 'numbers',
        levels: [{
          level: 0,
          format: LevelFormat.DECIMAL,
          text: '%1.',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: headerFill, space: 4 } },
            children: [
              new TextRun({ text: BRAND.name, bold: true, size: 20, color: headerFill }),
              new TextRun({ text: `  |  ${BRAND.product} — ${BRAND.tagline}`, size: 18, color: '555555' }),
            ],
          }),
        ],
      }),
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: `${BRAND.name}  •  ${BRAND.website}  •  ${BRAND.email}  •  Page `, size: 18, color: '666666' }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '666666' }),
            ],
          }),
        ],
      }),
    },
    children: [
      // Cover block
      new Paragraph({ spacing: { before: 600 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: BRAND.name, bold: true, size: 52, color: headerFill })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: BRAND.tagline, size: 24, color: '444444', italics: true })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 200 },
        children: [new TextRun({ text: 'CLIENT PROPOSAL', size: 28, bold: true })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'ReconFlow 90-Day Revenue Assurance Pilot', size: 36, bold: true, color: headerFill })],
      }),
      new Paragraph({ spacing: { before: 500 } }),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2800, 6226],
        rows: [
          new TableRow({ children: [cell('Prepared for:', { bold: true, fill: altFill, width: 2800 }), cell('[Client Legal Name]', { width: 6226 })] }),
          new TableRow({ children: [cell('Prepared by:', { bold: true, fill: altFill, width: 2800 }), cell(`${BRAND.name}`, { width: 6226 })] }),
          new TableRow({ children: [cell('Date:', { bold: true, fill: altFill, width: 2800 }), cell('June 2026', { width: 6226 })] }),
          new TableRow({ children: [cell('Validity:', { bold: true, fill: altFill, width: 2800 }), cell('30 days from date of issue', { width: 6226 })] }),
          new TableRow({ children: [cell('Contact:', { bold: true, fill: altFill, width: 2800 }), cell(`${BRAND.email}  |  ${BRAND.website}`, { width: 6226 })] }),
        ],
      }),

      heading('1. Executive Summary'),
      body(
        `${BRAND.product} by ${BRAND.name} is a cloud-based revenue assurance and reconciliation platform built for Nigerian fintechs, payment service providers, and financial institutions. This proposal outlines a focused 90-day pilot to reconcile your internal transaction ledger against partner settlement files, quantify leakage in naira, and establish an auditable anomaly workflow for your finance and operations teams.`,
      ),
      body(
        'Unlike manual spreadsheet reconciliation or generic enterprise tools, ReconFlow ships with 21 pre-configured matching rules tuned for local rails — including Moniepoint, Kuda, NIP transfers, POS, wallets, gateways, and bulk payouts.',
      ),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [4513, 4513],
        rows: [
          new TableRow({
            children: [
              cell('Pilot duration', { bold: true, fill: headerFill, width: 4513 }),
              cell('90 days (3 months)', { fill: altFill, width: 4513 }),
            ],
          }),
          new TableRow({
            children: [
              cell('Total investment', { bold: true, fill: headerFill, width: 4513 }),
              cell(money(total), { bold: true, fill: altFill, width: 4513 }),
            ],
          }),
          new TableRow({
            children: [
              cell('Target match accuracy', { bold: true, fill: headerFill, width: 4513 }),
              cell('≥ 90% on reconcilable volume', { fill: altFill, width: 4513 }),
            ],
          }),
          new TableRow({
            children: [
              cell('Primary outcome', { bold: true, fill: headerFill, width: 4513 }),
              cell('Quantified leakage report + anomaly queue + executive dashboard', { fill: altFill, width: 4513 }),
            ],
          }),
        ],
      }),
      new Paragraph({ spacing: { after: 200 } }),

      heading('2. The Business Problem'),
      body('Financial institutions operating across multiple payment channels face recurring challenges:'),
      bullet('bullets', 'Internal ledger records do not match partner settlement files'),
      bullet('bullets', 'Leakage is discovered late — often during annual audit or partner disputes'),
      bullet('bullets', 'Reconciliation is manual, Excel-driven, and not auditable at scale'),
      bullet('bullets', 'Operations teams lack a single view of unmatched transactions, fees, and root causes'),
      body(
        'The cost of undetected leakage typically ranges from 0.5% to 3% of transaction volume. For a fintech processing ₦10B monthly, even 0.5% represents ₦50M in recoverable or preventable loss.',
      ),

      heading('3. Proposed Solution — ReconFlow'),
      body(`${BRAND.product} delivers an end-to-end reconciliation operating system:`),
      bullet('numbers', 'Ingest — Upload internal ledger and partner settlement CSVs (11 report types)'),
      bullet('numbers', 'Reconcile — 21-rule engine matches transactions with configurable tolerance (default ±₦50)'),
      bullet('numbers', 'Detect — Automatic anomaly creation for unmatched, fee leakage, duplicates, and high-value exceptions'),
      bullet('numbers', 'Investigate — Anomaly inbox with AI-assisted root cause analysis and investigation notes'),
      bullet('numbers', 'Report — Executive dashboard: accuracy, leakage, risk score, and trend analytics'),
      bullet('numbers', 'Audit — Back-audit closed periods with job tracking and recovery summaries'),
      bullet('numbers', 'Govern — Control Gate for rule proposals, approvals, and ingest monitoring'),

      heading('4. Pilot Scope'),
      heading('4.1 In Scope', HeadingLevel.HEADING_2),
      bullet('bullets', 'Dedicated ReconFlow workspace (tenant) for [Client Legal Name]'),
      bullet('bullets', 'Onboarding workshop (half-day): data formats, channel mapping, audit year configuration'),
      bullet('bullets', 'Ingest of internal ledger files (bulk upload) for up to 2 audit years'),
      bullet('bullets', 'Ingest of partner settlement files for configured channels (up to 5 partners)'),
      bullet('bullets', `Up to ${PRICING.volumeCap}`),
      bullet('bullets', '2 reconciliation runs per month per audit year'),
      bullet('bullets', 'Anomaly queue setup with severity, status, and investigation workflow'),
      bullet('bullets', 'Executive summary report (PDF) at pilot close'),
      bullet('bullets', '2 × 60-minute review calls per month with OEO reconciliation analyst'),
      bullet('bullets', 'Email support (business hours, Mon–Fri, 9am–6pm WAT)'),

      heading('4.2 Out of Scope (available as add-ons)', HeadingLevel.HEADING_2),
      bullet('bullets', `Back-audit of additional closed years — ${money(PRICING.backAuditAddon)} per year`),
      bullet('bullets', 'SFTP / automated API ingest setup'),
      bullet('bullets', 'Custom rule development beyond catalog tuning'),
      bullet('bullets', 'On-site training or dedicated full-time analyst embed'),
      bullet('bullets', 'Success-fee / commission on recovered funds (available in Production tier)'),

      heading('5. Deliverables'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [1200, 3200, 4626],
        rows: [
          new TableRow({
            children: [
              cell('#', { bold: true, fill: headerFill, width: 1200 }),
              cell('Deliverable', { bold: true, fill: headerFill, width: 3200 }),
              cell('Description', { bold: true, fill: headerFill, width: 4626 }),
            ],
          }),
          ...[
            ['D1', 'Workspace & access', 'Tenant provisioned; admin + up to 5 user seats (viewer/auditor roles)'],
            ['D2', 'Data mapping guide', 'Channel-specific CSV column mapping for client file formats'],
            ['D3', 'Ingest confirmation', 'Upload history with record counts per file and audit trail'],
            ['D4', 'Reconciliation run reports', 'Match rate, matched/unmatched counts, rule breakdown per run'],
            ['D5', 'Anomaly register', 'Exportable list of open anomalies with variance totals in ₦'],
            ['D6', 'Executive dashboard', 'Live KPIs: accuracy, leakage, risk score, monthly trends'],
            ['D7', 'Pilot close-out report', 'PDF summary: leakage identified, match accuracy, recommended next steps'],
            ['D8', 'Production roadmap', 'Pricing and scope for 12-month production engagement'],
          ].map(([n, d, desc]) => new TableRow({
            children: [
              cell(n, { width: 1200 }),
              cell(d, { bold: true, width: 3200 }),
              cell(desc, { width: 4626 }),
            ],
          })),
        ],
      }),
      new Paragraph({ spacing: { after: 200 } }),

      heading('6. Project Milestones & Timeline'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [1400, 2200, 2200, 3226],
        rows: [
          new TableRow({
            children: [
              cell('Phase', { bold: true, fill: headerFill, width: 1400 }),
              cell('Timeline', { bold: true, fill: headerFill, width: 2200 }),
              cell('Milestone', { bold: true, fill: headerFill, width: 2200 }),
              cell('Acceptance criteria', { bold: true, fill: headerFill, width: 3226 }),
            ],
          }),
          ...[
            ['Phase 1', 'Week 1–2', 'Kickoff & ingest', 'Workspace live; first internal + settlement files ingested; mapping guide delivered'],
            ['Phase 2', 'Week 3–4', 'First reconciliation', 'First run completed; match rate report (D4) delivered; anomaly register (D5) populated'],
            ['Phase 3', 'Week 5–8', 'Optimization', 'Second audit year reconciled; rule tuning; ≥85% accuracy on reconcilable volume'],
            ['Phase 4', 'Week 9–12', 'Pilot close', 'Final reconciliation cycle; executive report (D7); production proposal (D8) presented'],
          ].map(([p, t, m, a]) => new TableRow({
            children: [
              cell(p, { bold: true, width: 1400 }),
              cell(t, { width: 2200 }),
              cell(m, { width: 2200 }),
              cell(a, { width: 3226 }),
            ],
          })),
        ],
      }),
      new Paragraph({ spacing: { after: 200 } }),

      heading('7. Investment & Pricing'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [5000, 2000, 2026],
        rows: [
          new TableRow({
            children: [
              cell('Fee component', { bold: true, fill: headerFill, width: 5000 }),
              cell('Frequency', { bold: true, fill: headerFill, width: 2000 }),
              cell('Amount (NGN)', { bold: true, fill: headerFill, width: 2026, align: AlignmentType.RIGHT }),
            ],
          }),
          new TableRow({
            children: [
              cell('Setup & onboarding (D1, D2, kickoff workshop)', { width: 5000 }),
              cell('One-time', { width: 2000 }),
              cell(money(PRICING.setup), { width: 2026, align: AlignmentType.RIGHT }),
            ],
          }),
          new TableRow({
            children: [
              cell(`Platform & reconciliation ops (D3–D6, 2 runs/month, support)`, { width: 5000 }),
              cell(`Monthly × ${PRICING.months}`, { width: 2000 }),
              cell(money(PRICING.monthly * PRICING.months), { width: 2026, align: AlignmentType.RIGHT }),
            ],
          }),
          new TableRow({
            children: [
              cell('Pilot close-out report & production roadmap (D7, D8)', { width: 5000 }),
              cell('Included', { width: 2000 }),
              cell('—', { width: 2026, align: AlignmentType.RIGHT }),
            ],
          }),
          new TableRow({
            children: [
              cell('TOTAL PILOT INVESTMENT', { bold: true, fill: altFill, width: 5000 }),
              cell('90 days', { bold: true, fill: altFill, width: 2000 }),
              cell(money(total), { bold: true, fill: altFill, width: 2026, align: AlignmentType.RIGHT }),
            ],
          }),
        ],
      }),
      body('All fees are exclusive of 7.5% VAT, which will be added to invoices where applicable.'),

      heading('8. Invoice Schedule'),
      body('Invoices are issued against milestone completion. Payment terms: 7 calendar days from invoice date.'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [800, 2800, 2800, 2626],
        rows: [
          new TableRow({
            children: [
              cell('Invoice', { bold: true, fill: headerFill, width: 800 }),
              cell('Trigger', { bold: true, fill: headerFill, width: 2800 }),
              cell('Covers', { bold: true, fill: headerFill, width: 2800 }),
              cell('Amount (NGN)', { bold: true, fill: headerFill, width: 2626, align: AlignmentType.RIGHT }),
            ],
          }),
          new TableRow({
            children: [
              cell('INV-1', { width: 800 }),
              cell('Signed proposal + kickoff (Week 1)', { width: 2800 }),
              cell('Setup fee + Month 1 platform (40%)', { width: 2800 }),
              cell(money(m1), { width: 2626, align: AlignmentType.RIGHT }),
            ],
          }),
          new TableRow({
            children: [
              cell('INV-2', { width: 800 }),
              cell('First reconciliation report delivered (Week 4)', { width: 2800 }),
              cell('Month 2 platform (30%)', { width: 2800 }),
              cell(money(m2), { width: 2626, align: AlignmentType.RIGHT }),
            ],
          }),
          new TableRow({
            children: [
              cell('INV-3', { width: 800 }),
              cell('Pilot close-out report delivered (Week 12)', { width: 2800 }),
              cell('Month 3 platform + close-out (30%)', { width: 2800 }),
              cell(money(m3), { width: 2626, align: AlignmentType.RIGHT }),
            ],
          }),
          new TableRow({
            children: [
              cell('', { width: 800 }),
              cell('TOTAL', { bold: true, fill: altFill, width: 2800 }),
              cell('', { fill: altFill, width: 2800 }),
              cell(money(total), { bold: true, fill: altFill, width: 2626, align: AlignmentType.RIGHT }),
            ],
          }),
        ],
      }),
      body(`Payment via bank transfer to ${BRAND.name}. Account details provided on each invoice.`),

      heading('9. Client Responsibilities'),
      bullet('bullets', 'Designate a project sponsor (Finance/Ops lead) and technical contact'),
      bullet('bullets', 'Provide sample internal ledger and settlement CSV files within 5 business days of kickoff'),
      bullet('bullets', 'Ensure data includes: transaction_id, reference, amount, fee, product_type, transaction_date, source'),
      bullet('bullets', 'Respond to mapping queries within 3 business days'),
      bullet('bullets', 'Participate in monthly review calls'),
      bullet('bullets', 'Maintain confidentiality of workspace credentials'),

      heading('10. Service Levels (Pilot)'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [3500, 5526],
        rows: [
          new TableRow({ children: [cell('Reconciliation run turnaround', { bold: true, fill: altFill, width: 3500 }), cell('Within 2 business days of complete data receipt', { width: 5526 })] }),
          new TableRow({ children: [cell('Support response (email)', { bold: true, fill: altFill, width: 3500 }), cell('Within 1 business day', { width: 5526 })] }),
          new TableRow({ children: [cell('Platform availability', { bold: true, fill: altFill, width: 3500 }), cell('99% monthly uptime (excl. scheduled maintenance)', { width: 5526 })] }),
          new TableRow({ children: [cell('Data residency', { bold: true, fill: altFill, width: 3500 }), cell('Hosted on Supabase (AWS); tenant-isolated with row-level security', { width: 5526 })] }),
        ],
      }),
      new Paragraph({ spacing: { after: 200 } }),

      heading('11. Confidentiality & Data Protection'),
      body(
        'All client transaction data is stored in a dedicated tenant workspace with row-level security. OEO Solution will not share, sell, or use client data for any purpose other than delivering the services described in this proposal. A mutual NDA can be executed on request prior to kickoff.',
      ),

      heading('12. Terms & Conditions'),
      bullet('bullets', 'Minimum engagement: 90 days (3 months). Early termination: 30 days written notice; fees due for completed milestones are non-refundable.'),
      bullet('bullets', 'Pilot fees cover the scope in Section 4.1 only. Add-ons quoted separately.'),
      bullet('bullets', 'Match accuracy target (≥90%) applies to reconcilable volume where both internal and settlement files are provided for the same period.'),
      bullet('bullets', 'Upon successful pilot, client receives priority pricing for a 12-month Production Agreement.'),
      bullet('bullets', 'This proposal does not constitute a binding contract until signed by both parties.'),

      heading('13. Production Path (Post-Pilot)'),
      body('Clients converting to production typically select one of the following tiers:'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2200, 2400, 4426],
        rows: [
          new TableRow({
            children: [
              cell('Tier', { bold: true, fill: headerFill, width: 2200 }),
              cell('Monthly fee', { bold: true, fill: headerFill, width: 2400 }),
              cell('Includes', { bold: true, fill: headerFill, width: 4426 }),
            ],
          }),
          new TableRow({
            children: [
              cell('Growth', { bold: true, width: 2200 }),
              cell(`${money(450_000)}/month`, { width: 2400 }),
              cell('250k txn/month, 4 runs, email support, 1 back-audit year', { width: 4426 }),
            ],
          }),
          new TableRow({
            children: [
              cell('Professional', { bold: true, width: 2200 }),
              cell(`${money(750_000)}/month`, { width: 2400 }),
              cell('1M txn/month, unlimited runs, priority support, 3 back-audit years', { width: 4426 }),
            ],
          }),
          new TableRow({
            children: [
              cell('Enterprise', { bold: true, width: 2200 }),
              cell('Custom', { width: 2400 }),
              cell('Dedicated analyst, API ingest, custom rules, SLA, success-fee option', { width: 4426 }),
            ],
          }),
        ],
      }),
      new Paragraph({ spacing: { after: 300 } }),

      heading('14. Acceptance & Authorization'),
      body('By signing below, both parties agree to the scope, deliverables, milestones, and investment described in this proposal.'),
      new Paragraph({ spacing: { before: 400 } }),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [4513, 4513],
        rows: [
          new TableRow({
            children: [
              cell('FOR [CLIENT LEGAL NAME]', { bold: true, fill: altFill, width: 4513 }),
              cell(`FOR ${BRAND.name.toUpperCase()}`, { bold: true, fill: altFill, width: 4513 }),
            ],
          }),
          new TableRow({
            children: [
              cell('\n\nSignature: ___________________________\n\nName:\n\nTitle:\n\nDate:', { width: 4513 }),
              cell('\n\nSignature: ___________________________\n\nName:\n\nTitle:\n\nDate:', { width: 4513 }),
            ],
          }),
        ],
      }),
      new Paragraph({ spacing: { before: 300 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: `Thank you for considering ${BRAND.product} by ${BRAND.name}.`, size: 22, italics: true, color: headerFill }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: `We look forward to quantifying and recovering your revenue leakage.`, size: 20, color: '555555' }),
        ],
      }),
    ],
  }],
});

fs.mkdirSync(OUT_DIR, { recursive: true });
const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(OUT_FILE, buffer);
console.log(`Written: ${OUT_FILE}`);
console.log(`Total pilot value: ${money(total)}`);
console.log(`Invoice schedule: INV-1 ${money(m1)} | INV-2 ${money(m2)} | INV-3 ${money(m3)}`);
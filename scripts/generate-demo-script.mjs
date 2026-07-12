/**
 * Generate OEO Solution — ReconFlow Client Demo Script (.docx + .pdf)
 * Usage: node scripts/generate-demo-script.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
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
const DOCX_FILE = path.join(OUT_DIR, 'OEO-ReconFlow-Client-Demo-Script.docx');
const PDF_FILE = path.join(OUT_DIR, 'OEO-ReconFlow-Client-Demo-Script.pdf');

const BRAND = {
  name: 'OEO Solution',
  product: 'ReconFlow',
  tagline: 'Real-Time Revenue Assurance Intelligence',
  website: 'https://oeosolution.com',
  email: 'admin@oeosolution.com',
};

const headerFill = '1E3A5F';
const altFill = 'E8F0F8';
const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: border, bottom: border, left: border, right: border };

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ heading: level, children: [new TextRun(text)] });
}

function body(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 140 },
    children: [new TextRun({ text, size: 22, ...opts })],
  });
}

function bullet(ref, text, bold = false) {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    spacing: { after: 80 },
    children: [new TextRun({ text, size: 22, bold })],
  });
}

function scriptLine(speaker, line) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({ text: `${speaker}: `, bold: true, size: 22, color: headerFill }),
      new TextRun({ text: `"${line}"`, size: 22, italics: true }),
    ],
  });
}

function cell(text, opts = {}) {
  const { bold, fill, width } = opts;
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: fill ? { fill, type: ShadingType.CLEAR } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text, bold: !!bold, size: 20 })] })],
  });
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: 'Arial', size: 22 } } },
    paragraphStyles: [
      {
        id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 30, bold: true, color: headerFill, font: 'Arial' },
        paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 0 },
      },
      {
        id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, color: headerFill, font: 'Arial' },
        paragraph: { spacing: { before: 180, after: 120 }, outlineLevel: 1 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
      {
        reference: 'numbers',
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
      {
        reference: 'checklist',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '\u2610', alignment: AlignmentType.LEFT,
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
              new TextRun({ text: `${BRAND.name}  |  ${BRAND.product} Client Demo Script`, bold: true, size: 18, color: headerFill }),
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
              new TextRun({ text: `${BRAND.website}  •  ${BRAND.email}  •  Page `, size: 18, color: '666666' }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '666666' }),
            ],
          }),
        ],
      }),
    },
    children: [
      new Paragraph({ spacing: { before: 200 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: BRAND.name, bold: true, size: 44, color: headerFill })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [new TextRun({ text: 'Client Demo Script', size: 32, bold: true })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
        children: [new TextRun({ text: `${BRAND.product} — ${BRAND.tagline}`, size: 24, italics: true, color: '444444' })],
      }),

      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [3000, 6026],
        rows: [
          new TableRow({ children: [cell('Duration', { bold: true, fill: altFill, width: 3000 }), cell('15 minutes (12 min demo + 3 min Q&A)', { width: 6026 })] }),
          new TableRow({ children: [cell('Audience', { bold: true, fill: altFill, width: 3000 }), cell('CFO, Head of Finance, Head of Operations, Revenue Assurance lead', { width: 6026 })] }),
          new TableRow({ children: [cell('Demo URL', { bold: true, fill: altFill, width: 3000 }), cell('http://localhost:3000 (or your hosted ReconFlow instance)', { width: 6026 })] }),
          new TableRow({ children: [cell('Login', { bold: true, fill: altFill, width: 3000 }), cell('Auditor+ role (e.g. admin@oeosolution.com)', { width: 6026 })] }),
          new TableRow({ children: [cell('Version', { bold: true, fill: altFill, width: 3000 }), cell('June 2026 — Live tenant with 574 anomalies, ₦1B+ variance', { width: 6026 })] }),
        ],
      }),
      new Paragraph({ spacing: { after: 200 } }),

      heading('Pre-Demo Checklist (15 minutes before)'),
      bullet('checklist', 'Dev server running: npm run dev → http://localhost:3000'),
      bullet('checklist', 'Signed in as auditor+ user'),
      bullet('checklist', 'Hard-refresh browser (Ctrl+Shift+R)'),
      bullet('checklist', 'Anomalies page loads with mixed types (not all "Unmatched Transaction")'),
      bullet('checklist', 'Search "AN-DEMO" returns 22 showcase rows'),
      bullet('checklist', 'Executive Overview shows non-zero leakage'),
      bullet('checklist', 'Close unrelated browser tabs; zoom 100–110%'),
      bullet('checklist', 'Optional: open Anomalies in second tab pre-filtered to "Fee Leakage"'),

      heading('Demo Narrative Arc'),
      body('Structure: Pain → Quantified leakage → How ReconFlow fixes it → Live proof → Close with pilot offer.'),
      body('Golden rule: Lead with naira impact, not technology. Say "₦1 billion flagged" before "21-rule engine."'),

      heading('Scene 1 — Opening Hook (1 min)'),
      body('Screen: Executive Overview (/executive)'),
      scriptLine('You', 'Every fintech loses money in the gap between what your system records and what partners settle. Most teams find out months late — in Excel, or during an audit.'),
      scriptLine('You', 'ReconFlow quantifies that gap in real time. This workspace has processed over 66,000 transactions and flagged more than ₦1 billion in unresolved variance across 574 anomalies.'),
      body('Point to KPI cards: Total Records, Accuracy, Potential Leakage, Risk Score.'),

      heading('Scene 2 — Executive Dashboard (2 min)'),
      body('Screen: Stay on Executive Overview'),
      scriptLine('You', 'Your CFO sees four numbers that matter: volume, match accuracy, leakage in naira, and risk score.'),
      bullet('bullets', 'Total Records — full ledger coverage'),
      bullet('bullets', 'Accuracy Rate — matched vs unmatched on reconciled volume'),
      bullet('bullets', 'Potential Leakage — open anomaly variance (real money)'),
      bullet('bullets', 'Risk Score — composite exposure indicator'),
      scriptLine('You', 'This is not a static report. It updates every time you upload a file or run reconciliation.'),
      body('Optional: Expand a KPI card and click Generate AI Insight to show Groq-powered commentary.'),

      heading('Scene 3 — Anomalies: The Money Slide (4 min)'),
      body('Screen: Anomalies & Alerts (/anomalies)'),
      scriptLine('You', 'This is where leakage becomes actionable. Every row is a transaction your rules engine could not safely match — with a type, severity, and variance in naira.'),
      body('Show KPI strip: 574 Total | Open count | High Severity | Total Variance.'),

      heading('3a — Fee Leakage (45 sec)', HeadingLevel.HEADING_2),
      body('Action: Set Type filter → Fee Leakage'),
      scriptLine('You', 'Fee Leakage catches MDR and partner fee overcharges — when the fee exceeds your configured threshold, typically 5% of transaction value.'),
      scriptLine('You', 'This is direct margin recovery. Finance can dispute these with partners using the reference and variance.'),
      body('Expand one row → show Root Cause pre-filled → click Resolve with AI.'),

      heading('3b — Reversal Without Refund (45 sec)', HeadingLevel.HEADING_2),
      body('Action: Set Type filter → Reversal Without Refund'),
      scriptLine('You', 'When a reversal posts in your ledger but no matching refund appears in settlement, you have customer money at risk and a regulatory exposure.'),
      body('Filter Product → Card or Wallet to show cross-product coverage.'),

      heading('3c — Duplicate & High-Value (45 sec)', HeadingLevel.HEADING_2),
      body('Action: Type filter → Duplicate Transaction, then High-Value Unmatched'),
      scriptLine('You', 'Duplicates catch operational double-posting. High-value unmatched escalates anything above ₦500,000 for mandatory analyst review.'),
      body('Action: Search "AN-DEMO" — curated showcase rows for clean client-facing examples.'),

      heading('3d — Investigation Workflow (45 sec)', HeadingLevel.HEADING_2),
      body('Action: Expand AN-DEMO-TXN-00000244 (card / Reversal)'),
      scriptLine('You', 'Your team documents root cause, adds investigation notes, and can escalate to Resolved when finance signs off. AI assist drafts the first investigation narrative.'),
      body('Click Save Investigation to show persistence. Do NOT mark Resolved unless you want to change live data.'),

      heading('Scene 4 — Reconciliation Engine (2 min)'),
      body('Screen: Reconciliation (/reconciliation)'),
      scriptLine('You', 'Anomalies do not appear from uploads alone. You run reconciliation — and our 21-rule engine matches internal ledger rows against partner settlement files.'),
      bullet('bullets', 'Upload internal bulk file + settlement file'),
      bullet('bullets', 'Select audit year (2025 or 2026)'),
      bullet('bullets', 'Run Reconciliation — engine applies matching, channel, and exception rules'),
      bullet('bullets', 'Unmatched rows become anomalies automatically'),
      scriptLine('You', 'Rules cover Moniepoint, Kuda, NIP transfers, POS, wallets, gateways, and payouts — configured for Nigerian rails, not generic US templates.'),
      body('Do NOT run live reconciliation during demo unless pre-tested — it takes 30–90 seconds.'),

      heading('Scene 5 — Uploads & Audit Trail (1 min)'),
      body('Screen: Uploads (/uploads)'),
      scriptLine('You', 'Every file ingest is logged — filename, record count, timestamp. Your auditors get a complete chain of custody from raw CSV to reconciled ledger.'),
      body('Mention: API ingest and scheduled runs available for production clients.'),

      heading('Scene 6 — Control Gate & Rules (1 min)'),
      body('Screen: Settings → Rules or Control Gate (/control-gate)'),
      scriptLine('You', 'Rule changes go through propose → approve → publish. No one silently edits matching logic. That is how you pass an external audit.'),
      body('Briefly show rule catalog count (21 rules) and one channel rule e.g. CH_POS_SYNC.'),

      heading('Scene 7 — Close & Pilot Offer (1 min)'),
      body('Screen: Return to Executive Overview'),
      scriptLine('You', 'What you have seen is a 90-day pilot scope: we ingest your files, configure your channels, run reconciliation, and deliver a leakage report with recovered-variance targets.'),
      scriptLine('You', 'Typical pilot investment is ₦1.8M over 90 days — setup, monthly platform, and a close-out executive report. Most clients see ROI in the first reconciliation cycle if leakage exceeds ₦5M.'),
      scriptLine('You', 'Can we schedule a kickoff next week with a sample internal file and one settlement partner?'),
      body('Hand over or email: OEO-ReconFlow-90-Day-Pilot-Proposal.docx from deliverables folder.'),

      heading('Objection Handling'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [3600, 5426],
        rows: [
          new TableRow({ children: [cell('Objection', { bold: true, fill: headerFill, width: 3600 }), cell('Response', { bold: true, fill: headerFill, width: 5426 })] }),
          ...[
            ['We already reconcile in Excel', 'Excel breaks at 50k+ rows, has no audit trail, and cannot apply 21 rules consistently. ReconFlow found ₦1B+ your spreadsheet missed.'],
            ['How long to go live?', 'Pilot kickoff to first reconciliation report: 2 weeks. Full production: 90 days.'],
            ['Is our data secure?', 'Tenant-isolated Postgres with row-level security. Your data never mixes with other clients.'],
            ['What accuracy can we expect?', 'Target ≥90% on reconcilable volume when both internal and settlement files are provided for the same period.'],
            ['We need custom rules', 'Rule catalog is editable with approval workflow. Enterprise tier includes custom rule development.'],
            ['AI is a gimmick', 'AI is optional assist on anomalies. The core value is rules-based matching and naira quantification — AI just speeds investigation.'],
          ].map(([o, r]) => new TableRow({ children: [cell(o, { bold: true, width: 3600 }), cell(r, { width: 5426 })] })),
        ],
      }),
      new Paragraph({ spacing: { after: 200 } }),

      heading('Demo Filter Quick Reference'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2800, 3200, 3026],
        rows: [
          new TableRow({ children: [cell('Filter', { bold: true, fill: headerFill, width: 2800 }), cell('Value', { bold: true, fill: headerFill, width: 3200 }), cell('Why show it', { bold: true, fill: headerFill, width: 3026 })] }),
          ...[
            ['Type', 'Fee Leakage', 'MDR recovery — CFO cares'],
            ['Type', 'Reversal Without Refund', 'Customer money risk'],
            ['Type', 'Duplicate Transaction', 'Ops control'],
            ['Type', 'High-Value Unmatched', 'Big-ticket exposure'],
            ['Search', 'AN-DEMO', 'Curated clean examples'],
            ['Product', 'card / wallet / pos', 'Cross-product proof'],
            ['Severity', 'High', 'Escalation queue'],
          ].map(([f, v, w]) => new TableRow({ children: [cell(f, { width: 2800 }), cell(v, { bold: true, width: 3200 }), cell(w, { width: 3026 })] })),
        ],
      }),
      new Paragraph({ spacing: { after: 200 } }),

      heading('What NOT to show in a first demo'),
      bullet('bullets', 'Fraud analytics, IAM, monitoring pages (mock data)'),
      bullet('bullets', 'Volume Spike filter first (365 rows — overwhelming)'),
      bullet('bullets', 'Live reconciliation run unless pre-tested'),
      bullet('bullets', 'Settings admin screens unless client asks about governance'),
      bullet('bullets', 'Raw SQL or Supabase dashboard'),

      heading('Post-Demo Follow-Up (same day)'),
      bullet('numbers', 'Send thank-you email with Pilot Proposal PDF attached'),
      bullet('numbers', 'Attach Executive Overview screenshot showing leakage KPI'),
      bullet('numbers', 'Request: one internal CSV + one settlement file for scoping call'),
      bullet('numbers', 'Book 30-min kickoff call within 5 business days'),

      new Paragraph({ spacing: { before: 300 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: `${BRAND.name}  •  ${BRAND.product}  •  Confidential — for presenter use only`, size: 20, italics: true, color: '666666' })],
      }),
    ],
  }],
});

fs.mkdirSync(OUT_DIR, { recursive: true });
const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(DOCX_FILE, buffer);
console.log(`Written: ${DOCX_FILE}`);

function convertToPdfWindows() {
  const ps = `
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    try {
      $doc = $word.Documents.Open('${DOCX_FILE.replace(/'/g, "''")}')
      $pdf = '${PDF_FILE.replace(/'/g, "''")}'
      $doc.SaveAs([ref]$pdf, [ref]17)
      $doc.Close()
    } finally { $word.Quit() }
  `;
  execSync(`powershell -NoProfile -Command "${ps.replace(/"/g, '\\"').replace(/\r?\n/g, '; ')}"`, { stdio: 'inherit' });
}

if (process.platform === 'win32') {
  try {
    convertToPdfWindows();
    if (fs.existsSync(PDF_FILE)) console.log(`Written: ${PDF_FILE}`);
  } catch (err) {
    console.warn('PDF conversion failed — open the .docx and export to PDF manually.');
    console.warn(err.message);
  }
} else {
  const soffice = 'C:\\Users\\Opute\\.grok\\skills\\docx\\scripts\\office\\soffice.py';
  if (fs.existsSync(soffice)) {
    execSync(`python "${soffice}" --headless --convert-to pdf "${DOCX_FILE}"`, { cwd: OUT_DIR, stdio: 'inherit' });
    if (fs.existsSync(PDF_FILE)) console.log(`Written: ${PDF_FILE}`);
  }
}
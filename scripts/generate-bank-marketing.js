const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel, BorderStyle,
  WidthType, ShadingType, PageNumber, PageBreak, ExternalHyperlink,
} = require("docx");

const IMG = path.join(__dirname, "..", "deliverables", "bank-marketing-images");
const OUT = path.join(__dirname, "..", "deliverables", "ReconFlow_Bank_Marketing_Brochure.docx");

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

function img(file, w = 520, h = 320) {
  const p = path.join(IMG, file);
  if (!fs.existsSync(p)) return new Paragraph({ children: [new TextRun({ text: `[${file}]`, italics: true })] });
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 120 },
    children: [new ImageRun({ type: "jpg", data: fs.readFileSync(p), transformation: { width: w, height: h }, altText: { title: file, description: file, name: file } })],
  });
}
function cap(t) {
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 280 }, children: [new TextRun({ text: t, italics: true, size: 20, color: "555555" })] });
}
function h1(t) { return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] }); }
function h2(t) { return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] }); }
function p(t) { return new Paragraph({ spacing: { after: 160 }, children: [new TextRun(t)] }); }
function b(ref, t) { return new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 80 }, children: [new TextRun(t)] }); }
function pb() { return new Paragraph({ children: [new PageBreak()] }); }
function tbl(headers, rows, widths) {
  const total = widths.reduce((a, c) => a + c, 0);
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({ children: headers.map((h, i) => new TableCell({
        borders, width: { size: widths[i], type: WidthType.DXA },
        shading: { fill: "1E3A5F", type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 20 })] })],
      })) }),
      ...rows.map((row, ri) => new TableRow({ children: row.map((c, ci) => new TableCell({
        borders, width: { size: widths[ci], type: WidthType.DXA },
        shading: { fill: ri % 2 ? "FFFFFF" : "F5F8FA", type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: c, size: 20 })] })],
      })) })),
    ],
  });
}

const doc = new Document({
  title: "ReconFlow Bank Marketing Brochure",
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 32, bold: true, font: "Arial", color: "1E3A5F" }, paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 26, bold: true, font: "Arial", color: "0D9488" }, paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 1 } },
    ],
  },
  numbering: {
    config: [
      { reference: "b1", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "b2", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "b3", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "b4", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ],
  },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    headers: { default: new Header({ children: [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "0D9488", space: 1 } }, children: [new TextRun({ text: "OEO Solutions", bold: true, color: "1E3A5F" }), new TextRun({ text: "  |  ReconFlow for Banks", color: "666666" })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "oeosolution@gmail.com  |  www.oeosolution.com  |  Page ", size: 16, color: "888888" }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "888888" })] })] }) },
    children: [
      new Paragraph({ spacing: { before: 2200 } }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ReconFlow", size: 64, bold: true, color: "1E3A5F" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "AI-Powered Revenue Assurance & Reconciliation", size: 28, color: "0D9488" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: "Built for Modern Banks", size: 36, bold: true })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "Complex reconciliation. High accuracy. Full audit trail.", size: 24, italics: true, color: "555555" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "OEO Solutions  |  June 2026", size: 22, color: "888888" })] }),

      pb(),
      h1("Executive Summary"),
      p("ReconFlow is an enterprise reconciliation and revenue assurance platform designed for banks and payment institutions operating across multiple channels, gateways, and settlement rails. As transaction volumes grow and payment ecosystems become more complex, manual spreadsheets and siloed tools cannot keep pace."),
      p("ReconFlow automates multi-channel matching, detects revenue leakage in real time, governs rule changes through audit-ready controls, and delivers executive-grade reporting — giving your bank the accuracy, speed, and confidence regulators and boards expect."),

      h2("Why banks choose ReconFlow"),
      b("b1", "Handles complex, multi-rail reconciliation — POS, cards, USSD, bank transfers, wallets, gateways, and payouts in one platform."),
      b("b1", "21 configurable matching and exception rules with cross-channel intelligence."),
      b("b1", "AI-assisted anomaly investigation reduces resolution time from days to hours."),
      b("b1", "Control Gate governance ensures no rule change goes live without approver sign-off."),
      b("b1", "Bank-grade security: multi-tenant isolation, role-based access, and full audit logging."),
      b("b1", "Executive PDF and CSV exports ready for finance, risk, and compliance review."),

      img("value-prop.jpg", 540, 340),
      cap("Figure 1: From fragmented payment rails to a single reconciled truth"),

      pb(),
      h1("The Challenge for Modern Banks"),
      p("New and growing banks face reconciliation complexity that legacy tools were never built to handle:"),
      tbl(
        ["Challenge", "Business Impact"],
        [
          ["Multiple payment gateways & acquirers", "Duplicate effort, missed matches, revenue leakage"],
          ["High transaction volumes", "Manual processes break down; errors scale with volume"],
          ["Cross-channel settlement delays (T+0/T+1)", "Period-end close delays and audit findings"],
          ["Fee variance across products", "Undetected commission leakage"],
          ["Regulatory & audit scrutiny", "Inability to produce timely, defensible evidence"],
          ["Siloed teams and spreadsheets", "No single source of truth across operations and finance"],
        ],
        [3600, 5760]
      ),

      pb(),
      h1("ReconFlow Capabilities"),
      img("capabilities.jpg", 540, 340),
      cap("Figure 2: ReconFlow capability map for banking operations"),

      h2("1. Multi-Channel & Cross-Rail Matching"),
      p("ReconFlow ingests internal ledger files and settlement statements across all your payment rails — then applies a rules engine with 21 default rules including amount+reference matching, fuzzy amount tolerance, multi-field matching, and cross-channel reconciliation (POS to bank transfer, gateway to settlement, card acquirer RRN matching)."),
      b("b2", "Supported ingest formats: POS Settlement, USSD, Bank Transfer, Wallet, Card, Gateway, QR Payment, Bulk Payout, Fee & Commission, Chargebacks."),
      b("b2", "Configurable amount tolerance (e.g. ₦50–₦100) for rounding and timing differences."),

      h2("2. High-Accuracy Reconciliation Engine"),
      p("Every reconciliation run produces a match rate with full transparency: matched count, processed count, and percentage. Low-confidence matches (score below threshold) are automatically flagged for review. Unmatched items generate structured anomalies — never silently dropped."),
      b("b2", "Primary match on normalized reference + amount (98% confidence score)."),
      b("b2", "Fallback: multi-field (amount + date + channel), fuzzy amount, and cross-channel rules."),
      b("b2", "Post-match fee assurance pass validates commission against benchmarks."),

      h2("3. AI-Powered Anomaly Intelligence"),
      p("When exceptions arise, ReconFlow's AI Resolver analyses root cause, suggests investigation notes, and accelerates closure. Finance approvers sign off resolutions through a structured workflow — creating an audit trail for every exception."),

      h2("4. Control Gate — Governance Built In"),
      p("Banks cannot afford uncontrolled rule changes. ReconFlow's Control Gate requires auditor-proposed rule changes to be reviewed and approved by finance before publishing. Full diff view, rejection notes, and HTML audit reports support internal audit and regulatory examination."),

      h2("5. Revenue Recovery & Back Audit"),
      p("Closed-period recovery analysis identifies recoverable revenue from historical periods. Combined with Product Performance dashboards and leakage charts, leadership gets forward-looking and retrospective visibility."),

      h2("6. Executive Reporting & Compliance"),
      p("One-click PDF executive reports, CSV exports, product-level performance tables, data quality dashboards, and five types of Control Gate HTML audit reports — ready for board packs, CBN examinations, and external audit."),

      pb(),
      h1("Accuracy You Can Measure & Defend"),
      tbl(
        ["Metric", "How ReconFlow Delivers"],
        [
          ["Match rate %", "Displayed live after every reconciliation run"],
          ["Flagged transactions", "Per-product flagged count and % in Product Audit dashboard"],
          ["Match confidence score", "0–100 score per transaction; low scores auto-flagged"],
          ["Fee assurance flags", "Post-match commission validation against benchmarks"],
          ["Exception rate", "Structured anomaly queue with severity and variance in ₦"],
          ["Audit trail", "Immutable upload, reconciliation, and rule-change logs"],
        ],
        [3200, 6160]
      ),

      pb(),
      h1("Bank Use Cases"),
      tbl(
        ["Use Case", "ReconFlow Solution"],
        [
          ["Daily settlement reconciliation", "Upload internal + settlement CSVs; run same-day match"],
          ["Multi-gateway card reconciliation", "Per-gateway ingest with RRN/acquirer matching"],
          ["Agent banking & POS networks", "Terminal-level settlement with CH_POS_SYNC rules"],
          ["USSD & digital channels", "Session-level matching with channel-specific rules"],
          ["Fee & commission assurance", "Assurance layer validates actual vs expected fees"],
          ["Regulatory audit preparation", "Control Gate reports + executive PDF export"],
          ["New product launch", "Add report type and rules without replacing the platform"],
        ],
        [3600, 5760]
      ),

      pb(),
      h1("Security & Governance"),
      b("b3", "Multi-tenant workspace isolation — each bank entity operates in a dedicated tenant."),
      b("b3", "Four-tier role model: Viewer, Auditor, Finance Approver, Administrator."),
      b("b3", "Row-level security (RLS) enforced at database level."),
      b("b3", "Invite-only access with audit-logged user management."),
      b("b3", "Configurable session timeout, IP allowlist, and integration webhooks."),

      pb(),
      h1("Implementation Approach"),
      tbl(
        ["Phase", "Timeline", "Deliverable"],
        [
          ["Discovery & mapping", "Week 1–2", "Channel inventory, file format mapping, rule configuration"],
          ["Pilot ingest & reconcile", "Week 3–4", "Live reconciliation on one product line"],
          ["Exception workflow", "Week 5", "Anomaly queue, AI investigation, approver sign-off"],
          ["Full rollout", "Week 6–8", "All channels, executive reporting, staff training"],
          ["Steady state", "Ongoing", "Daily/scheduled ingest, period-end close, audit packs"],
        ],
        [2400, 1600, 5360]
      ),

      pb(),
      h1("Why OEO Solutions"),
      p("OEO Solutions builds and deploys ReconFlow for financial institutions that need enterprise-grade reconciliation without enterprise-grade complexity. We combine deep payment-rail domain knowledge with a modern, AI-enabled SaaS platform — deployed fast, configured for your channels, and supported by a local team across Lagos, Asaba, and Port Harcourt."),

      h2("Contact OEO Solutions"),
      tbl(
        ["Office", "Address", "Contact"],
        [
          ["Lagos (Head Office)", "Plot 5004, Gwandu Close, Beachwood Estate, Ibeju-Lekki, Lagos", "Tel: +234 803 668 5485\nTel: +234 913 338 0300\nEmail: oeosolution@gmail.com\nEmail: info@oeosolution.com"],
          ["Asaba", "F2 EAO Plaza by Nwansisi Park, Coca Junction, Asaba, Delta State", "Contact Lagos office"],
          ["Port Harcourt", "No. 4 Omachi Road, Rumuokoro, Rivers State", "Contact Lagos office"],
        ],
        [1800, 4560, 3000]
      ),

      new Paragraph({ spacing: { before: 300 } }),
      p("Schedule a live demo: see ReconFlow reconcile your bank's actual transaction data in real time."),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
        children: [
          new TextRun({ text: "ReconFlow by OEO Solutions", size: 28, bold: true, color: "1E3A5F" }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: "Complex reconciliation. High accuracy. One platform.", size: 22, italics: true, color: "0D9488" }),
        ],
      }),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, buf);
  console.log("Brochure:", OUT);
});
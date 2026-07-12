const fs = require("fs");
const path = require("path");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  ImageRun,
  Header,
  Footer,
  AlignmentType,
  LevelFormat,
  TableOfContents,
  HeadingLevel,
  BorderStyle,
  WidthType,
  ShadingType,
  PageNumber,
  PageBreak,
} = require("docx");

const IMG = path.join(__dirname, "..", "deliverables", "card-recon-images");
const OUT = path.join(__dirname, "..", "deliverables", "ReconFlow_Card_MultiGateway_Reconciliation_Guide.docx");

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

function img(file, w = 520, h = 300) {
  const p = path.join(IMG, file);
  if (!fs.existsSync(p)) return new Paragraph({ children: [new TextRun({ text: `[Image: ${file}]`, italics: true })] });
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 120 },
    children: [
      new ImageRun({
        type: "jpg",
        data: fs.readFileSync(p),
        transformation: { width: w, height: h },
        altText: { title: file, description: file, name: file },
      }),
    ],
  });
}
function caption(t) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 280 },
    children: [new TextRun({ text: t, italics: true, size: 20, color: "555555" })],
  });
}
function h1(t) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] });
}
function h2(t) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
}
function h3(t) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(t)] });
}
function p(t) {
  return new Paragraph({ spacing: { after: 160 }, children: [new TextRun(t)] });
}
function bullet(ref, t) {
  return new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 80 }, children: [new TextRun(t)] });
}
function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}
function table(headers, rows, colWidths) {
  const total = colWidths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({
        children: headers.map((h, i) =>
          new TableCell({
            borders,
            width: { size: colWidths[i], type: WidthType.DXA },
            shading: { fill: "1E3A5F", type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 20 })] })],
          })
        ),
      }),
      ...rows.map((row, ri) =>
        new TableRow({
          children: row.map((cell, ci) =>
            new TableCell({
              borders,
              width: { size: colWidths[ci], type: WidthType.DXA },
              shading: { fill: ri % 2 === 0 ? "F5F8FA" : "FFFFFF", type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text: cell, size: 20 })] })],
            })
          ),
        })
      ),
    ],
  });
}

const doc = new Document({
  title: "ReconFlow Card Multi-Gateway Reconciliation Guide",
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 32, bold: true, font: "Arial", color: "1E3A5F" }, paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 26, bold: true, font: "Arial", color: "0D9488" }, paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 24, bold: true, font: "Arial" }, paragraph: { spacing: { before: 180, after: 120 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: "b1", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "b2", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "b3", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "n1", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "n2", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "n3", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "n4", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "n5", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "n6", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "n7", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ],
  },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    headers: { default: new Header({ children: [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "0D9488", space: 1 } }, children: [new TextRun({ text: "ReconFlow", bold: true, color: "1E3A5F" }), new TextRun({ text: "  |  Card Multi-Gateway Reconciliation Guide", color: "666666" })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "OEO Solutions  |  Confidential  |  Page ", size: 18, color: "888888" }), new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "888888" })] })] }) },
    children: [
      new Paragraph({ spacing: { before: 2000 } }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ReconFlow", size: 56, bold: true, color: "1E3A5F" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [new TextRun({ text: "Operational Guide", size: 40, bold: true })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "Reconciling Bank Card Transactions Across Multiple Payment Gateways", size: 24, color: "0D9488" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Version 1.0  |  June 2026  |  OEO Solutions", size: 22, color: "888888" })] }),

      pageBreak(),
      h1("Table of Contents"),
      new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" }),
      pageBreak(),

      h1("1. Purpose & Scope"),
      p("This guide explains how to reconcile bank card transactions that pass through more than one payment gateway within a specific period, involving different customers, using ReconFlow. It is written for reconciliation officers, finance approvers, and auditors."),
      p("Goal: Every customer card payment in the period is either matched to settlement, explained (fee or reversal), or flagged as a documented exception."),

      h1("2. The Reconciliation Problem"),
      p("When one card rail is used across multiple gateways, you are matching three layers — not one file to one file."),
      img("three-layers.jpg", 540, 320),
      caption("Figure 1: Three-layer card reconciliation model in ReconFlow"),
      table(
        ["Layer", "What It Represents", "ReconFlow Report / Side"],
        [
          ["Internal", "Per-gateway logs (Gateway A, B, C)", "Card Transaction / Generic CSV — Internal"],
          ["Settlement", "Bank or acquirer settlement file", "Card Transaction / Bank Transfer — Settlement"],
          ["Assurance", "Expected fees vs actual fees", "Fee & Commission — Assurance"],
          ["Exception", "Chargebacks and reversals", "Chargeback & Reversal — Exception"],
        ],
        [1600, 3600, 4160]
      ),
      new Paragraph({ spacing: { after: 200 } }),
      h2("Why multi-gateway reconciliation is difficult"),
      bullet("b1", "Same amount may carry different references per gateway."),
      bullet("b1", "Bank files often show RRN/acquirer ref, not gateway order IDs."),
      bullet("b1", "Timing differs: customer payment, gateway posting, and bank settlement (T+0 / T+1)."),
      bullet("b1", "Fees differ per gateway; gross, fee, and net must align."),
      bullet("b1", "One card number alone cannot identify a unique transaction among many customers."),

      pageBreak(),
      h1("3. Golden Rules Before You Start"),
      numbered("n1", "Reconcile by fixed period (e.g. 1–30 June 2026), not isolated transactions."),
      numbered("n1", "Upload internal gateway data AND bank settlement — never settlement alone."),
      numbered("n1", "Use stable match keys: RRN, acquirer reference, gateway transaction ID."),
      numbered("n1", "Upload order: all internal gateway files first, then settlement, then fee assurance."),
      numbered("n1", "Tag each gateway with a distinct product_type — do not merge into one unnamed card bucket."),

      h1("4. Matching Key Priority"),
      img("matching-keys.jpg", 520, 340),
      caption("Figure 2: Card matching key hierarchy — strongest to weakest"),
      p("ReconFlow applies CH_CARD_ACQUIRER for RRN/acquirer matching and CH_MONNIFY_GATEWAY for gateway channel references. Never use card number or amount alone as the primary match key."),

      pageBreak(),
      h1("5. Data Requirements"),
      h2("5.1 Internal ledger — per gateway"),
      table(
        ["Field", "Required", "Purpose"],
        [
          ["Gateway transaction ID / order ref", "Yes", "Primary internal key"],
          ["Customer ID or merchant ref", "Yes", "Separates different customers"],
          ["Amount (gross)", "Yes", "Settlement match"],
          ["Fee", "Recommended", "Fee leakage detection"],
          ["Transaction date", "Yes", "Period and same-day rules"],
          ["Gateway name / product_type", "Yes", "Channel routing (CH_MONNIFY_GATEWAY, etc.)"],
        ],
        [3200, 1200, 4960]
      ),
      h2("5.2 Settlement ledger — bank / acquirer"),
      table(
        ["Field", "Required", "Purpose"],
        [
          ["RRN", "Yes", "CH_CARD_ACQUIRER primary key"],
          ["Acquirer reference", "Yes", "Backup match key"],
          ["Settled amount", "Yes", "Amount match with tolerance"],
          ["Settlement date", "Yes", "Period boundary"],
        ],
        [3200, 1200, 4960]
      ),
      h2("5.3 Example CSV — internal (multi-gateway)"),
      p("reference,amount,fee,product_type,transaction_date,customer_id"),
      p("GW-A-ORD-1001,15000.00,225.00,moniepoint_gateway,2026-06-05,CUST-4421"),
      p("GW-B-ORD-8822,8200.00,123.00,gateway,2026-06-05,CUST-9910"),

      pageBreak(),
      h1("6. ReconFlow Workflow"),
      img("workflow.jpg", 540, 360),
      caption("Figure 3: End-to-end multi-gateway card reconciliation workflow"),

      h2("Step 1 — Configure period"),
      p("Settings → Reconciliation: set audit year and amount tolerance (e.g. ₦50–₦100). Executive Intelligence: set Analysis Period dates."),
      h2("Step 2 — Upload internal files (each gateway)"),
      numbered("n2", "Live Reconciliation → Operations Platform (or Bulk Uploads)."),
      numbered("n2", "Report type: Card Transaction Report or Generic CSV."),
      numbered("n2", "Ledger side: Internal."),
      numbered("n2", "Repeat for Gateway A, Gateway B, Gateway C, and any direct acquirer log."),
      h2("Step 3 — Upload settlement"),
      numbered("n3", "Report type: Card Transaction Report (preferred) or Bank Transfer."),
      numbered("n3", "Ledger side: Settlement."),
      numbered("n3", "Include T+1 settlements for month-end if policy allows."),
      h2("Step 4 — Upload fee assurance"),
      numbered("n4", "Report type: Fee & Commission Breakdown."),
      numbered("n4", "Ledger side: Assurance (auto-locked)."),
      h2("Step 5 — Run reconciliation"),
      numbered("n5", "Click Run {year} Reconciliation."),
      numbered("n5", "Note match rate toast: matched/processed (%)."),
      p("Active rules include MATCH_AMOUNT_REFERENCE, MATCH_MULTI_FIELD, CH_CARD_ACQUIRER, CH_MONNIFY_GATEWAY, and EXC_UNMATCHED for anomalies."),
      h2("Step 6 — Review exceptions"),
      numbered("n6", "Anomalies & Alerts: filter Open / High Severity."),
      numbered("n6", "Resolve with AI → Save Investigation → Mark as Resolved (Approver)."),
      h2("Step 7 — Sign off & export"),
      numbered("n7", "Product Audit: review flagged % per card/gateway product."),
      numbered("n7", "Export PDF (Executive) and CSV (Reports)."),

      pageBreak(),
      h1("7. Common Exceptions & Resolutions"),
      table(
        ["Exception", "Likely Cause", "Action"],
        [
          ["Unmatched internal", "Gateway ref ≠ bank RRN", "Enrich mapping; re-upload corrections"],
          ["Unmatched settlement", "T+1 in next period", "Extend period or carry forward"],
          ["EXC_DOUBLE_POSTING", "Duplicate reference+amount", "Void duplicate posting"],
          ["EXC_FEE_LEAKAGE", "Gateway fee ≠ benchmark", "Review fee rule and gateway contract"],
          ["EXC_HIGH_VALUE", "Missing settlement line", "Escalate to bank/acquirer"],
        ],
        [2200, 3000, 4160]
      ),

      h1("8. Accuracy Checklist (Period Sign-Off)"),
      table(
        ["Check", "Pass Criteria"],
        [
          ["Upload completeness", "Every active gateway has internal file for period"],
          ["Settlement coverage", "Bank file includes T+0 and T+1 for month-end"],
          ["Match rate", "≥ agreed threshold or all exceptions documented"],
          ["Unmatched value", "Total ₦ variance within materiality limit"],
          ["Fee assurance", "No unresolved EXC_FEE_LEAKAGE above threshold"],
          ["Anomalies", "All High severity Resolved or carried forward"],
        ],
        [4000, 5360]
      ),

      h1("9. Example Scenario — June 2026"),
      p("900 customer card transactions across Monnify, Paystack, and direct acquirer. Bank settles net amounts."),
      table(
        ["Step", "Action"],
        [
          ["1", "Upload Monnify June log — internal, product_type = moniepoint_gateway"],
          ["2", "Upload Paystack June log — internal, product_type = gateway"],
          ["3", "Upload acquirer log — internal, Card Transaction Report"],
          ["4", "Upload bank settlement — settlement, Card Transaction Report"],
          ["5", "Upload fee benchmark — assurance"],
          ["6", "Run 2026 Reconciliation"],
          ["7", "Resolve ~5% unmatched (T+1, ref format)"],
          ["8", "Re-run after corrections; export PDF + CSV"],
        ],
        [800, 8560]
      ),

      h1("10. ReconFlow Quick Reference"),
      table(
        ["Task", "Path"],
        [
          ["Upload gateway files", "/reconciliation or /uploads"],
          ["Run reconciliation", "/reconciliation → Run {year} Reconciliation"],
          ["View exceptions", "/anomalies"],
          ["Product flagged %", "Executive → Product Audit"],
          ["Adjust rules", "/settings/rules + /control-gate"],
          ["Export report", "/executive → Export PDF"],
        ],
        [4000, 5360]
      ),

      new Paragraph({ spacing: { before: 300 } }),
      h2("Roles"),
      table(
        ["Role", "Responsibility"],
        [
          ["Auditor", "Upload files, run reconciliation, investigate anomalies"],
          ["Finance Approver", "Resolve exceptions, approve period close"],
          ["Administrator", "Configure tolerances, rules, audit year"],
          ["Executive", "Review Product Audit and PDF report"],
        ],
        [2400, 6960]
      ),
      new Paragraph({ spacing: { after: 200 } }),
      p("Document: ReconFlow Card Multi-Gateway Reconciliation Guide v1.0 | June 2026 | OEO Solutions"),
    ],
  }],
});

function numbered(ref, t) {
  return new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 80 }, children: [new TextRun(t)] });
}

Packer.toBuffer(doc).then((buf) => {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, buf);
  console.log("Guide written to:", OUT);
});
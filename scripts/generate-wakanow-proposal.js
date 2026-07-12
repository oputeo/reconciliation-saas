const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel, BorderStyle,
  WidthType, ShadingType, PageNumber, PageBreak,
} = require("docx");

const ORG = "Wakanow.com";
const ORG_SHORT = "Wakanow";
const OUT = path.join(__dirname, "..", "deliverables", "ReconFlow_Wakanow_Proposal.docx");
const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

function h1(t) { return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] }); }
function h2(t) { return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] }); }
function p(t, o = {}) { return new Paragraph({ spacing: { after: o.after ?? 160 }, ...o, children: [new TextRun(t)] }); }
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
function numbered(ref, t) {
  return new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 80 }, children: [new TextRun(t)] });
}

const doc = new Document({
  title: `ReconFlow Proposal — ${ORG}`,
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 30, bold: true, font: "Arial", color: "1E3A5F" }, paragraph: { spacing: { before: 320, after: 180 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 26, bold: true, font: "Arial", color: "0D9488" }, paragraph: { spacing: { before: 240, after: 140 }, outlineLevel: 1 } },
    ],
  },
  numbering: {
    config: [
      { reference: "b1", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "b2", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "b3", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "b4", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "n1", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "n2", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ],
  },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    headers: { default: new Header({ children: [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "0D9488", space: 1 } }, children: [new TextRun({ text: "OEO Solutions", bold: true, color: "1E3A5F" }), new TextRun({ text: `  |  Proposal — ReconFlow for ${ORG_SHORT}`, color: "666666" })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Confidential  |  OEO Solutions  |  Page ", size: 16, color: "888888" }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "888888" })] })] }) },
    children: [
      new Paragraph({ spacing: { before: 1800 } }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PROPOSAL", size: 44, bold: true, color: "1E3A5F" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 300 }, children: [new TextRun({ text: "ReconFlow — Reconciliation & Confirmed Revenue Platform", size: 30, bold: true })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: `Submitted to: ${ORG}`, size: 24 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Submitted by: OEO Solutions", size: 24 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600 }, children: [new TextRun({ text: "Date: June 2026", size: 22, color: "666666" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 }, children: [new TextRun({ text: "Valid until: 15 September 2026", size: 20, italics: true, color: "888888" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 800 }, children: [new TextRun({ text: "CONFIDENTIAL", size: 22, bold: true, color: "CC0000" })] }),

      pb(),
      h1("1. Cover Letter"),
      p("Dear Chief Financial Officer / Head of Finance / Head of Payments,"),
      p(`OEO Solutions is pleased to submit this proposal for the deployment of ReconFlow — our AI-powered reconciliation and revenue assurance platform — to support ${ORG}'s (${ORG_SHORT}) financial control, confirmed sales reporting, and margin integrity across flights, hotels, packages, and payment channels.`),
      p(`${ORG_SHORT} processes high volumes of bookings daily across web, mobile, affiliates, and agent channels — with customer collections via card gateways, bank transfers, wallets, and instalment products such as Pay Small Small, while settling airlines, hotels, and partners on separate timelines.`),
      p("In this environment, gross booking value is not the same as confirmed revenue. Only transactions that reconcile — customer payment matched to booking, gateway settlement matched to collection, supplier cost matched to payout — represent sales you can recognise with confidence. Unmatched items are exposure: potential leakage, refund risk, or unconfirmed pipeline."),
      p("ReconFlow makes matched transactions your confirmed revenue baseline. Every reconciliation run produces a defensible confirmed-sales figure, with unmatched and flagged items held in a structured exception queue until resolved or written off with approver sign-off."),
      p("This proposal outlines requirements, solution design, deliverables, implementation, commercial terms, and support. We welcome a live demonstration using Wakanow's actual booking, gateway, and settlement file formats."),
      p("Yours faithfully,"),
      p("[Authorised Signatory Name]\nManaging Director / Business Development Lead\nOEO Solutions"),

      pb(),
      h1("2. Executive Summary"),
      p(`ReconFlow will enable ${ORG_SHORT} to:`),
      b("b1", "Translate matched transactions into confirmed revenue and sales — not estimated gross bookings."),
      b("b1", "Consolidate booking ledger, gateway settlement, bank, and supplier files into one master reconciled ledger."),
      b("b1", "Automate matching with 21 configurable rules, confidence scoring, and automatic flagging."),
      b("b1", "Separate confirmed sales from unconfirmed exposure in executive dashboards and PDF reports."),
      b("b1", "Assure markup and commission margin post-settlement against expected benchmarks."),
      b("b1", "Resolve refunds, chargebacks, and instalment exceptions through AI-assisted investigation and approver workflow."),
      b("b1", "Govern rule changes via Control Gate with immutable audit trail."),
      p("OEO Solutions proposes a 10-week phased implementation, followed by ongoing SaaS subscription and dedicated account management."),

      pb(),
      h1("3. Confirmed Revenue — The Core Principle"),
      p("Wakanow's finance team needs a single, auditable answer to: What did we actually earn this period? ReconFlow defines that answer through reconciliation status:"),
      tbl(
        ["Status", "Definition", "Revenue Treatment"],
        [
          ["Matched (high confidence)", "Customer payment ↔ booking ↔ settlement aligned; score ≥ threshold", "Counts as confirmed revenue / recognised sale"],
          ["Matched (flagged)", "Matched but confidence below threshold — requires review", "Held as provisional; not confirmed until approver clears or re-matches"],
          ["Unmatched", "Payment or booking with no reconciled counterpart", "Not confirmed revenue — exception queue; leakage or dispute risk"],
          ["Resolved exception", "Previously unmatched; root cause documented; approver signed off", "Confirmed or written off per resolution category"],
          ["Refund / reversal", "Matched reversal against original booking", "Reduces confirmed revenue in period"],
        ],
        [2200, 4480, 2680]
      ),
      p("Executive dashboards and PDF reports surface Confirmed Sales (₦), Unconfirmed Exposure (₦), Match Rate %, and Margin Assured (₦) — giving the CFO a board-ready revenue position, not a booking-system export."),

      pb(),
      h1("4. Understanding of Wakanow's Requirements"),
      tbl(
        ["Requirement", "Description"],
        [
          ["Confirmed revenue reporting", "Matched transactions = recognised sales; unmatched held as exposure"],
          ["Multi-channel reconciliation", "Booking ledger vs gateway, bank, wallet, and supplier settlement"],
          ["Product-line visibility", "Flights, hotels, packages, cars — confirmed sales per product"],
          ["Pay Small Small instalments", "Instalment payments matched to booking value over time"],
          ["Refund & chargeback handling", "Reversals reduce confirmed revenue with full audit trail"],
          ["Margin assurance", "Markup and commission validated post supplier settlement"],
          ["Affiliate & agent channel", "Partner bookings vs commission payout reconciliation"],
          ["Period-end close", "Accelerate month-end with live confirmed-sales position"],
          ["Executive & investor reporting", "PDF dashboards: confirmed sales, leakage, match rate, margin"],
          ["Governance", "Control Gate for rule changes; immutable audit logs"],
        ],
        [3200, 6160]
      ),

      pb(),
      h1("5. Proposed Solution"),
      h2("5.1 Platform Modules"),
      tbl(
        ["Module", "Wakanow Application"],
        [
          ["Live Reconciliation", "Ingest booking, gateway, bank, supplier CSVs; produce confirmed sales ledger"],
          ["Anomalies & AI Resolver", "Unmatched payments, refund gaps, fee variance — investigate and resolve"],
          ["Executive Intelligence", "Confirmed Sales dashboard, leakage, margin KPIs, PDF export"],
          ["Control Gate", "Rule approval workflow; audit HTML reports"],
          ["Settings & Administration", "Workspace config, roles, product lines, security"],
        ],
        [2800, 6560]
      ),

      h2("5.2 Channel & Product Coverage"),
      tbl(
        ["Source / Product", "Scope"],
        [
          ["Flight bookings", "Payment ↔ PNR ↔ airline/GDS settlement → confirmed sale + margin"],
          ["Hotel reservations", "Collection ↔ supplier invoice ↔ net payout"],
          ["Packages & bundles", "Multi-component booking vs consolidated payment"],
          ["Pay Small Small", "Instalment schedule vs booking — cumulative confirmed revenue"],
          ["Card / gateway", "Gateway settlement ↔ booking ledger (RRN/reference)"],
          ["Bank transfers & wallets", "Reference + amount matching"],
          ["Affiliate / agent", "Partner booking vs commission payout"],
          ["Refunds & chargebacks", "Reversal matching; reduces confirmed revenue"],
          ["Fee & margin assurance", "Expected vs actual MDR and markup post-match"],
        ],
        [3600, 5760]
      ),

      h2("5.3 Confirmed Sales Metrics (Executive Dashboard)"),
      tbl(
        ["Metric", "Source"],
        [
          ["Confirmed Sales (₦)", "Sum of matched, high-confidence transactions in period"],
          ["Unconfirmed Exposure (₦)", "Sum of unmatched + flagged items pending resolution"],
          ["Match Rate %", "Matched ÷ processed — live per run and per product line"],
          ["Margin Assured (₦)", "Confirmed sales minus validated supplier cost and gateway fees"],
          ["Refund Impact (₦)", "Matched reversals reducing net confirmed revenue"],
          ["Leakage Identified (₦)", "Fee variance and unresolved exceptions with ₦ impact"],
        ],
        [3600, 5760]
      ),

      pb(),
      h1("6. Scope of Work"),
      h2("6.1 OEO Solutions Responsibilities"),
      numbered("n1", "Discovery workshop: map booking, gateway, bank, supplier, and affiliate file formats."),
      numbered("n1", "Provision dedicated Wakanow workspace with confirmed-sales dashboard configuration."),
      numbered("n1", "Configure matching rules, tolerances, and confidence thresholds per product line."),
      numbered("n1", "Build ingest templates for Phase 1 (flights + primary gateway)."),
      numbered("n1", "Pilot reconciliation on live data; validate confirmed-sales figures against finance baseline."),
      numbered("n1", "Role-based training: Finance, Payments, Audit, Executive, ICT Admin."),
      numbered("n1", "Roll out hotels, packages, Pay Small Small, and affiliate channels (Phase 2)."),
      numbered("n1", "Deliver operational manual and CFO reporting guide."),
      numbered("n1", "Ongoing SaaS hosting, updates, L2 support, and account management."),

      h2("6.2 Wakanow Responsibilities"),
      b("b3", "Designate executive sponsor (CFO recommended) and project lead from Finance/Payments."),
      b("b3", "Provide sample exports: booking ledger, gateway settlement, bank statement, supplier file."),
      b("b3", "Make staff available for discovery, UAT, and training."),
      b("b3", "Approve rules, tolerances, and confirmed-revenue confidence thresholds."),
      b("b3", "Assign Finance Approver(s) for exception resolution and Control Gate sign-off."),

      h2("6.3 Out of Scope (unless separately agreed)"),
      b("b4", "Booking engine or payment gateway modification."),
      b("b4", "Historical migration beyond agreed pilot period."),
      b("b4", "Custom BI outside standard ReconFlow exports."),
      b("b4", "On-premise hosting."),

      pb(),
      h1("7. Deliverables"),
      tbl(
        ["#", "Deliverable", "Timing"],
        [
          ["1", "Discovery report & Wakanow channel mapping", "Week 2"],
          ["2", "Configured workspace + confirmed-sales dashboard", "Week 3"],
          ["3", "Phase 1 ingest templates (flights + gateway)", "Week 4–5"],
          ["4", "Pilot report: match rate, confirmed sales, exposure, margin", "Week 6"],
          ["5", "Training workshops + CFO reporting guide", "Week 7"],
          ["6", "Phase 2 rollout (hotels, packages, instalments, affiliates)", "Weeks 8–9"],
          ["7", "Go-live + executive PDF template", "Week 10"],
        ],
        [400, 5560, 3400]
      ),

      pb(),
      h1("8. Implementation Timeline"),
      tbl(
        ["Phase", "Duration", "Activities"],
        [
          ["Discovery", "Weeks 1–2", "File mapping, product lines, confirmed-revenue rules design"],
          ["Configuration", "Weeks 3–5", "Templates, tolerance tuning, confidence thresholds"],
          ["Flight + gateway pilot", "Week 6", "Live run; validate confirmed sales vs finance baseline"],
          ["Training", "Week 7", "Finance, payments, executive briefing"],
          ["Product expansion", "Weeks 8–9", "Hotels, packages, Pay Small Small, affiliates"],
          ["Go-live", "Week 10", "Full agreed scope; steady-state playbook"],
          ["Steady state", "Ongoing", "Daily/period ingest, confirmed-sales close, quarterly review"],
        ],
        [2200, 1400, 5760]
      ),

      pb(),
      h1("9. Commercial Terms"),
      h2("9.1 Pricing Structure"),
      tbl(
        ["Component", "Description", "Indicative Fee"],
        [
          ["Implementation (one-time)", "Discovery, configuration, training, go-live (10 weeks)", "To be quoted post-discovery"],
          ["Annual SaaS subscription", "Platform, hosting, updates, L2 support, account manager", "To be quoted by volume tier"],
          ["Phase 2 expansion", "Additional product lines or gateways", "Per-wave fee — quoted at discovery"],
          ["Optional: managed reconciliation", "OEO-operated daily reconciliation", "Monthly retainer — optional"],
        ],
        [2800, 4160, 2400]
      ),

      h2("9.2 Payment Terms"),
      b("b1", "Implementation: 50% on signing, 50% on go-live acceptance."),
      b("b1", "SaaS: invoiced annually in advance, or quarterly by agreement."),
      b("b1", "Fees exclusive of VAT (7.5%) where applicable."),

      h2("9.3 Contract Term"),
      p("Initial SaaS term: 12 months from go-live. Annual renewal unless terminated with 60 days written notice."),

      pb(),
      h1("10. Service Level & Support"),
      tbl(
        ["Item", "Commitment"],
        [
          ["Uptime", "99.5% monthly (excluding scheduled maintenance)"],
          ["Support hours", "Monday–Friday, 08:00–18:00 WAT"],
          ["Critical incident", "Response within 4 business hours"],
          ["Standard query", "Within 1 business day"],
          ["Account manager", "Assigned post go-live"],
          ["Quarterly review", "Confirmed sales trends, leakage, match-rate roadmap"],
        ],
        [4000, 5360]
      ),

      pb(),
      h1("11. Security & Compliance"),
      b("b2", "Dedicated tenant with row-level security and role-based access."),
      b("b2", "Immutable audit log for uploads, runs, resolutions, and rule changes."),
      b("b2", "Encrypted in transit (TLS) and at rest."),
      b("b2", "Session timeout and IP allowlist configurable."),
      p("OEO Solutions will support Wakanow's vendor due diligence upon request."),

      pb(),
      h1("12. Acceptance Criteria"),
      numbered("n2", "Phase 1 channels ingest with > 0 rows mapped per template."),
      numbered("n2", "Pilot achieves match rate ≥ 90% on flights/gateway or all exceptions documented."),
      numbered("n2", "Confirmed Sales dashboard reconciles to within agreed variance of finance baseline."),
      numbered("n2", "Exception and approver workflow tested end-to-end."),
      numbered("n2", "Executive PDF report generated with confirmed sales, exposure, and margin."),
      numbered("n2", "All designated users trained with correct role permissions."),

      pb(),
      h1("13. About OEO Solutions"),
      p("OEO Solutions specialises in reconciliation and revenue assurance for payment-intensive businesses. ReconFlow is deployed for banks, fintechs, and high-volume commerce platforms requiring confirmed-revenue reporting with full audit trail."),
      tbl(
        ["Office", "Address", "Contact"],
        [
          ["Lagos (Head Office)", "Plot 5004, Gwandu Close, Beachwood Estate, Ibeju-Lekki, Lagos", "Tel: +234 803 668 5485\nTel: +234 913 338 0300\nEmail: oeosolution@gmail.com\nEmail: info@oeosolution.com"],
          ["Asaba", "F2 EAO Plaza by Nwansisi Park, Coca Junction, Asaba, Delta State", "Via Lagos office"],
          ["Port Harcourt", "No. 4 Omachi Road, Rumuokoro, Rivers State", "Via Lagos office"],
        ],
        [1800, 4560, 3000]
      ),

      pb(),
      h1("14. Acceptance & Next Steps"),
      numbered("n2", "Review proposal with CFO, Finance, and Payments leadership."),
      numbered("n2", "Schedule 60-minute live demo with Wakanow file formats."),
      numbered("n2", "Conduct half-day discovery to finalise scope and pricing."),
      numbered("n2", "Execute agreement and commence Phase 1."),
      new Paragraph({ spacing: { before: 300 } }),
      p("Proposal prepared by: OEO Solutions"),
      p("Date: June 2026"),
      p("Valid until: 15 September 2026"),
      new Paragraph({ spacing: { before: 400 } }),
      tbl(
        ["", "For OEO Solutions", `For ${ORG_SHORT}`],
        [
          ["Signature", "_________________________", "_________________________"],
          ["Name", "[Authorised Signatory]", "[Authorised Signatory]"],
          ["Title", "Managing Director / Business Development Lead", "Chief Financial Officer / Head of Finance"],
          ["Date", "_________________________", "_________________________"],
        ],
        [1600, 3880, 3880]
      ),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, buf);
  console.log("Proposal:", OUT);
});
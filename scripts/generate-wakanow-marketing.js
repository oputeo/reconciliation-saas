const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel, BorderStyle,
  WidthType, ShadingType, PageNumber, PageBreak,
} = require("docx");

const ORG = "Wakanow.com";
const ORG_SHORT = "Wakanow";
const OUT = path.join(__dirname, "..", "deliverables", "ReconFlow_Wakanow_Marketing_Pitch.docx");
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

const doc = new Document({
  title: `ReconFlow Pitch — ${ORG}`,
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
    headers: { default: new Header({ children: [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "0D9488", space: 1 } }, children: [new TextRun({ text: "OEO Solutions", bold: true, color: "1E3A5F" }), new TextRun({ text: `  |  ReconFlow for ${ORG_SHORT}`, color: "666666" })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "oeosolution@gmail.com  |  info@oeosolution.com  |  Page ", size: 16, color: "888888" }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "888888" })] })] }) },
    children: [
      new Paragraph({ spacing: { before: 2000 } }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ReconFlow", size: 64, bold: true, color: "1E3A5F" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, children: [new TextRun({ text: "Reconciliation & Revenue Assurance for Africa's Leading Online Travel Platform", size: 26, bold: true, color: "0D9488" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [new TextRun({ text: `Prepared for ${ORG}`, size: 24 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "Every booking. Every payment. Every supplier settlement. One reconciled truth.", size: 22, italics: true, color: "555555" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "OEO Solutions  |  June 2026", size: 22, color: "888888" })] }),

      pb(),
      h1("Executive Summary"),
      p(`${ORG_SHORT} sells flights, hotels, packages, and travel services across web, mobile app, affiliates, and agent channels — collecting customer payments through card gateways, bank transfers, wallets, and instalment products like Pay Small Small, while settling airlines, hotels, and partners on different timelines and fee structures.`),
      p("That is a reconciliation problem, not a booking problem. Gross bookings are not confirmed revenue. Only matched transactions — customer payment aligned to booking, gateway settlement aligned to collection, supplier cost aligned to payout — translate into sales your CFO can recognise with confidence."),
      p("ReconFlow is the AI-powered reconciliation layer that makes that translation automatic: matched = confirmed revenue; unmatched = exposure in a structured exception queue until resolved. Executive dashboards show Confirmed Sales (₦), Unconfirmed Exposure (₦), match rate, and margin assured — board-ready, daily."),

      h2("Why Wakanow needs ReconFlow now"),
      b("b1", "Transaction volume and product mix are growing — flights, hotels, cars, packages, and instalment plans each produce different file formats."),
      b("b1", "Multiple payment gateways and acquirers mean settlement files never align with internal booking ledgers without systematic matching."),
      b("b1", "Travel is refund-heavy — cancellations, schedule changes, and partial refunds create exception volume that spreadsheets cannot manage."),
      b("b1", "Supplier settlement lags (T+1 to T+7) create timing gaps that manual VLOOKUP cannot resolve at scale."),
      b("b1", "Affiliate and agent channels add a second layer of commission reconciliation on top of core bookings."),
      b("b1", "Leadership and investors expect margin visibility — not estimates assembled at month-end."),

      pb(),
      h1("The Travel Reconciliation Challenge"),
      tbl(
        ["Pain Point", "What Happens Today", "Business Impact"],
        [
          ["Gateway vs booking mismatch", "Card approved but booking ledger shows unpaid or duplicate", "Revenue leakage, customer disputes, support load"],
          ["Airline / GDS settlement gaps", "PNR issued but supplier debit doesn't match expected net", "Margin erosion, supplier reconciliation backlog"],
          ["Refund & reversal chaos", "Partial refunds split across gateway, booking, and supplier", "Days to resolve; audit trail gaps"],
          ["Pay Small Small instalments", "Multi-payment plans vs single booking value", "Instalment tracking errors; bad debt blind spots"],
          ["Multi-gateway fee variance", "MDR differs per gateway and product line", "Undetected commission leakage"],
          ["Affiliate payouts", "Partner bookings vs commission owed", "Over/under-payment to affiliates"],
          ["Month-end close", "Finance assembles data from 6+ systems manually", "Delayed reporting; leadership flying blind"],
        ],
        [2800, 3280, 3280]
      ),

      pb(),
      h1("ReconFlow for Wakanow — Built for Travel Commerce"),
      p("ReconFlow does not replace your booking engine or payment gateway. It sits above them — ingesting exports from your booking system, payment processors, bank statements, and supplier settlement files, then producing one master reconciled ledger."),
      h2("Core capabilities"),
      b("b2", "Multi-channel ingest: booking ledger, card gateway, bank transfer, wallet, supplier settlement, fee benchmarks, chargebacks."),
      b("b2", "21 configurable matching rules: reference + amount, PNR/booking ID matching, fuzzy tolerance, cross-channel linking."),
      b("b2", "Confidence scoring: every match rated 0–100; low-confidence items auto-flagged before they become disputes."),
      b("b2", "AI anomaly resolver: root-cause analysis for unmatched payments, refund mismatches, and fee variances."),
      b("b2", "Control Gate: rule changes require finance approver sign-off — full audit trail."),
      b("b2", "Executive PDF reports and dashboards: match rates, leakage, and margin KPIs by product line."),

      h2("Wakanow product coverage"),
      tbl(
        ["Product / Channel", "ReconFlow Reconciliation"],
        [
          ["Flight bookings", "Customer payment ↔ booking PNR ↔ airline/GDS settlement"],
          ["Hotel reservations", "Collection ↔ supplier invoice ↔ net payout"],
          ["Packages & bundles", "Multi-component booking vs consolidated payment"],
          ["Car hire & transfers", "Partner settlement vs customer collection"],
          ["Pay Small Small (instalments)", "Instalment schedule vs booking value vs gateway credits"],
          ["Card / gateway payments", "Gateway settlement ↔ internal booking ledger (RRN/reference)"],
          ["Bank transfers & wallets", "Transfer reference matching with amount tolerance"],
          ["Affiliate & agent channel", "Partner booking file vs commission payout"],
          ["Refunds & chargebacks", "Exception queue with approver workflow and audit evidence"],
          ["Markup & commission assurance", "Expected margin vs actual post-settlement"],
        ],
        [3600, 5760]
      ),

      pb(),
      h1("Matched Transactions = Confirmed Revenue"),
      p("ReconFlow separates what Wakanow has booked from what Wakanow has earned:"),
      tbl(
        ["Status", "Revenue Meaning"],
        [
          ["Matched (high confidence)", "Confirmed sale — recognised revenue"],
          ["Flagged / unmatched", "Unconfirmed exposure — not revenue until resolved"],
          ["Refund matched", "Reduces confirmed revenue in period"],
          ["Margin assured", "Confirmed sale minus validated supplier cost and gateway fees"],
        ],
        [3600, 5760]
      ),

      h2("Metrics Your CFO Can Defend"),
      tbl(
        ["Metric", "What Wakanow Finance Sees"],
        [
          ["Confirmed Sales (₦)", "Sum of matched transactions — board-ready revenue number"],
          ["Unconfirmed Exposure (₦)", "At-risk value in exception queue"],
          ["Match rate %", "Live after every run — by product (flights, hotels, packages)"],
          ["Margin assured (₦)", "Proven markup after supplier settlement"],
          ["Gateway fee leakage", "MDR variance flagged post-match"],
          ["Audit trail", "Immutable log of uploads, runs, resolutions, rule changes"],
        ],
        [3600, 5760]
      ),

      pb(),
      h1("From Manual Close to Real-Time Control"),
      tbl(
        ["Today", "With ReconFlow"],
        [
          ["Week-long month-end reconciliation", "Daily or on-demand runs with live match rate"],
          ["Refund disputes resolved by spreadsheet search", "Instant lookup: matched, flagged, or exception with evidence"],
          ["Gateway fees checked quarterly", "Continuous fee assurance after every settlement ingest"],
          ["Supplier margin estimated, not proven", "Booking-to-settlement margin tracked per PNR/product"],
          ["No confidence on partial matches", "Scored matches; low-confidence auto-flagged"],
          ["Audit requests trigger manual assembly", "One-click executive PDF and HTML audit pack"],
        ],
        [4680, 4680]
      ),

      pb(),
      h1("Implementation — Fast, Phased, Low Risk"),
      p("ReconFlow integrates via CSV exports your teams already produce — no booking engine modification required."),
      tbl(
        ["Phase", "Timeline", "Outcome"],
        [
          ["Discovery", "Weeks 1–2", "Map booking, gateway, bank, and supplier file formats"],
          ["Flight + gateway pilot", "Weeks 3–5", "Live reconciliation on highest-volume product line"],
          ["Refund & exception workflow", "Week 6", "Anomaly queue, AI investigation, finance approver sign-off"],
          ["Hotels + packages rollout", "Weeks 7–8", "Additional product lines and supplier templates"],
          ["Affiliate + Pay Small Small", "Week 9", "Instalment and partner commission reconciliation"],
          ["Go-live + executive reporting", "Week 10", "Full agreed scope; management dashboards configured"],
        ],
        [2200, 1600, 5560]
      ),

      pb(),
      h1("Security & Governance"),
      b("b3", "Dedicated Wakanow workspace with multi-tenant isolation and row-level security."),
      b("b3", "Role-based access: Executive (view), Finance/Audit (reconcile), Approver (sign-off), Admin (ICT)."),
      b("b3", "Immutable audit log for every upload, reconciliation run, and rule change."),
      b("b3", "Data encrypted in transit (TLS) and at rest."),
      b("b3", "Configurable session timeout and IP allowlist."),

      pb(),
      h1("Why OEO Solutions"),
      p("OEO Solutions builds ReconFlow for payment-intensive businesses — banks, fintechs, and high-volume commerce platforms. The same engine that reconciles card acquirers and payment gateways is directly applicable to OTA economics: customer collection, gateway settlement, supplier payout, and margin assurance."),
      p("We deploy fast, configure for your file formats, and support you locally from Lagos, Asaba, and Port Harcourt."),

      h2("The Closing Argument"),
      p(`${ORG_SHORT} has built one of Africa's most recognised travel brands. The next competitive edge is not more inventory — it is financial precision: knowing that every booking paid, every supplier settled, and every naira of margin is accounted for in real time.`),
      p("ReconFlow turns reconciliation from a month-end burden into a daily control — protecting margin, reducing disputes, and giving leadership the numbers they need to scale with confidence."),

      h2("Next Step"),
      p("OEO Solutions invites Wakanow's CFO, Head of Finance, and Payments lead to a 60-minute live demonstration. We will reconcile a sample of your booking ledger, gateway settlement, and supplier file — and show match rate, exceptions, and executive report in real time."),
      tbl(
        ["Office", "Address", "Contact"],
        [
          ["Lagos (Head Office)", "Plot 5004, Gwandu Close, Beachwood Estate, Ibeju-Lekki, Lagos", "Tel: +234 803 668 5485\nTel: +234 913 338 0300\nEmail: oeosolution@gmail.com\nEmail: info@oeosolution.com"],
          ["Asaba", "F2 EAO Plaza by Nwansisi Park, Coca Junction, Asaba, Delta State", "Contact Lagos office"],
          ["Port Harcourt", "No. 4 Omachi Road, Rumuokoro, Rivers State", "Contact Lagos office"],
        ],
        [1800, 4560, 3000]
      ),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 }, children: [new TextRun({ text: "ReconFlow by OEO Solutions", size: 28, bold: true, color: "1E3A5F" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Every booking. Every settlement. One truth.", size: 22, italics: true, color: "0D9488" })] }),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, buf);
  console.log("Pitch:", OUT);
});
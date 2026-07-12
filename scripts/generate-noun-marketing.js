const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel, BorderStyle,
  WidthType, ShadingType, PageNumber, PageBreak,
} = require("docx");

const ORG = "National Open University of Nigeria";
const ORG_SHORT = "NOUN";
const OUT = path.join(__dirname, "..", "deliverables", "ReconFlow_NOUN_Marketing_Pitch.docx");
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
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, children: [new TextRun({ text: "The Reconciliation Platform Nigeria's Largest Open University Cannot Scale Without", size: 26, bold: true, color: "0D9488" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [new TextRun({ text: `Prepared for ${ORG} (${ORG_SHORT})`, size: 24 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "Every fee. Every study centre. Every payment channel. One reconciled truth.", size: 22, italics: true, color: "555555" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "OEO Solutions  |  June 2026", size: 22, color: "888888" })] }),

      pb(),
      h1("The Inevitability Thesis"),
      p(`${ORG} (${ORG_SHORT}) is not a conventional campus university. It is a nationwide, open-and-distance-learning institution serving hundreds of thousands of learners across 100+ study centres — with fee collection spread across Remita (RRR), online portals, bank transfers, study-centre deposits, and multiple revenue lines every semester.`),
      p("At this scale, reconciliation is not a back-office nicety. It is the control that protects public funds, defends audit outcomes, prevents revenue leakage, and ensures that a student who has paid is never left stranded by a data mismatch between the bursary, ICT, and study centre records."),
      p("Spreadsheets, manual matching, and siloed bursary tools were designed for a smaller, centralised world. NOUN has outgrown them. ReconFlow is the inevitable next layer — the single platform that turns fragmented payment evidence into audit-ready, executive-grade financial truth."),

      h2("Three forces make ReconFlow inevitable for NOUN"),
      tbl(
        ["Force", "What it means for NOUN", "Without ReconFlow"],
        [
          ["Scale", "Hundreds of thousands of fee transactions per academic cycle across all programmes", "Match errors scale with volume; period-end close becomes unmanageable"],
          ["Decentralisation", "100+ study centres, multiple banks, Remita RRRs, and portal ledgers", "No single source of truth; disputes and audit queries multiply"],
          ["Public accountability", "Federal institution subject to internal audit, OAuGF scrutiny, and public trust", "Inability to produce timely, defensible reconciliation evidence on demand"],
        ],
        [2200, 3580, 3580]
      ),

      pb(),
      h1("The Problem NOUN Faces Today"),
      p("Every semester, NOUN's bursary and finance teams confront the same structural challenge — not because of incompetence, but because the operating model has exceeded what manual tools can bear:"),
      b("b1", "A student pays via Remita RRR, but the portal shows 'unpaid' — because reference formats, timing, or amount tolerances were never matched systematically."),
      b("b1", "Study centre collections arrive in bank statements days later, disconnected from the student matriculation number that originated the payment."),
      b("b1", "Examination fees, ICT levies, course registration, and tuition run on different schedules — each producing separate files that nobody reconciles in one pass."),
      b("b1", "Gateway settlement reports (Remita, bank, payment processor) do not align with internal bursary ledgers without days of manual VLOOKUP work."),
      b("b1", "Internal audit asks for evidence of fee completeness for a semester — and the team spends weeks assembling spreadsheets that still contain unexplained gaps."),
      b("b1", "Leadership cannot see live match rates, leakage, or exception trends by study centre, programme, or fee type."),
      p("These are not edge cases. At NOUN's scale, they are the default. And every unmatched transaction is either lost revenue, a student complaint, or an audit finding waiting to happen."),

      h2("The cost of continuing without a reconciliation platform"),
      tbl(
        ["Cost Category", "Estimated Impact"],
        [
          ["Unmatched fee payments", "Students blocked from registration/exams despite valid payment; reputational damage"],
          ["Revenue leakage", "Funds collected at study centres or via gateways not fully credited to central accounts"],
          ["Manual labour", "Senior bursary staff spending weeks per semester on matching instead of financial control"],
          ["Audit exposure", "Qualified opinions, management letters, and public scrutiny over fee accountability"],
          ["Management blind spots", "No real-time visibility into collection performance by centre or programme"],
          ["ICT–Finance friction", "Portal data and bursary data treated as separate truths, not one reconciled ledger"],
        ],
        [3600, 5760]
      ),

      pb(),
      h1("Why ReconFlow — Not Another Portal Patch"),
      p("NOUN does not need another payment gateway or student portal module. It needs a reconciliation and revenue assurance layer that sits above every channel and produces one master ledger — the same architecture used by banks and payment institutions, now applied to university fee operations."),
      b("b2", "Ingests bursary ledgers, Remita reports, bank statements, gateway settlements, and study-centre remittance files in standard CSV format."),
      b("b2", "Runs 21 configurable matching rules — reference + amount, fuzzy tolerance, multi-field, and cross-channel linking."),
      b("b2", "Flags low-confidence matches automatically; unmatched items become structured anomalies — never silently dropped."),
      b("b2", "AI-assisted investigation accelerates root-cause analysis for exceptions (wrong reference, partial payment, timing lag)."),
      b("b2", "Control Gate governance ensures no rule change goes live without bursar/audit approver sign-off."),
      b("b2", "Executive PDF reports, CSV exports, and HTML audit packs — ready for management, council, and external audit."),

      h2("Built for NOUN's fee ecosystem"),
      tbl(
        ["Fee / Channel", "ReconFlow Coverage"],
        [
          ["Tuition & school fees", "Match portal records ↔ Remita RRR ↔ bank credit"],
          ["Course registration", "Semester registration payments vs bursary ledger"],
          ["Examination fees", "Exam fee ingest with reference-based matching"],
          ["ICT & administrative levies", "Assurance pass validates expected vs actual amounts"],
          ["Transcript & certification fees", "Separate product line with own rules and tolerances"],
          ["Study centre remittances", "Centre-level collection files vs HQ settlement"],
          ["Bank deposits & transfers", "NIP/transfer logs matched to student references"],
          ["Refunds & reversals", "Exception queue with approver workflow and audit trail"],
        ],
        [3600, 5760]
      ),

      pb(),
      h1("The ReconFlow Advantage for NOUN"),
      h2("1. One Master Ledger Across the Nation"),
      p("Whether a student pays in Abuja, Lagos, Port Harcourt, or any of NOUN's study centres nationwide, ReconFlow consolidates all payment evidence into a single reconciled view — sliced by study centre, programme, faculty, or fee type."),
      h2("2. Accuracy You Can Measure and Defend"),
      tbl(
        ["Metric", "What NOUN Leadership Sees"],
        [
          ["Match rate %", "Live after every reconciliation run — by product, centre, or semester"],
          ["Flagged transactions", "Per-fee-type flagged count and percentage"],
          ["Match confidence score", "0–100 per transaction; low scores auto-flagged for review"],
          ["Exception queue", "Structured anomalies with severity, variance in ₦, and investigation notes"],
          ["Audit trail", "Immutable log of uploads, runs, resolutions, and rule changes"],
        ],
        [3600, 5760]
      ),
      h2("3. AI-Powered Exception Resolution"),
      p("When a student's payment does not match, ReconFlow's AI Resolver analyses likely root cause — truncated reference, amount tolerance breach, duplicate RRR, timing lag — and suggests investigation steps. Bursary approvers sign off resolutions, creating defensible evidence for audit."),
      h2("4. Governance That Satisfies Internal Audit"),
      p("Rule changes (tolerances, matching logic, fee benchmarks) flow through Control Gate: proposed by reconciliation officers, approved by bursar/finance lead, published with full diff and HTML audit report. No shadow configuration. No undocumented changes."),
      h2("5. Executive Intelligence for Council and Management"),
      p("Vice-Chancellor, Registrar, and Bursar get dashboards showing collection performance, leakage trends, and period-end readiness — plus one-click PDF executive reports suitable for management meetings and governing council."),

      pb(),
      h1("From Pain to Proof — The NOUN Transformation"),
      tbl(
        ["Today (Manual)", "With ReconFlow"],
        [
          ["Weeks to close a semester's fee reconciliation", "Days — with live match rate from day one of ingest"],
          ["Student disputes resolved by manual bank-statement search", "Instant lookup: matched, flagged, or exception with evidence"],
          ["Audit requests trigger spreadsheet assembly", "One-click audit pack: reconciliation run + exception resolutions + rule history"],
          ["Study centre performance invisible until year-end", "Per-centre match rates and leakage dashboards every cycle"],
          ["ICT portal and bursary data treated separately", "Single master ledger linking portal, Remita, and bank evidence"],
          ["No confidence score on partial matches", "Every match scored; low-confidence items flagged before they become disputes"],
        ],
        [4680, 4680]
      ),

      pb(),
      h1("Implementation — Fast, Phased, Low Disruption"),
      p("ReconFlow does not replace NOUN's student portal or Remita integration. It adds the reconciliation layer on top — ingesting exports your teams already produce."),
      tbl(
        ["Phase", "Timeline", "Outcome"],
        [
          ["Discovery", "Weeks 1–2", "Map fee types, file formats, study centre hierarchy, rule design"],
          ["Central pilot", "Weeks 3–5", "Live reconciliation: tuition + Remita + main bank accounts"],
          ["Exception workflow", "Week 6", "Anomaly queue, AI investigation, bursar approver sign-off"],
          ["Study centre rollout", "Weeks 7–9", "Per-centre ingest templates and dashboards"],
          ["Full semester go-live", "Week 10", "All agreed fee types; executive reporting configured"],
          ["Steady state", "Ongoing", "Per-semester ingest, period-end close, audit packs"],
        ],
        [2200, 1600, 5560]
      ),

      pb(),
      h1("Security & Compliance"),
      b("b3", "Dedicated NOUN workspace with multi-tenant isolation and row-level security."),
      b("b3", "Role-based access: Viewer (management), Auditor (bursary officer), Approver (bursar/finance), Administrator (ICT)."),
      b("b3", "Invite-only provisioning with audit-logged user management."),
      b("b3", "Data encrypted in transit (TLS) and at rest."),
      b("b3", "Configurable session timeout and IP allowlist for HQ access control."),

      pb(),
      h1("The Closing Argument"),
      p(`${ORG} pioneered open university education in Nigeria. Its next challenge is not enrolment — it is financial integrity at national scale.`),
      p("Every semester without systematic reconciliation is a semester of unmanaged risk: revenue leakage, student friction, audit exposure, and leadership flying blind. The institution has already invested in portals, Remita, and banking infrastructure. The missing layer — the one that makes all of those investments auditable and trustworthy — is reconciliation."),
      p("ReconFlow is that layer. It is not a nice-to-have efficiency tool. It is the control infrastructure NOUN must adopt to operate credibly at the size it has already become."),
      p("The question is not whether NOUN needs enterprise reconciliation. The question is how many more semesters you can afford to run without it."),

      h2("Next Step: See Your Data Reconciled Live"),
      p("OEO Solutions invites NOUN's Bursar, Director of ICT, and Internal Audit to a 60-minute live demonstration. We will reconcile a sample of your actual fee files — Remita, bursary ledger, and bank statement — and show match rate, exceptions, and executive report in real time."),
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
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Every fee. Every centre. One truth.", size: 22, italics: true, color: "0D9488" })] }),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, buf);
  console.log("Pitch:", OUT);
});
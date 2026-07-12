const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel, BorderStyle,
  WidthType, ShadingType, PageNumber, PageBreak,
} = require("docx");

const ORG = "National Open University of Nigeria";
const ORG_SHORT = "NOUN";
const OUT = path.join(__dirname, "..", "deliverables", "ReconFlow_NOUN_Proposal.docx");
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
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 300 }, children: [new TextRun({ text: "ReconFlow Fee Reconciliation & Revenue Assurance Platform", size: 30, bold: true })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: `Submitted to: ${ORG}`, size: 24 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Submitted by: OEO Solutions", size: 24 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600 }, children: [new TextRun({ text: "Date: June 2026", size: 22, color: "666666" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 }, children: [new TextRun({ text: "Valid until: 15 September 2026", size: 20, italics: true, color: "888888" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 800 }, children: [new TextRun({ text: "CONFIDENTIAL", size: 22, bold: true, color: "CC0000" })] }),

      pb(),
      h1("1. Cover Letter"),
      p("Dear Vice-Chancellor / Bursar / Director of ICT,"),
      p(`OEO Solutions is pleased to submit this proposal for the deployment of ReconFlow — our AI-powered fee reconciliation and revenue assurance platform — to support ${ORG}'s (${ORG_SHORT}) financial control, student payment integrity, and audit readiness across all study centres nationwide.`),
      p(`${ORG_SHORT} operates at a scale unmatched in Nigerian tertiary education: hundreds of thousands of learners, 100+ study centres, and fee collection across Remita (RRR), online student portals, bank transfers, and centre-level remittances — spanning tuition, registration, examination, ICT, and certification fees every academic cycle.`),
      p("Manual reconciliation and spreadsheet-based matching cannot sustain financial integrity at this volume. Unmatched payments become student disputes, revenue leakage, and audit findings. ReconFlow provides the control infrastructure to match every payment channel against the bursary master ledger, surface exceptions in real time, and produce defensible audit evidence on demand."),
      p("This proposal outlines our understanding of NOUN's requirements, the proposed solution, deliverables, implementation plan, commercial terms, and support framework. We welcome the opportunity to demonstrate ReconFlow using NOUN's actual fee file formats in a live session with your bursary, ICT, and internal audit teams."),
      p("Yours faithfully,"),
      p("[Authorised Signatory Name]\nManaging Director / Business Development Lead\nOEO Solutions"),

      pb(),
      h1("2. Executive Summary"),
      p(`ReconFlow will enable ${ORG_SHORT} to:`),
      b("b1", "Consolidate fee evidence from Remita, bursary ledgers, bank statements, and study-centre files into one master reconciled ledger."),
      b("b1", "Automate matching across 21 configurable rules with confidence scoring and automatic flagging."),
      b("b1", "Resolve student payment disputes faster with AI-assisted exception investigation and approver workflow."),
      b("b1", "Govern rule and tolerance changes through Control Gate with full audit trail."),
      b("b1", "Provide Vice-Chancellor, Bursar, and Council with executive dashboards and one-click PDF reports."),
      b("b1", "Support internal audit and external examination with immutable logs and HTML audit packs."),
      p(`OEO Solutions proposes a 10-week phased implementation beginning with central tuition and Remita reconciliation, extending to study-centre roll-up and all agreed fee types, followed by ongoing SaaS subscription and dedicated account management.`),

      pb(),
      h1("3. Understanding of NOUN's Requirements"),
      tbl(
        ["Requirement", "Description"],
        [
          ["Multi-channel fee reconciliation", "Match student portal/bursary records against Remita RRR, bank credits, and gateway settlements"],
          ["National study centre coverage", "Reconcile and report by study centre, region, faculty, and programme"],
          ["Multiple fee product lines", "Tuition, registration, examination, ICT levy, transcript, and certification fees"],
          ["High transaction volume", "Process hundreds of thousands of payments per semester without manual batch splitting"],
          ["Student payment integrity", "Ensure paid students are recognised; unmatched payments investigated and resolved"],
          ["Revenue assurance", "Detect leakage between centre collections, gateway settlements, and HQ accounts"],
          ["Period-end close", "Accelerate semester financial close with live match rates and exception queues"],
          ["Audit & public accountability", "Produce timely, defensible evidence for internal audit and OAuGF requirements"],
          ["ICT–Finance alignment", "Single truth linking portal exports, Remita reports, and bursary ledgers"],
          ["Governance", "Controlled rule changes with approver sign-off and immutable audit logs"],
        ],
        [3200, 6160]
      ),

      pb(),
      h1("4. Proposed Solution"),
      h2("4.1 Platform Modules"),
      tbl(
        ["Module", "NOUN Application"],
        [
          ["Live Reconciliation", "Ingest bursary, Remita, bank, and centre CSVs; run semester reconciliation"],
          ["Anomalies & AI Resolver", "Student payment exceptions, investigation, bursar approver resolution"],
          ["Executive Intelligence", "Collection KPIs by centre/programme; PDF reports for management"],
          ["Control Gate", "Rule approval workflow; audit HTML reports for internal audit"],
          ["Settings & Administration", "Workspace config, user roles, study centre hierarchy, security"],
        ],
        [2800, 6560]
      ),

      h2("4.2 Proposed Fee & Channel Coverage"),
      tbl(
        ["Source / Fee Type", "Reconciliation Scope"],
        [
          ["Remita (RRR) reports", "Match RRR reference + amount to bursary/portal records"],
          ["Bursary / student portal export", "Internal ledger — primary matching side"],
          ["Bank statements & TSA credits", "Settlement side — inward fee collections"],
          ["Tuition & school fees", "Core semester fee reconciliation"],
          ["Course registration fees", "Registration cycle matching"],
          ["Examination fees", "Exam period ingest and match"],
          ["ICT & administrative levies", "Fee assurance against published schedules"],
          ["Study centre remittance files", "Centre collections vs HQ settlement"],
          ["Refunds & reversals", "Exception handling with audit trail"],
        ],
        [3600, 5760]
      ),

      h2("4.3 Roles & Access"),
      tbl(
        ["Role", "Typical NOUN User", "Access"],
        [
          ["Viewer", "VC, Registrar, Council committee", "Dashboards and reports — read only"],
          ["Auditor", "Bursary officer, reconciliation staff", "Upload, reconcile, investigate, propose rules"],
          ["Approver", "Bursar, Deputy Bursar, Internal Audit lead", "Resolve exceptions, approve rule changes"],
          ["Administrator", "ICT directorate", "User management, workspace config, security"],
        ],
        [2000, 3360, 4000]
      ),

      pb(),
      h1("5. Scope of Work"),
      h2("5.1 OEO Solutions Responsibilities"),
      numbered("n1", "Conduct discovery workshop with Bursary, ICT, and Internal Audit to map fee types, file formats, and study centre structure."),
      numbered("n1", "Provision dedicated ReconFlow workspace for NOUN with role-based access and security baseline."),
      numbered("n1", "Configure matching rules, amount tolerances, and fee benchmarks per agreed product lines."),
      numbered("n1", "Build ingest templates for Phase 1 (tuition, Remita, main bank accounts)."),
      numbered("n1", "Execute pilot reconciliation on one semester's live data."),
      numbered("n1", "Conduct role-based training for bursary, audit, management, and ICT administrators."),
      numbered("n1", "Roll out study-centre templates and dashboards (Phase 2)."),
      numbered("n1", "Deliver operational manual, quick-start guide, and auditor pack."),
      numbered("n1", "Provide ongoing SaaS hosting, updates, L2 support, and dedicated account manager."),

      h2("5.2 NOUN Responsibilities"),
      b("b3", "Designate executive sponsor (Bursar recommended) and project lead from bursary/ICT."),
      b("b3", "Provide sample exports: bursary ledger, Remita report, bank statement, and centre remittance files."),
      b("b3", "Make staff available for discovery, UAT, and training."),
      b("b3", "Approve rule configurations, tolerances, and fee benchmarks."),
      b("b3", "Assign Approver(s) for exception resolution and Control Gate sign-off."),

      h2("5.3 Out of Scope (unless separately agreed)"),
      b("b4", "Modification of NOUN student portal or Remita integration."),
      b("b4", "Historical data migration beyond agreed pilot semester."),
      b("b4", "Custom report development outside standard ReconFlow exports."),
      b("b4", "On-premise hosting."),

      pb(),
      h1("6. Deliverables"),
      tbl(
        ["#", "Deliverable", "Timing"],
        [
          ["1", "Discovery report & NOUN fee/channel mapping document", "Week 2"],
          ["2", "Configured workspace with roles, RLS, and study centre hierarchy", "Week 3"],
          ["3", "Phase 1 ingest templates (tuition, Remita, bank)", "Week 4–5"],
          ["4", "Pilot reconciliation report (match rate, exceptions, leakage)", "Week 6"],
          ["5", "Training workshops (bursary, audit, management, ICT admin)", "Week 7"],
          ["6", "Operational manual & auditor quick-start", "Week 7"],
          ["7", "Phase 2 study-centre rollout", "Weeks 8–9"],
          ["8", "Full go-live & executive PDF template", "Week 10"],
        ],
        [400, 5560, 3400]
      ),

      pb(),
      h1("7. Implementation Timeline"),
      tbl(
        ["Phase", "Duration", "Activities"],
        [
          ["Discovery", "Weeks 1–2", "Fee inventory, file mapping, centre hierarchy, rule design"],
          ["Configuration", "Weeks 3–5", "Templates, tolerance tuning, test ingest"],
          ["Central pilot", "Week 6", "Live tuition + Remita reconciliation, UAT"],
          ["Training", "Week 7", "Role workshops, manual handover, approver setup"],
          ["Study centre rollout", "Weeks 8–9", "Per-centre templates and dashboards"],
          ["Go-live", "Week 10", "All Phase 1–2 fee types, executive reporting"],
          ["Steady state", "Ongoing", "Per-semester ingest, close, audit packs, quarterly review"],
        ],
        [2200, 1400, 5760]
      ),

      pb(),
      h1("8. Commercial Terms"),
      h2("8.1 Pricing Structure"),
      tbl(
        ["Component", "Description", "Indicative Fee"],
        [
          ["Implementation (one-time)", "Discovery, configuration, training, go-live (10 weeks)", "To be quoted post-discovery"],
          ["Annual SaaS subscription", "Platform, hosting, updates, L2 support, account manager", "To be quoted by volume tier"],
          ["Phase 2 centre expansion", "Additional study centres beyond Phase 1 scope", "Per-wave fee — quoted at discovery"],
          ["Optional: managed reconciliation", "OEO-operated per-semester reconciliation service", "Monthly retainer — optional"],
        ],
        [2800, 4160, 2400]
      ),
      p("Final pricing will reflect number of fee product lines, study centres in scope, estimated semester transaction volume, and user seats."),

      h2("8.2 Payment Terms"),
      b("b1", "Implementation: 50% on contract signing, 50% on go-live acceptance."),
      b("b1", "SaaS: invoiced annually in advance, or quarterly by agreement."),
      b("b1", "Fees exclusive of VAT (7.5%) where applicable."),
      b("b1", "Procurement aligned with NOUN federal procurement guidelines where required."),

      h2("8.3 Contract Term"),
      p("Initial SaaS term: 12 months from go-live. Annual renewal unless terminated with 60 days written notice."),

      pb(),
      h1("9. Service Level & Support"),
      tbl(
        ["Item", "Commitment"],
        [
          ["Uptime", "99.5% monthly (excluding scheduled maintenance)"],
          ["Support hours", "Monday–Friday, 08:00–18:00 WAT"],
          ["Critical incident", "Response within 4 business hours"],
          ["Standard query", "Within 1 business day"],
          ["Account manager", "Assigned post go-live"],
          ["Quarterly review", "Match-rate trends, leakage summary, roadmap"],
        ],
        [4000, 5360]
      ),

      pb(),
      h1("10. Security & Compliance"),
      b("b2", "Dedicated tenant with row-level security and role-based access."),
      b("b2", "Immutable audit log for uploads, runs, resolutions, and rule changes."),
      b("b2", "Encrypted in transit (TLS) and at rest."),
      b("b2", "Session timeout and IP allowlist configurable for HQ access."),
      p("OEO Solutions will support NOUN's vendor assessment and internal audit due diligence upon request."),

      pb(),
      h1("11. Acceptance Criteria"),
      numbered("n2", "Phase 1 fee channels ingest with > 0 rows mapped per template."),
      numbered("n2", "Pilot semester achieves match rate ≥ 90% on tuition/Remita or all exceptions documented."),
      numbered("n2", "Exception and approver workflow tested end-to-end."),
      numbered("n2", "Executive PDF report generated for management review."),
      numbered("n2", "All designated users trained with correct role permissions."),
      numbered("n2", "Operational manual acknowledged by NOUN reconciliation lead."),

      pb(),
      h1("12. About OEO Solutions"),
      p("OEO Solutions is a Nigerian technology company specialising in financial reconciliation, revenue assurance, and payment operations software. ReconFlow is deployed for banks, fintechs, and large payment-intensive organisations requiring enterprise-grade controls without enterprise complexity."),
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
      h1("13. Acceptance & Next Steps"),
      numbered("n2", "Review proposal with Bursary, ICT, and Internal Audit."),
      numbered("n2", "Schedule 60-minute live demo using NOUN file formats."),
      numbered("n2", "Conduct half-day discovery workshop to finalise scope and pricing."),
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
          ["Title", "Managing Director / Business Development Lead", "Bursar / Director of ICT"],
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
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel, BorderStyle,
  WidthType, ShadingType, PageNumber, PageBreak,
} = require("docx");

const OUT = path.join(__dirname, "..", "deliverables", "ReconFlow_Bank_Proposal_Generic.docx");
const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

function h1(t) { return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] }); }
function h2(t) { return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] }); }
function h3(t) { return new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(t)] }); }
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
  title: "ReconFlow Bank Proposal",
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 30, bold: true, font: "Arial", color: "1E3A5F" }, paragraph: { spacing: { before: 320, after: 180 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 26, bold: true, font: "Arial", color: "0D9488" }, paragraph: { spacing: { before: 240, after: 140 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 24, bold: true, font: "Arial" }, paragraph: { spacing: { before: 180, after: 120 }, outlineLevel: 2 } },
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
    headers: { default: new Header({ children: [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "0D9488", space: 1 } }, children: [new TextRun({ text: "OEO Solutions", bold: true, color: "1E3A5F" }), new TextRun({ text: "  |  Proposal — ReconFlow", color: "666666" })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Confidential  |  OEO Solutions  |  Page ", size: 16, color: "888888" }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "888888" })] })] }) },
    children: [
      // COVER
      new Paragraph({ spacing: { before: 1800 } }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PROPOSAL", size: 44, bold: true, color: "1E3A5F" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 300 }, children: [new TextRun({ text: "ReconFlow Enterprise Reconciliation Platform", size: 32, bold: true })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: "Submitted to: [Bank Name]", size: 24 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Submitted by: OEO Solutions", size: 24 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600 }, children: [new TextRun({ text: "Date: June 2026", size: 22, color: "666666" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 }, children: [new TextRun({ text: "Valid for: 90 days from date of issue", size: 20, italics: true, color: "888888" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 800 }, children: [new TextRun({ text: "CONFIDENTIAL", size: 22, bold: true, color: "CC0000" })] }),

      pb(),

      // 1. COVER LETTER
      h1("1. Cover Letter"),
      p("Dear [Name / Title],"),
      p("OEO Solutions is pleased to submit this proposal for the deployment of ReconFlow — our AI-powered revenue assurance and reconciliation platform — to support [Bank Name]'s transaction reconciliation, exception management, and regulatory reporting requirements."),
      p("As Nigeria's banking sector continues to expand digital payment channels — including POS, card acquiring, USSD, bank transfers, wallets, and third-party payment gateways — the complexity and volume of reconciliation has outgrown manual processes. ReconFlow is purpose-built to address this challenge: automating multi-rail matching, surfacing revenue leakage in real time, and producing audit-ready reports that satisfy internal finance, risk, and external examination requirements."),
      p("This proposal outlines our understanding of your requirements, the solution we propose, deliverables, implementation timeline, commercial terms, and support framework. We welcome the opportunity to conduct a live demonstration using your institution's transaction data formats."),
      p("Yours faithfully,"),
      p("[Authorised Signatory Name]\n[Title]\nOEO Solutions"),

      pb(),
      h1("2. Executive Summary"),
      p("ReconFlow is a cloud-hosted, multi-tenant reconciliation SaaS platform that enables banks to:"),
      b("b1", "Ingest transaction data from all payment rails into a single master ledger."),
      b("b1", "Run automated reconciliation with 21 configurable matching and exception rules."),
      b("b1", "Achieve high match accuracy with confidence scoring and automatic flagging of low-confidence matches."),
      b("b1", "Investigate exceptions using AI-assisted root cause analysis."),
      b("b1", "Govern rule changes through a formal approver workflow (Control Gate)."),
      b("b1", "Produce executive PDF reports, CSV exports, and HTML audit packs for compliance."),
      p("OEO Solutions will configure, deploy, train, and support ReconFlow for [Bank Name] over an estimated 8-week implementation, followed by ongoing SaaS subscription and technical support."),

      pb(),
      h1("3. Understanding of Requirements"),
      p("Based on our discussions and standard requirements for modern banking institutions, we understand that [Bank Name] requires:"),
      tbl(
        ["Requirement Area", "Description"],
        [
          ["Multi-channel reconciliation", "Match internal transaction records against bank/acquirer settlement across POS, cards, USSD, transfers, wallets, and gateways"],
          ["High accuracy & transparency", "Live match rates, per-transaction confidence scores, and flagged-item tracking"],
          ["Exception management", "Structured anomaly queue with investigation workflow and approver sign-off"],
          ["Fee & commission assurance", "Validate actual fees against expected benchmarks post-match"],
          ["Governance & audit", "Controlled rule changes, immutable audit logs, and regulatory-ready reports"],
          ["Executive visibility", "Dashboards, KPIs, leakage metrics, and one-click PDF export"],
          ["Security", "Role-based access, tenant isolation, and data protection"],
          ["Scalability", "Handle growing transaction volumes without process redesign"],
        ],
        [3200, 6160]
      ),

      pb(),
      h1("4. Proposed Solution — ReconFlow"),
      h2("4.1 Platform Overview"),
      p("ReconFlow operates as a secure web application accessible to authorised bank staff. The platform is organised around five operational pillars:"),
      tbl(
        ["Module", "Function"],
        [
          ["Live Reconciliation", "CSV ingest, reconciliation engine, master ledger"],
          ["Anomalies & AI Resolver", "Exception queue, AI investigation, resolution workflow"],
          ["Executive Intelligence", "KPI dashboards, trends, PDF executive reports"],
          ["Control Gate", "Rule approval workflow, active rules catalog, audit HTML reports"],
          ["Settings & Administration", "Workspace config, user management, integrations, security"],
        ],
        [2800, 6560]
      ),

      h2("4.2 Reconciliation Engine"),
      p("The engine applies rules in priority order:"),
      b("b2", "MATCH_AMOUNT_REFERENCE — primary match on normalised reference + amount tolerance"),
      b("b2", "MATCH_MULTI_FIELD — amount + date + channel alignment"),
      b("b2", "MATCH_FUZZY_AMOUNT — tolerance-based fuzzy matching"),
      b("b2", "MATCH_CROSS_CHANNEL — POS-to-transfer and gateway-to-settlement linking"),
      b("b2", "CH_CARD_ACQUIRER — RRN / acquirer reference matching for card rails"),
      b("b2", "CH_MONNIFY_GATEWAY — gateway collection reference matching"),
      b("b2", "EXC_* rules — unmatched, double posting, fee leakage, reversals, high-value escalation"),

      h2("4.3 Supported Ingest Formats"),
      tbl(
        ["Report Type", "Channels Covered"],
        [
          ["POS Settlement", "Agent banking, terminal networks"],
          ["Card Transaction", "Acquirer files, RRN-based settlement"],
          ["USSD Transaction Log", "Digital self-service channels"],
          ["Bank Transfer / Collections", "NIP, inward/outward transfers"],
          ["Wallet Statement", "Digital wallet products"],
          ["Gateway Reports", "Third-party payment gateway collections"],
          ["Fee & Commission", "Revenue assurance benchmarks"],
          ["Chargeback & Reversal", "Exception and dispute files"],
        ],
        [3600, 5760]
      ),

      h2("4.4 Roles & Access"),
      tbl(
        ["Role", "Access Level"],
        [
          ["Viewer / Executive", "Dashboards, reports, read-only anomaly view"],
          ["Auditor / Reconciliation Officer", "Upload, run reconciliation, investigate, propose rules"],
          ["Finance Approver", "Resolve exceptions, approve rule changes"],
          ["Administrator", "User management, workspace config, security settings"],
        ],
        [3200, 6160]
      ),

      pb(),
      h1("5. Scope of Work"),
      h2("5.1 OEO Solutions Responsibilities"),
      numbered("n1", "Conduct discovery workshop to map [Bank Name]'s payment channels and file formats."),
      numbered("n1", "Provision and configure dedicated ReconFlow workspace (tenant)."),
      numbered("n1", "Configure reconciliation rules, tolerances, and audit year settings."),
      numbered("n1", "Migrate and validate ingest templates for each agreed channel."),
      numbered("n1", "Execute pilot reconciliation on one product line with live data."),
      numbered("n1", "Conduct user training for all role types (Auditor, Approver, Admin, Executive)."),
      numbered("n1", "Provide go-live support for full multi-channel rollout."),
      numbered("n1", "Deliver operational manuals and administrator playbook."),
      numbered("n1", "Provide ongoing SaaS hosting, updates, and L2 technical support."),

      h2("5.2 Client Responsibilities"),
      b("b3", "Designate a project sponsor and reconciliation lead."),
      b("b3", "Provide sample transaction and settlement files for each channel."),
      b("b3", "Make relevant staff available for discovery, UAT, and training sessions."),
      b("b3", "Review and approve rule configurations and tolerances."),
      b("b3", "Assign Finance Approver(s) for exception and rule-change sign-off."),

      h2("5.3 Out of Scope (unless separately agreed)"),
      b("b4", "Core banking system modification or API development."),
      b("b4", "Historical data migration beyond agreed pilot period."),
      b("b4", "Custom report development outside standard ReconFlow exports."),
      b("b4", "On-premise infrastructure hosting."),

      pb(),
      h1("6. Deliverables"),
      tbl(
        ["#", "Deliverable", "Timing"],
        [
          ["1", "Discovery report & channel mapping document", "Week 2"],
          ["2", "Configured ReconFlow workspace with RLS and roles", "Week 3"],
          ["3", "Ingest templates per agreed channel", "Week 4"],
          ["4", "Pilot reconciliation report (match rate, exceptions)", "Week 5"],
          ["5", "User training sessions (4 role-based workshops)", "Week 6"],
          ["6", "Operational manual & quick-start guides", "Week 6"],
          ["7", "Go-live sign-off & full reconciliation run", "Week 8"],
          ["8", "Executive PDF report template (configured)", "Week 8"],
        ],
        [400, 5560, 3400]
      ),

      pb(),
      h1("7. Implementation Timeline"),
      tbl(
        ["Phase", "Duration", "Activities"],
        [
          ["Phase 1: Discovery", "Weeks 1–2", "Channel inventory, file mapping, rule design, workspace setup"],
          ["Phase 2: Configuration", "Weeks 3–4", "Template build, rule tuning, test data ingest"],
          ["Phase 3: Pilot", "Week 5", "Live reconciliation on one channel, UAT, exception workflow test"],
          ["Phase 4: Training", "Week 6", "Role-based workshops, manual handover, approver workflow setup"],
          ["Phase 5: Rollout", "Weeks 7–8", "All channels live, go-live support, executive reporting configured"],
          ["Phase 6: Steady State", "Ongoing", "Daily/scheduled ingest, period-end close, support SLA"],
        ],
        [2200, 1400, 5760]
      ),

      pb(),
      h1("8. Commercial Terms"),
      h2("8.1 Pricing Structure"),
      p("OEO Solutions proposes a two-part commercial model:"),
      tbl(
        ["Component", "Description", "Indicative Fee"],
        [
          ["Implementation fee (one-time)", "Discovery, configuration, training, go-live support (8 weeks)", "[To be quoted based on channel count]"],
          ["Annual SaaS subscription", "Platform access, hosting, updates, L2 support (per workspace)", "[To be quoted based on transaction volume tier]"],
          ["Optional: Managed reconciliation", "OEO-operated daily reconciliation service", "[Monthly retainer — optional]"],
        ],
        [2800, 4160, 2400]
      ),
      p("Final pricing will be confirmed following the discovery workshop, based on the number of payment channels, estimated monthly transaction volume, and user seat requirements."),

      h2("8.2 Payment Terms"),
      b("b1", "Implementation: 50% on contract signing, 50% on go-live acceptance."),
      b("b1", "SaaS subscription: invoiced annually in advance, or quarterly by agreement."),
      b("b1", "All fees exclusive of VAT (7.5%) where applicable."),

      h2("8.3 Contract Term"),
      p("Initial SaaS term: 12 months from go-live date. Renewal annually unless terminated with 60 days written notice."),

      pb(),
      h1("9. Service Level & Support"),
      tbl(
        ["Support Item", "Commitment"],
        [
          ["Platform availability", "99.5% monthly uptime (excluding scheduled maintenance)"],
          ["Support hours", "Monday–Friday, 08:00–18:00 WAT"],
          ["Critical incident response", "Within 4 business hours"],
          ["Standard query response", "Within 1 business day"],
          ["Platform updates", "Included in SaaS subscription"],
          ["Dedicated account manager", "Assigned post go-live"],
        ],
        [4000, 5360]
      ),

      pb(),
      h1("10. Security & Compliance"),
      b("b2", "Multi-tenant workspace isolation with row-level security (RLS) at database level."),
      b("b2", "Four-tier role-based access control (Viewer, Auditor, Approver, Administrator)."),
      b("b2", "Invite-only user provisioning with audit-logged access management."),
      b("b2", "Immutable audit log for uploads, reconciliation runs, and rule changes."),
      b("b2", "Configurable session timeout and IP allowlist."),
      b("b2", "Data encrypted in transit (TLS) and at rest (Supabase/AWS infrastructure)."),
      p("OEO Solutions will provide a security overview document and support [Bank Name]'s due diligence requirements upon request."),

      pb(),
      h1("11. Assumptions & Dependencies"),
      b("b3", "[Bank Name] will provide transaction and settlement files in CSV format (or agreed alternative)."),
      b("b3", "Reconciliation officers will have secure internet access to the ReconFlow web application."),
      b("b3", "File formats remain substantially consistent during the contract term; material changes may require re-configuration."),
      b("b3", "Pilot period uses live production data with appropriate data handling agreements in place."),

      pb(),
      h1("12. Acceptance Criteria"),
      p("Go-live will be deemed accepted when all of the following are met:"),
      numbered("n2", "All agreed payment channels ingest successfully with > 0 rows mapped."),
      numbered("n2", "Pilot reconciliation achieves match rate ≥ [agreed threshold, e.g. 90%] or all exceptions documented."),
      numbered("n2", "Anomaly investigation and approver resolution workflow tested end-to-end."),
      numbered("n2", "Executive PDF report generated successfully."),
      numbered("n2", "All designated users trained and able to sign in with correct role permissions."),
      numbered("n2", "Operational manual delivered and acknowledged by client reconciliation lead."),

      pb(),
      h1("13. About OEO Solutions"),
      p("OEO Solutions is a Nigerian technology company specialising in financial reconciliation, revenue assurance, and payment operations software. Our flagship product, ReconFlow, is deployed for fintechs, microfinance banks, and payment service providers requiring enterprise-grade reconciliation without enterprise-grade complexity."),
      p("We maintain offices in Lagos, Asaba, and Port Harcourt, providing local implementation, training, and ongoing support to clients across Nigeria."),

      h2("Contact Information"),
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
      p("To proceed, we propose the following next steps:"),
      numbered("n2", "Review this proposal and confirm scope with your reconciliation and IT teams."),
      numbered("n2", "Schedule a 60-minute live ReconFlow demonstration (we can use your file formats)."),
      numbered("n2", "Conduct a half-day discovery workshop to finalise channel mapping and pricing."),
      numbered("n2", "Execute service agreement and commence Phase 1 implementation."),
      new Paragraph({ spacing: { before: 300 } }),
      p("Proposal prepared by: OEO Solutions"),
      p("Date: June 2026"),
      p("Valid until: [90 days from date of issue]"),
      new Paragraph({ spacing: { before: 400 } }),
      tbl(
        ["", "For OEO Solutions", "For [Bank Name]"],
        [
          ["Signature", "_________________________", "_________________________"],
          ["Name", "[Authorised Signatory]", "[Authorised Signatory]"],
          ["Title", "[Title]", "[Title]"],
          ["Date", "_________________________", "_________________________"],
        ],
        [1600, 3880, 3880]
      ),
    ],
  }],
});

function numbered(ref, t) {
  return new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 80 }, children: [new TextRun(t)] });
}

Packer.toBuffer(doc).then((buf) => {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, buf);
  console.log("Proposal:", OUT);
});
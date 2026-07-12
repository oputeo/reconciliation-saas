const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel, BorderStyle,
  WidthType, ShadingType, PageNumber, PageBreak,
} = require("docx");

const BANK = "Titan Trust Bank Limited";
const BANK_SHORT = "Titan Trust Bank";
const OUT = path.join(__dirname, "..", "deliverables", "ReconFlow_Titan_Trust_Bank_Proposal.docx");
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
  title: `ReconFlow Proposal — ${BANK}`,
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
    headers: { default: new Header({ children: [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "0D9488", space: 1 } }, children: [new TextRun({ text: "OEO Solutions", bold: true, color: "1E3A5F" }), new TextRun({ text: `  |  Proposal — ReconFlow for ${BANK_SHORT}`, color: "666666" })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Confidential  |  OEO Solutions  |  Page ", size: 16, color: "888888" }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "888888" })] })] }) },
    children: [
      new Paragraph({ spacing: { before: 1800 } }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PROPOSAL", size: 44, bold: true, color: "1E3A5F" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 300 }, children: [new TextRun({ text: "ReconFlow Enterprise Reconciliation Platform", size: 32, bold: true })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: `Submitted to: ${BANK}`, size: 24 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Submitted by: OEO Solutions", size: 24 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600 }, children: [new TextRun({ text: "Date: June 2026", size: 22, color: "666666" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 }, children: [new TextRun({ text: "Valid until: 15 September 2026", size: 20, italics: true, color: "888888" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 800 }, children: [new TextRun({ text: "CONFIDENTIAL", size: 22, bold: true, color: "CC0000" })] }),

      pb(),

      h1("1. Cover Letter"),
      p("Dear Managing Director / Group Head, Operations & Technology,"),
      p(`OEO Solutions is pleased to submit this proposal for the deployment of ReconFlow — our AI-powered revenue assurance and reconciliation platform — to support ${BANK}'s transaction reconciliation, exception management, and regulatory reporting requirements.`),
      p(`${BANK_SHORT} operates at significant scale across branch, digital, and agency channels, with high transaction volumes across NIP transfers, card acquiring, POS, USSD, internet and mobile banking, and third-party payment gateways. As the institution continues to grow its customer base and harmonise operations across legacy and integrated platforms, the complexity of end-to-end reconciliation has outgrown spreadsheet-based and siloed manual processes.`),
      p("ReconFlow is purpose-built for this challenge: automating multi-rail matching at enterprise volume, surfacing revenue leakage and exceptions in real time, and producing audit-ready reports that satisfy internal finance, risk, internal audit, and CBN examination requirements."),
      p("This proposal outlines our understanding of your requirements, the solution we propose, deliverables, a phased implementation timeline suited to a tier-one institution, commercial terms, and our support framework. We welcome the opportunity to conduct a live demonstration using Titan Trust Bank transaction and settlement file formats."),
      p("Yours faithfully,"),
      p("[Authorised Signatory Name]\nManaging Director / Business Development Lead\nOEO Solutions"),

      pb(),
      h1("2. Executive Summary"),
      p(`ReconFlow is a cloud-hosted, multi-tenant reconciliation SaaS platform that will enable ${BANK_SHORT} to:`),
      b("b1", "Consolidate transaction data from all payment rails — branch, digital, cards, and gateways — into a single master ledger."),
      b("b1", "Run automated reconciliation with 21 configurable matching and exception rules, tuned per channel and product line."),
      b("b1", "Achieve high match accuracy at scale with confidence scoring and automatic flagging of low-confidence matches."),
      b("b1", "Investigate exceptions using AI-assisted root cause analysis, reducing mean time to resolution across operations teams."),
      b("b1", "Govern rule changes through a formal approver workflow (Control Gate) aligned with risk and audit policy."),
      b("b1", "Produce executive PDF reports, CSV exports, and HTML audit packs for monthly close and regulatory submissions."),
      p(`OEO Solutions will configure, deploy, train, and support ReconFlow for ${BANK_SHORT} over an estimated 10-week phased implementation (with optional extension for additional channel waves), followed by ongoing SaaS subscription and dedicated account management.`),

      pb(),
      h1("3. Understanding of Requirements"),
      p(`Based on the profile of a full-service Nigerian commercial bank at ${BANK_SHORT}'s scale, we understand that you require:`),
      tbl(
        ["Requirement Area", "Description"],
        [
          ["Multi-channel reconciliation", "Match internal records against settlement across NIP, cards/POS, USSD, internet banking, mobile app, agency banking, and payment gateways"],
          ["High-volume processing", "Handle millions of monthly transactions without performance degradation or manual batch splitting"],
          ["Legacy & integrated platform harmonisation", "Reconcile consistently across core banking, card switches, and digital channel logs during platform consolidation"],
          ["High accuracy & transparency", "Live match rates, per-transaction confidence scores, and flagged-item tracking by product and channel"],
          ["Exception management", "Structured anomaly queue with investigation workflow, escalation, and Finance Approver sign-off"],
          ["Fee & commission assurance", "Validate interchange, MDR, and gateway fees against expected benchmarks post-match"],
          ["Governance & audit", "Controlled rule changes, immutable audit logs, and regulatory-ready period-end reports"],
          ["Executive visibility", "Dashboards, KPIs, leakage metrics, and one-click PDF export for ExCo and Risk Committee"],
          ["Security", "Role-based access, tenant isolation, session controls, and data protection"],
          ["Branch & regional reporting", "Slice reconciliation outcomes by branch, region, or business unit where file metadata permits"],
        ],
        [3200, 6160]
      ),

      pb(),
      h1("4. Proposed Solution — ReconFlow"),
      h2("4.1 Platform Overview"),
      p("ReconFlow operates as a secure web application accessible to authorised Titan Trust Bank staff across Treasury, Operations, Finance, Risk, and Internal Audit. The platform is organised around five operational pillars:"),
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
      p("The engine applies rules in priority order, configured per Titan Trust Bank channel:"),
      b("b2", "MATCH_AMOUNT_REFERENCE — primary match on normalised reference + amount tolerance"),
      b("b2", "MATCH_MULTI_FIELD — amount + date + channel alignment"),
      b("b2", "MATCH_FUZZY_AMOUNT — tolerance-based fuzzy matching for high-volume NIP and transfer rails"),
      b("b2", "MATCH_CROSS_CHANNEL — POS-to-transfer and gateway-to-settlement linking"),
      b("b2", "CH_CARD_ACQUIRER — RRN / acquirer reference matching for card rails"),
      b("b2", "CH_MONNIFY_GATEWAY — gateway collection reference matching"),
      b("b2", "EXC_* rules — unmatched, double posting, fee leakage, reversals, high-value escalation"),

      h2("4.3 Proposed Channel Coverage — Titan Trust Bank"),
      tbl(
        ["Report Type", "Channels / Sources"],
        [
          ["NIP / Interbank Transfer", "Inward and outward NIP logs, settlement positions"],
          ["Card Transaction & Acquiring", "Acquirer files, RRN-based settlement, POS networks"],
          ["POS Settlement", "Merchant and agent terminal settlement"],
          ["USSD & Mobile Banking", "Titan Mobile and self-service digital transaction logs"],
          ["Internet Banking", "Web channel collections and transfers"],
          ["Agency Banking", "Agent transaction and commission files"],
          ["Wallet & Collections", "Digital wallet and bill payment products"],
          ["Gateway Reports", "Third-party payment gateway and fintech partner collections"],
          ["Fee & Commission", "Revenue assurance benchmarks (MDR, interchange, agency commission)"],
          ["Chargeback & Reversal", "Exception, dispute, and reversal files"],
        ],
        [3600, 5760]
      ),
      p("Final channel list will be confirmed during the discovery workshop. Additional rails can be onboarded in subsequent implementation waves without platform redesign."),

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
      numbered("n1", `Conduct discovery workshop with ${BANK_SHORT} Treasury, Operations, and IT to map payment channels and file formats.`),
      numbered("n1", "Provision and configure a dedicated ReconFlow workspace (tenant) with bank-specific branding and audit year settings."),
      numbered("n1", "Configure reconciliation rules, tolerances, and exception thresholds per agreed channel."),
      numbered("n1", "Build and validate ingest templates for Phase 1 channels (priority rails agreed in discovery)."),
      numbered("n1", "Execute pilot reconciliation on highest-volume product line with live production data."),
      numbered("n1", "Conduct user training for all role types across Lagos HQ and designated regional reconciliation teams."),
      numbered("n1", "Provide go-live support for Phase 1 rollout, with Phase 2 channel wave plan documented."),
      numbered("n1", "Deliver operational manuals, administrator playbook, and auditor quick-start guide."),
      numbered("n1", "Provide ongoing SaaS hosting, platform updates, and L2 technical support with dedicated account manager."),

      h2("5.2 Client Responsibilities"),
      b("b3", "Designate an executive project sponsor (recommended: Group Head Treasury or CRO) and a reconciliation project lead."),
      b("b3", "Provide sample transaction and settlement files for each channel, including legacy-format samples where applicable."),
      b("b3", "Make reconciliation, finance, risk, and IT staff available for discovery, UAT, and training sessions."),
      b("b3", "Review and approve rule configurations, tolerances, and escalation thresholds."),
      b("b3", "Assign Finance Approver(s) for exception resolution and rule-change sign-off per Control Gate policy."),

      h2("5.3 Out of Scope (unless separately agreed)"),
      b("b4", "Core banking system modification or real-time API integration."),
      b("b4", "Historical data migration beyond agreed pilot and go-live periods."),
      b("b4", "Custom report development outside standard ReconFlow exports."),
      b("b4", "On-premise infrastructure hosting."),

      pb(),
      h1("6. Deliverables"),
      tbl(
        ["#", "Deliverable", "Timing"],
        [
          ["1", "Discovery report & Titan Trust Bank channel mapping document", "Week 2"],
          ["2", "Configured ReconFlow workspace with RLS, roles, and security baseline", "Week 3"],
          ["3", "Ingest templates per Phase 1 channel", "Week 4–5"],
          ["4", "Pilot reconciliation report (match rate, exceptions, leakage summary)", "Week 6"],
          ["5", "User training sessions (4 role-based workshops + executive briefing)", "Week 7"],
          ["6", "Operational manual, quick-start guides, and demo narration pack", "Week 7"],
          ["7", "Phase 1 go-live sign-off & full reconciliation run", "Week 10"],
          ["8", "Executive PDF report template (configured for ExCo / Risk Committee)", "Week 10"],
          ["9", "Phase 2 channel rollout plan (optional extension)", "Week 10"],
        ],
        [400, 5560, 3400]
      ),

      pb(),
      h1("7. Implementation Timeline"),
      p("Given transaction volume and channel breadth, we propose a phased 10-week implementation with optional Phase 2 for remaining rails:"),
      tbl(
        ["Phase", "Duration", "Activities"],
        [
          ["Phase 1: Discovery", "Weeks 1–2", "Channel inventory, file mapping, rule design, workspace setup, legacy format review"],
          ["Phase 2: Configuration", "Weeks 3–5", "Template build, rule tuning, test data ingest, tolerance calibration"],
          ["Phase 3: Pilot", "Week 6", "Live reconciliation on priority channel (e.g. NIP or cards), UAT, exception workflow test"],
          ["Phase 4: Training", "Week 7", "Role-based workshops, executive briefing, manual handover, approver workflow setup"],
          ["Phase 5: Phase 1 Rollout", "Weeks 8–10", "Agreed Phase 1 channels live, go-live support, executive reporting configured"],
          ["Phase 6: Phase 2 (optional)", "Weeks 11–14", "Remaining channels, agency banking, gateway partners, steady-state optimisation"],
          ["Phase 7: Steady State", "Ongoing", "Daily/scheduled ingest, period-end close, SLA support, quarterly business review"],
        ],
        [2200, 1400, 5760]
      ),

      pb(),
      h1("8. Commercial Terms"),
      h2("8.1 Pricing Structure"),
      p("OEO Solutions proposes a two-part commercial model tailored to enterprise banking:"),
      tbl(
        ["Component", "Description", "Indicative Fee"],
        [
          ["Implementation fee (one-time)", "Discovery, configuration, training, Phase 1 go-live support (10 weeks)", "To be quoted following discovery (channel count & complexity)"],
          ["Annual SaaS subscription", "Platform access, hosting, updates, L2 support, dedicated account manager", "To be quoted based on transaction volume tier"],
          ["Optional: Phase 2 rollout", "Additional channel waves (agency, gateways, legacy harmonisation)", "Fixed fee per wave — quoted at discovery"],
          ["Optional: Managed reconciliation", "OEO-operated daily reconciliation service", "Monthly retainer — optional"],
        ],
        [2800, 4160, 2400]
      ),
      p(`Final pricing for ${BANK_SHORT} will be confirmed following the discovery workshop, based on the number of payment channels, estimated monthly transaction volume, user seat requirements, and Phase 2 scope.`),

      h2("8.2 Payment Terms"),
      b("b1", "Implementation: 50% on contract signing, 50% on Phase 1 go-live acceptance."),
      b("b1", "SaaS subscription: invoiced annually in advance, or quarterly by agreement."),
      b("b1", "All fees exclusive of VAT (7.5%) where applicable."),

      h2("8.3 Contract Term"),
      p("Initial SaaS term: 12 months from Phase 1 go-live date. Renewal annually unless terminated with 60 days written notice."),

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
          ["Dedicated account manager", "Assigned post Phase 1 go-live"],
          ["Quarterly business review", "Match-rate trends, leakage summary, roadmap alignment"],
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
      p(`OEO Solutions will provide a security overview document and support ${BANK_SHORT}'s due diligence, vendor risk assessment, and internal audit requirements upon request.`),

      pb(),
      h1("11. Assumptions & Dependencies"),
      b("b3", `${BANK_SHORT} will provide transaction and settlement files in CSV format (or agreed alternative such as Excel export).`),
      b("b3", "Reconciliation officers will have secure internet access to the ReconFlow web application."),
      b("b3", "File formats remain substantially consistent during the contract term; material changes may require re-configuration."),
      b("b3", "Pilot period uses live production data with appropriate data handling and confidentiality agreements in place."),
      b("b3", "Phase 1 scope is limited to channels agreed at discovery; Phase 2 channels follow a separate statement of work if required."),

      pb(),
      h1("12. Acceptance Criteria"),
      p("Phase 1 go-live will be deemed accepted when all of the following are met:"),
      numbered("n2", "All agreed Phase 1 payment channels ingest successfully with > 0 rows mapped."),
      numbered("n2", "Pilot reconciliation achieves match rate ≥ 92% on priority channel or all exceptions documented with root cause."),
      numbered("n2", "Anomaly investigation and approver resolution workflow tested end-to-end."),
      numbered("n2", "Executive PDF report generated successfully for ExCo review."),
      numbered("n2", "All designated users trained and able to sign in with correct role permissions."),
      numbered("n2", "Operational manual delivered and acknowledged by Titan Trust Bank reconciliation lead."),

      pb(),
      h1("13. About OEO Solutions"),
      p("OEO Solutions is a Nigerian technology company specialising in financial reconciliation, revenue assurance, and payment operations software. Our flagship product, ReconFlow, is deployed for fintechs, microfinance banks, and payment service providers requiring enterprise-grade reconciliation without enterprise-grade complexity."),
      p("We maintain offices in Lagos, Asaba, and Port Harcourt, providing local implementation, training, and ongoing support to clients across Nigeria — including institutions operating at the scale and regulatory scrutiny of tier-one commercial banking."),

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
      p(`To proceed with ${BANK_SHORT}, we propose the following next steps:`),
      numbered("n2", "Review this proposal with Treasury, Operations, Risk, and IT stakeholders."),
      numbered("n2", "Schedule a 60-minute live ReconFlow demonstration using Titan Trust Bank file formats."),
      numbered("n2", "Conduct a half-day discovery workshop to finalise Phase 1 channel mapping and commercial pricing."),
      numbered("n2", "Execute service agreement and commence Phase 1 implementation."),
      new Paragraph({ spacing: { before: 300 } }),
      p("Proposal prepared by: OEO Solutions"),
      p("Date: June 2026"),
      p("Valid until: 15 September 2026"),
      new Paragraph({ spacing: { before: 400 } }),
      tbl(
        ["", "For OEO Solutions", `For ${BANK_SHORT}`],
        [
          ["Signature", "_________________________", "_________________________"],
          ["Name", "[Authorised Signatory]", "[Authorised Signatory]"],
          ["Title", "Managing Director / Business Development Lead", "Managing Director / Chief Risk Officer"],
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
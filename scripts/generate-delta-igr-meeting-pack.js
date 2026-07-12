const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel, BorderStyle,
  WidthType, ShadingType, PageNumber, PageBreak,
} = require("docx");

const OUT_DIR = path.join(__dirname, "..", "deliverables", "delta-igr");
const IMG = path.join(__dirname, "..", "deliverables", "delta-igr-images");
const MANUAL_IMG = path.join(__dirname, "..", "deliverables", "manual-images");
const STATE = "Delta State";
const SCOPE_PRIMARY = "Recovery of Unremitted Funds — revenues collected by MDAs, agents, banks, and digital platforms that have not been fully or timely remitted into designated Delta State IGR accounts.";
const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

function h1(t) { return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] }); }
function h2(t) { return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] }); }
function p(t, o = {}) { return new Paragraph({ spacing: { after: o.after ?? 140 }, alignment: o.align, children: [new TextRun({ text: t, size: o.size, bold: o.bold, italics: o.italics, color: o.color })] }); }
function b(ref, t) { return new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 70 }, children: [new TextRun({ text: t, size: 20 })] }); }
function pb() { return new Paragraph({ children: [new PageBreak()] }); }
function cap(t) { return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: t, italics: true, size: 18, color: "555555" })] }); }

function img(file, dir, w = 520, h = 300) {
  const p = path.join(dir || IMG, file);
  if (!fs.existsSync(p)) return p("[" + file + "]", { italics: true, after: 80 });
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 80 },
    children: [new ImageRun({ type: "jpg", data: fs.readFileSync(p), transformation: { width: w, height: h }, altText: { title: file, description: file, name: file } })],
  });
}

function tbl(headers, rows, widths) {
  const total = widths.reduce((a, c) => a + c, 0);
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({ children: headers.map((h, i) => new TableCell({
        borders, width: { size: widths[i], type: WidthType.DXA },
        shading: { fill: "1E3A5F", type: ShadingType.CLEAR },
        margins: { top: 70, bottom: 70, left: 100, right: 100 },
        children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 19 })] })],
      })) }),
      ...rows.map((row, ri) => new TableRow({ children: row.map((c, ci) => new TableCell({
        borders, width: { size: widths[ci], type: WidthType.DXA },
        shading: { fill: ri % 2 ? "FFFFFF" : "F5F8FA", type: ShadingType.CLEAR },
        margins: { top: 70, bottom: 70, left: 100, right: 100 },
        children: [new Paragraph({ children: [new TextRun({ text: c, size: 19 })] })],
      })) })),
    ],
  });
}

function baseDoc(title, headerSub) {
  return {
    title,
    styles: {
      default: { document: { run: { font: "Arial", size: 21 } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 28, bold: true, font: "Arial", color: "1E3A5F" }, paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 0 } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 24, bold: true, font: "Arial", color: "0D9488" }, paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 1 } },
      ],
    },
    numbering: {
      config: [
        { reference: "b1", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 640, hanging: 320 } } } }] },
        { reference: "b2", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 640, hanging: 320 } } } }] },
        { reference: "n1", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 640, hanging: 320 } } } }] },
      ],
    },
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1200, right: 1200, bottom: 1200, left: 1200 } } },
      headers: { default: new Header({ children: [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 5, color: "0D9488", space: 1 } }, children: [new TextRun({ text: "OEO Solutions", bold: true, color: "1E3A5F" }), new TextRun({ text: "  |  " + headerSub, color: "666666" })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Confidential  |  " + STATE + " IGR  |  June 2026  |  Page ", size: 15, color: "888888" }), new TextRun({ children: [PageNumber.CURRENT], size: 15, color: "888888" })] })] }) },
      children: [],
    }],
  };
}

function n(ref, t) { return new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 70 }, children: [new TextRun({ text: t, size: 20 })] }); }

// ─── 1. EXECUTIVE SUMMARY ───
function doc01() {
  const d = baseDoc("Delta IGR Executive Summary", "Executive Summary — Deputy Governor Briefing");
  d.sections[0].children = [
    new Paragraph({ spacing: { before: 400 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ReconFlow", size: 48, bold: true, color: "1E3A5F" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: "Recovery of Unremitted Funds & Revenue Assurance", size: 24, bold: true, color: "0D9488" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "For " + STATE + " Internally Generated Revenue (IGR)", size: 22 })] }),
    h2("Primary Objective"),
    p(SCOPE_PRIMARY),
    p(STATE + " collects revenue across MDAs, local governments, Remita, banks, and digital platforms. A significant portion may be collected but not fully or timely remitted to Treasury. ReconFlow identifies, reconciles, and supports recovery of these unremitted funds — using neutral, audit-focused language centred on reconciliation exceptions and recoverable revenue, not criminal investigation."),
    h2("Five Key Benefits"),
    b("b1", "Recovery of unremitted funds — Back Audit scans up to 10 years to find collections not lodged to IGR accounts"),
    b("b1", "Real-time reconciliation exceptions — under-remittances and shortfalls surfaced immediately"),
    b("b1", "Single Master Ledger — all channels reconciled in one auditable view"),
    b("b1", "Executive dashboards — confirmed IGR, exposure, match rate, recovery by revenue head"),
    b("b1", "Full governance — Control Gate, role-based access, immutable investigation logs"),
    h2("Expected Outcomes (Conservative Illustration)"),
    tbl(
      ["Outcome", "Indicative Impact"],
      [
        ["Unremitted funds identified (Back Audit)", "2–5% of reviewed collections flagged as recoverable"],
        ["Ongoing remittance gap reduction", "50–70% reduction in undetected under-remittances"],
        ["Period-end close", "Weeks reduced to days with live match rates"],
        ["Audit readiness", "One-click executive and investigation reports"],
      ],
      [4000, 5360]
    ),
    h2("Recommended Commercial Model (Option A — Hybrid)"),
    tbl(
      ["Component", "Fee"],
      [
        ["90-day pilot (entry)", "₦22,000,000 fixed — Back Audit + 2–3 revenue heads"],
        ["Full deployment (Year 1)", "₦55,000,000 implementation + ₦12,000,000 SaaS = ₦67M fixed"],
        ["Success fee (on lodged recovery only)", "3.5% / 2.8% / 2.0% tiered — see Fee Structure document"],
      ],
      [4000, 5360]
    ),
    h2("Request"),
    p("Approval to commence under Option A: 90-day Back Audit pilot (₦22M) or proceed directly to full deployment (₦67M Year 1 fixed) with performance-linked success fees on verified recoveries only."),
    p("Prepared by: OEO Solutions  |  Eric Opute, ACA  |  Asaba & Lagos  |  oeosolution@gmail.com  |  +234 803 668 5485", { after: 60 }),
  ];
  return d;
}

// ─── 2. REVENUE RECOVERY POTENTIAL ───
function doc02() {
  const d = baseDoc("Revenue Recovery Potential", "Projected Revenue Recovery for Delta IGR");
  d.sections[0].children = [
    h1("Projected Recovery of Unremitted Funds for " + STATE + " IGR"),
    p("Primary objective: " + SCOPE_PRIMARY),
    p("This document presents illustrative recovery scenarios for unremitted and under-remitted funds. Final projections will be calibrated during discovery using actual " + STATE + " collection and remittance data."),
    h2("Scope — Focus Areas (In Scope)"),
    b("b1", "Under-remittances and remittance shortfalls"),
    b("b1", "Unidentified credits in IGR remittance accounts"),
    b("b1", "Delayed remittances — collections lodged after the reporting period"),
    b("b1", "Reconciliation mismatches between MDA collection reports and bank credits"),
    b("b1", "Missing or poorly referenced transfers from agents and platforms"),
    b("b1", "Collection system revenue leakage — classified as reconciliation exceptions"),
    h2("Scope — De-Emphasised (Out of Scope)"),
    b("b2", "Deliberate fraud investigations or criminal referrals"),
    b("b2", "Whistle-blowing programmes or asset tracing against individuals"),
    b("b2", "ReconFlow surfaces anomalies that may warrant separate review — but operates as a reconciliation and recovery tool, not a law-enforcement platform"),
    h2("Current IGR Reconciliation Challenges"),
    b("b1", "Collections recorded in MDA systems do not always match bank/Remita credits to Treasury"),
    b("b1", "Local government and agency remittances arrive with inconsistent references and timing"),
    b("b1", "Manual Excel reconciliation cannot scale across all revenue heads"),
    b("b1", "Historical gaps are rarely revisited — recoverable revenue from past periods remains hidden"),
    b("b1", "Leadership lacks a single confirmed-IGR figure — only gross collection estimates"),
    h2("How ReconFlow Recovers Unremitted Funds"),
    b("b2", "Back Audit Module — re-processes historical collection files (up to 10 years) to find funds collected but not remitted"),
    b("b2", "Reconciliation Exception Engine — identifies under-remittances, unidentified credits, and mismatches with ₦ variance"),
    b("b2", "Recovery Workflow — finance teams pursue lodgement of unremitted amounts with approver sign-off and audit trail"),
    b("b2", "Revenue Head Filtering — recovery scoped by motor licences, property tax, MDAs, markets, etc."),
    p("Industry benchmark: states and large institutions typically lose 8–15% of collections to reconciliation failure. Even recovering a fraction of historical gaps can exceed platform investment."),
    h2("Illustrative Recovery Scenarios"),
    p("Assumption base: If annual IGR under review is in the range of ₦80–120 billion (public estimates vary), the following conservative scenarios apply to recoverable amounts identified through Back Audit and ongoing reconciliation:", { italics: true }),
    tbl(
      ["Scenario", "Recovery Rate", "Illustrative Annual Value", "Basis"],
      [
        ["Conservative", "2% of reviewed collections", "₦1.6B – ₦2.4B", "Partial data quality; 3 revenue heads; 3-year lookback"],
        ["Moderate", "5% of reviewed collections", "₦4.0B – ₦6.0B", "Full channel mapping; 5 revenue heads; 5-year lookback"],
        ["Optimistic", "8% of reviewed collections", "₦6.4B – ₦9.6B", "Comprehensive ingest; all major channels; 10-year Back Audit"],
      ],
      [1800, 2000, 2800, 2760]
    ),
    p("Note: These are illustrative projections for discussion purposes. OEO Solutions will produce a calibrated recovery estimate within 2 weeks of receiving sample collection and remittance files."),
    h2("Why Back Audit Is the Quick Win"),
    p("Recovery of unremitted funds requires no change to current collection systems. ReconFlow ingests existing CSV/Excel exports from MDAs, Remita, and banks — then identifies collections not fully or timely lodged to IGR accounts. This is the highest-impact, lowest-disruption starting point for state programmes."),
    h2("Confirmed IGR Principle"),
    p("Matched transactions = confirmed IGR. Unmatched items = exposure held in an exception queue until recovered, explained, or written off with governance approval. This gives the Deputy Governor and EXCO a defensible revenue position — not an estimate."),
    h2("Recovery Scenarios & Estimated Success Fees (Option A — Hybrid)"),
    p("Fees apply only to revenue actually recovered and lodged into Delta State IGR accounts — not merely identified amounts.", { italics: true }),
    tbl(
      ["Scenario", "Identified Range", "Assumed Lodgement", "Projected Recovered", "Est. Success Fee (Option A)"],
      [
        ["Conservative", "₦1.6B – ₦2.4B", "70–80%", "₦1.4B – ₦1.9B", "₦49M – ₦67M"],
        ["Moderate", "₦4.0B – ₦6.0B", "65–75%", "₦2.8B – ₦4.5B", "₦90M – ₦128M"],
        ["Optimistic", "₦6.4B – ₦9.6B", "60–70%", "₦4.2B – ₦6.7B", "₦128M – ₦172M"],
      ],
      [1200, 1600, 1200, 1800, 2560]
    ),
    p("Success fees are payable from recovered funds — net recovery to the State remains substantially positive in all scenarios. See Delta_IGR_10_Fee_Structure for full tier tables and alternative options."),
  ];
  return d;
}

// ─── 3. BEFORE VS AFTER ───
function doc03() {
  const d = baseDoc("Before vs After", "Current Challenges vs ReconFlow Capabilities");
  d.sections[0].children = [
    h1("Current IGR Reconciliation Challenges vs ReconFlow Capabilities"),
    tbl(
      ["Today (Manual / Fragmented)", "With ReconFlow"],
      [
        ["Excel-based reconciliation across MDAs", "Automated matching across 21 configurable rules"],
        ["Leakages discovered months late", "Real-time anomaly detection with ₦ variance"],
        ["No visibility into past periods", "Back Audit — up to 10 years historical recovery"],
        ["Weak or missing audit trail", "Immutable logs + Control Gate governance"],
        ["Multiple channels, no single truth", "Single Master Ledger for all collection rails"],
        ["Unremitted funds discovered late", "Back Audit + real-time reconciliation exceptions"],
        ["Recovery actions undocumented", "Structured recovery workflow with approver sign-off"],
        ["Leadership reports are estimates", "Confirmed IGR dashboard with match rate %"],
        ["Rule changes untracked", "Control Gate — proposed, reviewed, approved, published"],
      ],
      [4680, 4680]
    ),
    new Paragraph({ spacing: { before: 200 } }),
    h2("Result"),
    p(STATE + " moves from reactive, manual IGR management to proactive, evidence-based revenue assurance — recovering what was lost and protecting what is collected going forward."),
  ];
  return d;
}

// ─── 4. SAMPLE REPORTS ───
function doc04() {
  const d = baseDoc("Sample Reports", "ReconFlow Reports & Dashboards — Visual Evidence");
  d.sections[0].children = [
    h1("Sample ReconFlow Reports & Dashboards"),
    p("The following illustrations show the reports " + STATE + " leadership and finance teams would receive. Live screenshots will be demonstrated during the meeting."),
    h2("1. Executive Intelligence Dashboard"),
    img("executive-dashboard-mock.jpg", IMG, 560, 310),
    cap("Figure 1: Confirmed IGR, unrecovered exposure, match rate, and recovery identified — by period"),
    h2("2. Anomaly & Leakage Detection"),
    img("reconciliation-process.jpg", MANUAL_IMG, 540, 320),
    cap("Figure 2: Anomaly queue with total variance in ₦, severity, and investigation status"),
    h2("3. Revenue Recovery & Back Audit"),
    img("daily-workflow.jpg", MANUAL_IMG, 540, 300),
    cap("Figure 3: Back Audit findings — recoverable revenue by revenue head and period"),
    h2("4. ReconFlow IGR Process Flow"),
    img("reconflow-igr-flow.jpg", IMG, 560, 260),
    cap("Figure 4: From collection ingest to confirmed IGR and recovery"),
    h2("5. Product / Revenue Head Performance"),
    img("navigation-map.jpg", MANUAL_IMG, 520, 340),
    cap("Figure 5: Per-revenue-head match rate, flagged items, and leakage trends"),
    p("All reports export to PDF for EXCO, House Committee, and audit purposes."),
  ];
  return d;
}

// ─── 5. ROADMAP ───
function doc05() {
  const d = baseDoc("Implementation Roadmap", "Proposed Implementation Roadmap");
  d.sections[0].children = [
    h1("Proposed Implementation Roadmap for " + STATE + " IGR"),
    tbl(
      ["Phase", "Timeline", "Activities", "Visible Results"],
      [
        ["Phase 1: Quick Wins", "Weeks 1–6", "Discovery, workspace setup, Back Audit on priority revenue heads", "First recovery report within 4–6 weeks"],
        ["Phase 2: Daily Reconciliation", "Weeks 7–12", "Live ingest of collections + remittance; anomaly workflow", "Daily confirmed IGR dashboard"],
        ["Phase 3: Full Rollout", "Months 4–6", "All MDAs, LGAs, Remita, bank channels; executive reporting", "Statewide IGR assurance programme"],
      ],
      [1600, 1400, 4160, 2200]
    ),
    h2("Time to First Visible Results"),
    p("Back Audit on historical data can produce a first recovery findings report within 4–6 weeks of receiving sample files — before full system rollout. This is designed to demonstrate value early to EXCO and the Deputy Governor."),
    h2("OEO Local Presence"),
    p("OEO Solutions maintains an office in Asaba, Delta State (F2 EAO Plaza, Coca Junction) alongside Lagos HQ — providing on-ground implementation and support."),
  ];
  return d;
}

// ─── 6. GOVERNANCE ───
function doc06() {
  const d = baseDoc("Governance", "Governance & Accountability Framework");
  d.sections[0].children = [
    h1("ReconFlow Governance & Accountability Framework"),
    p("Designed for public-sector transparency and audit requirements."),
    tbl(
      ["Control", "How ReconFlow Delivers"],
      [
        ["Segregation of Duties", "Four roles: Viewer (EXCO), Auditor (finance officer), Approver (commissioner/DFA), Administrator (ICT)"],
        ["Control Gate", "No matching rule or tolerance change goes live without approver sign-off"],
        ["Immutable audit trail", "Every upload, reconciliation run, investigation, and resolution logged"],
        ["Investigation workflow", "Anomalies assigned, investigated, resolved with documented root cause"],
        ["Tenant isolation", "Dedicated " + STATE + " workspace — no data shared with other clients"],
        ["Access control", "Invite-only users; session timeout; optional IP allowlist"],
        ["Reporting for oversight", "HTML audit packs and PDF executive reports for House and audit queries"],
      ],
      [3200, 6160]
    ),
    h2("Scope Boundary — Reconciliation, Not Criminal Investigation"),
    p("ReconFlow is deployed for revenue reconciliation and recovery of unremitted funds. Anomalies flagged as reconciliation exceptions or revenue leakage are resolved through the finance recovery workflow. Deliberate fraud investigation, criminal referrals, whistle-blowing, and individual asset tracing are outside scope and remain with established State oversight bodies."),
    h2("Public Accountability"),
    p("Every recovered naira is traceable: which revenue head, which period, which evidence file, which officer approved the lodgement. Language stays neutral — focused on unremitted funds and recoverable revenue."),
  ];
  return d;
}

// ─── 7. ROI ───
function doc07() {
  const d = baseDoc("ROI", "Cost vs Expected Returns");
  d.sections[0].children = [
    h1("Cost vs Expected Returns (ROI)"),
    p("OEO Solutions recommends Option A (Hybrid): modest fixed investment + performance-linked success fees on lodged recoveries only."),
    h2("Fixed Costs — OEO Recommended Pricing"),
    tbl(
      ["Item", "Fee (₦)", "Notes"],
      [
        ["90-day pilot", "22,000,000", "Back Audit + 2–3 revenue heads; credited ₦10M toward full deployment if proceeding within 6 months"],
        ["Full deployment — implementation", "55,000,000", "Discovery, configuration, all channels, training, 6-month go-live support"],
        ["Year 1 SaaS license", "12,000,000", "Platform, hosting, updates, L2 support, account manager"],
        ["Minimal full deployment Year 1 total", "67,000,000", "State runs daily reconciliation in-house"],
        ["Optional: managed reconciliation", "4,000,000 / month", "OEO-operated daily recon + anomaly resolution"],
      ],
      [3200, 2000, 4160]
    ),
    h2("Success Fees (Option A — on lodged recovery only)"),
    tbl(
      ["Tier", "Recovered & Lodged", "Rate"],
      [
        ["Tier 1", "First ₦2 billion", "3.5%"],
        ["Tier 2", "₦2 billion – ₦5 billion", "2.8%"],
        ["Tier 3", "Above ₦5 billion", "2.0%"],
      ],
      [2800, 3600, 2960]
    ),
    h2("Net ROI Illustration (Conservative Scenario)"),
    tbl(
      ["Line", "Amount (₦)"],
      [
        ["Fixed cost (full deployment Year 1)", "67,000,000"],
        ["Projected recovered & lodged (conservative)", "1,400,000,000 – 1,900,000,000"],
        ["Estimated success fee (Option A)", "49,000,000 – 67,000,000"],
        ["Net to Delta State (conservative)", "1,284,000,000 – 1,784,000,000"],
        ["Return on fixed investment", "19× – 27× fixed cost alone"],
      ],
      [4680, 4680]
    ),
    h2("Expected Returns"),
    tbl(
      ["Return", "Conservative Estimate"],
      [
        ["Historical recovery (Back Audit)", "₦1.6B+ identified; ₦1.4B+ lodged (conservative)"],
        ["Ongoing leakage prevention", "50–70% reduction in annual IGR loss (8–15% industry benchmark)"],
        ["Payback on fixed fees", "First lodged recovery cycle — success fees paid from recovered funds"],
      ],
      [4680, 4680]
    ),
    h2("Non-Financial Benefits"),
    b("b1", "Confirmed IGR reporting for EXCO and legislature"),
    b("b1", "Faster period-end close and reduced manual labour"),
    b("b1", "Improved transparency and public trust"),
    b("b1", "Defensible evidence for audit and anti-corruption oversight"),
    b("b1", "Better revenue forecasting from clean historical data"),
  ];
  return d;
}

// ─── 8. BRIEFING NOTES + DIAGRAM ───
function doc08() {
  const d = baseDoc("Briefing Notes", "Deputy Governor Briefing Notes");
  d.sections[0].children = [
    h1("Briefing Notes — Meeting with Deputy Governor"),
    p("Date: [Insert]  |  Attendees: Deputy Governor, Commissioner of Finance, OEO Solutions", { italics: true }),
    h2("Primary Objective — Lead With This"),
    p(SCOPE_PRIMARY, { bold: true }),
    h2("Updated ReconFlow Summary — Key Points"),
    b("b1", "ReconFlow recovers unremitted funds — collections not fully or timely lodged to Delta State IGR accounts."),
    b("b1", "Neutral language: reconciliation exceptions, revenue leakage, recoverable revenue — not fraud or criminal investigation."),
    b("b1", "Single Master Ledger matches MDA/agent/bank collection reports against remittance account credits."),
    b("b1", "Matched transactions = confirmed IGR. Unmatched = unremitted funds in a governed recovery queue."),
    b("b1", "Back Audit re-processes up to 10 years of historical data — primary quick win for state IGR recovery."),
    b("b1", "21 matching rules, confidence scoring, AI anomaly investigation, Control Gate governance."),
    b("b1", "Executive dashboards and one-click PDF reports for EXCO and oversight bodies."),
    img("reconflow-igr-flow.jpg", IMG, 580, 270),
    cap("Diagram: ReconFlow IGR Assurance Flow — Ingest → Match → Recover → Report"),
    h2("Talking Points for the Deputy Governor"),
    n("n1", "Open with scope: our focus is recovery of unremitted funds — money collected but not lodged to Treasury. Avoid fraud language."),
    n("n1", "Name the pain: under-remittances, delayed remittances, unidentified bank credits, reconciliation mismatches."),
    n("n1", "Lead with Back Audit: identify unremitted funds from past periods within 4–6 weeks — no system replacement."),
    n("n1", "Show the diagram and sample dashboard — make it tangible."),
    n("n1", "Emphasize governance: every recovery action is logged and approved — built for public accountability."),
    n("n1", "Present fee model: Option A Hybrid — ₦67M Year 1 fixed + success fee only on lodged recovery."),
    n("n1", "Emphasize: State pays success fees from recovered money — minimal upfront risk via ₦22M pilot."),
    n("n1", "Close with net ROI: conservative scenario nets State ₦1.28B+ after all fees."),
    h2("Document Handover Order"),
    n("n1", "Hand Executive Summary first (1 page)"),
    n("n1", "Present Scope document (Doc 12) — confirms focus on unremitted funds, not fraud"),
    n("n1", "Walk through Revenue Recovery Potential (core discussion)"),
    n("n1", "Present Fee Structure (Doc 10) when discussing commercial terms"),
    n("n1", "Use Full Deployment Cost (Doc 11) if asked for itemised breakdown"),
    n("n1", "Use Presentation slides to guide conversation"),
    n("n1", "Keep Roadmap, Governance, ROI, and Sample Reports as backup"),
    h2("Presenter Credentials (Verbal — Not Handover)"),
    p("Eric Opute, ACA — Founder, OEO Solutions. 20+ years in reconciliation, revenue assurance, and payment controls. Former Manager, Online Payment & Dispute Resolution at Wakanow.com; former Resident Internal Auditor, Heritage Bank (payment systems). ReconFlow built from lived experience in high-volume reconciliation."),
  ];
  return d;
}

// ─── 9. PRESENTATION (12 slides as Word pages) ───
function doc09() {
  const d = baseDoc("Presentation", "Deputy Governor Presentation");
  const slide = (num, title, lines) => [
    new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: "SLIDE " + num, size: 16, color: "888888" })] }),
    new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: title, size: 32, bold: true, color: "1E3A5F" })] }),
    ...lines.map((l) => b("b1", l)),
    pb(),
  ];
  d.sections[0].children = [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 2400 }, children: [new TextRun({ text: "ReconFlow for " + STATE + " IGR", size: 40, bold: true, color: "1E3A5F" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "Revenue Assurance & Recovery", size: 28, color: "0D9488" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Briefing for the Deputy Governor  |  June 2026", size: 22, color: "666666" })] }),
    pb(),
    ...slide(1, "Primary Objective", [
      "Recovery of unremitted funds into Delta State IGR accounts",
      "Collections by MDAs, agents, banks, platforms — not fully/timely remitted",
      "Neutral focus: reconciliation exceptions & recoverable revenue",
      "Not a fraud or criminal investigation platform",
    ]),
    ...slide(2, "The Challenge", [
      "Under-remittances and remittance shortfalls",
      "Unidentified credits in remittance accounts",
      "Delayed remittances and reconciliation mismatches",
      "8–15% industry benchmark — collection vs lodgement gaps",
    ]),
    ...slide(3, "What Is ReconFlow?", [
      "Revenue reconciliation & unremitted funds recovery platform",
      "Built by OEO Solutions — Asaba & Lagos offices",
      "Matches collection reports to bank/Remita credits",
      "Back Audit finds historical unremitted funds",
    ]),
    ...slide(4, "Confirmed IGR Principle", [
      "Matched = confirmed revenue lodged to the State",
      "Unmatched = unremitted funds — recovery queue",
      "Every naira traceable to evidence and approver",
    ]),
    ...slide(5, "Back Audit — The Quick Win", [
      "Re-process up to 10 years of collection data",
      "No change to current collection systems",
      "First recovery report in 4–6 weeks",
      "Highest-impact starting point for state programmes",
    ]),
    ...slide(6, "Recovery Scenarios (Illustrative)", [
      "Conservative: 2% — ₦1.6B–₦2.4B identified",
      "Moderate: 5% — ₦4.0B–₦6.0B identified",
      "Optimistic: 8% — ₦6.4B–₦9.6B identified",
      "Calibrated to actual data at discovery",
    ]),
    ...slide(7, "Before vs After", [
      "Excel reconciliation → Automated matching",
      "Late leakage detection → Real-time anomalies",
      "No historical view → 10-year Back Audit",
      "Weak audit trail → Control Gate governance",
    ]),
    ...slide(8, "What Leadership Sees", [
      "Confirmed IGR dashboard (₦)",
      "Unrecovered exposure (₦)",
      "Match rate % by revenue head",
      "Recovery identified — one-click PDF export",
    ]),
    ...slide(9, "Sample Dashboard", [
      "[Show executive-dashboard-mock.jpg during meeting]",
      "Live demo available with " + STATE + " file formats",
    ]),
    ...slide(10, "Implementation Roadmap", [
      "Phase 1 (Weeks 1–6): Back Audit quick wins",
      "Phase 2 (Weeks 7–12): Daily reconciliation",
      "Phase 3 (Months 4–6): Full statewide rollout",
      "OEO Asaba office — local support",
    ]),
    ...slide(11, "Governance & Scope Boundary", [
      "Reconciliation & recovery — not criminal investigation",
      "Role-based access; Control Gate; full audit trail",
      "Anomalies = reconciliation exceptions, not fraud findings",
      "Built for public-sector transparency",
    ]),
    ...slide(12, "Investment & Returns (Option A — Recommended)", [
      "90-day pilot: ₦22M fixed (Back Audit + 2–3 revenue heads)",
      "Full deployment Year 1: ₦67M fixed (₦55M impl + ₦12M SaaS)",
      "Success fee: 3.5% / 2.8% / 2.0% — only on lodged recovery",
      "Conservative net to State: ₦1.28B+ after all fees",
    ]),
    ...slide(13, "Request & Next Steps", [
      "Approve Option A: pilot (₦22M) or full deployment (₦67M)",
      "Designate Finance sponsor + provide sample files",
      "Joint verification by Auditor-General before success fees",
      "First recovery report within 4–6 weeks",
      "Eric Opute, ACA  |  OEO Solutions  |  +234 803 668 5485",
    ]),
  ];
  return d;
}

// ─── 10. FEE STRUCTURE (full document) ───
function doc10() {
  const d = baseDoc("Fee Structure", "OEO-RF-FS-0626 — Fee Structure");
  d.sections[0].children = [
    new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: "Document Reference: OEO-RF-FS-0626  |  Date: June 2026", size: 18, color: "666666" })] }),
    new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: "Prepared for: Delta State Government", size: 20 })] }),
    h1("ReconFlow Revenue Assurance & Reconciliation Services"),
    p("Fee Structure for Delta State Internally Generated Revenue (IGR) Remittance Accounts"),
    h2("1. Introduction"),
    p("Scope: Recovery of unremitted funds lodged into Delta State IGR accounts. Fees apply to successfully recovered and remitted amounts — not fraud penalties or criminal recoveries."),
    p("OEO Solutions proposes a performance-aligned fee structure for deployment of ReconFlow — the enterprise revenue assurance and reconciliation platform — together with managed services for reconciliation, Back Audit, reconciliation exception resolution, and unremitted funds recovery support."),
    p("This model ensures the State pays primarily for results: actual revenue recovered and lodged into government accounts. OEO's recommended approach (Option A) combines a modest fixed investment for platform deployment with tiered success fees — balancing speed of deployment with minimal financial risk."),
    h2("2. Tiered Success Fee (Pure Performance Component)"),
    p("Success fees are charged only on actually recovered revenue — verified and lodged into Delta State IGR accounts. No fee is payable on merely identified amounts."),
    tbl(
      ["Tier", "Recovered & Lodged Amount", "Success Fee Rate (Pure — Option B)"],
      [
        ["Tier 1", "First ₦2 billion", "4.5%"],
        ["Tier 2", "₦2 billion – ₦5 billion", "3.5%"],
        ["Tier 3", "Above ₦5 billion", "2.5%"],
      ],
      [2000, 3800, 3560]
    ),
    h2("3. Illustrative Recovery Scenarios & Fee Projections"),
    tbl(
      ["Scenario", "Identified Range", "Assumed Lodgement", "Projected Recovered", "Est. Fee (Pure)", "Est. Fee (Option A)"],
      [
        ["Conservative", "₦1.6B – ₦2.4B", "70–80%", "₦1.4B – ₦1.9B", "₦63M – ₦86M", "₦49M – ₦67M"],
        ["Moderate", "₦4.0B – ₦6.0B", "65–75%", "₦2.8B – ₦4.5B", "₦112M – ₦158M", "₦90M – ₦128M"],
        ["Optimistic", "₦6.4B – ₦9.6B", "60–70%", "₦4.2B – ₦6.7B", "₦147M – ₦198M", "₦128M – ₦172M"],
      ],
      [1100, 1300, 1100, 1500, 1300, 2200]
    ),
    h2("4. Alternative Fee Options"),
    tbl(
      ["Option", "Description", "Fixed Fee", "Success Fee Rates", "Best For"],
      [
        ["A (Recommended)", "Hybrid Model", "₦55M impl + ₦12M SaaS (₦67M Y1)", "3.5% / 2.8% / 2.0%", "Balanced — faster deployment, lower success rate"],
        ["B", "Pure Success Fee", "₦0 upfront", "5.5% / 4.0% / 3.0%", "Zero upfront cost to the State"],
        ["C", "Capped Model", "₦75M all-in Year 1", "4.0% capped at ₦250M total", "Budget certainty for procurement"],
        ["D", "Pilot Entry", "₦22M (90 days)", "3.5% on pilot recoveries only", "Low-risk proof of value before full rollout"],
      ],
      [900, 2200, 2000, 2000, 2260]
    ),
    h2("5. Payment Terms & Conditions"),
    b("b1", "Success fees payable only after actual recovery and lodgement into designated Delta State Government accounts."),
    b("b1", "Fixed fees: 50% on contract signing, 50% on go-live acceptance (or 100% upfront for pilot)."),
    b("b1", "Success fee payment within 21 days of joint verification and approval by the State."),
    b("b1", "Independent verification (Auditor-General or mutually agreed external auditor) required before success fee payment."),
    b("b1", "Quarterly reconciliation of recovered amounts and fees due."),
    b("b1", "All fees exclusive of VAT (7.5%) where applicable."),
    b("b1", "Platform license and L2 support included in SaaS fee; renewable annually."),
    b("b1", "Pilot fee of ₦22M credited ₦10M toward full deployment if contract signed within 6 months of pilot completion."),
    h2("6. Key Benefits of This Fee Structure"),
    b("b2", "Minimal financial risk — success fees paid from recovered revenue."),
    b("b2", "Strong alignment of interests — OEO succeeds when the State recovers."),
    b("b2", "Transparent, auditable, compliant with government accountability standards."),
    b("b2", "Flexible options (A–D) to suit EXCO and procurement approval processes."),
    h2("Declaration"),
    p("OEO Solutions is confident that ReconFlow, combined with this performance-based model, will deliver significant and measurable revenue recovery for Delta State while strengthening IGR reconciliation processes. We are happy to refine this structure based on the State's preferences."),
    p("Prepared by: Eric Opute, ACA — Managing Director, OEO Solutions"),
    p("Email: oeosolution@gmail.com  |  info@oeosolution.com  |  Tel: +234 803 668 5485 / +234 913 338 0300"),
    p("Date: June 2026"),
  ];
  return d;
}

// ─── 11. FULL DEPLOYMENT COST (itemised) ───
function doc11() {
  const d = baseDoc("Full Deployment Cost", "Minimal Cost — Full ReconFlow Deployment");
  d.sections[0].children = [
    h1("ReconFlow Full Deployment — Cost Detail for Delta State"),
    p("Primary objective: " + SCOPE_PRIMARY),
    p("This document itemises the minimum cost to fully deploy ReconFlow across Delta State IGR remittance accounts — all MDAs, LGAs, Remita, bank channels, and executive reporting — focused on recovery of unremitted funds, with the State operating daily reconciliation in-house (no managed services)."),
    h2("Deployment Scope — What Is Included"),
    b("b1", "Dedicated Delta State ReconFlow workspace (multi-tenant isolated)"),
    b("b1", "Discovery and channel mapping — all major IGR revenue heads"),
    b("b1", "Ingest templates: Remita, treasury/bank statements, MDA collections, LGA remittances"),
    b("b1", "21 matching rules configured with Control Gate governance"),
    b("b1", "Back Audit module — up to 10-year historical reprocessing"),
    b("b1", "Executive Intelligence dashboard — confirmed IGR, exposure, recovery, margin"),
    b("b1", "Role-based training: Auditor, Approver, Executive, Administrator (4 workshops + EXCO briefing)"),
    b("b1", "Operational manual, auditor quick-start, and CFO reporting guide"),
    b("b1", "6 months go-live support from OEO Asaba and Lagos offices"),
    h2("Itemised Cost Breakdown — Minimal Full Deployment"),
    tbl(
      ["#", "Component", "Cost (₦)", "Deliverable"],
      [
        ["1", "Discovery & IGR channel mapping", "8,000,000", "Channel inventory document, rule design"],
        ["2", "Platform configuration & security", "10,000,000", "Workspace, RLS, roles, audit year settings"],
        ["3", "Back Audit setup & historical ingest", "10,000,000", "10-year lookback configured, pilot run"],
        ["4", "Ingest templates — all agreed channels", "15,000,000", "Remita, banks, MDAs, LGAs, levies"],
        ["5", "Training & change management", "5,000,000", "4 workshops + EXCO briefing + manuals"],
        ["6", "Go-live support (6 months)", "7,000,000", "On-site and remote support, tuning"],
        ["", "Implementation subtotal", "55,000,000", ""],
        ["7", "Year 1 SaaS license & support", "12,000,000", "Hosting, updates, L2, account manager"],
        ["", "MINIMAL FULL DEPLOYMENT — YEAR 1 TOTAL", "67,000,000", "State-operated daily reconciliation"],
      ],
      [400, 3200, 1800, 4160]
    ),
    h2("Optional Add-Ons (Not Required for Full Deployment)"),
    tbl(
      ["Add-On", "Cost (₦)", "When to Consider"],
      [
        ["Managed reconciliation service", "4,000,000 / month", "State lacks in-house recon capacity"],
        ["Additional Back Audit years / heads", "3,000,000 per wave", "Expanding beyond initial scope"],
        ["Year 2+ SaaS renewal", "12,000,000 / year", "Ongoing platform access and support"],
        ["Custom integration (API)", "Quoted separately", "Real-time feed from collection systems"],
      ],
      [3600, 2400, 3760]
    ),
    h2("Entry Path vs Full Deployment"),
    tbl(
      ["Path", "Year 1 Fixed Cost", "Timeline", "Outcome"],
      [
        ["Pilot only (Option D)", "₦22,000,000", "90 days", "Back Audit report + 2–3 revenue heads; proof of recovery"],
        ["Pilot → Full (recommended)", "₦22M + ₦57M = ₦79M*", "9–12 months", "*₦10M pilot credit applied; full statewide programme"],
        ["Direct full deployment", "₦67,000,000", "6 months", "Immediate statewide rollout"],
      ],
      [2400, 2800, 2000, 3160]
    ),
    h2("What the State Does NOT Pay For"),
    b("b2", "Replacement of existing collection systems, Remita, or treasury platforms"),
    b("b2", "Success fees on identified-but-not-lodged amounts"),
    b("b2", "Custom software development outside standard ReconFlow modules"),
    h2("Total Cost of Ownership — 3-Year View (Minimal)"),
    tbl(
      ["Year", "Fixed Costs (₦)", "Success Fees (₦)", "Notes"],
      [
        ["Year 1", "67,000,000", "Per Option A tiers — on lodged recovery only", "Implementation + SaaS"],
        ["Year 2", "12,000,000", "Per Option A tiers", "SaaS renewal only"],
        ["Year 3", "12,000,000", "Per Option A tiers", "SaaS renewal only"],
        ["3-year fixed total", "91,000,000", "Variable — funded from recovered revenue", ""],
      ],
      [1600, 3200, 3200, 2360]
    ),
    p("Against a conservative first-year recovery of ₦1.4B+ lodged, the 3-year fixed investment of ₦91M represents less than 7% of recovered funds — before ongoing leakage prevention benefits."),
    p("Prepared by: OEO Solutions  |  OEO-RF-FS-0626  |  June 2026"),
  ];
  return d;
}

// ─── 12. SCOPE — UNREMITTED FUNDS ───
function doc12() {
  const d = baseDoc("Scope of Engagement", "Scope — Recovery of Unremitted Funds");
  d.sections[0].children = [
    h1("Scope of Engagement — Recovery of Unremitted Funds"),
    p("Document Reference: OEO-RF-SCOPE-0626  |  Prepared for: Delta State Government  |  June 2026", { italics: true }),
    h2("Primary Objective"),
    p(SCOPE_PRIMARY, { bold: true }),
    p("ReconFlow is positioned as a revenue reconciliation and recovery tool. It strengthens IGR integrity by ensuring that revenues collected across the State are fully and timely accounted for in designated government accounts."),
    h2("Focus Areas — In Scope"),
    tbl(
      ["Area", "Description", "ReconFlow Response"],
      [
        ["Under-remittances", "MDA or agent collected more than was lodged", "Amount variance flagged; recovery workflow initiated"],
        ["Remittance shortfalls", "Partial lodgement against declared collections", "Shortfall quantified in ₦; tracked to resolution"],
        ["Unidentified credits", "Bank/Remita credits with no matching collection record", "Held in exception queue for classification"],
        ["Delayed remittances", "Collections lodged outside expected period", "Timing rules flag delays; cumulative recovery tracked"],
        ["Reconciliation mismatches", "Collection report ≠ bank credit", "Automated matching with confidence scoring"],
        ["Poorly referenced transfers", "Missing or truncated payment references", "Fuzzy matching + manual investigation notes"],
        ["Revenue leakage", "Systemic gaps in collection-to-lodgement chain", "Classified as reconciliation exceptions — not fraud"],
      ],
      [2200, 3580, 3580]
    ),
    h2("Explicitly Out of Scope"),
    tbl(
      ["Excluded Activity", "Rationale"],
      [
        ["Deliberate fraud investigations", "Requires law enforcement mandate — outside reconciliation remit"],
        ["Criminal referrals or prosecutions", "Remains with EFCC, Police, or State legal frameworks"],
        ["Whistle-blowing programmes", "Not part of platform deployment"],
        ["Asset tracing against individuals", "Personal asset recovery is a separate legal process"],
      ],
      [4680, 4680]
    ),
    p("Where reconciliation exceptions resemble potential misconduct, ReconFlow documents the financial evidence (variance, period, channel, reference) and routes through the finance recovery workflow. Further escalation remains a separate decision of State leadership and oversight bodies."),
    h2("Language Guide for Government Communications"),
    tbl(
      ["Use", "Avoid"],
      [
        ["Unremitted funds", "Stolen revenue / fraud (unless legally established)"],
        ["Reconciliation exceptions", "Criminal activity"],
        ["Recoverable revenue", "Punitive recovery"],
        ["Revenue leakage", "Corruption (in public documents)"],
        ["Under-remittance / shortfall", "Theft"],
        ["Lodgement to IGR accounts", "Confiscation"],
      ],
      [4680, 4680]
    ),
    h2("Success Criteria Aligned to Scope"),
    b("b1", "Unremitted funds identified and quantified (₦) by revenue head and period"),
    b("b1", "Recovery actions documented with approver sign-off"),
    b("b1", "Funds lodged into designated Delta State IGR accounts"),
    b("b1", "Success fees payable only on verified lodgement — see Fee Structure (OEO-RF-FS-0626)"),
    b("b1", "Confirmed IGR dashboard reflects matched (lodged) vs unremitted (outstanding) positions"),
    h2("Declaration"),
    p("This scope definition ensures ReconFlow delivers measurable financial results for Delta State while maintaining neutral, audit-appropriate language suitable for EXCO, the House of Assembly, and public accountability frameworks."),
    p("Prepared by: Eric Opute, ACA — OEO Solutions  |  oeosolution@gmail.com  |  +234 803 668 5485"),
  ];
  return d;
}

const FILES = [
  ["01_Executive_Summary", doc01],
  ["02_Revenue_Recovery_Potential", doc02],
  ["03_Before_After", doc03],
  ["04_Sample_Reports", doc04],
  ["05_Implementation_Roadmap", doc05],
  ["06_Governance_Risk", doc06],
  ["07_ROI", doc07],
  ["08_Briefing_Notes", doc08],
  ["09_Presentation", doc09],
  ["10_Fee_Structure", doc10],
  ["11_Full_Deployment_Cost", doc11],
  ["12_Scope_Unremitted_Funds", doc12],
];

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const [name, fn] of FILES) {
    const out = path.join(OUT_DIR, "Delta_IGR_" + name + ".docx");
    const tmp = out + ".tmp";
    const buf = await Packer.toBuffer(new Document(fn()));
    fs.writeFileSync(tmp, buf);
    try {
      if (fs.existsSync(out)) fs.unlinkSync(out);
    } catch (_) { /* file may be open */ }
    try {
      fs.renameSync(tmp, out);
    } catch (_) {
      fs.copyFileSync(tmp, out);
      fs.unlinkSync(tmp);
    }
    console.log("Created:", out);
  }
  console.log("\nAll documents in:", OUT_DIR);
}

main().catch(console.error);
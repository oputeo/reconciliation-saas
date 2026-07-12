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
const DEMO_IP = "10.199.220.251";
const DEMO_URL = `http://${DEMO_IP}:3000`;
const STATE = "Delta State";
const AUDIENCE = "Permanent Secretary, Ministry of Finance";
const SCOPE = "Recovery of Unremitted Funds — revenues collected by MDAs, agents, banks, and digital platforms not fully or timely remitted into Delta State IGR accounts.";

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

function pb() { return new Paragraph({ children: [new PageBreak()] }); }
function cap(t) { return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 180 }, children: [new TextRun({ text: t, italics: true, size: 18, color: "555555" })] }); }
function img(file, dir, w, h) {
  const fp = path.join(dir || IMG, file);
  if (!fs.existsSync(fp)) return new Paragraph({ children: [new TextRun({ text: `[${file}]`, italics: true })] });
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 80 },
    children: [new ImageRun({ type: "jpg", data: fs.readFileSync(fp), transformation: { width: w, height: h }, altText: { title: file, description: file, name: file } })] });
}
function tbl(headers, rows, widths) {
  const total = widths.reduce((a, c) => a + c, 0);
  return new Table({
    width: { size: total, type: WidthType.DXA }, columnWidths: widths,
    rows: [
      new TableRow({ children: headers.map((h, i) => new TableCell({ borders, width: { size: widths[i], type: WidthType.DXA },
        shading: { fill: "1E3A5F", type: ShadingType.CLEAR }, margins: { top: 70, bottom: 70, left: 100, right: 100 },
        children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 19 })] })] })) }),
      ...rows.map((row, ri) => new TableRow({ children: row.map((c, ci) => new TableCell({ borders, width: { size: widths[ci], type: WidthType.DXA },
        shading: { fill: ri % 2 ? "FFFFFF" : "F5F8FA", type: ShadingType.CLEAR }, margins: { top: 70, bottom: 70, left: 100, right: 100 },
        children: [new Paragraph({ children: [new TextRun({ text: c, size: 19 })] })] })) })),
    ],
  });
}
function slide(num, title, bullets, extra) {
  return [
    new Paragraph({ spacing: { before: 80 }, children: [new TextRun({ text: `SLIDE ${num}`, size: 16, color: "888888" })] }),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: title, size: 30, bold: true, color: "1E3A5F" })] }),
    ...bullets.map((t) => new Paragraph({ numbering: { reference: "b1", level: 0 }, spacing: { after: 70 }, children: [new TextRun({ text: t, size: 21 })] })),
    ...(extra || []),
    pb(),
  ];
}
function baseDoc(title, sub) {
  return {
    title, styles: { default: { document: { run: { font: "Arial", size: 21 } } } },
    numbering: {
      config: [
        { reference: "b1", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 640, hanging: 320 } } } }] },
        { reference: "n1", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 640, hanging: 320 } } } }] },
      ],
    },
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } } },
      headers: { default: new Header({ children: [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 5, color: "0D9488", space: 1 } },
        children: [new TextRun({ text: "OEO Solutions", bold: true, color: "1E3A5F" }), new TextRun({ text: `  |  ${sub}`, color: "666666" })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Confidential  |  June 2026  |  Page ", size: 15, color: "888888" }), new TextRun({ children: [PageNumber.CURRENT], size: 15, color: "888888" })] })] }) },
      children: [],
    }],
  };
}

// ─── EXECUTIVE PRESENTATION (18 slides) ───
function presentation() {
  const d = baseDoc("Perm Sec Executive Presentation", `${STATE} IGR Assurance`);
  d.sections[0].children = [
    new Paragraph({ spacing: { before: 2200 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ReconFlow", size: 56, bold: true, color: "1E3A5F" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: "IGR Assurance & Recovery of Unremitted Funds", size: 28, bold: true, color: "0D9488" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: STATE, size: 24 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: `Briefing for the ${AUDIENCE}`, size: 22, color: "555555" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "OEO Solutions  |  Asaba & Lagos  |  June 2026", size: 20, color: "888888" })] }),
    pb(),
    ...slide(1, "Meeting Purpose", [
      "Present ReconFlow as Delta State's IGR assurance platform",
      "Demonstrate recovery of unremitted funds — not fraud investigation",
      "Show live platform capabilities during this session",
      "Propose 90-day pilot with measurable recovery outcomes",
    ]),
    ...slide(2, "The IGR Challenge in Delta State", [
      "Collections across MDAs, LGAs, Remita, banks, agents, digital platforms",
      "Gap between amounts collected and amounts lodged to Treasury",
      "Manual Excel reconciliation cannot scale statewide",
      "Industry benchmark: 8–15% leakage from reconciliation failure",
      "Leadership needs confirmed IGR — not estimates",
    ]),
    ...slide(3, "Primary Objective", [
      SCOPE,
      "Focus: under-remittances, delayed remittances, unidentified credits",
      "Neutral language: reconciliation exceptions, recoverable revenue",
      "Out of scope: criminal investigation, whistle-blowing, asset tracing",
    ]),
    ...slide(4, "What Is ReconFlow?", [
      "AI-powered revenue assurance & reconciliation SaaS platform",
      "Built by OEO Solutions — Nigerian company, Asaba office",
      "Single Master Ledger across all collection channels",
      "21 matching rules, Back Audit (10 years), executive reporting",
      "Deployed for banks, fintechs, and high-volume collectors",
    ], [img("delta-igr-value-chain.jpg", IMG, 560, 290), cap("Figure: Collect → Match → Recover → Report")]),
    ...slide(5, "Confirmed IGR Principle", [
      "Matched transactions = confirmed revenue lodged to the State",
      "Unmatched = unremitted funds in governed recovery queue",
      "Every naira traceable to evidence and approver sign-off",
      "Executive dashboard: Confirmed IGR vs Unrecovered Exposure (₦)",
    ]),
    ...slide(6, "Back Audit — The Quick Win", [
      "Re-process up to 10 years of historical collection data",
      "No change to existing collection systems or Remita",
      "First recovery findings report within 4–6 weeks",
      "Highest-impact, lowest-disruption starting point",
    ], [img("daily-workflow.jpg", MANUAL_IMG, 520, 280), cap("Figure: Back Audit workflow — closed period recovery")]),
    ...slide(7, "Recovery Potential (Illustrative)", [
      "Conservative: ₦1.6B–₦2.4B identified | ₦1.4B+ lodged",
      "Moderate: ₦4.0B–₦6.0B identified",
      "Optimistic: ₦6.4B–₦9.6B identified",
      "Calibrated to actual Delta data at discovery workshop",
    ], [tbl(["Scenario", "Projected Lodged", "Est. Success Fee (A)"], [
      ["Conservative", "₦1.4B – ₦1.9B", "₦49M – ₦67M"],
      ["Moderate", "₦2.8B – ₦4.5B", "₦90M – ₦128M"],
    ], [2800, 3280, 3280])]),
    ...slide(8, "Before vs After", [
      "Excel reconciliation → Automated matching at scale",
      "Late discovery of gaps → Real-time reconciliation exceptions",
      "No historical view → 10-year Back Audit",
      "Weak audit trail → Control Gate governance + immutable logs",
      "Estimated IGR → Confirmed IGR dashboard",
    ]),
    ...slide(9, "Executive Dashboard (Live Demo Preview)", [
      "Confirmed IGR (₦) — board-ready revenue position",
      "Unrecovered exposure (₦) — pending recovery queue",
      "Match rate % by revenue head and period",
      "Recovery identified — one-click PDF for EXCO",
    ], [img("executive-dashboard-mock.jpg", IMG, 560, 310), cap("Figure: Executive Intelligence — illustrative dashboard")]),
    ...slide(10, "Platform Capabilities (Live Demo)", [
      "Live Reconciliation — ingest MDA/bank/Remita CSVs",
      "Anomaly queue — reconciliation exceptions with ₦ variance",
      "AI-assisted investigation and approver workflow",
      "Revenue Recovery & Back Audit module",
      "Control Gate — governed rule changes",
    ], [img("reconflow-igr-flow.jpg", IMG, 540, 250)]),
    ...slide(11, "Governance & Accountability", [
      "Four-tier roles: Viewer, Auditor, Approver, Administrator",
      "Segregation of duties — finance approver sign-off required",
      "Immutable audit trail on every upload, run, and resolution",
      "Dedicated Delta State workspace — tenant isolated",
      "Suitable for Auditor-General and House oversight",
    ]),
    ...slide(12, "Implementation Roadmap", [
      "Phase 1 (Weeks 1–6): Discovery + Back Audit quick wins",
      "Phase 2 (Weeks 7–12): Daily reconciliation live",
      "Phase 3 (Months 4–6): Full statewide channel rollout",
      "OEO Asaba office — on-ground implementation support",
    ], [tbl(["Phase", "Timeline", "Deliverable"], [
      ["Quick wins", "4–6 weeks", "First unremitted funds recovery report"],
      ["Go-live", "6 months", "Statewide IGR assurance programme"],
    ], [2200, 2200, 4360])]),
    ...slide(13, "Commercial Model — Option A (Recommended)", [
      "90-day pilot: ₦22M fixed (Back Audit + 2–3 revenue heads)",
      "Full deployment Year 1: ₦67M (₦55M impl + ₦12M SaaS)",
      "Success fee: 3.5% / 2.8% / 2.0% — only on lodged recovery",
      "Fees paid from recovered funds — minimal State risk",
      "Conservative net to State: ₦1.28B+ after all fees",
    ]),
    ...slide(14, "Why OEO Solutions", [
      "Founder: Eric Opute, ACA — 20+ years reconciliation & audit",
      "Ex-Wakanow Head of E-Payments; Ex-Heritage Bank payment auditor",
      "ReconFlow built from lived high-volume reconciliation experience",
      "Local offices: Asaba (Delta), Lagos, Port Harcourt",
    ]),
    ...slide(15, "LIVE DEMO — Test Run Today", [
      `Demo URL: ${DEMO_URL}/login`,
      "Login: admin@oeosolution.com",
      "We will demonstrate: upload → reconcile → anomalies → executive report",
      "Optional: Back Audit on sample IGR data during meeting",
    ], [img("reconciliation-process.jpg", MANUAL_IMG, 520, 300), cap("Figure: Live reconciliation engine")]),
    ...slide(16, "Request to the Permanent Secretary", [
      "Approve 90-day Back Audit pilot on priority revenue heads",
      "Designate Finance sponsor + provide sample collection/remittance files",
      "Schedule discovery workshop within 2 weeks",
      "Joint verification framework with Auditor-General for success fees",
    ]),
    ...slide(17, "Summary", [
      "Delta State collects billions — unremitted funds are recoverable",
      "ReconFlow provides confirmed IGR, not estimates",
      "Back Audit delivers quick wins within 4–6 weeks",
      "Performance-based fees align OEO with State outcomes",
      "OEO is ready to deploy — starting in Asaba today",
    ]),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 }, children: [new TextRun({ text: "Thank You", size: 36, bold: true, color: "1E3A5F" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120 }, children: [new TextRun({ text: "Eric Opute, ACA  |  OEO Solutions", size: 22 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "oeosolution@gmail.com  |  +234 803 668 5485", size: 20, color: "666666" })] }),
  ];
  return d;
}

// ─── EXECUTIVE BRIEF (narrative) ───
function executiveBrief() {
  const d = baseDoc("Perm Sec Executive Brief", "Executive Brief — Perm Sec Finance");
  const h1 = (t) => new Paragraph({ spacing: { before: 240, after: 140 }, children: [new TextRun({ text: t, size: 28, bold: true, color: "1E3A5F" })] });
  const p = (t) => new Paragraph({ spacing: { after: 140 }, children: [new TextRun({ text: t, size: 21 })] });
  d.sections[0].children = [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400, after: 200 }, children: [new TextRun({ text: "EXECUTIVE BRIEF", size: 32, bold: true, color: "1E3A5F" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [new TextRun({ text: `For the ${AUDIENCE}`, size: 22 })] }),
    h1("1. Purpose"),
    p(`This briefing introduces ReconFlow to ${STATE} leadership as the platform to assure Internally Generated Revenue (IGR), recover unremitted funds, and provide confirmed revenue reporting for EXCO and oversight bodies.`),
    h1("2. The Problem"),
    p(`${STATE} collects revenue through MDAs, local governments, Remita, banks, agents, and digital channels. A material portion is collected but not fully or timely lodged to designated IGR accounts. Manual reconciliation cannot scale. Leadership receives estimates — not confirmed figures.`),
    h1("3. The Solution"),
    p("ReconFlow ingests collection and remittance evidence, automates matching, identifies unremitted funds via Back Audit (up to 10 years), and produces executive dashboards showing Confirmed IGR, unrecovered exposure, and recovery identified — with full audit trail."),
    img("delta-igr-value-chain.jpg", IMG, 580, 300),
    cap("ReconFlow IGR assurance value chain"),
    h1("4. Scope"),
    p(SCOPE),
    p("ReconFlow is a reconciliation and recovery tool — not a criminal investigation platform. Anomalies are classified as reconciliation exceptions."),
    h1("5. Recovery & ROI (Conservative)"),
    tbl(["Metric", "Value"], [
      ["Unremitted funds identified", "₦1.6B – ₦2.4B (illustrative)"],
      ["Projected lodged recovery", "₦1.4B – ₦1.9B"],
      ["Year 1 fixed investment", "₦67M (or ₦22M pilot)"],
      ["Net to State after fees", "₦1.28B+ (conservative)"],
    ], [3600, 5760]),
    h1("6. Recommendation"),
    p("Approve a 90-day Back Audit pilot (₦22M) on 2–3 priority revenue heads. OEO will deliver first recovery findings within 4–6 weeks using existing data exports — no system replacement required."),
    h1("7. Live Demonstration"),
    p(`A live ReconFlow demonstration is available today at ${DEMO_URL}. OEO will walk through upload, reconciliation, anomaly review, and executive reporting.`),
    p("Prepared by: Eric Opute, ACA — OEO Solutions"),
  ];
  return d;
}

// ─── DEMO RUN GUIDE ───
function demoGuide() {
  const d = baseDoc("Demo Run Guide", "Live Demo Guide — Perm Sec Meeting");
  const h2 = (t) => new Paragraph({ spacing: { before: 180, after: 100 }, children: [new TextRun({ text: t, size: 24, bold: true, color: "0D9488" })] });
  const p = (t) => new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: t, size: 20 })] });
  const n = (t) => new Paragraph({ numbering: { reference: "n1", level: 0 }, spacing: { after: 80 }, children: [new TextRun({ text: t, size: 20 })] });
  d.sections[0].children = [
    new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: "ReconFlow Live Demo — Perm Sec Finance Meeting", size: 28, bold: true, color: "1E3A5F" })] }),
    p(`Date: June 2026  |  Audience: ${AUDIENCE}`),
    h2("A. Pre-Meeting Checklist (30 min before)"),
    n(`Confirm dev server running: cd C:\\Projects\\reconciliation-stable-saas → npm run dev`),
    n(`Verify access on laptop: ${DEMO_URL}/login`),
    n(`Verify access on phone/tablet (same Wi-Fi): ${DEMO_URL}/login`),
    n("Allow Node.js through Windows Firewall if prompted"),
    n("Close unnecessary apps; disable sleep mode"),
    n("Have sample CSV files ready in C:\\ReconFlow-TestData\\upload_ready\\"),
    h2("B. Login Credentials"),
    tbl(["Field", "Value"], [
      ["Demo URL", `${DEMO_URL}/login`],
      ["Email", "admin@oeosolution.com"],
      ["Password", "ReconFlow@2026"],
      ["Role", "Administrator (full access)"],
    ], [2800, 6560]),
    h2("C. Demo Script (15 minutes)"),
    n(`Open ${DEMO_URL}/login — show mobile-friendly login (centered, professional)`),
    n("Sign in → lands on Executive Intelligence (/executive)"),
    n("Show KPIs: match rate, leakage, confirmed position"),
    n("Navigate to Live Reconciliation (/reconciliation)"),
    n("Upload sample: Generic CSV — Internal side (bulk chunk 01)"),
    n("Upload sample: Generic CSV — Settlement side (settlement chunk 01)"),
    n("Click Run 2026 Reconciliation — show match rate toast"),
    n("Open Master Ledger — show matched vs unmatched rows"),
    n("Navigate to Anomalies — show reconciliation exceptions with ₦ variance"),
    n("Open Revenue Recovery & Back Audit tab — explain 10-year lookback"),
    n("Return to Executive — one-click PDF export for Perm Sec"),
    h2("D. Talking Points During Demo"),
    p('"Matched transactions = confirmed IGR. Unmatched = unremitted funds pending recovery."'),
    p('"Back Audit can find historical unremitted funds within 4–6 weeks of receiving your files."'),
    p('"Every action is logged — suitable for Auditor-General review."'),
    h2("E. Fallback If Network Fails"),
    n("Use localhost on laptop: http://localhost:3000/login"),
    n("Show pre-generated Sample Reports PDF from meeting pack"),
    n("Walk through Executive Presentation slides 9–10 (dashboard screenshots)"),
    h2("F. Files to Upload (Smoke Test)"),
    tbl(["File", "Path", "Side"], [
      ["Internal chunk 01", "C:\\ReconFlow-TestData\\upload_ready\\chunks_bulk\\MASTER_upload_bulk_chunk_01_of_10.csv", "Internal"],
      ["Settlement chunk 01", "C:\\ReconFlow-TestData\\upload_ready\\chunks_settlement\\MASTER_upload_settlement_chunk_01_of_07.csv", "Settlement"],
    ], [2200, 4560, 1600]),
    p("OEO Solutions  |  oeosolution@gmail.com  |  +234 803 668 5485"),
  ];
  return d;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const files = [
    ["Delta_PermSec_Executive_Presentation", presentation()],
    ["Delta_PermSec_Executive_Brief", executiveBrief()],
    ["Delta_PermSec_Live_Demo_Guide", demoGuide()],
  ];
  for (const [name, doc] of files) {
    const out = path.join(OUT_DIR, `${name}.docx`);
    const buf = await Packer.toBuffer(new Document(doc));
    fs.writeFileSync(out, buf);
    console.log("Created:", out);
  }
}

main().catch(console.error);
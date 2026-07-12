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
  Header,
  Footer,
  AlignmentType,
  LevelFormat,
  HeadingLevel,
  BorderStyle,
  WidthType,
  ShadingType,
  PageNumber,
  PageBreak,
} = require("docx");

const DELIVERABLES = path.join(__dirname, "..", "deliverables");
const DOCX_OUT = path.join(DELIVERABLES, "ReconFlow_Demo_Narration_Script.docx");
const TXT_OUT = path.join(DELIVERABLES, "ReconFlow_Demo_Teleprompter.txt");

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

function h1(t) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] });
}
function h2(t) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
}
function h3(t) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(t)] });
}
function p(t, opts = {}) {
  return new Paragraph({ spacing: { after: 160 }, ...opts, children: [new TextRun(t)] });
}
function action(t) {
  return new Paragraph({
    spacing: { before: 80, after: 200 },
    shading: { fill: "E8F4F8", type: ShadingType.CLEAR },
    children: [new TextRun({ text: `ACTION: ${t}`, bold: true, italics: true, color: "0D9488" })],
  });
}
function quote(t) {
  return new Paragraph({
    spacing: { after: 120 },
    indent: { left: 360 },
    children: [new TextRun({ text: t, italics: false })],
  });
}
function bullet(ref, t) {
  return new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 80 }, children: [new TextRun(t)] });
}
function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

const sections = [
  {
    title: "Opening — Landing & Sign In (~30 sec)",
    actions: ["Open login page → enter credentials → Sign In"],
    lines: [
      "Hello — thank you for taking a few minutes to see ReconFlow in action.",
      "ReconFlow is an AI-powered revenue assurance and reconciliation platform built for fintechs, banks, and payment operators. It helps teams match internal transaction records against settlement and bank statements, detect revenue leakage, and produce audit-ready reports — all in one place.",
      "Let me sign in and walk you through the platform from end to end.",
      "I'm now logged in as a workspace administrator. ReconFlow is invite-only and multi-tenant — each organisation gets its own isolated workspace.",
    ],
  },
  {
    title: "Section 1 — Executive Intelligence (~50 sec)",
    actions: ["Navigate to Executive Intelligence", "Set Analysis Period to 2026", "Click Export PDF"],
    lines: [
      "This is the Executive Intelligence dashboard — your command centre for reconciliation health.",
      "At a glance, you can see total records processed, reconciliation accuracy, potential revenue leakage in Naira, and an overall risk score. These KPIs update based on the analysis period you select here at the top.",
      "I'll set the date range to the current audit year — January through December 2026.",
      "Below that, you get trend charts showing monthly accuracy versus leakage, plus AI-generated insights on areas that need attention.",
      "When leadership needs a formal pack, one click exports a polished PDF executive report — ready for finance review or board circulation.",
      "That PDF is generated instantly from live reconciliation data.",
    ],
  },
  {
    title: "Section 2 — Upload Report Data (~70 sec)",
    actions: [
      "Live Reconciliation → Operations Platform",
      "Expand Report type → select POS Settlement Report",
      "Expand Ledger side → select Internal",
      "Choose CSV file → Upload & map → wait for toast",
    ],
    lines: [
      "Now let's look at how data enters the system. I'm on the Live Reconciliation page, under the Operations Platform tab.",
      "This is where reconciliation officers upload CSV files and map them into the master ledger.",
      "First, I choose the report type. ReconFlow supports multiple ingest formats — POS settlement, USSD logs, bank transfers, wallet statements, card transactions, fee benchmarks, chargebacks, and more. Options are grouped by phase, and each one shows a short description so users pick the right template.",
      "I'll select POS Settlement Report.",
      "Next, I choose the ledger side — whether this file represents our internal records or the settlement side from the bank or payment pool. I'll upload the internal ledger first — that's best practice before settlement files.",
      "Notice how the picker expands inline — the full list opens within the form, so nothing overlaps or gets cut off on screen.",
      "ReconFlow shows the expected columns for this report type — terminal ID, transaction ID, amount, fee, reference, and transaction date — so users know exactly what to prepare before uploading.",
      "I select my CSV file and click Upload and Map.",
      "The file is validated, columns are mapped automatically, duplicates are skipped, and rows are inserted into the master ledger. A success message confirms how many records were added.",
    ],
  },
  {
    title: "Section 3 — Bulk Uploads & History (~25 sec)",
    actions: ["Open Bulk Uploads → show history table → return to Live Reconciliation"],
    lines: [
      "The same upload panel is available on the Bulk Uploads page, with a full upload history table — file name, report type, status, date, and row count. This gives auditors a clear audit trail of every ingest run.",
    ],
  },
  {
    title: "Section 4 — Run Reconciliation (~40 sec)",
    actions: [
      "Operations Platform → Run 2026 Reconciliation",
      "Master Ledger tab → expand one source row",
    ],
    lines: [
      "Once internal and settlement data are uploaded, we run reconciliation.",
      "The engine matches records across both sides for the configured audit year — in this case, 2026 — and runs a fee assurance pass to flag commission variances.",
      "I'll click Run 2026 Reconciliation.",
      "Reconciliation complete — you can see the match rate immediately: how many transactions matched out of the total processed. Any exceptions are raised as anomalies for investigation.",
      "On the Master Ledger tab, every record lives in a single source of truth, broken down by source layer — internal, settlement, assurance, or exception. You can expand any layer and browse individual transactions.",
    ],
  },
  {
    title: "Section 5 — Anomalies & AI Investigation (~60 sec)",
    actions: [
      "Anomalies & Alerts → expand a row",
      "Resolve with AI → Save Investigation",
      "Optional: peek at AI Resolver (3 sec)",
    ],
    lines: [
      "Unmatched items, fee variances, and other exceptions appear here in the Anomaly queue.",
      "The dashboard shows total anomalies, how many are still open, high-severity items, and total financial variance — so the team knows where to focus first.",
      "I can filter by status, severity, type, or product. Let me open one item.",
      "For each exception, investigators can run AI-assisted analysis. ReconFlow sends the anomaly context to the AI engine and returns a suggested root cause and investigation notes.",
      "I'll click Resolve with AI.",
      "The analyst reviews the AI output, adds their own notes, and saves the investigation. That moves the item to Investigating status.",
      "A Finance Approver can then mark it as Resolved once the issue is confirmed and actioned.",
      "There's also a dedicated AI Resolver page for working through multiple open issues in one view.",
    ],
  },
  {
    title: "Section 6 — Back Audit (~25 sec)",
    actions: ["Revenue Recovery & Back Audit tab — show date fields"],
    lines: [
      "ReconFlow also supports back audit — retrospective analysis on closed periods to identify recoverable revenue.",
      "You set a start date, end date, and product filter, then run the back audit engine. Findings feed into executive reporting and the Control Gate audit reports.",
    ],
  },
  {
    title: "Section 7 — Reports & Exports (~35 sec)",
    actions: ["Reports & Exports → Export CSV", "Optional: /reports/products (5 sec)"],
    lines: [
      "The Reports section brings everything together for export.",
      "You get an executive summary with the same core KPIs, a monthly accuracy-versus-leakage chart, and product performance breakdowns.",
      "Finance teams can export reconciliation data as CSV for further analysis in Excel or Power BI.",
      "There's also a dedicated Product Reconciliation report and a Data Quality dashboard — showing completeness, duplication rates, and integrity metrics across the ledger.",
    ],
  },
  {
    title: "Section 8 — Control Gate & Governance (~45 sec)",
    actions: ["Control Gate → Reports tab → hover Generate report"],
    lines: [
      "Control Gate is ReconFlow's governance module. Reconciliation rules are not changed casually — auditors propose updates, and finance approvers must sign off before anything goes live.",
      "The Monitoring tab shows pending approvals, active rule count, and ingest automation status.",
      "In the Approval Workflow, approvers review the exact rule change, see a before-and-after diff, and either approve and publish or reject with notes.",
      "The Reports tab generates HTML audit reports — revenue recovery summary, product performance and leakage, back audit findings, net revenue recovery, and loss category analysis. These are suitable for compliance packs and internal audit.",
    ],
  },
  {
    title: "Section 9 — Settings & Administration (~40 sec)",
    actions: ["Settings → Users & Teams (hide real emails)"],
    lines: [
      "Administrators manage the workspace from Settings.",
      "The overview shows team size, pending invites, and active rules. From here you can configure the organisation, manage multiple workspaces, invite users, assign roles, set reconciliation tolerances and audit year, configure fee engine tiers, notifications, API ingest automation, integrations, and security policies.",
      "Inviting a new user is straightforward — enter their name and email, assign a role — Viewer, Auditor, Finance Approver, or Administrator — and share the invite link. New users complete onboarding through the Accept Invite page.",
    ],
  },
  {
    title: "Section 10 — API & Quick Access (~20 sec)",
    actions: ["Optional: API Documentation — brief scroll"],
    lines: [
      "For technical teams, API Documentation is built into the platform — covering CSV ingest, JSON ingest, scheduled automation, and webhook notifications when reconciliation completes.",
    ],
  },
  {
    title: "Closing (~25 sec)",
    actions: ["Return to Executive Intelligence → hold 3 sec → Stop OBS"],
    lines: [
      "So that's ReconFlow — end to end.",
      "Upload your data, run reconciliation, investigate exceptions with AI, approve rule changes through Control Gate, and export executive PDFs and CSV reports — all within a secure, multi-tenant workspace with full audit trail.",
      "Whether you're a reconciliation officer processing daily settlement files, a finance approver closing exceptions, or an executive monitoring revenue leakage — ReconFlow gives everyone the right view and the right controls.",
      "Thank you for watching. For a pilot or demo access, reach out to our team — we'd be happy to walk you through it live.",
    ],
  },
];

// Teleprompter text
let teleprompter = `RECONFLOW DEMO — TELEPROMPTER SCRIPT
OEO Solutions | OBS Recording | Target: 6–7 minutes
Speak at a calm pace. Pause 2 seconds at each [ACTION] before clicking.

================================================================================

`;
sections.forEach((sec, i) => {
  teleprompter += `\n--- ${sec.title} ---\n\n`;
  sec.actions.forEach((a) => {
    teleprompter += `[ACTION: ${a}]\n\n`;
  });
  sec.lines.forEach((line) => {
    teleprompter += `${line}\n\n`;
  });
  if (i < sections.length - 1) teleprompter += `\n================================================================================\n`;
});

teleprompter += `

================================================================================
WHATSAPP CAPTION (paste with video)
================================================================================

ReconFlow — AI Reconciliation Platform
Executive dashboards • CSV upload • Auto matching • AI anomaly investigation
PDF & CSV reports • Control Gate governance • Multi-tenant admin.
Built for fintech & bank reconciliation. Demo by OEO Solutions.

================================================================================
SHORT VERSION (~5 min) — SKIP THESE SECTIONS
================================================================================
• Section 6 — Back Audit
• Section 10 — API Documentation
• AI Resolver peek in Section 5

================================================================================
`;

fs.mkdirSync(DELIVERABLES, { recursive: true });
fs.writeFileSync(TXT_OUT, teleprompter, "utf8");

const docChildren = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: "ReconFlow", size: 52, bold: true, color: "1E3A5F" })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({ text: "Demo Video Narration Script", size: 36, bold: true })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
    children: [new TextRun({ text: "Word-for-word script for OBS recording | WhatsApp presentation", size: 22, color: "666666" })],
  }),
  p("Instructions: Read each paragraph aloud at a calm pace. Pause briefly at green ACTION lines before clicking. Total runtime: approximately 6–7 minutes."),
  h2("Recording Settings (OBS)"),
  bullet("bullets", "Resolution: 1280×720 or 1920×1080 | 30 fps | MP4 (H.264)"),
  bullet("bullets", "Source: Window Capture (browser only) | Zoom: 100–110%"),
  bullet("bullets", "Pre-load test data before recording for live match rates and anomalies"),
  new Paragraph({ spacing: { after: 200 } }),
  h2("Timing Cheat Sheet"),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [4200, 1600, 3560],
    rows: [
      new TableRow({
        children: ["Section", "Duration", "Cumulative"].map((h, i) =>
          new TableCell({
            borders,
            width: { size: [4200, 1600, 3560][i], type: WidthType.DXA },
            shading: { fill: "1E3A5F", type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 20 })] })],
          })
        ),
      }),
      ...[
        ["Opening", "0:30", "0:30"],
        ["Executive Intelligence", "0:50", "1:20"],
        ["Upload data", "1:10", "2:30"],
        ["Bulk history", "0:25", "2:55"],
        ["Reconciliation", "0:40", "3:35"],
        ["Anomalies & AI", "1:00", "4:35"],
        ["Back audit", "0:25", "5:00"],
        ["Reports", "0:35", "5:35"],
        ["Control Gate", "0:45", "6:20"],
        ["Settings", "0:40", "7:00"],
        ["API + Closing", "0:45", "~7:45"],
      ].map(
        (row, ri) =>
          new TableRow({
            children: row.map((cell, ci) =>
              new TableCell({
                borders,
                width: { size: [4200, 1600, 3560][ci], type: WidthType.DXA },
                shading: { fill: ri % 2 === 0 ? "F5F8FA" : "FFFFFF", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: cell, size: 20 })] })],
              })
            ),
          })
      ),
    ],
  }),
  pageBreak(),
];

sections.forEach((sec) => {
  docChildren.push(h1(sec.title));
  sec.actions.forEach((a) => docChildren.push(action(a)));
  sec.lines.forEach((line) => docChildren.push(quote(`"${line}"`)));
  docChildren.push(new Paragraph({ spacing: { after: 240 } }));
});

docChildren.push(
  pageBreak(),
  h1("WhatsApp Caption"),
  p("ReconFlow — AI Reconciliation Platform. Executive dashboards • CSV upload • Auto matching • AI anomaly investigation • PDF & CSV reports • Control Gate governance • Multi-tenant admin. Built for fintech & bank reconciliation. Demo by OEO Solutions."),
  h2("Short Version (~5 min)"),
  p("Skip: Back Audit (Section 6), API Documentation (Section 10), and the AI Resolver peek in Section 5.")
);

const doc = new Document({
  title: "ReconFlow Demo Narration Script",
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 30, bold: true, font: "Arial", color: "1E3A5F" },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0 },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: "0D9488" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "\u2022",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "0D9488", space: 1 } },
              children: [
                new TextRun({ text: "ReconFlow Demo Script", bold: true, color: "1E3A5F" }),
                new TextRun({ text: "  |  OBS / WhatsApp", color: "666666" }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "OEO Solutions  |  Page ", size: 18, color: "888888" }),
                new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "888888" }),
              ],
            }),
          ],
        }),
      },
      children: docChildren,
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(DOCX_OUT, buffer);
  console.log("Word doc:", DOCX_OUT);
  console.log("Teleprompter:", TXT_OUT);
});
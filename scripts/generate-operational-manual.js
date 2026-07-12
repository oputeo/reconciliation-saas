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
  PageOrientation,
} = require("docx");

const IMG_DIR = path.join(__dirname, "..", "deliverables", "manual-images");
const OUT_PATH = path.join(__dirname, "..", "deliverables", "ReconFlow_Operational_Manual.docx");

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const CONTENT_WIDTH = 9360;

function img(filename, w = 520, h = 340) {
  const p = path.join(IMG_DIR, filename);
  if (!fs.existsSync(p)) return new Paragraph({ children: [new TextRun({ text: `[Image: ${filename}]`, italics: true })] });
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 200 },
    children: [
      new ImageRun({
        type: "jpg",
        data: fs.readFileSync(p),
        transformation: { width: w, height: h },
        altText: { title: filename, description: filename, name: filename },
      }),
    ],
  });
}

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
}

function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
}

function h3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(text)] });
}

function p(text, opts = {}) {
  return new Paragraph({ spacing: { after: 120 }, ...opts, children: [new TextRun(text)] });
}

function bullet(ref, text) {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    spacing: { after: 80 },
    children: [new TextRun(text)],
  });
}

function numbered(ref, text) {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    spacing: { after: 80 },
    children: [new TextRun(text)],
  });
}

function caption(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
    children: [new TextRun({ text, italics: true, size: 20, color: "555555" })],
  });
}

function table(headers, rows, colWidths) {
  const total = colWidths.reduce((a, b) => a + b, 0);
  const headerRow = new TableRow({
    children: headers.map((h, i) =>
      new TableCell({
        borders,
        width: { size: colWidths[i], type: WidthType.DXA },
        shading: { fill: "1E3A5F", type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [
          new Paragraph({
            children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 20 })],
          }),
        ],
      })
    ),
  });
  const dataRows = rows.map(
    (row, ri) =>
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
  );
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...dataRows],
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

const doc = new Document({
  creator: "ReconFlow",
  title: "ReconFlow Operational Manual",
  description: "End-to-end user and operations guide for ReconFlow",
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: "1E3A5F" },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: "0D9488" },
        paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 1 },
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 24, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 180, after: 120 }, outlineLevel: 2 },
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
      {
        reference: "steps",
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: "%1.",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
      {
        reference: "steps2",
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: "%1.",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
      {
        reference: "steps3",
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: "%1.",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
      {
        reference: "steps4",
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: "%1.",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
      {
        reference: "steps5",
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: "%1.",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
      {
        reference: "steps6",
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: "%1.",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
      {
        reference: "steps7",
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: "%1.",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
      {
        reference: "steps8",
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: "%1.",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
      {
        reference: "faq",
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
                new TextRun({ text: "ReconFlow", bold: true, color: "1E3A5F" }),
                new TextRun({ text: "  |  Operational Manual", color: "666666" }),
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
                new TextRun({ text: "Confidential  |  Page ", size: 18, color: "888888" }),
                new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "888888" }),
              ],
            }),
          ],
        }),
      },
      children: [
        // COVER
        new Paragraph({ spacing: { before: 2400 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "ReconFlow", size: 72, bold: true, color: "1E3A5F" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [new TextRun({ text: "Revenue Assurance & Reconciliation Platform", size: 28, color: "0D9488" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 600 },
          children: [new TextRun({ text: "End-to-End Operational Manual", size: 44, bold: true })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 800 },
          children: [new TextRun({ text: "User Guide & Operations Handbook", size: 26, italics: true, color: "555555" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Version 1.0  |  June 2026", size: 22, color: "888888" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 1200 },
          children: [new TextRun({ text: "OEO Solutions", size: 24, bold: true })],
        }),

        pageBreak(),

        // TOC
        h1("Table of Contents"),
        new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" }),
        pageBreak(),

        // 1 INTRODUCTION
        h1("1. Introduction"),
        h2("1.1 What is ReconFlow?"),
        p(
          "ReconFlow is an enterprise revenue assurance and reconciliation platform designed for fintechs, banks, and payment operators. It automates the matching of internal transaction records against settlement and bank statements, detects anomalies and revenue leakage, and provides executive reporting with AI-assisted investigation tools."
        ),
        h2("1.2 Who Should Use This Manual?"),
        p("This guide is written for all ReconFlow users:"),
        bullet("bullets", "Viewers and executives who monitor dashboards and export reports"),
        bullet("bullets", "Auditors and reconciliation officers who upload data, run reconciliation, and investigate exceptions"),
        bullet("bullets", "Finance approvers who resolve anomalies and approve rule changes"),
        bullet("bullets", "Administrators who manage workspaces, invite users, and configure platform settings"),
        h2("1.3 Platform Access"),
        p(
          "ReconFlow is an invite-only platform. New users must receive an invitation from a workspace administrator or submit an access request from the login page. The application runs in your web browser at your organisation's ReconFlow URL (e.g. http://localhost:3000 during development, or your production domain when deployed)."
        ),

        pageBreak(),

        // 2 ROLES
        h1("2. User Roles & Permissions"),
        p(
          "Every user is assigned one of four roles within a workspace. Your role determines which menus, buttons, and actions are available."
        ),
        table(
          ["Role", "Rank", "Primary Responsibilities"],
          [
            ["Viewer", "1", "View dashboards, reports, and anomaly lists. Cannot upload data or change settings."],
            ["Auditor", "2", "Upload CSV files, run reconciliation, investigate anomalies, propose rule changes."],
            ["Finance Approver", "3", "All auditor capabilities plus: mark anomalies resolved, approve/reject rule changes."],
            ["Administrator", "4", "Full platform control: invite users, manage workspaces, security, direct rule publishing."],
          ],
          [2200, 1000, 6160]
        ),
        new Paragraph({ spacing: { after: 200 } }),
        h2("2.1 Permission Quick Reference"),
        table(
          ["Capability", "Viewer", "Auditor", "Approver", "Admin"],
          [
            ["View dashboards & reports", "Yes", "Yes", "Yes", "Yes"],
            ["Upload CSV / run reconciliation", "No", "Yes", "Yes", "Yes"],
            ["Save anomaly investigation", "No", "Yes", "Yes", "Yes"],
            ["Mark anomaly as Resolved", "No", "No", "Yes", "Yes"],
            ["Propose rule changes", "No", "Yes", "Yes", "Yes"],
            ["Approve rule changes (Control Gate)", "No", "No", "Yes", "Yes"],
            ["Invite users / manage workspaces", "No", "No", "No", "Yes"],
          ],
          [4000, 900, 900, 900, 2660]
        ),

        pageBreak(),

        // 3 GETTING STARTED
        h1("3. Getting Started"),
        h2("3.1 Signing In"),
        numbered("steps", "Open your browser and navigate to the ReconFlow login page (/login)."),
        numbered("steps", "Enter your work email address in the Email field."),
        numbered("steps", "Enter your password in the Password field."),
        numbered("steps", "Click Sign In."),
        numbered("steps", "On success, you are redirected to Executive Intelligence (/executive)."),
        p("If you have no workspace membership, you will see the Access Denied page. Contact your administrator."),
        h2("3.2 Requesting Access (New Users)"),
        numbered("steps2", "On the login page, click Don't have an account? Request Access."),
        numbered("steps2", "Fill in Full Name, Work Email, and optionally Phone Number."),
        numbered("steps2", "Click Submit Access Request."),
        numbered("steps2", "Your request is queued for administrator review in Role Management."),
        h2("3.3 Signing Out"),
        p("Click your name/avatar at the bottom of the left sidebar, then confirm sign out. You return to the login page."),

        pageBreak(),

        // 4 NAVIGATION
        h1("4. Navigation Overview"),
        p(
          "ReconFlow uses a persistent left sidebar for navigation. On mobile devices, a bottom navigation bar provides quick access to key areas."
        ),
        img("navigation-map.jpg", 540, 360),
        caption("Figure 1: ReconFlow navigation map showing main and quick-access menu items"),
        h2("4.1 Primary Navigation"),
        table(
          ["Menu Item", "Route", "Description"],
          [
            ["Executive Intelligence", "/executive", "KPI dashboards, trends, AI insights, PDF export"],
            ["Live Reconciliation", "/reconciliation", "Upload panel, run reconciliation, master ledger, back audit"],
            ["Anomalies & Alerts", "/anomalies", "Exception queue, investigation, AI resolution"],
            ["Bulk Uploads", "/uploads", "CSV upload and upload history"],
            ["Reports & Exports", "/reports", "Executive summary, CSV export, product charts"],
          ],
          [2800, 1800, 4760]
        ),
        new Paragraph({ spacing: { after: 200 } }),
        h2("4.2 Quick Access"),
        table(
          ["Menu Item", "Route", "Description"],
          [
            ["Forecasting", "/executive?tab=forecast", "Revenue forecast charts"],
            ["Product Audit", "/executive?tab=products", "Product-level revenue breakdown"],
            ["Back Audit", "/executive?tab=back-audit", "Historical period recovery analysis"],
            ["Control Gate", "/control-gate", "Rule approvals, governance, audit reports"],
            ["AI Resolver", "/resolver", "AI-powered issue resolution hub"],
            ["Settings", "/settings", "Workspace configuration"],
            ["Role Management (Admin)", "/admin/roles", "User invites and access requests"],
          ],
          [2800, 2400, 4160]
        ),

        pageBreak(),

        // 5 DAILY WORKFLOW
        h1("5. Daily Operations Workflow"),
        p(
          "The standard daily reconciliation cycle follows six steps. Different roles participate at different stages."
        ),
        img("daily-workflow.jpg", 540, 300),
        caption("Figure 2: End-to-end daily operations workflow by role"),
        h2("5.1 Recommended Daily Schedule"),
        table(
          ["Time", "Activity", "Role", "Location"],
          [
            ["Morning", "Upload overnight settlement & internal files", "Auditor", "Bulk Uploads or Live Reconciliation"],
            ["Morning", "Run reconciliation for current audit year", "Auditor", "Live Reconciliation → Operations Platform"],
            ["Midday", "Review and investigate open anomalies", "Auditor", "Anomalies & Alerts"],
            ["Afternoon", "Approve resolutions and rule changes", "Finance Approver", "Anomalies / Control Gate"],
            ["End of day", "Export executive report and CSV", "Viewer / Executive", "Executive Intelligence / Reports"],
          ],
          [1400, 3600, 1800, 2560]
        ),

        pageBreak(),

        // 6 ONBOARDING
        h1("6. User Onboarding"),
        img("onboarding-flow.jpg", 520, 380),
        caption("Figure 3: User onboarding flow — invite path and access request path"),
        h2("6.1 Inviting a New User (Administrator)"),
        p("Path A — Settings → Users & Teams (/settings/users):"),
        numbered("steps3", "Enter the new user's Full Name and Email."),
        numbered("steps3", "Select a Role: Viewer, Auditor, Finance Approver, or Administrator."),
        numbered("steps3", "Click Invite. The signup link is copied to your clipboard."),
        numbered("steps3", "Share the link with the user: /accept-invite?email={their-email}"),
        numbered("steps3", "Monitor Pending Invitations — use Link to re-copy or Cancel to revoke."),
        p("Path B — Sidebar → Role Management (/admin/roles): extended invite, resend, and access request review."),
        h2("6.2 Accepting an Invitation (New User)"),
        numbered("steps4", "Open the invite link sent by your administrator."),
        numbered("steps4", "Confirm the Invited as {role} badge displayed on screen."),
        numbered("steps4", "Enter your Full Name and Create Password (minimum 6 characters)."),
        numbered("steps4", "Click Create Account & Join ReconFlow."),
        numbered("steps4", "Return to the login page and sign in with your new credentials."),
        h2("6.3 Managing Team Roles"),
        p("Administrators can change an active member's role from the dropdown in the Active Team table on Settings → Users & Teams."),

        pageBreak(),

        // 7 UPLOAD
        h1("7. Uploading Transaction Data"),
        img("upload-screen-guide.jpg", 540, 360),
        caption("Figure 4: Bulk Upload screen — labelled UI guide"),
        h2("7.1 Upload Steps"),
        numbered("steps5", "Navigate to Bulk Uploads (/uploads) or Live Reconciliation → Operations Platform."),
        numbered("steps5", "Select Report Type from the dropdown (e.g. POS Settlement Report, Bank Transfer)."),
        numbered("steps5", "Select Ledger Side: Internal (your records), Settlement (bank/pool), Assurance (fee benchmark), or Exception (chargebacks). Some report types lock the ledger side automatically."),
        numbered("steps5", "Review the Expected Columns panel for your selected report type."),
        numbered("steps5", "Click Choose CSV file and select your .csv file (maximum 50 MB)."),
        numbered("steps5", "Click Upload & map. A success toast shows the number of rows inserted."),
        numbered("steps5", "Verify the entry in Upload History (File, Report, Status, Date, Rows)."),
        h2("7.2 File Requirements"),
        bullet("bullets", "File format: .csv only"),
        bullet("bullets", "Maximum file size: 50 MB"),
        bullet("bullets", "Duplicates (same transaction_id + transaction_date) are automatically skipped"),
        bullet("bullets", "Upload internal ledger files before settlement files for best matching results"),
        h2("7.3 Report Types & Expected Columns"),
        table(
          ["Report Type", "Ledger Side(s)", "Key Columns"],
          [
            ["Generic CSV", "Internal, Settlement", "amount, reference, product_type, transaction_date, fee"],
            ["POS Settlement Report", "Internal, Settlement", "terminal_id, transaction_id, amount, fee, reference, transaction_date"],
            ["USSD Transaction Log", "Internal, Settlement", "session_id, amount, reference, transaction_date, status"],
            ["Bank Transfer / Collections", "Internal, Settlement", "transfer_ref, amount, destination_account, bank_code, transaction_date"],
            ["Wallet Statement", "Internal, Settlement", "wallet_id, transaction_type, amount, transaction_date"],
            ["Card Transaction Report", "Internal, Settlement", "rrn, acquirer_ref, amount, transaction_date"],
            ["Fee & Commission Breakdown", "Assurance (locked)", "product_type, gross_amount, fee, net_amount, reference"],
            ["Chargeback & Reversal Report", "Exception (locked)", "original_txn_id, chargeback_amount, reason, transaction_date"],
            ["Agent Terminal Report", "Internal, Settlement", "agent_id, terminal_id, amount, transaction_date, reference"],
            ["QR Payment Report", "Internal, Settlement", "qr_code, amount, reference, transaction_date"],
            ["Bulk Payout Report", "Internal, Settlement", "payout_id, beneficiary_account, amount, status, transaction_date"],
          ],
          [2600, 2000, 4760]
        ),
        h2("7.4 Bulk Upload Best Practice"),
        p(
          "For large datasets, split files into chunks (e.g. 4,000 rows per file) and upload in order: internal ledger chunks first, then settlement chunks. After all uploads complete, proceed to reconciliation."
        ),

        pageBreak(),

        // 8 RECONCILIATION
        h1("8. Running Reconciliation"),
        img("reconciliation-process.jpg", 540, 340),
        caption("Figure 5: How ReconFlow matches internal and settlement records"),
        h2("8.1 Prerequisites"),
        bullet("bullets", "At least one internal ledger upload and one settlement upload for the reconciliation period"),
        bullet("bullets", "Auditor, Finance Approver, or Administrator role"),
        h2("8.2 Run Reconciliation"),
        numbered("steps6", "Go to Live Reconciliation (/reconciliation)."),
        numbered("steps6", "Select the Operations Platform tab."),
        numbered("steps6", "Review the audit year label (configured in Settings → Reconciliation)."),
        numbered("steps6", "Click Run {year} Reconciliation."),
        numbered("steps6", "Wait for the completion toast: Reconciliation complete: X/Y matched (Z%)."),
        numbered("steps6", "Switch to the Master Ledger tab to review record counts by source."),
        numbered("steps6", "Go to Anomalies & Alerts to review any new exceptions."),
        h2("8.3 Master Ledger Tab"),
        p(
          "The Master Ledger shows total records by source (internal, settlement, assurance, exception). Expand rows to browse individual transactions. Use this view to confirm uploads landed correctly before and after reconciliation."
        ),
        h2("8.4 Back Audit"),
        numbered("steps7", "Go to Live Reconciliation → Revenue Recovery & Back Audit tab (or Executive → Back Audit)."),
        numbered("steps7", "Set Start Date, End Date, and Product Type filter."),
        numbered("steps7", "Click Run Back Audit."),
        numbered("steps7", "Review recovery findings for the selected closed period."),

        pageBreak(),

        // 9 ANOMALIES
        h1("9. Managing Anomalies & Exceptions"),
        h2("9.1 Anomaly Dashboard"),
        p("The Anomalies & Alerts page (/anomalies) displays four KPI cards:"),
        bullet("bullets", "Total Anomalies — all records in the queue"),
        bullet("bullets", "Open — unresolved items requiring attention"),
        bullet("bullets", "High Severity — critical revenue risk items"),
        bullet("bullets", "Total Variance — aggregate financial exposure in Naira"),
        h2("9.2 Filtering & Search"),
        p("Use the toolbar filters: search box, Status (Open / Investigating / Resolved), Severity, Type, and Product."),
        h2("9.3 Investigating an Anomaly"),
        numbered("steps8", "Click a row to expand the Investigation & AI Resolution panel."),
        numbered("steps8", "Click Resolve with AI to generate an AI-assisted root cause analysis."),
        numbered("steps8", "Enter Root Cause and Investigation Notes based on your findings."),
        numbered("steps8", "Click Save Investigation — status changes to Investigating."),
        numbered("steps8", "Finance Approver or Admin: click Mark as Resolved and confirm."),
        h2("9.4 AI Resolver"),
        p(
          "Alternatively, use AI Resolver (/resolver) for a consolidated list of open issues. Filter by All Issues, Anomalies, or Reconciliation, then Resolve with AI on individual items."
        ),

        pageBreak(),

        // 10 REPORTS
        h1("10. Reports & Exports"),
        h2("10.1 Executive PDF Report"),
        numbered("steps", "Go to Executive Intelligence (/executive)."),
        numbered("steps", "Set the Analysis Period using the start and end date pickers."),
        numbered("steps", "Click Export PDF."),
        numbered("steps", "The file downloads as ReconFlow_Executive_Report_{date}.pdf."),
        h2("10.2 CSV Export"),
        p("Go to Reports & Exports (/reports) and click Export CSV for tabular reconciliation data."),
        h2("10.3 Product Metrics"),
        p("Navigate to /reports/products for product-level performance tables and charts. Click Export to download."),
        h2("10.4 Data Quality Report"),
        p("Navigate to /reports/quality for completeness, duplication, and data integrity metrics."),
        h2("10.5 Control Gate Audit Reports"),
        p("In Control Gate → Reports tab, click Generate report on any of:"),
        bullet("bullets", "Revenue Recovery Summary"),
        bullet("bullets", "Product Performance & Leakage"),
        bullet("bullets", "Back Audit Findings"),
        bullet("bullets", "Net Revenue Recovery"),
        bullet("bullets", "Loss Category Analysis"),
        p("Each report opens as an HTML document in a new browser window, suitable for printing or saving."),

        pageBreak(),

        // 11 CONTROL GATE
        h1("11. Control Gate & Rule Governance"),
        p(
          "Control Gate (/control-gate) is the governance hub for reconciliation rule changes. Changes proposed by auditors require approver sign-off before taking effect."
        ),
        h2("11.1 Tabs"),
        table(
          ["Tab", "Purpose"],
          [
            ["Monitoring (Overview)", "KPI cards, pending approvals count, ingest monitoring"],
            ["Approval Workflow", "Review and approve/reject pending rule changes"],
            ["Active Rules", "View currently published reconciliation rules"],
            ["Reports", "Generate governance and audit HTML reports"],
          ],
          [2800, 6560]
        ),
        h2("11.2 Rule Change Workflow"),
        numbered("steps2", "Auditor edits a rule in Settings → Rules and clicks Save (submitted for approval)."),
        numbered("steps2", "Approver opens Control Gate → Approval Workflow."),
        numbered("steps2", "Select the pending change and review the diff table."),
        numbered("steps2", "Click Approve & publish to activate, or Reject (notes required)."),
        numbered("steps2", "Administrators may publish rules directly without the approval queue."),
        h2("11.3 Executive Intelligence Tabs"),
        p(
          "Executive Intelligence consolidates Overview, Revenue Forecast, Product Audit, Back Audit, and Control Gate in one hub. Use the tab buttons at the top and the Analysis Period filter for date-scoped views."
        ),

        pageBreak(),

        // 12 SETTINGS
        h1("12. Settings & Administration"),
        h2("12.1 Settings Overview"),
        p("Settings (/settings) shows workspace stats and quick-action links filtered by your role."),
        h2("12.2 Settings Sections"),
        table(
          ["Section", "Route", "Min Role", "Purpose"],
          [
            ["Overview", "/settings", "Viewer", "Dashboard and quick links"],
            ["Organization", "/settings/organization", "Admin", "Company name, plan, timezone"],
            ["Workspaces", "/settings/tenants", "Admin", "Create and switch workspaces"],
            ["Users & Teams", "/settings/users", "Admin", "Invite users, manage roles"],
            ["Reconciliation", "/settings/reconciliation", "Auditor", "Audit year, tolerances, auto-resolve"],
            ["Fee Engine", "/settings/fees", "Approver", "Fee tier configuration"],
            ["Notifications", "/settings/notifications", "Auditor", "Email alerts, daily digest, thresholds"],
            ["Integrations", "/settings/integrations", "Admin", "Power BI, webhook URL"],
            ["Ingest & Automation", "/settings/ingest", "Auditor", "API keys, scheduled ingest"],
            ["Security", "/settings/security", "Admin", "Session timeout, IP allowlist"],
            ["Rules", "/settings/rules", "Auditor", "Reconciliation rule engine"],
          ],
          [2200, 2800, 1200, 3160]
        ),
        h2("12.3 Administrator Playbook"),
        numbered("steps3", "Register workspace — Settings → Workspaces → New workspace."),
        numbered("steps3", "Update organisation details — Settings → Organization → Save."),
        numbered("steps3", "Invite team members — Settings → Users & Teams → Invite (copy link)."),
        numbered("steps3", "Assign roles — change role dropdown in Active Team table."),
        numbered("steps3", "Configure reconciliation — Settings → Reconciliation (audit year, tolerances)."),
        numbered("steps3", "Set up ingest automation — Settings → Ingest & Automation."),
        numbered("steps3", "Configure notifications and integrations."),
        numbered("steps3", "Review security settings before production go-live."),

        pageBreak(),

        // 13 TROUBLESHOOTING
        h1("13. Troubleshooting & FAQ"),
        h2("13.1 Common Issues"),
        table(
          ["Problem", "Likely Cause", "Resolution"],
          [
            ["Access Denied after sign-in", "No workspace membership", "Contact admin to invite you or approve access request"],
            ["Invite link does not load", "Wrong SITE_URL in environment", "Admin: ensure NEXT_PUBLIC_SITE_URL matches running app URL"],
            ["Upload shows 0 rows inserted", "Duplicate transactions or wrong format", "Check Expected Columns panel; verify CSV headers match"],
            ["Reconciliation shows 0% match", "Missing settlement upload", "Upload settlement ledger files for the same period"],
            ["Cannot mark anomaly resolved", "Insufficient role", "Requires Finance Approver or Administrator"],
            ["Rule change not active", "Pending approval", "Approver must publish in Control Gate"],
            ["Export PDF is empty", "No data for selected period", "Adjust Analysis Period dates to include uploaded data"],
          ],
          [2800, 3000, 3560]
        ),
        h2("13.2 Frequently Asked Questions"),
        p("Q: Can I upload Excel (.xlsx) files?"),
        p("A: No. Only .csv files are supported. Export your spreadsheet to CSV before uploading."),
        p("Q: What is the recommended upload order?"),
        p("A: Upload internal ledger files first, then settlement files. For bulk test data, upload all chunks in chunks_bulk before running reconciliation."),
        p("Q: How do I switch workspaces?"),
        p("A: Use the workspace dropdown in the Settings header, or the admin Workspace link in the sidebar."),
        p("Q: Where can I find API documentation?"),
        p("A: Open API Documentation from the sidebar Quick Access section (/api-docs)."),

        pageBreak(),

        // APPENDIX
        h1("Appendix A: Glossary"),
        table(
          ["Term", "Definition"],
          [
            ["Master Ledger", "Central store of all uploaded transactions across all sources"],
            ["Internal Ledger", "Your organisation's transaction records (POS, USSD, wallet, etc.)"],
            ["Settlement Ledger", "Bank or payment pool statements confirming settled funds"],
            ["Anomaly", "A reconciliation exception — unmatched, duplicate, or fee variance record"],
            ["Control Gate", "Governance module for approving reconciliation rule changes"],
            ["Back Audit", "Retrospective analysis of closed periods for recoverable revenue"],
            ["Assurance", "Fee benchmark data used to detect fee leakage"],
            ["Tenant / Workspace", "Isolated organisational unit within the multi-tenant platform"],
          ],
          [2400, 6960]
        ),
        new Paragraph({ spacing: { after: 300 } }),
        h1("Appendix B: Support & Document Info"),
        p("Document: ReconFlow Operational Manual v1.0"),
        p("Generated: June 2026"),
        p("Application: ReconFlow — reconciliation-stable-saas"),
        p("For technical support, contact your workspace administrator or OEO Solutions support team."),
        p("This manual reflects the application as of June 2026. Menu labels and workflows may be updated in future releases."),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, buffer);
  console.log("Manual written to:", OUT_PATH);
});
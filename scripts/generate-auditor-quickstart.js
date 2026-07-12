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
  PageOrientation,
} = require("docx");

const OUT_PATH = path.join(__dirname, "..", "deliverables", "ReconFlow_Auditor_Quick_Start.docx");

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

function cell(text, width, opts = {}) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: opts.fill || "FFFFFF", type: ShadingType.CLEAR },
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    verticalAlign: opts.vAlign,
    children: [
      new Paragraph({
        alignment: opts.align,
        children: [
          new TextRun({
            text,
            bold: opts.bold,
            size: opts.size || 18,
            color: opts.color,
          }),
        ],
      }),
    ],
  });
}

function stepCell(num, title, detail, width) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: "F5F8FA", type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [
      new Paragraph({
        children: [
          new TextRun({ text: `${num}. `, bold: true, size: 20, color: "0D9488" }),
          new TextRun({ text: title, bold: true, size: 20, color: "1E3A5F" }),
        ],
      }),
      new Paragraph({
        spacing: { before: 60 },
        children: [new TextRun({ text: detail, size: 18, color: "333333" })],
      }),
    ],
  });
}

const doc = new Document({
  title: "ReconFlow Auditor Quick Start",
  styles: {
    default: { document: { run: { font: "Arial", size: 20 } } },
  },
  numbering: {
    config: [
      {
        reference: "tips",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "\u2022",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 360, hanging: 240 } } },
          },
        ],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: {
            width: 15840,
            height: 12240,
            orientation: PageOrientation.LANDSCAPE,
          },
          margin: { top: 720, right: 900, bottom: 720, left: 900 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "0D9488", space: 1 } },
              children: [
                new TextRun({ text: "ReconFlow", bold: true, size: 28, color: "1E3A5F" }),
                new TextRun({ text: "  |  Auditor Quick-Start Card", size: 22, color: "666666" }),
                new TextRun({ text: "\tJune 2026", size: 18, color: "888888" }),
              ],
              tabStops: [{ type: "right", position: 14800 }],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "OEO Solutions  |  reconciliation-stable-saas  |  Role: Auditor+", size: 16, color: "888888" }),
                new TextRun({ text: "\tPage ", size: 16, color: "888888" }),
                new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "888888" }),
              ],
              tabStops: [{ type: "right", position: 14800 }],
            }),
          ],
        }),
      },
      children: [
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: "Your 15-minute daily checklist — upload, reconcile, investigate.",
              size: 22,
              italics: true,
              color: "555555",
            }),
          ],
        }),

        // 5-step workflow row
        new Table({
          width: { size: 14040, type: WidthType.DXA },
          columnWidths: [2808, 2808, 2808, 2808, 2808],
          rows: [
            new TableRow({
              children: [
                stepCell(1, "Sign In", "Go to /login → enter email & password → Sign In → lands on Executive Intelligence.", 2808),
                stepCell(2, "Upload CSV", "Bulk Uploads → pick Report Type & Ledger Side → Choose .csv (max 50 MB) → Upload & map. Upload internal files before settlement.", 2808),
                stepCell(3, "Run Reconciliation", "Live Reconciliation → Operations Platform → Run {year} Reconciliation. Wait for match % toast.", 2808),
                stepCell(4, "Review Anomalies", "Anomalies & Alerts → filter Open / High Severity → expand row → Resolve with AI → enter notes → Save Investigation.", 2808),
                stepCell(5, "Export Report", "Reports & Exports → Export CSV. Or Executive Intelligence → set Analysis Period → Export PDF.", 2808),
              ],
            }),
          ],
        }),

        new Paragraph({ spacing: { before: 160, after: 80 } }),

        // Two-column reference tables
        new Table({
          width: { size: 14040, type: WidthType.DXA },
          columnWidths: [7020, 7020],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders,
                  width: { size: 7020, type: WidthType.DXA },
                  margins: { top: 0, bottom: 0, left: 0, right: 80 },
                  children: [
                    new Paragraph({
                      spacing: { after: 80 },
                      children: [new TextRun({ text: "Upload — Report Types (key columns)", bold: true, size: 20, color: "1E3A5F" })],
                    }),
                    new Table({
                      width: { size: 6940, type: WidthType.DXA },
                      columnWidths: [2200, 2200, 2540],
                      rows: [
                        new TableRow({
                          children: [
                            cell("Report Type", 2200, { bold: true, fill: "1E3A5F", color: "FFFFFF", size: 16 }),
                            cell("Ledger Side", 2200, { bold: true, fill: "1E3A5F", color: "FFFFFF", size: 16 }),
                            cell("Required Columns", 2540, { bold: true, fill: "1E3A5F", color: "FFFFFF", size: 16 }),
                          ],
                        }),
                        new TableRow({
                          children: [
                            cell("POS Settlement", 2200, { size: 16 }),
                            cell("Internal / Settlement", 2200, { size: 16 }),
                            cell("terminal_id, txn_id, amount, fee, date", 2540, { size: 16 }),
                          ],
                        }),
                        new TableRow({
                          children: [
                            cell("Bank Transfer", 2200, { size: 16 }),
                            cell("Internal / Settlement", 2200, { size: 16 }),
                            cell("transfer_ref, amount, bank_code, date", 2540, { size: 16 }),
                          ],
                        }),
                        new TableRow({
                          children: [
                            cell("USSD Transaction", 2200, { size: 16 }),
                            cell("Internal / Settlement", 2200, { size: 16 }),
                            cell("session_id, amount, reference, date", 2540, { size: 16 }),
                          ],
                        }),
                        new TableRow({
                          children: [
                            cell("Wallet Statement", 2200, { size: 16 }),
                            cell("Internal / Settlement", 2200, { size: 16 }),
                            cell("wallet_id, amount, txn_type, date", 2540, { size: 16 }),
                          ],
                        }),
                        new TableRow({
                          children: [
                            cell("Fee & Commission", 2200, { size: 16 }),
                            cell("Assurance", 2200, { size: 16 }),
                            cell("product_type, gross, fee, net", 2540, { size: 16 }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  borders: { top: border, bottom: border, right: border },
                  width: { size: 7020, type: WidthType.DXA },
                  margins: { top: 0, bottom: 0, left: 80, right: 0 },
                  children: [
                    new Paragraph({
                      spacing: { after: 80 },
                      children: [new TextRun({ text: "Navigation & Shortcuts", bold: true, size: 20, color: "1E3A5F" })],
                    }),
                    new Table({
                      width: { size: 6940, type: WidthType.DXA },
                      columnWidths: [2400, 4540],
                      rows: [
                        new TableRow({
                          children: [
                            cell("Bulk Uploads", 2400, { bold: true, size: 16 }),
                            cell("/uploads — CSV upload + history", 4540, { size: 16 }),
                          ],
                        }),
                        new TableRow({
                          children: [
                            cell("Live Reconciliation", 2400, { bold: true, size: 16 }),
                            cell("/reconciliation — run match engine", 4540, { size: 16 }),
                          ],
                        }),
                        new TableRow({
                          children: [
                            cell("Anomalies", 2400, { bold: true, size: 16 }),
                            cell("/anomalies — exception queue", 4540, { size: 16 }),
                          ],
                        }),
                        new TableRow({
                          children: [
                            cell("AI Resolver", 2400, { bold: true, size: 16 }),
                            cell("/resolver — bulk AI investigation", 4540, { size: 16 }),
                          ],
                        }),
                        new TableRow({
                          children: [
                            cell("Settings → Rules", 2400, { bold: true, size: 16 }),
                            cell("/settings/rules — propose rule changes", 4540, { size: 16 }),
                          ],
                        }),
                        new TableRow({
                          children: [
                            cell("Control Gate", 2400, { bold: true, size: 16 }),
                            cell("/control-gate — track rule approvals", 4540, { size: 16 }),
                          ],
                        }),
                      ],
                    }),
                    new Paragraph({ spacing: { before: 120, after: 60 } }),
                    new Paragraph({
                      children: [new TextRun({ text: "Quick Tips", bold: true, size: 20, color: "1E3A5F" })],
                    }),
                    new Paragraph({
                      numbering: { reference: "tips", level: 0 },
                      children: [new TextRun({ text: "Upload order: internal ledger first, then settlement.", size: 17 })],
                    }),
                    new Paragraph({
                      numbering: { reference: "tips", level: 0 },
                      children: [new TextRun({ text: "Duplicates (same txn_id + date) are skipped automatically.", size: 17 })],
                    }),
                    new Paragraph({
                      numbering: { reference: "tips", level: 0 },
                      children: [new TextRun({ text: "Mark as Resolved requires Finance Approver — you can Save Investigation.", size: 17 })],
                    }),
                    new Paragraph({
                      numbering: { reference: "tips", level: 0 },
                      children: [new TextRun({ text: "Rule edits you save go to Control Gate for approver sign-off.", size: 17 })],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),

        new Paragraph({ spacing: { before: 140, after: 60 } }),

        // Troubleshooting strip
        new Table({
          width: { size: 14040, type: WidthType.DXA },
          columnWidths: [3200, 4000, 6840],
          rows: [
            new TableRow({
              children: [
                cell("Problem", 3200, { bold: true, fill: "1E3A5F", color: "FFFFFF", size: 17 }),
                cell("Likely Cause", 4000, { bold: true, fill: "1E3A5F", color: "FFFFFF", size: 17 }),
                cell("Fix", 6840, { bold: true, fill: "1E3A5F", color: "FFFFFF", size: 17 }),
              ],
            }),
            new TableRow({
              children: [
                cell("0 rows inserted", 3200, { size: 16 }),
                cell("Wrong columns or duplicates", 4000, { size: 16 }),
                cell("Check Expected Columns panel; verify CSV headers match report type.", 6840, { size: 16 }),
              ],
            }),
            new TableRow({
              children: [
                cell("0% match rate", 3200, { size: 16 }),
                cell("Missing settlement upload", 4000, { size: 16 }),
                cell("Upload settlement files for the same date range, then re-run.", 6840, { size: 16 }),
              ],
            }),
            new TableRow({
              children: [
                cell("Can't resolve anomaly", 3200, { size: 16 }),
                cell("Approver role required", 4000, { size: 16 }),
                cell("Save Investigation; ask Finance Approver to Mark as Resolved.", 6840, { size: 16 }),
              ],
            }),
          ],
        }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, buffer);
  console.log("Quick-start card written to:", OUT_PATH);
});
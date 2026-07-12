const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel, BorderStyle,
  WidthType, ShadingType, PageNumber,
} = require("docx");

const ORG = "Wakanow.com";
const ORG_SHORT = "Wakanow";
const OUT = path.join(__dirname, "..", "deliverables", "ReconFlow_Wakanow_CFO_Executive_Summary.docx");
const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

function h2(t) { return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] }); }
function p(t, o = {}) { return new Paragraph({ spacing: { after: o.after ?? 100 }, ...o, children: [new TextRun(t)] }); }
function tbl(headers, rows, widths) {
  const total = widths.reduce((a, c) => a + c, 0);
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({ children: headers.map((h, i) => new TableCell({
        borders, width: { size: widths[i], type: WidthType.DXA },
        shading: { fill: "1E3A5F", type: ShadingType.CLEAR },
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 18 })] })],
      })) }),
      ...rows.map((row, ri) => new TableRow({ children: row.map((c, ci) => new TableCell({
        borders, width: { size: widths[ci], type: WidthType.DXA },
        shading: { fill: ri % 2 ? "FFFFFF" : "F5F8FA", type: ShadingType.CLEAR },
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: [new Paragraph({ children: [new TextRun({ text: c, size: 18 })] })],
      })) })),
    ],
  });
}

const doc = new Document({
  title: `CFO Executive Summary — ReconFlow for ${ORG_SHORT}`,
  styles: {
    default: { document: { run: { font: "Arial", size: 20 } } },
    paragraphStyles: [
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 22, bold: true, font: "Arial", color: "1E3A5F" }, paragraph: { spacing: { before: 140, after: 80 }, outlineLevel: 1 } },
    ],
  },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, right: 1080, bottom: 900, left: 1080 } } },
    headers: { default: new Header({ children: [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "0D9488", space: 1 } }, children: [new TextRun({ text: "OEO Solutions", bold: true, size: 18, color: "1E3A5F" }), new TextRun({ text: "  |  Executive Summary for the CFO", size: 18, color: "666666" })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Confidential  |  June 2026  |  oeosolution@gmail.com  |  Page ", size: 14, color: "888888" }), new TextRun({ children: [PageNumber.CURRENT], size: 14, color: "888888" })] })] }) },
    children: [
      new Paragraph({ spacing: { before: 120, after: 80 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "EXECUTIVE SUMMARY", size: 28, bold: true, color: "1E3A5F" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: "ReconFlow — Matched Transactions = Confirmed Revenue", size: 22, bold: true })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 140 }, children: [new TextRun({ text: `For: ${ORG} (${ORG_SHORT})`, size: 20, color: "555555" })] }),

      p(`${ORG_SHORT}'s booking system reports gross sales. Your gateway reports settlements. Your suppliers report debits. None of these alone is confirmed revenue. ReconFlow reconciles all three — and only matched transactions translate into sales you can recognise with confidence.`),

      h2("The CFO Problem"),
      p(`Today, confirmed revenue is reconstructed manually at month-end from booking exports, gateway files, and bank statements. Unmatched items — orphan payments, unsettled bookings, refund gaps — are discovered late, inflating reported sales or hiding leakage.`, { after: 80 }),

      h2("The ReconFlow Principle"),
      tbl(
        ["Reconciliation Status", "Revenue Meaning"],
        [
          ["Matched (high confidence)", "Confirmed sale — counts toward recognised revenue"],
          ["Flagged / unmatched", "Unconfirmed exposure — not revenue until resolved"],
          ["Refund matched", "Reduces confirmed revenue in period"],
          ["Margin assured", "Confirmed sale minus validated supplier cost and fees"],
        ],
        [4200, 5160]
      ),

      new Paragraph({ spacing: { before: 100 } }),
      h2("What the CFO Gets"),
      tbl(
        ["Dashboard Metric", "Value"],
        [
          ["Confirmed Sales (₦)", "Sum of matched transactions — your board-ready revenue number"],
          ["Unconfirmed Exposure (₦)", "At-risk value pending investigation"],
          ["Match Rate %", "Reconciliation health by product line (flights, hotels, packages)"],
          ["Margin Assured (₦)", "Proven markup after supplier and gateway settlement"],
        ],
        [3600, 5760]
      ),

      new Paragraph({ spacing: { before: 100 } }),
      h2("Implementation"),
      tbl(
        ["", ""],
        [
          ["Timeline", "10 weeks — flights + gateway pilot, then full product rollout"],
          ["Disruption", "Minimal — uses existing CSV exports; no booking engine change"],
          ["Investment", "Implementation fee + annual SaaS (quoted after discovery)"],
          ["Next step", "60-minute live demo reconciling Wakanow files → confirmed sales in real time"],
        ],
        [2200, 7160]
      ),

      new Paragraph({ spacing: { before: 100 } }),
      h2("Bottom Line"),
      p(`Gross bookings are a forecast. Matched transactions are confirmed revenue. ReconFlow is the control layer that turns ${ORG_SHORT}'s payment ecosystem into auditable, board-defensible sales — daily, not at month-end.`, { after: 60 }),

      new Paragraph({ spacing: { before: 80 }, children: [
        new TextRun({ text: "Prepared by: ", size: 18, bold: true }),
        new TextRun({ text: "OEO Solutions  |  ", size: 18 }),
        new TextRun({ text: "Contact: ", size: 18, bold: true }),
        new TextRun({ text: "+234 803 668 5485  |  oeosolution@gmail.com", size: 18 }),
      ] }),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, buf);
  console.log("CFO Summary:", OUT);
});
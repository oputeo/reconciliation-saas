const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel, BorderStyle,
  WidthType, ShadingType, PageNumber,
} = require("docx");

const ORG = "National Open University of Nigeria";
const ORG_SHORT = "NOUN";
const OUT = path.join(__dirname, "..", "deliverables", "ReconFlow_NOUN_VC_Executive_Summary.docx");
const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

function h2(t) { return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] }); }
function p(t, o = {}) { return new Paragraph({ spacing: { after: o.after ?? 100 }, ...o, children: [new TextRun(t)] }); }
function b(ref, t) { return new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 60 }, children: [new TextRun({ text: t, size: 20 })] }); }
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
  title: `VC Executive Summary — ReconFlow for ${ORG_SHORT}`,
  styles: {
    default: { document: { run: { font: "Arial", size: 20 } } },
    paragraphStyles: [
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 22, bold: true, font: "Arial", color: "1E3A5F" }, paragraph: { spacing: { before: 140, after: 80 }, outlineLevel: 1 } },
    ],
  },
  numbering: {
    config: [
      { reference: "b1", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] },
    ],
  },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, right: 1080, bottom: 900, left: 1080 } } },
    headers: { default: new Header({ children: [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "0D9488", space: 1 } }, children: [new TextRun({ text: "OEO Solutions", bold: true, size: 18, color: "1E3A5F" }), new TextRun({ text: `  |  Executive Summary for the Vice-Chancellor`, size: 18, color: "666666" })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Confidential  |  June 2026  |  oeosolution@gmail.com  |  Page ", size: 14, color: "888888" }), new TextRun({ children: [PageNumber.CURRENT], size: 14, color: "888888" })] })] }) },
    children: [
      new Paragraph({ spacing: { before: 120, after: 80 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "EXECUTIVE SUMMARY", size: 28, bold: true, color: "1E3A5F" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: "ReconFlow — Fee Reconciliation & Revenue Assurance", size: 22, bold: true })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 140 }, children: [new TextRun({ text: `For: ${ORG} (${ORG_SHORT})`, size: 20, color: "555555" })] }),

      p(`${ORG_SHORT} has outgrown manual fee reconciliation. With hundreds of thousands of learners, 100+ study centres, and payments across Remita, bank accounts, and student portals every semester, the institution needs a single, auditable view of every naira collected — not another spreadsheet cycle.`),

      h2("The Issue"),
      p(`Fee evidence is fragmented across bursary ledgers, Remita RRR reports, bank statements, and study-centre remittances. At current scale, manual matching produces delayed semester close, unresolved student payment disputes, undetected revenue leakage, and weak audit evidence — exposing ${ORG_SHORT} to reputational and regulatory risk.`, { after: 80 }),

      h2("The Recommendation"),
      p("Deploy ReconFlow — an AI-enabled reconciliation platform that consolidates all fee channels into one master ledger, automates matching with confidence scoring, and produces executive and audit-ready reports. ReconFlow sits above existing portal and Remita infrastructure; it does not replace them.", { after: 80 }),

      h2("Strategic Value to the Vice-Chancellor"),
      tbl(
        ["Outcome", "Benefit"],
        [
          ["Financial integrity", "Every fee matched, flagged, or resolved — with defensible evidence"],
          ["Student trust", "Paid students recognised promptly; disputes resolved with data, not delay"],
          ["Audit readiness", "One-click reports for internal audit and external examination"],
          ["Management visibility", "Live match rates and leakage by study centre, programme, and fee type"],
          ["Operational efficiency", "Semester close in days, not weeks — freeing senior bursary capacity"],
        ],
        [2800, 6560]
      ),

      new Paragraph({ spacing: { before: 100 } }),
      h2("Implementation at a Glance"),
      tbl(
        ["", ""],
        [
          ["Timeline", "10 weeks — phased: central pilot, then study-centre rollout"],
          ["Disruption", "Minimal — uses existing CSV exports from bursary, Remita, and banks"],
          ["Investment", "Implementation fee + annual SaaS (quoted after half-day discovery)"],
          ["Decision required", "Sponsor from Bursary + ICT; 60-minute live demo with real NOUN files"],
        ],
        [2200, 7160]
      ),

      new Paragraph({ spacing: { before: 100 } }),
      h2("Bottom Line"),
      p(`${ORG_SHORT} pioneered open university education in Nigeria. Maintaining public confidence now depends on financial control at national scale. ReconFlow is the reconciliation infrastructure that makes every other payment investment auditable and trustworthy.`, { after: 80 }),
      p("Recommended next step: approve a joint Bursary–ICT–Internal Audit demonstration session with OEO Solutions.", { after: 60 }),

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
  console.log("VC Summary:", OUT);
});
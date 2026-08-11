const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Header, Footer,
  AlignmentType, HeadingLevel, PageNumber, TableOfContents,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  ShadingType, PageBreak, SectionType
} = require('docx');

const m = require('./generate-phase1-v2.cjs');
const { buildCover, P, c, h1, h2, h3, body, bodyBold, spacer, makeTable, TB } = m;
const part2 = require('./generate-phase1-v2-part2.cjs');
const part3 = require('./generate-phase1-v2-part3.cjs');
const part4 = require('./generate-phase1-v2-part4.cjs');
const part5 = require('./generate-phase1-v2-part5.cjs');

// Cover section
const coverSection = {
  properties: {
    page: { size: { width: 11906, height: 16838, orientation: 'portrait' }, margin: { top: 0, bottom: 0, left: 0, right: 0 } }
  },
  children: [buildCover()]
};

// TOC section
const tocSection = {
  properties: {
    page: { size: { width: 11906, height: 16838, orientation: 'portrait' }, margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 } },
    titlePage: true
  },
  headers: {
    default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'VIXOR V2 Architecture Decision Freeze', size: 16, color: c(P.secondary), font: { ascii: 'Calibri' }, italics: true })] })] })
  },
  footers: {
    default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Page ', size: 16, color: c(P.secondary), font: { ascii: 'Calibri' } }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: c(P.secondary), font: { ascii: 'Calibri' } })] })] })
  },
  children: [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 480, after: 360 }, children: [new TextRun({ text: 'Table of Contents', bold: true, size: 32, font: { ascii: 'Calibri' }, color: c(P.primary) })] }),
    new TableOfContents('Table of Contents', { hyperlink: true, headingStyleRange: '1-3' }),
    new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: 'Right-click the TOC and select \u201cUpdate Field\u201d to refresh page numbers.', italics: true, size: 18, color: c(P.secondary), font: { ascii: 'Calibri' } })] }),
    new Paragraph({ children: [new PageBreak()] })
  ]
};

// Body section
const bodyChildren = [
  // Sections 1-6 from part 1
  ...m.sec1_executiveDecision(),
  ...m.sec2_currentReality(),
  ...m.sec3_archPrinciples(),
  ...m.sec4_productDef(),
  ...m.sec5_twoVerticals(),
  ...m.sec6_capMap(),
  // Sections 7-10 from part 2
  ...part2.sec7_ossMatrix(),
  ...part2.sec8_licenseMatrix(),
  ...part2.sec9_dataArch(),
  ...part2.sec10_canonicalModels(),
  // Sections 11-14 from part 3
  ...part3.sec11_providerArch(),
  ...part3.sec12_intelArch(),
  ...part3.sec13_signalArch(),
  ...part3.sec14_moxiArch(),
  // Sections 15-18 from part 4
  ...part4.sec15_eventArch(),
  ...part4.sec16_bgJobsArch(),
  ...part4.sec17_routeConsolidation(),
  ...part4.sec18_uxFlow(),
  // Sections 19-27 from part 5
  ...part5.sec19_migration(),
  ...part5.sec20_tasksReplanning(),
  ...part5.sec21_phaseMap(),
  ...part5.sec22_depGraph(),
  ...part5.sec23_riskRegister(),
  ...part5.sec24_verificationStrategy(),
  ...part5.sec25_finalGates(),
  ...part5.sec26_taskRegister(),
  ...part5.sec27_humanApproval(),
];

const bodySection = {
  properties: {
    page: {
      size: { width: 11906, height: 16838, orientation: 'portrait' },
      margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
      pageNumbers: { start: 1 }
    }
  },
  headers: {
    default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'VIXOR V2 Architecture Decision Freeze', size: 16, color: c(P.secondary), font: { ascii: 'Calibri' }, italics: true })] })] })
  },
  footers: {
    default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Page ', size: 16, color: c(P.secondary), font: { ascii: 'Calibri' } }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: c(P.secondary), font: { ascii: 'Calibri' } })] })] })
  },
  children: bodyChildren
};

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: { ascii: 'Times New Roman', eastAsia: 'Microsoft YaHei' }, size: 22, color: c(P.body) },
        paragraph: { spacing: { line: 312 } }
      }
    },
    heading1: { run: { font: { ascii: 'Calibri', eastAsia: 'SimHei' }, size: 32, bold: true, color: c(P.primary) } },
    heading2: { run: { font: { ascii: 'Calibri', eastAsia: 'SimHei' }, size: 28, bold: true, color: c(P.primary) } },
    heading3: { run: { font: { ascii: 'Calibri', eastAsia: 'SimHei' }, size: 24, bold: true, color: c(P.secondary) } }
  },
  sections: [coverSection, tocSection, bodySection]
});

const OUTPUT = '/home/z/my-project/download/VIXOR_ARCHITECTURE_DECISION_FREEZE_V2.docx';
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(OUTPUT, buf);
  console.log('Document generated: ' + OUTPUT);
  console.log('Size: ' + (buf.length / 1024).toFixed(1) + ' KB');
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

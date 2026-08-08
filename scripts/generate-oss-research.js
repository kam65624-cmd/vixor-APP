const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Header, Footer,
  AlignmentType, HeadingLevel, PageNumber, PageBreak,
  Table, TableRow, TableCell, WidthType, TableLayoutType,
  BorderStyle, ShadingType, TableOfContents, NumberFormat,
  SectionType,
} = require("docx");

// ═══════════════════════════════════════════════════════════════
// PALETTE: DM-1 Deep Cyan (Tech / AI)
// ═══════════════════════════════════════════════════════════════
const P = {
  bg: "162235", primary: "0F172A", body: "1C2A3D", secondary: "5B6B7D",
  accent: "1B6B7A", surface: "EDF3F5",
  cover: { titleColor: "FFFFFF", subtitleColor: "B0B8C0", metaColor: "90989F", footerColor: "687078" },
  table: { headerBg: "1B6B7A", headerText: "FFFFFF", accentLine: "1B6B7A", innerLine: "C8DDE2", surface: "EDF3F5" },
};
const c = (hex) => hex.replace("#", "");

// ═══════════════════════════════════════════════════════════════
// BORDERS
// ═══════════════════════════════════════════════════════════════
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };
const thinBorder = { style: BorderStyle.SINGLE, size: 4, color: c(P.table.innerLine) };
const headerBottomBorder = { style: BorderStyle.SINGLE, size: 8, color: c(P.table.accentLine) };

// ═══════════════════════════════════════════════════════════════
// COVER HELPERS
// ═══════════════════════════════════════════════════════════════
function calcTitleLayout(title, maxWidthTwips, preferredPt = 40, minPt = 24) {
  const charWidth = (pt) => pt * 20;
  const charsPerLine = (pt) => Math.floor(maxWidthTwips / charWidth(pt));
  let titlePt = preferredPt;
  let lines;
  while (titlePt >= minPt) {
    const cpl = charsPerLine(titlePt);
    if (cpl < 2) { titlePt -= 2; continue; }
    lines = splitTitleLines(title, cpl);
    if (lines.length <= 3) break;
    titlePt -= 2;
  }
  if (!lines || lines.length > 3) {
    const cpl = charsPerLine(minPt);
    lines = splitTitleLines(title, cpl);
    titlePt = minPt;
  }
  return { titlePt, titleLines: lines };
}

function splitTitleLines(title, charsPerLine) {
  if (title.length <= charsPerLine) return [title];
  const breakAfter = new Set([
    ...",.;:!?\u060C\u061B\u061F",  
    ..." \t-_—\u2013\u00B7/",
  ]);
  const lines = [];
  let remaining = title;
  while (remaining.length > charsPerLine) {
    let breakAt = -1;
    for (let i = charsPerLine; i >= Math.floor(charsPerLine * 0.6); i--) {
      if (i < remaining.length && breakAfter.has(remaining[i - 1])) { breakAt = i; break; }
    }
    if (breakAt === -1) {
      const limit = Math.min(remaining.length, Math.ceil(charsPerLine * 1.3));
      for (let i = charsPerLine + 1; i < limit; i++) {
        if (breakAfter.has(remaining[i - 1])) { breakAt = i; break; }
      }
    }
    if (breakAt === -1) breakAt = charsPerLine;
    lines.push(remaining.slice(0, breakAt).trim());
    remaining = remaining.slice(breakAt).trim();
  }
  if (remaining) lines.push(remaining);
  if (lines.length > 1 && lines[lines.length - 1].length <= 2) {
    const last = lines.pop();
    lines[lines.length - 1] += last;
  }
  return lines;
}

function calcCoverSpacing(params) {
  const { titleLineCount = 1, titlePt = 36, hasSubtitle = false, hasEnglishLabel = false, metaLineCount = 0, fixedHeight = 800, pageHeight = 16838 } = params;
  const SAFETY = 1200;
  const titleBlockHeight = titleLineCount * Math.ceil(titlePt * 23) + (titleLineCount - 1) * 100 + 300;
  const subtitleHeight = hasSubtitle ? 500 : 0;
  const labelHeight = hasEnglishLabel ? 500 : 0;
  const metaHeight = metaLineCount * 350;
  const used = titleBlockHeight + subtitleHeight + labelHeight + metaHeight + fixedHeight + SAFETY;
  const freeSpace = pageHeight - used;
  const topSpacing = Math.max(1200, Math.floor(freeSpace * 0.55));
  const bottomSpacing = Math.max(800, freeSpace - topSpacing);
  return { topSpacing, bottomSpacing };
}

function buildCoverR1(config) {
  const CP = config.palette;
  const padL = 1200, padR = 800;
  const availableWidth = 11906 - padL - padR - 300;
  const { titlePt, titleLines } = calcTitleLayout(config.title, availableWidth, 38, 24);
  const titleSize = titlePt * 2;
  const spacing = calcCoverSpacing({
    titleLineCount: titleLines.length, titlePt, hasSubtitle: !!config.subtitle,
    hasEnglishLabel: !!config.englishLabel, metaLineCount: (config.metaLines || []).length, fixedHeight: 400,
  });
  const accentLeft = { style: BorderStyle.SINGLE, size: 8, color: c(P.cover.footerColor), space: 12 };
  const children = [];
  children.push(new Paragraph({ spacing: { before: spacing.topSpacing } }));
  if (config.englishLabel) {
    children.push(new Paragraph({
      indent: { left: padL, right: padR }, spacing: { after: 500 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: c(P.cover.footerColor), space: 8 } },
      children: [new TextRun({ text: config.englishLabel, size: 18, color: c(P.cover.footerColor), font: { ascii: "Calibri" }, characterSpacing: 40 })],
    }));
  }
  for (let i = 0; i < titleLines.length; i++) {
    children.push(new Paragraph({
      indent: { left: padL },
      spacing: { after: i < titleLines.length - 1 ? 100 : 300, line: Math.ceil(titlePt * 23), lineRule: "atLeast" },
      children: [new TextRun({ text: titleLines[i], size: titleSize, bold: true, color: c(CP.titleColor), font: { eastAsia: "SimHei", ascii: "Arial" } })],
    }));
  }
  if (config.subtitle) {
    children.push(new Paragraph({
      indent: { left: padL }, spacing: { after: 800 },
      children: [new TextRun({ text: config.subtitle, size: 24, color: c(CP.subtitleColor), font: { eastAsia: "Microsoft YaHei", ascii: "Arial" } })],
    }));
  }
  for (const line of (config.metaLines || [])) {
    children.push(new Paragraph({
      indent: { left: padL + 200 }, spacing: { after: 80 }, border: { left: accentLeft },
      children: [new TextRun({ text: line, size: 22, color: c(CP.metaColor), font: { eastAsia: "Microsoft YaHei", ascii: "Arial" } })],
    }));
  }
  children.push(new Paragraph({ spacing: { before: spacing.bottomSpacing } }));
  children.push(new Paragraph({
    indent: { left: padL, right: padR },
    border: { top: { style: BorderStyle.SINGLE, size: 2, color: c(P.cover.footerColor), space: 8 } },
    spacing: { before: 200 },
    children: [
      new TextRun({ text: config.footerLeft || "", size: 16, color: c(CP.footerColor), font: { ascii: "Arial" } }),
      new TextRun({ text: "                                                    " }),
      new TextRun({ text: config.footerRight || "", size: 16, color: c(CP.footerColor), font: { ascii: "Arial" } }),
    ],
  }));
  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE }, layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({ height: { value: 16838, rule: "exact" }, children: [
      new TableCell({ shading: { type: ShadingType.CLEAR, fill: CP.bg }, borders: noBorders, children }),
    ]})],
  })];
}

// ═══════════════════════════════════════════════════════════════
// BODY HELPERS
// ═══════════════════════════════════════════════════════════════
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1, spacing: { before: 480, after: 200 },
    children: [new TextRun({ text, bold: true, size: 32, color: c(P.primary), font: { ascii: "Calibri", eastAsia: "SimHei" } })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2, spacing: { before: 360, after: 160 },
    children: [new TextRun({ text, bold: true, size: 28, color: c(P.primary), font: { ascii: "Calibri", eastAsia: "SimHei" } })],
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3, spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, bold: true, size: 24, color: c(P.primary), font: { ascii: "Calibri", eastAsia: "SimHei" } })],
  });
}
function p(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED, indent: { firstLine: 480 }, spacing: { line: 312, after: 80 },
    children: [new TextRun({ text, size: 24, color: c(P.body), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
  });
}
function pNoIndent(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT, spacing: { line: 312, after: 80 },
    children: [new TextRun({ text, size: 24, color: c(P.body), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
  });
}
function pBold(label, text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED, indent: { firstLine: 480 }, spacing: { line: 312, after: 80 },
    children: [
      new TextRun({ text: label, bold: true, size: 24, color: c(P.primary), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
      new TextRun({ text, size: 24, color: c(P.body), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
    ],
  });
}
function empty() { return new Paragraph({ spacing: { after: 60 }, children: [] }); }

// Table helper
function makeTable(headers, rows) {
  const colW = Math.floor(100 / headers.length);
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE }, layout: TableLayoutType.FIXED,
    borders: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder, insideHorizontal: thinBorder, insideVertical: thinBorder },
    rows: [
      new TableRow({ tableHeader: true, cantSplit: true, children: headers.map(h =>
        new TableCell({
          width: { size: colW, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, fill: c(P.table.headerBg) },
          borders: { top: NB, bottom: headerBottomBorder, left: NB, right: NB },
          children: [new Paragraph({ spacing: { before: 60, after: 60 }, children: [
            new TextRun({ text: h, bold: true, size: 20, color: c(P.table.headerText), font: { ascii: "Calibri", eastAsia: "SimHei" } }),
          ]})],
        })
      )}),
      ...rows.map((row, ri) =>
        new TableRow({ cantSplit: true, children: row.map(cell =>
          new TableCell({
            width: { size: colW, type: WidthType.PERCENTAGE },
            shading: ri % 2 === 1 ? { type: ShadingType.CLEAR, fill: c(P.table.surface) } : undefined,
            borders: { top: NB, bottom: NB, left: NB, right: NB },
            children: [new Paragraph({ spacing: { before: 40, after: 40 }, children: [
              new TextRun({ text: cell, size: 20, color: c(P.body), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
            ]})],
          })
        )})
      ),
    ],
  });
}

// ═══════════════════════════════════════════════════════════════
// CONTENT: ALL 5 DELIVERABLES
// ═══════════════════════════════════════════════════════════════

// ── DELIVERABLE 1: OSS Research ──
const d1 = [
  h1("\u0627\u0644\u0642\u0637\u0631\u0629 \u0627\u0644\u0623\u0648\u0644\u0649: \u0628\u062D\u062B \u0627\u0644\u0645\u0634\u0627\u0631\u064A\u0639 \u0627\u0644\u0645\u0641\u062A\u0648\u062D\u0629 (OSS Research)"),
  p("\u064A\u063A\u0637\u064A \u0647\u0630\u0627 \u0627\u0644\u0642\u0633\u0645 \u0628\u062D\u062B\u0627\u064B \u0645\u0639\u0645\u0642\u0627\u064B \u0641\u064A 22 \u0645\u0634\u0631\u0648\u0639\u0627\u064B \u0645\u0641\u062A\u0648\u062D \u0627\u0644\u0645\u0635\u062F\u0631 \u0639\u0628\u0631 7 \u0641\u0626\u0627\u062A. \u0643\u0644 \u0645\u0634\u0631\u0648\u0639 \u064A\u062A\u0636\u0645\u0646: \u0648\u0635\u0641\u0627\u064B \u062A\u0642\u0646\u064A\u0627\u064B\u060C \u0646\u0642\u0627\u0637 \u0627\u0644\u0642\u0648\u0629 \u0648\u0627\u0644\u0636\u0639\u0641\u060C \u0627\u0644\u062A\u0648\u0627\u0641\u0642 \u0645\u0639 \u0628\u0646\u064A\u0629 VIXOR \u0627\u0644\u062D\u0627\u0644\u064A\u0629\u060C \u0648\u062A\u0635\u0646\u064A\u0641 A-E. \u064A\u0631\u0628\u0637 \u0643\u0644 \u062A\u0642\u064A\u064A\u0645 \u0628\u0645\u0644\u0641\u0627\u062A VIXOR \u0627\u0644\u0645\u062D\u062F\u062F\u0629."),

  // Category 1: Trading & Execution
  h2("\u0627\u0644\u0641\u0626\u0629 1: \u0627\u0644\u062A\u062F\u0627\u0648\u0644 \u0648\u0627\u0644\u062A\u0646\u0641\u064A\u0630 (Trading & Execution)"),

  h3("1.1 CCXT v4.5 (\u0645\u062F\u0645\u062C \u062D\u0627\u0644\u064A\u0627\u064B)"),
  p("CCXT \u0647\u0648 \u0645\u0643\u062A\u0628\u0629 JavaScript/Python \u0644\u0644\u062A\u062F\u0627\u0648\u0644 \u0639\u0628\u0631 100+ \u0628\u0648\u0631\u0635\u0629 \u0639\u0645\u0644\u0627\u0621 \u0623\u0631\u0628\u0627\u062D (CEX) \u0648\u062F\u0648\u0631\u0627\u062A (DEX). \u0645\u062F\u0645\u062C \u0641\u064A VIXOR \u0639\u0628\u0631 ccxt ^4.5.64 \u0641\u064A package.json. \u064A\u0648\u0641\u0631 \u0648\u0627\u062C\u0647\u0629 \u0645\u0648\u062D\u062F\u0629 \u0644\u0644\u0623\u0648\u0627\u0645\u0631 (unified order API) \u0648\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0633\u0648\u0642 (market data) \u0648\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062D\u0633\u0627\u0628\u0627\u062A."),
  pBold("\u0627\u0644\u0646\u0642\u0627\u0637 \u0627\u0644\u0642\u0648\u0629: ", "\u062A\u063A\u0637\u064A\u0629 \u0648\u0627\u0633\u0639\u0629 (Binance, Bybit, OKX, Exness)\u060C API \u0645\u0648\u062D\u062F\u060C \u062F\u0639\u0645 WebSocket\u060C \u0646\u0634\u0637 \u0645\u062A\u0632\u0627\u064A\u062F. \u064A\u0633\u062A\u062E\u062F\u0645 \u0641\u064A src/domains/trading/gateway/adapters/ccxt-generic-adapter.ts \u0643\u0645\u062D\u0648\u0644 \u0639\u0627\u0645 \u0644\u0623\u064A \u0628\u0648\u0631\u0635\u0629 \u062C\u062F\u064A\u062F\u0629."),
  pBold("\u0627\u0644\u0636\u0639\u0641: ", "\u062D\u062C\u0645 \u0627\u0644\u062D\u0632\u0645\u0629 \u0643\u0628\u064A\u0631 (externalized \u0641\u064A vite.config.ts)\u060C \u0644\u0627 \u064A\u062F\u0639\u0645 Solana DEX \u0628\u0634\u0643\u0644 \u0645\u0628\u0627\u0634\u0631 (\u064A\u062D\u062A\u0627\u062C Jupiter/Axiom \u0645\u0646\u0641\u0635\u0644\u064A\u0646)."),
  pBold("\u0627\u0644\u062A\u0635\u0646\u064A\u0641: ", "A (\u062A\u0643\u0627\u0645\u0644 \u0645\u0628\u0627\u0634\u0631) \u2014 \u0627\u0644\u0627\u062D\u062A\u0641\u0627\u0638 \u0628\u0647 \u0643\u0645\u0643\u062A\u0628\u0629 \u0627\u0644\u062A\u062F\u0627\u0648\u0644 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629. \u0627\u0644\u0645\u0644\u0641\u0627\u062A: ccxt-generic-adapter.ts, binance-adapter.ts, bybit-adapter.ts, okx-adapter.ts, exness-adapter.ts"),

  h3("1.2 Hummingbot (\u0645\u0631\u062C\u0639 \u0647\u064A\u0643\u0644\u064A)"),
  p("Hummingbot \u0645\u0646\u0635\u0629 \u062A\u062F\u0627\u0648\u0644 \u0645\u0641\u062A\u0648\u062D\u0629 \u0644\u0644\u0639\u0645\u0644\u0627\u062A \u0627\u0644\u0622\u0644\u064A\u0629: market making, arbitrage, DEX trading. \u0645\u0643\u062A\u0648\u0628 \u0628\u0627\u0644\u0643\u0627\u0645\u0644 \u0628\u0640 Python \u0645\u0639 \u0647\u064A\u0643\u0644 plugin \u0645\u062A\u0642\u062F\u0645. \u064A\u062F\u0639\u0645 CEX+DEX \u0639\u0628\u0631 CCXT \u0648Web3 \u0623\u0635\u064A\u0644."),
  pBold("\u0627\u0644\u0646\u0642\u0627\u0637 \u0627\u0644\u0642\u0648\u0629: ", "\u0647\u064A\u0643\u0644 V2 \u0645\u0639 Strategy Controller + Executor Controller + Data Feed. \u0646\u0645\u0637 Connectors \u0644\u0644\u0628\u0648\u0631\u0635\u0627\u062A. \u062A\u0635\u0645\u064A\u0645 pure-function strategy \u0645\u0645\u062A\u0627\u0632."),
  pBold("\u0627\u0644\u0636\u0639\u0641: ", "Python-only (VIXOR TypeScript)\u060C \u0644\u0627\u064A\u062D\u062A\u0648\u064A \u0639\u0644\u0649 MOXI/AI agents\u060C \u0644\u0627 \u064A\u062F\u0639\u0645 multi-chain wallet \u0643\u0640 VIXOR."),
  pBold("\u0627\u0644\u062A\u0635\u0646\u064A\u0641: ", "C (\u0645\u0631\u062C\u0639 \u0647\u064A\u0643\u0644\u064A) \u2014 \u0627\u0633\u062A\u0644\u0647\u0627\u0645 \u0645\u0646: pure-function strategies \u0644\u062A\u062D\u0633\u064A\u0646 src/domains/arbitrage/strategies/base.ts\u060C Connector pattern \u0644\u062A\u062D\u0633\u064A\n src/domains/trading/gateway/adapters/"),

  h3("1.3 FreqTrade (\u0645\u0631\u062C\u0639 \u0647\u064A\u0643\u0644\u064A)"),
  p("FreqTrade \u0631\u0648\u0628\u0648\u062A \u062A\u062F\u0627\u0648\u0644 \u0639\u0645\u0644\u0627\u062A \u0623\u0631\u0628\u0627\u062D \u0645\u0641\u062A\u0648\u062D \u0627\u0644\u0645\u0635\u062F\u0631 \u0628\u0640 Python. \u064A\u062A\u0645\u064A\u0632 \u0628\u0640 backtesting engine \u0645\u062A\u0643\u0627\u0645\u0644 \u0645\u0639 hyperopt optimization \u0648dry-run mode. \u064A\u062F\u0639\u0645 CCXT + custom strategies."),
  pBold("\u0627\u0644\u0646\u0642\u0627\u0637 \u0627\u0644\u0642\u0648\u0629: ", "Backtesting + live trading \u0641\u064A \u0625\u0637\u0627\u0631 \u0648\u0627\u062D\u062F\u060C strategy classes \u0645\u0639 populate_indicators/populate_entry_trend/populate_exit_trend\u060C风险管理 \u0645\u062A\u0643\u0627\u0645\u0644."),
  pBold("\u0627\u0644\u0636\u0639\u0641: ", "Python-only\u060C \u0644\u0627 \u064A\u062F\u0639\u0645 DEX/Solana\u060C \u0644\u0627 \u064A\u062D\u062A\u0648\u064A AI/LLM."),
  pBold("\u0627\u0644\u062A\u0635\u0646\u064A\u0641: ", "C (\u0645\u0631\u062C\u0639 \u0647\u064A\u0643\u0644\u064A) \u2014 \u0627\u0633\u062A\u0644\u0647\u0627\u0645 \u0645\u0646: backtesting architecture \u0644\u062A\u062D\u0633\u064A\u0646 src/domains/backtest/engine/simulator.ts\u060C strategy lifecycle pattern \u0644\u062A\u062D\u0633\u064A\u0646 src/domains/strategy/runtime/script-runtime.ts"),

  // Category 2: Market Data
  h2("\u0627\u0644\u0641\u0626\u0629 2: \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0633\u0648\u0642 (Market Data)"),

  h3("2.1 TradingView Lightweight Charts v5.2 (\u0645\u062F\u0645\u062C \u062D\u0627\u0644\u064A\u0627\u064B)"),
  p("\u0645\u0643\u062A\u0628\u0629 \u0631\u0633\u0648\u0645 \u0628\u064A\u0627\u0646\u064A\u0629 \u062E\u0641\u064A\u0641\u0629 \u0644\u0644\u0623\u0633\u0648\u0627\u0642 \u0627\u0644\u0645\u0627\u0644\u064A\u0629. \u0645\u062F\u0645\u062C \u0641\u064A VIXOR \u0639\u0628\u0631 lightweight-charts ^5.2.0 + lightweight-charts-indicators ^0.4.2. \u062A\u0633\u062A\u062E\u062F\u0645 \u0641\u064A 3 \u0645\u0643\u0648\u0646\u0627\u062A \u0631\u0626\u064A\u0633\u064A\u0629."),
  pBold("\u0627\u0644\u0645\u0644\u0641\u0627\u062A: ", "src/components/vixor/CandlestickChart.tsx (\u0627\u0644\u0631\u0633\u0645 \u0627\u0644\u0628\u064A\u0627\u0646\u064A \u0627\u0644\u0631\u0626\u064A\u0633\u064A)\u060C src/components/vixor/DexChart.tsx (\u0644\u0640 DEX tokens)\u060C src/components/vixor/MiniSparkline.tsx (\u064A\u0633\u062A\u062E\u062F\u0645 Recharts \u0644\u0644\u0639\u0645\u0648\u062F \u0627\u0644\u0635\u063A\u064A\u0631\u0629 \u0644\u0627 \u0644\u0640 lightweight-charts)"),
  pBold("\u0627\u0644\u062A\u0635\u0646\u064A\u0641: ", "A (\u062A\u0643\u0627\u0645\u0644 \u0645\u0628\u0627\u0634\u0631) \u2014 \u0627\u0644\u0627\u062D\u062A\u0641\u0627\u0638 \u0648\u062A\u0648\u0633\u064A\u0639 \u0627\u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0644\u0640 EquityChart.tsx \u0648\u0627\u0644\u0631\u0633\u0648\u0645 \u0627\u0644\u0645\u062A\u0642\u062F\u0645\u0629"),

  h3("2.2 DeFiLlama SDK (\u0645\u062D\u0648\u0644 \u0645\u0642\u062A\u0631\u062D)"),
  p("SDK \u0645\u0641\u062A\u0648\u062D \u0627\u0644\u0645\u0635\u062F\u0631 \u0644\u0628\u064A\u0627\u0646\u0627\u062A DeFi: TVL, fees, yields, token prices. API \u0645\u062C\u0627\u0646\u064A \u0628\u062F\u0648\u0646 rate limit. \u064A\u063A\u0637\u064A 200+ chains \u06481000+ protocols. \u0628\u064A\u0627\u0646\u0627\u062A TVL \u062D\u064A\u0629 \u0645\u062D\u062F\u062B\u0629."),
  pBold("\u0627\u0644\u062A\u0648\u0627\u0641\u0642 \u0645\u0639 VIXOR: ", "\u064A\u0645\u0643\u0646 \u0625\u0636\u0627\u0641\u0629 TVL/yield data \u0644\u0635\u0641\u062D\u0629 yield.tsx \u0648curves.tsx \u0648portfolio.tsx \u0643\u0645\u0635\u062F\u0631 \u0625\u0636\u0627\u0641\u064A. \u064A\u0643\u0645\u0644 Birdeey + Mobula \u0641\u064A src/domains/discovery/clients/ \u0644\u0628\u064A\u0627\u0646\u0627\u062A on-chain \u0623\u0643\u062B\u0631 \u062A\u0643\u0627\u0645\u0644\u0627\u064B."),
  pBold("\u0627\u0644\u062A\u0635\u0646\u064A\u0641: ", "B (\u0645\u062D\u0648\u0644/\u062E\u062F\u0645\u0629) \u2014 \u0625\u0636\u0627\u0641\u0629 src/shared/market-data/defillama.client.ts \u0643\u0645\u0635\u062F\u0631 TVL/yield \u0644\u0635\u0641\u062D\u0627\u062A yield \u0648portfolio \u0648curves"),

  h3("2.3 Tiingo (\u0645\u0631\u062C\u0639 \u0647\u064A\u0643\u0644\u064A)"),
  p("Tiingo \u0645\u0648\u0631\u062F \u0628\u064A\u0627\u0646\u0627\u062A \u0633\u0648\u0642 IEX \u0645\u0641\u062A\u0648\u062D. \u064A\u0648\u0641\u0631 EOD/historical \u0644\u0644\u0623\u0633\u0647\u0645 \u0648crypto \u0648forex. API \u0645\u062C\u0627\u0646\u064A \u0645\u062D\u062F\u0648\u062F. \u064A\u0643\u0645\u0644 TwelveData \u0627\u0644\u062D\u0627\u0644\u064A."),
  pBold("\u0627\u0644\u062A\u0635\u0646\u064A\u0641: ", "D (\u0645\u0631\u062C\u0639 UX) \u2014 \u0646\u0645\u0637 \u0627\u0644\u0640 multi-source price resolver \u0641\u064A src/shared/market-data/price-resolver.ts \u064A\u0645\u0643\u0646 \u0627\u0633\u062A\u0644\u0647\u0627\u0645 Tiingo \u0643\u0645\u0635\u062F\u0631 backup \u0644\u0640 forex/stocks"),

  // Category 3: Token Intelligence
  h2("\u0627\u0644\u0641\u0626\u0629 3: \u0630\u0643\u0627\u0621 \u0627\u0644\u062A\u0648\u0643\u0646\u0627\u062A \u0648On-Chain (Token Intelligence)"),

  h3("3.1 Birdeye API (\u0645\u062F\u0645\u062C \u062D\u0627\u0644\u064A\u0627\u064B)"),
  p("Birdeye \u0645\u0646\u0635\u0629 on-chain analytics \u0644\u0640 Solana + EVM. \u0645\u062F\u0645\u062C \u0641\u064A VIXOR \u0639\u0628\u0631 src/domains/discovery/clients/birdeye.client.ts \u0648src/domains/discovery/clients/helius.client.ts \u0644\u0640 Solana smart money. \u064A\u0648\u0641\u0631 token metadata, trade data, whale tracking."),
  pBold("\u0627\u0644\u0645\u0644\u0641\u0627\u062A: ", "src/domains/discovery/clients/birdeye.client.ts \u064A\u0633\u062A\u062E\u062F\u0645 \u0641\u064A discover/functions.ts \u0644\u062D\u0633\u0627\u0628 Discovery Score. Helius client \u0641\u064A src/shared/market-data/helius-rpc.ts \u064A\u063A\u0630\u064A \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A on-chain \u0644\u0635\u0641\u062D\u0629 discover.tsx"),
  pBold("\u0627\u0644\u062A\u0635\u0646\u064A\u0641: ", "A (\u062A\u0643\u0627\u0645\u0644 \u0645\u0628\u0627\u0634\u0631) \u2014 \u0645\u0635\u062F\u0631 \u0623\u0633\u0627\u0633\u064A \u0644\u0640 Discovery. \u064A\u062D\u062A\u0627\u062C \u062A\u062D\u0633\u064A\u0646: error handling, rate limiting, caching strategy"),

  h3("3.2 LunarCrush (\u0645\u062F\u0645\u062C \u062D\u0627\u0644\u064A\u0627\u064B)"),
  p("\u0645\u0646\u0635\u0629 social sentiment \u0644\u0644\u0639\u0645\u0644\u0627\u062A \u0627\u0644\u0631\u0642\u0645\u064A\u0629. \u0645\u062F\u0645\u062C \u0639\u0628\u0631 src/domains/discovery/clients/lunarcrush.client.ts. \u064A\u0648\u0641\u0631 Galaxy Score (social + market combined) \u0648AltRank. \u064A\u063A\u0630\u064A \u0628\u0631\u0646\u0627\u0645\u062C \u0627\u0644\u0640 Discovery scoring."),
  pBold("\u0627\u0644\u062A\u0635\u0646\u064A\u0641: ", "A (\u062A\u0643\u0627\u0645\u0644 \u0645\u0628\u0627\u0634\u0631) \u2014 \u064A\u0633\u0647\u0645 \u0641\u064I discovery/scoring.ts \u0628\u0627\u0644\u0623\u0632\u064A\u0627\u0621 social. \u0627\u0644\u0645\u0644\u0641: src/domains/discovery/clients/lunarcrush.client.ts"),

  h3("3.3 DexScreener (\u0645\u062F\u0645\u062C \u062D\u0627\u0644\u064A\u0627\u064B)"),
  p("\u0645\u0646\u0635\u0629 DEX analytics. \u0645\u062F\u0645\u062C \u0639\u0628\u0631 3 \u0645\u0644\u0641\u0627\u062A: src/shared/market-data/dexscreener.ts (REST)\u060C src/shared/market-data/dexscreener-ws.ts (WebSocket)\u060C src/domains/discovery/clients/dexscreener.client.ts (Discovery). \u064A\u0648\u0641\u0631 DEX pairs, new tokens, price data."),
  pBold("\u0627\u0644\u0645\u0644\u0641\u0627\u062A: ", "\u064A\u063A\u0630\u064A discover.tsx (live prices)\u060C token.$symbol.tsx (chart data)\u060C use-discover-live-prices.ts (real-time). Free tier: 60 req/min REST + WebSocket."),
  pBold("\u0627\u0644\u062A\u0635\u0646\u064A\u0641: ", "A (\u062A\u0643\u0627\u0645\u0644 \u0645\u0628\u0627\u0634\u0631) \u2014 \u0645\u0635\u062F\u0631 \u0623\u0633\u0627\u0633\u064A \u0644\u0640 DEX data"),

  // Category 4: Analytics & Backtesting
  h2("\u0627\u0644\u0641\u0626\u0629 4: \u0627\u0644\u062A\u062D\u0644\u064A\u0644 \u0648\u0627\u0644\u0628\u0643\u062A\u0633\u062A\u064A\u0646\u062C (Analytics & Backtesting)"),

  h3("4.1 tulip node (\u0645\u062D\u0648\u0644 \u0645\u0642\u062A\u0631\u062D)"),
  p("\u0645\u0643\u062A\u0628\u0629 JavaScript \u0644\u0644\u0645\u0624\u0634\u0631\u0627\u062A \u0627\u0644\u062A\u0642\u0646\u064A\u0629 (RSI, MACD, Bollinger, ATR, etc.) \u0628\u0646\u0641\u0633 \u0645\u0646\u0637 TALib \u0644\u0643\u0646 \u0645\u0643\u062A\u0648\u0628\u0629 \u0628\u0640 JS \u0623\u0635\u064A\u0644. 100+ \u0645\u0624\u0634\u0631 \u062C\u0627\u0647\u0632. VIXOR \u064A\u062D\u062A\u0648\u064A \u0627\u0644\u0622\u0646 \u0639\u0644\u0649 \u0645\u0624\u0634\u0631\u0627\t \u0645\u062E\u0635\u0635\u0629 \u0641\u064A src/domains/analysis/engine/indicators/ \u0648src/domains/analysis/engine/regime/indicator-math.ts."),
  pBold("\u0627\u0644\u062A\u0648\u0627\u0641\u0642: ", "\u064A\u0645\u0643\u0646 \u0627\u0633\u062A\u0628\u062F\u0627\u0644 \u0627\u0644\u0645\u0624\u0634\u0631\u0627\u062A \u0627\u0644\u0645\u062E\u0635\u0635\u0629 \u0628\u0640 tulip node \u0644\u062A\u0642\u0644\u064A\u0644 codebase \u0648\u0632\u064A\u0627\u062F\u0629 \u0627\u0644\u062F\u0642\u0629. \u0627\u0644\u062A\u0623\u062B\u064A\u0631 \u0639\u0644\u0649: indicator-math.ts, regime-detector.ts, strategy-scorer.ts"),
  pBold("\u0627\u0644\u062A\u0635\u0646\u064A\u0641: ", "B (\u0645\u062D\u0648\u0644/\u062E\u062F\u0645\u0629) \u2014 \u0625\u0636\u0627\u0641\u0629 tulip-node \u0643\u062A\u0628\u0639\u064A\u0629 \u0648\u0627\u0633\u062A\u062E\u062F\u0627\u0645\u0647 \u0641\u064A src/domains/analysis/engine/indicators/ \u0628\u062F\u0644\u0627\u064B \u0645\u0646 \u0627\u0644\u0645\u0624\u0634\u0631\u0627\u062A \u0627\u0644\u0645\u062E\u0635\u0635\u0629"),

  h3("4.2 Backtrader (\u0645\u0631\u062C\u0639 \u0647\u064A\u0643\u0644\u064A)"),
  p("\u0625\u0637\u0627\u0631 backtesting \u0645\u062A\u0643\u0627\u0645\u0644 \u0628\u0640 Python. Cerebro engine + Strategy classes + Analyzers + Sizers. \u0646\u0645\u0637 Observer \u0644\u0644\u0623\u062D\u062F\u0627\u062B \u0645\u062A\u0642\u062F\u0645. VIXOR \u0644\u062F\u064A\u0647 \u0645\u062D\u0631\u0643 \u0623\u0628\u0633\u0637 \u0641\u064A src/domains/backtest/engine/ (simulator, state-machine, metrics)."),
  pBold("\u0627\u0644\u062A\u0635\u0646\u064A\u0641: ", "C (\u0645\u0631\u062C\u0639 \u0647\u064A\u0643\u0644\u064A) \u2014 \u0627\u0633\u062A\u0644\u0647\u0627\u0645: Analyzer pattern \u0644\u062A\u062D\u0633\u064A\u0646 metrics.ts\u060C Sizer pattern \u0644\u062A\u062D\u0633\u064A\u0646 risk-reward.ts\u060C Observer pattern \u0644\u0640 event hooks"),

  // Category 5: Charts & Visualization
  h2("\u0627\u0644\u0641\u0626\u0629 5: \u0627\u0644\u0631\u0633\u0648\u0645 \u0627\u0644\u0628\u064A\u0627\u0646\u064A\u0629 (Charts & Visualization)"),

  h3("5.1 ECharts (\u0645\u0631\u062C\u0639 \u0647\u064A\u0643\u0644\u064A + UX \u0645\u0642\u062A\u0631\u062D)"),
  p("\u0645\u0643\u062A\u0628\u0629 Apache ECharts \u0644\u0644\u062A\u0635\u0648\u0631. \u062A\u062F\u0639\u0645 heatmap, treemap, sankey, graph, scatter, radar. \u0645\u0645\u062A\u0627\u0632 \u0644\u0644\u062F\u0627\u0634\u0628\u0648ردات \u0627\u0644\u062Aجارية. VIXOR يستخدم Recharts \u0644ل sparklines/equity chart \u0648TradingView widgets \u0644لتحليل التقني."),
  pBold("التوافق: ", "ECharts يمكن أن يحل محل Recharts في: radar.tsx, pnl.tsx (محفظة الأرباح), portfolio.tsx (توزيع المحفظة), whale.tsx (network graph للحوام). العيب: حجم كبير (1MB+).")
];

// Build the document... 
console.log("Script loaded, building document...");

const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, PageNumber, WidthType,
  TableLayoutType, BorderStyle, ShadingType, PageBreak, TabStopType, TabStopPosition,
  TableOfContents } = require("docx");
const fs = require("fs");

// ═══════════════════════════════════════════════════════════════════════════════
// PALETTE: DS-1 Deep Sea (tech report)
// ═══════════════════════════════════════════════════════════════════════════════
const coverPalette = {
  bg: "0B1C2C", primary: "FFFFFF", accent: "529286",
  cover: { titleColor: "FFFFFF", subtitleColor: "B0B8C0", metaColor: "90989F", footerColor: "687078" },
  table: { headerBg: "529286", headerText: "FFFFFF", accentLine: "529286", innerLine: "BECFCC", surface: "E8ECEB" },
};
const P = {
  primary: "0B1C2C", body: "1C2A3D", secondary: "5B6B7D",
  accent: "529286", surface: "E8ECEB",
};
const c = (hex) => hex.replace("#", "");

const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

// ═══════════════════════════════════════════════════════════════════════════════
// COVER HELPERS (from design-system.md)
// ═══════════════════════════════════════════════════════════════════════════════
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
    ...",。、；：！？",
    ..."的与和及之在于为",
    ..."-_—–·/",
    ..." \t",
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
    if (breakAt === -1) {
      breakAt = charsPerLine;
      const prevChar = remaining[breakAt - 1];
      const nextChar = remaining[breakAt];
      if (prevChar && nextChar &&
        !breakAfter.has(prevChar) && !breakAfter.has(nextChar) &&
        /[\u4e00-\u9fff]/.test(prevChar) && /[\u4e00-\u9fff]/.test(nextChar)) {
        breakAt = breakAt - 1;
      }
    }
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
  const {
    titleLineCount = 1, titlePt = 36, hasSubtitle = false,
    hasEnglishLabel = false, metaLineCount = 0,
    fixedHeight = 800, pageHeight = 16838, marginTop = 0, marginBottom = 0,
  } = params;
  const SAFETY = 1200;
  const usableHeight = pageHeight - marginTop - marginBottom - SAFETY;
  const titleHeight = titleLineCount * (titlePt * 23 + 200);
  const subtitleHeight = hasSubtitle ? (12 * 23 + 600) : 0;
  const englishLabelHeight = hasEnglishLabel ? (9 * 23 + 600) : 0;
  const metaHeight = metaLineCount * (10 * 23 + 100);
  const implicitParaHeight = 3 * 300;
  const contentHeight = titleHeight + subtitleHeight + englishLabelHeight + metaHeight + fixedHeight + implicitParaHeight;
  const remainingSpace = usableHeight - contentHeight;
  const safeRemaining = Math.max(remainingSpace, 400);
  const FOOTER_MIN = 800;
  const rawTop = Math.floor(safeRemaining * 0.45);
  const rawBottom = Math.floor(safeRemaining * 0.45);
  const bottomSpacing = Math.max(rawBottom, FOOTER_MIN);
  const topSpacing = Math.max(rawTop - Math.max(0, FOOTER_MIN - rawBottom), 400);
  return { topSpacing, bottomSpacing };
}

function buildCoverR1(config) {
  const pal = config.palette;
  const padL = 1200, padR = 800;
  const availableWidth = 11906 - padL - padR - 300;
  const { titlePt, titleLines } = calcTitleLayout(config.title, availableWidth, 40, 24);
  const titleSize = titlePt * 2;
  const spacing = calcCoverSpacing({
    titleLineCount: titleLines.length, titlePt,
    hasSubtitle: !!config.subtitle, hasEnglishLabel: !!config.englishLabel,
    metaLineCount: (config.metaLines || []).length, fixedHeight: 400,
  });
  const accentLeft = { style: BorderStyle.SINGLE, size: 8, color: pal.accent, space: 12 };
  const children = [];
  children.push(new Paragraph({ spacing: { before: spacing.topSpacing } }));
  if (config.englishLabel) {
    children.push(new Paragraph({
      indent: { left: padL, right: padR }, spacing: { after: 500 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: pal.accent, space: 8 } },
      children: [new TextRun({ text: config.englishLabel.split("").join("  "),
        size: 18, color: pal.accent, font: { ascii: "Calibri", eastAsia: "SimHei" }, characterSpacing: 40 })],
    }));
  }
  for (let i = 0; i < titleLines.length; i++) {
    children.push(new Paragraph({
      indent: { left: padL },
      spacing: { after: i < titleLines.length - 1 ? 100 : 300, line: Math.ceil(titlePt * 23), lineRule: "atLeast" },
      children: [new TextRun({ text: titleLines[i], size: titleSize, bold: true,
        color: pal.titleColor, font: { eastAsia: "SimHei", ascii: "Arial" } })],
    }));
  }
  if (config.subtitle) {
    children.push(new Paragraph({
      indent: { left: padL }, spacing: { after: 800 },
      children: [new TextRun({ text: config.subtitle, size: 24, color: pal.subtitleColor,
        font: { eastAsia: "Microsoft YaHei", ascii: "Arial" } })],
    }));
  }
  for (const line of (config.metaLines || [])) {
    children.push(new Paragraph({
      indent: { left: padL + 200 }, spacing: { after: 80 },
      border: { left: accentLeft },
      children: [new TextRun({ text: line, size: 24, color: pal.metaColor,
        font: { eastAsia: "Microsoft YaHei", ascii: "Arial" } })],
    }));
  }
  children.push(new Paragraph({ spacing: { before: spacing.bottomSpacing } }));
  children.push(new Paragraph({
    indent: { left: padL, right: padR },
    border: { top: { style: BorderStyle.SINGLE, size: 2, color: pal.accent, space: 8 } },
    spacing: { before: 200 },
    children: [
      new TextRun({ text: config.footerLeft || "", size: 16, color: pal.footerColor, font: { ascii: "Arial" } }),
      new TextRun({ text: "                                        " }),
      new TextRun({ text: config.footerRight || "", size: 16, color: pal.footerColor, font: { ascii: "Arial" } }),
    ],
  }));
  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: 16838, rule: "exact" },
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: pal.bg }, borders: noBorders,
        children,
      })],
    })],
  })];
}

// ═══════════════════════════════════════════════════════════════════════════════
// BODY HELPERS
// ═══════════════════════════════════════════════════════════════════════════════
const FONT_BODY = { ascii: "Times New Roman", eastAsia: "SimSun" };
const FONT_HEADING = { ascii: "Times New Roman", eastAsia: "SimHei" };

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    children: [new TextRun({ text, bold: true, size: 32, color: c(P.primary), font: FONT_HEADING })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 140 },
    children: [new TextRun({ text, bold: true, size: 30, color: c(P.primary), font: FONT_HEADING })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, bold: true, size: 28, color: c(P.primary), font: FONT_HEADING })],
  });
}

function body(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 480 },
    spacing: { line: 312, after: 80 },
    children: [new TextRun({ text, size: 24, color: c(P.body), font: FONT_BODY })],
  });
}

function bodyNoIndent(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 312, after: 80 },
    children: [new TextRun({ text, size: 24, color: c(P.body), font: FONT_BODY })],
  });
}

function bold(label, text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 480 },
    spacing: { line: 312, after: 80 },
    children: [
      new TextRun({ text: label, bold: true, size: 24, color: c(P.body), font: FONT_BODY }),
      new TextRun({ text, size: 24, color: c(P.body), font: FONT_BODY }),
    ],
  });
}

function emptyLine() {
  return new Paragraph({ spacing: { after: 60 }, children: [] });
}

// Simple table helper
function makeTable(headers, rows) {
  const colCount = headers.length;
  const colWidth = Math.floor((11906 - 1701 - 1417) / colCount);
  const tMargins = { top: 40, bottom: 40, left: 80, right: 80 };
  const hdrShading = { type: ShadingType.CLEAR, fill: c(coverPalette.table.headerBg) };
  const hdrTextColor = c(coverPalette.table.headerText);
  const innerLine = { style: BorderStyle.SINGLE, size: 1, color: c(coverPalette.table.innerLine) };
  const tBorders = { top: innerLine, bottom: innerLine, left: innerLine, right: innerLine, insideHorizontal: innerLine, insideVertical: innerLine };

  function makeCell(text, isHeader = false, shading = undefined) {
    return new TableCell({
      borders: tBorders, margins: tMargins,
      shading: shading ? { type: ShadingType.CLEAR, fill: c(shading) } : undefined,
      children: [new Paragraph({
        alignment: isHeader ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: { line: 280 },
        children: [new TextRun({
          text: text || "",
          bold: isHeader,
          size: isHeader ? 20 : 20,
          color: isHeader ? hdrTextColor : c(P.body),
          font: FONT_BODY,
        })],
      })],
    });
  }

  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: headers.map((h) => makeCell(h, true, undefined).root ? undefined : undefined),
  });
  // Rebuild properly
  const hCells = headers.map((h) => {
    const tc = new TableCell({
      borders: tBorders, margins: tMargins, shading: hdrShading,
      children: [new Paragraph({
        alignment: AlignmentType.CENTER, spacing: { line: 280 },
        children: [new TextRun({ text: h, bold: true, size: 20, color: hdrTextColor, font: FONT_BODY })],
      })],
    });
    return tc;
  });

  const dataRows = rows.map((row, rowIdx) => {
    const zebraShading = rowIdx % 2 === 1 ? coverPalette.table.surface : undefined;
    const dCells = row.map((cell) => {
      return new TableCell({
        borders: tBorders, margins: tMargins,
        shading: zebraShading ? { type: ShadingType.CLEAR, fill: c(zebraShading) } : undefined,
        children: [new Paragraph({
          alignment: AlignmentType.LEFT, spacing: { line: 280 },
          children: [new TextRun({ text: cell || "", size: 20, color: c(P.body), font: FONT_BODY })],
        })],
      });
    });
    return new TableRow({ cantSplit: true, children: dCells });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: tBorders,
    rows: [new TableRow({ tableHeader: true, cantSplit: true, children: hCells }), ...dataRows],
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// DOCUMENT CONTENT
// ═══════════════════════════════════════════════════════════════════════════════

const content = [];

// ── 1. Executive Summary ──
content.push(h1("1. Executive Summary"));
content.push(body(
  "This document is a read-only scope gate analysis for VIXOR V2 Phase 3 (Signal Transition Engine Wiring). " +
  "It evaluates 15 staged files (plus 2 Supabase migrations) that introduce server-authoritative signal state transitions. " +
  "The analysis answers 13 concrete verification questions, maps each file to a maturity level, and produces a final gate verdict. " +
  "No production source code, migrations, or git state was modified during the creation of this report."
));
content.push(body(
  "Phase 2 (F1 data-loss fix) has already been committed as SHA 7c9d99d7 with all 357 tests passing. " +
  "Phase 3 staged files have NOT been committed. This report assesses whether the Phase 3 staged changes are safe, " +
  "minimal, and ready for a single atomic commit, or whether they should be reduced, deferred, or rejected."
));

// ── 2. Scope & Context ──
content.push(h1("2. Scope and Context"));

content.push(h2("2.1 Git State Snapshot"));
content.push(body(
  "The repository currently has 133 staged files (132 pre-existing downloads/noise + 1 additional file from earlier analysis work). " +
  "The HEAD commit is 7c9d99d7 containing the Phase 2 F1 fix. Origin/main remains at 4ffad753 with no push performed. " +
  "All Phase 3 source files and migrations are in the staging area, uncommitted. The merge-base between HEAD and origin/main is 8200a6f1."
));

content.push(h2("2.2 Phase 2 Committed Files (Group A)"));
content.push(body(
  "Three files were committed in Phase 2 under SHA 7c9d99d7. These files fix the F1 data-loss bug in createTrade " +
  "where trade fields were silently discarded due to an \"as any\" cast. The fix introduces Zod validation and ensures " +
  "all fields from the input schema are persisted to the database. These files are already committed and are NOT part of the Phase 3 scope gate."
));
content.push(makeTable(
  ["File", "Purpose", "Status"],
  [
    ["src/domains/trades/functions.ts", "F1 fix: Zod validation + full field persistence", "COMMITTED (7c9d99d7)"],
    ["src/domains/trades/types.ts", "Type alignment for trade creation", "COMMITTED (7c9d99d7)"],
    ["src/domains/trades/trades.test.ts", "Regression tests for F1 fix (357 pass)", "COMMITTED (7c9d99d7)"],
  ]
));

content.push(h2("2.3 Phase 3 Staged Files (Groups B and C)"));
content.push(body(
  "The remaining 16 files staged in git index are the subject of this scope gate. They are organized into two groups: " +
  "Group B (Transition Engine wiring chain with a hard migration dependency) and Group C (deferred cleanup and architecture preparation). " +
  "The critical insight is that Group B has a strict dependency chain where the signal_transitions migration must be applied to Supabase " +
  "before the useSignalMonitor hook can function without database errors."
));

// ── 3. Verification Questions ──
content.push(h1("3. Thirteen Verification Questions"));
content.push(body(
  "The following questions systematically validate whether each staged component is wired, callable, and necessary. " +
  "Each question is answered based on direct code inspection of the staged files."
));

const questions = [
  { q: "Q1: Is the Transition Engine (transition-engine.ts) pure domain logic with zero external dependencies?",
    a: "YES. The file imports only from \"./types\" (SignalStatus type). It has no imports from Supabase, React, notifications, or any external library. The evaluateSignalTransition function is fully deterministic: same inputs always produce the same output. It performs no I/O, emits no events, and writes nothing to any database. The file header explicitly declares these invariants as INVARIANTS comments." },
  { q: "Q2: Is evaluateSignalTransition the single authoritative function for signal lifecycle decisions?",
    a: "YES. The function is the sole export that determines whether a transition is legal and what the next state is. The server service (signal-transition.service.ts) calls it exclusively. The client never calls it directly. There is no other code path that can change signal status based on price evaluation." },
  { q: "Q3: Is requestSignalTransition the sole server-side entry point for transitions?",
    a: "YES. It is exported from the barrel (index.ts) and is the only createServerFn-wrapped function for transitions. The old updateSignalTracking function still exists in functions.ts but is a general update function, not a transition authority. requestSignalTransition delegates to executeSignalTransition which calls evaluateSignalTransition." },
  { q: "Q4: Is requestSignalTransition wired into any UI component?",
    a: "YES. It is imported and called by useSignalMonitor (use-signal-monitor.ts line 18, 45, 103). The hook calls transitionFn (which wraps requestSignalTransition) on every price tick for active/pending trackings. It is also imported by signals.tsx route (src/routes/_authenticated/signals.tsx) per the import chain analysis, though the exact usage in that file was not inspected in detail." },
  { q: "Q5: Does useSignalMonitor call requestSignalTransition on every price tick?",
    a: "YES. The checkPrices callback (line 81-148) iterates over all activeTrackings on every price update. For each tracking, it calls transitionFn (wrapping requestSignalTransition) with the observed price, tracking ID, and current version. It includes deduplication (skips if price unchanged), debounce (pendingTransitions set), and removes the pending flag on success or error." },
  { q: "Q6: Does useSignalMonitor correctly update local state from server response?",
    a: "YES. On success (res.ok), it updates the tracking in local state with res.transition.to (server-determined status), res.transition.price, res.transition.serverReceivedAt, and derives hit_tp from the event type (TP1_HIT -> 1, TP2_HIT -> 2, TP3_HIT -> 3). The client no longer determines the next status." },
  { q: "Q7: Does the Transition Service write audit records to signal_transitions table?",
    a: "YES. After a successful signal_tracking update, executeSignalTransition (line 249-266) inserts into signal_transitions with: signal_tracking_id, user_id, from_status, to_status, event_type, observed_price, tp_index, transition_reason, server_received_at, observed_at, actor, and source. The insert uses the admin client to bypass RLS." },
  { q: "Q8: Does the Transition Service emit domain events after successful commit?",
    a: "YES. After the audit insert, it dynamically imports VixorEvents and emits \"signal.transition.completed\" with full context (trackingId, userId, pair, direction, fromStatus, toStatus, eventType, price, tpIndex, serverReceivedAt, actor). The emission is wrapped in try/catch so event failures never break the transition." },
  { q: "Q9: Is the event orchestrator (orchestrator.ts) used by any consumer for signal.transition.completed?",
    a: "NO CONSUMER FOUND. While VixorEvents.emit is called by the transition service, no handler is registered for \"signal.transition.completed\". The VixorEvents.hasHandlers check in the test mock returns false. The orchestrator defines the event type in VixorEventMap (line 88-100) but no on() registration exists for this event anywhere in the codebase. This means events are emitted into a void - logged but not consumed." },
  { q: "Q10: Is the signal_transitions migration required before useSignalMonitor can function?",
    a: "YES - CRITICAL BLOCKER. The executeSignalTransition function inserts into signal_transitions table (line 249). If this table does not exist in Supabase, every price tick that triggers a transition will cause a database error. The admin client insert will fail, and while the function catches the error and logs it, the signal_tracking row will already have been updated without a corresponding audit record, creating an inconsistent state." },
  { q: "Q11: Are there any importers of normalization/types.ts in the staged changes?",
    a: "ZERO importers found. The rg search for \"normalization/types\" returned no results. This file defines CanonicalAsset, CanonicalPair, CanonicalCandle, CanonicalTicker, NormalizerAdapter, and computeConfidence - a complete normalization framework. But no code imports it. It is dead code - architecture preparation with no consumers." },
  { q: "Q12: Is errors.ts imported by any file outside the staged changes?",
    a: "PARTIAL. errors.ts is imported by signal-transition.service.ts (fromSupabaseError) within the staged Group B. No other files outside the staged changes import from errors.ts (rg search shows zero results outside the file itself and the service). The DomainError, ValidationError, and other classes defined in errors.ts have no external consumers yet." },
  { q: "Q13: Is the alchemy-rpc.ts deletion safe?",
    a: "YES. The file is staged for deletion (177 lines removed). rg search for \"alchemy-rpc\" in src/ returns zero results, confirming no remaining imports. The deletion is a clean dead-code removal with no risk of breaking existing functionality." },
];

for (const item of questions) {
  content.push(h2(item.q));
  content.push(body(item.a));
}

// ── 4. Maturity Matrix ──
content.push(h1("4. Maturity Matrix"));
content.push(body(
  "Each staged file is evaluated against a four-level maturity model. The levels are: EXISTS (file exists in staging), " +
  "WIRED (imported by at least one other file), RUNTIME-USED (called during execution, not just type-checked), " +
  "and PROVEN (covered by passing tests). Files that are EXISTS-only represent dead code or premature architecture. " +
  "Files that reach PROVEN are production-ready. The matrix below classifies every staged file."
));

content.push(makeTable(
  ["File", "EXISTS", "WIRED", "RUNTIME-USED", "PROVEN", "Classification"],
  [
    ["transition-engine.ts", "Y", "Y (service, barrel, test)", "Y (called by service)", "Y (engine tests pass)", "A - Core, Ready"],
    ["signal-transition.service.ts", "Y", "Y (server fn, barrel)", "Y (HTTP endpoint)", "Y (service tests pass)", "A - Core, Ready"],
    ["transition.server.fn.ts", "Y", "Y (barrel, use-signal-monitor)", "Y (TanStack server fn)", "Partial (no e2e)", "A - Core, Ready"],
    ["use-signal-monitor.ts", "Y", "Y (signals.tsx)", "Y (React hook)", "No unit tests", "A - Core, No Tests"],
    ["signal-transition.service.test.ts", "Y", "Y (vitest)", "Y (CI pipeline)", "N/A (is a test)", "A - Core, Ready"],
    ["transition-engine.test.ts", "Y", "Y (vitest)", "Y (CI pipeline)", "N/A (is a test)", "A - Core, Ready"],
    ["index.ts (signal-tracking barrel)", "Y", "Y (domain consumers)", "Y (barrel re-export)", "Implicit", "A - Core, Ready"],
    ["supabase/types.ts", "Y", "Y (service)", "Y (type-check)", "Implicit", "A - Core, Ready"],
    ["orchestrator.ts (events)", "Y", "Y (service via dynamic import)", "Partial (emit only, no consumers)", "No direct tests", "B - Wired, Partial"],
    ["errors.ts", "Y", "Y (service: fromSupabaseError)", "Y (error classification)", "No dedicated tests", "B - Wired, Partial"],
    ["signal_transitions migration", "Y", "N/A (SQL)", "BLOCKER if not applied", "N/A (migration)", "A - Core, BLOCKER"],
    ["invalidated migration", "Y", "N/A (SQL)", "Required for engine", "N/A (migration)", "A - Core, BLOCKER"],
    ["debate/index.ts", "Y", "NO (zero importers)", "NO", "NO", "D - Dead Code"],
    ["normalization/types.ts", "Y", "NO (zero importers)", "NO", "NO", "D - Dead Code"],
    ["alchemy-rpc.ts (deletion)", "N/A", "N/A (deleted)", "N/A", "N/A", "F - Safe Deletion"],
  ]
));

// ── 5. File Classification ──
content.push(h1("5. File Classification"));
content.push(body(
  "Each file is assigned one of six classifications (A through F) based on its role, maturity, and risk profile. " +
  "This classification determines the recommended action for the Phase 3 gate."
));

content.push(h2("5.1 Classification Definitions"));
content.push(makeTable(
  ["Class", "Definition", "Action"],
  [
    ["A", "Core Transition Engine file - directly involved in the server-authoritative transition path", "Include in Phase 3 commit"],
    ["B", "Supporting infrastructure - wired but incomplete or without dedicated tests", "Include with caveats"],
    ["C", "Deferred work - architecture preparation with no current consumers", "Defer to future phase"],
    ["D", "Dead code - zero importers, no runtime usage", "Remove from staging"],
    ["E", "Overengineering - introduces unnecessary abstraction or complexity", "Reject"],
    ["F", "Safe deletion - removal of confirmed dead code", "Include (clean removal)"],
  ]
));

content.push(h2("5.2 Individual File Classifications"));
content.push(makeTable(
  ["File", "Class", "Rationale"],
  [
    ["transition-engine.ts", "A", "Pure domain logic, zero deps, fully tested, core of the transition system"],
    ["signal-transition.service.ts", "A", "Server-side orchestration: fetches state, calls engine, writes audit, emits events"],
    ["transition.server.fn.ts", "A", "TanStack server function exposing the transition endpoint with auth middleware"],
    ["use-signal-monitor.ts", "A", "Client-side hook that drives the entire monitoring loop via requestSignalTransition"],
    ["signal-transition.service.test.ts", "A", "11 test cases covering service path, validation, concurrency, and audit"],
    ["transition-engine.test.ts", "A", "Comprehensive engine tests (verified in Phase 2 CI run)"],
    ["index.ts (barrel)", "A", "Barrel re-export enabling clean imports from domain consumers"],
    ["supabase/types.ts", "A", "TypeScript types for signal_transitions table, required for type-safe service"],
    ["signal_transitions migration", "A", "DDL for audit table, CRITICAL BLOCKER if not applied before deployment"],
    ["invalidated migration", "A", "Adds invalidated to signal_status enum + extends monitored index"],
    ["orchestrator.ts", "B", "Event bus infrastructure; signal.transition.completed defined but has zero consumers"],
    ["errors.ts", "B", "Domain error types; fromSupabaseError used by service, but no other consumers yet"],
    ["debate/index.ts", "D", "DebateResult type only, zero importers in staged or committed code"],
    ["normalization/types.ts", "D", "Full normalization framework (192 lines), zero importers anywhere in codebase"],
    ["alchemy-rpc.ts", "F", "177-line dead file, zero importers, clean deletion"],
  ]
));

// ── 6. Dependency Chain Analysis ──
content.push(h1("6. Dependency Chain Analysis"));
content.push(body(
  "The Group B files form a strict linear dependency chain. Breaking this chain at any point will cause type errors or " +
  "runtime failures. The migration dependency is particularly critical: the signal_transitions table must exist in the " +
  "production Supabase instance before the transition service can write audit records."
));

content.push(h2("6.1 Import Dependency Chain"));
content.push(body(
  "The dependency chain flows from database schema through type generation, domain logic, server function, and finally to the client hook. " +
  "Each link in the chain is required for the system to function. The invalidated migration must be applied first (it extends the signal_status enum), " +
  "then the signal_transitions migration (it creates the audit table). The generated types (supabase/types.ts) depend on both migrations being applied. " +
  "The errors.ts module provides fromSupabaseError which is imported by the service. The service imports the engine. " +
  "The server function imports the service. The barrel exports the server function. The hook imports the barrel."
));

content.push(h2("6.2 Runtime Dependency on Supabase"));
content.push(body(
  "The signal_transitions table is not just a compile-time dependency. The executeSignalTransition function performs a " +
  "two-step write: first updating signal_tracking (line 227), then inserting into signal_transitions (line 249). " +
  "If the signal_transitions table does not exist, the second step fails. The code catches this error and logs it but does NOT " +
  "roll back the first step (signal_tracking update). This means every transition will succeed in changing the signal status " +
  "but fail to create an audit record, creating a silent data integrity gap. The migration MUST be applied before deployment."
));

content.push(h2("6.3 Risk: useSignalMonitor DB Errors on Every Tick"));
content.push(body(
  "If the migration is not applied, useSignalMonitor will trigger a server call on every price tick (for every active/pending tracking). " +
  "Each call will succeed in updating the signal (if price triggers a transition) but will log an AUDIT FAILURE error. " +
  "In a production environment with multiple users and multiple active trackings, this could generate thousands of error logs per hour. " +
  "The transition itself would still work (status changes), but the audit trail would be completely missing. This is a " +
  "functional correctness issue masked as a non-critical error."
));

// ── 7. Known Gaps and Risks ──
content.push(h1("7. Known Gaps and Risks"));

content.push(h2("7.1 No Consumers for signal.transition.completed Event"));
content.push(body(
  "The VixorEvents.emit call in the transition service emits \"signal.transition.completed\" events, but no handler is registered " +
  "for this event type. The event orchestrator supports handler registration via VixorEvents.on(), but no code calls this for the " +
  "transition event. The events are effectively emitted into a void. This is not a bug (the emit is fire-and-forget), but it means " +
  "the event infrastructure in orchestrator.ts is partially dead code for Phase 3. The existing VixorEventMap type definition for " +
  "\"signal.transition.completed\" is correctly shaped and ready for future consumers (MOXI, notifications), but no consumers exist today."
));

content.push(h2("7.2 use-signal-monitor.ts Has No Unit Tests"));
content.push(body(
  "The useSignalMonitor hook is the most critical client-side component in Phase 3 - it drives the entire real-time monitoring " +
  "loop. Yet it has zero dedicated unit tests. The hook depends on useLivePrices (WebSocket), useStableServerFn (TanStack), " +
  "and requestSignalTransition (server function). Testing it would require mocking all three dependencies plus React render hooks. " +
  "The absence of tests is a risk, but the hook is essentially a thin orchestration layer that delegates all business logic " +
  "to the server (which is fully tested). The main risk is in the price deduplication logic and the pendingTransitions debounce."
));

content.push(h2("7.3 Non-Atomic Two-Step Write"));
content.push(body(
  "The transition service performs two database operations sequentially: (1) UPDATE signal_tracking, (2) INSERT into signal_transitions. " +
  "These are NOT wrapped in a database transaction because Supabase client/PostgREST API does not support cross-table transactions " +
  "from the application layer. The code documents this as a \"known limitation.\" If the second operation fails, the signal is already " +
  "updated but the audit record is missing. The admin client is used to ensure both operations run under the same service-role context, " +
  "but this does not provide true atomicity. A true solution would require a Supabase RPC function with a PL/pgSQL transaction block."
));

content.push(h2("7.4 Event Orchestrator Scope Creep"));
content.push(body(
  "The orchestrator.ts file (358 lines) defines a comprehensive event system with typed events, handler registration, " +
  "persistence configuration, and introspection. However, for Phase 3, only one event type (\"signal.transition.completed\") is " +
  "emitted, and zero handlers consume it. The orchestrator was introduced as infrastructure for future event-driven features (MOXI, " +
  "notifications, audit replay), but in the current scope it is significantly overbuilt. The signal.transition.completed event " +
  "could have been a simple console.log or a direct function call without the full event bus infrastructure."
));

// ── 8. Gate Verdict ──
content.push(h1("8. Gate Verdict"));

content.push(h2("8.1 Recommended Option: B - Commit with Exclusions"));
content.push(body(
  "Option A (commit all) is rejected because it includes dead code files that add noise and increase the attack surface " +
  "without providing any runtime value. Option C (commit nothing) is rejected because the core transition engine is well-tested, " +
  "properly structured, and represents genuine production value. Option B is the recommended path: commit the core transition " +
  "engine files (Class A and B), the safe deletion (Class F), and defer the dead code (Class D)."
));

content.push(h2("8.2 Commit Scope (Option B)"));
content.push(makeTable(
  ["File", "Class", "Include?"],
  [
    ["supabase/migrations/20260809000000_add_invalidated_to_signal_status.sql", "A", "YES"],
    ["supabase/migrations/20260811000000_add_signal_transitions.sql", "A", "YES"],
    ["src/shared/supabase/types.ts", "A", "YES"],
    ["src/shared/errors.ts", "B", "YES (service depends on it)"],
    ["src/domains/signal-tracking/transition-engine.ts", "A", "YES"],
    ["src/domains/signal-tracking/transition-engine.test.ts", "A", "YES"],
    ["src/domains/signal-tracking/signal-transition.service.ts", "A", "YES"],
    ["src/domains/signal-tracking/signal-transition.service.test.ts", "A", "YES"],
    ["src/domains/signal-tracking/transition.server.fn.ts", "A", "YES"],
    ["src/domains/signal-tracking/index.ts", "A", "YES"],
    ["src/shared/events/orchestrator.ts", "B", "YES (service depends on emit)"],
    ["src/shared/hooks/use-signal-monitor.ts", "A", "YES"],
    ["src/domains/debate/index.ts", "D", "NO - defer"],
    ["src/shared/normalization/types.ts", "D", "NO - defer"],
    ["src/shared/market-data/alchemy-rpc.ts", "F", "YES (deletion)"],
  ]
));

content.push(h2("8.3 Pre-Commit Checklist"));
content.push(body(
  "Before committing, the following steps must be executed in order: First, apply the invalidated migration (ALTER TYPE signal_status ADD VALUE) to the production Supabase instance. " +
  "Second, apply the signal_transitions migration (CREATE TABLE) to the production Supabase instance. Third, regenerate the Supabase types to ensure the local types.ts matches the production schema. " +
  "Fourth, run the full test suite to confirm all tests pass including the new service and engine tests. " +
  "Fifth, unstage the Class D files (debate/index.ts and normalization/types.ts) from the git index. " +
  "Sixth, commit only the files listed in the Include column above as a single atomic commit."
));

content.push(h2("8.4 Post-Commit Validation"));
content.push(body(
  "After the commit, the following validations should be performed: Deploy to a staging environment and verify that " +
  "useSignalMonitor can successfully call requestSignalTransition without database errors. Confirm that signal_transitions " +
  "audit records are created for every valid transition. Verify that the old client-authoritative status update path still works " +
  "for non-transition status changes (cancel, manual update). Monitor the error logs for any AUDIT FAILURE messages. " +
  "Finally, verify that the event orchestrator emits \"signal.transition.completed\" events (even though no consumer exists yet) " +
  "to confirm the event infrastructure is functional for future consumers."
));

content.push(h2("8.5 Absolute Prohibitions"));
content.push(body(
  "The following items remain absolutely prohibited regardless of the gate verdict: No RPC functions, no event consumers, " +
  "no rate limiting, no enum migration (the invalidated migration is a value addition, not a full enum migration), " +
  "no normalization adapters, no new abstraction layers, no Phase 4 work, and no push to origin. These prohibitions are " +
  "carried forward from the Phase 2 stabilization gate and remain in effect until explicitly lifted."
));

// ═══════════════════════════════════════════════════════════════════════════════
// ASSEMBLE DOCUMENT
// ═══════════════════════════════════════════════════════════════════════════════

const coverChildren = buildCoverR1({
  title: "VIXOR Phase 3 Scope Gate",
  subtitle: "Signal Transition Engine - Staged Files Read-Only Audit",
  englishLabel: "VIXOR V2 STABILIZATION",
  metaLines: [
    "Date: 2026-08-11",
    "Commit: 7c9d99d7 (Phase 2 F1 Fix)",
    "Files Audited: 15 staged + 2 migrations",
    "Verdict: Option B - Commit with Exclusions",
  ],
  footerLeft: "VIXOR V2",
  footerRight: "Read-Only Audit Report",
  palette: coverPalette,
});

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: FONT_BODY, size: 24, color: c(P.body) },
        paragraph: { spacing: { line: 312 } },
      },
    },
  },
  sections: [
    // COVER SECTION
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 0, bottom: 0, left: 0, right: 0 },
        },
      },
      children: coverChildren,
    },
    // TOC SECTION
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "VIXOR Phase 3 Scope Gate", size: 16, color: c(P.secondary), font: FONT_BODY })],
          })],
        }),
      },
      children: [
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "Table of Contents", bold: true, size: 36, color: c(P.primary), font: FONT_HEADING })],
        }),
        new TableOfContents("Table of Contents", {
          hyperlink: true,
          headingStyleRange: "1-3",
        }),
        new Paragraph({
          spacing: { before: 200, after: 200 },
          children: [new TextRun({ text: "(Right-click the table of contents and select \"Update Field\" to refresh page numbers in Word)",
            size: 18, color: c(P.secondary), font: FONT_BODY, italics: true })],
        }),
        new Paragraph({ children: [new PageBreak()] }),
      ],
    },
    // BODY SECTION
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
          pageNumbers: { start: 1, formatType: "decimal" },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "VIXOR Phase 3 Scope Gate", size: 16, color: c(P.secondary), font: FONT_BODY })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: c(P.secondary), font: FONT_BODY })],
          })],
        }),
      },
      children: content,
    },
  ],
});

// ═══════════════════════════════════════════════════════════════════════════════
// WRITE
// ═══════════════════════════════════════════════════════════════════════════════
const OUTPUT = "/home/z/my-project/download/VIXOR_PHASE_3_SCOPE_GATE.docx";

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUTPUT, buf);
  console.log("Generated:", OUTPUT);
  console.log("Size:", (buf.length / 1024).toFixed(1), "KB");
}).catch((err) => {
  console.error("Generation error:", err);
  process.exit(1);
});

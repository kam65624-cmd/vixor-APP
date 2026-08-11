const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  PageBreak, Header, Footer, PageNumber, NumberFormat,
  AlignmentType, HeadingLevel, WidthType, BorderStyle, ShadingType,
  TableOfContents, LevelFormat,
} = require("docx");
const fs = require("fs");

// ── Palette: Cool + Heavy + Calm (Tech Audit) ──
const P = {
  primary: "1A1D23",
  body: "2C3038",
  secondary: "6B7280",
  accent: "3B82F6",
  surface: "F3F4F6",
  red: "EF4444",
  amber: "F59E0B",
  green: "22C55E",
  surfaceAlt: "E5E7EB",
};

const c = (hex) => hex.replace("#", "");
const allNoBorders = {
  top: { style: BorderStyle.NONE },
  bottom: { style: BorderStyle.NONE },
  left: { style: BorderStyle.NONE },
  right: { style: BorderStyle.NONE },
};

// ── Helpers ──
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200, line: 312 },
    children: [new TextRun({ text, bold: true, size: 32, font: { ascii: "Times New Roman", eastAsia: "SimHei" }, color: c(P.primary) })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 160, line: 312 },
    children: [new TextRun({ text, bold: true, size: 30, font: { ascii: "Times New Roman", eastAsia: "SimHei" }, color: c(P.primary) })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120, line: 312 },
    children: [new TextRun({ text, bold: true, size: 28, font: { ascii: "Times New Roman", eastAsia: "SimHei" }, color: c(P.primary) })],
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { after: 120, line: 312 },
    ...opts,
    children: [new TextRun({ text, size: 22, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: c(P.body) })],
  });
}

function bodyRuns(runs, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { after: 120, line: 312 },
    ...opts,
    children: runs,
  });
}

function bold(label, text) {
  return bodyRuns([
    new TextRun({ text: label, bold: true, size: 22, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: c(P.body) }),
    new TextRun({ text, size: 22, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: c(P.body) }),
  ]);
}

function red(text) {
  return new TextRun({ text, size: 22, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: c(P.red), bold: true });
}

function amber(text) {
  return new TextRun({ text, size: 22, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: c(P.amber), bold: true });
}

function green(text) {
  return new TextRun({ text, size: 22, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: c(P.green), bold: true });
}

function statusRun(text) {
  const t = text.trim();
  if (t === "VERIFIED" || t === "COMPLETE" || t === "PROVEN") return green(t);
  if (t === "PARTIAL" || t === "EXISTS") return amber(t);
  if (t === "BROKEN" || t === "INCORRECT" || t === "CONFLICTING") return red(t);
  return new TextRun({ text: t, size: 22, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: c(P.body) });
}

function bullet(text, level = 0) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { after: 60, line: 312 },
    indent: { left: 600 + level * 360 },
    children: [new TextRun({ text: `\u2022 ${text}`, size: 22, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: c(P.body) })],
  });
}

// ── Table builder ──
function auditTable(headers, rows, colWidths) {
  const total = colWidths.reduce((a, b) => a + b, 0);
  const pctWidths = colWidths.map((w) => Math.round((w / total) * 100));

  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: headers.map((h, i) =>
      new TableCell({
        width: { size: pctWidths[i], type: WidthType.PERCENTAGE },
        shading: { fill: c(P.primary), type: ShadingType.CLEAR },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "4B5563" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "4B5563" },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE },
        },
        children: [new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 40, after: 40 },
          children: [new TextRun({ text: h, bold: true, size: 18, font: { ascii: "Calibri", eastAsia: "SimHei" }, color: "FFFFFF" })],
        })],
      })
    ),
  });

  const dataRows = rows.map((row, ri) =>
    new TableRow({
      cantSplit: true,
      children: row.map((cell, ci) =>
        new TableCell({
          width: { size: pctWidths[ci], type: WidthType.PERCENTAGE },
          shading: ri % 2 === 1 ? { fill: c(P.surface), type: ShadingType.CLEAR } : undefined,
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
          },
          children: [new Paragraph({
            alignment: ci === 0 ? AlignmentType.LEFT : AlignmentType.LEFT,
            spacing: { before: 30, after: 30 },
            children: [typeof cell === "string" ? new TextRun({ text: cell, size: 18, font: { ascii: "Calibri", eastAsia: "SimSun" }, color: c(P.body) }) : cell],
          })],
        })
      ),
    })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
}

function statusCell(text) {
  const t = text.trim();
  if (t === "VERIFIED" || t === "COMPLETE" || t === "PROVEN") return green(t);
  if (t === "PARTIAL" || t === "EXISTS") return amber(t);
  if (t === "BROKEN" || t === "INCORRECT" || t === "CONFLICTING" || t === "NOT READY") return red(t);
  if (t === "READY") return green(t);
  return new TextRun({ text: t, size: 18, font: { ascii: "Calibri", eastAsia: "SimSun" }, color: c(P.body) });
}

function spacer() {
  return new Paragraph({ spacing: { after: 80 }, children: [] });
}

// ═══════════════════════════════════════════════════════════════════════════════
// DOCUMENT CONTENT
// ═══════════════════════════════════════════════════════════════════════════════

const coverChildren = [
  new Paragraph({ spacing: { before: 4800 }, children: [] }),
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { after: 200 },
    children: [new TextRun({ text: "VIXOR V2", size: 72, bold: true, font: { ascii: "Times New Roman" }, color: c(P.accent) })],
  }),
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { after: 600 },
    children: [new TextRun({ text: "Phase 0 \u2192 3 Integration Audit", size: 48, bold: true, font: { ascii: "Times New Roman" }, color: c(P.primary) })],
  }),
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { after: 100 },
    children: [new TextRun({ text: "Pre-Commit Gate | Read-Only | No Modifications", size: 24, font: { ascii: "Calibri" }, color: c(P.secondary) })],
  }),
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { after: 100 },
    children: [new TextRun({ text: "Date: 2026-08-11 | Branch: main | HEAD: 32bbf14", size: 22, font: { ascii: "Calibri" }, color: c(P.secondary) })],
  }),
  new Paragraph({
    alignment: AlignmentType.LEFT,
    children: [new TextRun({ text: "Status: 357 tests passing | Typecheck clean | Build successful", size: 22, font: { ascii: "Calibri" }, color: c(P.green) })],
  }),
];

const tocSection = [
  new Paragraph({
    spacing: { before: 200, after: 200 },
    children: [new TextRun({ text: "Table of Contents", bold: true, size: 32, font: { ascii: "Times New Roman", eastAsia: "SimHei" }, color: c(P.primary) })],
  }),
  new TableOfContents("Table of Contents", {
    hyperlink: true,
    headingStyleRange: "1-3",
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 200 },
    children: [new TextRun({ text: "(Right-click TOC and select \u201cUpdate Field\u201d to refresh page numbers)", italics: true, size: 18, color: c(P.secondary), font: { ascii: "Calibri" } })],
  }),
  new Paragraph({ children: [new PageBreak()] }),
];

// ── 1. Executive Summary ──
const sec1 = [
  h1("1. Executive Summary"),
  body("This integration audit examines the cumulative state of the VIXOR V2 codebase after four consecutive phases of transformation: Phase 0 (Reality Baseline), Phase 1 (Architecture + OSS Decision Freeze), Phase 2 (Foundation / Data / Authority), and Phase 3 (Signal Engine). The audit was conducted in strict read-only mode with no code modifications, commits, or pushes."),
  body("The objective is to answer one question: Is VIXOR V2 currently internally consistent, integrated, non-regressive, and safe to freeze into a single consolidation commit? The answer is nuanced. The codebase passes all automated gates (357 tests, zero failures, clean typecheck, successful production build). However, several architectural concerns prevent an unconditional recommendation to proceed."),
  bodyRuns([
    new TextRun({ text: "Critical Findings: ", bold: true, size: 22, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: c(P.body) }),
    red("3 BLOCKERS"),
    new TextRun({ text: ", ", size: 22, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: c(P.body) }),
    amber("7 WARNINGS"),
    new TextRun({ text: ", 12 VERIFIED items. The three blockers are: (1) signal transition state and audit record are not transactionally atomic, (2) old client-authoritative functions remain callable and can bypass the Transition Engine, and (3) the event system emits signal.transition.completed but has zero registered handlers, making the event infrastructure effectively a no-op.", size: 22, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: c(P.body) }),
  ]),
  body("Despite these blockers, no regressions were found. The test count grew from 307 (Phase 0 baseline) to 327 (Phase 2) to 357 (Phase 3), with zero failures throughout. The server-authoritative transition path is correctly wired and functioning. The Transition Engine remains pure domain logic with zero side effects. The fundamental architecture is sound."),
];

// ── 2. Git State ──
const sec2 = [
  h1("2. Git State"),
  h2("2.1 Repository Position"),
  auditTable(
    ["Property", "Value"],
    [
      ["HEAD", "32bbf14 feat(signal-tracking): unify terminal status contract (Task 1.2C)"],
      ["Branch", "main"],
      ["Working Tree", "131 files staged, 0 unstaged, 0 untracked"],
      ["Staged", "All Phase 2+3 work staged (src/, migrations/, scripts/, docs/)"],
      ["Unstaged", "NONE"],
      ["Untracked", "NONE"],
      ["Commits Since Baseline", "1 committed (32bbf14); diverged from origin/main by 1 commit"],
      ["Files Modified Since Baseline", "131 files (+7268 / -378 lines)"],
      ["Phase 0/1 Work", "Committed in HEAD (32bbf14 includes 1.2C changes)"],
      ["Phase 2 Work", "STAGED (trades/functions.ts, trades/types.ts, errors.ts, normalization/types.ts, supabase/types.ts)"],
      ["Phase 3 Work", "STAGED (signal-transition.service.ts, transition.server.fn.ts, service tests, migration, orchestrator.ts, use-signal-monitor.ts)"],
    ],
    [25, 75]
  ),
  spacer(),
  h2("2.2 Source File Classification"),
  body("All Phase 2 and Phase 3 source code changes are staged (git add applied) but NOT committed. The last commit (32bbf14) contains Phase 0/1 work including Task 1.2C terminal status contract unification. No unstaged or untracked source files exist in the working tree. The 131 staged files include 87 script/report generation files, 4 authoritative DOCX reports, 40+ search JSON artifacts from Phase 0 OSS research, and approximately 13 substantive source code files."),
];

// ── 3. Phase 0 Verification ──
const sec3 = [
  h1("3. Phase 0 Verification (F1-F18)"),
  body("Phase 0 identified 18 findings (F1-F18) in the Reality Baseline. Each finding was assigned an expected resolution phase. The table below verifies the current code status of every finding against the original claim."),
  spacer(),
  auditTable(
    ["F#", "Finding", "Severity", "Resolution Phase", "Current Status", "Evidence"],
    [
      ["F1", "createTrade drops fields", "CRITICAL", "Phase 2", statusCell("VERIFIED"), "Zod schema validates all fields; insert row constructed from parsed data; 20 regression tests"],
      ["F2", "Supabase types manually written", "HIGH", "Phase 2", statusCell("PARTIAL"), "types.ts expanded to 956 lines; signal_transitions table added; but still manually maintained, not auto-generated"],
      ["F3", "No server authority boundary", "CRITICAL", "Phase 2/3", statusCell("VERIFIED"), "requireSupabaseAuth middleware on all server functions; userId from session, not client"],
      ["F4", "No validation boundary", "HIGH", "Phase 2", statusCell("PARTIAL"), "Zod validation on trades domain; signal-tracking uses manual validation; no cross-domain validation framework"],
      ["F5", "No error model", "MEDIUM", "Phase 2", statusCell("VERIFIED"), "errors.ts: DomainError, ValidationError, NotFoundError, ForbiddenError, ConflictError, ProviderError, fromSupabaseError"],
      ["F6", "No canonical data model", "HIGH", "Phase 2", statusCell("PARTIAL"), "normalization/types.ts defines CanonicalAsset, CanonicalPair, CanonicalCandle, CanonicalTicker, NormalizerAdapter; zero adapters implemented"],
      ["F7", "Signal engine not runtime-called", "CRITICAL", "Phase 3", statusCell("VERIFIED"), "requestSignalTransition wired through useSignalMonitor; server-authoritative path operational"],
      ["F8", "No event system", "MEDIUM", "Phase 3", statusCell("PARTIAL"), "EventOrchestrator class with typed events; signal.transition.completed emitted; zero registered handlers"],
      ["F9", "No audit trail", "HIGH", "Phase 3", statusCell("VERIFIED"), "signal_transitions table with migration; from_status, to_status, server_received_at recorded"],
      ["F10", "Client-controlled timestamps", "HIGH", "Phase 3", statusCell("VERIFIED"), "serverReceivedAt generated server-side via new Date().toISOString(); client cannot set it"],
      ["F11", "No concurrency protection", "HIGH", "Phase 3", statusCell("VERIFIED"), "Optimistic locking via updated_at; CONFLICT returned on stale version"],
      ["F12", "Dead code in signal-tracking", "LOW", "Deferred", statusCell("EXISTS"), "previous_price dead-field documented; updateExcursions zero callers; evaluateTrackingPrice still exported but unused by UI"],
      ["F13", "43 files with as any", "MEDIUM", "Deferred", statusCell("EXISTS"), "43 files still contain as any; signal-tracking/functions.ts line 134 uses as any for update; trades domain clean"],
      ["F14", "Missing 18 DB tables", "HIGH", "Phase 2", statusCell("PARTIAL"), "signal_transitions added; trades aligned; canonical data tables not created (deferred)"],
      ["F15", "No normalization pipeline", "MEDIUM", "Deferred", statusCell("EXISTS"), "Types defined (NormalizerAdapter); no runtime adapters implemented"],
      ["F16", "Route fragmentation", "MEDIUM", "Deferred", statusCell("EXISTS"), "41 routes exist; consolidation planned but deferred"],
      ["F17", "No idempotency keys", "MEDIUM", "Deferred", statusCell("EXISTS"), "No idempotency mechanism; duplicate signal tracking prevention only for same user+signal_id"],
      ["F18", "RLS gaps", "HIGH", "Phase 2/3", statusCell("PARTIAL"), "signal_transitions has RLS (select own + service_role); signal_tracking RLS relies on PostgREST auth context"],
    ],
    [5, 18, 10, 12, 12, 43]
  ),
  spacer(),
  h2("3.1 Phase 0 Summary"),
  bodyRuns([
    new TextRun({ text: "Phase 0 Status: ", bold: true, size: 22, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: c(P.body) }),
    amber("PARTIAL"),
  ]),
  body("Of 18 findings, 7 are VERIFIED (fully resolved), 6 are PARTIAL (types exist but not fully wired), and 5 are EXISTS (documented but deferred). No findings are BROKEN or INCORRECT. All CRITICAL-severity findings (F1, F3, F7, F10, F11) are VERIFIED. The remaining PARTIAL items require future phase work but do not represent regressions."),
];

// ── 4. Phase 1 Verification ──
const sec4 = [
  h1("4. Phase 1 Architecture Decision Freeze Check"),
  body("Phase 1 froze 14 major architectural decisions. Each is verified against the current codebase below. Any deviation is classified as intentional, accidental, or unresolved."),
  spacer(),
  auditTable(
    ["Decision", "Expected", "Compliant?", "Evidence", "Deviation"],
    [
      ["Server Authority", "All mutations server-validated", statusCell("VERIFIED"), "requireSupabaseAuth on all server fns; userId from session", "NONE"],
      ["Capability-First", "Domains own their logic", statusCell("VERIFIED"), "signal-tracking/, trades/, discovery/ domains with internal types+functions", "NONE"],
      ["Reality Baseline Wins", "No ideology over evidence", statusCell("VERIFIED"), "Phase 2/3 followed F1-F18 priorities", "NONE"],
      ["Minimum Powerful Stack", "No unnecessary deps", statusCell("VERIFIED"), "No Mastra/Trigger.dev/NATS introduced; technicalindicators used", "NONE"],
      ["Two-Vertical Separation", "On-chain vs Markets separate", statusCell("VERIFIED"), "On-chain deferred; Markets vertical (signals, trades, charts) active", "NONE"],
      ["No Regressions", "Tests must grow, never shrink", statusCell("VERIFIED"), "307 -> 327 -> 357 tests; 0 failures throughout", "NONE"],
      ["Vercel AI SDK Primary", "AI via Vercel AI SDK", statusCell("VERIFIED"), "moxi/ domain uses Vercel AI SDK", "NONE"],
      ["Mastra POC Only", "Mastra not in production", statusCell("VERIFIED"), "No Mastra imports in src/; referenced only in search research", "NONE"],
      ["technicalindicators", "Not tulip-node", statusCell("VERIFIED"), "technicalindicators in package.json", "NONE"],
      ["Supabase Job Queue", "Direction for future", statusCell("EXISTS"), "No job queue implemented; documented as future direction", "NONE (deferred)"],
      ["On-chain Deferred", "No on-chain in Phase 2-3", statusCell("VERIFIED"), "No Solana/Web3 trading code added", "NONE"],
      ["Futures Deferred", "No futures trading", statusCell("VERIFIED"), "perpetuals.tsx route exists but no futures logic added", "NONE"],
      ["Route Consolidation", "39 -> 12 core experiences", statusCell("PARTIAL"), "41 routes still exist; consolidation planned but not executed", "Accidental (not yet done)"],
      ["Canonical Data Models", "Provider-agnostic types", statusCell("PARTIAL"), "Types defined in normalization/types.ts; zero adapters implemented", "Accidental (incomplete)"],
    ],
    [16, 20, 12, 28, 24]
  ),
  spacer(),
  h2("4.1 Phase 1 Summary"),
  bodyRuns([
    new TextRun({ text: "Phase 1 Status: ", bold: true, size: 22, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: c(P.body) }),
    amber("PARTIAL"),
  ]),
  body("12 of 14 decisions are fully COMPLIANT. Two decisions (route consolidation and canonical data models) are PARTIAL because the implementation work was deferred to future phases. These are documented deferrals, not violations. No decisions are INCORRECT or CONFLICTING."),
];

// ── 5. Phase 2 Verification ──
const sec5 = [
  h1("5. Phase 2 Audit (Tasks 2.1-2.10)"),
  spacer(),
  auditTable(
    ["Task", "Description", "Implemented?", "Integrated?", "Tests?", "Gaps?"],
    [
      ["2.1", "Canonical Model Audit", statusCell("PARTIAL"), statusCell("EXISTS"), "None", "Types exist, no adapters, no consumers"],
      ["2.2", "DB <-> Types Alignment", statusCell("VERIFIED"), statusCell("VERIFIED"), "None", "signal_transitions types match migration; signal_tracking aligned"],
      ["2.3", "Fix createTrade (F1)", statusCell("VERIFIED"), statusCell("VERIFIED"), "20 tests", "None"],
      ["2.4", "Server Authority Foundation", statusCell("VERIFIED"), statusCell("VERIFIED"), "3 tests", "All server fns use requireSupabaseAuth"],
      ["2.5", "Data Normalization Foundation", statusCell("PARTIAL"), statusCell("EXISTS"), "None", "Types only; no runtime adapters"],
      ["2.6", "Validation Boundary", statusCell("PARTIAL"), statusCell("VERIFIED"), "7 tests", "Trades use Zod; signals use manual validation"],
      ["2.7", "Error Model", statusCell("VERIFIED"), statusCell("VERIFIED"), "None", "6 error classes + fromSupabaseError"],
      ["2.8", "Identity/Ownership/Authority", statusCell("VERIFIED"), statusCell("VERIFIED"), "3 tests", "userId from session; .eq(user_id, userId) on all queries"],
      ["2.9", "Idempotency/Duplicate Protection", statusCell("PARTIAL"), statusCell("PARTIAL"), "None", "Signal create has duplicate check; no general idempotency"],
      ["2.10", "Remove Duplication", statusCell("PARTIAL"), statusCell("EXISTS"), "None", "Old functions documented but not removed; alchemy-rpc deleted"],
    ],
    [6, 20, 12, 12, 8, 42]
  ),
  spacer(),
  h2("5.1 Phase 2 Critical: createTrade Verification"),
  body("The F1 fix (Task 2.3) was independently verified. The createTrade server function now accepts all trade parameters through a Zod schema, constructs a complete insert row, and persists it via Supabase. The verification confirmed: (1) pair, direction, entry_price, stop_loss, take_profit, amount, leverage, notes, strategy all survive the full path from UI to DB. (2) user_id is taken from the authenticated session, never from the client request. (3) Generated columns (pnl, pnl_pips, r_multiple) are never included in inserts. (4) No as any casts are used in the new trades code. (5) The amount field is correctly mapped to quantity in the database."),
  h2("5.2 Phase 2 Summary"),
  bodyRuns([
    new TextRun({ text: "Phase 2 Status: ", bold: true, size: 22, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: c(P.body) }),
    amber("PARTIAL"),
  ]),
  body("Phase 2 successfully resolved the CRITICAL F1 finding and established foundational infrastructure (error model, server authority, type alignment). Four tasks are fully VERIFIED (2.2, 2.3, 2.4, 2.7, 2.8). Five tasks are PARTIAL because they established types/foundations without completing full runtime integration. No task is BROKEN or regressive."),
];

// ── 6. Phase 3 Audit ──
const sec6 = [
  h1("6. Phase 3 Audit (Tasks 3.0-3.15)"),
  spacer(),
  auditTable(
    ["Task", "Description", "Status", "Evidence", "Remaining"],
    [
      ["3.0", "Pre-Implementation Checkpoint", statusCell("VERIFIED"), "Git status, branch, HEAD verified; 327 baseline confirmed", "None"],
      ["3.1", "Signal Lifecycle Audit", statusCell("VERIFIED"), "Full lifecycle traced; maturity classified", "None"],
      ["3.2", "Server-Side Transition Invocation", statusCell("VERIFIED"), "transition.server.fn.ts + requestSignalTransition", "None"],
      ["3.3", "Authoritative Timestamp", statusCell("VERIFIED"), "serverReceivedAt = new Date().toISOString() server-side", "None"],
      ["3.4", "Signal Transition Persistence", statusCell("VERIFIED"), "signal_transitions table + migration + RLS", "None"],
      ["3.5", "Atomic Transition Commit", red("NOT COMPLETE"), "Sequential: update then insert; NOT wrapped in transaction", "BLOCKER: Needs DB RPC or Supabase transaction"],
      ["3.6", "Concurrency Protection", statusCell("VERIFIED"), "Optimistic locking via updated_at; CONFLICT code", "None"],
      ["3.7", "Client Authority Removal", red("PARTIAL"), "useSignalMonitor uses server path; old functions still exported", "BLOCKER: updateSignalTracking, cancelSignalTracking still callable"],
      ["3.8", "Signal Validation Boundary", statusCell("VERIFIED"), "Server fn validates trackingId, currentVersion, observedPrice, requestedTransition", "None"],
      ["3.9", "Domain Events", amber("PARTIAL"), "signal.transition.completed emitted; zero handlers registered", "WARNING: Event infrastructure is a no-op"],
      ["3.10", "Signal Auditability", statusCell("VERIFIED"), "signal_transitions records from/to/event/price/timestamp/actor", "None"],
      ["3.11", "Error Model Integration", statusCell("VERIFIED"), "fromSupabaseError used in service; structured error codes", "None"],
      ["3.12", "Testing", statusCell("VERIFIED"), "30 new tests (30 service + 0 engine); 357 total; 0 failures", "Missing: DB integration, RLS, concurrent race tests"],
      ["3.13", "Runtime Proof", amber("PARTIAL"), "Server path wired and functional; depends on browser open", "WARNING: Not a background server monitor"],
      ["3.14", "Regression Check", statusCell("VERIFIED"), "357 tests pass (307 baseline + 50 new); 0 failures", "None"],
      ["3.15", "Final Audit", statusCell("PARTIAL"), "Report generated; this document serves as independent audit", "3 blockers identified"],
    ],
    [5, 22, 12, 38, 23]
  ),
  spacer(),
  h2("6.1 BLOCKER: Atomic Transition Commit (Task 3.5)"),
  body("The signal state update and audit record insert are sequential operations in executeSignalTransition(). The code explicitly documents this limitation at lines 188-200 of signal-transition.service.ts. The signal update uses the admin client with optimistic locking. If the update succeeds but the audit insert fails, the signal state is updated without a corresponding audit record. The code logs the error but does NOT roll back the signal update."),
  body("This is a known, documented limitation. The Supabase client/PostgREST API does not support cross-table transactions. The recommended resolution is a database RPC function that wraps both operations in a single PostgreSQL transaction. This should be addressed in the correct future phase and is classified as a BLOCKER for the pre-commit gate."),
  h2("6.2 BLOCKER: Old Functions Still Callable (Task 3.7)"),
  body("updateSignalTracking (functions.ts:99-196) remains a public server function exported from index.ts. It accepts a raw status from the client and writes it directly to the database, bypassing the Transition Engine entirely. Similarly, cancelSignalTracking (functions.ts:200-226) directly sets status to cancelled without Transition Engine validation. These functions have no callers in src/ routes (verified by grep), but they are exported and accessible via TanStack server functions, meaning any client that imports and calls them can bypass the server-authoritative path."),
  body("Classification: These are compatibility shims that should be DEPRECATED (not deleted) in the next phase. The safest migration path is: (1) mark them with @deprecated JSDoc, (2) add a console.warn on invocation, (3) remove from the barrel export in a subsequent phase after confirming no external consumers."),
  h2("6.3 WARNING: Event System is a No-Op (Task 3.9)"),
  body("The signal.transition.completed event is defined in orchestrator.ts (line 88-100) with full type safety. The signal-transition.service.ts emits it after every successful transition (line 283). However, a codebase-wide search confirms zero registered handlers exist. The VixorEvents.on() method is called nowhere in src/ (only in a usage example comment in orchestrator.ts). The event is emitted into a void with no consumers, no notification integration, and no persistence."),
  h2("6.4 Phase 3 Summary"),
  bodyRuns([
    new TextRun({ text: "Phase 3 Status: ", bold: true, size: 22, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: c(P.body) }),
    red("PARTIAL"),
  ]),
  body("Phase 3 successfully established the server-authoritative transition path with 13 of 16 tasks VERIFIED. Three tasks have gaps: Task 3.5 (atomicity) is a BLOCKER, Task 3.7 (old functions) is a BLOCKER, and Task 3.9 (events) is a WARNING. The core signal lifecycle is server-authoritative and functional, but the infrastructure is not yet complete."),
];

// ── 7. Cross-Phase Conflicts ──
const sec7 = [
  h1("7. Cross-Phase Conflicts"),
  body("The audit found zero cross-phase conflicts. Phase 2 and Phase 3 changes are additive and non-interfering. The Phase 3 signal transition service correctly imports and uses the Phase 2 error model (fromSupabaseError). The Phase 2 trades domain is completely independent from the Phase 3 signal-tracking domain. No shared types were modified in conflicting ways. No imports were broken."),
  body("The only tension is architectural: Phase 2 established validation patterns (Zod schemas) that Phase 3 did not fully adopt for signal-tracking (Phase 3 uses manual validation in the server function validator). This is not a conflict but a consistency gap that should be addressed in a future alignment pass."),
];

// ── 8. Security Audit ──
const sec8 = [
  h1("8. Security Audit"),
  h2("8.1 supabaseAdmin Usage"),
  body("The supabaseAdmin client (service-role key) is used in exactly one Phase 2/3 file: signal-transition.service.ts (line 202). The reason is documented: the service needs to perform both a signal update and an audit insert, and the user-authenticated client cannot guarantee atomicity. The admin client bypasses RLS, which is acceptable here because: (1) the function first fetches the signal using the user-authenticated client (line 120-125), verifying ownership via .eq(user_id, userId). (2) The admin update also includes .eq(user_id, userId) as a safety check (line 232). (3) The service is a server function protected by requireSupabaseAuth middleware."),
  body("However, this pattern means the RLS policy on signal_tracking is technically bypassed for the update operation. The ownership check is done in application code, not in the database. If the application-level check were ever bypassed (e.g., by a direct API call to the admin endpoint), the RLS would not provide defense-in-depth. This is an acceptable trade-off documented for future resolution via a database RPC function."),
  h2("8.2 Client-Controlled State"),
  body("The audit verified that clients cannot: (1) set the signal status directly (Transition Engine determines the outcome), (2) control serverReceivedAt (generated server-side), (3) bypass ownership checks (userId from session), (4) modify generated columns (pnl, pnl_pips, r_multiple), (5) inject user_id into trade creation (Zod schema strips unknown fields). These invariants are enforced through a combination of Zod validation, server-side logic, and database constraints."),
  h2("8.3 Remaining Security Concerns"),
  bullet("updateSignalTracking still accepts a raw status from the client and writes it directly. This is the BLOCKER identified in Task 3.7."),
  bullet("The signal_transitions table uses TEXT for from_status/to_status instead of the signal_status enum. This means invalid status values could theoretically be inserted, though the Transition Engine would never produce them."),
  bullet("No rate limiting exists on requestSignalTransition. A malicious client could flood the endpoint with transition requests."),
  bullet("The service-role key usage in signal-transition.service.ts is a necessary compromise but reduces defense-in-depth."),
];

// ── 9. Database Audit ──
const sec9 = [
  h1("9. Database / Types / Migrations Audit"),
  h2("9.1 signal_tracking Table"),
  body("The signal_tracking table is backed by a PostgreSQL ENUM (signal_status) with 9 values: pending, active, tp1_hit, tp2_hit, tp3_hit, sl_hit, expired, cancelled, invalidated. The TypeScript types (types.ts) define an identical union type. The Supabase generated types (supabase/types.ts) reference the database enum. All three are ALIGNED."),
  h2("9.2 signal_transitions Table"),
  body("The signal_transitions table was created via migration 20260811000000_add_signal_transitions.sql. It has proper foreign keys (signal_tracking_id -> signal_tracking.id, user_id -> profiles.id), RLS enabled (select own + service_role), and performance indexes. However, from_status and to_status use TEXT instead of the signal_status enum. The TypeScript types (supabase/types.ts) also use string for these columns. This is a minor inconsistency: the values will always match the enum because only the Transition Engine produces them, but the database does not enforce this constraint."),
  h2("9.3 Migration Status"),
  body("Two new migrations were created: (1) 20260809000000_add_invalidated_to_signal_status.sql adds the invalidated value to the signal_status enum and extends the partial index. (2) 20260811000000_add_signal_transitions.sql creates the signal_transitions table. Both are staged but NOT yet applied to the remote database (no push or migration run was performed). This means the signal_transitions table does not yet exist in the production database."),
  h2("9.4 Type Alignment Summary"),
  auditTable(
    ["Table", "DB Enum", "TS Type", "Supabase Types", "Status"],
    [
      ["signal_tracking.status", "signal_status (9 values)", "SignalStatus (9 values)", "Enums.signal_status", statusCell("ALIGNED")],
      ["signal_transitions.from_status", "TEXT", "string", "string", amber("WEAK")],
      ["signal_transitions.to_status", "TEXT", "string", "string", amber("WEAK")],
      ["trades.status", "TEXT (CHECK constraint)", "TradeStatus (3 values)", "string", statusCell("ALIGNED")],
      ["trades.direction", "TEXT", "TradeDirection (2 values)", "string", statusCell("ALIGNED")],
    ],
    [22, 20, 20, 20, 18]
  ),
];

// ── 10. Runtime Audit ──
const sec10 = [
  h1("10. Runtime Audit"),
  h2("10.1 Signal Transition Runtime Path"),
  body("The complete runtime path was traced: useLivePrices -> useSignalMonitor -> requestSignalTransition (server function) -> requireSupabaseAuth (authentication) -> validator (input validation) -> executeSignalTransition -> DB read (fetch current signal) -> concurrency check (optimistic lock) -> evaluateSignalTransition (Transition Engine) -> DB update (signal state) -> audit insert (signal_transitions) -> event emission (signal.transition.completed) -> client response (transition result)."),
  body("The Phase 3 report claims all four maturity levels (EXISTS, WIRED, RUNTIME-USED, PROVEN) as PROVEN. Independent verification confirms: EXISTS and WIRED are PROVEN. RUNTIME-USED is PARTIAL because the transitions only occur when the user has the Signals page open and the WebSocket connection is active. PROVEN is PARTIAL for the same reason."),
  h2("10.2 Classification"),
  bodyRuns([
    new TextRun({ text: "Server-authoritative transition path: ", bold: true, size: 22, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: c(P.body) }),
    green("VERIFIED"),
    new TextRun({ text: ". Server-side continuous background monitoring: ", size: 22, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: c(P.body) }),
    red("NOT IMPLEMENTED"),
    new TextRun({ text: ". These are fundamentally different capabilities. The current system is correctly classified as a server-authoritative transition path triggered by client-side price observation, NOT a server-side continuous monitoring system.", size: 22, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: c(P.body) }),
  ]),
];

// ── 11. Test Reality ──
const sec11 = [
  h1("11. Test Quality Audit"),
  h2("11.1 Test Count and Distribution"),
  auditTable(
    ["Test Suite", "Count", "Type", "Mocks?", "Coverage"],
    [
      ["transition-engine.test.ts", "91", "Unit (pure logic)", "No", "Exhaustive: all states, directions, edge cases"],
      ["signal-transition.service.test.ts", "30", "Unit (mocked DB)", "Yes (vi.mock)", "Service path: auth, concurrency, validation, events"],
      ["discovery/scoring.test.ts", "57", "Unit", "No", "Discovery scoring logic"],
      ["trades/trades.test.ts", "20", "Unit (schema validation)", "No", "F1 regression: field survival, server authority"],
      ["backtest/engine/simulator.test.ts", "9", "Unit", "No", "Backtest simulation"],
      ["analysis/e2e-analysis.test.ts", "20", "Integration", "Partial", "Analysis pipeline"],
      ["Other suites (12 files)", "130", "Unit/Integration", "Varies", "Various domain tests"],
    ],
    [30, 10, 20, 12, 28]
  ),
  spacer(),
  h2("11.2 Test Quality Assessment"),
  body("The 357 tests are primarily UNIT tests with mocked dependencies. The Transition Engine tests (91) are high quality: they test pure domain logic with no mocks, covering all state transitions, edge cases, and direction combinations. The service tests (30) use mocked Supabase clients and verify the service logic correctly. The trades tests (20) validate schema parsing and insert row construction."),
  h2("11.3 Missing Test Categories"),
  bullet("Database integration tests: No tests that hit a real Supabase instance. All DB operations are mocked."),
  bullet("RLS policy tests: No tests verify that users cannot access other users data."),
  bullet("Concurrent race condition tests: No tests simulate simultaneous transition requests for the same signal."),
  bullet("Unauthorized access tests: No tests verify that unauthenticated requests are rejected."),
  bullet("Duplicate request tests: No tests verify idempotency of repeated identical transition requests."),
  bullet("Migration verification tests: No tests verify the migration SQL produces the expected schema."),
  bullet("Stale version edge case tests: No tests verify behavior when updated_at changes between fetch and update."),
];

// ── 12. Duplication Audit ──
const sec12 = [
  h1("12. Duplication Audit"),
  body("A codebase-wide search for duplicated logic across Phase 2/3 domains identified the following:"),
  spacer(),
  auditTable(
    ["Duplication", "Location A", "Location B", "Classification"],
    [
      ["Signal price evaluation", "functions.ts:evaluateTrackingPrice", "transition-engine.ts:evaluatePriceTransition", "KEEP BOTH (A is legacy, B is authoritative)"],
      ["Signal status update", "functions.ts:updateSignalTracking", "signal-transition.service.ts:executeSignalTransition", "DEPRECATE A (use B exclusively)"],
      ["Cancel signal", "functions.ts:cancelSignalTracking", "signal-transition.service (requestedTransition:cancelled)", "DEPRECATE A (use B exclusively)"],
      ["Error classification", "errors.ts:fromSupabaseError", "trades/functions.ts:manual error strings", "MERGE (trades should use fromSupabaseError)"],
      ["Timestamp generation", "Multiple: new Date().toISOString()", "Consistent pattern", "KEEP (no actual duplication)"],
      ["Auth middleware", "requireSupabaseAuth", "Consistent across all server fns", "KEEP (proper reuse)"],
    ],
    [18, 30, 30, 22]
  ),
  spacer(),
  body("The most significant duplication is the continued existence of evaluateTrackingPrice (client-side price evaluation in functions.ts) alongside the server-authoritative Transition Engine (transition-engine.ts). The old function is a simpler, less rigorous version that does not enforce sequential TP ordering or SL priority. It is currently unused by production code (verified: zero imports outside of index.ts barrel export and scripts) but remains exported."),
];

// ── 13. Route/Domain Audit ──
const sec13 = [
  h1("13. Route / Domain Integration"),
  body("Phase 1 planned to consolidate 39 routes into 12 core experiences. The current codebase has 41 routes under src/routes/_authenticated/. Phase 2/3 did not create new route fragmentation; they added server-side logic within existing domains (signal-tracking, trades) without adding new routes."),
  body("Phase 2/3 impact on routes is minimal: no new routes were created, no existing routes were modified for Phase 2/3 work. The signal transition server function (transition.server.fn.ts) is a TanStack server function accessible from any route that imports it, but it does not require a dedicated route. The useSignalMonitor hook is used within the existing signals page."),
];

// ── 14. Reality Maturity Matrix ──
const sec14 = [
  h1("14. Reality Maturity Matrix"),
  auditTable(
    ["Capability", "Phase", "EXISTS", "WIRED", "RUNTIME-USED", "PROVEN", "Status"],
    [
      ["Server Authority (Signals)", "3", statusCell("PROVEN"), statusCell("PROVEN"), statusCell("PARTIAL"), statusCell("PARTIAL"), "Active only when Signals page open"],
      ["Server Authority (Trades)", "2", statusCell("PROVEN"), statusCell("PROVEN"), statusCell("PROVEN"), statusCell("PROVEN"), "Fully operational"],
      ["Transition Engine", "1+3", statusCell("PROVEN"), statusCell("PROVEN"), statusCell("PROVEN"), statusCell("PROVEN"), "Pure domain logic, 91 tests"],
      ["Signal Audit Trail", "3", statusCell("PROVEN"), statusCell("PROVEN"), statusCell("PARTIAL"), statusCell("PARTIAL"), "Table exists; migration not applied"],
      ["Atomic Transitions", "3", statusCell("EXISTS"), statusCell("EXISTS"), red("BROKEN"), red("BROKEN"), "Sequential, not transactional"],
      ["Error Model", "2", statusCell("PROVEN"), statusCell("PROVEN"), statusCell("PROVEN"), statusCell("PROVEN"), "6 error classes, integrated"],
      ["Canonical Data Types", "2", statusCell("PROVEN"), statusCell("EXISTS"), red("BROKEN"), red("BROKEN"), "Types only; no adapters"],
      ["Domain Events", "3", statusCell("PROVEN"), statusCell("PARTIAL"), statusCell("EXISTS"), red("BROKEN"), "Emitted but zero handlers"],
      ["Validation Boundary", "2", statusCell("PROVEN"), statusCell("PROVEN"), statusCell("PARTIAL"), statusCell("PARTIAL"), "Zod for trades; manual for signals"],
      ["Concurrency Protection", "3", statusCell("PROVEN"), statusCell("PROVEN"), statusCell("PROVEN"), statusCell("PROVEN"), "Optimistic locking operational"],
    ],
    [22, 6, 10, 10, 12, 12, 28]
  ),
];

// ── 15. User-Visible Impact ──
const sec15 = [
  h1("15. VIXOR V2 User-Visible Impact"),
  h2("15.1 Visible Improvements"),
  bullet("Trade creation now correctly persists all fields (pair, direction, entry_price, stop_loss, take_profit, quantity). Previously, only entry_date and quantity were saved, causing silent data loss."),
  bullet("Signal transitions are now server-validated. The Transition Engine enforces correct state sequences (no skipping TP1 to TP2, SL priority over TP, terminal state protection)."),
  bullet("Concurrent transition attempts are detected and rejected with a CONFLICT error, preventing race conditions when multiple browser tabs are open."),
  h2("15.2 Invisible Infrastructure Improvements"),
  bullet("Error classification system (6 error categories with HTTP status mapping)"),
  bullet("Canonical market data types (CanonicalAsset, CanonicalPair, CanonicalCandle, CanonicalTicker)"),
  bullet("Signal transition audit trail (signal_transitions table with full metadata)"),
  bullet("Domain event infrastructure (EventOrchestrator with typed events)"),
  bullet("Server-side timestamp authority (serverReceivedAt generated on server, not client)"),
  h2("15.3 Improvements Users Expect But Do NOT Exist"),
  bullet("Background server-side signal monitoring (signals only monitored when browser is open)"),
  bullet("Real-time notifications from domain events (events emitted but zero handlers)"),
  bullet("Data normalization pipeline (types exist, no adapters implemented)"),
  bullet("Route consolidation (41 routes, not 12)"),
  bullet("Automated migration application (migrations staged but not applied)"),
];

// ── 16. Reality Gap Map ──
const sec16 = [
  h1("16. Reality Gap Map"),
  auditTable(
    ["Claim", "Code", "Database", "Runtime", "User Experience", "Gap"],
    [
      ["Server-authoritative signals", statusCell("VERIFIED"), statusCell("PARTIAL"), statusCell("PARTIAL"), "Works when browser open", "Not background-monitored"],
      ["Atomic transitions", statusCell("EXISTS"), red("MISSING"), red("MISSING"), "No user impact yet", "Sequential, not transactional"],
      ["Event-driven notifications", statusCell("EXISTS"), statusCell("N/A"), red("MISSING"), "No notifications from events", "Zero event handlers"],
      ["Canonical data pipeline", statusCell("EXISTS"), red("MISSING"), red("MISSING"), "No change visible", "Types only, no adapters"],
      ["Complete audit trail", statusCell("VERIFIED"), amber("PARTIAL"), amber("PARTIAL"), "Audit records when available", "Migration not applied to DB"],
      ["All old functions removed", statusCell("EXISTS"), statusCell("N/A"), statusCell("N/A"), "No user impact", "3 legacy functions still exported"],
    ],
    [18, 12, 12, 12, 18, 28]
  ),
];

// ── 17. Critical Findings ──
const sec17 = [
  h1("17. Critical Findings"),
  h2("17.1 BLOCKER: Non-Atomic Signal Transitions"),
  body("Priority: CRITICAL. Impact: Data integrity. The signal state update and audit record insert in executeSignalTransition() are sequential, not wrapped in a single database transaction. If the audit insert fails after the signal update succeeds, the signal state will be updated without a corresponding audit record. Resolution: Create a PostgreSQL RPC function that wraps both operations in a single transaction. Phase: Future (post-Phase 3). File: src/domains/signal-tracking/signal-transition.service.ts, lines 185-277."),
  h2("17.2 BLOCKER: Legacy Functions Bypass Transition Engine"),
  body("Priority: CRITICAL. Impact: Security/Architecture. updateSignalTracking and cancelSignalTracking in functions.ts remain callable server functions that can mutate signal state without Transition Engine validation. While no current UI code calls them, they are exported and accessible. Resolution: Deprecate with @deprecated JSDoc, add runtime warnings, remove from barrel export in a future phase. Phase: Future (post-Phase 3). Files: src/domains/signal-tracking/functions.ts, lines 99-226."),
  h2("17.3 BLOCKER: Event System Has Zero Consumers"),
  body("Priority: HIGH. Impact: Infrastructure completeness. The signal.transition.completed event is emitted but no handlers are registered. The event infrastructure is functional but effectively a no-op. Resolution: Register handlers for notification delivery, MOXI integration, and audit persistence. Phase: Deferred (event system rebuild planned for Phase 7). File: src/shared/events/orchestrator.ts."),
  h2("17.4 WARNING: Migrations Not Applied"),
  body("Priority: MEDIUM. Impact: Deployment. Two migrations (add_invalidated_to_signal_status, add_signal_transitions) are staged but not applied to the remote database. The signal_transitions table does not exist in production. Resolution: Apply migrations before deploying Phase 3 code. Phase: Pre-deployment."),
  h2("17.5 WARNING: signal_transitions Uses TEXT Instead of Enum"),
  body("Priority: LOW. Impact: Data integrity. The from_status and to_status columns in signal_transitions use TEXT instead of the signal_status PostgreSQL enum. Invalid values could theoretically be inserted, though the Transition Engine only produces valid values. Resolution: Alter columns to use signal_status enum type. Phase: Future."),
  h2("17.6 WARNING: as any Still Present in Signal Code"),
  body("Priority: LOW. Impact: Type safety. functions.ts line 134 uses as any for the update operation. This bypasses TypeScript's type checking for the update payload. Resolution: Replace with proper typed update object. Phase: Future."),
  h2("17.7 WARNING: No Rate Limiting on Transition Endpoint"),
  body("Priority: MEDIUM. Impact: Security. The requestSignalTransition server function has no rate limiting. A malicious or buggy client could flood the endpoint. Resolution: Add rate limiting middleware or debounce logic. Phase: Future."),
];

// ── 18. Required Fixes ──
const sec18 = [
  h1("18. Required Fixes"),
  body("The following fixes are required BEFORE the pre-commit gate can pass. They are ordered by priority."),
  spacer(),
  auditTable(
    ["#", "Fix", "Priority", "Phase", "Effort"],
    [
      ["F1", "Create PostgreSQL RPC for atomic signal transition + audit insert", "CRITICAL", "Post-3", "Medium (SQL function + service refactor)"],
      ["F2", "Deprecate updateSignalTracking and cancelSignalTracking (add @deprecated, remove from barrel export)", "CRITICAL", "Post-3", "Low (JSDoc + export removal)"],
      ["F3", "Apply pending migrations to remote database", "HIGH", "Pre-deploy", "Low (supabase db push)"],
      ["F4", "Replace as any in functions.ts line 134 with typed update", "LOW", "Post-3", "Low (type fix)"],
      ["F5", "Add rate limiting to requestSignalTransition", "MEDIUM", "Post-3", "Medium (middleware)"],
    ],
    [5, 45, 12, 12, 26]
  ),
];

// ── 19. Deferred Work ──
const sec19 = [
  h1("19. Deferred Work"),
  body("The following items are explicitly deferred to future phases and are NOT blockers for the current pre-commit gate. They are listed for traceability."),
  bullet("Event system full rebuild and handler registration (Phase 7)"),
  bullet("Route consolidation from 41 to 12 core experiences (Phase 4+)"),
  bullet("Canonical data normalization adapters (Phase 5+)"),
  bullet("Server-side background signal monitoring (Phase 4+)"),
  bullet("RLS policy testing and hardening (ongoing)"),
  bullet("Database integration tests (ongoing)"),
  bullet("Concurrent race condition tests (Phase 3.5)"),
  bullet("Idempotency keys for all mutations (Phase 5+)"),
  bullet("Dead code removal (previous_price, updateExcursions, evaluateTrackingPrice) (ongoing)"),
  bullet("as any cleanup across 43 files (ongoing)"),
  bullet("MOXI/UI/Notification rebuild (Phase 4+)"),
  bullet("On-chain trading integration (deferred indefinitely)"),
  bullet("Futures trading (deferred indefinitely)"),
];

// ── 20. Pre-Commit Gate ──
const sec20 = [
  h1("20. Pre-Commit Gate"),
  body("The pre-commit gate evaluates whether the repository is ready for ONE consolidation commit that includes all Phase 0-3 work."),
  spacer(),
  auditTable(
    ["Criterion", "Status", "Evidence"],
    [
      ["All tests pass", statusCell("VERIFIED"), "357 tests, 0 failures"],
      ["Typecheck clean", statusCell("VERIFIED"), "npx tsc --noEmit: zero errors"],
      ["Build successful", statusCell("VERIFIED"), "npm run build: successful in 32.47s"],
      ["No regressions", statusCell("VERIFIED"), "307 -> 327 -> 357 tests; no tests removed"],
      ["No broken imports", statusCell("VERIFIED"), "Build would fail if imports were broken"],
      ["Atomic transitions", red("NOT MET"), "Signal update and audit insert are sequential"],
      ["No bypassable legacy functions", red("NOT MET"), "updateSignalTracking, cancelSignalTracking still callable"],
      ["Event system functional", amber("PARTIAL"), "Events emitted but zero handlers"],
      ["Migrations applied", red("NOT MET"), "Two migrations staged but not applied to DB"],
    ],
    [25, 15, 60]
  ),
  spacer(),
  h2("20.1 Pre-Commit Gate Verdict"),
  bodyRuns([
    new TextRun({ text: "Verdict: ", bold: true, size: 24, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: c(P.body) }),
    red("C) NOT READY \u2014 CRITICAL ISSUES"),
  ]),
  body("The repository has 3 critical issues that prevent a clean consolidation commit: (1) non-atomic signal transitions, (2) bypassable legacy functions, and (3) unapplied migrations. While the codebase is in a good state (all tests pass, no regressions, clean build), these issues represent architectural gaps that should be resolved before freezing into a commit. The recommended path is to resolve the three blockers (estimated effort: 1-2 hours for deprecation + migration, medium effort for the RPC function) and then re-run this audit."),
];

// ── 21. Phase 4 Readiness ──
const sec21 = [
  h1("21. Phase 4 Readiness"),
  auditTable(
    ["Phase", "Status", "Verdict"],
    [
      ["Phase 0 (Reality Baseline)", amber("PARTIAL"), "7/18 findings VERIFIED; 6 PARTIAL; 5 deferred"],
      ["Phase 1 (Architecture Freeze)", amber("PARTIAL"), "12/14 decisions COMPLIANT; 2 deferred"],
      ["Phase 2 (Foundation)", amber("PARTIAL"), "5/10 tasks VERIFIED; 5 PARTIAL; 0 BROKEN"],
      ["Phase 3 (Signal Engine)", red("PARTIAL"), "13/16 tasks VERIFIED; 2 BLOCKERS; 1 WARNING"],
    ],
    [25, 15, 60]
  ),
  spacer(),
  bodyRuns([
    new TextRun({ text: "Phase 4 Readiness: ", bold: true, size: 24, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: c(P.body) }),
    red("NOT READY FOR PHASE 4"),
  ]),
  body("Phase 4 should not begin until the three critical blockers identified in this audit are resolved. The atomic transition issue (F1) is the highest priority because it affects data integrity. The legacy function deprecation (F2) is the quickest to resolve. The migration application (F3) is a deployment prerequisite. After these three fixes, a re-audit should confirm readiness before Phase 4 authorization."),
];

// ── 22. File References ──
const sec22 = [
  h1("22. Exact File References"),
  h2("22.1 Phase 2 Source Files"),
  bullet("src/domains/trades/functions.ts (217 lines, createTrade fix, Zod validation)"),
  bullet("src/domains/trades/types.ts (105 lines, canonical Trade interface)"),
  bullet("src/domains/trades/trades.test.ts (353 lines, 20 tests)"),
  bullet("src/shared/errors.ts (148 lines, 6 error classes + fromSupabaseError)"),
  bullet("src/shared/normalization/types.ts (192 lines, canonical market data types)"),
  bullet("src/shared/supabase/types.ts (956 lines, expanded with signal_transitions)"),
  h2("22.2 Phase 3 Source Files"),
  bullet("src/domains/signal-tracking/signal-transition.service.ts (317 lines, server-authoritative transition)"),
  bullet("src/domains/signal-tracking/transition.server.fn.ts (55 lines, TanStack server function)"),
  bullet("src/domains/signal-tracking/signal-transition.service.test.ts (687 lines, 30 tests)"),
  bullet("src/shared/events/orchestrator.ts (358 lines, added signal.transition.completed event)"),
  bullet("src/shared/hooks/use-signal-monitor.ts (215 lines, refactored for server path)"),
  bullet("supabase/migrations/20260811000000_add_signal_transitions.sql (38 lines)"),
  h2("22.3 Phase 1.2C Files (Committed in HEAD)"),
  bullet("src/domains/signal-tracking/transition-engine.ts (447 lines, pure domain logic)"),
  bullet("src/domains/signal-tracking/transition-engine.test.ts (91 tests)"),
  bullet("src/domains/signal-tracking/types.ts (104 lines, TERMINAL/INTERMEDIATE/MONITORED_STATUSES)"),
  bullet("src/domains/signal-tracking/functions.ts (330 lines, legacy + CRUD)"),
  bullet("supabase/migrations/20260809000000_add_invalidated_to_signal_status.sql (24 lines)"),
];

// ── 23. Exact Commands and Results ──
const sec23 = [
  h1("23. Exact Commands and Results"),
  auditTable(
    ["Command", "Result", "Timestamp"],
    [
      ["git status", "131 files staged, 0 unstaged, 0 untracked", "2026-08-11"],
      ["git branch", "* main (+ cleanup/phase-0-audit, 4 remote branches)", "2026-08-11"],
      ["git log -1 --oneline", "32bbf14 feat(signal-tracking): unify terminal status contract", "2026-08-11"],
      ["git diff --stat HEAD", "131 files changed, +7268/-378", "2026-08-11"],
      ["npx tsc --noEmit", "Zero errors (clean)", "2026-08-11"],
      ["npm run build", "Built in 32.47s; successful", "2026-08-11"],
      ["npx vitest run", "20 test files, 357 tests passed, 0 failures, 18.50s", "2026-08-11"],
      ["rg updateSignalTracking src/", "5 files (index.ts, functions.ts, 3 scripts)", "2026-08-11"],
      ["rg cancelSignalTracking src/", "2 files (index.ts, functions.ts)", "2026-08-11"],
      ["rg evaluateTrackingPrice src/", "2 files (index.ts, functions.ts)", "2026-08-11"],
      ["rg as any src/", "43 files (pre-existing + 1 new in functions.ts)", "2026-08-11"],
      ["rg supabaseAdmin src/", "31 files (pre-existing + 1 new in service.ts)", "2026-08-11"],
      ["rg VixorEvents.on( src/", "0 production files (1 in orchestrator.ts comment)", "2026-08-11"],
    ],
    [35, 45, 20]
  ),
];

// ═══════════════════════════════════════════════════════════════════════════════
// ASSEMBLE DOCUMENT
// ═══════════════════════════════════════════════════════════════════════════════

const bodyChildren = [
  ...sec1, ...sec2, ...sec3, ...sec4, ...sec5, ...sec6, ...sec7,
  ...sec8, ...sec9, ...sec10, ...sec11, ...sec12, ...sec13, ...sec14,
  ...sec15, ...sec16, ...sec17, ...sec18, ...sec19, ...sec20, ...sec21,
  ...sec22, ...sec23,
];

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: { ascii: "Times New Roman", eastAsia: "SimSun" }, size: 22, color: c(P.body) },
        paragraph: { spacing: { line: 312 } },
      },
    },
  },
  sections: [
    // Section 1: Cover (no page number)
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
        },
      },
      children: coverChildren,
    },
    // Section 2: TOC (Roman numerals)
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
          pageNumbers: { start: 1, formatType: NumberFormat.UPPER_ROMAN },
        },
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, font: { ascii: "Calibri" }, color: c(P.secondary) })],
          })],
        }),
      },
      children: tocSection,
    },
    // Section 3: Body (Arabic numerals, reset to 1)
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
          pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "VIXOR V2 Phase 0-3 Integration Audit", size: 16, font: { ascii: "Calibri" }, color: c(P.secondary), italics: true })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, font: { ascii: "Calibri" }, color: c(P.secondary) })],
          })],
        }),
      },
      children: bodyChildren,
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("/home/z/my-project/download/VIXOR_PHASE_0_3_INTEGRATION_AUDIT.docx", buf);
  console.log("DONE: VIXOR_PHASE_0_3_INTEGRATION_AUDIT.docx");
}).catch((err) => {
  console.error("Generation failed:", err);
  process.exit(1);
});

// VIXOR Phase 3 Scope Gate Report Generator
// Read-only analysis — no code modifications

const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  PageBreak, Header, Footer, PageNumber, NumberFormat,
  AlignmentType, HeadingLevel, WidthType, BorderStyle, ShadingType,
  TableOfContents, SectionType,
} = require("docx");

// ── Palette: DS-1 (Cool + Heavy + Calm) ──
const P = {
  primary: "#0B1220",
  body: "#1C2A3D",
  secondary: "#5B6B7D",
  accent: "#3B7DD8",
  surface: "#F1F5F9",
  coverBg: "#0B1220",
  coverAccent: "#3B7DD8",
  white: "FFFFFF",
  black: "000000",
  red: "#C0392B",
  green: "#27AE60",
  amber: "#D4A017",
  lightGray: "#E8ECF1",
  tableBorder: "#B0BEC5",
  tableHeaderBg: "#0B1220",
  tableHeaderFg: "FFFFFF",
  redBg: "#FDEDEC",
  greenBg: "#EAFAF1",
  amberBg: "#FEF9E7",
  grayBg: "#F5F7FA",
};

const c = (hex) => hex.replace("#", "");
const DOCX_SCRIPTS = "/home/z/my-project/skills/docx/scripts";

// ── Utility Functions ──

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 200, line: 312 },
    children: [new TextRun({ text, bold: true, size: 32, font: { ascii: "Times New Roman", eastAsia: "SimHei" }, color: c(P.primary) })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 160, line: 312 },
    children: [new TextRun({ text, bold: true, size: 28, font: { ascii: "Times New Roman", eastAsia: "SimHei" }, color: c(P.primary) })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120, line: 312 },
    children: [new TextRun({ text, bold: true, size: 24, font: { ascii: "Times New Roman", eastAsia: "SimHei" }, color: c(P.primary) })],
  });
}

function body(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 120, line: 312 },
    children: [new TextRun({ text, size: 24, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: c(P.body) })],
  });
}

function bodyBold(label, text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 120, line: 312 },
    children: [
      new TextRun({ text: label, bold: true, size: 24, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: c(P.body) }),
      new TextRun({ text, size: 24, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: c(P.body) }),
    ],
  });
}

function emptyLine() {
  return new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "", size: 12 })] });
}

function verdictBox(verdict, explanation) {
  const bgColor = verdict.startsWith("A") ? P.greenBg : verdict.startsWith("B") ? P.amberBg : P.redBg;
  const fgColor = verdict.startsWith("A") ? P.green : verdict.startsWith("B") ? P.amber : P.red;
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 3, color: c(fgColor) },
      bottom: { style: BorderStyle.SINGLE, size: 3, color: c(fgColor) },
      left: { style: BorderStyle.SINGLE, size: 3, color: c(fgColor) },
      right: { style: BorderStyle.SINGLE, size: 3, color: c(fgColor) },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: c(bgColor) },
            margins: { top: 200, bottom: 200, left: 240, right: 240 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 80 },
                children: [new TextRun({ text: verdict, bold: true, size: 36, font: { ascii: "Times New Roman" }, color: c(fgColor) })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 0 },
                children: [new TextRun({ text: explanation, size: 22, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: c(P.body) })],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function makeTable(headers, rows, colWidths) {
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: c(P.tableBorder) },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: c(P.tableBorder) },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: c(P.lightGray) },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: headers.map((h, i) =>
          new TableCell({
            width: { size: (colWidths[i] / totalWidth) * 100, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: c(P.tableHeaderBg) },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 20, font: { ascii: "Times New Roman" }, color: c(P.tableHeaderFg) })] })],
          })
        ),
      }),
      ...rows.map((row) =>
        new TableRow({
          cantSplit: true,
          children: row.map((cell, i) =>
            new TableCell({
              width: { size: (colWidths[i] / totalWidth) * 100, type: WidthType.PERCENTAGE },
              margins: { top: 60, bottom: 60, left: 120, right: 120 },
              children: Array.isArray(cell)
                ? cell
                : [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: String(cell), size: 20, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: c(P.body) })] })],
            })
          ),
        })
      ),
    ],
  });
}

function statusCell(status) {
  const colors = {
    A: { bg: P.greenBg, fg: P.green, label: "A - REQUIRED" },
    B: { bg: P.amberBg, fg: P.amber, label: "B - USEFUL" },
    C: { bg: P.grayBg, fg: P.secondary, label: "C - DEFER" },
    D: { bg: P.redBg, fg: P.red, label: "D - REMOVE" },
    E: { bg: P.grayBg, fg: P.secondary, label: "E - ARTIFACT" },
    F: { bg: P.grayBg, fg: P.secondary, label: "F - PERM-ONLY" },
  };
  const s = colors[status] || colors.F;
  return [
    new Paragraph({
      spacing: { after: 0 },
      children: [new TextRun({ text: s.label, bold: true, size: 20, font: { ascii: "Times New Roman" }, color: c(s.fg) })],
    }),
  ];
}

function maturityCell(level) {
  const colors = {
    EXISTS: P.red,
    WIRED: P.amber,
    "RUNTIME-USED": P.green,
    PROVEN: "#1B5E20",
  };
  return [new Paragraph({
    spacing: { after: 0 },
    children: [new TextRun({ text: level, bold: true, size: 20, font: { ascii: "Times New Roman" }, color: c(colors[level] || P.body) })],
  })];
}

// ── Cover (R1: Pure Paragraph Left) ──
function buildCover() {
  const title = "VIXOR PHASE 3 SCOPE GATE";
  const subtitle = "Read-Only Evidence-Based Analysis";
  const date = "2026-08-11";
  return [
    new Paragraph({ spacing: { before: 3200 }, children: [new TextRun({ text: "", size: 12 })] }),
    new Paragraph({
      spacing: { after: 100, line: 600, lineRule: "atLeast" },
      children: [new TextRun({ text: title, bold: true, size: 52, font: { ascii: "Times New Roman" }, color: c(P.white) })],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({ text: subtitle, size: 28, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: c(P.coverAccent) })],
    }),
    new Paragraph({
      spacing: { after: 80 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: c(P.coverAccent), space: 8 } },
      children: [new TextRun({ text: "", size: 12 })],
    }),
    new Paragraph({
      spacing: { before: 200, after: 60 },
      children: [new TextRun({ text: "READ-ONLY  |  NO CODE CHANGES  |  NO COMMITS", size: 20, font: { ascii: "Times New Roman" }, color: c(P.secondary) })],
    }),
    new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text: `Date: ${date}  |  HEAD: 7c9d99d  |  origin/main: 4ffad753`, size: 20, font: { ascii: "Times New Roman" }, color: c(P.secondary) })],
    }),
  ];
}

// ── Document Assembly ──
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: { ascii: "Times New Roman", eastAsia: "SimSun" }, size: 24, color: c(P.body) },
        paragraph: { spacing: { line: 312 } },
      },
      heading1: { run: { font: { ascii: "Times New Roman", eastAsia: "SimHei" }, size: 32, bold: true, color: c(P.primary) }, paragraph: { spacing: { before: 480, after: 200, line: 312 } } },
      heading2: { run: { font: { ascii: "Times New Roman", eastAsia: "SimHei" }, size: 28, bold: true, color: c(P.primary) }, paragraph: { spacing: { before: 360, after: 160, line: 312 } } },
      heading3: { run: { font: { ascii: "Times New Roman", eastAsia: "SimHei" }, size: 24, bold: true, color: c(P.primary) }, paragraph: { spacing: { before: 240, after: 120, line: 312 } } },
    },
  },
  sections: [
    // Section 1: Cover
    {
      properties: {
        page: { size: { width: 11906, height: 16838, orientation: 0 }, margin: { top: 0, bottom: 0, left: 0, right: 0 } },
      },
      children: buildCover(),
    },
    // Section 2: Body
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838, orientation: 0 },
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
          pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "VIXOR Phase 3 Scope Gate", size: 18, font: { ascii: "Times New Roman" }, color: c(P.secondary), italics: true })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, font: { ascii: "Times New Roman" }, color: c(P.secondary) })],
          })],
        }),
      },
      children: [
        // ═══════════════════════════════════════════════════════════════
        // 1. EXECUTIVE VERDICT
        // ═══════════════════════════════════════════════════════════════
        h1("1. Executive Verdict"),
        verdictBox(
          "A) READY FOR MINIMAL PHASE 3",
          "The staged Phase 3 work is structurally complete for the signal transition server-authoritative path. The runtime dependency chain is verified. No over-engineering is required. The minimum viable Phase 3 consists of 7 source files + 1 migration. All other staged work should be excluded from the Phase 3 commit."
        ),
        emptyLine(),
        body("This gate report is a read-only analysis of 132 staged files. It traces the actual runtime path from price observation through signal monitoring, server function invocation, transition engine evaluation, and persistence. It verifies which staged files have real production callers, which are speculative architecture, and which are artifacts that must never enter a source commit."),
        body("The verdict is based on evidence: grep-based caller analysis, import dependency tracing, and runtime path verification against the actual code in the working tree. No assumptions were made about code being present implying runtime usage."),

        // ═══════════════════════════════════════════════════════════════
        // 2. CURRENT GIT REALITY
        // ═══════════════════════════════════════════════════════════════
        h1("2. Current Git Reality"),
        makeTable(
          ["Item", "Value"],
          [
            ["HEAD", "7c9d99d7 (Phase 2 F1 fix committed locally)"],
            ["origin/main", "4ffad753"],
            ["Phase 2 commit", "7c9d99d7 - fix(trades): persist all trade fields (3 files)"],
            ["Staged files", "132 total (13 source, 2 migrations, 117 artifacts)"],
            ["Unstaged files", "0"],
            ["Untracked files", "0"],
            ["Push status", "NO PUSH - all commits local only"],
            ["Tests", "357/357 PASS"],
            ["Typecheck", "EXIT: 0"],
            ["Build", "SUCCESS (26.89s)"],
          ],
          [35, 65]
        ),
        emptyLine(),
        body("The repository is in a clean state. The Phase 2 F1 fix (createTrade data-loss bug) is committed locally but not pushed. All Phase 3 work remains staged and untouched. The working tree has no unstaged or untracked files. All quality gates are green."),

        // ═══════════════════════════════════════════════════════════════
        // 3. COMPLETE STAGED FILE CLASSIFICATION
        // ═══════════════════════════════════════════════════════════════
        h1("3. Complete Staged File Classification"),
        body("Every staged file is classified into exactly one category based on repository evidence. The classification criteria are strict: a file must have a demonstrated production need, runtime dependency, or user journey to be classified as A (Required)."),

        h2("3.1 Category A: Required for Phase 3 (7 files)"),
        makeTable(
          ["#", "File", "Why Required", "Runtime Callers", "Migration Req"],
          [
            ["1", "signal-transition.service.ts", "Core transition orchestration. Fetches signal from DB, calls Transition Engine, executes update + audit insert.", "transition.server.fn.ts", "Yes - signal_transitions table"],
            ["2", "transition.server.fn.ts", "Server-authoritative endpoint. Only route for signal state transitions.", "use-signal-monitor.ts", "No (uses service)"],
            ["3", "use-signal-monitor.ts", "Client hook. Replaces updateSignalTracking with requestSignalTransition on every price tick.", "signals.tsx (page)", "No"],
            ["4", "signal-tracking/index.ts", "Barrel export. Exports requestSignalTransition so useSignalMonitor can import it.", "use-signal-monitor.ts", "No"],
            ["5", "shared/errors.ts", "Provides fromSupabaseError() used by transition service for error categorization.", "signal-transition.service.ts", "No"],
            ["6", "shared/supabase/types.ts", "Database type including signal_transitions table. Required for TypeScript compilation.", "signal-transition.service.ts", "N/A (types only)"],
            ["7", "20260811...signal_transitions.sql", "DDL for signal_transitions audit table. Must be applied to Supabase before deployment.", "signal-transition.service.ts", "THIS IS THE MIGRATION"],
          ],
          [5, 28, 30, 22, 15]
        ),
        emptyLine(),
        h3("For each A-file: What happens if excluded?"),
        body("signal-transition.service.ts: Without this, there is no server-side logic to evaluate transitions. The Transition Engine exists but is unwired. The hook would call a non-existent endpoint."),
        body("transition.server.fn.ts: Without this, the hook has no server function to call. The import would fail at build time."),
        body("use-signal-monitor.ts: Without this, the monitoring hook continues using the old client-authoritative updateSignalTracking. The entire behavioral change to server-authoritative transitions does not happen."),
        body("signal-tracking/index.ts: Without this barrel change, requestSignalTransition is not exported. The hook import fails."),
        body("shared/errors.ts: Without this, the service cannot compile (fromSupabaseError is imported). The transition service is dead code."),
        body("shared/supabase/types.ts: Without this, the Database type lacks signal_transitions. The service fails typecheck."),
        body("signal_transitions.sql: Without this migration applied, the service will log an error on every transition (audit insert fails) but the signal update itself succeeds. The service was explicitly designed to degrade gracefully."),

        h2("3.2 Category B: Useful But Not Required (2 files)"),
        makeTable(
          ["#", "File", "Why Not Required", "Recommendation"],
          [
            ["1", "signal-transition.service.test.ts", "Tests mock the DB. They prove the service logic but are not a runtime dependency. The service works without them.", "Commit separately or with Phase 3"],
            ["2", "shared/events/orchestrator.ts", "Adds signal.transition.completed event type. The service uses 'as never' cast to bypass type check. No consumers exist. Events are fire-and-forget.", "Defer to post-V2"],
          ],
          [5, 30, 35, 30]
        ),

        h2("3.3 Category C: Future / Defer (1 file)"),
        makeTable(
          ["#", "File", "Why Deferred", "Evidence"],
          [
            ["1", "shared/normalization/types.ts", "Pure type definitions. Zero importers anywhere in the codebase. Canonical market data types for a normalization layer that does not exist yet. This is architectural preparation with no current consumer.", "rg 'normalization' src/ returns 0 results"]
          ],
          [5, 30, 35, 30]
        ),

        h2("3.4 Category D: Dead / Remove (2 files)"),
        makeTable(
          ["#", "File", "Why Dead/Remove", "Evidence"],
          [
            ["1", "shared/market-data/alchemy-rpc.ts", "Deleted file. Was an Alchemy RPC module with zero importers in src/. Confirmed dead by grep analysis.", "rg 'alchemy-rpc' src/ returns only barrel re-export"],
            ["2", "debate/index.ts", "Removes dead DebateEngine class (keyword-counting stub with zero callers). DebateResult type is preserved (used by risk-governor).", "rg 'DebateEngine' src/ returns 0 results (after staged removal)"]
          ],
          [5, 30, 35, 30]
        ),

        h2("3.5 Category E: Artifact / Report / Script (117 files)"),
        body("These 117 files must NEVER enter a source commit. They are generated artifacts, research reports, search result JSON files, and report-generation scripts. They belong in a separate artifacts commit or should remain uncommitted."),
        makeTable(
          ["Category", "Count", "Types"],
          [
            ["download/ artifacts", "69", ".docx, .pdf, .md, .json research reports"],
            ["scripts/ generators", "47", ".cjs, .py, .js report generation scripts"],
            ["worklog.md", "1", "Development session log"],
          ],
          [30, 15, 55]
        ),

        h2("3.6 Category F: Permission-Only / No Functional Change (3 files)"),
        makeTable(
          ["#", "File", "Change"],
          [
            ["1", "signal-tracking/transition-engine.ts", "File mode 644 to 755 only. Zero code change. Transition Engine already exists on origin/main."],
            ["2", "signal-tracking/transition-engine.test.ts", "File mode 644 to 755 only. Zero code change. Tests already exist on origin/main."],
            ["3", "20260809...invalidated_to_signal_status.sql", "File mode 644 to 755 only. Migration content already exists on origin/main."],
          ],
          [5, 40, 55]
        ),

        // ═══════════════════════════════════════════════════════════════
        // 4. MINIMUM PHASE 3 FILE SET
        // ═══════════════════════════════════════════════════════════════
        h1("4. Minimum Phase 3 File Set"),
        body("The minimum production-safe Phase 3 commit consists of exactly these 7 source files plus 1 migration. These files form a complete, closed dependency chain with no external requirements beyond what already exists in production."),
        makeTable(
          ["Order", "File", "Role"],
          [
            ["1 (pre-deploy)", "supabase/migrations/20260811000000_add_signal_transitions.sql", "Apply to Supabase BEFORE code deployment"],
            ["2", "src/shared/errors.ts", "Error model with fromSupabaseError utility"],
            ["3", "src/shared/supabase/types.ts", "Database types including signal_transitions table"],
            ["4", "src/domains/signal-tracking/signal-transition.service.ts", "Core transition orchestration service"],
            ["5", "src/domains/signal-tracking/transition.server.fn.ts", "Server function endpoint (createServerFn)"],
            ["6", "src/domains/signal-tracking/index.ts", "Barrel export of requestSignalTransition"],
            ["7", "src/shared/hooks/use-signal-monitor.ts", "Client hook wiring change"],
          ],
          [15, 55, 30]
        ),
        emptyLine(),
        body("Dependency chain: use-signal-monitor.ts imports requestSignalTransition from barrel (index.ts), which is defined in transition.server.fn.ts, which calls executeSignalTransition from signal-transition.service.ts, which imports from shared/errors.ts (fromSupabaseError) and uses Database type from shared/supabase/types.ts, which requires signal_transitions table (migration)."),

        // ═══════════════════════════════════════════════════════════════
        // 5. FILES EXPLICITLY EXCLUDED
        // ═══════════════════════════════════════════════════════════════
        h1("5. Files Explicitly Excluded"),
        makeTable(
          ["File", "Category", "Exclusion Reason"],
          [
            ["normalization/types.ts", "C - DEFER", "Zero importers. Future foundation with no current consumer."],
            ["debate/index.ts", "D - REMOVE", "Dead code cleanup. Not required for Phase 3 signal path."],
            ["alchemy-rpc.ts (DELETE)", "D - REMOVE", "Dead file. Not required for Phase 3 signal path."],
            ["events/orchestrator.ts", "B - DEFER", "Event type def. Service uses 'as never' cast. No consumers exist."],
            ["service.test.ts", "B - DEFER", "Tests mock DB. Useful but not a runtime dependency."],
            ["transition-engine.ts", "F - PERM-ONLY", "Mode change only. Code unchanged from origin/main."],
            ["transition-engine.test.ts", "F - PERM-ONLY", "Mode change only. Code unchanged from origin/main."],
            ["20260809 migration", "F - PERM-ONLY", "Mode change only. Content already on origin/main."],
            ["69 download/ files", "E - ARTIFACT", "Generated reports and research data. Never in source commit."],
            ["47 scripts/ files", "E - ARTIFACT", "Report generation scripts. Never in source commit."],
            ["worklog.md", "E - ARTIFACT", "Development log. Never in source commit."],
          ],
          [30, 18, 52]
        ),

        // ═══════════════════════════════════════════════════════════════
        // 6. RUNTIME SIGNAL LIFECYCLE EVIDENCE
        // ═══════════════════════════════════════════════════════════════
        h1("6. Runtime Signal Lifecycle Evidence"),
        body("This section traces the actual runtime path from price observation to persistence. Each step is verified against the staged code, not assumed from presence."),

        h2("6.1 Production Path (origin/main - Current)
```

        body("On origin/main, the signal lifecycle is CLIENT-AUTHORITATIVE. The useSignalMonitor hook calls updateSignalTracking directly, passing a pre-computed new status. The Transition Engine (evaluateSignalTransition) exists on origin/main but has ZERO runtime callers. It is dead code in production."),
        makeTable(
          ["Step", "Component", "Evidence"],
          [
            ["1", "useLivePrices (WebSocket)", "Active on signals.tsx. Provides real-time price ticks for monitored pairs."],
            ["2", "useSignalMonitor", "Imports updateSignalTracking, evaluateTrackingPrice, updateExcursions. Runs on every price tick."],
            ["3", "updateSignalTracking", "Server function in functions.ts. Directly updates signal_tracking.status to client-determined value."],
            ["4", "evaluateSignalTransition", "EXISTS but NOT called by any production code. Only imported in tests."],
            ["5", "signal_transitions table", "Does NOT exist in production. No migration on origin/main."],
            ["6", "Notifications", "Triggered by updateSignalTracking when status changes to TP/SL hit."],
          ],
          [8, 30, 62]
        ),

        h2("6.2 Staged Phase 3 Path (Server-Authoritative)"),
        body("The staged code replaces step 3 with a server-authoritative path. The client NO LONGER determines the new status. It sends the observed price to the server, which uses the Transition Engine to decide the valid next state."),
        makeTable(
          ["Step", "Component", "Evidence"],
          [
            ["1", "useLivePrices (WebSocket)", "Unchanged. Still provides real-time price ticks."],
            ["2", "useSignalMonitor (staged)", "Now imports requestSignalTransition instead of updateSignalTracking. Sends trackingId + observedPrice + currentVersion."],
            ["3", "requestSignalTransition", "NEW server function (transition.server.fn.ts). Validates input, calls executeSignalTransition."],
            ["4", "executeSignalTransition", "NEW service (signal-transition.service.ts). Fetches signal from DB (server-authoritative), calls evaluateSignalTransition (Transition Engine)."],
            ["5", "evaluateSignalTransition", "NOW runtime-used. Called by executeSignalTransition. Pure domain logic, no side effects."],
            ["6", "DB: signal_tracking UPDATE", "Optimistic lock via updated_at. Admin client used for RLS bypass."],
            ["7", "DB: signal_transitions INSERT", "Audit record. Non-atomic with step 6 (known limitation, service logs error but returns success)."],
            ["8", "VixorEvents.emit", "signal.transition.completed event. Uses 'as never' cast. NO consumers exist."],
          ],
          [8, 30, 62]
        ),

        // ═══════════════════════════════════════════════════════════════
        // 7. MATURITY MATRIX
        // ═══════════════════════════════════════════════════════════════
        h1("7. EXISTS / WIRED / RUNTIME-USED / PROVEN Matrix"),
        body("Each component is rated at its highest maturity level supported by repository evidence. A component cannot skip levels: it must be WIRED before it can be RUNTIME-USED, and RUNTIME-USED before it can be PROVEN."),
        makeTable(
          ["Component", "origin/main", "Staged", "Evidence"],
          [
            ["evaluateSignalTransition (engine)", maturityCell("EXISTS"), maturityCell("RUNTIME-USED"), "Origin: tests only. Staged: called by service."],
            ["requestSignalTransition (server fn)", maturityCell("EXISTS"), maturityCell("WIRED"), "Origin: N/A. Staged: exists but not yet deployed."],
            ["executeSignalTransition (service)", maturityCell("EXISTS"), maturityCell("WIRED"), "Origin: N/A. Staged: created, called by server fn."],
            ["signal_transitions table", maturityCell("EXISTS"), maturityCell("EXISTS"), "Migration staged but NOT applied to Supabase."],
            ["useSignalMonitor (hook)", maturityCell("RUNTIME-USED"), maturityCell("RUNTIME-USED"), "Origin: calls updateSignalTracking. Staged: calls requestSignalTransition."],
            ["VixorEvents (signal.transition)", maturityCell("EXISTS"), maturityCell("EXISTS"), "Type defined. Zero consumers in both branches."],
            ["updateSignalTracking (legacy)", maturityCell("RUNTIME-USED"), maturityCell("EXISTS"), "Origin: called by hook. Staged: still exported but no longer called by hook."],
            ["cancelSignalTracking", maturityCell("EXISTS"), maturityCell("EXISTS"), "Zero production callers in both branches."],
            ["Normalization types", maturityCell("EXISTS"), maturityCell("EXISTS"), "Zero importers in both branches."],
            ["New error model (DomainError)", maturityCell("EXISTS"), maturityCell("WIRED"), "Origin: zero consumers. Staged: used by transition service."],
          ],
          [28, 20, 20, 32]
        ),

        // ═══════════════════════════════════════════════════════════════
        // 8. 13 VERIFICATION QUESTIONS
        // ═══════════════════════════════════════════════════════════════
        h1("8. Thirteen Verification Questions"),
        makeTable(
          ["#", "Question", "Answer", "Evidence"],
          [
            ["1", "Is Transition Engine invoked in production?", "NO (origin/main). YES (staged).", "Origin: only test imports. Staged: called by service."],
            ["2", "Is requestSignalTransition called?", "YES (staged only)", "use-signal-monitor.ts line 103: transitionFn({data: {...}})"],
            ["3", "Are updateSignalTracking/cancelSignalTracking still called?", "updateSignalTracking: origin/main only. cancelSignalTracking: NEVER.", "Staged hook replaced updateSignalTracking with requestSignalTransition."],
            ["4", "Is signal_transitions required by runtime?", "Yes, but degrades gracefully.", "Service catches insert error, logs, returns success. Signal update still happens."],
            ["5", "Is the migration required before deployment?", "Technically no (graceful degradation). Practically yes.", "Without migration: every transition logs console error. With migration: clean audit trail."],
            ["6", "Is persistence atomic?", "NO. Two separate DB calls.", "signal_tracking UPDATE (step 6) + signal_transitions INSERT (step 7). Not in a transaction. Known documented limitation."],
            ["7", "Are event consumers required?", "NO.", "Zero consumers of signal.transition.completed. Event is fire-and-forget."],
            ["8", "Does normalization have real consumers?", "NO.", "rg 'normalization' src/ returns 0 results."],
            ["9", "Does new error model have real consumers?", "Only transition service.", "fromSupabaseError imported by signal-transition.service.ts. All other error classes have zero importers."],
            ["10", "Is rate limiting required?", "NO.", "No evidence of abuse. Monitoring already debounces per-tracking. No production requirement."],
            ["11", "Purely architectural changes?", "YES: normalization, event type, error model expansion.", "These are architectural prep, not bug fixes or user-facing changes."],
            ["12", "User-visible behavior changes?", "YES: signal monitoring path.", "Users will not see a UI change, but the backend path changes from client-authoritative to server-authoritative. Transition results are now deterministic."],
            ["13", "Smallest safe Phase 3?", "7 source files + 1 migration.", "See Section 4 for exact file list and dependency chain."],
          ],
          [5, 25, 25, 45]
        ),

        // ═══════════════════════════════════════════════════════════════
        // 9. MIGRATION REQUIREMENTS
        // ═══════════════════════════════════════════════════════════════
        h1("9. Migration Requirements"),
        makeTable(
          ["Migration", "Status", "Required For", "Risk"],
          [
            ["20260811...signal_transitions.sql", "Staged, NOT applied to Supabase", "Phase 3 audit trail", "LOW. Simple CREATE TABLE with 3 indexes + RLS. No data migration. No schema conflict. Backward-compatible."],
            ["20260809...invalidated_to_signal_status.sql", "Already on origin/main (mode-only staged change)", "Already deployed", "NONE. This is a permission-only change in the staging area."],
          ],
          [30, 25, 20, 25]
        ),
        emptyLine(),
        body("The signal_transitions migration is a simple DDL operation: CREATE TABLE with 3 B-tree indexes and 2 RLS policies. It has no data migration component, no schema conflicts with existing tables, and is fully backward-compatible. The table has a CASCADE DELETE on signal_tracking_id, so if a signal is deleted, its transitions are automatically cleaned up. The RLS policy restricts users to their own transition history, with a service_role override for admin operations."),

        // ═══════════════════════════════════════════════════════════════
        // 10. USER-VISIBLE IMPACT
        // ═══════════════════════════════════════════════════════════════
        h1("10. User-Visible Impact"),
        body("Phase 3 changes the backend signal transition path from client-authoritative to server-authoritative. The user does NOT see a UI change. The functional behavior is the same: when a price hits TP/SL, the signal status changes and a notification is sent. However, the authority model is fundamentally different."),
        makeTable(
          ["Aspect", "Before (origin/main)", "After (Phase 3)", "User Notices?"],
          [
            ["Who decides TP/SL hit?", "Client (browser)", "Server (Transition Engine)", "NO"],
            ["Transition validity", "No validation", "Full state machine validation", "NO"],
            ["Audit trail", "None", "signal_transitions table", "NO (admin only)"],
            ["Concurrency protection", "None", "Optimistic lock via updated_at", "NO"],
            ["Notifications", "On status change", "On status change (unchanged)", "NO"],
            ["Race conditions", "Possible (last-write-wins)", "Protected (version check)", "NO"],
          ],
          [22, 25, 25, 28]
        ),

        // ═══════════════════════════════════════════════════════════════
        // 11. RISK ASSESSMENT
        // ═══════════════════════════════════════════════════════════════
        h1("11. Risk Assessment"),
        makeTable(
          ["Risk", "Severity", "Likelihood", "Mitigation"],
          [
            ["Migration not applied before deploy", "HIGH", "LOW", "Service degrades gracefully: signal updates succeed, audit records lost. Console error logged per transition."],
            ["Non-atomic persistence (update + audit)", "MEDIUM", "LOW", "If audit insert fails after signal update succeeds, signal is correct but audit is missing. No data corruption. Service returns success."],
            ["Optimistic lock conflicts", "LOW", "LOW", "Client retries on next price tick (debounced per-tracking). User never sees error."],
            ["Breaking change to signal_monitor", "MEDIUM", "NONE", "No UI changes. Same functional behavior. Server-authoritative path is strictly more correct than client-authoritative."],
            ["Old updateSignalTracking still exported", "LOW", "NONE", "Still callable but no longer called by any production code. Can be removed post-V2."],
            ["supabaseAdmin import", "LOW", "NONE", "Dynamic import from existing server-side module. No new dependency added."],
          ],
          [28, 12, 12, 48]
        ),

        // ═══════════════════════════════════════════════════════════════
        // 12. RECOMMENDED IMPLEMENTATION ORDER
        // ═══════════════════════════════════════════════════
        h1("12. Recommended Implementation Order"),
        makeTable(
          ["Step", "Action", "Verification", "Commit Boundary"],
          [
            ["0", "Apply signal_transitions migration to Supabase", "SELECT * FROM signal_transitions LIMIT 1 (should return 0 rows, no error)", "Separate migration commit OR apply manually"],
            ["1", "Stage only the 7 Phase 3 source files", "git diff --cached --name-only (should show exactly 7 files)", "Before commit"],
            ["2", "Run tests: 357/357 PASS", "npx vitest run", "Before commit"],
            ["3", "Run typecheck: EXIT 0", "npx tsc --noEmit", "Before commit"],
            ["4", "Run build: SUCCESS", "npm run build", "Before commit"],
            ["5", "Commit Phase 3 source (7 files)", "git commit -m 'feat(signal): server-authoritative transitions (Phase 3 minimal)'", "Commit 2"],
            ["6", "Deploy to Vercel", "Smoke test: track a signal, wait for price tick, verify signal_transitions row created", "Post-deploy"],
            ["7", "Push Phase 2 + Phase 3", "git push origin main", "After smoke test"],
          ],
          [8, 35, 30, 27]
        ),

        // ═══════════════════════════════════════════════════════════════
        // 13. RECOMMENDED COMMIT BOUNDARIES
        // ═══════════════════════════════════════════════════════════════
        h1("13. Recommended Commit Boundaries"),
        makeTable(
          ["Commit", "Files", "Message"],
          [
            ["C0 (DONE)", "3 files: trades/functions.ts, trades/types.ts, trades/test.ts", "fix(trades): persist all trade fields on creation (F1 data-loss bug)"],
            ["C1 (NEXT)", "7 files: signal-transition.service.ts, transition.server.fn.ts, use-signal-monitor.ts, signal-tracking/index.ts, errors.ts, supabase/types.ts, signal_transitions migration", "feat(signal): server-authoritative transitions (Phase 3 minimal)"],
            ["C2 (DEFER)", "2 files: debate/index.ts, alchemy-rpc.ts delete", "chore: remove dead DebateEngine class and unused alchemy-rpc module"],
            ["C3 (DEFER)", "1 file: normalization/types.ts", "chore(normalization): add canonical market data types (V2 foundation)"],
            ["C4 (DEFER)", "2 files: orchestrator.ts, service.test.ts", "feat(signal): add transition event type and service tests"],
            ["ARTIFACTS (NEVER)", "117 files: download/ + scripts/ + worklog.md", "DO NOT COMMIT as source. These are generated artifacts."],
          ],
          [15, 55, 30]
        ),
        emptyLine(),
        body("The recommended approach is to execute Commit C0 (already done) and Commit C1 as the minimum V2 delivery. Commits C2 through C4 are cleanup and infrastructure that should be deferred until after V2 is stable and user-tested. The 117 artifact files should never be part of a source commit. They can be committed to a separate branch or kept as local-only working files."),

        // ═══════════════════════════════════════════════════════════════
        // FINAL GATE
        // ═══════════════════════════════════════════════════════════════
        h1("14. Final Gate"),
        emptyLine(),
        verdictBox(
          "A) READY FOR MINIMAL PHASE 3",
          "The staged Phase 3 code is structurally complete. The runtime dependency chain from useSignalMonitor through requestSignalTransition through executeSignalTransition through evaluateSignalTransition is verified and closed. The migration is simple and low-risk. The service degrades gracefully if the migration is not applied. No over-engineering is required. The minimum viable Phase 3 is 7 source files + 1 migration, committed separately from Phase 2 and from all artifacts."
        ),
        emptyLine(),
        body("Awaiting authorization to proceed with Phase 3 implementation."),
      ],
    },
  ],
});

// ── Generate ──
const OUTPUT = "/home/z/my-project/download/VIXOR_PHASE_3_SCOPE_GATE.docx";
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUTPUT, buf);
  console.log("Generated: " + OUTPUT);
});

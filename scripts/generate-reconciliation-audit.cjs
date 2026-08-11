const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, Header, Footer, PageNumber, AlignmentType, HeadingLevel, WidthType, BorderStyle, ShadingType, PageBreak, TableOfContents } = require('docx');

const c = (hex) => hex.replace('#', '');

// Tech audit palette: dark, cool, heavy
const P = {
  primary: '#0F1A2E', body: '#1A2332', secondary: '#5A6A7E', accent: '#4A90D9', surface: '#F0F4F8', red: '#C0392B', green: '#27AE60', amber: '#E67E22',
};

const allNoBorders = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};

const tableBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: 'C0C8D0' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: 'C0C8D0' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'E0E4E8' },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 480, after: 200, line: 312 }, children: [new TextRun({ text, bold: true, size: 32, font: { ascii: 'Calibri', eastAsia: 'SimHei' }, color: c(P.primary) })] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 360, after: 160, line: 312 }, children: [new TextRun({ text, bold: true, size: 28, font: { ascii: 'Calibri', eastAsia: 'SimHei' }, color: c(P.primary) })] });
}
function h3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 240, after: 120, line: 312 }, children: [new TextRun({ text, bold: true, size: 24, font: { ascii: 'Calibri', eastAsia: 'SimHei' }, color: c(P.primary) })] });
}

function body(text) {
  return new Paragraph({ alignment: AlignmentType.LEFT, spacing: { after: 120, line: 312 }, children: [new TextRun({ text, size: 22, font: { ascii: 'Calibri' }, color: c(P.body) })] });
}

function bodyBold(label, text) {
  return new Paragraph({ alignment: AlignmentType.LEFT, spacing: { after: 80, line: 312 }, children: [
    new TextRun({ text: label, bold: true, size: 22, font: { ascii: 'Calibri' }, color: c(P.primary) }),
    new TextRun({ text, size: 22, font: { ascii: 'Calibri' }, color: c(P.body) }),
  ] });
}

function statusLine(label, status, color) {
  return new Paragraph({ alignment: AlignmentType.LEFT, spacing: { after: 60, line: 312 }, children: [
    new TextRun({ text: label, size: 22, font: { ascii: 'Calibri' }, color: c(P.secondary) }),
    new TextRun({ text: '  ' + status, bold: true, size: 22, font: { ascii: 'Calibri' }, color: c(color) }),
  ] });
}

function spacer(h = 120) {
  return new Paragraph({ spacing: { before: h, after: 0 }, children: [] });
}

function makeHeaderRow(cols) {
  return new TableRow({ tableHeader: true, cantSplit: true, children: cols.map(t => new TableCell({
    children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: t, bold: true, size: 20, font: { ascii: 'Calibri' }, color: c(P.primary) })] })],
    shading: { type: ShadingType.CLEAR, fill: 'E8EDF2' }, margins: { top: 50, bottom: 50, left: 100, right: 100 },
  })) });
}

function makeRow(cols, highlight) {
  return new TableRow({ cantSplit: true, children: cols.map(t => new TableCell({
    children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: t, size: 20, font: { ascii: 'Calibri' }, color: highlight ? c(highlight) : c(P.body) })] })],
    shading: highlight ? { type: ShadingType.CLEAR, fill: 'FFF8E8' } : undefined, margins: { top: 40, bottom: 40, left: 100, right: 100 },
  })) });
}

function makeTable(headers, rows, colWidths) {
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: tableBorders, rows: [
    makeHeaderRow(headers),
    ...rows.map(r => makeRow(r, r._hl)),
  ] });
}

// ==================== BUILD DOCUMENT ====================

const doc = new Document({
  styles: {
    default: { document: { run: { font: { ascii: 'Calibri', eastAsia: 'Microsoft YaHei' }, size: 22, color: c(P.body) }, paragraph: { spacing: { line: 312 } } } },
    heading1: { run: { font: { ascii: 'Calibri', eastAsia: 'SimHei' }, size: 32, bold: true, color: c(P.primary) }, paragraph: { spacing: { before: 480, after: 200, line: 312 } } },
    heading2: { run: { font: { ascii: 'Calibri', eastAsia: 'SimHei' }, size: 28, bold: true, color: c(P.primary) }, paragraph: { spacing: { before: 360, after: 160, line: 312 } } },
    heading3: { run: { font: { ascii: 'Calibri', eastAsia: 'SimHei' }, size: 24, bold: true, color: c(P.primary) }, paragraph: { spacing: { before: 240, after: 120, line: 312 } } },
  },
  sections: [
    // COVER
    { properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 0, bottom: 0, left: 0, right: 0 } } }, children: [
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: allNoBorders, rows: [new TableRow({ height: { value: 16838, rule: 'exact' }, children: [new TableCell({
        verticalAlign: 'top', margins: { top: 4800, bottom: 0, left: 1200, right: 1200 },
        children: [
          new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: 'VIXOR V2', size: 72, bold: true, font: { ascii: 'Calibri' }, color: c(P.accent) })] }),
          new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: 'GIT + PHASE RECONCILIATION AUDIT', size: 40, bold: true, font: { ascii: 'Calibri' }, color: c(P.primary) })] }),
          new Paragraph({ spacing: { after: 600 }, children: [new TextRun({ text: 'Read-Only Pre-Commit Gate', size: 24, font: { ascii: 'Calibri' }, color: c(P.secondary) })] }),
          new Paragraph({ children: [new TextRun({ text: 'Baseline: 4ffad75 (GitHub main) vs 32bbf14 (local HEAD)', size: 20, font: { ascii: 'Calibri' }, color: c(P.secondary) })] }),
          new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: 'Date: 2026-08-11  |  Status: READ-ONLY  |  NO COMMIT  |  NO PUSH', size: 18, font: { ascii: 'Calibri' }, color: c(P.secondary) })] }),
        ],
      })] })] }),
    ] },
    // TOC
    { properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 }, pageNumbers: { start: 1, formatType: 'UPPER_ROMAN' } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'VIXOR V2  |  Git + Phase Reconciliation Audit', size: 16, font: { ascii: 'Calibri' }, color: c(P.secondary), italics: true })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, font: { ascii: 'Calibri' }, color: c(P.secondary) })] })] }) },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400, after: 300 }, children: [new TextRun({ text: 'Table of Contents', bold: true, size: 32, font: { ascii: 'Calibri' }, color: c(P.primary) })] }),
        new TableOfContents('TOC', { hyperlink: true, headingStyleRange: '1-3' }),
        new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: 'Right-click the TOC and select "Update Field" to refresh page numbers.', size: 18, italics: true, font: { ascii: 'Calibri' }, color: c(P.secondary) })] }),
        new Paragraph({ children: [new PageBreak()] }),
      ]
    },
    // BODY
    { properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 }, pageNumbers: { start: 1, formatType: 'DECIMAL' } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'VIXOR V2  |  Git + Phase Reconciliation Audit', size: 16, font: { ascii: 'Calibri' }, color: c(P.secondary), italics: true })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, font: { ascii: 'Calibri' }, color: c(P.secondary) })] })] }) },
      children: [

// ============ SECTION A: GIT STATE ============
h1('A. Git State'),

h2('A.1 Commit Topology'),
body('The repository has a single-point divergence from the common ancestor 8200a6f. Both local HEAD (32bbf14) and origin/main (4ffad75) share the same parent (8200a6f) and carry the identical commit message. However, their tree hashes differ, indicating different file content was committed.'),
spacer(80),
bodyBold('Local HEAD: ', '32bbf147a30e2448a5c89d504fd7ef5ec3143bac'),
bodyBold('Remote origin/main: ', '4ffad75394b28ac52933be1d51bdbc691bf256ef'),
bodyBold('Merge-base: ', '8200a6f1392498c1a67ee13af94556f4f4734093'),
bodyBold('Note on 4affd75: ', 'The user-referenced SHA "4affd75" does NOT exist locally. The actual origin/main SHA is 4ffad75 (with two f\'s). This is likely a transcription error. All analysis below uses the actual SHA 4ffad75.'),
spacer(80),

h2('A.2 Divergence Analysis'),
body('Both commits share identical author, timestamp, parent, and commit message. The difference is entirely in the tree (file content). The local commit (32bbf14) includes download/ and scripts/ files that the remote commit (4ffad75) does not, and vice versa. Critically, the source code (src/) and migrations (supabase/) directories are IDENTICAL between the two commits when comparing against their common parent 8200a6f.'),
spacer(60),

makeTable(
  ['Dimension', 'Local HEAD (32bbf14)', 'origin/main (4ffad75)'],
  [
    ['Parent', '8200a6f', '8200a6f'],
    ['Message', 'feat(signal-tracking): unify terminal status contract (Task 1.2C)', 'feat(signal-tracking): unify terminal status contract (Task 1.2C)'],
    ['Author', 'Z User <z@container>', 'Z User <z@container>'],
    ['Tree hash', '8fe9c268', '56e18486'],
    ['src/ changes vs 8200a6f', 'IDENTICAL to 4ffad75', '10 files modified/added'],
    ['supabase/ changes', 'IDENTICAL to 4ffad75', '2 migration files'],
    ['download/ + scripts/', '98 files added (reports, search data, generators)', '0 files (clean commit)'],
  ]
),
spacer(120),

h2('A.3 Staging Area'),
body('The working tree has 133 staged files, 0 unstaged, 0 untracked. This means ALL local changes (both the Phase 2/3 source code AND the download/scripts artifacts) are staged and ready for commit. No work has been lost, but no commit has been made either.'),
spacer(60),
makeTable(
  ['Category', 'New (A)', 'Modified (M)', 'Deleted (D)', 'Notes'],
  [
    ['src/', '5', '10', '1', 'Phase 2/3 source code + service + tests'],
    ['supabase/', '1', '1', '0', 'Two migration files'],
    ['download/', '4', '64', '0', 'Generated reports + search data'],
    ['scripts/', '8', '38', '0', 'Report generators + search JSON'],
    ['Other', '0', '1', '0', 'worklog.md'],
  ]
),
spacer(120),

h2('A.4 Source Code: Local vs Remote'),
body('This is the critical finding. When comparing the committed source code (src/ and supabase/) between 32bbf14 and 4ffad75 against their common parent 8200a6f, the diff is IDENTICAL. This means the Phase 2 and Phase 3 source code changes that exist on origin/main (4ffad75) are the SAME changes that are in the local commit (32bbf14). There is NO source code duplication or conflict.'),
body('The divergence is exclusively in the download/ and scripts/ directories. The remote commit (4ffad75) was a clean commit with only the src/ and supabase/ changes. The local commit (32bbf14) additionally included the download/ and scripts/ artifacts. In other words, 32bbf14 is a superset of 4ffad75 in terms of file content, but with a different tree hash because the extra files change the overall tree checksum.'),
spacer(120),

// ============ SECTION B: GITHUB BASELINE ============
h1('B. GitHub Baseline'),

h2('B.1 What Is Actually on GitHub'),
body('The public GitHub main branch HEAD is 4ffad75 (note: two f\'s, not "4affd75" as referenced by the user). This commit includes the following Phase 0-1.2C work that was pushed directly to GitHub in a previous session:'),
spacer(60),
makeTable(
  ['File', 'Change', 'Phase'],
  [
    ['src/domains/signal-tracking/functions.ts', 'Modified', 'Phase 0-1'],
    ['src/domains/signal-tracking/index.ts', 'Modified', 'Phase 0-1'],
    ['src/domains/signal-tracking/transition-engine.test.ts', 'Modified', 'Phase 0-1'],
    ['src/domains/signal-tracking/transition-engine.ts', 'Modified', 'Phase 0-1'],
    ['src/domains/signal-tracking/types.ts', 'Existing (unchanged)', 'Phase 0-1'],
    ['src/domains/analysis/reanalysis.ts', 'New', 'Phase 2'],
    ['src/routes/_authenticated/signals.tsx', 'Modified', 'Phase 0-1'],
    ['src/shared/events/orchestrator.ts', 'Modified', 'Phase 0-1'],
    ['src/shared/events/index.ts', 'Existing', 'Phase 0-1'],
    ['src/shared/events/persist.ts', 'Existing', 'Phase 0-1'],
    ['src/shared/supabase/types.ts', 'Modified (+1 line)', 'Phase 0-1'],
    ['supabase/migrations/...add_invalidated_to_signal_status.sql', 'Modified', 'Phase 0-1'],
  ]
),
spacer(120),

h2('B.2 What Exists Only Locally (Staged, Not Committed)'),
body('The following files exist in the staging area but are NOT in any commit (neither local 32bbf14 nor remote 4ffad75). These represent the actual Phase 2 and Phase 3 work that has not yet been persisted to any commit:'),
spacer(60),
makeTable(
  ['File', 'Type', 'Phase', 'Purpose'],
  [
    ['signal-transition.service.ts', 'NEW', 'Phase 3', 'Server-authoritative transition execution'],
    ['signal-transition.service.test.ts', 'NEW', 'Phase 3', 'Service unit tests (25 tests)'],
    ['transition.server.fn.ts', 'NEW', 'Phase 3', 'Server function endpoint for transitions'],
    ['trades.test.ts', 'NEW', 'Phase 2', 'Trade creation F1 regression tests'],
    ['normalization/types.ts', 'NEW', 'Phase 2', 'Canonical market data types (zero importers)'],
    ['add_signal_transitions.sql', 'NEW', 'Phase 3', 'Signal transitions audit table migration'],
  ]
),
spacer(60),
body('Additionally, these existing files have STAGED modifications not yet committed:'),
spacer(40),
makeTable(
  ['File', 'Phase', 'Change Summary'],
  [
    ['signal-tracking/index.ts', 'Phase 3', 'Added new exports for service + server fn'],
    ['transition-engine.test.ts', 'Phase 3', 'File mode change only (no content diff)'],
    ['transition-engine.ts', 'Phase 3', 'File mode change only (no content diff)'],
    ['trades/functions.ts', 'Phase 2', 'F1 fix: Zod validation + full field insertion'],
    ['trades/types.ts', 'Phase 2', 'Aligned with DB schema, removed generated cols'],
    ['shared/errors.ts', 'Phase 2', 'New: DomainError, ValidationError, fromSupabaseError'],
    ['shared/events/orchestrator.ts', 'Phase 3', 'Added signal.transition.completed event type'],
    ['shared/hooks/use-signal-monitor.ts', 'Phase 3', 'Rewired to use requestSignalTransition'],
    ['shared/supabase/types.ts', 'Phase 2/3', '+957 lines: signal_transitions table + types'],
    ['add_invalidated_to_signal_status.sql', 'Phase 0-1', 'Modified migration file'],
    ['debate/index.ts', 'Phase 2', 'Removed dead DebateEngine class'],
    ['market-data/alchemy-rpc.ts', 'Phase 2', 'Deleted (dead code removal)'],
  ]
),
spacer(120),

// ============ SECTION C: LOCAL-ONLY CHANGES ============
h1('C. Local-Only Changes Summary'),
body('All local-only changes are in the staging area (133 files). They break down into two categories: (1) actual source code changes from Phase 2 and Phase 3, and (2) generated artifacts (reports, search data, script generators) from the audit/reporting workflow. The source code changes (16 files in src/ + 2 in supabase/) are the substantive work. The remaining 115 files are non-code artifacts.'),
spacer(80),
body('Key observation: The local commit 32bbf14 already contains the Phase 0-1.2C source code changes that are also on origin/main (4ffad75). The staged changes add Phase 2 and Phase 3 work ON TOP of both. Since 32bbf14 and 4ffad75 have identical src/ content, there is no code duplication between local and remote commits. The only "duplication risk" is if someone does a git pull without resolving the divergence first, which would create a merge commit with conflicting download/scripts/ content.'),
spacer(120),

// ============ SECTION D: PREVIOUS AUDIT FINDINGS ============
h1('D. Previous Audit Findings Reconciliation'),
body('Each finding from the previous integration audit has been re-verified against the CURRENT codebase (working tree with staged changes). The classification uses: FIXED, STILL BROKEN, PARTIALLY FIXED, FALSE POSITIVE, NEW REGRESSION.'),
spacer(80),

h2('D.1 BLOCKER 1: Atomic Signal Transition'),
statusLine('Classification: ', 'STILL BROKEN', P.red),
body('The signal-transition.service.ts (lines 227-267) performs two sequential operations: (1) UPDATE signal_tracking, then (2) INSERT into signal_transitions. If the INSERT fails after the UPDATE succeeds, the code explicitly logs the error but does NOT roll back the state change (lines 268-277). The comment on lines 197-201 acknowledges this as a "known limitation." The audit insert failure path is documented but not handled atomically. This remains a critical data integrity risk: a signal can be in a new state without a corresponding audit record.'),
body('Evidence: signal-transition.service.ts line 268-277 shows the catch block that logs but does not rollback. The service uses supabaseAdmin (not a PostgREST RPC), meaning there is no database-level transaction wrapping both operations.'),
spacer(80),

h2('D.2 BLOCKER 2: Legacy Signal Mutation Bypass'),
statusLine('Classification: ', 'PARTIALLY FIXED', P.amber),
body('The legacy functions updateSignalTracking and cancelSignalTracking still exist in functions.ts (lines 99-226) and are still exported from index.ts (lines 8-9). However, a repository-wide search confirms ZERO production callers outside their definition file and the barrel export. The UI hook (use-signal-monitor.ts) has been fully rewired to use requestSignalTransition instead. The signals.tsx route file does not import or call either legacy function. The legacy functions remain callable via the server function API (they are createServerFn exports) but no UI or server code invokes them.'),
body('The risk is residual: any code that imports from the barrel export gets access to these functions. They should be removed or hard-disabled to close the architectural bypass path entirely. The current state is a partial fix: the active code paths no longer use them, but the functions remain available for future accidental use.'),
spacer(80),

h2('D.3 BLOCKER 3: Zero Event Handlers'),
statusLine('Classification: ', 'STILL BROKEN', P.red),
body('The signal.transition.completed event is emitted in signal-transition.service.ts (line 283) using VixorEvents.emit(). However, a repository-wide search for VixorEvents.on() calls returns ZERO results across the entire src/ directory. The only mention of VixorEvents.on is in a comment in orchestrator.ts (line 23). No handler has been registered for any event type. The event system infrastructure exists and functions correctly (it is well-tested), but it has zero consumers. The emitted events are effectively fire-and-forget into a void.'),
spacer(80),

h2('D.4 WARNING: Migrations Not Applied Remotely'),
statusLine('Classification: ', 'STILL BROKEN (UNVERIFIABLE)', P.red),
body('Two migration files exist locally: (1) 20260809000000_add_invalidated_to_signal_status.sql, and (2) 20260811000000_add_signal_transitions.sql. However, no Supabase environment variables are available in the current environment (only DATABASE_URL is set, not NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY). Therefore, remote database state cannot be verified. The generated types.ts DOES include the signal_transitions table and the full 9-value signal_status enum, which strongly suggests the types were generated AFTER running these migrations locally or against a remote schema that includes them. But this cannot be confirmed without database access.'),
spacer(80),

h2('D.5 WARNING: TEXT vs Enum for signal_transitions'),
statusLine('Classification: ', 'STILL BROKEN', P.red),
body('The signal_transitions table migration uses TEXT for from_status and to_status columns (lines 13-14 of add_signal_transitions.sql). The generated Supabase types reflect this: both fields are typed as string (not signal_status enum). Meanwhile, the signal_tracking table uses the signal_status enum for its status column. This inconsistency means the audit table does not enforce referential integrity against the enum. A typo or invalid status string can be inserted into signal_transitions.from_status/to_status without database-level validation.'),
spacer(120),

// ============ SECTION E: PHASE 2 STATUS ============
h1('E. Phase 2 Status'),
body('Phase 2 was reported as implementing ten tasks. The maturity classification below reflects the CURRENT state of each task, verified against actual code, not just file existence.'),
spacer(80),
makeTable(
  ['Task', 'Description', 'Maturity', 'Evidence'],
  [
    ['F1', 'Create Trade field-dropping bug', 'PROVEN', 'Zod schema + TradeInsertRow type + tests (trades.test.ts)'],
    ['F2', 'Error model (DomainError)', 'EXISTS', 'errors.ts defines DomainError hierarchy. Zero callers in production code.'],
    ['F3', 'Signal tracking type alignment', 'WIRED', 'types.ts aligned with DB. signal_tracking uses correct enum.'],
    ['F4', 'DebateEngine dead code removal', 'EXISTS', 'DebateEngine class removed from debate/index.ts.'],
    ['F5', 'alchemy-rpc dead code removal', 'EXISTS', 'File deleted. Zero importers existed.'],
    ['F6', 'Normalization types', 'EXISTS', 'normalization/types.ts created. ZERO importers anywhere. Orphan module.'],
    ['F7', 'Supabase types regeneration', 'WIRED', 'types.ts +957 lines. Includes signal_transitions.'],
    ['F8', 'Event orchestrator extensions', 'EXISTS', 'signal.transition.completed type added. Zero handlers.'],
    ['F9', 'Server authority for trades', 'WIRED', 'createTrade uses TablesInsert type. userId from session.'],
    ['F10', 'Supabase client architecture', 'EXISTS', 'supabaseAdmin used broadly. RLS in place.'],
  ]
),
spacer(80),
body('Phase 2 Assessment: The critical F1 fix is PROVEN with regression tests. F2 (error model) and F6 (normalization) exist as code but have zero production callers, making them WIRED at best. Most Phase 2 work is at EXISTS or WIRED maturity, not RUNTIME-USED or PROVEN. The normalization types module is an orphan with no consumers.'),
spacer(120),

// ============ SECTION F: PHASE 3 STATUS ============
h1('F. Phase 3 Status'),
body('Phase 3 was reported as implementing sixteen tasks. The maturity classification reflects the current code state.'),
spacer(80),
makeTable(
  ['Task', 'Description', 'Maturity', 'Evidence'],
  [
    ['3.1', 'Transition Engine (pure domain)', 'PROVEN', 'transition-engine.ts: 447 lines, fully tested'],
    ['3.2', 'Signal status contract unification', 'PROVEN', 'TERMINAL/INTERMEDIATE/MONITORED sets. 9-value enum.'],
    ['3.3', 'Server-authoritative transition service', 'PROVEN', 'signal-transition.service.ts + 25 tests'],
    ['3.4', 'Server function endpoint', 'WIRED', 'transition.server.fn.ts exists. Not called by routes.'],
    ['3.5', 'Atomic transition (DB transaction)', 'EXISTS', 'NOT atomic. Sequential update+insert with known gap.'],
    ['3.6', 'Legacy function removal', 'PARTIAL', 'Zero callers, but functions still exported.'],
    ['3.7', 'use-signal-monitor rewiring', 'WIRED', 'Hook uses requestSignalTransition. Debounce added.'],
    ['3.8', 'Event emission', 'EXISTS', 'signal.transition.completed emitted. Zero handlers.'],
    ['3.9', 'Audit trail table', 'EXISTS', 'Migration exists. Not verified on remote DB.'],
    ['3.10', 'Supabase types for transitions', 'WIRED', 'Generated types include signal_transitions.'],
    ['3.11', 'Concurrency protection', 'PROVEN', 'Optimistic locking via updated_at + tests'],
    ['3.12', 'Non-price transitions', 'PROVEN', 'cancel/expire/invalidate tested in service tests'],
    ['3.13', 'WAIT direction handling', 'PROVEN', 'WAIT blocks price transitions, allows non-price.'],
    ['3.14', 'Test suite expansion', 'PROVEN', '357/357 tests pass (20 test files).'],
    ['3.15', 'from_status/to_status enum', 'EXISTS', 'Still TEXT in migration. Not signal_status enum.'],
    ['3.16', 'Rate limiting review', 'NOT STARTED', 'No rate limiting on transition endpoint.'],
  ]
),
spacer(80),
body('Phase 3 Assessment: The core domain logic (Transition Engine, service, concurrency) is PROVEN with solid test coverage. The integration layer (server function wiring to routes, event consumption, DB atomicity) remains at EXISTS or WIRED. The atomicity gap (Task 3.5) is the most critical unresolved item.'),
spacer(120),

// ============ SECTION G: BLOCKERS ============
h1('G. Blockers'),

h2('G.1 B1: Non-Atomic Signal Transition (CRITICAL)'),
statusLine('Severity: ', 'CRITICAL', P.red),
statusLine('Status: ', 'STILL BROKEN', P.red),
body('The signal state update and audit record insertion are performed as two separate Supabase client calls. If the audit INSERT fails, the signal state has already been mutated, creating an inconsistent audit trail. This is documented in the code itself (signal-transition.service.ts lines 197-201) as a "known limitation" but it remains a data integrity violation. The fix requires a PostgreSQL RPC function that wraps both operations in a single database transaction.'),
spacer(80),

h2('G.2 B2: Legacy Mutation Path Still Exported (HIGH)'),
statusLine('Severity: ', 'HIGH', P.amber),
statusLine('Status: ', 'PARTIALLY FIXED', P.amber),
body('updateSignalTracking and cancelSignalTracking are still defined in functions.ts and exported from index.ts. While zero production callers exist today, the architectural principle of "one authoritative mutation path" is violated as long as these functions remain callable. Any future developer (or AI coding assistant) could accidentally use them, bypassing the Transition Engine. The fix requires removing these functions from the barrel export and either deleting them or replacing their bodies with hard errors.'),
spacer(80),

h2('G.3 B3: Zero Event Consumers (MEDIUM)'),
statusLine('Severity: ', 'MEDIUM', P.amber),
statusLine('Status: ', 'STILL BROKEN', P.amber),
body('VixorEvents.emit("signal.transition.completed", ...) is called after every successful transition, but VixorEvents.on() has never been called anywhere in the codebase. The event orchestrator infrastructure is well-built and tested, but it processes into a void. Notifications, MOXI updates, and downstream analytics that should consume these events are not wired.'),
spacer(120),

// ============ SECTION H: WARNINGS ============
h1('H. Warnings'),

h2('H.1 W1: Migrations Not Verified on Remote (HIGH)'),
body('Two local migration files (add_invalidated_to_signal_status, add_signal_transitions) have not been verified against the remote Supabase database. The current environment lacks Supabase credentials, making remote verification impossible. The generated types suggest the migrations were applied when types were generated, but this cannot be confirmed. If the signal_transitions table does not exist remotely, the transition service will fail at runtime.'),
spacer(80),

h2('H.2 W2: TEXT vs Enum in Audit Table (MEDIUM)'),
body('signal_transitions.from_status and to_status use TEXT instead of the signal_status enum. This means invalid status strings can be inserted without database-level validation. The service code casts to string when inserting (line 254-255), which works but bypasses enum protection. The fix is to ALTER the columns to use the signal_status enum type.'),
spacer(80),

h2('H.3 W3: Orphan normalization/types.ts (LOW)'),
body('The normalization types module (src/shared/normalization/types.ts) defines canonical market data types (CanonicalCandle, CanonicalTicker, etc.) and a NormalizerAdapter interface, but has ZERO importers anywhere in the codebase. It is a well-designed but completely unused module. It should either be wired into the data pipeline or removed to avoid confusion.'),
spacer(80),

h2('H.4 W4: as Any Casts (LOW)'),
body('Two instances of "as any" remain: (1) functions.ts line 134 in the legacy updateSignalTracking function, and (2) transition-engine.test.ts line 825 in a negative test case. The first will be resolved when the legacy functions are removed. The second is intentional test infrastructure for testing invalid input rejection.'),
spacer(80),

h2('H.5 W5: Rate Limiting Absent (MEDIUM)'),
body('The transition server function (transition.server.fn.ts) has no rate limiting. A malicious or buggy client could flood the endpoint with transition requests. This should be documented as deferred security work or implemented before production use.'),
spacer(120),

// ============ SECTION I: DUPLICATE WORK ============
h1('I. Duplicate Work Analysis'),
body('There is NO duplicate source code work. The Phase 2/3 source code changes (src/ and supabase/) in the local staging area are entirely new work that builds on top of the Phase 0-1.2C code already present in both 32bbf14 and 4ffad75. The two commits diverge only because the local commit included download/ and scripts/ artifacts that the remote commit did not. The source code portions are identical.'),
body('However, there IS a process-level duplication concern: the local commit 32bbf14 was apparently created as a re-commit of the same work that was pushed as 4ffad75. This created an unnecessary divergence. The resolution is straightforward: the staging area contains all the real work (Phase 2/3 source code), and the diverged commits need to be reconciled via a git rebase or reset before committing the new work.'),
spacer(120),

// ============ SECTION J: MISSING WORK ============
h1('J. Missing Work'),

makeTable(
  ['Item', 'Description', 'Priority', 'Phase'],
  [
    ['Atomic DB transaction', 'PostgreSQL RPC for signal update + audit insert', 'CRITICAL', 'Phase 3'],
    ['Legacy function removal', 'Delete or hard-disable updateSignalTracking/cancelSignalTracking', 'HIGH', 'Phase 3'],
    ['Event handler registration', 'Wire signal.transition.completed consumers', 'MEDIUM', 'Phase 3'],
    ['Remote migration verification', 'Apply and verify both migrations on remote DB', 'HIGH', 'Phase 3'],
    ['Enum type for audit columns', 'Change from_status/to_status from TEXT to signal_status', 'MEDIUM', 'Phase 3'],
    ['Rate limiting', 'Add rate limiting to transition endpoint', 'MEDIUM', 'Deferred'],
    ['Normalization module wiring', 'Connect normalization/types.ts to data pipeline or remove', 'LOW', 'Phase 2'],
    ['Error model adoption', 'Refactor existing error handling to use DomainError', 'LOW', 'Phase 2'],
  ]
),
spacer(120),

// ============ SECTION K: FIX ORDER ============
h1('K. Recommended Fix Order'),
body('The following sequence minimizes risk and resolves dependencies in the correct order. Each step should be completed and verified before proceeding to the next.'),
spacer(60),

makeTable(
  ['Step', 'Action', 'Rationale', 'Verification'],
  [
    ['0', 'Git rebase/reset to resolve divergence', 'Must have clean state before new work', 'git status shows no divergence'],
    ['1', 'Remove legacy mutation functions', 'Close bypass path before any other changes', 'grep finds zero legacy function references'],
    ['2', 'Create PostgreSQL RPC for atomic transition', 'Core data integrity fix', 'Integration tests prove atomicity'],
    ['3', 'Update service to use RPC instead of two calls', 'Wire the atomic path', 'Service tests pass with new RPC'],
    ['4', 'Verify/apply remote migrations', 'DB schema must match code expectations', 'signal_transitions exists remotely'],
    ['5', 'Change audit columns to signal_status enum', 'Type safety for audit trail', 'Migration applies cleanly'],
    ['6', 'Remove as any casts', 'Code quality', 'TypeScript compiles with zero any casts'],
    ['7', 'Document rate limiting as deferred', 'Security acknowledgment', 'Explicit DEFERRED entry in worklog'],
    ['8', 'Run full regression gate', 'Verify no regressions', '357+ tests, typecheck, build pass'],
  ]
),
spacer(120),

// ============ SECTION L: VERDICT ============
h1('L. Verdicts'),

h2('L.1 Repository Ready for Commit?'),
statusLine('Verdict: ', 'NO - NOT YET', P.red),
body('The repository has three critical blockers (non-atomic transitions, legacy mutation path, unverified migrations) that must be resolved before committing. The current 133 staged files include both the Phase 2/3 source code AND 115 non-code artifacts (reports, search data, generators). These should be separated into at least two commits: one for the source code changes and one (or more) for the artifacts. Additionally, the git divergence between 32bbf14 and 4ffad75 must be resolved first.'),
spacer(80),

h2('L.2 Repository Ready for Phase 4?'),
statusLine('Verdict: ', 'NO - NOT YET', P.red),
body('Phase 4 readiness requires all Phase 2 and Phase 3 tasks to reach at least PROVEN maturity. Currently, three critical items remain at EXISTS or PARTIAL maturity: atomic transitions (EXISTS), legacy function removal (PARTIAL), and event handler wiring (EXISTS with zero consumers). The migration verification is also a prerequisite. Phase 4 must NOT begin until these are resolved and the regression gate passes with the fixes in place.'),
spacer(80),

h2('L.3 Regression Gate Results (Current State)'),
makeTable(
  ['Check', 'Result', 'Notes'],
  [
    ['TypeScript typecheck', 'PASS', 'Zero type errors'],
    ['Tests', 'PASS (357/357)', '20 test files, 18.5s'],
    ['Production build', 'PASS', 'Built in 30.1s'],
    ['Legacy mutation bypass', 'PARTIAL', 'Zero callers but functions still exported'],
    ['Atomic transition', 'FAIL', 'Sequential operations, no rollback on audit failure'],
    ['Event handlers', 'FAIL', 'Zero VixorEvents.on() calls in entire codebase'],
    ['Migrations verified remotely', 'UNKNOWN', 'No Supabase credentials available'],
  ]
),

      ]
    },
  ],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('/home/z/my-project/download/VIXOR_GIT_PHASE_RECONCILIATION_AUDIT.docx', buf);
  console.log('DONE: /home/z/my-project/download/VIXOR_GIT_PHASE_RECONCILIATION_AUDIT.docx');
});

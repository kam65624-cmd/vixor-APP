import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  CAUTION_CASE_ID,
  HIGH_RISK_CASE_ID,
  LOW_RISK_CASE_ID,
  cautionBundle,
  highRiskBundle,
  lowRiskBundle,
} from "@/domains/case/fixtures";
import { CASE_STAGE_ORDER } from "@/domains/case/state-machine";
import type { CaseBundle } from "@/domains/case/types";
import { getCharacter } from "../../../../packages/vixor-gamification/src/characters/registry";

export const Route = createFileRoute("/v2/case/$caseId")({
  head: () => ({ meta: [{ title: "Case — VIXOR" }] }),
  component: V2CaseOverview,
});

const BUNDLES: Record<string, CaseBundle> = {
  [LOW_RISK_CASE_ID]: lowRiskBundle,
  [CAUTION_CASE_ID]: cautionBundle,
  [HIGH_RISK_CASE_ID]: highRiskBundle,
};

const STAGE_LABELS: Record<string, { label: string; characterId: string }> = {
  new: { label: "New", characterId: "moxi" },
  target_selected: { label: "Target", characterId: "moxi" },
  signal_explained: { label: "Signal", characterId: "moxi" },
  evidence_loading: { label: "Evidence", characterId: "mrVigo" },
  evidence_ready: { label: "Evidence", characterId: "mrVigo" },
  risk_assessed: { label: "Risk", characterId: "drDex" },
  decision_pending: { label: "Decision", characterId: "drDex" },
  decision_recorded: { label: "Recorded", characterId: "echo" },
  tracking: { label: "Tracking", characterId: "echo" },
  outcome_reviewed: { label: "Outcome", characterId: "echo" },
};

function V2CaseOverview() {
  const { caseId } = Route.useParams();
  const bundle = BUNDLES[caseId];

  const currentStageIndex = useMemo(
    () => (bundle ? CASE_STAGE_ORDER.indexOf(bundle.case.stage) : -1),
    [bundle],
  );

  if (!bundle) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold" style={{ color: "var(--color-foreground)" }}>
          Case not found
        </h1>
        <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
          No demo case matches id "{caseId}".{" "}
          <Link to="/v2/discover" className="underline" style={{ color: "var(--color-primary)" }}>
            Back to Discover
          </Link>
        </p>
      </div>
    );
  }

  const { case: c, target, signals, evidence, scans, riskAssessments, decisions } = bundle;
  const scan = scans[0];
  const risk = riskAssessments[0];
  const decision = decisions[0];
  const signal = signals[0];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-foreground)" }}>
          {target.symbol ?? target.address.slice(0, 8)}
        </h1>
        <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
          {target.name ?? "Demo target"} • {target.network ?? "unknown"}
        </p>
        <p
          className="mt-1 text-[10px] uppercase tracking-wide"
          style={{ color: "var(--color-muted-foreground)" }}
        >
          Case ID: {c.id} • Stage: {c.stage}
        </p>
      </header>

      {signal && (
        <section
          className="rounded-lg border p-4"
          style={{
            background: "var(--color-card)",
            borderColor: "var(--color-border)",
          }}
        >
          <h2
            className="text-xs font-bold uppercase tracking-wide"
            style={{ color: "var(--color-foreground)" }}
          >
            Signal
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--color-foreground)" }}>
            {signal.reason}
          </p>
          <p className="mt-1 text-[10px]" style={{ color: "var(--color-muted-foreground)" }}>
            Confidence: {signal.confidence}% • Source: {signal.source}
          </p>
        </section>
      )}

      <section>
        <h2
          className="mb-2 text-xs font-bold uppercase tracking-wide"
          style={{ color: "var(--color-foreground)" }}
        >
          Progress
        </h2>
        <ol className="flex flex-wrap gap-2">
          {CASE_STAGE_ORDER.map((stage, idx) => {
            const meta = STAGE_LABELS[stage];
            const character = getCharacter(meta.characterId as "moxi");
            const done = idx <= currentStageIndex;
            return (
              <li
                key={stage}
                className="rounded border px-2 py-1 text-[10px]"
                style={{
                  borderColor: done ? "var(--color-primary)" : "var(--color-border)",
                  background: done ? "var(--color-muted)" : "transparent",
                  color: "var(--color-foreground)",
                }}
              >
                {character.displayName} • {meta.label}
              </li>
            );
          })}
        </ol>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div
          className="rounded-lg border p-4"
          style={{
            background: "var(--color-card)",
            borderColor: "var(--color-border)",
          }}
        >
          <h3
            className="text-[10px] font-bold uppercase tracking-wide"
            style={{ color: "var(--color-muted-foreground)" }}
          >
            Evidence
          </h3>
          <p className="mt-1 text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>
            {evidence.length} items
          </p>
          <Link
            to="/v2/case/$caseId/evidence"
            params={{ caseId: c.id }}
            className="mt-2 inline-block text-xs underline"
            style={{ color: "var(--color-primary)" }}
          >
            Open MR.VIGO view
          </Link>
        </div>
        <div
          className="rounded-lg border p-4"
          style={{
            background: "var(--color-card)",
            borderColor: "var(--color-border)",
          }}
        >
          <h3
            className="text-[10px] font-bold uppercase tracking-wide"
            style={{ color: "var(--color-muted-foreground)" }}
          >
            Risk
          </h3>
          <p className="mt-1 text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>
            {risk?.status ?? "—"}
          </p>
          {scan && scan.status !== "complete" && (
            <p className="mt-1 text-[10px]" style={{ color: "var(--color-bearish)" }}>
              Scan status: {scan.status} — not safe to conclude
            </p>
          )}
          <Link
            to="/v2/case/$caseId/risk"
            params={{ caseId: c.id }}
            className="mt-2 inline-block text-xs underline"
            style={{ color: "var(--color-primary)" }}
          >
            Open DR.DEX view
          </Link>
        </div>
        <div
          className="rounded-lg border p-4"
          style={{
            background: "var(--color-card)",
            borderColor: "var(--color-border)",
          }}
        >
          <h3
            className="text-[10px] font-bold uppercase tracking-wide"
            style={{ color: "var(--color-muted-foreground)" }}
          >
            Decision
          </h3>
          <p className="mt-1 text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>
            {decision?.action ?? "pending"}
          </p>
          <Link
            to="/v2/case/$caseId/decision"
            params={{ caseId: c.id }}
            className="mt-2 inline-block text-xs underline"
            style={{ color: "var(--color-primary)" }}
          >
            Open decision view
          </Link>
        </div>
      </section>
    </div>
  );
}

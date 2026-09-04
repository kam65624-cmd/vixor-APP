import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, CheckCircle2 } from "lucide-react";
import {
  CAUTION_CASE_ID,
  HIGH_RISK_CASE_ID,
  LOW_RISK_CASE_ID,
  cautionBundle,
  highRiskBundle,
  lowRiskBundle,
} from "@/domains/case/fixtures";
import { getCharacter } from "../../../../../packages/vixor-gamification/src/characters/registry";
import type { CaseBundle, DecisionAction } from "@/domains/case/types";

export const Route = createFileRoute("/v2/case/$caseId/decision")({
  head: () => ({ meta: [{ title: "Decision — VIXOR" }] }),
  component: V2Decision,
});

const BUNDLES: Record<string, CaseBundle> = {
  [LOW_RISK_CASE_ID]: lowRiskBundle,
  [CAUTION_CASE_ID]: cautionBundle,
  [HIGH_RISK_CASE_ID]: highRiskBundle,
};

const ACTIONS: { id: DecisionAction; label: string }[] = [
  { id: "watch", label: "Watch" },
  { id: "wait", label: "Wait" },
  { id: "investigate_further", label: "Investigate further" },
  { id: "paper_test", label: "Paper review" },
  { id: "avoid", label: "Avoid" },
];

function V2Decision() {
  const { caseId } = Route.useParams();
  const navigate = useNavigate();
  const drDex = getCharacter("drDex");
  const echo = getCharacter("echo");
  const bundle = BUNDLES[caseId];

  const existing = bundle?.decisions[0];
  const initialAction: DecisionAction | "" = existing?.action ?? "";
  const [action, setAction] = useState<DecisionAction | "">(initialAction);
  const [rationale, setRationale] = useState<string>(existing?.rationale ?? "");
  const [invalidation, setInvalidation] = useState<string>(existing?.invalidationCondition ?? "");
  const [saved, setSaved] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!bundle) {
    return (
      <div className="space-y-4">
        <Link
          to="/v2/case/$caseId"
          params={{ caseId }}
          className="inline-flex items-center gap-1 text-xs"
          style={{ color: "var(--color-muted-foreground)" }}
        >
          <ChevronLeft size={14} /> Back to case
        </Link>
        <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
          No demo case matches id "{caseId}".
        </p>
      </div>
    );
  }

  function handleSave() {
    if (!action) {
      setError("Please choose an action.");
      return;
    }
    if (rationale.trim().length < 5) {
      setError("Please provide a rationale (at least 5 characters).");
      return;
    }
    setError(null);
    setSaved(true);
  }

  return (
    <div className="space-y-6">
      <Link
        to="/v2/case/$caseId"
        params={{ caseId }}
        className="inline-flex items-center gap-1 text-xs"
        style={{ color: "var(--color-muted-foreground)" }}
      >
        <ChevronLeft size={14} /> Back to case
      </Link>

      <div className="flex items-center gap-3">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold"
          style={{
            background: "var(--color-muted)",
            color: "var(--color-foreground)",
          }}
        >
          D
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-foreground)" }}>
            {drDex.displayName}
          </h1>
          <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
            Decision review (with {echo.displayName} recording)
          </p>
        </div>
      </div>

      <p
        className="rounded-lg p-3 text-xs"
        style={{
          background: "var(--color-muted)",
          color: "var(--color-muted-foreground)",
        }}
      >
        This is a paper decision. No wallet, no real trade.
      </p>

      {saved ? (
        <section
          className="rounded-lg border p-6 text-center"
          style={{
            background: "var(--color-card)",
            borderColor: "var(--color-bullish)",
          }}
        >
          <CheckCircle2 size={32} className="mx-auto" style={{ color: "var(--color-bullish)" }} />
          <h2 className="mt-3 text-lg font-bold" style={{ color: "var(--color-foreground)" }}>
            Decision recorded
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--color-muted-foreground)" }}>
            Action: {action} • Rationale captured. ECHO will track outcomes for learning.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <button
              onClick={() => navigate({ to: "/v2/discover" })}
              className="rounded px-3 py-1.5 text-xs"
              style={{
                background: "var(--color-muted)",
                color: "var(--color-foreground)",
              }}
            >
              Back to Discover
            </button>
            <Link
              to="/v2"
              className="rounded px-3 py-1.5 text-xs"
              style={{
                background: "var(--color-primary)",
                color: "var(--color-primary-foreground)",
              }}
            >
              Home
            </Link>
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          <div>
            <label
              className="text-[10px] font-bold uppercase tracking-wide"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              Action
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3">
              {ACTIONS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAction(a.id)}
                  className="rounded border px-3 py-2 text-sm"
                  style={{
                    background: action === a.id ? "var(--color-muted)" : "var(--color-card)",
                    borderColor: action === a.id ? "var(--color-primary)" : "var(--color-border)",
                    color: "var(--color-foreground)",
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              className="text-[10px] font-bold uppercase tracking-wide"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              Rationale (required)
            </label>
            <textarea
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              rows={3}
              placeholder="Why are you making this decision?"
              className="mt-2 w-full rounded border p-2 text-sm"
              style={{
                background: "var(--color-card)",
                borderColor: "var(--color-border)",
                color: "var(--color-foreground)",
              }}
            />
          </div>

          <div>
            <label
              className="text-[10px] font-bold uppercase tracking-wide"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              Invalidation condition (optional)
            </label>
            <input
              value={invalidation}
              onChange={(e) => setInvalidation(e.target.value)}
              placeholder="What would make this decision wrong?"
              className="mt-2 w-full rounded border p-2 text-sm"
              style={{
                background: "var(--color-card)",
                borderColor: "var(--color-border)",
                color: "var(--color-foreground)",
              }}
            />
          </div>

          {error && (
            <p className="text-xs" style={{ color: "var(--color-bearish)" }}>
              {error}
            </p>
          )}

          <button
            onClick={handleSave}
            className="rounded-lg px-5 py-3 text-sm font-semibold"
            style={{
              background: "var(--color-primary)",
              color: "var(--color-primary-foreground)",
            }}
          >
            Record decision
          </button>
        </section>
      )}
    </div>
  );
}

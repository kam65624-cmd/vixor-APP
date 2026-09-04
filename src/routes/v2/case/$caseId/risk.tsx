import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CAUTION_CASE_ID,
  HIGH_RISK_CASE_ID,
  LOW_RISK_CASE_ID,
  cautionBundle,
  highRiskBundle,
  lowRiskBundle,
} from "@/domains/case/fixtures";
import { getCharacter } from "../../../../../packages/vixor-gamification/src/characters/registry";
import { ChevronLeft } from "lucide-react";
import type { CaseBundle } from "@/domains/case/types";

export const Route = createFileRoute("/v2/case/$caseId/risk")({
  head: () => ({ meta: [{ title: "Risk — VIXOR" }] }),
  component: V2Risk,
});

const BUNDLES: Record<string, CaseBundle> = {
  [LOW_RISK_CASE_ID]: lowRiskBundle,
  [CAUTION_CASE_ID]: cautionBundle,
  [HIGH_RISK_CASE_ID]: highRiskBundle,
};

const STATUS_COLORS: Record<string, string> = {
  "no-issue": "var(--color-bullish)",
  caution: "var(--color-neutral-wait, var(--color-muted))",
  "high-risk": "var(--color-bearish)",
  "unable-to-verify": "var(--color-bearish)",
};

function V2Risk() {
  const { caseId } = Route.useParams();
  const drDex = getCharacter("drDex");
  const bundle = BUNDLES[caseId];

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

  const scan = bundle.scans[0];
  const risk = bundle.riskAssessments[0];
  const isIncomplete = scan && scan.status !== "complete";

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
            Risk analyst
          </p>
        </div>
      </div>

      {isIncomplete && (
        <div
          className="rounded-lg border p-3 text-sm"
          style={{
            background: "var(--color-card)",
            borderColor: "var(--color-bearish)",
            color: "var(--color-foreground)",
          }}
        >
          <strong>Incomplete scan.</strong> Scan status is "{scan.status}". Risk assessment is not
          reliable — do not treat this case as safe.
        </div>
      )}

      {risk && (
        <section
          className="rounded-lg border p-4"
          style={{
            background: "var(--color-card)",
            borderColor: "var(--color-border)",
          }}
        >
          <h2
            className="text-xs font-bold uppercase tracking-wide"
            style={{ color: "var(--color-muted-foreground)" }}
          >
            Status
          </h2>
          <p
            className="mt-1 text-2xl font-extrabold"
            style={{ color: STATUS_COLORS[risk.status] ?? "var(--color-foreground)" }}
          >
            {risk.status}
          </p>

          {risk.reasons.length > 0 && (
            <div className="mt-4">
              <h3
                className="text-[10px] font-bold uppercase tracking-wide"
                style={{ color: "var(--color-muted-foreground)" }}
              >
                Reasons
              </h3>
              <ul
                className="mt-1 list-disc pl-5 text-sm"
                style={{ color: "var(--color-foreground)" }}
              >
                {risk.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {risk.unknowns.length > 0 && (
            <div className="mt-4">
              <h3
                className="text-[10px] font-bold uppercase tracking-wide"
                style={{ color: "var(--color-muted-foreground)" }}
              >
                Unknowns
              </h3>
              <ul
                className="mt-1 list-disc pl-5 text-sm"
                style={{ color: "var(--color-foreground)" }}
              >
                {risk.unknowns.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4">
            <h3
              className="text-[10px] font-bold uppercase tracking-wide"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              Recommended next action
            </h3>
            <p className="mt-1 text-sm" style={{ color: "var(--color-foreground)" }}>
              {risk.recommendedAction}
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

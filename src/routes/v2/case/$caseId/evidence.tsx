import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MockEvidenceProvider } from "@/domains/case/providers";
import { isSuccess, type ProviderResult } from "@/domains/case/providers/types";
import type { EvidenceItem } from "@/domains/case/types";
import { CAUTION_CASE_ID, HIGH_RISK_CASE_ID, LOW_RISK_CASE_ID } from "@/domains/case/fixtures";
import { getCharacter } from "../../../../../packages/vixor-gamification/src/characters/registry";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/v2/case/$caseId/evidence")({
  head: () => ({ meta: [{ title: "Evidence — VIXOR" }] }),
  component: V2Evidence,
});

const VALID_CASE_IDS = new Set([LOW_RISK_CASE_ID, CAUTION_CASE_ID, HIGH_RISK_CASE_ID]);

const provider = new MockEvidenceProvider();

function V2Evidence() {
  const { caseId } = Route.useParams();
  const mrVigo = getCharacter("mrVigo");
  const [result, setResult] = useState<ProviderResult<EvidenceItem[]> | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!VALID_CASE_IDS.has(caseId)) {
      setResult({
        data: null,
        status: "failed",
        source: "mock-evidence",
        fetchedAt: new Date().toISOString(),
        error: {
          code: "NO_DATA",
          message: `No demo case for id "${caseId}".`,
          retryable: false,
          provider: "mock-evidence",
        },
      });
      return;
    }
    provider.getEvidence(caseId).then((r) => {
      if (mounted) setResult(r);
    });
    return () => {
      mounted = false;
    };
  }, [caseId]);

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
          V
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-foreground)" }}>
            {mrVigo.displayName}
          </h1>
          <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
            Investigator — evidence view
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
        Evidence describes facts and sources. It does not interpret risk.
      </p>

      {result?.status === "loading" && (
        <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
          Loading evidence…
        </p>
      )}

      {result?.status === "partial" && (
        <div
          className="rounded-lg border p-3 text-xs"
          style={{
            background: "var(--color-card)",
            borderColor: "var(--color-bearish)",
            color: "var(--color-foreground)",
          }}
        >
          <strong>Partial evidence.</strong> Some sources were unavailable. This does not mean the
          case is safe.
          {result.warnings && result.warnings.length > 0 && (
            <ul className="mt-1 list-disc pl-4">
              {result.warnings.map((w, i) => (
                <li key={i}>{w.message}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {result?.status === "failed" && (
        <div
          className="rounded-lg border p-3 text-sm"
          style={{
            background: "var(--color-card)",
            borderColor: "var(--color-bearish)",
            color: "var(--color-foreground)",
          }}
        >
          Could not load evidence: {result.error?.message ?? "Unknown error"}
        </div>
      )}

      {result && isSuccess(result) && result.data && (
        <ul className="space-y-2">
          {result.data.map((e) => (
            <li
              key={e.id}
              className="rounded-lg border p-3"
              style={{
                background: "var(--color-card)",
                borderColor: "var(--color-border)",
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p
                    className="text-[10px] uppercase tracking-wide"
                    style={{ color: "var(--color-muted-foreground)" }}
                  >
                    {e.category} • {e.severity}
                  </p>
                  <p className="mt-1 text-sm" style={{ color: "var(--color-foreground)" }}>
                    {e.finding}
                  </p>
                  <p
                    className="mt-1 text-[10px]"
                    style={{ color: "var(--color-muted-foreground)" }}
                  >
                    Source: {e.source} • {e.observedAt}
                  </p>
                </div>
                <span
                  className="rounded px-2 py-0.5 text-[10px]"
                  style={{
                    background:
                      e.status === "confirmed"
                        ? "var(--color-bullish)"
                        : e.status === "unresolved"
                          ? "var(--color-neutral-wait, var(--color-muted))"
                          : "var(--color-bearish)",
                    color: "var(--color-primary-foreground)",
                  }}
                >
                  {e.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

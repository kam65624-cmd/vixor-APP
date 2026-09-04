import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MockDiscoveryProvider } from "@/domains/case/providers";
import { isSuccess, type ProviderResult } from "@/domains/case/providers/types";
import type { Target, Signal } from "@/domains/case/types";
import { CAUTION_CASE_ID, HIGH_RISK_CASE_ID, LOW_RISK_CASE_ID } from "@/domains/case/fixtures";

export const Route = createFileRoute("/v2/discover")({
  head: () => ({ meta: [{ title: "Discover — VIXOR" }] }),
  component: V2Discover,
});

const provider = new MockDiscoveryProvider();

const CASE_ID_BY_TARGET: Record<string, string> = {
  // SAMPLE mappings from fixtures
  "target-sample-low-risk": LOW_RISK_CASE_ID,
  "target-sample-caution": CAUTION_CASE_ID,
  "target-sample-high-risk": HIGH_RISK_CASE_ID,
};

function V2Discover() {
  const [result, setResult] = useState<ProviderResult<Target[]> | null>(null);
  const [signals, setSignals] = useState<Record<string, Signal>>({});

  useEffect(() => {
    let mounted = true;
    provider.listTargets().then((r) => {
      if (!mounted) return;
      setResult(r);
      if (isSuccess(r) && r.data) {
        Promise.all(
          r.data.map((t) => provider.getSignal(t.id).then((s) => [t.id, s] as const)),
        ).then((entries) => {
          if (!mounted) return;
          const map: Record<string, Signal> = {};
          for (const [id, s] of entries) {
            if (isSuccess(s) && s.data) map[id] = s.data;
          }
          setSignals(map);
        });
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-foreground)" }}>
          Discover
        </h1>
        <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
          Sample targets with signal provenance. Click a target to open its case.
        </p>
        <p
          className="mt-1 text-[10px] uppercase tracking-wide"
          style={{ color: "var(--color-muted-foreground)" }}
        >
          Demo data only • No real assets
        </p>
      </div>

      {result?.status === "loading" && (
        <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
          Loading demo targets…
        </p>
      )}

      {result?.status === "failed" && (
        <div
          className="rounded-lg border p-4"
          style={{
            background: "var(--color-card)",
            borderColor: "var(--color-border)",
          }}
        >
          <p className="text-sm font-semibold" style={{ color: "var(--color-bearish)" }}>
            Failed to load targets
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
            {result.error?.message ?? "Unknown error"}
          </p>
        </div>
      )}

      {result?.status === "unsupported" && (
        <div
          className="rounded-lg border p-4"
          style={{
            background: "var(--color-card)",
            borderColor: "var(--color-border)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
            Network not supported in demo mode.
          </p>
        </div>
      )}

      {result?.status === "empty" && (
        <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
          No demo targets available.
        </p>
      )}

      {result && isSuccess(result) && result.data && (
        <ul className="space-y-3">
          {result.data.map((t) => {
            const signal = signals[t.id];
            const caseId = CASE_ID_BY_TARGET[t.id];
            return (
              <li
                key={t.id}
                className="rounded-lg border p-4"
                style={{
                  background: "var(--color-card)",
                  borderColor: "var(--color-border)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-base font-bold"
                        style={{ color: "var(--color-foreground)" }}
                      >
                        {t.symbol ?? t.address.slice(0, 8)}
                      </span>
                      <span
                        className="rounded px-2 py-0.5 text-[10px]"
                        style={{
                          background: "var(--color-muted)",
                          color: "var(--color-muted-foreground)",
                        }}
                      >
                        {t.network ?? "unknown"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                      {t.address}
                    </p>
                    {signal && (
                      <div
                        className="mt-2 rounded p-2"
                        style={{ background: "var(--color-muted)" }}
                      >
                        <p
                          className="text-[10px] uppercase tracking-wide"
                          style={{ color: "var(--color-muted-foreground)" }}
                        >
                          Why it appeared
                        </p>
                        <p className="mt-1 text-xs" style={{ color: "var(--color-foreground)" }}>
                          {signal.reason}
                        </p>
                        <p
                          className="mt-1 text-[10px]"
                          style={{ color: "var(--color-muted-foreground)" }}
                        >
                          Confidence: {signal.confidence}% • Source: {signal.source}
                        </p>
                      </div>
                    )}
                  </div>
                  {caseId && (
                    <Link
                      to="/v2/case/$caseId"
                      params={{ caseId }}
                      className="shrink-0 rounded px-3 py-1.5 text-xs font-semibold"
                      style={{
                        background: "var(--color-primary)",
                        color: "var(--color-primary-foreground)",
                      }}
                    >
                      Open case
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { getCharacter } from "../../../packages/vixor-gamification/src/characters/registry";
import { LOW_RISK_CASE_ID, LOW_RISK_TARGET_ID } from "@/domains/case/fixtures";

export const Route = createFileRoute("/v2/onboarding")({
  head: () => ({ meta: [{ title: "Onboarding — VIXOR" }] }),
  component: V2Onboarding,
});

const NETWORKS = [
  { id: "ethereum", label: "Ethereum" },
  { id: "solana", label: "Solana" },
  { id: "bsc", label: "BNB Smart Chain" },
] as const;

function V2Onboarding() {
  const navigate = useNavigate();
  const moxi = getCharacter("moxi");
  const [step, setStep] = useState<"welcome" | "network" | "ready">("welcome");
  const [network, setNetwork] = useState<string>("ethereum");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold"
          style={{
            background: "var(--color-primary)",
            color: "var(--color-primary-foreground)",
          }}
        >
          M
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-foreground)" }}>
            {moxi.displayName}
          </h1>
          <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
            Main guide
          </p>
        </div>
      </div>

      {step === "welcome" && (
        <section className="space-y-4">
          <p className="text-base" style={{ color: "var(--color-foreground)" }}>
            Welcome. I will guide you through a decision case — discovery, evidence, risk, and your
            deliberate choice. No wallet, no real trades, just the workflow.
          </p>
          <div
            className="rounded-lg border p-4"
            style={{
              background: "var(--color-card)",
              borderColor: "var(--color-border)",
            }}
          >
            <h2
              className="mb-2 text-sm font-bold uppercase tracking-wide"
              style={{ color: "var(--color-foreground)" }}
            >
              What you will see
            </h2>
            <ol className="space-y-1 text-sm" style={{ color: "var(--color-muted-foreground)" }}>
              <li>1. A demo target with a clear reason for appearing.</li>
              <li>2. Evidence collected by MR.VIGO.</li>
              <li>3. Risk assessment by DR.DEX.</li>
              <li>4. Your decision with rationale and invalidation.</li>
              <li>5. ECHO will track the outcome for learning.</li>
            </ol>
          </div>
          <button
            onClick={() => setStep("network")}
            className="inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold"
            style={{
              background: "var(--color-primary)",
              color: "var(--color-primary-foreground)",
            }}
          >
            Continue
            <ChevronRight size={16} />
          </button>
        </section>
      )}

      {step === "network" && (
        <section className="space-y-4">
          <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
            Choose a demo network. This affects the sample target you will review.
          </p>
          <div className="grid grid-cols-1 gap-2">
            {NETWORKS.map((n) => (
              <button
                key={n.id}
                onClick={() => setNetwork(n.id)}
                className="rounded-lg border p-3 text-left"
                style={{
                  background: network === n.id ? "var(--color-muted)" : "var(--color-card)",
                  borderColor: network === n.id ? "var(--color-primary)" : "var(--color-border)",
                }}
              >
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--color-foreground)" }}
                >
                  {n.label}
                </span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep("ready")}
            className="inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold"
            style={{
              background: "var(--color-primary)",
              color: "var(--color-primary-foreground)",
            }}
          >
            Continue
            <ChevronRight size={16} />
          </button>
        </section>
      )}

      {step === "ready" && (
        <section className="space-y-4">
          <p className="text-sm" style={{ color: "var(--color-foreground)" }}>
            Ready. I will open a demo case on <strong>{network}</strong>. Remember: this is sample
            data with no real-world execution.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() =>
                navigate({
                  to: "/v2/case/$caseId",
                  params: { caseId: LOW_RISK_CASE_ID },
                })
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold"
              style={{
                background: "var(--color-primary)",
                color: "var(--color-primary-foreground)",
              }}
            >
              Start Demo Case
              <ChevronRight size={16} />
            </button>
            <Link
              to="/v2/discover"
              className="text-center text-sm underline"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              Or browse the demo feed
            </Link>
          </div>
          <p className="text-[10px]" style={{ color: "var(--color-muted-foreground)" }}>
            Demo target ID: {LOW_RISK_TARGET_ID} • Demo case ID: {LOW_RISK_CASE_ID}
          </p>
        </section>
      )}
    </div>
  );
}

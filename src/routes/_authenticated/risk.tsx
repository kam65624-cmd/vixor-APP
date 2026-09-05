// ============================================================================
// DR.DEX — Risk & Decision Safety Surface
// ============================================================================
//
// Route: /risk
// Purpose: Assess token risk using Shield + Liquidity data + Risk Governor,
//          then allow the user to log a Paper Decision (no execution).
//
// This is the second character surface in the VIXOR decision loop:
//   MOXI (Discovery) → MR.VIGO (Investigation) → DR.DEX (Risk & Decision)
//
// Design rules:
//   1. No 3D character, no decorative UI
//   2. Clear separation between High Risk and Unable to Verify
//   3. Position sizing is a recommendation only
//   4. Every decision is paper — no execution path
// ============================================================================

import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Lock,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  HelpCircle,
} from "lucide-react";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { assessToken, logPaperDecision } from "@/domains/dr-dex";
import type { GovernorAction, PaperDecision, RiskAssessment, RiskVerdict } from "@/domains/dr-dex";
import { PageLayout, PageScrollArea } from "@/components/vixor/PageLayout";

// ── Route Definition ────────────────────────────────────────────────────────

export const Route = createFileRoute("/_authenticated/risk")({
  head: () => ({
    meta: [{ title: "Risk & Decision — DR.DEX — VIXOR" }],
  }),
  component: DexRiskPage,
  validateSearch: (search: Record<string, unknown>) => ({
    address: (search.address as string) || undefined,
    chain: (search.chain as string) || undefined,
  }),
});

// ── Helpers ────────────────────────────────────────────────────────────────

const CHAINS = [
  { id: "solana", label: "Solana", placeholder: "Token mint address" },
  { id: "ethereum", label: "Ethereum", placeholder: "0x... contract address" },
  { id: "bsc", label: "BSC", placeholder: "0x... contract address" },
  { id: "base", label: "Base", placeholder: "0x... contract address" },
] as const;

type ChainId = (typeof CHAINS)[number]["id"];

function verdictConfig(v: RiskVerdict) {
  switch (v) {
    case "LOW_RISK":
      return { color: "var(--color-bullish)", label: "LOW RISK", Icon: ShieldCheck };
    case "MODERATE_RISK":
      return { color: "var(--color-neutral-wait)", label: "MODERATE RISK", Icon: Shield };
    case "HIGH_RISK":
      return { color: "#F59E0B", label: "HIGH RISK", Icon: ShieldAlert };
    case "EXTREME_RISK":
      return { color: "var(--color-bearish)", label: "EXTREME RISK", Icon: AlertOctagon };
    case "UNABLE_TO_VERIFY":
      return {
        color: "var(--color-muted-foreground)",
        label: "UNABLE TO VERIFY",
        Icon: HelpCircle,
      };
  }
}

function actionConfig(a: GovernorAction) {
  switch (a) {
    case "PROCEED":
      return { color: "var(--color-bullish)", label: "PROCEED", Icon: CheckCircle2 };
    case "REDUCE_SIZE":
      return { color: "#F59E0B", label: "REDUCE SIZE", Icon: TrendingDown };
    case "WAIT":
      return { color: "var(--color-neutral-wait)", label: "WAIT", Icon: Clock };
    case "BLOCK":
      return { color: "var(--color-bearish)", label: "BLOCK", Icon: XCircle };
  }
}

function actionIcon(a: "BUY" | "SELL" | "WAIT") {
  switch (a) {
    case "BUY":
      return TrendingUp;
    case "SELL":
      return TrendingDown;
    case "WAIT":
      return Minus;
  }
}

// ── Sub-components ─────────────────────────────────────────────────────────

function ActionCard({ assessment }: { assessment: RiskAssessment }) {
  const vc = verdictConfig(assessment.riskVerdict);
  const ac = actionConfig(assessment.governorDecision.action);
  const VerdictIcon = vc.Icon;
  const ActionIcon = ac.Icon;

  return (
    <div
      style={{
        padding: 20,
        borderRadius: 14,
        background: `color-mix(in srgb, ${vc.color} 8%, var(--color-card))`,
        border: `1px solid color-mix(in srgb, ${vc.color} 30%, var(--color-border))`,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Verdict */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: `color-mix(in srgb, ${vc.color} 15%, transparent)`,
            border: `1px solid color-mix(in srgb, ${vc.color} 35%, transparent)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <VerdictIcon size={28} style={{ color: vc.color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: vc.color,
              }}
            >
              RISK VERDICT
            </span>
            <span
              style={{
                padding: "3px 10px",
                borderRadius: 6,
                background: vc.color,
                color: "white",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.04em",
              }}
            >
              {vc.label}
            </span>
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: "var(--color-foreground)",
              marginTop: 4,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {assessment.token.name}{" "}
            <span style={{ color: "var(--color-muted-foreground)", fontWeight: 600 }}>
              ({assessment.token.symbol})
            </span>
          </div>
        </div>
      </div>

      {/* Governor Decision */}
      <div
        style={{
          padding: 14,
          borderRadius: 10,
          background: "var(--color-muted, rgba(255,255,255,0.03))",
          border: "1px solid var(--color-border)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <ActionIcon size={16} style={{ color: ac.color }} />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.06em",
              color: ac.color,
            }}
          >
            GOVERNOR DECISION: {ac.label}
          </span>
        </div>
        <p
          style={{
            fontSize: 12,
            color: "var(--color-foreground)",
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {assessment.governorDecision.reason}
        </p>
        {assessment.governorDecision.warnings.length > 0 && (
          <ul
            style={{
              marginTop: 10,
              paddingLeft: 16,
              fontSize: 11,
              color: "var(--color-muted-foreground)",
              lineHeight: 1.6,
            }}
          >
            {assessment.governorDecision.warnings.map((w, i) => (
              <li key={i}>
                <AlertTriangle
                  size={10}
                  style={{ display: "inline", marginRight: 4, color: "#F59E0B" }}
                />
                {w}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Position Sizing Recommendation */}
      {assessment.governorDecision.suggestedSizePct > 0 && (
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            background: "color-mix(in srgb, var(--color-primary) 8%, transparent)",
            border: "1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Shield size={12} style={{ color: "var(--color-primary)" }} />
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.06em",
                color: "var(--color-primary)",
              }}
            >
              RECOMMENDED POSITION SIZE
            </span>
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: "var(--color-foreground)",
              marginTop: 4,
              fontFamily: "var(--font-mono)",
            }}
          >
            {(assessment.governorDecision.suggestedSizePct * 100).toFixed(1)}%
          </div>
          <p
            style={{
              fontSize: 10,
              color: "var(--color-muted-foreground)",
              margin: 0,
              marginTop: 4,
              fontStyle: "italic",
            }}
          >
            of your normal position size. Recommendation only — you decide.
          </p>
        </div>
      )}
    </div>
  );
}

function SecuritySummaryCard({ assessment }: { assessment: RiskAssessment }) {
  const { securitySummary } = assessment;
  const checks = [
    {
      label: "Honeypot",
      passed: !securitySummary.isHoneypot,
      detail: securitySummary.isHoneypot ? "Token is a honeypot" : "No honeypot patterns detected",
    },
    {
      label: "Mintable",
      passed: !securitySummary.isMintable,
      detail: securitySummary.isMintable ? "Owner can increase supply" : "Supply is fixed",
    },
    {
      label: "Ownership Renounced",
      passed: securitySummary.ownershipRenounced,
      detail: securitySummary.ownershipRenounced
        ? "Contract ownership is renounced"
        : "Owner retains privileged functions",
    },
  ];

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 12,
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
      }}
    >
      <h3
        style={{
          fontSize: 13,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--color-foreground)",
          marginBottom: 12,
        }}
      >
        Security Summary
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {checks.map((c) => (
          <div
            key={c.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 10px",
              borderRadius: 8,
              background: "var(--color-muted, rgba(255,255,255,0.03))",
            }}
          >
            {c.passed ? (
              <CheckCircle2 size={14} style={{ color: "var(--color-bullish)" }} />
            ) : (
              <XCircle size={14} style={{ color: "var(--color-bearish)" }} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-foreground)" }}>
                {c.label}
              </div>
              <div style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>{c.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PaperDecisionForm({
  assessment,
  onSubmit,
  isSubmitting,
}: {
  assessment: RiskAssessment;
  onSubmit: (decision: Omit<PaperDecision, "decidedAt">) => void;
  isSubmitting: boolean;
}) {
  const [action, setAction] = useState<"BUY" | "SELL" | "WAIT">("WAIT");
  const [rationale, setRationale] = useState("");
  const [invalidation, setInvalidation] = useState("");
  const [sizePct, setSizePct] = useState(assessment.governorDecision.suggestedSizePct || 0);

  // Auto-set action based on Governor
  useEffect(() => {
    if (assessment.governorDecision.action === "PROCEED") {
      setAction("BUY");
    } else if (assessment.governorDecision.action === "BLOCK") {
      setAction("WAIT");
    }
  }, [assessment.governorDecision.action]);

  const handleSubmit = useCallback(() => {
    if (!rationale.trim() || !invalidation.trim()) return;
    onSubmit({
      tokenAddress: assessment.token.address,
      chain: assessment.token.chain,
      action,
      rationale: rationale.trim(),
      invalidationCondition: invalidation.trim(),
      positionSizePct: sizePct,
      governorAction: assessment.governorDecision.action,
    });
  }, [assessment, action, rationale, invalidation, sizePct, onSubmit]);

  const isBlocked = assessment.governorDecision.action === "BLOCK";

  return (
    <div
      style={{
        padding: 20,
        borderRadius: 14,
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <FileText size={16} style={{ color: "var(--color-primary)" }} />
        <h3
          style={{
            fontSize: 14,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--color-foreground)",
          }}
        >
          Log Paper Decision
        </h3>
        <span
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "3px 8px",
            borderRadius: 4,
            background: "color-mix(in srgb, var(--color-bullish) 10%, transparent)",
            color: "var(--color-bullish)",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.06em",
          }}
        >
          <Lock size={10} />
          PAPER ONLY
        </span>
      </div>

      <p
        style={{
          fontSize: 11,
          color: "var(--color-muted-foreground)",
          marginBottom: 16,
          lineHeight: 1.5,
        }}
      >
        This decision is logged on paper. Nothing will be executed. ECHO will track the outcome
        later.
      </p>

      {isBlocked && (
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            background: "color-mix(in srgb, var(--color-bearish) 8%, transparent)",
            border: "1px solid color-mix(in srgb, var(--color-bearish) 25%, transparent)",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <AlertOctagon size={14} style={{ color: "var(--color-bearish)" }} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--color-bearish)",
              }}
            >
              Governor returned BLOCK. Consider logging WAIT to record why.
            </span>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Action selector */}
        <div>
          <label
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.04em",
              color: "var(--color-muted-foreground)",
              display: "block",
              marginBottom: 6,
            }}
          >
            ACTION
          </label>
          <div style={{ display: "flex", gap: 6 }}>
            {(["BUY", "SELL", "WAIT"] as const).map((a) => {
              const Icon = actionIcon(a);
              return (
                <button
                  key={a}
                  onClick={() => setAction(a)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: 8,
                    border:
                      action === a
                        ? "1px solid var(--color-primary)"
                        : "1px solid var(--color-border)",
                    background:
                      action === a
                        ? "color-mix(in srgb, var(--color-primary) 12%, transparent)"
                        : "transparent",
                    color: action === a ? "var(--color-primary)" : "var(--color-muted-foreground)",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <Icon size={12} />
                  {a}
                </button>
              );
            })}
          </div>
        </div>

        {/* Position size */}
        <div>
          <label
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.04em",
              color: "var(--color-muted-foreground)",
              display: "block",
              marginBottom: 6,
            }}
          >
            POSITION SIZE ({(sizePct * 100).toFixed(1)}% of normal)
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={sizePct * 100}
            onChange={(e) => setSizePct(Number(e.target.value) / 100)}
            style={{ width: "100%" }}
          />
        </div>

        {/* Rationale */}
        <div>
          <label
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.04em",
              color: "var(--color-muted-foreground)",
              display: "block",
              marginBottom: 6,
            }}
          >
            RATIONALE
          </label>
          <textarea
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            placeholder="Why are you making this decision? What did you observe?"
            rows={3}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid var(--color-border)",
              background: "var(--color-muted, rgba(255,255,255,0.03))",
              color: "var(--color-foreground)",
              fontSize: 12,
              fontFamily: "var(--font-sans)",
              resize: "vertical",
            }}
          />
        </div>

        {/* Invalidation */}
        <div>
          <label
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.04em",
              color: "var(--color-muted-foreground)",
              display: "block",
              marginBottom: 6,
            }}
          >
            INVALIDATION CONDITION
          </label>
          <textarea
            value={invalidation}
            onChange={(e) => setInvalidation(e.target.value)}
            placeholder="What would prove this decision wrong? (e.g. price below $0.001)"
            rows={2}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid var(--color-border)",
              background: "var(--color-muted, rgba(255,255,255,0.03))",
              color: "var(--color-foreground)",
              fontSize: 12,
              fontFamily: "var(--font-sans)",
              resize: "vertical",
            }}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !rationale.trim() || !invalidation.trim()}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            border: "none",
            background:
              isSubmitting || !rationale.trim() || !invalidation.trim()
                ? "var(--color-muted)"
                : "var(--color-primary)",
            color: "white",
            fontSize: 12,
            fontWeight: 700,
            cursor:
              isSubmitting || !rationale.trim() || !invalidation.trim() ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            opacity: isSubmitting || !rationale.trim() || !invalidation.trim() ? 0.6 : 1,
          }}
        >
          {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
          Log Paper Decision
        </button>
      </div>
    </div>
  );
}

function LoggedDecisionCard({ decision }: { decision: PaperDecision }) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 12,
        background: "color-mix(in srgb, var(--color-bullish) 6%, var(--color-card))",
        border: "1px solid color-mix(in srgb, var(--color-bullish) 25%, var(--color-border))",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <CheckCircle2 size={16} style={{ color: "var(--color-bullish)" }} />
        <h3
          style={{
            fontSize: 13,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--color-bullish)",
          }}
        >
          Decision Logged
        </h3>
      </div>
      <div
        style={{
          fontSize: 11,
          color: "var(--color-muted-foreground)",
          lineHeight: 1.5,
        }}
      >
        <div>
          <strong style={{ color: "var(--color-foreground)" }}>Action:</strong> {decision.action}
        </div>
        <div>
          <strong style={{ color: "var(--color-foreground)" }}>Size:</strong>{" "}
          {(decision.positionSizePct * 100).toFixed(1)}%
        </div>
        <div>
          <strong style={{ color: "var(--color-foreground)" }}>Rationale:</strong>{" "}
          {decision.rationale}
        </div>
        <div>
          <strong style={{ color: "var(--color-foreground)" }}>Invalidation:</strong>{" "}
          {decision.invalidationCondition}
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 10,
            fontStyle: "italic",
            color: "var(--color-bullish)",
          }}
        >
          ECHO will track this decision's outcome when you import the data.
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

function DexRiskPage() {
  const search = useSearch({ strict: false }) as { address?: string; chain?: string };

  const [chain, setChain] = useState<ChainId>((search.chain as ChainId) || "solana");
  const [address, setAddress] = useState(search.address || "");
  const [debouncedAddress, setDebouncedAddress] = useState(search.address || "");

  const fetchAssessment = useStableServerFn(assessToken);
  const logDecision = useStableServerFn(logPaperDecision);

  const assessmentMutation = useMutation({
    mutationFn: (vars: { address: string; chain: string }) => fetchAssessment({ data: vars }),
  });

  const decisionMutation = useMutation({
    mutationFn: (vars: Omit<PaperDecision, "decidedAt">) => logDecision({ data: vars }),
  });

  // Auto-trigger from URL
  useEffect(() => {
    if (search.address && search.chain && !assessmentMutation.data) {
      setDebouncedAddress(search.address);
      assessmentMutation.mutate({ address: search.address, chain: search.chain });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce address
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedAddress(address), 300);
    return () => clearTimeout(timer);
  }, [address]);

  const handleAssess = useCallback(() => {
    if (!debouncedAddress.trim() || debouncedAddress.length < 10) return;
    assessmentMutation.mutate({ address: debouncedAddress.trim(), chain });
    decisionMutation.reset();
  }, [debouncedAddress, chain, assessmentMutation, decisionMutation]);

  const handleSubmitDecision = useCallback(
    (decision: Omit<PaperDecision, "decidedAt">) => {
      decisionMutation.mutate(decision);
    },
    [decisionMutation],
  );

  const result = assessmentMutation.data;
  const isLoading = assessmentMutation.isPending;
  const currentChain = CHAINS.find((c) => c.id === chain) ?? CHAINS[0];

  return (
    <PageLayout
      title="DR.DEX"
      badge="RISK & DECISION"
      badgeColor="var(--color-primary)"
      description="Token Risk Assessment + Paper Decision logging. Advisory only — no execution."
    >
      <PageScrollArea>
        <div
          style={{
            padding: 16,
            maxWidth: 720,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* ── 1. Search Bar ──────────────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              padding: 16,
              borderRadius: 12,
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div style={{ display: "flex", gap: 8 }}>
              {CHAINS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setChain(c.id)}
                  disabled={isLoading}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    border:
                      chain === c.id
                        ? "1px solid var(--color-primary)"
                        : "1px solid var(--color-border)",
                    background:
                      chain === c.id
                        ? "color-mix(in srgb, var(--color-primary) 12%, transparent)"
                        : "transparent",
                    color:
                      chain === c.id ? "var(--color-primary)" : "var(--color-muted-foreground)",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: isLoading ? "not-allowed" : "pointer",
                    opacity: isLoading ? 0.6 : 1,
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAssess()}
                placeholder={currentChain.placeholder}
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid var(--color-border)",
                  background: "var(--color-muted, rgba(255,255,255,0.03))",
                  color: "var(--color-foreground)",
                  fontSize: 13,
                  fontFamily: "var(--font-mono)",
                }}
              />
              <button
                onClick={handleAssess}
                disabled={isLoading || !debouncedAddress.trim() || debouncedAddress.length < 10}
                style={{
                  padding: "10px 20px",
                  borderRadius: 10,
                  border: "none",
                  background:
                    isLoading || !debouncedAddress.trim() || debouncedAddress.length < 10
                      ? "var(--color-muted)"
                      : "var(--color-primary)",
                  color: "white",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor:
                    isLoading || !debouncedAddress.trim() || debouncedAddress.length < 10
                      ? "not-allowed"
                      : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  opacity:
                    isLoading || !debouncedAddress.trim() || debouncedAddress.length < 10 ? 0.6 : 1,
                }}
              >
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
                Assess Risk
              </button>
            </div>
          </div>

          {/* ── 2. Error ──────────────────────────────────────────────── */}
          {assessmentMutation.isError && (
            <div
              style={{
                padding: 16,
                borderRadius: 10,
                background: "color-mix(in srgb, var(--color-bearish) 8%, transparent)",
                border: "1px solid color-mix(in srgb, var(--color-bearish) 25%, transparent)",
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
              }}
            >
              <AlertOctagon size={18} style={{ color: "var(--color-bearish)", flexShrink: 0 }} />
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--color-bearish)",
                  }}
                >
                  Risk assessment failed
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--color-muted-foreground)",
                    marginTop: 4,
                  }}
                >
                  {assessmentMutation.error instanceof Error
                    ? assessmentMutation.error.message
                    : "Unknown error."}
                </div>
              </div>
            </div>
          )}

          {/* ── 3. Results ────────────────────────────────────────────── */}
          {result && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <ActionCard assessment={result} />
              <SecuritySummaryCard assessment={result} />

              {/* Unknowns */}
              {result.unknowns.length > 0 && (
                <div
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    background: "color-mix(in srgb, var(--color-neutral-wait) 8%, transparent)",
                    border:
                      "1px solid color-mix(in srgb, var(--color-neutral-wait) 25%, transparent)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 8,
                    }}
                  >
                    <HelpCircle size={14} style={{ color: "var(--color-neutral-wait)" }} />
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "var(--color-neutral-wait)",
                      }}
                    >
                      {result.unknowns.length} unknown(s) could not be verified
                    </span>
                  </div>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: 16,
                      fontSize: 11,
                      color: "var(--color-muted-foreground)",
                      lineHeight: 1.6,
                    }}
                  >
                    {result.unknowns.map((u, i) => (
                      <li key={i}>{u}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Decision Form or Logged Decision */}
              {decisionMutation.data ? (
                <LoggedDecisionCard decision={decisionMutation.data} />
              ) : (
                <PaperDecisionForm
                  assessment={result}
                  onSubmit={handleSubmitDecision}
                  isSubmitting={decisionMutation.isPending}
                />
              )}

              {/* Footer */}
              <div
                style={{
                  padding: 12,
                  borderRadius: 8,
                  background: "var(--color-muted)",
                  fontSize: 10,
                  color: "var(--color-muted-foreground)",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 12,
                  justifyContent: "space-between",
                }}
              >
                <span>Assessed: {new Date(result.assessedAt).toLocaleString()}</span>
                <a
                  href={chainExplorerUrl(result.token.chain, result.token.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "var(--color-primary)",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  View on chain explorer
                  <ExternalLink size={10} />
                </a>
              </div>
            </div>
          )}

          {/* ── 4. Empty State ────────────────────────────────────────── */}
          {!result && !isLoading && !assessmentMutation.isError && (
            <div
              style={{
                padding: 40,
                borderRadius: 12,
                background: "var(--color-card)",
                border: "1px dashed var(--color-border)",
                textAlign: "center",
              }}
            >
              <Shield
                size={32}
                style={{
                  color: "var(--color-muted-foreground)",
                  margin: "0 auto 12px",
                  display: "block",
                }}
              />
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--color-foreground)",
                  marginBottom: 6,
                }}
              >
                Enter a token address to assess risk
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--color-muted-foreground)",
                  maxWidth: 400,
                  margin: "0 auto",
                  lineHeight: 1.5,
                }}
              >
                DR.DEX evaluates security, liquidity, and risk profile, then returns a BLOCK / WAIT
                / REDUCE_SIZE / PROCEED decision. Every decision is paper — no execution, no
                on-chain transactions.
              </div>
            </div>
          )}
        </div>
      </PageScrollArea>
    </PageLayout>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function chainExplorerUrl(chain: string, address: string): string {
  const explorers: Record<string, string> = {
    solana: `https://solscan.io/token/${address}`,
    ethereum: `https://etherscan.io/token/${address}`,
    bsc: `https://bscscan.com/token/${address}`,
    base: `https://basescan.org/token/${address}`,
    arbitrum: `https://arbiscan.io/token/${address}`,
  };
  return explorers[chain] || `https://www.google.com/search?q=${chain}+token+${address}`;
}

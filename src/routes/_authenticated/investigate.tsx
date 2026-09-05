// ============================================================================
// MR.VIGO — Investigation Surface
// ============================================================================
//
// Route: /investigate
// Purpose: Aggregate evidence from multiple data sources (Shield, Hunt, Market)
//          into a single investigation view, with explicit source/timestamp/status
//          for every claim. Unknowns are surfaced, not hidden.
//
// This replaces the role of the legacy /analyze page in the VIXOR product
// decision loop. The page intentionally does NOT use the 3D MOXI character
// or any decorative UI — investigation is a focus task.
// ============================================================================

import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Search,
  Loader2,
  AlertCircle,
  ShieldCheck,
  AlertTriangle,
  X,
  CheckCircle2,
  Clock,
  ExternalLink,
  HelpCircle,
} from "lucide-react";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { investigateToken } from "@/domains/mr-vigo";
import type {
  InvestigationResult,
  Evidence,
  EvidenceStatus,
  EvidenceValue,
} from "@/domains/mr-vigo";
import { PageLayout, PageScrollArea, PageBadge } from "@/components/vixor/PageLayout";

// ── Route Definition ────────────────────────────────────────────────────────

export const Route = createFileRoute("/_authenticated/investigate")({
  head: () => ({
    meta: [{ title: "Investigation — MR.VIGO — VIXOR" }],
  }),
  component: VigoInvestigationPage,
  validateSearch: (search: Record<string, unknown>) => ({
    address: (search.address as string) || undefined,
    chain: (search.chain as string) || undefined,
  }),
});

// ── Helpers ────────────────────────────────────────────────────────────────

const CHAINS = [
  { id: "solana", label: "Solana", placeholder: "Token mint address (e.g. So11111...)" },
  { id: "ethereum", label: "Ethereum", placeholder: "0x... contract address" },
  { id: "bsc", label: "BSC", placeholder: "0x... contract address" },
  { id: "base", label: "Base", placeholder: "0x... contract address" },
] as const;

type ChainId = (typeof CHAINS)[number]["id"];

function verdictConfig(v: InvestigationResult["verdict"]) {
  switch (v) {
    case "SAFE":
      return { color: "var(--color-bullish)", label: "SAFE", Icon: ShieldCheck };
    case "CAUTION":
      return { color: "var(--color-neutral-wait)", label: "CAUTION", Icon: AlertTriangle };
    case "SUSPICIOUS":
      return { color: "#F59E0B", label: "SUSPICIOUS", Icon: AlertTriangle };
    case "DANGER":
      return { color: "var(--color-bearish)", label: "DANGER", Icon: X };
    case "UNABLE_TO_VERIFY":
      return {
        color: "var(--color-muted-foreground)",
        label: "UNABLE TO VERIFY",
        Icon: HelpCircle,
      };
  }
}

function statusConfig(s: EvidenceStatus) {
  switch (s) {
    case "verified":
      return { color: "var(--color-bullish)", label: "Verified", Icon: CheckCircle2 };
    case "reported":
      return { color: "var(--color-primary)", label: "Reported", Icon: Clock };
    case "unavailable":
      return { color: "var(--color-muted-foreground)", label: "Unavailable", Icon: X };
    case "unknown":
      return { color: "var(--color-muted-foreground)", label: "Unknown", Icon: HelpCircle };
  }
}

function formatValue(v: EvidenceValue | undefined): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(2)}K`;
    if (v < 0.0001) return v.toExponential(2);
    return v.toLocaleString("en-US", { maximumFractionDigits: 6 });
  }
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "object") {
    const parts: string[] = [];
    if ("website" in v && v.website) parts.push("Website");
    if ("twitter" in v && v.twitter) parts.push("Twitter");
    return parts.length > 0 ? parts.join(" + ") : "None";
  }
  return String(v);
}

// ── Sub-components ─────────────────────────────────────────────────────────

function EvidenceRow({ ev }: { ev: Evidence }) {
  const sc = statusConfig(ev.status);
  const StatusIcon = sc.Icon;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "12px 14px",
        borderRadius: 10,
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: `color-mix(in srgb, ${sc.color} 12%, transparent)`,
          border: `1px solid color-mix(in srgb, ${sc.color} 25%, transparent)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <StatusIcon size={14} style={{ color: sc.color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-foreground)" }}>
            {ev.label}
          </span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              padding: "2px 6px",
              borderRadius: 4,
              background: `color-mix(in srgb, ${sc.color} 10%, transparent)`,
              color: sc.color,
              border: `1px solid color-mix(in srgb, ${sc.color} 20%, transparent)`,
            }}
          >
            {sc.label}
          </span>
        </div>
        <div
          style={{
            fontSize: 13,
            fontFamily: "var(--font-mono)",
            color: "var(--color-foreground)",
            marginTop: 4,
            wordBreak: "break-word",
          }}
        >
          {formatValue(ev.value)}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 6,
            fontSize: 10,
            color: "var(--color-muted-foreground)",
          }}
        >
          <span>Source: {ev.source}</span>
          <span>•</span>
          <span>{new Date(ev.fetchedAt).toLocaleTimeString()}</span>
        </div>
        {ev.detail && (
          <div
            style={{
              marginTop: 6,
              padding: "6px 10px",
              borderRadius: 6,
              background: "var(--color-muted, rgba(255,255,255,0.03))",
              fontSize: 11,
              color: "var(--color-muted-foreground)",
              lineHeight: 1.5,
            }}
          >
            {ev.detail}
          </div>
        )}
      </div>
    </div>
  );
}

function EvidenceSection({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: Evidence[];
  emptyLabel: string;
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
          paddingBottom: 8,
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <h3
          style={{
            fontSize: 13,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--color-foreground)",
          }}
        >
          {title}
        </h3>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            padding: "2px 6px",
            borderRadius: 4,
            background: "var(--color-muted)",
            color: "var(--color-muted-foreground)",
          }}
        >
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <div
          style={{
            padding: 16,
            borderRadius: 10,
            background: "var(--color-muted)",
            border: "1px dashed var(--color-border)",
            color: "var(--color-muted-foreground)",
            fontSize: 12,
            textAlign: "center",
          }}
        >
          {emptyLabel}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((ev, i) => (
            <EvidenceRow key={`${ev.label}-${i}`} ev={ev} />
          ))}
        </div>
      )}
    </div>
  );
}

function UnknownsSection({ unknowns }: { unknowns: InvestigationResult["unknowns"] }) {
  if (unknowns.length === 0) {
    return (
      <div
        style={{
          padding: 16,
          borderRadius: 10,
          background: "color-mix(in srgb, var(--color-bullish) 8%, transparent)",
          border: "1px solid color-mix(in srgb, var(--color-bullish) 25%, transparent)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle2 size={16} style={{ color: "var(--color-bullish)" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-bullish)" }}>
            All critical evidence was successfully verified.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div
        style={{
          padding: 12,
          borderRadius: 8,
          background: "color-mix(in srgb, var(--color-neutral-wait) 8%, transparent)",
          border: "1px solid color-mix(in srgb, var(--color-neutral-wait) 25%, transparent)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <HelpCircle size={16} style={{ color: "var(--color-neutral-wait)" }} />
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--color-neutral-wait)",
            }}
          >
            {unknowns.length} item{unknowns.length > 1 ? "s" : ""} could not be verified.
          </span>
        </div>
        <p
          style={{
            fontSize: 11,
            color: "var(--color-muted-foreground)",
            marginTop: 6,
            lineHeight: 1.5,
          }}
        >
          MR.VIGO surfaces unknowns rather than hiding them. Treat this as incomplete information —
          the decision is yours.
        </p>
      </div>
      {unknowns.map((u, i) => (
        <div
          key={i}
          style={{
            padding: 12,
            borderRadius: 8,
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-foreground)" }}>
            {u.topic}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--color-muted-foreground)",
              marginTop: 4,
            }}
          >
            {u.reason}
          </div>
          {u.suggestion && (
            <div
              style={{
                fontSize: 11,
                color: "var(--color-primary)",
                marginTop: 6,
                fontStyle: "italic",
              }}
            >
              💡 {u.suggestion}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

function VigoInvestigationPage() {
  const search = useSearch({ strict: false }) as { address?: string; chain?: string };

  const [chain, setChain] = useState<ChainId>((search.chain as ChainId) || "solana");
  const [address, setAddress] = useState(search.address || "");
  const [debouncedAddress, setDebouncedAddress] = useState(search.address || "");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const fetchInvestigation = useStableServerFn(investigateToken);

  const investigationMutation = useMutation({
    mutationFn: (vars: { address: string; chain: string }) => fetchInvestigation({ data: vars }),
  });

  // Auto-trigger investigation if address is provided via URL
  useEffect(() => {
    if (search.address && search.chain && !investigationMutation.data) {
      setDebouncedAddress(search.address);
      investigationMutation.mutate({ address: search.address, chain: search.chain });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce address input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedAddress(address), 300);
    return () => clearTimeout(timer);
  }, [address]);

  const handleInvestigate = useCallback(() => {
    if (!debouncedAddress.trim() || debouncedAddress.length < 10) return;
    investigationMutation.mutate({ address: debouncedAddress.trim(), chain });
  }, [debouncedAddress, chain, investigationMutation]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleInvestigate();
    },
    [handleInvestigate],
  );

  const result = investigationMutation.data;
  const currentChain = CHAINS.find((c) => c.id === chain) ?? CHAINS[0];
  const isLoading = investigationMutation.isPending;

  return (
    <PageLayout
      title="MR.VIGO"
      badge="INVESTIGATION"
      badgeColor="var(--color-primary)"
      description="Token & Contract Investigation — Evidence-first, unknowns surfaced."
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
          {/* ── 1. Search Bar ──────────────────────────────────────────────── */}
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
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid var(--color-border)",
                  background: "var(--color-muted, rgba(255,255,255,0.03))",
                }}
              >
                <Search size={14} style={{ color: "var(--color-muted-foreground)" }} />
                <input
                  ref={inputRef}
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={currentChain.placeholder}
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "var(--color-foreground)",
                    fontSize: 13,
                    fontFamily: "var(--font-mono)",
                  }}
                />
              </div>
              <button
                onClick={handleInvestigate}
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
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                Investigate
              </button>
            </div>
          </div>

          {/* ── 2. Error State ─────────────────────────────────────────────── */}
          {investigationMutation.isError && (
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
              <AlertCircle size={18} style={{ color: "var(--color-bearish)", flexShrink: 0 }} />
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--color-bearish)",
                  }}
                >
                  Investigation failed
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--color-muted-foreground)",
                    marginTop: 4,
                  }}
                >
                  {investigationMutation.error instanceof Error
                    ? investigationMutation.error.message
                    : "Unknown error. Please try again."}
                </div>
              </div>
            </div>
          )}

          {/* ── 3. Results ────────────────────────────────────────────────── */}
          {result && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Verdict Card */}
              <VerdictCard result={result} />

              {/* Evidence Sections */}
              <EvidenceSection
                title="Security"
                items={result.evidence.security}
                emptyLabel="No security data available for this token."
              />
              <EvidenceSection
                title="Liquidity"
                items={result.evidence.liquidity}
                emptyLabel="No liquidity data available."
              />
              <EvidenceSection
                title="Ownership"
                items={result.evidence.ownership}
                emptyLabel="No ownership data available."
              />
              <EvidenceSection
                title="Market"
                items={result.evidence.market}
                emptyLabel="No market data available."
              />

              {/* Unknowns — explicitly surfaced */}
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 12,
                    paddingBottom: 8,
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <h3
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "var(--color-foreground)",
                    }}
                  >
                    Unknowns
                  </h3>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: "var(--color-muted)",
                      color: "var(--color-muted-foreground)",
                    }}
                  >
                    {result.unknowns.length}
                  </span>
                </div>
                <UnknownsSection unknowns={result.unknowns} />
              </div>

              {/* Metadata Footer */}
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
                <span>Investigated: {new Date(result.investigatedAt).toLocaleString()}</span>
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

          {/* ── 4. Empty State ────────────────────────────────────────────── */}
          {!result && !isLoading && !investigationMutation.isError && (
            <div
              style={{
                padding: 40,
                borderRadius: 12,
                background: "var(--color-card)",
                border: "1px dashed var(--color-border)",
                textAlign: "center",
              }}
            >
              <Search
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
                Enter a token address to begin investigation
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
                MR.VIGO aggregates evidence from Shield, Hunt, and Market data providers. Every
                claim includes its source and timestamp. Items that cannot be verified are shown as
                Unknowns — never silently omitted.
              </div>
            </div>
          )}
        </div>
      </PageScrollArea>
    </PageLayout>
  );
}

// ── Verdict Card ───────────────────────────────────────────────────────────

function VerdictCard({ result }: { result: InvestigationResult }) {
  const vc = verdictConfig(result.verdict);
  const VerdictIcon = vc.Icon;
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 14,
        background: `color-mix(in srgb, ${vc.color} 8%, var(--color-card))`,
        border: `1px solid color-mix(in srgb, ${vc.color} 30%, var(--color-border))`,
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
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
            VERDICT
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
            fontSize: 18,
            fontWeight: 800,
            color: "var(--color-foreground)",
            marginTop: 4,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {result.token.name}{" "}
          <span style={{ color: "var(--color-muted-foreground)", fontWeight: 600 }}>
            ({result.token.symbol})
          </span>
        </div>
        <div
          style={{
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            color: "var(--color-muted-foreground)",
            marginTop: 2,
          }}
        >
          {result.token.address.slice(0, 10)}...{result.token.address.slice(-6)}
        </div>
      </div>
    </div>
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

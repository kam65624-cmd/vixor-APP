import { createFileRoute, useNavigate, useRouter, useParams } from "@tanstack/react-router";
import { useState, useCallback, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { getTokenDetail } from "@/domains/hunt/functions";
import { PageLayout, PageScrollArea, PageBadge, ProgressBar } from "@/components/vixor/PageLayout";

// ── Mock Data ──────────────────────────────────────────────────────────────

// ── Helpers ────────────────────────────────────────────────────────────────

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function changeColor(change: number): string {
  return change >= 0 ? "var(--color-bullish)" : "var(--color-bearish)";
}

function changeText(change: number): string {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}%`;
}

function changeBg(change: number): string {
  return change >= 0 ? "var(--color-bullish)14" : "var(--color-bearish)14";
}

function buildSparklinePoints(data: string, w: number, h: number): string {
  const vals = data.split(",").map(Number);
  if (vals.length === 0) return "";
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const step = w / (vals.length - 1);
  return vals
    .map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

// ── Route ──────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/_authenticated/hunt/token/$address")({
  head: () => ({
    meta: [{ title: "Token Detail — HUNT" }],
  }),
  component: TokenDetailPage,
});

function TokenDetailPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const { address } = useParams({ strict: false }) as { address: string };
  const [copied, setCopied] = useState(false);
  const [selectedChain, setSelectedChain] = useState("solana");
  const stableDetail = useStableServerFn(getTokenDetail);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["token-detail", address, selectedChain],
    queryFn: () => stableDetail({ data: { address, chain: selectedChain } }),
    staleTime: 120_000,
    retry: 1,
  });

  const displayAddress = address || data?.address || "";

  const handleBack = useCallback(() => {
    router.history.back();
  }, [router]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(displayAddress).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [displayAddress]);

  const handleShieldLink = useCallback(() => {
    navigate({
      to: "/shield/trust/$address",
      params: { address: displayAddress },
    });
  }, [navigate, displayAddress]);

  const handleDexLink = useCallback(() => {
    window.open(
      `https://dexscreener.com/solana/${displayAddress}`,
      "_blank",
      "noopener,noreferrer",
    );
  }, [displayAddress]);

  const handleBuy = useCallback(() => {
    navigate({
      to: "/swap",
    });
  }, [navigate]);

  const handleSell = useCallback(() => {
    navigate({
      to: "/swap",
    });
  }, [navigate]);

  return (
    <PageLayout
      title="Token Detail"
      badge="HUNT"
      badgeColor="var(--char-vix)"
      loadingColor="var(--char-vix)"
    >
      <style>{`
        @keyframes alert-stagger {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <PageScrollArea>
        {/* ── Back Button ── */}
        <div style={{ padding: "12px 16px 0" }}>
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            style={{
              minHeight: "44px",
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--char-vix)",
              background: "var(--char-vix-dim)",
              border: "1px solid var(--char-vix-border)",
              borderRadius: "10px",
              padding: "0 16px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--char-vix-border)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--char-vix-dim)";
            }}
          >
            <span aria-hidden="true">←</span>
            Back
          </button>
        </div>

        {/* ── Token Header ── */}
        {isLoading && (
          <div
            style={{ padding: "20px", textAlign: "center", color: "var(--color-muted-foreground)" }}
          >
            Loading token detail...
          </div>
        )}
        {isError && (
          <div style={{ padding: "20px", color: "var(--shield-danger)" }}>
            Failed to load: {(error as Error).message}
          </div>
        )}

        {!isLoading && data && (
          <>
            <div
              style={{
                padding: "16px 16px 12px",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "6px",
                }}
              >
                <span
                  style={{
                    fontSize: "20px",
                    fontWeight: 800,
                    color: "var(--color-foreground)",
                  }}
                >
                  {data.name}
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "var(--char-vix)",
                  }}
                >
                  ${data.symbol}
                </span>
                <PageBadge label={data.chain} color="var(--char-vix)" small />
              </div>
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--color-muted-foreground)",
                }}
              >
                Created recently
              </span>
            </div>

            {/* ── Price Section ── */}
            <div
              style={{
                padding: "20px 16px",
                borderBottom: "1px solid var(--color-border)",
                background: "var(--color-card)",
              }}
            >
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: 900,
                  fontFamily: "var(--font-mono)",
                  color: "var(--color-foreground)",
                  lineHeight: 1.1,
                  marginBottom: "12px",
                }}
              >
                ${data.price.toFixed(6)}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                    color: changeColor(data.priceChange24h),
                    background: changeBg(data.priceChange24h),
                    padding: "4px 10px",
                    borderRadius: "6px",
                  }}
                >
                  24h {changeText(data.priceChange24h)}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                    color: changeColor(data.priceChange1h),
                    background: changeBg(data.priceChange1h),
                    padding: "4px 10px",
                    borderRadius: "6px",
                  }}
                >
                  1h {changeText(data.priceChange1h)}
                </span>
              </div>
            </div>

            {/* ── Contract Address Row ── */}
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid var(--color-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--color-muted-foreground)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Contract
              </span>
              <button
                type="button"
                onClick={handleCopy}
                aria-label={`Copy contract address ${displayAddress}`}
                style={{
                  minHeight: "36px",
                  fontSize: "12px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  color: copied ? "var(--char-vix)" : "var(--color-muted-foreground)",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer",
                  transition: "background 0.15s ease, color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                }}
              >
                {copied ? "Copied!" : truncateAddress(displayAddress)}
                <span aria-hidden="true" style={{ fontSize: "10px" }}>
                  {copied ? "✓" : "📋"}
                </span>
              </button>
            </div>

            {/* ── 2x2 Stats Grid ── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1px",
                background: "var(--color-border)",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <StatBlock label="Market Cap" value={`$${data.marketCap.toLocaleString()}`} />
              <StatBlock label="24h Volume" value={`$${data.volume24h.toLocaleString()}`} />
              <StatBlock label="Holders" value={data.holders.toLocaleString()} />
              <StatBlock label="Liquidity" value={`$${data.liquidity.toLocaleString()}`} />
            </div>

            {/* ── SHIELD Deep Link ── */}
            <div style={{ padding: "12px 16px 0" }}>
              <button
                type="button"
                onClick={handleShieldLink}
                aria-label="View Security Analysis"
                style={{
                  width: "100%",
                  minHeight: "48px",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "var(--char-vix)",
                  background: "var(--char-vix-dim)",
                  border: "1px solid var(--char-vix-border)",
                  borderRadius: "10px",
                  padding: "0 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--char-vix-border)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--char-vix-dim)";
                }}
              >
                <span aria-hidden="true">&#x1F6E1;</span>
                View Security Analysis
              </button>
            </div>

            {/* ── Signals ── */}
            <div
              style={{
                padding: "16px 16px 8px",
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--color-foreground)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                borderBottom: "1px solid var(--color-border)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span aria-hidden="true">&#x26A1;</span>
              Signals
            </div>
            {data?.pairAddress ? (
              <div
                style={{
                  padding: "16px",
                  background: "var(--color-card)",
                  borderBottom: "1px solid var(--color-border)",
                  fontSize: "12px",
                  color: "var(--color-muted-foreground)",
                }}
              >
                DEX pair active: {truncateAddress(data.pairAddress)}
              </div>
            ) : (
              <div
                style={{
                  padding: "24px 16px",
                  textAlign: "center",
                  color: "var(--color-muted-foreground)",
                  fontSize: "12px",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                No active signals detected
              </div>
            )}

            {/* ── DEX Link ── */}
            <div style={{ padding: "12px 16px 0" }}>
              <button
                type="button"
                onClick={handleDexLink}
                aria-label="View on DEX"
                style={{
                  width: "100%",
                  minHeight: "48px",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "var(--color-foreground)",
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "10px",
                  padding: "0 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--color-muted)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--color-card)";
                }}
              >
                <span aria-hidden="true">&#x1F310;</span>
                View on DEX
              </button>
            </div>

            {/* ── Buy / Sell CTA ── */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                padding: "16px",
              }}
            >
              <button
                type="button"
                onClick={handleBuy}
                aria-label="Buy token"
                style={{
                  flex: 1,
                  minHeight: "48px",
                  fontSize: "14px",
                  fontWeight: 800,
                  color: "var(--color-background)",
                  background: "var(--color-bullish)",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  transition: "opacity 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.opacity = "0.85";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.opacity = "1";
                }}
              >
                Buy
              </button>
              <button
                type="button"
                onClick={handleSell}
                aria-label="Sell token"
                style={{
                  flex: 1,
                  minHeight: "48px",
                  fontSize: "14px",
                  fontWeight: 800,
                  color: "var(--color-background)",
                  background: "var(--color-bearish)",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  transition: "opacity 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.opacity = "0.85";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.opacity = "1";
                }}
              >
                Sell
              </button>
            </div>
          </>
        )}

        {/* ── Activity micro-moment ── */}
        <div
          style={{
            textAlign: "center",
            padding: "4px 16px 32px",
            fontSize: "10px",
            fontWeight: 600,
            color: "var(--color-muted-foreground)",
            letterSpacing: "0.08em",
            opacity: 0.7,
          }}
        >
          CONFIDENCE 73 — SIGNALS CONVERGING BULLISH
        </div>
      </PageScrollArea>
    </PageLayout>
  );
}

// ── Stat Block (2x2 grid item) ─────────────────────────────────────────────

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: "12px 16px",
        background: "var(--color-card)",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          fontWeight: 600,
          color: "var(--color-muted-foreground)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: "4px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "14px",
          fontWeight: 800,
          fontFamily: "var(--font-mono)",
          color: "var(--color-foreground)",
        }}
      >
        {value}
      </div>
    </div>
  );
}

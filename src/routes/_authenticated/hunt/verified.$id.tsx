import { createFileRoute, useNavigate, useRouter, useParams } from "@tanstack/react-router";
import { useState, useCallback, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { getTokenDetail } from "@/domains/hunt/functions";
import {
  PageLayout,
  PageScrollArea,
  PageBadge,
  StatsRow,
  DataRow,
  ProgressBar,
} from "@/components/vixor/PageLayout";

// ── Mock Data ──────────────────────────────────────────────────────────────

type VerifiedToken = {
  id: string;
  address: string;
  name: string;
  symbol: string;
  tier: 1 | 2 | 3;
  trustScore: number;
  category: string;
  verifiedDate: string;
};

const TIER_FILTERS = ["All", "Tier 1", "Tier 2", "Tier 3"] as const;

const MOCK_VERIFIED: VerifiedToken[] = [
  {
    id: "vt1",
    address: "0xaaa111bbb222ccc333ddd444eee555fff6667778",
    name: "SolidBase",
    symbol: "SBASE",
    tier: 1,
    trustScore: 94,
    category: "DeFi",
    verifiedDate: "2025-01-10",
  },
  {
    id: "vt2",
    address: "0xbbb222ccc333ddd444eee555fff6667778889",
    name: "TrueYield",
    symbol: "TYLD",
    tier: 1,
    trustScore: 91,
    category: "Yield",
    verifiedDate: "2025-01-09",
  },
  {
    id: "vt3",
    address: "0xccc333ddd444eee555fff6667778889990001",
    name: "LunarPay",
    symbol: "LPAY",
    tier: 1,
    trustScore: 88,
    category: "Payments",
    verifiedDate: "2025-01-08",
  },
  {
    id: "vt4",
    address: "0xddd444eee555fff6667778889990001111223",
    name: "NeonSwap",
    symbol: "NSWP",
    tier: 2,
    trustScore: 76,
    category: "DEX",
    verifiedDate: "2025-01-12",
  },
  {
    id: "vt5",
    address: "0xeee555fff6667778889990001112223334445",
    name: "GhostBridge",
    symbol: "GBRG",
    tier: 2,
    trustScore: 72,
    category: "Bridge",
    verifiedDate: "2025-01-11",
  },
  {
    id: "vt6",
    address: "0xfff6667778889990001112223334445556667",
    name: "QuantumVault",
    symbol: "QVLT",
    tier: 2,
    trustScore: 68,
    category: "Staking",
    verifiedDate: "2025-01-07",
  },
  {
    id: "vt7",
    address: "0x1117778889990001112223334445556667778",
    name: "PixelDAO",
    symbol: "PXDAO",
    tier: 3,
    trustScore: 55,
    category: "NFT",
    verifiedDate: "2025-01-13",
  },
  {
    id: "vt8",
    address: "0x2228889990001112223334445556667778889",
    name: "MemeRocket",
    symbol: "MROK",
    tier: 3,
    trustScore: 48,
    category: "Meme",
    verifiedDate: "2025-01-14",
  },
  {
    id: "vt9",
    address: "0x3339990001112223334445556667778889990",
    name: "ChainPulse",
    symbol: "CPULSE",
    tier: 2,
    trustScore: 74,
    category: "Oracle",
    verifiedDate: "2025-01-06",
  },
  {
    id: "vt10",
    address: "0x4440001112223334445556667778889990001",
    name: "VaultX",
    symbol: "VLTX",
    tier: 1,
    trustScore: 92,
    category: "Lending",
    verifiedDate: "2025-01-05",
  },
];

const TRUST_DISTRIBUTION = [
  { range: "90-100", count: 3, color: "var(--char-vix)" },
  { range: "80-89", count: 1, color: "var(--char-vix)" },
  { range: "70-79", count: 3, color: "var(--color-bullish)" },
  { range: "60-69", count: 1, color: "var(--color-neutral-wait)" },
  { range: "50-59", count: 1, color: "var(--color-neutral-wait)" },
  { range: "40-49", count: 1, color: "var(--color-bearish)" },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function tierLabel(tier: number): string {
  return `Tier ${tier}`;
}

function tierColor(tier: number): string {
  switch (tier) {
    case 1:
      return "var(--char-vix)";
    case 2:
      return "var(--color-neutral-wait)";
    case 3:
      return "var(--color-muted-foreground)";
    default:
      return "var(--color-muted-foreground)";
  }
}

function tierBg(tier: number): string {
  switch (tier) {
    case 1:
      return "var(--char-vix-dim)";
    case 2:
      return "var(--color-neutral-wait)";
    case 3:
      return "var(--color-muted)";
    default:
      return "var(--color-muted)";
  }
}

function trustBarColor(score: number): string {
  if (score >= 80) return "var(--char-vix)";
  if (score >= 60) return "var(--color-bullish)";
  if (score >= 40) return "var(--color-neutral-wait)";
  return "var(--color-bearish)";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function categoryColor(cat: string): string {
  switch (cat) {
    case "DeFi":
      return "var(--char-vix)";
    case "Yield":
      return "var(--color-bullish)";
    case "Payments":
      return "var(--color-info)";
    case "DEX":
      return "var(--color-primary)";
    case "Bridge":
      return "var(--color-neutral-wait)";
    default:
      return "var(--color-muted-foreground)";
  }
}

// ── Route ──────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/_authenticated/hunt/verified/$id")({
  head: () => ({
    meta: [{ title: "Verified Tokens — VETTED" }],
  }),
  component: VerifiedTokensPage,
});

function VerifiedTokensPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const { id } = useParams({ strict: false }) as { id: string };
  const [activeTier, setActiveTier] = useState<string>("All");

  const stableDetail = useStableServerFn(getTokenDetail);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["token-detail", id],
    queryFn: () => stableDetail({ data: { address: id, chain: "solana" } }),
    staleTime: 120_000,
  });

  const handleBack = useCallback(() => {
    router.history.back();
  }, [router]);

  const handleTierChange = useCallback((tier: string) => {
    setActiveTier(tier);
  }, []);

  const handleTokenClick = useCallback(
    (address: string) => {
      navigate({
        to: "/hunt/token/$address",
        params: { address },
      });
    },
    [navigate],
  );

  const maxDistCount = Math.max(...TRUST_DISTRIBUTION.map((d) => d.count));

  return (
    <PageLayout
      title="Verified Tokens"
      badge="VETTED"
      badgeColor="var(--char-vix)"
      loadingColor="var(--char-vix)"
    >
      <style>{`
        @keyframes alert-stagger {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

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

      {/* ── Tier Filter Tabs ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          padding: "8px 16px",
          borderBottom: "1px solid var(--color-border)",
          overflowX: "auto",
        }}
        className="scrollbar-hide"
      >
        {TIER_FILTERS.map((tier) => {
          const isActive = activeTier === tier;
          return (
            <button
              key={tier}
              type="button"
              onClick={() => handleTierChange(tier)}
              aria-label={`Filter by ${tier}`}
              aria-pressed={isActive}
              style={{
                minHeight: "44px",
                fontSize: "12px",
                fontWeight: isActive ? 700 : 500,
                padding: "8px 16px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                color: isActive ? "var(--color-background)" : "var(--color-muted-foreground)",
                background: isActive ? "var(--char-vix)" : "transparent",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "var(--char-vix-dim)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }
              }}
            >
              {tier}
            </button>
          );
        })}
      </div>

      {/* ── Stats Row ── */}
      <StatsRow
        stats={[
          {
            label: "Verified Status",
            value: data ? "Verified" : "-",
            color: "var(--char-vix)",
          },
        ]}
      />

      {/* ── Verified Token List ── */}
      <PageScrollArea>
        {isLoading && (
          <div
            style={{ padding: "20px", textAlign: "center", color: "var(--color-muted-foreground)" }}
          >
            Loading...
          </div>
        )}
        {isError && (
          <div style={{ padding: "20px", color: "var(--shield-danger)" }}>
            Failed to load: {(error as Error).message}
          </div>
        )}

        {!isLoading && !data && (
          <div
            style={{
              padding: "48px 16px",
              textAlign: "center",
              color: "var(--color-muted-foreground)",
              fontSize: "13px",
            }}
          >
            No verified token found.
          </div>
        )}

        {!isLoading && data && (
          <DataRow leftAccent="var(--char-vix-border)">
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
              >
                <span
                  style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-foreground)" }}
                >
                  {data.name}
                </span>
                <PageBadge label={data.chain} color="var(--color-info)" small />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-muted-foreground)", fontSize: "14px" }}>
                  Symbol
                </span>
                <span style={{ fontWeight: 700, color: "var(--color-foreground)" }}>
                  ${data.symbol}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-muted-foreground)", fontSize: "14px" }}>
                  Price
                </span>
                <span style={{ fontWeight: 700, color: "var(--color-foreground)" }}>
                  ${data.price}
                </span>
              </div>
            </div>
          </DataRow>
        )}

        {/* ── Trust Score Distribution ── */}
        <div
          style={{
            padding: "16px",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--color-foreground)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span aria-hidden="true">&#x1F4CA;</span>
            Trust Score Distribution
          </div>
          <svg
            width="100%"
            height="160"
            viewBox="0 0 320 160"
            aria-hidden="true"
            style={{ display: "block" }}
          >
            {TRUST_DISTRIBUTION.map((d, i) => {
              const barWidth = (d.count / maxDistCount) * 200;
              const y = i * 26 + 4;
              return (
                <g key={d.range}>
                  <text
                    x="0"
                    y={y + 12}
                    fill="var(--color-muted-foreground)"
                    fontSize="11"
                    fontWeight="600"
                    fontFamily="var(--font-mono)"
                  >
                    {d.range}
                  </text>
                  <rect
                    x="64"
                    y={y}
                    width={barWidth}
                    height="16"
                    rx="4"
                    fill={d.color}
                    opacity="0.8"
                  />
                  <text
                    x={barWidth + 72}
                    y={y + 12}
                    fill="var(--color-foreground)"
                    fontSize="11"
                    fontWeight="700"
                    fontFamily="var(--font-mono)"
                  >
                    {d.count}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* ── VIX micro-moment ── */}
        <div
          style={{
            textAlign: "center",
            padding: "8px 16px 32px",
            fontSize: "10px",
            fontWeight: 600,
            color: "var(--char-vix)",
            letterSpacing: "0.08em",
            opacity: 0.7,
          }}
        >
          VIX VERIFIED {MOCK_VERIFIED.length} TOKENS — 4 NEW THIS WEEK
        </div>
      </PageScrollArea>
    </PageLayout>
  );
}

// ── Verified Token Row ─────────────────────────────────────────────────────

interface VerifiedTokenRowProps {
  token: VerifiedToken;
  index: number;
  onClick: () => void;
}

const VerifiedTokenRow = memo(function VerifiedTokenRow({
  token,
  index,
  onClick,
}: VerifiedTokenRowProps) {
  const tColor = tierColor(token.tier);
  const tBg = tierBg(token.tier);
  const tsColor = trustBarColor(token.trustScore);
  const catColor = categoryColor(token.category);

  return (
    <DataRow
      onClick={onClick}
      leftAccent="var(--char-vix-border)"
      style={{
        animation: `alert-stagger 0.3s ease-out ${index * 0.04}s both`,
      }}
    >
      {/* Top line: name + tier badge + category */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "8px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flex: 1,
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "var(--color-foreground)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {token.name}
          </span>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--color-muted-foreground)",
            }}
          >
            ${token.symbol}
          </span>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              color: tColor,
              background: tBg,
              padding: "1px 6px",
              borderRadius: "4px",
              letterSpacing: "0.03em",
            }}
          >
            {tierLabel(token.tier)}
          </span>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: catColor,
              background: `${catColor}14`,
              padding: "1px 6px",
              borderRadius: "4px",
            }}
          >
            {token.category}
          </span>
        </div>
      </div>

      {/* Trust score bar */}
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
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--color-muted-foreground)",
            whiteSpace: "nowrap",
          }}
        >
          Trust
        </span>
        <div
          style={{
            flex: 1,
            height: "4px",
            background: "var(--color-border)",
            borderRadius: "2px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${token.trustScore}%`,
              height: "100%",
              background: tsColor,
              borderRadius: "2px",
              transition: "width 0.5s ease",
            }}
          />
        </div>
        <span
          style={{
            fontSize: "12px",
            fontWeight: 800,
            fontFamily: "var(--font-mono)",
            color: tsColor,
            flexShrink: 0,
          }}
        >
          {token.trustScore}
        </span>
      </div>

      {/* Verified date */}
      <div
        style={{
          fontSize: "10px",
          color: "var(--color-muted-foreground)",
          opacity: 0.7,
        }}
      >
        Verified {formatDate(token.verifiedDate)}
      </div>
    </DataRow>
  );
});

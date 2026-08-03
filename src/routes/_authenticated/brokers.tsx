import { memo, useState, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { getConnectedBrokers, connectBroker, disconnectBroker } from "@/domains/broker/functions";
import { PageLayout, PageScrollArea } from "@/components/vixor/PageLayout";

export const Route = createFileRoute("/_authenticated/brokers")({
  component: BrokersPage,
});

// ── Broker Data ──────────────────────────────────────────────────────────────

interface BrokerInfo {
  name: string;
  rating: number;
  badge?: "FEATURED" | "RECOMMENDED";
  color: string;
  affiliateUrl: string;
  category: "crypto" | "forex" | "multi";
  features: string[];
  minDeposit: string;
  leverage: string;
}

const BROKERS: BrokerInfo[] = [
  {
    name: "Bybit",
    rating: 4.8,
    badge: "FEATURED",
    color: "#F7A600",
    category: "crypto",
    affiliateUrl: "https://www.bybit.com/en/register?affiliate_id=VIXOR",
    features: ["Perpetuals", "Copy Trading", "USDT-M Futures"],
    minDeposit: "$1",
    leverage: "Up to 100x",
  },
  {
    name: "Binance",
    rating: 4.9,
    badge: "FEATURED",
    color: "var(--color-gold)",
    category: "crypto",
    affiliateUrl: "https://www.binance.com/en/register?ref=VIXOR",
    features: ["Spot", "Futures", "Launchpad", "P2P"],
    minDeposit: "$1",
    leverage: "Up to 125x",
  },
  {
    name: "OKX",
    rating: 4.7,
    color: "#FFFFFF",
    category: "crypto",
    affiliateUrl: "https://www.okx.com/join/VIXOR",
    features: ["Perpetuals", "Options", "DeFi", "Copy Trade"],
    minDeposit: "$1",
    leverage: "Up to 125x",
  },
  {
    name: "Pepperstone",
    rating: 4.6,
    color: "#00C087",
    category: "forex",
    affiliateUrl: "https://pepperstone.com/en/open-account/?a_aid=VIXOR",
    features: ["ECN", "Raw Spreads", "MT4/MT5"],
    minDeposit: "$200",
    leverage: "Up to 500:1",
  },
  {
    name: "IC Markets",
    rating: 4.7,
    color: "#2EAAE1",
    category: "forex",
    affiliateUrl: "https://www.icmarkets.com/en/?camp=VIXOR",
    features: ["Raw Spread", "cTrader", "Zero Commission"],
    minDeposit: "$200",
    leverage: "Up to 500:1",
  },
  {
    name: "Exness",
    rating: 4.5,
    color: "#00A651",
    category: "forex",
    affiliateUrl: "https://www.exness.com/a/VIXOR",
    features: ["Instant Withdrawal", "Cent Account", "MT4/MT5"],
    minDeposit: "$1",
    leverage: "Up to 2000:1",
  },
  {
    name: "XM",
    rating: 4.4,
    color: "#3B82F6",
    category: "multi",
    affiliateUrl: "https://www.xm.com/en/register?a=VIXOR",
    features: ["Stocks", "Forex", "Commodities", "MT4/MT5"],
    minDeposit: "$5",
    leverage: "Up to 888:1",
  },
  {
    name: "FBS",
    rating: 4.3,
    color: "#FF6600",
    category: "forex",
    affiliateUrl: "https://fbs.com/en/register?a=VIXOR",
    features: ["Cent Account", "Zero Spread", "Level Up"],
    minDeposit: "$1",
    leverage: "Up to 3000:1",
  },
];

// ── Star Rating Component ────────────────────────────────────────────────────

const StarRating = memo(function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.3;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1px" }}>
      {Array.from({ length: fullStars }).map((_, i) => (
        <svg
          key={`full-${i}`}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="#F7A600"
          stroke="none"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
      {hasHalf && (
        <svg key="half" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="none">
          <defs>
            <linearGradient id={`half-star-${rating}`}>
              <stop offset="50%" stopColor="#F7A600" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.15)" />
            </linearGradient>
          </defs>
          <polygon
            points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
            fill={`url(#half-star-${rating})`}
          />
        </svg>
      )}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <svg
          key={`empty-${i}`}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="rgba(255,255,255,0.15)"
          stroke="none"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
      <span
        style={{
          fontSize: "12px",
          fontWeight: 600,
          color: "var(--color-muted-foreground)",
          marginLeft: "4px",
          fontFamily: "var(--font-mono)",
        }}
      >
        {rating.toFixed(1)}
      </span>
    </div>
  );
});

// ── Broker Logo Placeholder ──────────────────────────────────────────────────

const BrokerLogo = memo(function BrokerLogo({
  name,
  color,
  size = 40,
}: {
  name: string;
  color: string;
  size?: number;
}) {
  const initial = name.charAt(0).toUpperCase();

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "10px",
        background: `${color}18`,
        border: `1px solid ${color}30`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: `${size * 0.45}px`,
        fontWeight: 800,
        color: color,
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
});

// ── Broker Card ──────────────────────────────────────────────────────────────

const BrokerCard = memo(function BrokerCard({
  broker,
  isConnected,
  onConnect,
  onOpenAccount,
}: {
  broker: BrokerInfo;
  isConnected: boolean;
  onConnect: () => void;
  onOpenAccount: () => void;
}) {
  const badgeColor =
    broker.badge === "FEATURED"
      ? "var(--color-primary)"
      : broker.badge === "RECOMMENDED"
        ? "var(--color-neutral-wait)"
        : undefined;

  return (
    <div
      style={{
        background: "var(--color-card)",
        border: isConnected ? "1px solid var(--color-bullish)" : "1px solid var(--color-border)",
        borderRadius: "12px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        transition: "border-color 0.2s ease",
      }}
    >
      {/* Top row: logo + name + badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <BrokerLogo name={broker.name} color={broker.color} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--color-foreground)",
              }}
            >
              {broker.name}
            </span>
            {isConnected && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "1px 6px",
                  borderRadius: "3px",
                  background: "rgba(34, 211, 166, 0.12)",
                  color: "var(--color-bullish)",
                  letterSpacing: "0.04em",
                }}
              >
                <span
                  style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    background: "var(--color-bullish)",
                    display: "inline-block",
                  }}
                />
                CONNECTED
              </span>
            )}
          </div>
          {badgeColor && (
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                padding: "1px 6px",
                borderRadius: "3px",
                background: `${badgeColor}18`,
                color: badgeColor,
                letterSpacing: "0.04em",
                marginTop: "4px",
                display: "inline-block",
              }}
            >
              {broker.badge}
            </span>
          )}
        </div>
      </div>

      {/* Rating */}
      <StarRating rating={broker.rating} />

      {/* Features */}
      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
        {broker.features.slice(0, 3).map((f) => (
          <span
            key={f}
            style={{
              fontSize: "10px",
              fontWeight: 600,
              padding: "2px 6px",
              borderRadius: "4px",
              background: "rgba(255,255,255,0.05)",
              color: "var(--color-muted-foreground)",
              letterSpacing: "0.02em",
            }}
          >
            {f}
          </span>
        ))}
      </div>

      {/* Min deposit + Leverage */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "11px",
          color: "var(--color-muted-foreground)",
        }}
      >
        <span>Min: {broker.minDeposit}</span>
        <span>{broker.leverage}</span>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
        {isConnected ? (
          <button
            onClick={onConnect}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: "8px",
              border: "1px solid var(--color-border)",
              background: "transparent",
              color: "var(--color-muted-foreground)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={onConnect}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: "8px",
              border: "none",
              background: "var(--color-primary)",
              color: "#fff",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "opacity 0.15s ease",
            }}
          >
            Connect
          </button>
        )}
        <button
          onClick={onOpenAccount}
          style={{
            flex: 1,
            padding: "8px 0",
            borderRadius: "8px",
            border: "1px solid var(--color-border)",
            background: "transparent",
            color: "var(--color-foreground)",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
            transition: "all 0.15s ease",
          }}
        >
          Open Account
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </button>
      </div>
    </div>
  );
});

// ── Broker Connection Modal ──────────────────────────────────────────────────

const BrokerModal = memo(function BrokerModal({
  broker,
  isConnected,
  onConnect,
  onDisconnect,
  onClose,
}: {
  broker: BrokerInfo;
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onClose: () => void;
}) {
  const badgeColor =
    broker.badge === "FEATURED"
      ? "var(--color-primary)"
      : broker.badge === "RECOMMENDED"
        ? "var(--color-neutral-wait)"
        : undefined;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.7)",
        padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--color-card-solid, #101317)",
          border: "1px solid var(--color-border)",
          borderRadius: "16px",
          padding: "24px",
          width: "100%",
          maxWidth: "340px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {/* Close button */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              border: "none",
              background: "rgba(255,255,255,0.06)",
              color: "var(--color-muted-foreground)",
              fontSize: "16px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Broker info */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <BrokerLogo name={broker.name} color={broker.color} size={56} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "var(--color-foreground)",
              }}
            >
              {broker.name}
            </span>
            {badgeColor && (
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "4px",
                  background: `${badgeColor}18`,
                  color: badgeColor,
                  letterSpacing: "0.04em",
                }}
              >
                {broker.badge}
              </span>
            )}
          </div>
          <StarRating rating={broker.rating} />
        </div>

        {/* Connect / Disconnect button */}
        {isConnected ? (
          <button
            onClick={() => {
              onDisconnect();
              onClose();
            }}
            style={{
              width: "100%",
              padding: "12px 0",
              borderRadius: "10px",
              border: "1px solid var(--color-bearish)",
              background: "transparent",
              color: "var(--color-bearish)",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={() => {
              onConnect();
              onClose();
            }}
            style={{
              width: "100%",
              padding: "12px 0",
              borderRadius: "10px",
              border: "none",
              background: "var(--color-primary)",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "opacity 0.15s ease",
            }}
          >
            Connect
          </button>
        )}

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              flex: 1,
              height: "1px",
              background: "var(--color-border)",
            }}
          />
          <span
            style={{
              fontSize: "12px",
              color: "var(--color-muted-foreground)",
              fontWeight: 500,
            }}
          >
            or
          </span>
          <div
            style={{
              flex: 1,
              height: "1px",
              background: "var(--color-border)",
            }}
          />
        </div>

        {/* Open Account button */}
        <a
          href={broker.affiliateUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            width: "100%",
            padding: "12px 0",
            borderRadius: "10px",
            border: "1px solid var(--color-border)",
            background: "transparent",
            color: "var(--color-foreground)",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            textDecoration: "none",
            transition: "all 0.15s ease",
          }}
        >
          Open Account
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>

        {/* Terms warning */}
        <p
          style={{
            fontSize: "11px",
            color: "var(--color-muted-foreground)",
            textAlign: "center",
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          By connecting, you agree to {broker.name}&apos;s terms of service. VIXOR is not
          responsible for any trading losses.
        </p>
      </div>
    </div>
  );
});

// ── Connected Broker Strip ───────────────────────────────────────────────────

const ConnectedStrip = memo(function ConnectedStrip({
  connectedNames,
}: {
  connectedNames: string[];
}) {
  if (connectedNames.length === 0) return null;

  const connectedBrokers = BROKERS.filter((b) => connectedNames.includes(b.name));

  return (
    <div
      style={{
        padding: "10px 16px",
        background: "rgba(34, 211, 166, 0.04)",
        borderBottom: "1px solid var(--color-border)",
        display: "flex",
        gap: "8px",
        overflowX: "auto",
        flexShrink: 0,
      }}
      className="scrollbar-hide"
    >
      {connectedBrokers.map((broker) => (
        <div
          key={broker.name}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 10px",
            borderRadius: "8px",
            background: "var(--color-card)",
            border: "1px solid rgba(34, 211, 166, 0.2)",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "var(--color-bullish)",
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          <BrokerLogo name={broker.name} color={broker.color} size={22} />
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--color-foreground)",
            }}
          >
            {broker.name}
          </span>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              padding: "1px 6px",
              borderRadius: "3px",
              background: "rgba(34, 211, 166, 0.12)",
              color: "var(--color-bullish)",
              letterSpacing: "0.04em",
            }}
          >
            Connected
          </span>
        </div>
      ))}
    </div>
  );
});

// ── Main Page ────────────────────────────────────────────────────────────────

function BrokersPage() {
  const getFn = useStableServerFn(getConnectedBrokers);
  const connectFn = useStableServerFn(connectBroker);
  const disconnectFn = useStableServerFn(disconnectBroker);

  const queryClient = useQueryClient();

  const { data: connectedBrokers = [], isLoading } = useQuery({
    queryKey: ["brokerConnections"],
    queryFn: getFn,
    staleTime: 10_000,
  });

  const connectMutation = useMutation({
    mutationFn: (brokerName: string) => connectFn({ data: { brokerName } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brokerConnections"] });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: (brokerName: string) => disconnectFn({ data: { brokerName } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brokerConnections"] });
    },
  });

  const [modalBroker, setModalBroker] = useState<BrokerInfo | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<"all" | "crypto" | "forex" | "multi">("all");

  const connectedNames = connectedBrokers.map((c: any) => c.broker_name);

  const filteredBrokers =
    categoryFilter === "all" ? BROKERS : BROKERS.filter((b) => b.category === categoryFilter);

  const CATEGORY_TABS = [
    { key: "all" as const, label: "All", count: BROKERS.length },
    {
      key: "crypto" as const,
      label: "Crypto",
      count: BROKERS.filter((b) => b.category === "crypto").length,
    },
    {
      key: "forex" as const,
      label: "Forex",
      count: BROKERS.filter((b) => b.category === "forex").length,
    },
    {
      key: "multi" as const,
      label: "Multi",
      count: BROKERS.filter((b) => b.category === "multi").length,
    },
  ];

  const handleConnectClick = useCallback((broker: BrokerInfo) => {
    setModalBroker(broker);
  }, []);

  const handleConnect = useCallback(
    (brokerName: string) => {
      connectMutation.mutate(brokerName);
    },
    [connectMutation],
  );

  const handleDisconnect = useCallback(
    (brokerName: string) => {
      disconnectMutation.mutate(brokerName);
    },
    [disconnectMutation],
  );

  const isMutating = connectMutation.isPending || disconnectMutation.isPending;

  return (
    <PageLayout
      title="Connect Broker"
      badge="BROKERS"
      badgeColor="var(--color-primary)"
      loading={isLoading}
    >
      {/* Subtitle */}
      <div
        style={{
          padding: "12px 16px 8px",
          borderBottom: "1px solid var(--color-border)",
          flexShrink: 0,
        }}
      >
        <p
          style={{
            fontSize: "12px",
            color: "var(--color-muted-foreground)",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Trade forex &amp; CFDs with our partnered brokers
        </p>
      </div>

      {/* Connected brokers strip */}
      <ConnectedStrip connectedNames={connectedNames} />

      {/* Category filter tabs */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          padding: "10px 16px",
          borderBottom: "1px solid var(--color-border)",
          flexShrink: 0,
          overflowX: "auto",
        }}
        className="scrollbar-hide"
      >
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setCategoryFilter(tab.key)}
            style={{
              padding: "5px 12px",
              borderRadius: "6px",
              border: "none",
              background:
                categoryFilter === tab.key ? "var(--color-primary)" : "rgba(255,255,255,0.05)",
              color: categoryFilter === tab.key ? "#fff" : "var(--color-muted-foreground)",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.15s ease",
              fontFamily: "var(--font-sans)",
            }}
          >
            {tab.label}
            <span
              style={{
                marginLeft: "4px",
                opacity: 0.7,
                fontSize: "10px",
              }}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Broker Grid */}
      <PageScrollArea>
        <div
          style={{
            padding: "16px",
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "12px",
          }}
        >
          {filteredBrokers.map((broker) => (
            <BrokerCard
              key={broker.name}
              broker={broker}
              isConnected={connectedNames.includes(broker.name)}
              onConnect={() => handleConnectClick(broker)}
              onOpenAccount={() => window.open(broker.affiliateUrl, "_blank", "noopener")}
            />
          ))}
        </div>

        {/* Bottom padding for scroll */}
        <div style={{ height: "24px" }} />
      </PageScrollArea>

      {/* Modal */}
      {modalBroker && (
        <BrokerModal
          broker={modalBroker}
          isConnected={connectedNames.includes(modalBroker.name)}
          onConnect={() => handleConnect(modalBroker.name)}
          onDisconnect={() => handleDisconnect(modalBroker.name)}
          onClose={() => setModalBroker(null)}
        />
      )}
    </PageLayout>
  );
}

import { useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  PageLayout,
  Badge,
  EmptyState,
  SectionTitle,
  PageScrollArea,
} from "@/components/vixor/PageLayout";

// ── Static Price Map (Simulation) ──────────────────────────────────────────
const PRICES: Record<string, number> = {
  SOL: 145.23,
  USDT: 1.0,
  USDC: 1.0,
  ETH: 3450.0,
  BONK: 0.0000234,
  JUP: 1.23,
  RAY: 2.87,
  ORCA: 3.45,
  WIF: 2.1,
  JTO: 3.8,
  PYTH: 0.45,
  BOME: 0.0089,
};

// ── Token Definitions ───────────────────────────────────────────────────────
interface TokenDef {
  symbol: string;
  name: string;
  color: string;
}

const TOKENS: TokenDef[] = [
  { symbol: "SOL", name: "Solana", color: "#9945FF" },
  { symbol: "USDT", name: "Tether USD", color: "#26A17B" },
  { symbol: "USDC", name: "USD Coin", color: "#2775CA" },
  { symbol: "ETH", name: "Ethereum", color: "#627EEA" },
  { symbol: "BONK", name: "Bonk", color: "#F5A623" },
  { symbol: "JUP", name: "Jupiter", color: "#00D395" },
  { symbol: "RAY", name: "Raydium", color: "#6E48F7" },
  { symbol: "ORCA", name: "Orca", color: "#17EAD9" },
  { symbol: "WIF", name: "dogwifhat", color: "#A17F58" },
  { symbol: "JTO", name: "Jito", color: "#00FFA3" },
  { symbol: "PYTH", name: "Pyth Network", color: "#8A2BE2" },
  { symbol: "BOME", name: "BOOK OF MEME", color: "#FF6B35" },
];

// ── Mock Balances ───────────────────────────────────────────────────────────
const MOCK_BALANCES: Record<string, number> = {
  SOL: 42.5,
  USDT: 3200.0,
  USDC: 1500.0,
  ETH: 1.2,
  BONK: 15000000,
  JUP: 500,
  RAY: 200,
  ORCA: 150,
  WIF: 300,
  JTO: 100,
  PYTH: 2000,
  BOME: 50000,
};

// ── Mock Wallet State ───────────────────────────────────────────────────────
interface MockWallet {
  connected: boolean;
  address: string;
  chain: string;
  balance: string;
}

function useMockWallet(): MockWallet {
  const [wallet] = useState<MockWallet>(() => {
    try {
      const stored = localStorage.getItem("vixor_mock_wallet");
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return {
      connected: true,
      address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      chain: "Solana",
      balance: "42.5 SOL",
    };
  });

  return wallet;
}

// ── Swap History Types ──────────────────────────────────────────────────────
interface SwapRecord {
  id: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  date: string;
  status: "success" | "pending" | "failed";
}

function getSwapHistory(): SwapRecord[] {
  try {
    const stored = localStorage.getItem("vixor_swap_history");
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  // Default mock history
  return [
    {
      id: "1",
      fromToken: "SOL",
      toToken: "USDT",
      fromAmount: "2.5",
      toAmount: "362.88",
      date: "2025-07-14T10:23:00Z",
      status: "success",
    },
    {
      id: "2",
      fromToken: "USDT",
      toToken: "ETH",
      fromAmount: "500",
      toAmount: "0.1449",
      date: "2025-07-14T09:15:00Z",
      status: "success",
    },
    {
      id: "3",
      fromToken: "SOL",
      toToken: "JUP",
      fromAmount: "1.0",
      toAmount: "118.07",
      date: "2025-07-13T18:42:00Z",
      status: "success",
    },
    {
      id: "4",
      fromToken: "BONK",
      toToken: "SOL",
      fromAmount: "5000000",
      toAmount: "0.805",
      date: "2025-07-13T14:10:00Z",
      status: "pending",
    },
    {
      id: "5",
      fromToken: "ETH",
      toToken: "USDC",
      fromAmount: "0.5",
      toAmount: "1724.50",
      date: "2025-07-12T22:33:00Z",
      status: "failed",
    },
  ];
}

function saveSwapHistory(history: SwapRecord[]) {
  try {
    localStorage.setItem("vixor_swap_history", JSON.stringify(history.slice(0, 5)));
  } catch {
    // ignore
  }
}

// ── Formatting Helpers ──────────────────────────────────────────────────────
function formatUSD(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000)
    return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value >= 0.01) return `$${value.toFixed(4)}`;
  if (value >= 0.0001) return `$${value.toFixed(6)}`;
  return `$${value.toPrecision(4)}`;
}

function formatAmount(value: number, symbol: string): string {
  const decimals = PRICES[symbol] >= 1 ? 4 : PRICES[symbol] >= 0.01 ? 6 : 0;
  if (value === 0) return "0";
  const formatted = value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
  return formatted;
}

function formatBalance(value: number, symbol: string): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  if (value >= 1) return value.toFixed(4);
  if (value >= 0.0001) return value.toFixed(6);
  return value.toPrecision(4);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Route Definition ────────────────────────────────────────────────────────

// ── Token Icon Circle ───────────────────────────────────────────────────────
function TokenIcon({ symbol, color, size = 28 }: { symbol: string; color: string; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `${color}22`,
        border: `1.5px solid ${color}44`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.42,
        fontWeight: 800,
        color,
        flexShrink: 0,
        letterSpacing: "-0.02em",
      }}
    >
      {symbol.slice(0, 2)}
    </div>
  );
}

// ── Token Selector Modal ────────────────────────────────────────────────────
function TokenSelectorModal({
  open,
  onSelect,
  onClose,
  excludeSymbol,
}: {
  open: boolean;
  onSelect: (token: TokenDef) => void;
  onClose: () => void;
  excludeSymbol?: string;
}) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSearch("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return TOKENS.filter((t) => t.symbol !== excludeSymbol);
    return TOKENS.filter(
      (t) =>
        t.symbol !== excludeSymbol &&
        (t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)),
    );
  }, [search, excludeSymbol]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          maxHeight: "70vh",
          background: "var(--color-card-solid, #101317)",
          borderRadius: "16px 16px 0 0",
          border: "1px solid var(--color-border)",
          borderBottom: "none",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "slideUp 0.2s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search */}
        <div style={{ padding: "16px 16px 12px", borderBottom: `1px solid var(--color-border)` }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
            }}
          >
            <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-foreground)" }}>
              Select Token
            </span>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: "var(--color-muted-foreground)",
                cursor: "pointer",
                fontSize: "18px",
                padding: "4px",
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or symbol..."
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1px solid var(--color-border)",
              background: "var(--color-muted, #16181C)",
              color: "var(--color-foreground)",
              fontSize: "14px",
              outline: "none",
              fontFamily: "var(--font-sans)",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Token List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {filtered.length === 0 && (
            <div
              style={{
                padding: "32px 16px",
                textAlign: "center",
                color: "var(--color-muted-foreground)",
                fontSize: "13px",
              }}
            >
              No tokens found
            </div>
          )}
          {filtered.map((token) => (
            <button
              key={token.symbol}
              onClick={() => onSelect(token)}
              style={{
                width: "100%",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: "var(--color-foreground)",
                transition: "background 0.1s ease",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.04)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <TokenIcon symbol={token.symbol} color={token.color} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "14px", fontWeight: 600 }}>{token.symbol}</div>
                <div style={{ fontSize: "12px", color: "var(--color-muted-foreground)" }}>
                  {token.name}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-mono)" }}>
                  {formatBalance(MOCK_BALANCES[token.symbol] || 0, token.symbol)}
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-muted-foreground)" }}>
                  {formatUSD((MOCK_BALANCES[token.symbol] || 0) * PRICES[token.symbol])}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Swap Page ──────────────────────────────────────────────────────────
export function SwapPage() {
  const navigate = useNavigate();
  const wallet = useMockWallet();

  // ── State ──
  const [fromToken, setFromToken] = useState<TokenDef>(TOKENS[0]); // SOL
  const [toToken, setToToken] = useState<TokenDef>(TOKENS[1]); // USDT
  const [fromAmount, setFromAmount] = useState("");
  const [slippage, setSlippage] = useState(1);
  const [showFromModal, setShowFromModal] = useState(false);
  const [showToModal, setShowToModal] = useState(false);
  const [swapDirection, setSwapDirection] = useState<"normal" | "rotated">("normal");
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapSuccess, setSwapSuccess] = useState(false);
  const [swapHistory, setSwapHistory] = useState<SwapRecord[]>(getSwapHistory);

  // ── Swap Calculation ──
  const swapResult = useMemo(() => {
    const inputNum = parseFloat(fromAmount);
    if (!inputNum || inputNum <= 0) return { output: 0, priceImpact: 0, rate: "" };

    const fromPrice = PRICES[fromToken.symbol] || 0;
    const toPrice = PRICES[toToken.symbol] || 0;
    if (!fromPrice || !toPrice) return { output: 0, priceImpact: 0, rate: "" };

    const rate = fromPrice / toPrice;
    const rawOutput = inputNum * rate;

    // Simulate price impact (larger for lower-liquidity tokens)
    const isLowLiq = PRICES[fromToken.symbol] < 0.1 || PRICES[toToken.symbol] < 0.1;
    const impactMultiplier = isLowLiq ? 0.003 : 0.001;
    const simulatedImpact = Math.min(inputNum * impactMultiplier, 5);

    const output = rawOutput * (1 - slippage / 100);
    const minReceived = output * (1 - slippage / 100);

    return {
      output,
      priceImpact: simulatedImpact,
      minReceived,
      rate: `1 ${fromToken.symbol} = ${rate.toLocaleString("en-US", { maximumFractionDigits: 6 })} ${toToken.symbol}`,
      fromUSD: inputNum * fromPrice,
      toUSD: output * toPrice,
    };
  }, [fromAmount, fromToken, toToken, slippage]);

  // ── Price Impact Color ──
  const impactColor = useMemo(() => {
    if (swapResult.priceImpact < 0.5) return "var(--color-bullish)";
    if (swapResult.priceImpact < 2) return "#F59E0B";
    return "var(--color-bearish)";
  }, [swapResult.priceImpact]);

  // ── Balance Check ──
  const hasBalance = useMemo(() => {
    if (!fromAmount) return true;
    const inputNum = parseFloat(fromAmount);
    const balance = MOCK_BALANCES[fromToken.symbol] || 0;
    return inputNum <= balance;
  }, [fromAmount, fromToken]);

  // ── Swap Direction Handler ──
  const handleSwapDirection = useCallback(() => {
    setSwapDirection((prev) => (prev === "normal" ? "rotated" : "normal"));
    const prevFrom = fromToken;
    const prevTo = toToken;
    setFromToken(prevTo);
    setToToken(prevFrom);
    // Recalculate amount
    if (swapResult.output > 0) {
      setFromAmount(String(swapResult.output));
    } else {
      setFromAmount("");
    }
  }, [fromToken, toToken, swapResult.output]);

  // ── Handle MAX ──
  const handleMax = useCallback(() => {
    const balance = MOCK_BALANCES[fromToken.symbol] || 0;
    setFromAmount(String(balance));
  }, [fromToken]);

  // ── Handle Swap Execution ──
  const handleSwap = useCallback(async () => {
    if (!wallet.connected || !hasBalance || !fromAmount || swapResult.output <= 0) return;

    setIsSwapping(true);
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const newRecord: SwapRecord = {
      id: String(Date.now()),
      fromToken: fromToken.symbol,
      toToken: toToken.symbol,
      fromAmount: parseFloat(fromAmount).toFixed(6),
      toAmount: swapResult.output.toFixed(6),
      date: new Date().toISOString(),
      status: "success",
    };

    const updatedHistory = [newRecord, ...swapHistory].slice(0, 5);
    setSwapHistory(updatedHistory);
    saveSwapHistory(updatedHistory);
    setIsSwapping(false);
    setSwapSuccess(true);
    setFromAmount("");
    setTimeout(() => setSwapSuccess(false), 3000);
  }, [
    wallet.connected,
    hasBalance,
    fromAmount,
    swapResult.output,
    fromToken,
    toToken,
    swapHistory,
  ]);

  // ── Popular Pairs ──
  const popularPairs = [
    { from: "SOL", to: "USDT" },
    { from: "ETH", to: "USDT" },
    { from: "BONK", to: "SOL" },
    { from: "JUP", to: "SOL" },
  ];

  const handlePopularPair = useCallback((pair: { from: string; to: string }) => {
    const fToken = TOKENS.find((t) => t.symbol === pair.from);
    const tToken = TOKENS.find((t) => t.symbol === pair.to);
    if (fToken) setFromToken(fToken);
    if (tToken) setToToken(tToken);
    setFromAmount("");
  }, []);

  // ── Status Styles ──
  const statusStyle = (status: string) => {
    switch (status) {
      case "success":
        return { color: "var(--color-bullish)", bg: "var(--color-bullish)" };
      case "pending":
        return { color: "#F59E0B", bg: "#F59E0B" };
      case "failed":
        return { color: "var(--color-bearish)", bg: "var(--color-bearish)" };
      default:
        return { color: "var(--color-muted-foreground)", bg: "var(--color-muted-foreground)" };
    }
  };

  return (
    <PageLayout
      title="DEX Swap"
      badge="DEMO"
      badgeColor="var(--color-bearish)"
      banner={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            padding: "8px 16px",
            background: `${"var(--color-bearish)"}14`,
            borderBottom: `1px solid ${"var(--color-bearish)"}26`,
            color: "var(--color-bearish)",
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.03em",
          }}
        >
          ⚠ DEMO MODE — No real transactions are executed. Prices are simulated.
        </div>
      }
    >
      <PageScrollArea>
        <div
          style={{
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            maxWidth: "420px",
            margin: "0 auto",
            width: "100%",
          }}
        >
          {/* ── Wallet Connection Banner ── */}
          {!wallet.connected ? (
            <button
              onClick={() => navigate({ to: "/wallet-web3" })}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "12px",
                border: "1px dashed var(--color-primary)",
                background: "rgba(99,102,241,0.08)",
                color: "var(--color-primary)",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontFamily: "var(--font-sans)",
              }}
            >
              <span style={{ fontSize: "18px" }}>🔗</span>
              Connect Wallet to Swap
            </button>
          ) : (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "var(--color-bullish)",
                    boxShadow: "0 0 6px var(--color-bullish)",
                  }}
                />
                <span
                  style={{
                    fontSize: "13px",
                    fontFamily: "var(--font-mono)",
                    color: "var(--color-foreground)",
                  }}
                >
                  {wallet.address.slice(0, 4)}...{wallet.address.slice(-4)}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "12px", color: "var(--color-muted-foreground)" }}>
                  {wallet.chain}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    fontFamily: "var(--font-mono)",
                    color: "var(--color-foreground)",
                  }}
                >
                  {wallet.balance}
                </span>
              </div>
            </div>
          )}

          {/* ── Popular Pairs Quick Select ── */}
          <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "2px" }}>
            {popularPairs.map((pair) => (
              <button
                key={`${pair.from}-${pair.to}`}
                onClick={() => handlePopularPair(pair)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-card)",
                  color: "var(--color-muted-foreground)",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  fontFamily: "var(--font-mono)",
                  transition: "all 0.15s ease",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "var(--color-primary)";
                  el.style.color = "var(--color-primary)";
                  el.style.background = "rgba(99,102,241,0.08)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "var(--color-border)";
                  el.style.color = "var(--color-muted-foreground)";
                  el.style.background = "var(--color-card)";
                }}
              >
                {pair.from}→{pair.to}
              </button>
            ))}
          </div>

          {/* ── Swap Card ── */}
          <div
            style={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            {/* FROM Section */}
            <div style={{ padding: "16px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--color-muted-foreground)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  From
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--color-muted-foreground)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  Balance: {formatBalance(MOCK_BALANCES[fromToken.symbol] || 0, fromToken.symbol)}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  background: "var(--color-muted, #16181C)",
                  borderRadius: "10px",
                  padding: "8px 10px",
                  border: "1px solid var(--color-border)",
                }}
              >
                {/* Token Selector */}
                <button
                  onClick={() => setShowFromModal(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 10px 4px 4px",
                    borderRadius: "8px",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                    cursor: "pointer",
                    color: "var(--color-foreground)",
                    transition: "border-color 0.15s ease",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--color-primary)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)";
                  }}
                >
                  <TokenIcon symbol={fromToken.symbol} color={fromToken.color} size={24} />
                  <span style={{ fontSize: "14px", fontWeight: 700 }}>{fromToken.symbol}</span>
                  <span style={{ fontSize: "10px", color: "var(--color-muted-foreground)" }}>
                    ▾
                  </span>
                </button>

                {/* Amount Input */}
                <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={fromAmount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || /^\d*\.?\d*$/.test(val)) {
                        setFromAmount(val);
                      }
                    }}
                    placeholder="0.00"
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      color: "var(--color-foreground)",
                      fontSize: "20px",
                      fontWeight: 600,
                      fontFamily: "var(--font-mono)",
                      textAlign: "right",
                      padding: "6px 0",
                    }}
                  />
                  <button
                    onClick={handleMax}
                    style={{
                      position: "absolute",
                      right: "0",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "rgba(99,102,241,0.15)",
                      color: "var(--color-primary)",
                      border: "none",
                      borderRadius: "4px",
                      padding: "2px 8px",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* USD Value */}
              {fromAmount && swapResult.fromUSD ? (
                <div
                  style={{
                    marginTop: "6px",
                    fontSize: "12px",
                    color: "var(--color-muted-foreground)",
                    textAlign: "right",
                  }}
                >
                  ≈ {formatUSD(swapResult.fromUSD)}
                </div>
              ) : null}
            </div>

            {/* Swap Direction Button */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 16px",
                position: "relative",
                height: "0",
              }}
            >
              <button
                onClick={handleSwapDirection}
                style={{
                  position: "absolute",
                  top: "-18px",
                  left: "50%",
                  transform: `translateX(-50%) rotate(${swapDirection === "rotated" ? 180 : 0}deg)`,
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  border: "3px solid var(--color-card-solid, #101317)",
                  background: "var(--color-muted, #16181C)",
                  color: "var(--color-primary)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.15s ease",
                  zIndex: 2,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--color-primary)";
                  (e.currentTarget as HTMLElement).style.color = "var(--color-primary-foreground)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--color-muted, #16181C)";
                  (e.currentTarget as HTMLElement).style.color = "var(--color-primary)";
                }}
              >
                ↕
              </button>
            </div>

            {/* TO Section */}
            <div style={{ padding: "16px", paddingTop: "28px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--color-muted-foreground)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  To
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--color-muted-foreground)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  Balance: {formatBalance(MOCK_BALANCES[toToken.symbol] || 0, toToken.symbol)}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  background: "var(--color-muted, #16181C)",
                  borderRadius: "10px",
                  padding: "8px 10px",
                  border: "1px solid var(--color-border)",
                }}
              >
                {/* Token Selector */}
                <button
                  onClick={() => setShowToModal(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 10px 4px 4px",
                    borderRadius: "8px",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                    cursor: "pointer",
                    color: "var(--color-foreground)",
                    transition: "border-color 0.15s ease",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--color-primary)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)";
                  }}
                >
                  <TokenIcon symbol={toToken.symbol} color={toToken.color} size={24} />
                  <span style={{ fontSize: "14px", fontWeight: 700 }}>{toToken.symbol}</span>
                  <span style={{ fontSize: "10px", color: "var(--color-muted-foreground)" }}>
                    ▾
                  </span>
                </button>

                {/* Amount Output (read-only) */}
                <div
                  style={{
                    flex: 1,
                    textAlign: "right",
                    fontSize: "20px",
                    fontWeight: 600,
                    fontFamily: "var(--font-mono)",
                    color: "var(--color-foreground)",
                    padding: "6px 0",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {fromAmount && swapResult.output > 0
                    ? formatAmount(swapResult.output, toToken.symbol)
                    : "0.00"}
                </div>
              </div>

              {/* USD Value */}
              {fromAmount && swapResult.toUSD ? (
                <div
                  style={{
                    marginTop: "6px",
                    fontSize: "12px",
                    color: "var(--color-muted-foreground)",
                    textAlign: "right",
                  }}
                >
                  ≈ {formatUSD(swapResult.toUSD)}
                </div>
              ) : null}
            </div>

            {/* ── Price Info ── */}
            {fromAmount && swapResult.output > 0 && (
              <div
                style={{
                  padding: "12px 16px",
                  borderTop: "1px solid var(--color-border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                {/* Exchange Rate */}
                <div
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <span style={{ fontSize: "12px", color: "var(--color-muted-foreground)" }}>
                    Rate
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontFamily: "var(--font-mono)",
                      color: "var(--color-foreground)",
                    }}
                  >
                    {swapResult.rate}
                  </span>
                </div>

                {/* Price Impact */}
                <div
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <span style={{ fontSize: "12px", color: "var(--color-muted-foreground)" }}>
                    Price Impact
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontFamily: "var(--font-mono)",
                      fontWeight: 600,
                      color: impactColor,
                    }}
                  >
                    {swapResult.priceImpact.toFixed(2)}%
                  </span>
                </div>

                {/* Minimum Received */}
                <div
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <span style={{ fontSize: "12px", color: "var(--color-muted-foreground)" }}>
                    Min. Received
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontFamily: "var(--font-mono)",
                      color: "var(--color-foreground)",
                    }}
                  >
                    {swapResult.minReceived
                      ? formatAmount(swapResult.minReceived, toToken.symbol)
                      : "—"}{" "}
                    {toToken.symbol}
                  </span>
                </div>

                {/* Network Fee */}
                <div
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <span style={{ fontSize: "12px", color: "var(--color-muted-foreground)" }}>
                    Network Fee
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontFamily: "var(--font-mono)",
                      color: "var(--color-foreground)",
                    }}
                  >
                    ≈ $0.01
                  </span>
                </div>

                {/* Slippage Tolerance */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "4px",
                  }}
                >
                  <span style={{ fontSize: "12px", color: "var(--color-muted-foreground)" }}>
                    Slippage
                  </span>
                  <div style={{ display: "flex", gap: "4px" }}>
                    {[0.5, 1, 2, 3].map((s) => (
                      <button
                        key={s}
                        onClick={() => setSlippage(s)}
                        style={{
                          padding: "3px 10px",
                          borderRadius: "6px",
                          border:
                            slippage === s
                              ? "1px solid var(--color-primary)"
                              : "1px solid var(--color-border)",
                          background: slippage === s ? "rgba(99,102,241,0.15)" : "transparent",
                          color:
                            slippage === s
                              ? "var(--color-primary)"
                              : "var(--color-muted-foreground)",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          fontFamily: "var(--font-mono)",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {s}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Swap Button ── */}
            <div
              style={{
                padding: "16px",
                paddingTop: fromAmount && swapResult.output > 0 ? "0" : "16px",
              }}
            >
              {swapSuccess ? (
                <div
                  style={{
                    width: "100%",
                    height: "48px",
                    borderRadius: "10px",
                    background: "var(--color-bullish)",
                    color: "var(--color-buy-text, #04150D)",
                    fontSize: "15px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    border: "none",
                    animation: "fadeIn 0.3s ease",
                  }}
                >
                  ✓ Swap Successful!
                </div>
              ) : !wallet.connected ? (
                <button
                  onClick={() => navigate({ to: "/wallet-web3" })}
                  style={{
                    width: "100%",
                    height: "48px",
                    borderRadius: "10px",
                    background: "var(--color-primary)",
                    color: "var(--color-primary-foreground)",
                    fontSize: "15px",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                    transition: "opacity 0.15s ease",
                  }}
                >
                  Connect Wallet
                </button>
              ) : !hasBalance ? (
                <div
                  style={{
                    width: "100%",
                    height: "48px",
                    borderRadius: "10px",
                    background: "rgba(251,70,103,0.20)",
                    color: "var(--color-bearish)",
                    fontSize: "15px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid rgba(251,70,103,0.30)",
                  }}
                >
                  Insufficient Balance
                </div>
              ) : (
                <button
                  onClick={handleSwap}
                  disabled={isSwapping || !fromAmount || swapResult.output <= 0}
                  style={{
                    width: "100%",
                    height: "48px",
                    borderRadius: "10px",
                    background:
                      isSwapping || !fromAmount || swapResult.output <= 0
                        ? "rgba(34,211,166,0.40)"
                        : "var(--color-bullish)",
                    color: isSwapping
                      ? "var(--color-muted-foreground)"
                      : "var(--color-buy-text, #04150D)",
                    fontSize: "15px",
                    fontWeight: 700,
                    border: "none",
                    cursor:
                      isSwapping || !fromAmount || swapResult.output <= 0
                        ? "not-allowed"
                        : "pointer",
                    fontFamily: "var(--font-sans)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "all 0.15s ease",
                    opacity: isSwapping || !fromAmount ? 0.6 : 1,
                  }}
                >
                  {isSwapping ? (
                    <>
                      <div
                        style={{
                          width: "16px",
                          height: "16px",
                          border: "2px solid var(--color-muted-foreground)",
                          borderTopColor: "var(--color-foreground)",
                          borderRadius: "50%",
                          animation: "spin 0.7s linear infinite",
                        }}
                      />
                      Swapping...
                    </>
                  ) : (
                    `[Demo] Swap ${fromToken.symbol} → ${toToken.symbol}`
                  )}
                </button>
              )}
            </div>
          </div>

          {/* ── Recent Swaps ── */}
          {swapHistory.length > 0 && (
            <div
              style={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--color-border)",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "var(--color-foreground)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>🕐</span> Demo Swaps (not real)
              </div>
              <div style={{ maxHeight: "240px", overflowY: "auto" }}>
                {swapHistory.map((record) => {
                  const st = statusStyle(record.status);
                  return (
                    <div
                      key={record.id}
                      style={{
                        padding: "10px 16px",
                        borderBottom: "1px solid var(--color-border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "10px",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "var(--color-foreground)",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {record.fromToken} → {record.toToken}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "var(--color-muted-foreground)",
                            marginTop: "2px",
                          }}
                        >
                          {parseFloat(record.fromAmount).toLocaleString("en-US", {
                            maximumFractionDigits: 4,
                          })}{" "}
                          {record.fromToken} →{" "}
                          {parseFloat(record.toAmount).toLocaleString("en-US", {
                            maximumFractionDigits: 4,
                          })}{" "}
                          {record.toToken}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            color: st.color,
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            justifyContent: "flex-end",
                          }}
                        >
                          <div
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background: st.bg,
                            }}
                          />
                          {record.status === "success"
                            ? "Simulated"
                            : record.status === "pending"
                              ? "Pending"
                              : "Failed"}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "var(--color-muted-foreground)",
                            marginTop: "2px",
                          }}
                        >
                          {formatDate(record.date)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Spacer */}
          <div style={{ height: "12px" }} />
          <div
            style={{
              textAlign: "center",
              padding: "10px 16px",
              borderRadius: "8px",
              background: "var(--color-bearish)14",
              border: "1px solid var(--color-bearish)26",
            }}
          >
            <span style={{ fontSize: "11px", color: "var(--color-bearish)", fontWeight: 600 }}>
              ⚠ DEMO MODE
            </span>
            <p
              style={{
                fontSize: "10px",
                color: "var(--color-muted-foreground)",
                marginTop: "4px",
                lineHeight: 1.4,
              }}
            >
              This is a simulated swap for demonstration. No real funds are exchanged.
            </p>
          </div>
          <div style={{ height: "24px" }} />
        </div>
      </PageScrollArea>

      {/* ── Token Selector Modals ── */}
      <TokenSelectorModal
        open={showFromModal}
        onSelect={(token) => {
          setFromToken(token);
          setShowFromModal(false);
          if (token.symbol === toToken.symbol) {
            const alt = TOKENS.find((t) => t.symbol !== token.symbol);
            if (alt) setToToken(alt);
          }
        }}
        onClose={() => setShowFromModal(false)}
        excludeSymbol={toToken.symbol}
      />
      <TokenSelectorModal
        open={showToModal}
        onSelect={(token) => {
          setToToken(token);
          setShowToModal(false);
          if (token.symbol === fromToken.symbol) {
            const alt = TOKENS.find((t) => t.symbol !== token.symbol);
            if (alt) setFromToken(alt);
          }
        }}
        onClose={() => setShowToModal(false)}
        excludeSymbol={fromToken.symbol}
      />
    </PageLayout>
  );
}

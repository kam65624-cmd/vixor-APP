import { useState } from "react";

// ── Fallback prices used only when live feed is unavailable ─────────────
export const FALLBACK_PRICES: Record<string, number> = {
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

// Map swap token symbols to Binance pair names for useLivePrices
export const SWAP_PAIRS = [
  "SOL/USDT",
  "ETH/USDT",
  "BONK/USDT",
  "JUP/USDT",
  "RAY/USDT",
  "ORCA/USDT",
  "WIF/USDT",
  "JTO/USDT",
  "PYTH/USDT",
  "BOME/USDT",
] as const;

// ── Token Definitions ───────────────────────────────────────────────────────
export interface TokenDef {
  symbol: string;
  name: string;
  color: string;
}

export const TOKENS: TokenDef[] = [
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
export const MOCK_BALANCES: Record<string, number> = {
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
export interface MockWallet {
  connected: boolean;
  address: string;
  chain: string;
  balance: string;
}

export function useMockWallet(): MockWallet {
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
export interface SwapRecord {
  id: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  date: string;
  status: "success" | "pending" | "failed";
}

export function getSwapHistory(): SwapRecord[] {
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

export function saveSwapHistory(history: SwapRecord[]) {
  try {
    localStorage.setItem("vixor_swap_history", JSON.stringify(history.slice(0, 5)));
  } catch {
    // ignore
  }
}

// ── Formatting Helpers ──────────────────────────────────────────────────────
export function formatUSD(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000)
    return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value >= 0.01) return `$${value.toFixed(4)}`;
  if (value >= 0.0001) return `$${value.toFixed(6)}`;
  return `$${value.toPrecision(4)}`;
}

export function formatAmount(value: number, symbol: string): string {
  // Use fallback prices only for decimal precision (formatting helper, not price display)
  const price = FALLBACK_PRICES[symbol] || 1;
  const decimals = price >= 1 ? 4 : price >= 0.01 ? 6 : 0;
  if (value === 0) return "0";
  const formatted = value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
  return formatted;
}

export function formatBalance(value: number, symbol: string): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  if (value >= 1) return value.toFixed(4);
  if (value >= 0.0001) return value.toFixed(6);
  return value.toPrecision(4);
}

export function formatDate(dateStr: string): string {
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

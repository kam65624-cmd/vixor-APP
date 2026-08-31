// ── Types ────────────────────────────────────────────────────────────────────

export interface TokenItem {
  symbol: string;
  name: string;
  price: number | null;
  change24h: number | null;
  volume24h: number;
  liquidity: number;
  smartMoneyPct?: number;
  risk?: string;
  chain: string;
  chainId?: string;
  marketCap: number;
  discoveryScore: number;
  socialScore: number;
  liquidityScore: number;
  isHoneypot?: boolean;
  logoUrl?: string;
  sparkline?: number[];
  category?: string;
  address?: string;
  pairAddress?: string;
  dexUrl?: string;
}

export interface DiscoverResponse {
  success: boolean;
  data: TokenItem[];
  total: number;
  filteredOut?: number;
  scanDurationMs?: number;
  source?: string;
  message?: string;
  error?: string;
  categoryCounts?: Record<string, number>;
}

// ── Constants ────────────────────────────────────────────────────────────────

export const CATEGORY_TABS = [
  { key: "ALL", label: "All" },
  { key: "MEME", label: "Meme" },
  { key: "CRYPTO", label: "Crypto" },
  { key: "FOREX", label: "Forex" },
] as const;

export const SORT_OPTIONS = [
  { key: "trending", label: "Trending" },
  { key: "volume", label: "Volume" },
  { key: "change", label: "24h %" },
  { key: "liquidity", label: "Liquidity" },
  { key: "smart", label: "Smart Money" },
] as const;

export type SortKey = (typeof SORT_OPTIONS)[number]["key"];
export type CategoryKey = (typeof CATEGORY_TABS)[number]["key"];

// ── Gold accent colour — uses design token ───────────────────────────────
export const GOLD_COLOR = "var(--color-gold)";
export const GOLD_BG = "color-mix(in srgb, var(--color-gold) 12%, transparent)";
export const GOLD_BORDER = "color-mix(in srgb, var(--color-gold) 20%, transparent)";

// ── Formatters ───────────────────────────────────────────────────────────────

export function fmtPrice(p: number | null): string {
  if (p === null || p === undefined || p === 0) return "—";
  if (p >= 1000) return `$${p.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  if (p >= 1) return `$${p.toFixed(4)}`;
  if (p >= 0.0001) return `$${p.toFixed(6)}`;
  return `$${p.toFixed(8)}`;
}

export function fmtCompact(p: number): string {
  if (p >= 1_000_000_000) return `$${(p / 1_000_000_000).toFixed(2)}B`;
  if (p >= 1_000_000) return `$${(p / 1_000_000).toFixed(2)}M`;
  if (p >= 1_000) return `$${(p / 1_000).toFixed(1)}K`;
  return `$${p.toFixed(0)}`;
}

export function fmtPct(p: number | null): string {
  if (p === null || p === undefined) return "—";
  const sign = p >= 0 ? "+" : "";
  return `${sign}${p.toFixed(1)}%`;
}

export function fmtTimeAgo(seconds: number): string {
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${Math.floor(seconds)}s ago`;
  return `${Math.floor(seconds / 60)}m ago`;
}

/** Format freshness based on server `fetchedAt` timestamp. */
export function fmtFreshness(fetchedAt: number): string {
  const diffSec = Math.floor((Date.now() - fetchedAt) / 1000);
  if (diffSec < 0) return "just now";
  if (diffSec < 60) return `appeared ${diffSec}s ago`;
  if (diffSec < 3600) return `appeared ${Math.floor(diffSec / 60)}m ago`;
  return `appeared ${Math.floor(diffSec / 3600)}h ago`;
}

export function fmtForexPrice(p: number | null): string {
  if (p === null) return "—";
  if (p >= 100) return p.toFixed(2);
  if (p >= 1) return p.toFixed(4);
  return p.toFixed(5);
}

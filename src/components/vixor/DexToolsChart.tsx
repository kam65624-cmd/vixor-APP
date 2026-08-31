/**
 * @module components/vixor/DexToolsChart
 * @description DEXTools deep-link generator + "Open on DEXTools" button.
 *
 * DEXTools blocks iframe embedding (Cloudflare + bot protection),
 * so instead of an embedded chart we provide a direct link to the
 * DEXTools pair explorer page — which works in any browser/WebView.
 */

import { memo, useMemo } from "react";

// ── Chain ID mapping (app chain → DEXTools URL path) ──────────────────────

const CHAIN_MAP: Record<string, string> = {
  solana: "solana",
  sol: "solana",
  ethereum: "ether",
  eth: "ether",
  bsc: "bnb",
  bnb: "bnb",
  base: "base",
  arbitrum: "arbitrum",
  arb: "arbitrum",
  polygon: "polygon",
  poly: "polygon",
  avalanche: "avalanche",
  avax: "avalanche",
  optimism: "optimism",
  polygon_pos: "polygon",
  near: "near",
  injective: "injective",
  sui: "sui",
  ton: "ton",
  tron: "tron",
};

// ── Public helper ──────────────────────────────────────────────────────────

/** Build the DEXTools pair-explorer URL for a given chain + pair address. */
export function getDexToolsUrl(chainId: string, pairAddress: string): string | null {
  const dextoolsChain = CHAIN_MAP[chainId?.toLowerCase()] ?? chainId?.toLowerCase();
  if (!dextoolsChain || !pairAddress) return null;
  return `https://www.dextools.io/app/en/${dextoolsChain}/pair-explorer/${pairAddress}`;
}

// ── Props ────────────────────────────────────────────────────────────────────

export interface DexToolsButtonProps {
  chainId: string;
  pairAddress: string;
  /** Button label. @default "DEXTools Chart" */
  label?: string;
  /** Additional CSS styles for the button container. */
  style?: React.CSSProperties;
  /** HTML class name. */
  className?: string;
}

// ── Component ────────────────────────────────────────────────────────────────

/**
 * A button that opens the DEXTools pair explorer in a new tab.
 * Used as a companion to the native DexChart — not a replacement.
 */
export const DexToolsButton = memo(function DexToolsButton({
  chainId,
  pairAddress,
  label = "Open on DEXTools",
  style,
  className,
}: DexToolsButtonProps) {
  const url = useMemo(() => getDexToolsUrl(chainId, pairAddress), [chainId, pairAddress]);

  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "11px",
        fontWeight: 600,
        color: "var(--color-primary, #6C5CE7)",
        textDecoration: "none",
        padding: "5px 12px",
        borderRadius: "6px",
        border: "1px solid var(--color-primary, #6C5CE7)",
        background: "color-mix(in srgb, var(--color-primary, #6C5CE7) 10%, transparent)",
        transition: "all 0.15s",
        cursor: "pointer",
        ...style,
      }}
    >
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
      {label}
    </a>
  );
});

export default DexToolsButton;

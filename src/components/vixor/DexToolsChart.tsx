/**
 * @module components/vixor/DexToolsChart
 * @description DEXTools Chart Widget — embedded TradingView-powered chart
 * for any DEX pair supported by DEXTools.io.
 *
 * Uses an iframe pointing to:
 *   https://www.dextools.io/widget-chart/en/<chainId>/pe-light/<pairAddress>?...
 *
 * IMPORTANT: This widget will NOT work on localhost.
 * It requires a real domain to render.
 */

import { memo, useMemo } from "react";

// ── Chain ID mapping (app chain → DEXTools chain) ───────────────────────────

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
  // Additional supported chains
  optimism: "optimism",
  "polygon_pos": "polygon",
  near: "near",
  injective: "injective",
  sui: "sui",
  ton: "ton",
  tron: "tron",
};

// ── Props ────────────────────────────────────────────────────────────────────

export interface DexToolsChartProps {
  /** The chain ID (e.g. "solana", "ethereum", "base"). */
  chainId: string;
  /** The DEX pair/pool address. */
  pairAddress: string;
  /** Widget height (CSS value). @default "400px" */
  height?: string;
  /** Widget width (CSS value). @default "100%" */
  width?: string;
  /** Theme: "dark" or "light". @default "dark" */
  theme?: "dark" | "light";
  /** Chart type: 0=Bar, 1=Candle, 2=Line, 3=Area, 8=Heikin Ashi, 9=Hollow Candle, 10=Baseline. @default 1 */
  chartType?: number;
  /** Chart resolution. @default "30" */
  chartResolution?: string;
  /** Show drawing toolbars. @default false */
  drawingToolbars?: boolean;
  /** Show trade history overlay. @default false */
  showTradeHistory?: boolean;
  /** Custom header color (hex without #). */
  headerColor?: string;
  /** Custom chart background color (hex without #). */
  chartBgColor?: string;
  /** Custom pane/controls background color (hex without #). */
  paneColor?: string;
  /** Show chart in USD (true) or native pair (false). @default true */
  chartInUsd?: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────

export const DexToolsChart = memo(function DexToolsChart({
  chainId,
  pairAddress,
  height = "400px",
  width = "100%",
  theme = "dark",
  chartType = 1,
  chartResolution = "30",
  drawingToolbars = false,
  showTradeHistory = false,
  headerColor,
  chartBgColor,
  paneColor,
  chartInUsd = true,
}: DexToolsChartProps) {
  const src = useMemo(() => {
    const dextoolsChain = CHAIN_MAP[chainId?.toLowerCase()] ?? chainId?.toLowerCase();
    if (!dextoolsChain || !pairAddress) return null;

    const params = new URLSearchParams();
    params.set("theme", theme);
    params.set("chartType", String(chartType));
    params.set("chartResolution", chartResolution);
    params.set("drawingToolbars", String(drawingToolbars));
    if (showTradeHistory) params.set("showTradeHistory", "true");
    if (headerColor) params.set("headerColor", headerColor);
    if (chartBgColor) params.set("tvPlatformColor", chartBgColor);
    if (paneColor) params.set("tvPaneColor", paneColor);
    if (!chartInUsd) params.set("chartInUsd", "false");

    return `https://www.dextools.io/widget-chart/en/${dextoolsChain}/pe-light/${pairAddress}?${params.toString()}`;
  }, [chainId, pairAddress, theme, chartType, chartResolution, drawingToolbars, showTradeHistory, headerColor, chartBgColor, paneColor, chartInUsd]);

  if (!src) {
    return (
      <div
        style={{
          width,
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--color-card)",
          color: "var(--color-muted-foreground)",
          fontSize: "13px",
        }}
      >
        DEXTools chart unavailable — missing chain or pair address
      </div>
    );
  }

  return (
    <iframe
      title="DEXTools Trading Chart"
      src={src}
      width={width}
      height={height}
      style={{
        border: "none",
        borderRadius: "0",
        display: "block",
      }}
      loading="lazy"
      allowFullScreen
    />
  );
});

export default DexToolsChart;

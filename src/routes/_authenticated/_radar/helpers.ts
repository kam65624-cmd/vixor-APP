import type { SignalRow, RadarBlip, MarketToken } from "./server-fn";

export function generateMockSignals(signals: SignalRow[]): RadarBlip[] {
  return [];
}

export function generateMockTokens(): MarketToken[] {
  return [];
}

export function generateMockHeatmapData(): Array<{ symbol: string; change: number }> {
  return [];
}

export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function formatPrice(price: number): string {
  if (price >= 1000)
    return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1)
    return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  return price.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 });
}

export function heatmapColor(change: number): string {
  if (change >= 8) return "color-mix(in srgb, var(--color-bullish) 85%, transparent)";
  if (change >= 5) return "color-mix(in srgb, var(--color-bullish) 60%, transparent)";
  if (change >= 2) return "color-mix(in srgb, var(--color-bullish) 40%, transparent)";
  if (change >= 0) return "color-mix(in srgb, var(--color-bullish) 20%, transparent)";
  if (change >= -2) return "color-mix(in srgb, var(--color-bearish) 20%, transparent)";
  if (change >= -5) return "color-mix(in srgb, var(--color-bearish) 40%, transparent)";
  if (change >= -8) return "color-mix(in srgb, var(--color-bearish) 60%, transparent)";
  return "color-mix(in srgb, var(--color-bearish) 85%, transparent)";
}

// ── Formatters — Shared formatting utilities for all pages ────────────────
// Uses: numbro, d3-format, date-fns, decimal.js
import numbro from "numbro";
import { formatDistanceToNow } from "date-fns";
import Decimal from "decimal.js";

// Configure numbro for crypto defaults
numbro.setDefaults({
  thousandSeparated: true,
  mantissa: 2,
  trimMantissa: false,
});

// ── Currency ──────────────────────────────────────────────────────────────

/** Format as currency: $1,234.56 */
export function formatCurrency(value: number | string | Decimal, decimals?: number): string {
  const n =
    typeof value === "string"
      ? parseFloat(value)
      : value instanceof Decimal
        ? value.toNumber()
        : value;
  if (!isFinite(n) || isNaN(n)) return "\u2014";
  const abs = Math.abs(n);
  const prefix = n < 0 ? "-$" : "$";

  if (abs >= 1_000_000_000)
    return `${prefix}${numbro(abs).format({ average: true, totalLength: 4 })}B`;
  if (abs >= 1_000_000) return `${prefix}${numbro(abs).format({ average: true, totalLength: 4 })}M`;
  if (abs >= 10_000)
    return `${prefix}${numbro(abs).format({ thousandSeparated: true, mantissa: 0 })}`;
  if (abs >= 1)
    return `${prefix}${numbro(abs).format({ mantissa: decimals ?? 2, trimMantissa: true })}`;
  if (abs >= 0.01)
    return `${prefix}${numbro(abs).format({ mantissa: decimals ?? 4, trimMantissa: true })}`;
  return `${prefix}${numbro(abs).format({ mantissa: decimals ?? 6, trimMantissa: true })}`;
}

/** Format PnL: +$1,234.56 or -$1,234.56 */
export function formatPnL(value: number): string {
  if (!isFinite(value) || isNaN(value)) return "\u2014";
  return `${value >= 0 ? "+" : "-"}${formatCurrency(Math.abs(value))}`;
}

/** Compact value: $1.2M, $345K, $89 */
export function formatCompact(value: number): string {
  if (!isFinite(value) || isNaN(value)) return "\u2014";
  const abs = Math.abs(value);
  const prefix = value < 0 ? "-$" : "$";
  if (abs >= 1_000_000_000) return `${prefix}${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${prefix}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${prefix}${(abs / 1_000).toFixed(1)}K`;
  return `${prefix}${abs.toFixed(2)}`;
}

// ── Percentages ───────────────────────────────────────────────────────────

/** Format percentage: +85.3% */
export function formatPercent(value: number, decimals = 1): string {
  if (!isFinite(value) || isNaN(value)) return "\u2014";
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}

/** Raw percent: 85.3% (no +/- prefix) */
export function formatPercentRaw(value: number, decimals = 1): string {
  if (!isFinite(value) || isNaN(value)) return "\u2014";
  return `${value.toFixed(decimals)}%`;
}

// ── Numbers ───────────────────────────────────────────────────────────────

/** Format large numbers with commas: 1,234,567 */
export function formatNumber(value: number, decimals?: number): string {
  if (!isFinite(value) || isNaN(value)) return "\u2014";
  return numbro(value).format({ thousandSeparated: true, mantissa: decimals ?? 0 });
}

/** Format a quantity with smart decimals */
export function formatQuantity(value: number): string {
  if (!isFinite(value) || isNaN(value)) return "\u2014";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  if (value >= 1) return numbro(value).format({ mantissa: 2, trimMantissa: true });
  return numbro(value).format({ mantissa: 4, trimMantissa: true });
}

/** Format R-multiple: +2.3R or -0.5R */
export function formatRMultiple(value: number): string {
  if (!isFinite(value) || isNaN(value)) return "\u2014";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}R`;
}

// ── Time ──────────────────────────────────────────────────────────────────

/** Time ago: "5m ago", "2h ago", "3d ago" */
export function formatTimeAgo(dateStr: string | Date): string {
  try {
    const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    if (isNaN(date.getTime())) return "\u2014";
    const diff = Date.now() - date.getTime();
    const secs = Math.floor(diff / 1000);
    if (secs < 60) return `${secs}s ago`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "\u2014";
  }
}

/** Short date: "Jun 15" */
export function formatDateShort(dateStr: string | Date): string {
  try {
    const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    if (isNaN(date.getTime())) return "\u2014";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "\u2014";
  }
}

/** Full date: "Jun 15, 2025" */
export function formatDateFull(dateStr: string | Date): string {
  try {
    const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    if (isNaN(date.getTime())) return "\u2014";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "\u2014";
  }
}

/** Relative time using date-fns */
export function formatRelative(dateStr: string | Date): string {
  try {
    const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    if (isNaN(date.getTime())) return "\u2014";
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return "\u2014";
  }
}

// ── Price helpers ─────────────────────────────────────────────────────────

/** Smart price formatting based on magnitude */
export function formatPrice(price: number): string {
  if (!isFinite(price) || isNaN(price)) return "\u2014";
  if (price >= 1000) return `$${numbro(price).format({ mantissa: 2, trimMantissa: true })}`;
  if (price >= 1) return `$${numbro(price).format({ mantissa: 2, trimMantissa: true })}`;
  if (price >= 0.01) return `$${numbro(price).format({ mantissa: 4, trimMantissa: true })}`;
  return `$${numbro(price).format({ mantissa: 6, trimMantissa: true })}`;
}

// ── Precision Math ────────────────────────────────────────────────────────

/** Safe division — returns 0 if denominator is 0 */
export function safeDiv(numerator: number, denominator: number): number {
  if (!denominator || !isFinite(denominator)) return 0;
  return numerator / denominator;
}

/** Calculate PnL percentage */
export function calcPnlPercent(entry: number, exit: number, direction: "long" | "short"): number {
  if (!entry || !isFinite(entry) || entry === 0) return 0;
  if (direction === "long") return ((exit - entry) / entry) * 100;
  return ((entry - exit) / entry) * 100;
}

// ── Decimal.js precision math ────────────────────────────────────────────

export function preciseAdd(a: number | string, b: number | string): string {
  return new Decimal(a).plus(new Decimal(b)).toFixed();
}

export function preciseSub(a: number | string, b: number | string): string {
  return new Decimal(a).minus(new Decimal(b)).toFixed();
}

export function preciseMul(a: number | string, b: number | string): string {
  return new Decimal(a).times(new Decimal(b)).toFixed();
}

export function preciseDiv(a: number | string, b: number | string, dp = 8): string {
  if (new Decimal(b).isZero()) return "0";
  return new Decimal(a).div(new Decimal(b)).toFixed(dp);
}

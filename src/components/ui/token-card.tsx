"use client";

import * as React from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/shared/utils";
import { MiniSparkline } from "@/components/vixor/MiniSparkline";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export interface TokenCardData {
  symbol: string;
  name?: string;
  price: number;
  change24h?: number;
  volume24h?: number;
  marketCap?: number;
  sparkline?: number[];
  category?: string;
  chain?: string;
  image?: string;
}

export interface TokenCardProps extends React.HTMLAttributes<HTMLDivElement> {
  token: TokenCardData;
  /** Render mode */
  mode?: "compact" | "expanded";
  /** Link to token detail page (default: true) */
  linkToDetail?: boolean;
  /** Show sparkline (default: true if data available) */
  showSparkline?: boolean;
  /** Right-side action slot */
  action?: React.ReactNode;
  /** Custom content override for expanded mode */
  children?: React.ReactNode;
}

/**
 * Unified TokenCard — V5 Design System
 * Rule #1: Every token is CLICKABLE → links to /token/$symbol
 * Used across all pages: Discover, Signals, Portfolio, etc.
 */
export function TokenCard({
  token,
  mode = "compact",
  linkToDetail = true,
  showSparkline = true,
  action,
  children,
  className,
  ...props
}: TokenCardProps) {
  const isPositive = (token.change24h ?? 0) >= 0;
  const changeColor =
    token.change24h === 0 ? "text-muted-foreground" : isPositive ? "text-bullish" : "text-bearish";

  const content = (
    <Card
      variant="interactive"
      padding={mode === "compact" ? "sm" : "md"}
      className={cn("group w-full", className)}
      {...props}
    >
      <div className="flex items-center gap-3">
        {/* Token Icon */}
        <div className="h-9 w-9 shrink-0 rounded-full bg-card-hover border border-border overflow-hidden">
          {token.image ? (
            <img
              src={token.image}
              alt={token.symbol}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-muted-foreground">
              {token.symbol.slice(0, 2)}
            </div>
          )}
        </div>

        {/* Token Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground truncate">{token.symbol}</span>
            {token.category && (
              <Badge variant="muted" className="text-[10px] px-1.5 py-0">
                {token.category}
              </Badge>
            )}
          </div>
          {mode === "expanded" && token.name && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{token.name}</p>
          )}
        </div>

        {/* Sparkline (compact mode) */}
        {mode === "compact" && showSparkline && token.sparkline && token.sparkline.length > 0 && (
          <div className="w-16 h-6 shrink-0">
            <MiniSparkline
              data={token.sparkline}
              color={isPositive ? "var(--bullish)" : "var(--bearish)"}
              width={64}
              height={24}
            />
          </div>
        )}

        {/* Price + Change */}
        <div className="text-right shrink-0">
          <div className="text-sm font-semibold text-foreground font-mono tabular-nums tracking-tight">
            {formatPrice(token.price)}
          </div>
          {token.change24h !== undefined && (
            <div className={cn("text-xs font-mono tabular-nums", changeColor)}>
              {isPositive ? "+" : ""}
              {token.change24h.toFixed(2)}%
            </div>
          )}
        </div>

        {/* Action slot */}
        {action && <div className="shrink-0 ml-1">{action}</div>}
      </div>

      {/* Expanded content */}
      {mode === "expanded" && children && (
        <div className="mt-3 pt-3 border-t border-border">{children}</div>
      )}

      {/* Expanded sparkline */}
      {mode === "expanded" && showSparkline && token.sparkline && token.sparkline.length > 0 && (
        <div className="mt-3 h-16">
          <MiniSparkline
            data={token.sparkline}
            color={isPositive ? "var(--bullish)" : "var(--bearish)"}
            width={300}
            height={64}
          />
        </div>
      )}
    </Card>
  );

  if (linkToDetail) {
    return (
      <Link
        to="/token/$symbol"
        params={{ symbol: token.symbol }}
        className="block no-underline"

        search={{} as any}
      >
        {content}
      </Link>
    );
  }

  return content;
}

/** Format price for display */
function formatPrice(price: number): string {
  if (price >= 1)
    return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 0.01) return price.toFixed(4);
  if (price >= 0.0001) return price.toFixed(6);
  return price.toFixed(8);
}

export default TokenCard;

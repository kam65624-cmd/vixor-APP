import { Link } from "@tanstack/react-router";
import { memo } from "react";

import { NotificationBell } from "./NotificationBell";
import { LivePriceIndicator } from "./LivePriceIndicator";
import { PointsBadge } from "./PointsBadge";
import { WalletNavLabel } from "./WalletNavLabel";
import { TopNavAvatar } from "./TopNavAvatar";

// ─────────────────────────────────────────────────────────────────────────────
// TOP NAV — Minimal: Logo, Discover CTA, SOL price, Deposit, Wallet, User, Bell
// ─────────────────────────────────────────────────────────────────────────────

export interface TopNavProps {
  solPrice?: number | null;
  solChange?: number | null;
  isTg?: boolean;
  onWalletClick?: () => void;
}

export const TopNav = memo(function TopNav({
  solPrice,
  solChange,
  isTg,
  onWalletClick,
}: TopNavProps) {
  return (
    <header
      className="fixed inset-x-0 z-50 top-nav-premium"
      style={{
        background: "var(--overlay-secondary)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderBottom: "1px solid var(--color-border)",
        height: "44px",
        top: isTg ? "env(safe-area-inset-top, 0px)" : "0px",
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
      }}
    >
      <div className="flex items-center justify-between w-full" style={{ maxWidth: "100%" }}>
        {/* Left: Logo (icon only) */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center mr-4" style={{ textDecoration: "none" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: "var(--gradient-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--primary-foreground)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 3v18h18" />
                <path d="M7 14l4-4 4 4 5-5" />
              </svg>
            </div>
          </Link>

          {/* SOL Global Price — compact */}
          <div
            className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-bold"
            style={{
              color: (solChange ?? 0) >= 0 ? "var(--color-bullish)" : "var(--color-bearish)",
            }}
          >
            SOL {solPrice ? `$${solPrice.toFixed(2)}` : "..."}
            {solChange != null ? ` ${solChange >= 0 ? "+" : ""}${solChange.toFixed(1)}%` : ""}
          </div>

          {/* BTC Live Price Indicator */}
          <LivePriceIndicator />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Points */}
          <PointsBadge />

          {/* Wallet — shows balance when connected, opens modal when disconnected */}
          <button
            onClick={onWalletClick}
            className="flex items-center gap-1 px-2 sm:px-3 py-1 rounded text-xs sm:text-[12px] font-bold"
            style={{
              background: "var(--gradient-primary)",
              color: "var(--primary-foreground)",
              border: "none",
              borderRadius: "8px",
              boxShadow: "0 2px 8px color-mix(in srgb, var(--color-primary) 25%, transparent)",
              height: "30px",
              cursor: "pointer",
              textDecoration: "none",
              fontFamily: "var(--font-sans)",
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
              <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
            </svg>
            <WalletNavLabel />
          </button>

          {/* User Avatar — real photo from profile */}
          <TopNavAvatar />

          {/* Notifications — with unread badge */}
          <NotificationBell />
        </div>
      </div>
    </header>
  );
});

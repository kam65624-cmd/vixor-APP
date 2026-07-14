/* eslint-disable react-refresh/only-export-components */
"use client";

// ============================================================================
// VIXOR Wallet Connect Button — UI Component
// ============================================================================
//
// A compact button that shows wallet connection state.
// Matches the VIXOR design system (dark theme, glass morphism).
//
// States:
//   - Disconnected: "Connect Wallet" button (gradient primary)
//   - Connecting: "Connecting..." spinner
//   - Connected: Wallet address (truncated) + chain badge + disconnect option
//   - Error: Error message with retry
// ============================================================================

import { useWallet } from "./WalletProvider";
import type { WalletChain } from "@/domains/wallet/types";
import { useCallback, useState } from "react";

// ── WalletIcon ──
function WalletIcon({ chain, size = 14 }: { chain: WalletChain; size?: number }) {
  if (chain === "solana") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="50" cy="50" r="50" fill="url(#sol-grad)" />
        <path
          d="M68.5 41.5c-8.5-4.2-22.4-5.8-30.4-6.5-1.2-.1-2.1.8-1.9 2 .4 2.6 1.7 6.8 5.2 10.8 3.5 4 8.6 6.8 15.4 7.9 1.2.2 2.2-.8 2-2-.7-4.8-2.6-8.4-4.8-10.7 8.5.9 15.5 3.4 20.5 5.5 1.3.6 2.5-.7 1.7-1.8l-2-3.2c3.5 1.8 5.8 3.5 6.3 3.9.7.5 1.6.2 1.8-.6.3-1 .4-2.1.2-3.1-.2-1.4-.9-2.7-1.9-3.9-3.5 0-9.3-2.4-13-5.3h-.1z"
          fill="white"
        />
        <defs>
          <linearGradient id="sol-grad" x1="0" y1="0" x2="100" y2="100">
            <stop stopColor="#9945FF" />
            <stop offset="1" stopColor="#14F195" />
          </linearGradient>
        </defs>
      </svg>
    );
  }
  // EVM (Ethereum-style)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="50" r="50" fill="#627EEA" />
      <path d="M50 20L50 40L70 50L50 20Z" fill="white" fillOpacity="0.6" />
      <path d="M50 20L30 50L50 40L50 20Z" fill="white" />
      <path d="M50 65L50 80L70 55L50 65Z" fill="white" fillOpacity="0.6" />
      <path d="M50 80L30 55L50 65L50 80Z" fill="white" />
      <path d="M50 60L70 50L50 45L30 50L50 60Z" fill="white" />
    </svg>
  );
}

// ── Truncate address ──
function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// ── WalletConnectButton Component ──

interface WalletConnectButtonProps {
  /** Extra CSS classes */
  className?: string;
  /** Show the disconnect option */
  showDisconnect?: boolean;
  /** Callback when wallet connects */
  onConnect?: () => void;
  /** Callback when wallet disconnects */
  onDisconnect?: () => void;
}

export function WalletConnectButton({
  className = "",
  showDisconnect = true,
  onConnect,
  onDisconnect,
}: WalletConnectButtonProps) {
  const { wallet, loading, error, connect, disconnect, clearError } = useWallet();
  const [showMenu, setShowMenu] = useState(false);

  const handleConnect = useCallback(async () => {
    // For now, trigger the wallet adapter connect flow
    // In Phase B.3, this will open a modal with Solana + EVM options
    // For now, we dispatch a custom event that the wallet adapter can listen to
    const event = new CustomEvent("vixor:wallet-connect-request");
    window.dispatchEvent(event);
  }, []);

  const handleDisconnect = useCallback(async () => {
    await disconnect();
    setShowMenu(false);
    onDisconnect?.();
  }, [disconnect, onDisconnect]);

  // ── Connected state ──
  if (wallet && wallet.status === "connected") {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border hover:bg-card-hover transition-colors"
          aria-label="Wallet menu"
        >
          <WalletIcon chain={wallet.chain} size={14} />
          <span className="text-xs font-medium text-foreground">
            {truncateAddress(wallet.address)}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground px-1.5 py-0.5 rounded-md bg-muted">
            {wallet.chain}
          </span>
        </button>

        {showMenu && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            {/* Menu */}
            <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-xl bg-card border border-border shadow-[var(--shadow-elevated)] p-1">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                  Connected Wallet
                </p>
                <p className="text-xs font-mono text-foreground mt-0.5">
                  {truncateAddress(wallet.address)}
                </p>
              </div>
              {showDisconnect && (
                <button
                  onClick={handleDisconnect}
                  className="w-full text-left px-3 py-2 text-xs text-bearish hover:bg-bearish/10 rounded-lg transition-colors"
                >
                  Disconnect
                </button>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // ── Connecting state ──
  if (loading || wallet?.status === "connecting") {
    return (
      <div
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border ${className}`}
      >
        <div className="size-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span className="text-xs font-medium text-muted-foreground">Connecting...</span>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <button
          onClick={() => {
            clearError();
            handleConnect();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bearish/10 border border-bearish/20 hover:bg-bearish/20 transition-colors"
          aria-label="Retry wallet connection"
        >
          <span className="text-xs font-medium text-bearish">Retry</span>
        </button>
        <span className="text-[10px] text-bearish/70 max-w-[120px] truncate" title={error}>
          {error}
        </span>
      </div>
    );
  }

  // ── Disconnected state (default) ──
  return (
    <button
      onClick={handleConnect}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl gradient-primary text-primary-foreground font-medium text-xs hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-[var(--shadow-primary)] ${className}`}
      aria-label="Connect wallet"
    >
      <svg
        className="size-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2.5" />
        <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
      </svg>
      <span>Connect</span>
    </button>
  );
}

// ── Re-export WalletIcon for use in other components ──
export { WalletIcon, truncateAddress };

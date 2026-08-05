"use client";

// ============================================================================
// VIXOR Wallet Provider Selector — V6 Premium UI
// ============================================================================
//
// Pure list component for choosing a wallet provider.
// Designed to be embedded inside a parent modal (e.g. AppShell's bottom sheet).
// Handles availability detection, EVM chain selection, and connection flow.
// ============================================================================

import { useState, useCallback } from "react";
import { useWallet } from "./WalletProvider";
import type { WalletChain, EvmChainId, WalletProvider as WProvider } from "@/domains/wallet/types";
import { connectPhantom, isPhantomInstalled } from "@/domains/wallet/adapters/phantom-adapter";
import { connectMetaMask, isMetaMaskInstalled } from "@/domains/wallet/adapters/metamask-adapter";
import { isWalletConnectAvailable } from "@/domains/wallet/adapters/walletconnect-adapter";
import {
  connectTelegramWallet,
  isTelegramWebApp,
} from "@/domains/wallet/adapters/telegram-adapter";

// ── Types ──

interface ProviderOption {
  id: WProvider;
  name: string;
  icon: string;
  description: string;
  chain: WalletChain;
  installUrl: string;
}

// ── Static provider definitions ──

const PROVIDERS: ProviderOption[] = [
  {
    id: "PHANTOM",
    name: "Phantom",
    icon: "phantom",
    description: "Solana wallet — fast, low fees",
    chain: "solana",
    installUrl: "https://phantom.app",
  },
  {
    id: "METAMASK",
    name: "MetaMask",
    icon: "metamask",
    description: "EVM wallet — ETH, Polygon, Avalanche",
    chain: "evm",
    installUrl: "https://metamask.io",
  },
  {
    id: "TELEGRAM",
    name: "Telegram Wallet",
    icon: "telegram",
    description: "TON Blockchain",
    chain: "ton",
    installUrl: "https://t.me/TonkeeperBot",
  },
  {
    id: "WALLETCONNECT",
    name: "WalletConnect",
    icon: "walletconnect",
    description: "Multi-chain — scan QR code",
    chain: "evm",
    installUrl: "",
  },
];

// ── Icons ──

function ProviderIcon({ icon, size = 40 }: { icon: string; size?: number }) {
  if (icon === "phantom") {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="50" fill="url(#pg)" />
        <path
          d="M68.5 41.5c-8.5-4.2-22.4-5.8-30.4-6.5-1.2-.1-2.1.8-1.9 2 .4 2.6 1.7 6.8 5.2 10.8 3.5 4 8.6 6.8 15.4 7.9 1.2.2 2.2-.8 2-2-.7-4.8-2.6-8.4-4.8-10.7 8.5.9 15.5 3.4 20.5 5.5 1.3.6 2.5-.7 1.7-1.8l-2-3.2c3.5 1.8 5.8 3.5 6.3 3.9.7.5 1.6.2 1.8-.6.3-1 .4-2.1.2-3.1-.2-1.4-.9-2.7-1.9-3.9-3.5 0-9.3-2.4-13-5.3h-.1z"
          fill="white"
        />
        <defs>
          <linearGradient id="pg" x1="0" y1="0" x2="100" y2="100">
            <stop stopColor="#9945FF" />
            <stop offset="1" stopColor="#14F195" />
          </linearGradient>
        </defs>
      </svg>
    );
  }
  if (icon === "metamask") {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="50" fill="#F6851B" />
        <path d="M50 22L30 40l20 8 20-8-20-18z" fill="#E2761B" stroke="#E2761B" strokeWidth="2" />
        <path d="M30 40l20 8v-26L30 40z" fill="#E4761B" stroke="#E4761B" strokeWidth="2" />
        <path d="M70 40L50 22v26l20-8z" fill="#D7C1B3" stroke="#D7C1B3" strokeWidth="2" />
        <path d="M30 40l20 28-20-20v-8z" fill="#233447" stroke="#233447" strokeWidth="2" />
        <path d="M70 40v8l-20 20 20-28z" fill="#233447" stroke="#233447" strokeWidth="2" />
      </svg>
    );
  }
  if (icon === "telegram") {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="50" fill="#2AABEE" />
        <path
          d="M74.4 25.6L65.2 72.8c-.6 2.6-2.2 3.2-4.4 2L48.8 66l-5.8 5.6c-.6.6-1.2 1.2-2.4 1.2l.8-12 36.6-33c1.6-1.4-.4-2.2-2.4-.8L34.6 58l-11.4-3.6c-2.6-.8-2.6-2.6.6-3.8l44.2-17c2.2-.8 4 .6 3.2 3.8z"
          fill="white"
        />
      </svg>
    );
  }
  if (icon === "walletconnect") {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="50" fill="#3B99FC" />
        <text
          x="50"
          y="58"
          textAnchor="middle"
          fill="white"
          fontSize="28"
          fontWeight="bold"
          fontFamily="system-ui, sans-serif"
        >
          WC
        </text>
      </svg>
    );
  }
  return null;
}

// ── EVM Chain Options ──

const EVM_CHAIN_OPTIONS: { id: EvmChainId; label: string; symbol: string }[] = [
  { id: "0x1", label: "Ethereum", symbol: "ETH" },
  { id: "0x89", label: "Polygon", symbol: "MATIC" },
  { id: "0xa86a", label: "Avalanche", symbol: "AVAX" },
];

// ── Component ──

export function WalletProviderSelector() {
  const { connect, clearError } = useWallet();
  const [connecting, setConnecting] = useState<WProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvmChain, setSelectedEvmChain] = useState<EvmChainId>("0x1");

  const inTelegram = isTelegramWebApp();

  // Check availability at render time
  const providers = PROVIDERS.map((p) => {
    const available =
      p.id === "PHANTOM"
        ? isPhantomInstalled()
        : p.id === "METAMASK"
          ? isMetaMaskInstalled()
          : p.id === "TELEGRAM"
            ? inTelegram
            : p.id === "WALLETCONNECT"
              ? isWalletConnectAvailable()
              : false;

    return {
      ...p,
      available,
      description:
        p.id === "TELEGRAM" && !inTelegram
          ? "TON Blockchain — Open in Telegram"
          : p.id === "WALLETCONNECT" && !available
            ? "Multi-chain — Coming Soon"
            : p.description,
    };
  });

  const handleConnect = useCallback(
    async (provider: ProviderOption & { available: boolean }) => {
      if (!provider.available) {
        if (provider.installUrl) {
          window.open(provider.installUrl, "_blank", "noopener");
        }
        return;
      }

      setConnecting(provider.id);
      setError(null);
      clearError();

      try {
        if (provider.id === "PHANTOM") {
          const { getAddress, signMessage } = await connectPhantom();
          await connect({ chain: "solana", getAddress, signMessage });
        } else if (provider.id === "METAMASK") {
          const { getAddress, signMessage } = await connectMetaMask(selectedEvmChain);
          await connect({ chain: "evm", getAddress, signMessage });
        } else if (provider.id === "TELEGRAM") {
          const { address } = await connectTelegramWallet();
          await connect({
            chain: "ton",
            getAddress: async () => address,
            signMessage: async (msg: string) => {
              console.warn("[Telegram] signMessage not yet implemented via TON Connect SDK");
              return `ton_placeholder_${msg.length}`;
            },
          });
        } else if (provider.id === "WALLETCONNECT") {
          setError("WalletConnect will be available in a future update.");
          setConnecting(null);
          return;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Connection failed";
        setError(msg);
      } finally {
        setConnecting(null);
      }
    },
    [connect, clearError, selectedEvmChain],
  );

  return (
    <div className="space-y-3">
      {/* EVM chain selector — V6 pill style */}
      <div className="flex gap-2" role="radiogroup" aria-label="Select EVM chain">
        {EVM_CHAIN_OPTIONS.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedEvmChain(c.id)}
            className={`flex-1 rounded-xl border px-3 py-2.5 text-center transition-all min-h-[44px] ${
              selectedEvmChain === c.id
                ? "border-primary/30 bg-primary/10 text-foreground shadow-[var(--shadow-glow)]"
                : "border-[var(--color-border)] text-muted-foreground hover:border-[var(--border-hover)] hover:bg-[var(--surface-elevated)]"
            }`}
            role="radio"
            aria-checked={selectedEvmChain === c.id}
          >
            <div className="text-xs font-bold uppercase tracking-wider font-mono">{c.symbol}</div>
            <div className="text-[11px] text-foreground/50 mt-0.5">{c.label}</div>
          </button>
        ))}
      </div>

      {/* Provider list — V6 premium cards */}
      <div className="grid gap-2.5">
        {providers.map((p) => {
          const isConnecting = connecting === p.id;
          const isDisabled = connecting !== null || !p.available;

          return (
            <button
              key={p.id}
              onClick={() => handleConnect(p)}
              disabled={isDisabled}
              className={`relative flex items-center gap-4 rounded-2xl border p-4 transition-all min-h-[64px] overflow-hidden ${
                isDisabled
                  ? "opacity-50 cursor-not-allowed border-[var(--color-border)] bg-[var(--color-card)]"
                  : "border-[var(--color-border)] bg-[var(--color-card)] hover:border-primary/30 hover:bg-[var(--surface-elevated)] hover:shadow-[var(--shadow-card-glow)] active:scale-[0.98] cursor-pointer"
              }`}
              aria-label={`Connect ${p.name}`}
            >
              {/* Subtle gradient overlay on hover */}
              {!isDisabled && (
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 hover:opacity-100 transition-opacity" />
              )}

              <div className="relative z-10 flex items-center gap-4 w-full">
                <ProviderIcon icon={p.icon} />
                <div className="flex-1 text-left min-w-0">
                  <div className="text-[13px] font-bold text-foreground">{p.name}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{p.description}</div>
                </div>
                {isConnecting ? (
                  <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                ) : p.id === "TELEGRAM" && p.available ? (
                  <span className="rounded-lg bg-[#2AABEE]/15 px-3 py-1.5 text-[10px] font-bold text-[#2AABEE] border border-[#2AABEE]/20">
                    RECOMMENDED
                  </span>
                ) : p.id === "TELEGRAM" && !p.available ? (
                  <span className="rounded-lg bg-[var(--surface-elevated)] px-3 py-1.5 text-[10px] font-bold text-[var(--color-neutral-wait)] border border-[var(--color-border)]">
                    OPEN IN TG
                  </span>
                ) : p.id === "WALLETCONNECT" ? (
                  <span className="rounded-lg bg-[var(--surface-elevated)] px-3 py-1.5 text-[10px] font-bold text-[var(--color-neutral-wait)] border border-[var(--color-border)]">
                    SOON
                  </span>
                ) : p.available ? (
                  <span className="rounded-lg bg-bullish/15 px-3 py-1.5 text-[10px] font-bold text-bullish border border-bullish/20">
                    CONNECT
                  </span>
                ) : (
                  <span className="rounded-lg bg-[var(--surface-elevated)] px-3 py-1.5 text-[10px] font-bold text-muted-foreground border border-[var(--color-border)]">
                    INSTALL
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Inline error — V6 style */}
      {error && (
        <div className="rounded-xl border border-bearish/20 bg-bearish/8 p-3 flex items-start gap-2.5">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-bearish)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 mt-0.5"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
          <span className="text-[12px] text-bearish leading-relaxed flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-muted-foreground hover:text-foreground text-xs leading-none mt-0.5 shrink-0"
            aria-label="Dismiss error"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="18" x2="6" y1="6" y2="18" />
              <line x1="6" x2="18" y1="6" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Disclaimer — V6 subtle style */}
      <div className="flex items-start gap-2 pt-1">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-muted-foreground)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 mt-0.5"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
          By connecting, you sign a message proving wallet ownership. We never store private keys.
        </p>
      </div>
    </div>
  );
}

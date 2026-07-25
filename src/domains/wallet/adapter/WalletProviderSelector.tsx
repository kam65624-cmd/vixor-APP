"use client";

// ============================================================================
// VIXOR Wallet Provider Selector — Modal for choosing Phantom or MetaMask
// ============================================================================
//
// This component is triggered by the WalletConnectButton and provides
// a provider selection dialog with chain selection for EVM.
// ============================================================================

import { useState, useCallback } from "react";
import { useWallet } from "./WalletProvider";
import type { WalletChain, EvmChainId, WalletProvider as WProvider } from "@/domains/wallet/types";
import { EVM_CHAINS } from "@/domains/wallet/types";
import { connectPhantom, isPhantomInstalled } from "@/domains/wallet/adapters/phantom-adapter";
import { connectMetaMask, isMetaMaskInstalled } from "@/domains/wallet/adapters/metamask-adapter";
import {
  isWalletConnectAvailable,
  connectWalletConnect,
} from "@/domains/wallet/adapters/walletconnect-adapter";
import {
  connectTelegramWallet,
  isTelegramWebApp,
} from "@/domains/wallet/adapters/telegram-adapter";

interface ProviderOption {
  id: WProvider;
  name: string;
  icon: string;
  description: string;
  chain: WalletChain;
  available: boolean;
  installUrl: string;
}

const PROVIDERS: ProviderOption[] = [
  {
    id: "PHANTOM",
    name: "Phantom",
    icon: "phantom",
    description: "Solana wallet — fast, low fees",
    chain: "solana",
    available: false, // checked at runtime
    installUrl: "https://phantom.app",
  },
  {
    id: "METAMASK",
    name: "MetaMask",
    icon: "metamask",
    description: "EVM wallet — ETH, Polygon, Avalanche",
    chain: "evm",
    available: false, // checked at runtime
    installUrl: "https://metamask.io",
  },
  {
    id: "TELEGRAM",
    name: "Telegram Wallet",
    icon: "telegram",
    description: "TON Blockchain",
    chain: "ton",
    available: false, // checked at runtime (Telegram WebApp)
    installUrl: "https://t.me/TonkeeperBot",
  },
  {
    id: "WALLETCONNECT",
    name: "WalletConnect",
    icon: "walletconnect",
    description: "Multi-chain — scan QR code",
    chain: "evm",
    available: false, // checked at runtime
    installUrl: "",
  },
];

function ProviderIcon({ icon, size = 32 }: { icon: string; size?: number }) {
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
  // MetaMask
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
  // Telegram
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
  // WalletConnect
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
  // Fallback
}

const EVM_CHAIN_OPTIONS: { id: EvmChainId; label: string; symbol: string }[] = [
  { id: "0x1", label: "Ethereum", symbol: "ETH" },
  { id: "0x89", label: "Polygon", symbol: "MATIC" },
  { id: "0xa86a", label: "Avalanche", symbol: "AVAX" },
];

export function WalletProviderSelector() {
  const { connect, clearError } = useWallet();
  const [open, setOpen] = useState(false);
  const [connecting, setConnecting] = useState<WProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvmChain, setSelectedEvmChain] = useState<EvmChainId>("0x1");

  const inTelegram = isTelegramWebApp();

  // Check availability at render time
  const providers = PROVIDERS.map((p) => ({
    ...p,
    description:
      p.id === "TELEGRAM" && !inTelegram ? "TON Blockchain — Open in Telegram" : p.description,
    available:
      p.id === "PHANTOM"
        ? isPhantomInstalled()
        : p.id === "METAMASK"
          ? isMetaMaskInstalled()
          : p.id === "TELEGRAM"
            ? inTelegram
            : p.id === "WALLETCONNECT"
              ? isWalletConnectAvailable()
              : false,
  }));

  const handleConnect = useCallback(
    async (provider: ProviderOption) => {
      setConnecting(provider.id);
      setError(null);

      try {
        if (provider.id === "PHANTOM") {
          const { getAddress, signMessage } = await connectPhantom();
          await connect({ chain: "solana", getAddress, signMessage });
        } else if (provider.id === "METAMASK") {
          const { getAddress, signMessage } = await connectMetaMask(selectedEvmChain);
          await connect({ chain: "evm", getAddress, signMessage });
        } else if (provider.id === "TELEGRAM") {
          const { address } = await connectTelegramWallet();
          // TON wallet connected — provide simple stubs for the provider
          await connect({
            chain: "ton",
            getAddress: async () => address,
            signMessage: async (msg: string) => {
              // In a production integration, @tonconnect/sdk would handle signing.
              // For now, return a placeholder signature to complete the flow.
              console.warn("[Telegram] signMessage not yet implemented via TON Connect SDK");
              return `ton_placeholder_${msg.length}`;
            },
          });
        } else if (provider.id === "WALLETCONNECT") {
          // WalletConnect v2 is not yet available — show descriptive error
          setError("WalletConnect v2 requires @walletconnect/web3provider. Install it to enable.");
          setConnecting(null);
          return;
        }
        setOpen(false);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Connection failed";
        setError(msg);
      } finally {
        setConnecting(null);
      }
    },
    [connect, selectedEvmChain],
  );

  return (
    <>
      {/* Trigger button — same style as existing WalletConnectButton disconnected state */}
      <button
        onClick={() => {
          clearError();
          setOpen(true);
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl gradient-primary text-primary-foreground font-medium text-xs hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-[var(--shadow-primary)]"
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

      {/* Provider selection dialog */}
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Modal */}
          <div
            className="relative w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5 shadow-[var(--shadow-elevated)]"
            role="dialog"
            aria-modal="true"
            aria-label="Connect a wallet"
          >
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Connect Wallet</h2>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Choose a wallet. Non-custodial — your keys, your crypto.
            </p>

            {/* EVM chain selector (only shown when MetaMask is selected) */}
            <div className="mt-4 flex gap-2" role="radiogroup" aria-label="Select EVM chain">
              {EVM_CHAIN_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedEvmChain(c.id)}
                  className={`flex-1 rounded-lg border px-2 py-2 text-center transition-colors min-h-[44px] ${
                    selectedEvmChain === c.id
                      ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text-primary)]"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]"
                  }`}
                  role="radio"
                  aria-checked={selectedEvmChain === c.id}
                >
                  <div className="text-[11px] font-bold uppercase tracking-wider">{c.symbol}</div>
                  <div className="text-xs">{c.label}</div>
                </button>
              ))}
            </div>

            {/* Provider buttons */}
            <div className="mt-4 grid gap-2">
              {providers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleConnect(p)}
                  disabled={connecting !== null || (p.id === "WALLETCONNECT" && !p.available)}
                  className={`flex items-center gap-3 rounded-xl border border-[var(--border)] p-3 transition-colors min-h-[56px] ${p.id === "WALLETCONNECT" && !p.available ? "opacity-50 cursor-not-allowed" : "hover:border-[var(--border-hover)] disabled:opacity-50"}`}
                  aria-label={`Connect ${p.name}`}
                >
                  <ProviderIcon icon={p.icon} size={36} />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-[var(--text-primary)]">{p.name}</div>
                    <div className="text-xs text-[var(--text-secondary)]">{p.description}</div>
                  </div>
                  {connecting === p.id ? (
                    <div className="size-5 rounded-full border-2 border-[var(--text-secondary)] border-t-transparent animate-spin" />
                  ) : p.id === "TELEGRAM" && p.available ? (
                    <span className="rounded-lg bg-[#2AABEE]/15 px-2.5 py-1 text-[11px] font-bold text-[#2AABEE]">
                      RECOMMENDED
                    </span>
                  ) : p.id === "TELEGRAM" && !p.available ? (
                    <span className="rounded-lg bg-[var(--surface-2)] px-2.5 py-1 text-[11px] font-bold text-[var(--neutral-wait)]">
                      OPEN IN TG
                    </span>
                  ) : p.id === "WALLETCONNECT" ? (
                    <span className="rounded-lg bg-[var(--surface-2)] px-2.5 py-1 text-[11px] font-bold text-[var(--neutral-wait)]">
                      COMING SOON
                    </span>
                  ) : p.available ? (
                    <span className="rounded-lg bg-[var(--surface-2)] px-2.5 py-1 text-[11px] font-bold text-[var(--bullish)]">
                      DETECTED
                    </span>
                  ) : (
                    <span className="rounded-lg bg-[var(--surface-2)] px-2.5 py-1 text-[11px] font-bold text-[var(--neutral-wait)]">
                      INSTALL
                    </span>
                  )}
                </button>
              ))}
            </div>

            {error && (
              <div className="mt-3 rounded-lg border border-[var(--bearish)]/30 bg-[var(--bearish)]/10 p-2.5">
                <p className="text-xs text-[var(--bearish)]">{error}</p>
              </div>
            )}

            <p className="mt-4 text-[11px] text-[var(--text-tertiary)] leading-relaxed">
              By connecting, you sign a message proving wallet ownership. We never store private
              keys.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

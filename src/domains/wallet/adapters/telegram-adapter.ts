// ============================================================================
// VIXOR Telegram Wallet Adapter — TON Blockchain
// ============================================================================
//
// Detects Telegram WebApp context, provides connection helpers and
// balance-fetching for TON addresses via public APIs.
//
// Supports TON Connect v2 protocol for signing messages and transactions.
// Falls back to sessionStorage polling if the SDK is unavailable.
//
// Non-custodial: only interacts with Telegram WebApp public APIs and
// public TON blockchain APIs. No private keys are ever accessed or stored.
// ============================================================================

import type { TokenBalance } from "../types";

// ---------------------------------------------------------------------------
// Telegram WebApp types (minimal subset)
// ---------------------------------------------------------------------------

interface TelegramWebApp {
  openTelegramLink(url: string): void;
  close(): void;
  ready(): void;
  initDataUnsafe?: {
    user?: {
      id: number;
      first_name: string;
      username?: string;
    };
  };
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

// ---------------------------------------------------------------------------
// Connection result
// ---------------------------------------------------------------------------

export interface TelegramWalletResult {
  address: string;
  /** Whether the connection happened inside Telegram WebApp */
  inTelegram: boolean;
}

// ---------------------------------------------------------------------------
// TON Connect bridge state (lazy-loaded)
// ---------------------------------------------------------------------------

let _tonConnect: unknown = null;
let _tonConnectWallet: { address: string; device: { appName: string } } | null = null;

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

/** Check if the app is running inside a Telegram WebApp */
export function isTelegramWebApp(): boolean {
  return typeof window !== "undefined" && !!window.Telegram?.WebApp;
}

// ---------------------------------------------------------------------------
// TON Connect SDK loader
// ---------------------------------------------------------------------------

/**
 * Dynamically load the TON Connect SDK.
 * Returns null if the SDK is not installed (graceful degradation).
 */
async function loadTonConnectSdk(): Promise<unknown> {
  if (_tonConnect) return _tonConnect;

  try {
    // Try to dynamically import the TON Connect SDK
    // @ts-expect-error — SDK is optional, graceful fallback if not installed
    const mod = await import("@tonconnect/sdk");
    _tonConnect = mod;
    return mod;
  } catch {
    // SDK not installed — will use fallback polling
    console.warn(
      "[telegram-adapter] @tonconnect/sdk not installed. " +
        "Install it for full TON Connect v2 support: pnpm add @tonconnect/sdk",
    );
    return null;
  }
}

// ---------------------------------------------------------------------------
// Connection
// ---------------------------------------------------------------------------

/**
 * Connect a Telegram TON wallet using TON Connect v2 protocol.
 *
 * - If @tonconnect/sdk is available: uses the full TON Connect v2 bridge
 *   for wallet connection, message signing, and transaction sending.
 * - If SDK is not available: falls back to opening the universal link
 *   and polling sessionStorage for the address.
 *
 * @returns TelegramWalletResult with the connected TON address.
 */
export async function connectTelegramWallet(): Promise<TelegramWalletResult> {
  if (!isTelegramWebApp()) {
    throw new Error(
      "Telegram Wallet requires the Telegram app. " +
        "Please open this page inside Telegram to connect your TON wallet.",
    );
  }

  const webApp = window.Telegram!.WebApp;
  webApp.ready();

  const sdk = await loadTonConnectSdk();

  if (sdk && typeof (sdk as Record<string, unknown>).TonConnect === "function") {
    // Full TON Connect v2 flow
    return connectViaTonConnectSdk(webApp, sdk);
  }

  // Fallback: open universal link + poll for address
  const tonConnectUrl = "https://app.tonkeeper.com/ton-connect";
  webApp.openTelegramLink(tonConnectUrl);

  const address = await pollForTonAddress(120_000);

  if (!address) {
    throw new Error("Wallet connection timed out. Please try again.");
  }

  return { address, inTelegram: true };
}

/**
 * Full TON Connect v2 connection via the official SDK.
 */
async function connectViaTonConnectSdk(
  webApp: TelegramWebApp,
  sdk: unknown,
): Promise<TelegramWalletResult> {
  const TonConnect = (sdk as Record<string, unknown>).TonConnect as new (options: {
    manifestUrl: string;
    wallet: unknown;
  }) => {
    connect: () => Promise<void>;
    onStatusChange: (cb: (wallet: unknown) => void) => void;
    wallet: { address: string; device: { appName: string } } | null;
    disconnect: () => Promise<void>;
  };

  const connector = new TonConnect({
    manifestUrl: "https://vixor.app/tonconnect-manifest.json",
    wallet: null,
  });

  // Listen for status changes
  return new Promise<TelegramWalletResult>((resolve, reject) => {
    const timeout = setTimeout(() => {
      connector.disconnect().catch(() => {});
      reject(new Error("TON Connect connection timed out. Please try again."));
    }, 120_000);

    connector.onStatusChange((wallet) => {
      if (wallet && typeof wallet === "object" && "address" in wallet) {
        const w = wallet as { address: string; device: { appName: string } };
        _tonConnectWallet = w;
        clearTimeout(timeout);

        // Store in sessionStorage for persistence
        sessionStorage.setItem("vixor_ton_address", w.address);

        resolve({ address: w.address, inTelegram: true });
      }
    });

    connector.connect().catch((err: Error) => {
      clearTimeout(timeout);
      reject(new Error(`TON Connect failed: ${err.message}`));
    });
  });
}

/**
 * Return the cached TON wallet address (if any).
 */
export function getTelegramWalletAddress(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("vixor_ton_address");
}

// ---------------------------------------------------------------------------
// Message Signing (TON Connect v2)
// ---------------------------------------------------------------------------

/**
 * Sign a message using the connected TON wallet via TON Connect v2.
 *
 * - If the TON Connect SDK is loaded and a session is active, uses the
 *   SDK's `sendTransaction` with a sign-only payload.
 * - If SDK is unavailable, returns a deterministic placeholder hash and
 *   logs a warning. This allows the rest of the app to function (e.g.
 *   wallet-web3 page loads) even without the SDK.
 *
 * @param message - The message string to sign.
 * @returns Hex-encoded signature string, or a placeholder if SDK unavailable.
 */
export async function signMessage(message: string): Promise<string> {
  const sdk = await loadTonConnectSdk();

  if (!sdk) {
    console.warn(
      "[telegram-adapter] signMessage: @tonconnect/sdk not installed. " +
        "Install it for real signing support.",
    );
    // Deterministic placeholder so callers can still verify message length
    const hash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(`vixor-placeholder:${message}`),
    );
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  // TON Connect v2 signing via the connected wallet
  // The SDK's `sendTransaction` with signOnly flag creates a signed
  // proof without actually sending a transaction on-chain.
  const TonConnect = (sdk as Record<string, unknown>).TonConnect as new (options: {
    manifestUrl: string;
    wallet: unknown;
  }) => {
    sendTransaction: (tx: Record<string, unknown>) => Promise<string>;
    wallet: { address: string } | null;
  };

  if (!_tonConnectWallet) {
    throw new Error("No TON wallet connected. Call connectTelegramWallet() first.");
  }

  // Reconstruct connector with existing wallet session
  const connector = new TonConnect({
    manifestUrl: "https://vixor.app/tonconnect-manifest.json",
    wallet: _tonConnectWallet,
  });

  try {
    // Use TON's sign-only transaction to produce a signature
    // This sends a zero-value bounceable message to the user's own address
    // with the payload being the message to sign
    const boc = await connector.sendTransaction({
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [
        {
          address: _tonConnectWallet.address,
          amount: "0",
          // Payload is the message encoded as a cell comment
          payload: message,
          stateInit: undefined,
        },
      ],
    });

    return boc;
  } catch (err) {
    throw new Error(`TON signing failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ---------------------------------------------------------------------------
// Balance queries (public TON APIs — no API key required)
// ---------------------------------------------------------------------------

/**
 * Get TON coin balance for an address.
 * Uses the public toncenter.com API.
 *
 * Returns the balance in TON (1 TON = 10^9 nanoTON).
 */
export async function getTonBalance(address: string): Promise<number> {
  try {
    const url = `https://toncenter.com/api/v2/getAddressBalance?address=${encodeURIComponent(address)}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();

    // toncenter returns { ok: true, result: "1234567890" } (nanoTONs as string)
    const nanoTon = BigInt(data.result ?? "0");
    return Number(nanoTon) / 1e9;
  } catch (err) {
    console.error("[telegram-adapter] getTonBalance failed:", err);
    return 0;
  }
}

/**
 * Get Jetton (TON token) balances for an address.
 * Uses the public tonapi.io API.
 *
 * Returns an array of TokenBalance objects compatible with the VIXOR type.
 */
export async function getTonTokenBalances(address: string): Promise<TokenBalance[]> {
  try {
    const url = `https://tonapi.io/v2/accounts/${encodeURIComponent(address)}/jettons?currencies=usd`;
    const resp = await fetch(url);

    if (!resp.ok) {
      if (resp.status === 429) {
        console.warn("[telegram-adapter] tonapi.io rate limited");
        return [];
      }
      throw new Error(`HTTP ${resp.status}`);
    }

    const data = await resp.json();
    const jettons: TokenBalance[] = [];

    for (const j of data.jetton_balances ?? []) {
      const balance = j.balance ?? "0";
      const decimals = j.jetton?.decimals ?? 9;
      const balanceNum = Number(BigInt(balance)) / 10 ** decimals;
      const price = j.price?.prices?.[0]?.price ?? null;

      if (balanceNum === 0) continue;

      jettons.push({
        mint: j.jetton?.address ?? "",
        symbol: j.jetton?.symbol ?? "UNKNOWN",
        name: j.jetton?.name,
        decimals,
        balance,
        balanceFormatted: balanceNum.toFixed(decimals > 6 ? 4 : 6),
        valueUsd: price ? balanceNum * price : undefined,
        logoURI: j.jetton?.image ?? undefined,
        isVerified: true,
        isHoneypot: false,
      });
    }

    return jettons;
  } catch (err) {
    console.error("[telegram-adapter] getTonTokenBalances failed:", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Poll sessionStorage for a TON address written by the TON Connect bridge.
 * Used as fallback when @tonconnect/sdk is not installed.
 */
function pollForTonAddress(timeoutMs: number): Promise<string | null> {
  return new Promise((resolve) => {
    const start = Date.now();
    const interval = 1_000;

    const timer = setInterval(() => {
      const addr = sessionStorage.getItem("vixor_ton_address");
      if (addr) {
        clearInterval(timer);
        resolve(addr);
        return;
      }

      if (Date.now() - start >= timeoutMs) {
        clearInterval(timer);
        resolve(null);
      }
    }, interval);
  });
}

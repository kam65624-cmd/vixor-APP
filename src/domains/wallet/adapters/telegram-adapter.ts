// ============================================================================
// VIXOR Telegram Wallet Adapter — TON Blockchain
// ============================================================================
//
// Detects Telegram WebApp context, provides connection helpers and
// balance-fetching for TON addresses via public APIs.
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
// Detection
// ---------------------------------------------------------------------------

/** Check if the app is running inside a Telegram WebApp */
export function isTelegramWebApp(): boolean {
  return typeof window !== "undefined" && !!window.Telegram?.WebApp;
}

// ---------------------------------------------------------------------------
// Connection
// ---------------------------------------------------------------------------

/**
 * Connect a Telegram TON wallet.
 *
 * - If inside Telegram WebApp: opens the TON wallet link via `openTelegramLink`.
 *   In a real integration this would use `ton-connect` SDK to get the address
 *   back via a bridge. Here we provide the flow structure; the address is
 *   stored in `sessionStorage` after the user completes the connection.
 * - If outside Telegram: throws an error directing the user to open the app in Telegram.
 */
export async function connectTelegramWallet(): Promise<TelegramWalletResult> {
  if (!isTelegramWebApp()) {
    throw new Error(
      "Telegram Wallet requires the Telegram app. " +
      "Please open this page inside Telegram to connect your TON wallet."
    );
  }

  const webApp = window.Telegram!.WebApp;
  webApp.ready();

  // In a production integration you would use @tonconnect/sdk here to:
  //   1. Generate a connect request
  //   2. Open the universal TON Connect link
  //   3. Listen for the wallet response via the bridge
  //
  // For now we open the TON Connect universal link so the user can
  // connect their wallet and return the address via sessionStorage.
  const tonConnectUrl =
    "https://app.tonkeeper.com/ton-connect";

  webApp.openTelegramLink(tonConnectUrl);

  // The address will be populated by the TON Connect bridge callback
  // after the user approves the connection in their TON wallet.
  // We poll sessionStorage briefly (max 120 s) for the result.
  const address = await pollForTonAddress(120_000);

  if (!address) {
    throw new Error("Wallet connection timed out. Please try again.");
  }

  return { address, inTelegram: true };
}

/**
 * Return the cached TON wallet address (if any).
 * After a successful TON Connect flow the address is stored in sessionStorage.
 */
export function getTelegramWalletAddress(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("vixor_ton_address");
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
      // tonapi may rate-limit; return empty gracefully
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

      // Skip dust balances
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
 * This is a simplified placeholder for the actual @tonconnect/sdk bridge.
 */
function pollForTonAddress(timeoutMs: number): Promise<string | null> {
  return new Promise((resolve) => {
    const start = Date.now();
    const interval = 1_000; // check every second

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
// ============================================================================
// Trading Gateway — Server Functions
// ============================================================================
//
// Real order execution and exchange status checking.
//
// Credentials are stored encrypted in `user_settings.exchange_credentials`
// as JSON: { "binance": { "encrypted": "<base64url-token>" }, ... }
//
// The encrypted token contains { apiKey, apiSecret, ... } and is decrypted
// server-side using the shared AES-256-GCM scheme from @/shared/crypto.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";
import { encryptCredential, decryptCredential, maskApiKey } from "@/shared/crypto/credential-crypto";
import { AgentGateway } from "./agent-gateway";
import { createBinanceAdapter } from "./adapters/binance-adapter";
import { createBybitAdapter } from "./adapters/bybit-adapter";
import { createOkxAdapter } from "./adapters/okx-adapter";
import { createDummyAdapter } from "./adapters/dummy-adapter";
import type { OrderResult } from "./types";

// ── Types ──

export interface ExchangeStatus {
  connected: boolean;
  exchangeId: string;
  exchangeName: string;
  maskedKey: string | null;
}

export interface ExecuteTradeResult {
  success: boolean;
  tradeId?: string;
  orderResult?: OrderResult;
  error?: string;
  isPaperTrade: boolean;
}

// ── Helpers ──

/** Shape of the exchange_credentials JSON stored in user_settings. */
interface ExchangeCredentialsBlob {
  [exchangeId: string]: { encrypted: string } | null;
}

/** Create the right adapter from an exchange id. */
function createAdapterById(exchangeId: string) {
  switch (exchangeId) {
    case "binance":
      return createBinanceAdapter();
    case "bybit":
      return createBybitAdapter();
    case "okx":
      return createOkxAdapter();
    default:
      return createDummyAdapter();
  }
}

/** Human-readable exchange names. */
const EXCHANGE_NAMES: Record<string, string> = {
  binance: "Binance",
  bybit: "Bybit",
  okx: "OKX",
  dummy: "Dummy (Paper)",
};

// ---------- GET EXCHANGE STATUS ----------

export const getExchangeStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: settings, error } = await supabase
      .from("user_settings")
      .select("exchange_credentials")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw new Error(error.message);

    const blob = (settings?.exchange_credentials ?? {}) as ExchangeCredentialsBlob;

    // Find the first configured exchange
    for (const [id, entry] of Object.entries(blob)) {
      if (entry?.encrypted) {
        try {
          const creds = decryptCredential(entry.encrypted);
          const maskedKey = creds.apiKey || creds.api_key ? maskApiKey(creds.apiKey || creds.api_key) : null;
          return {
            connected: true,
            exchangeId: id,
            exchangeName: EXCHANGE_NAMES[id] ?? id,
            maskedKey,
          } satisfies ExchangeStatus;
        } catch {
          // Decryption failed — credentials are invalid or corrupt
          continue;
        }
      }
    }

    return {
      connected: false,
      exchangeId: "",
      exchangeName: "",
      maskedKey: null,
    } satisfies ExchangeStatus;
  });

// ---------- EXECUTE TRADE ----------

export const executeTrade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        exchangeId: z.string().optional().default(""),
        symbol: z.string().min(1),
        side: z.enum(["buy", "sell"]),
        quantity: z.number().positive(),
        price: z.number().positive().optional(),
        orderType: z.enum(["market", "limit", "stop_loss", "take_profit"]).default("market"),
        stopLoss: z.number().positive().optional().nullable(),
        takeProfit: z.number().positive().optional().nullable(),
        pair: z.string().min(1),
        direction: z.enum(["long", "short"]),
        notes: z.string().optional().nullable(),
        strategy: z.string().optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // ── 1. Resolve exchange credentials ──
    const { data: settings, error: settingsError } = await supabase
      .from("user_settings")
      .select("exchange_credentials")
      .eq("user_id", userId)
      .maybeSingle();

    if (settingsError) throw new Error(settingsError.message);

    const blob = (settings?.exchange_credentials ?? {}) as ExchangeCredentialsBlob;
    const targetExchange = data.exchangeId || Object.keys(blob).find((id) => blob[id]?.encrypted);
    const isPaperTrade = !targetExchange || !blob[targetExchange]?.encrypted;

    let orderResult: OrderResult;
    let exchangeName: string;

    if (isPaperTrade) {
      // ── Paper trade: use DummyAdapter ──
      const dummyAdapter = createDummyAdapter();
      await dummyAdapter.connect({});
      const gateway = new AgentGateway([dummyAdapter], {
        primaryExchange: "dummy",
        dryRun: false,
        maxSlippageBps: 50,
      });
      orderResult = await gateway.placeOrder({
        symbol: data.symbol,
        side: data.side,
        type: data.orderType,
        quantity: data.quantity,
        price: data.price,
        stopLoss: data.stopLoss ?? undefined,
        takeProfit: data.takeProfit ?? undefined,
        clientOrderId: `paper-${Date.now()}`,
      });
      exchangeName = "Paper Trade";
    } else {
      // ── Real trade: decrypt credentials and use the real adapter ──
      const credEntry = blob[targetExchange!]?.encrypted;
      if (!credEntry) {
        throw new Error(`No credentials found for exchange: ${targetExchange}`);
      }

      const credentials = decryptCredential(credEntry);
      const adapter = createAdapterById(targetExchange!);

      // Connect
      await adapter.connect(credentials);

      const gateway = new AgentGateway([adapter], {
        primaryExchange: targetExchange!,
        dryRun: false,
        maxSlippageBps: 50,
      });

      orderResult = await gateway.placeOrder({
        symbol: data.symbol,
        side: data.side,
        type: data.orderType,
        quantity: data.quantity,
        price: data.price,
        stopLoss: data.stopLoss ?? undefined,
        takeProfit: data.takeProfit ?? undefined,
        clientOrderId: `${targetExchange}-${Date.now()}`,
      });
      exchangeName = EXCHANGE_NAMES[targetExchange!] ?? targetExchange!;

      // Disconnect
      try { await adapter.disconnect(); } catch { /* best-effort */ }
    }

    // ── 2. Save to trades table as journal entry ──
    const executionNotes = [
      data.notes ?? "",
      isPaperTrade ? "[Paper Trade]" : `[${exchangeName}] Order #${orderResult.id}`,
      `Filled @ ${orderResult.price}`,
      orderResult.fee ? `Fee: ${orderResult.fee}` : "",
      `Status: ${orderResult.status}`,
    ]
      .filter(Boolean)
      .join(" · ");

    const { data: trade, error: tradeError } = await supabase
      .from("trades")
      .insert({
        user_id: userId,
        pair: data.pair,
        direction: data.direction,
        entry_price: orderResult.price || data.price || 0,
        quantity: data.quantity,
        stop_loss: data.stopLoss ?? null,
        take_profit: data.takeProfit ?? null,
        notes: executionNotes,
        strategy: data.strategy ?? "Trade Desk",
        status: "open",
      })
      .select("id")
      .single();

    if (tradeError) {
      console.error("[executeTrade] Failed to save trade journal:", tradeError.message);
      // Don't throw — the order was placed, but the journal save failed
    }

    return {
      success: orderResult.status === "filled" || orderResult.status === "pending",
      tradeId: trade?.id,
      orderResult,
      isPaperTrade,
    } satisfies ExecuteTradeResult;
  });

// ── Exchange Credential Management (Settings UI) ────────────────────────────

export interface ExchangeCredentialInput {
  exchangeId: string;
  apiKey: string;
  apiSecret: string;
  passphrase?: string;
  label?: string;
  isTestnet?: boolean;
}

export interface ExchangeCredentialView {
  exchangeId: string;
  label: string | null;
  isTestnet: boolean;
  isConnected: boolean;
  maskedKey: string;
  lastConnectedAt: string | null;
}

export interface TestConnectionResult {
  success: boolean;
  balance?: number;
  error?: string;
}

export const EXCHANGES = [
  { id: "binance", name: "Binance", fields: ["apiKey", "apiSecret"] as const, icon: "🟡" },
  { id: "bybit", name: "Bybit", fields: ["apiKey", "apiSecret"] as const, icon: "🟠" },
  { id: "okx", name: "OKX", fields: ["apiKey", "apiSecret", "passphrase"] as const, icon: "⬛" },
] as const;

export type ExchangeId = (typeof EXCHANGES)[number]["id"];

/** Extended stored shape (includes label, testnet flag, lastConnectedAt). */
interface StoredExchangeEntry {
  encrypted: string;
  label: string | null;
  isTestnet: boolean;
  lastConnectedAt: string | null;
}

/**
 * Ensure the user_settings row exists, return current exchange_credentials.
 */
async function ensureAndGetCredentials(
  supabase: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  userId: string,
): Promise<Record<string, StoredExchangeEntry>> {
  const { data: row } = await supabase
    .from("user_settings")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!row) {
    const { data: created } = await supabase
      .from("user_settings")
      .insert({ user_id: userId, exchange_credentials: {} })
      .select("exchange_credentials")
      .single();
    return (created?.exchange_credentials as Record<string, StoredExchangeEntry>) ?? {};
  }

  const { data: current } = await supabase
    .from("user_settings")
    .select("exchange_credentials")
    .eq("user_id", userId)
    .single();

  return (current?.exchange_credentials as Record<string, StoredExchangeEntry>) ?? {};
}

async function persistCredentials(
  supabase: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  userId: string,
  creds: Record<string, StoredExchangeEntry>,
): Promise<void> {
  await supabase
    .from("user_settings")
    .update({ exchange_credentials: creds, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
}

// ---------- SAVE EXCHANGE CREDENTIALS ----------

export const saveExchangeCredentials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (d: unknown) =>
      z
        .object({
          exchangeId: z.string().min(1),
          apiKey: z.string().min(1),
          apiSecret: z.string().min(1),
          passphrase: z.string().optional(),
          label: z.string().optional(),
          isTestnet: z.boolean().optional().default(false),
        })
        .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { exchangeId, apiKey, apiSecret, passphrase, label, isTestnet } = data;

    const validExchange = EXCHANGES.find((e) => e.id === exchangeId);
    if (!validExchange) throw new Error(`Unknown exchange: ${exchangeId}`);

    const toEncrypt: Record<string, string> = { apiKey, apiSecret };
    if (passphrase) toEncrypt.passphrase = passphrase;
    const encrypted = encryptCredential(toEncrypt);

    const allCreds = await ensureAndGetCredentials(supabase, userId);
    allCreds[exchangeId] = {
      encrypted,
      label: label ?? null,
      isTestnet: isTestnet ?? false,
      lastConnectedAt: null,
    };
    await persistCredentials(supabase, userId, allCreds);

    return { success: true };
  });

// ---------- GET EXCHANGE CREDENTIALS (MASKED) ----------

export const getExchangeCredentials = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: row } = await supabase
      .from("user_settings")
      .select("exchange_credentials")
      .eq("user_id", userId)
      .maybeSingle();

    const raw = ((row?.exchange_credentials ?? {}) as unknown) as Record<string, StoredExchangeEntry>;

    const views: ExchangeCredentialView[] = EXCHANGES.map((ex) => {
      const entry = raw[ex.id];
      if (!entry) {
        return {
          exchangeId: ex.id,
          label: null,
          isTestnet: false,
          isConnected: false,
          maskedKey: "",
          lastConnectedAt: null,
        };
      }

      let maskedKey = "***";
      try {
        const decrypted = decryptCredential<{ apiKey: string }>(entry.encrypted);
        maskedKey = maskApiKey(decrypted.apiKey);
      } catch {
        // decryption failed
      }

      return {
        exchangeId: ex.id,
        label: entry.label,
        isTestnet: entry.isTestnet,
        isConnected: true,
        maskedKey,
        lastConnectedAt: entry.lastConnectedAt,
      };
    });

    return { exchanges: views };
  });

// ---------- TEST EXCHANGE CONNECTION ----------

export const testExchangeConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ exchangeId: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { exchangeId } = data;

    const { data: row } = await supabase
      .from("user_settings")
      .select("exchange_credentials")
      .eq("user_id", userId)
      .maybeSingle();

    const raw = ((row?.exchange_credentials ?? {}) as unknown) as Record<string, StoredExchangeEntry>;
    const entry = raw[exchangeId];
    if (!entry) {
      return { success: false, error: "No credentials found for this exchange" } satisfies TestConnectionResult;
    }

    let credentials: Record<string, string>;
    try {
      credentials = decryptCredential(entry.encrypted);
    } catch {
      return { success: false, error: "Failed to decrypt credentials" } satisfies TestConnectionResult;
    }

    credentials.testnet = String(entry.isTestnet);

    let balance = 0;
    try {
      const adapter = createAdapterById(exchangeId);
      await adapter.connect(credentials);
      const acct = await adapter.getBalance();
      balance = acct.totalBalance;
      try { await adapter.disconnect(); } catch { /* best-effort */ }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg } satisfies TestConnectionResult;
    }

    // Update lastConnectedAt
    const allCreds = await ensureAndGetCredentials(supabase, userId);
    if (allCreds[exchangeId]) {
      allCreds[exchangeId].lastConnectedAt = new Date().toISOString();
      await persistCredentials(supabase, userId, allCreds);
    }

    return { success: true, balance } satisfies TestConnectionResult;
  });

// ---------- DELETE EXCHANGE CREDENTIALS ----------

export const deleteExchangeCredentials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ exchangeId: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { exchangeId } = data;

    const allCreds = await ensureAndGetCredentials(supabase, userId);
    if (!allCreds[exchangeId]) return { success: true };

    delete allCreds[exchangeId];
    await persistCredentials(supabase, userId, allCreds);

    return { success: true };
  });
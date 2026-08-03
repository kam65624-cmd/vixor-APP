// ============================================================================
// VIXOR Wallet — WalletConnect v2 Adapter
// ============================================================================
//
// WalletConnect v2 enables mobile wallet scanning (QR code) and supports
// multi-chain connections (EVM + Solana).
//
// Implementation uses the WalletConnect Web3Wallet / SignClient protocol.
// The adapter is client-side only and manages session lifecycle.
//
// Required env: NEXT_PUBLIC_WC_PROJECT_ID (from https://cloud.walletconnect.com)
// ============================================================================

// ── Types ────────────────────────────────────────────────────────────────

export interface WalletConnectSession {
  address: string;
  chain: string;
  topic: string;
}

export interface WalletConnectAdapter {
  isAvailable(): boolean;
  connect(): Promise<WalletConnectSession>;
  disconnect(topic: string): Promise<void>;
  getUri(): string | null;
  onSessionUpdate(cb: (session: WalletConnectSession) => void): () => void;
}

// ── Project Config ───────────────────────────────────────────────────────

const PROJECT_ID =
  typeof process !== "undefined" && process.env?.NEXT_PUBLIC_WC_PROJECT_ID
    ? process.env.NEXT_PUBLIC_WC_PROJECT_ID
    : "";

const RELAY_URL = "wss://relay.walletconnect.com";

const REQUIRED_NAMESPACES = {
  eip155: {
    methods: ["eth_sendTransaction", "personal_sign", "eth_signTransaction"],
    chains: ["eip155:1", "eip155:56", "eip155:137", "eip155:42161", "eip155:43114"],
    events: ["chainChanged", "accountsChanged"],
  },
  solana: {
    methods: ["solana_signMessage", "solana_signTransaction"],
    chains: ["solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"],
    events: ["accountsChanged", "chainChanged"],
  },
};

// ── Singleton state ───────────────────────────────────────────────────────

let _client: unknown = null;
let _pendingUri: string | null = null;
let _sessionCallbacks: Array<(session: WalletConnectSession) => void> = [];

// ── Adapter ───────────────────────────────────────────────────────────────

/**
 * Create the WalletConnect v2 adapter.
 *
 * Uses dynamic imports so the heavy WC packages are only loaded when
 * the user actually tries to connect (tree-shakeable).
 */
export function createWalletConnectAdapter(): WalletConnectAdapter {
  return {
    isAvailable: isWalletConnectAvailable,
    connect: connectWalletConnect as () => Promise<WalletConnectSession>,
    disconnect: disconnectWalletConnect,
    getUri: () => _pendingUri,
    onSessionUpdate,
  };
}

// ── Availability check ────────────────────────────────────────────────────

/**
 * Check if WalletConnect v2 is available.
 *
 * Returns true if:
 *  1. We're in a browser environment
 *  2. A WC project ID is configured
 */
export function isWalletConnectAvailable(): boolean {
  if (typeof window === "undefined") return false;
  return PROJECT_ID.length > 0;
}

/**
 * Get the WalletConnect pairing URI (shown as a QR code in the UI).
 *
 * @returns The URI string, or `null` if no session is being proposed.
 */
export function getWalletConnectUri(): string | null {
  return _pendingUri;
}

// ── Connect ───────────────────────────────────────────────────────────────

/**
 * Initiate a WalletConnect v2 session.
 *
 * Dynamically imports the WC SignClient, creates a pairing, and returns
 * the session once the user approves in their mobile wallet.
 *
 * @returns A WalletConnectSession with address, chain, and topic.
 */
export async function connectWalletConnect(): Promise<{ address: string; chain: string }> {
  if (!isWalletConnectAvailable()) {
    throw new Error(
      "WalletConnect v2 requires NEXT_PUBLIC_WC_PROJECT_ID. " +
        "Get one at https://cloud.walletconnect.com and set it in your environment.",
    );
  }

  try {
    // Dynamic import — keeps WC out of the main bundle
    const { SignClient } = await import("@walletconnect/sign-client");

    if (!_client) {
      _client = await SignClient.init({
        projectId: PROJECT_ID,
        relayUrl: RELAY_URL,
        metadata: {
          name: "VIXOR",
          description: "AI-Powered Solana Meme Coin Trading Terminal",
          url: "https://vixor.app",
          icons: ["https://vixor.app/icon.png"],
        },
      });
    }

    const client = _client as {
      connect: (
        opts: Record<string, unknown>,
      ) => Promise<{ uri: string; approval: () => Promise<unknown> }>;
      session: {
        get: (
          topic: string,
        ) => { topic: string; namespaces: Record<string, { accounts: string[] }> } | undefined;
      };
      disconnect: (opts: { topic: string }) => Promise<void>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
    };

    // Propose connection
    const { uri, approval } = await client.connect({
      requiredNamespaces: REQUIRED_NAMESPACES,
    });

    _pendingUri = uri ?? null;

    // Wait for user approval in their wallet
    const session = (await approval()) as {
      topic: string;
      namespaces: Record<string, { accounts: string[] }>;
    };

    _pendingUri = null;

    // Extract first account (chain:address format)
    const firstAccount =
      session.namespaces?.eip155?.accounts?.[0] ?? session.namespaces?.solana?.accounts?.[0] ?? "";

    const colonIdx = firstAccount.indexOf(":");
    const address = colonIdx >= 0 ? firstAccount.slice(colonIdx + 1) : firstAccount;
    const chain = colonIdx >= 0 ? firstAccount.slice(0, colonIdx) : "eip155:1";

    // Notify listeners
    const wcSession: WalletConnectSession = { address, chain, topic: session.topic };
    for (const cb of _sessionCallbacks) {
      try {
        cb(wcSession);
      } catch {
        /* swallow listener errors */
      }
    }

    return { address, chain };
  } catch (err) {
    _pendingUri = null;
    if (err instanceof Error && err.message.includes("NEXT_PUBLIC_WC_PROJECT_ID")) {
      throw err;
    }
    throw new Error(
      `WalletConnect connection failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

// ── Disconnect ────────────────────────────────────────────────────────────

/**
 * Disconnect an active WalletConnect session.
 */
export async function disconnectWalletConnect(topic: string): Promise<void> {
  if (!_client) return;

  try {
    const { SignClient } = await import("@walletconnect/sign-client");
    // If we have the client, use it directly
    const client = _client as { disconnect: (opts: { topic: string }) => Promise<void> };
    await client.disconnect({ topic });
  } catch {
    // Silent fail — the session will expire on its own
  }
}

// ── Event listeners ───────────────────────────────────────────────────────

/**
 * Subscribe to session updates (new connections, account/chain changes).
 * Returns an unsubscribe function.
 */
function onSessionUpdate(cb: (session: WalletConnectSession) => void): () => void {
  _sessionCallbacks.push(cb);
  return () => {
    _sessionCallbacks = _sessionCallbacks.filter((fn) => fn !== cb);
  };
}

// ── Adapter factory export ────────────────────────────────────────────────

export const walletConnectAdapter: WalletConnectAdapter = createWalletConnectAdapter();

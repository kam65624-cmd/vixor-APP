"use client";

// ============================================================================
// VIXOR Wallet Context — React Context for Wallet State
// ============================================================================
//
// Provides wallet connection state to the entire app.
// Non-custodial: only stores public address + chain + session token.
// No private keys are ever stored in state or localStorage.
//
// Usage:
//   <WalletProvider>
//     <AppShell>...</AppShell>
//   </WalletProvider>
//
// In any component:
//   const { wallet, connect, disconnect } = useWallet();
// ============================================================================

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import type { WalletChain, WalletInfo, WalletSession } from "@/domains/wallet/types";
import {
  generateChallengeMessage,
  generateNonce,
  isValidWalletAddress,
} from "@/domains/wallet/config";

// ── Context Types ──

interface WalletContextValue {
  /** Current wallet info (null if disconnected) */
  wallet: WalletInfo | null;
  /** Active sessions from Supabase */
  sessions: WalletSession[];
  /** Whether wallet operations are in progress */
  loading: boolean;
  /** Last error message */
  error: string | null;

  /** Connect a wallet via challenge-response */
  connect: (params: {
    chain: WalletChain;
    getAddress: () => Promise<string>;
    signMessage: (message: string) => Promise<string>;
  }) => Promise<void>;

  /** Disconnect current wallet */
  disconnect: () => Promise<void>;

  /** Clear error */
  clearError: () => void;
}

const WalletContext = createContext<WalletContextValue | null>(null);

// ── Provider Component ──

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [sessions, setSessions] = useState<WalletSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(false);

  // ── Restore wallet state from localStorage on mount ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (mountedRef.current) return;
    mountedRef.current = true;

    try {
      const saved = localStorage.getItem("vixor-wallet");
      if (saved) {
        const parsed = JSON.parse(saved) as WalletInfo;
        if (parsed && parsed.address && parsed.chain && parsed.status === "connected") {
          setWallet(parsed);
        }
      }
    } catch {
      // Ignore parse errors — start disconnected
      localStorage.removeItem("vixor-wallet");
    }
  }, []);

  // ── Clear expired sessions periodically ──
  useEffect(() => {
    if (!sessions.length) return;
    const interval = setInterval(() => {
      const now = new Date();
      setSessions((prev) => prev.filter((s) => new Date(s.expires_at) > now && s.is_active));
    }, 60_000); // Check every minute
    return () => clearInterval(interval);
  }, [sessions.length]);

  // ── Connect wallet ──
  const connect = useCallback(
    async (params: {
      chain: WalletChain;
      getAddress: () => Promise<string>;
      signMessage: (message: string) => Promise<string>;
    }) => {
      const { chain, getAddress, signMessage } = params;
      setLoading(true);
      setError(null);

      try {
        // Step 1: Get wallet address
        const address = await getAddress();
        if (!isValidWalletAddress(address, chain)) {
          throw new Error(`Invalid ${chain} wallet address`);
        }

        // Step 2: Generate challenge
        const nonce = generateNonce();
        const message = generateChallengeMessage(nonce);

        // Step 3: Request challenge from server (stores nonce in Redis)
        const challengeRes = await fetch("/api/wallet/connect", {
          method: "GET",
        });
        if (!challengeRes.ok) {
          throw new Error("Failed to get challenge from server");
        }
        // We use the server nonce for consistency
        const challengeData = await challengeRes.json();
        const serverNonce = challengeData.nonce;
        const serverMessage = challengeData.message;

        // Step 4: Sign the challenge message with the wallet
        setWallet((prev) =>
          prev
            ? { ...prev, status: "connecting" }
            : {
                address,
                chain,
                status: "connecting",
                connectedAt: Date.now(),
              },
        );

        const signature = await signMessage(serverMessage);

        // Step 5: Send to server for verification
        const connectRes = await fetch("/api/wallet/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address,
            chain,
            signature,
            message: serverMessage,
            nonce: serverNonce,
          }),
        });

        const connectData = await connectRes.json();
        if (!connectRes.ok || !connectData.success) {
          throw new Error(connectData.statusMessage || "Wallet verification failed");
        }

        // Step 6: Success — update state
        const walletInfo: WalletInfo = {
          address,
          chain,
          status: "connected",
          connectedAt: Date.now(),
        };

        setWallet(walletInfo);
        setSessions((prev) => [connectData.session, ...prev]);

        // Persist to localStorage (no private keys!)
        localStorage.setItem("vixor-wallet", JSON.stringify(walletInfo));
        localStorage.setItem(`vixor-wallet-token-${chain}`, connectData.token);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Wallet connection failed";
        setError(message);
        setWallet(null);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // ── Disconnect wallet ──
  const disconnect = useCallback(async () => {
    if (!wallet) return;
    setLoading(true);

    try {
      // Call server to deactivate session
      await fetch("/api/wallet/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "current", // Server handles deactivation of latest session
        }),
      }).catch(() => {
        // Ignore server errors — still clear local state
      });

      setWallet(null);
      setSessions([]);
      localStorage.removeItem("vixor-wallet");
      if (wallet) {
        localStorage.removeItem(`vixor-wallet-token-${wallet.chain}`);
      }
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  // ── Clear error ──
  const clearError = useCallback(() => setError(null), []);

  return (
    <WalletContext.Provider
      value={{ wallet, sessions, loading, error, connect, disconnect, clearError }}
    >
      {children}
    </WalletContext.Provider>
  );
}

// ── Hook ──

/**
 * Access wallet state and operations from any component.
 *
 * @example
 * ```tsx
 * const { wallet, connect, disconnect, loading, error } = useWallet();
 *
 * if (wallet) {
 *   console.log("Connected:", wallet.address, wallet.chain);
 * } else {
 *   <button onClick={() => connect(...)}>Connect Wallet</button>
 * }
 * ```
 */
export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet must be used within a <WalletProvider>");
  }
  return ctx;
}

// ── Export context for direct access (e.g., in non-hook contexts) ──
export { WalletContext };

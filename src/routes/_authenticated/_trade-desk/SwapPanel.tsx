import { useMemo, useState, useCallback } from "react";
import { ArrowDownUp, Loader2, ShieldAlert, Wallet2, CheckCircle2, XCircle } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { useWallet } from "@/domains/wallet/adapter/WalletProvider";
import { EVM_CHAINS } from "@/domains/wallet/types";
import type { EvmChainId } from "@/domains/wallet/types";
import {
  getPopularSwapTokens,
  getJupiterSwapQuote,
  getJupiterSwapTransaction,
  get1inchSwapQuote,
  get1inchSwapTransaction,
  getEvmSwapTokens,
  saveUserTrade,
} from "@/domains/trade/functions";
import { signAndSendSolanaTransaction } from "@/domains/wallet/adapters/phantom-adapter";
import {
  getCurrentEvmChainId,
  sendEvmTransaction,
} from "@/domains/wallet/adapters/metamask-adapter";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { useSound } from "@/shared/hooks/use-sound";
import { assertLegacyExecutionEnabled } from "@/shared/security/legacy-execution";
import { card, mono, labelStyle, inputStyle } from "./constants";

const EVM_CHAIN_ID_TO_NUMBER: Record<EvmChainId, number> = {
  "0x1": 1,
  "0x89": 137,
  "0xa86a": 43114,
};

type SwapResult = { success: true; txId: string } | { success: false; error: string };

export function SwapPanel() {
  const { wallet } = useWallet();
  const { play } = useSound();
  const isConnected = !!wallet;
  const chain = wallet?.chain;

  const stableSolTokens = useStableServerFn(getPopularSwapTokens);
  const stableEvmTokens = useStableServerFn(getEvmSwapTokens);
  const stableJupiterQuote = useStableServerFn(getJupiterSwapQuote);
  const stableJupiterTx = useStableServerFn(getJupiterSwapTransaction);
  const stable1inchQuote = useStableServerFn(get1inchSwapQuote);
  const stable1inchTx = useStableServerFn(get1inchSwapTransaction);
  const stableSaveTrade = useStableServerFn(saveUserTrade);

  const { data: solTokens } = useQuery({
    queryKey: ["swap-tokens", "solana"],
    queryFn: () => stableSolTokens({}),
    staleTime: 600_000,
    enabled: chain === "solana",
  });

  const { data: evmTokensByChain } = useQuery({
    queryKey: ["swap-tokens", "evm"],
    queryFn: () => stableEvmTokens({}),
    staleTime: 600_000,
    enabled: chain === "evm",
  });

  const [inputSymbol, setInputSymbol] = useState<string>("SOL");
  const [outputSymbol, setOutputSymbol] = useState<string>("USDC");
  const [amount, setAmount] = useState<string>("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [swapResult, setSwapResult] = useState<SwapResult | null>(null);

  // Resolve the currently connected EVM chain
  const evmChainQuery = useQuery({
    queryKey: ["evm-current-chain"],
    queryFn: getCurrentEvmChainId,
    enabled: chain === "evm",
    staleTime: 10_000,
  });
  const evmChainId = evmChainQuery.data;
  const evmChainNumber = evmChainId ? EVM_CHAIN_ID_TO_NUMBER[evmChainId] : undefined;

  const solTokenOptions = useMemo(() => (solTokens ? Object.keys(solTokens) : []), [solTokens]);
  const evmTokenOptions = useMemo(() => {
    if (!evmTokensByChain || !evmChainNumber) return [];
    return (
      (
        evmTokensByChain as Record<
          number,
          Array<{ symbol: string; address: string; decimals: number }>
        >
      )[evmChainNumber] ?? []
    );
  }, [evmTokensByChain, evmChainNumber]);

  const tokenOptions = chain === "solana" ? solTokenOptions : evmTokenOptions.map((t) => t.symbol);

  // ── Quote ──
  const quoteMutation = useMutation({
    mutationFn: async () => {
      const amountNum = parseFloat(amount);
      if (!amountNum || amountNum <= 0) throw new Error("Enter an amount to swap");

      if (chain === "solana") {
        if (!solTokens) throw new Error("Token list not loaded yet");
        const inputMint = (solTokens as Record<string, string>)[inputSymbol];
        const outputMint = (solTokens as Record<string, string>)[outputSymbol];
        if (!inputMint || !outputMint) throw new Error("Unknown token");
        return stableJupiterQuote({
          data: { inputMint, outputMint, amount: amountNum, slippageBps: 100 },
        });
      }

      if (chain === "evm") {
        if (!evmChainNumber) throw new Error("Unable to detect the connected EVM network");
        const src = evmTokenOptions.find((t) => t.symbol === inputSymbol);
        const dst = evmTokenOptions.find((t) => t.symbol === outputSymbol);
        if (!src || !dst) throw new Error("Unknown token");
        const atomicAmount = BigInt(Math.round(amountNum * 10 ** src.decimals)).toString();
        const quote = await stable1inchQuote({
          data: {
            chainId: evmChainNumber,
            src: src.address,
            dst: dst.address,
            amount: atomicAmount,
          },
        });
        return { ...quote, __atomicAmount: atomicAmount };
      }

      throw new Error("Connect a wallet to get a swap quote");
    },
  });

  // ── Execute ──
  const executeMutation = useMutation({
    mutationFn: async (): Promise<SwapResult> => {
      assertLegacyExecutionEnabled();
      if (!wallet) throw new Error("Wallet not connected");
      const amountNum = parseFloat(amount);

      if (chain === "solana") {
        const quote = quoteMutation.data as { rawQuote: unknown } | undefined;
        if (!quote?.rawQuote) throw new Error("Get a quote first");

        const txResult = await stableJupiterTx({
          data: {
            quoteResponse: quote.rawQuote as Record<string, unknown>,
            userPublicKey: wallet.address,
          },
        });
        if (!txResult.ok || !txResult.swapTransaction) {
          throw new Error(txResult.error ?? "Failed to build swap transaction");
        }

        const signature = await signAndSendSolanaTransaction(txResult.swapTransaction);

        const solTokensMap = solTokens as Record<string, string> | undefined;
        await stableSaveTrade({
          data: {
            tokenAddress: solTokensMap?.[outputSymbol] ?? outputSymbol,
            tokenSymbol: outputSymbol,
            chain: "solana",
            side: "buy",
            amount: amountNum,
            status: "confirmed",
          },
        });

        return { success: true, txId: signature };
      }

      if (chain === "evm") {
        if (!evmChainNumber) throw new Error("Unable to detect the connected EVM network");
        const quote = quoteMutation.data as { __atomicAmount?: string } | undefined;
        const src = evmTokenOptions.find((t) => t.symbol === inputSymbol);
        const dst = evmTokenOptions.find((t) => t.symbol === outputSymbol);
        if (!src || !dst) throw new Error("Unknown token");
        const atomicAmount =
          quote?.__atomicAmount ?? BigInt(Math.round(amountNum * 10 ** src.decimals)).toString();

        const txResult = await stable1inchTx({
          data: {
            chainId: evmChainNumber,
            src: src.address,
            dst: dst.address,
            amount: atomicAmount,
            fromAddress: wallet.address,
            slippage: 1,
          },
        });
        if (!txResult.ok || !txResult.tx) {
          throw new Error(txResult.error ?? "Failed to build swap transaction");
        }

        const txHash = await sendEvmTransaction({ ...txResult.tx, from: wallet.address });

        await stableSaveTrade({
          data: {
            tokenAddress: dst.address,
            tokenSymbol: outputSymbol,
            chain: "evm",
            side: "buy",
            amount: amountNum,
            status: "pending",
          },
        });

        return { success: true, txId: txHash };
      }

      throw new Error("Connect a wallet to execute a swap");
    },
    onSuccess: (result) => {
      setSwapResult(result);
      play(result.success ? "trade" : "error");
    },
    onError: (error: Error) => {
      setSwapResult({ success: false, error: error.message });
      play("error");
    },
  });

  const handleGetQuote = useCallback(() => {
    setSwapResult(null);
    quoteMutation.mutate();
  }, [quoteMutation]);

  const handleOpenConfirm = useCallback(() => {
    setSwapResult(null);
    setShowConfirm(true);
  }, []);

  const handleConfirmSwap = useCallback(() => {
    executeMutation.mutate();
  }, [executeMutation]);

  const handleCloseConfirm = useCallback(() => {
    if (executeMutation.isPending) return;
    setShowConfirm(false);
  }, [executeMutation.isPending]);

  const quote = quoteMutation.data as
    | {
        ok: boolean;
        error: string | null;
        outAmount?: number;
        dstAmount?: string;
        priceImpactPct?: number;
        route?: string[];
      }
    | undefined;

  const canQuote = isConnected && !!amount && parseFloat(amount) > 0;

  return (
    <div style={{ ...card, padding: "20px", marginTop: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
        <ArrowDownUp className="size-4" style={{ color: "var(--color-accent)" }} />
        <span style={{ fontSize: "14px", fontWeight: 700 }}>On-Chain Swap</span>
        <span
          style={{
            marginInlineStart: "auto",
            fontSize: "11px",
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: "999px",
            color: isConnected ? "var(--color-bullish)" : "var(--color-muted-foreground)",
            border: `1px solid ${isConnected ? "var(--color-bullish)44" : "var(--color-border)"}`,
          }}
        >
          {isConnected
            ? `${chain === "solana" ? "Phantom" : "MetaMask"} · Connected`
            : "Wallet Not Connected"}
        </span>
      </div>

      {!isConnected ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "14px",
            borderRadius: "12px",
            border: "1px dashed var(--color-border)",
            color: "var(--color-muted-foreground)",
            fontSize: "13px",
          }}
        >
          <Wallet2 className="size-4" style={{ flexShrink: 0 }} />
          Connect a Phantom or MetaMask wallet on the Wallet page to swap on-chain.
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
              marginBottom: "10px",
            }}
          >
            <div>
              <label style={labelStyle}>From</label>
              <select
                value={inputSymbol}
                onChange={(e) => setInputSymbol(e.target.value)}
                style={{
                  ...inputStyle,
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "10px",
                  marginTop: "4px",
                }}
              >
                {tokenOptions.map((sym) => (
                  <option key={sym} value={sym}>
                    {sym}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>To</label>
              <select
                value={outputSymbol}
                onChange={(e) => setOutputSymbol(e.target.value)}
                style={{
                  ...inputStyle,
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "10px",
                  marginTop: "4px",
                }}
              >
                {tokenOptions.map((sym) => (
                  <option key={sym} value={sym}>
                    {sym}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label style={labelStyle}>Amount ({inputSymbol})</label>
          <input
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            style={{
              ...inputStyle,
              ...mono,
              width: "100%",
              padding: "10px 12px",
              borderRadius: "10px",
              marginTop: "4px",
              marginBottom: "12px",
              fontSize: "16px",
            }}
          />

          <button
            onClick={handleGetQuote}
            disabled={!canQuote || quoteMutation.isPending}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "10px",
              border: "1px solid var(--color-border)",
              background: "color-mix(in srgb, var(--color-primary) 6%, transparent)",
              fontWeight: 600,
              fontSize: "13px",
              cursor: canQuote ? "pointer" : "not-allowed",
              opacity: canQuote ? 1 : 0.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            {quoteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Get Quote
          </button>

          {quoteMutation.isError && (
            <p style={{ color: "var(--color-bearish)", fontSize: "12px", marginTop: "8px" }}>
              {(quoteMutation.error as Error).message}
            </p>
          )}

          {quote && quote.ok && (
            <div
              style={{
                marginTop: "12px",
                padding: "12px",
                borderRadius: "10px",
                background: "color-mix(in srgb, var(--color-foreground) 3%, transparent)",
                fontSize: "13px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", ...mono }}>
                <span>You receive (est.)</span>
                <span>
                  {quote.outAmount ?? quote.dstAmount ?? "—"} {outputSymbol}
                </span>
              </div>
              {typeof quote.priceImpactPct === "number" && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    ...mono,
                    marginTop: "4px",
                  }}
                >
                  <span>Price impact</span>
                  <span>{quote.priceImpactPct.toFixed(2)}%</span>
                </div>
              )}
              {quote.route && quote.route.length > 0 && (
                <div style={{ marginTop: "4px", color: "var(--color-muted-foreground)" }}>
                  Route: {quote.route.join(" → ")}
                </div>
              )}

              <button
                onClick={handleOpenConfirm}
                disabled
                style={{
                  width: "100%",
                  marginTop: "10px",
                  padding: "10px",
                  borderRadius: "10px",
                  border: "none",
                  background: "var(--color-bullish)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "not-allowed",
                  opacity: 0.5,
                }}
              >
                Swap disabled during rehabilitation
              </button>
            </div>
          )}

          {quote && !quote.ok && (
            <p style={{ color: "var(--color-bearish)", fontSize: "12px", marginTop: "8px" }}>
              {quote.error ?? "Failed to fetch quote"}
            </p>
          )}
        </>
      )}

      {showConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
          onClick={handleCloseConfirm}
        >
          <div
            style={{ ...card, padding: "20px", width: "min(360px, 90vw)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}
            >
              <ShieldAlert className="size-4" style={{ color: "var(--color-warning, orange)" }} />
              <span style={{ fontWeight: 700, fontSize: "14px" }}>Confirm Swap</span>
            </div>

            {!swapResult && (
              <>
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--color-muted-foreground)",
                    marginBottom: "12px",
                  }}
                >
                  You are about to swap{" "}
                  <strong>
                    {amount} {inputSymbol}
                  </strong>{" "}
                  for <strong>{outputSymbol}</strong> on{" "}
                  {chain === "solana" ? "Solana" : EVM_CHAINS[evmChainId ?? "0x1"].label}. This will
                  open your wallet to sign and broadcast the transaction on-chain — it cannot be
                  reversed once confirmed.
                </p>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={handleCloseConfirm}
                    disabled={executeMutation.isPending}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "10px",
                      border: "1px solid var(--color-border)",
                      background: "transparent",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmSwap}
                    disabled
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "10px",
                      border: "none",
                      background: "var(--color-bullish)",
                      color: "#fff",
                      fontWeight: 700,
                      cursor: "not-allowed",
                      opacity: 0.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    Execution disabled
                  </button>
                </div>
              </>
            )}

            {swapResult && (
              <div style={{ textAlign: "center" }}>
                {swapResult.success ? (
                  <>
                    <CheckCircle2
                      className="size-8"
                      style={{ color: "var(--color-bullish)", margin: "0 auto 8px" }}
                    />
                    <p style={{ fontSize: "13px", marginBottom: "4px" }}>Swap submitted</p>
                    <p
                      style={{
                        ...mono,
                        fontSize: "11px",
                        color: "var(--color-muted-foreground)",
                        wordBreak: "break-all",
                      }}
                    >
                      {swapResult.txId}
                    </p>
                  </>
                ) : (
                  <>
                    <XCircle
                      className="size-8"
                      style={{ color: "var(--color-bearish)", margin: "0 auto 8px" }}
                    />
                    <p style={{ fontSize: "13px" }}>{swapResult.error}</p>
                  </>
                )}
                <button
                  onClick={() => {
                    setShowConfirm(false);
                    setSwapResult(null);
                  }}
                  style={{
                    marginTop: "12px",
                    width: "100%",
                    padding: "10px",
                    borderRadius: "10px",
                    border: "1px solid var(--color-border)",
                    background: "transparent",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { memo } from "react";
import { getWalletData } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";

export const Route = createFileRoute("/_authenticated/wallet-web3")({
  head: () => ({ meta: [{ title: "Wallet — Vixor" }] }),
  component: WalletPage,
});

function WalletPage() {
  const fetchData = useStableServerFn(getWalletData);

  const query = useQuery({
    queryKey: ["wallet-data"],
    queryFn: () => fetchData({}),
    staleTime: 30_000,
  });

  const d = query.data;
  const isLoading = query.isLoading;

  const profile = d?.profile;

  const stats = [
    { label: "Portfolio Value", value: `$${(d?.totalPortfolioValue ?? 0).toFixed(2)}`, color: "#3B82F6" },
    { label: "Total PnL", value: d?.totalPnl != null ? (d.totalPnl >= 0 ? `+$${d.totalPnl.toFixed(2)}` : `-$${Math.abs(d.totalPnl).toFixed(2)}`) : "$0.00", color: (d?.totalPnl ?? 0) >= 0 ? "#22C55E" : "#EF4444" },
    { label: "Tokens Traded", value: String(d?.tokens?.length ?? 0), color: "#8B5CF6" },
    { label: "Active Trades", value: String(d?.activeTrades ?? 0), color: "#F59E0B" },
  ];

  return (
    <div style={{ background: "#0f1424", color: "#F0F4FC", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100%", padding: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>Web3 Wallet</h1>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded" style={{ background: "rgba(59,130,246,0.15)", color: "#3B82F6" }}>PORTFOLIO WALLET</span>
      </div>
      <p style={{ fontSize: "12px", color: "#7B8BA8", marginTop: "4px", marginBottom: "20px" }}>
        Your portfolio wallet view derived from trading activity. Token holdings, balances, and transaction history.
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center" style={{ padding: "60px 0" }}>
          <div style={{ width: 32, height: 32, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#3B82F6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : (
        <>
          {/* User Profile Card */}
          {profile && (
            <div style={{ background: "#1a2035", borderRadius: "12px", border: "1px solid rgba(59,130,246,0.12)", padding: "18px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "rgba(59,130,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 800, color: "#3B82F6", flexShrink: 0 }}>
                {(profile.display_name || profile.username || "T").charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "2px" }}>{profile.display_name || profile.username || "Trader"}</div>
                <div style={{ fontSize: "11px", color: "#7B8BA8" }}>{profile.username ? `@${profile.username}` : ""}</div>
              </div>
              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "9px", color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.05em" }}>XP</div>
                  <div style={{ fontSize: "15px", fontWeight: 800, fontFamily: "monospace", color: "#F59E0B" }}>{profile.xp ?? 0}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "9px", color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.05em" }}>Streak</div>
                  <div style={{ fontSize: "15px", fontWeight: 800, fontFamily: "monospace", color: "#EC4899" }}>{profile.streak_days ?? 0}d</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "9px", color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.05em" }}>Trades</div>
                  <div style={{ fontSize: "15px", fontWeight: 800, fontFamily: "monospace", color: "#3B82F6" }}>{d?.totalTrades ?? 0}</div>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
            {stats.map((s) => (
              <div key={s.label} style={{ background: "#161b2e", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", padding: "18px" }}>
                <div style={{ fontSize: "10px", fontWeight: 600, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>{s.label}</div>
                <div style={{ fontSize: "22px", fontWeight: 800, fontFamily: "monospace", color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Two-column layout: Tokens + Transactions */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {/* Token Balances */}
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Token Balances
              </div>
              {(d?.tokens ?? []).length > 0 ? (
                <div style={{ background: "#161b2e", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <div className="flex items-center px-4 py-2 text-[9px] font-bold uppercase tracking-wider" style={{ color: "#4A5568", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ width: "30%" }}>Token</div>
                    <div style={{ width: "18%" }} className="text-right">Amount</div>
                    <div style={{ width: "18%" }} className="text-right">Value</div>
                    <div style={{ width: "18%" }} className="text-right">PnL</div>
                    <div style={{ width: "16%" }} className="text-right">Price</div>
                  </div>
                  <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                    {d!.tokens.map((t: any) => (
                      <TokenRow key={t.symbol} token={t} />
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ background: "#161b2e", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", padding: "36px", textAlign: "center" }}>
                  <div style={{ fontSize: "12px", color: "#7B8BA8" }}>No token balances yet. Start trading to build your portfolio.</div>
                </div>
              )}
            </div>

            {/* Recent Transactions */}
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Recent Transactions
              </div>
              {(d?.recentTransactions ?? []).length > 0 ? (
                <div style={{ background: "#161b2e", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <div className="flex items-center px-4 py-2 text-[9px] font-bold uppercase tracking-wider" style={{ color: "#4A5568", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ width: "22%" }}>Type</div>
                    <div style={{ width: "24%" }}>Pair</div>
                    <div style={{ width: "18%" }} className="text-right">Amount</div>
                    <div style={{ width: "18%" }} className="text-right">Price</div>
                    <div style={{ width: "18%" }} className="text-right">PnL</div>
                  </div>
                  <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                    {d!.recentTransactions.map((tx: any) => (
                      <TxnRow key={tx.id} txn={tx} />
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ background: "#161b2e", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", padding: "36px", textAlign: "center" }}>
                  <div style={{ fontSize: "12px", color: "#7B8BA8" }}>No transactions yet. Your trade history will appear here.</div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const TokenRow = memo(function TokenRow({ token }: { token: any }) {
  const pnlColor = token.pnl >= 0 ? "#22C55E" : "#EF4444";
  const pnlPct = token.totalEntry > 0 ? ((token.pnl / token.totalEntry) * 100) : 0;

  return (
    <div className="flex items-center px-4 py-3 text-[11px]" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div style={{ width: "30%", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(139,92,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#8B5CF6", flexShrink: 0 }}>
          {token.symbol.split("/")[0]?.charAt(0) || "?"}
        </div>
        <div>
          <div>{token.symbol.split("/")[0] || token.symbol}</div>
          <div style={{ fontSize: "9px", color: "#4A5568", fontWeight: 500 }}>{token.tradeCount} trades</div>
        </div>
      </div>
      <div style={{ width: "18%", textAlign: "right", fontFamily: "monospace", color: "#7B8BA8" }}>
        {token.amount.toFixed(token.amount < 1 ? 4 : 2)}
      </div>
      <div style={{ width: "18%", textAlign: "right", fontFamily: "monospace", fontWeight: 600, color: "#F0F4FC" }}>
        ${token.totalValue.toFixed(2)}
      </div>
      <div style={{ width: "18%", textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: pnlColor }}>
        {token.pnl >= 0 ? "+" : ""}${token.pnl.toFixed(2)}
        <div style={{ fontSize: "9px", fontWeight: 600 }}>{pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%</div>
      </div>
      <div style={{ width: "16%", textAlign: "right", fontFamily: "monospace", color: "#7B8BA8" }}>
        ${token.lastPrice.toFixed(token.lastPrice < 1 ? 6 : 2)}
      </div>
    </div>
  );
});

const TxnRow = memo(function TxnRow({ txn }: { txn: any }) {
  const isBuy = txn.type === "BUY";
  const typeColor = isBuy ? "#22C55E" : "#EF4444";
  const pnlColor = txn.pnl != null ? (txn.pnl >= 0 ? "#22C55E" : "#EF4444") : "#4A5568";

  return (
    <div className="flex items-center px-4 py-3 text-[11px]" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div style={{ width: "22%" }}>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${typeColor}15`, color: typeColor }}>{txn.type}</span>
      </div>
      <div style={{ width: "24%", fontWeight: 700 }}>{txn.pair}</div>
      <div style={{ width: "18%", textAlign: "right", fontFamily: "monospace", color: "#7B8BA8" }}>
        {txn.amount.toFixed(txn.amount < 1 ? 4 : 2)}
      </div>
      <div style={{ width: "18%", textAlign: "right", fontFamily: "monospace", color: "#7B8BA8" }}>
        ${txn.price.toFixed(txn.price < 1 ? 6 : 2)}
      </div>
      <div style={{ width: "18%", textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: pnlColor }}>
        {txn.pnl != null ? (txn.pnl >= 0 ? `+$${txn.pnl.toFixed(2)}` : `-$${Math.abs(txn.pnl).toFixed(2)}`) : "—"}
      </div>
    </div>
  );
});
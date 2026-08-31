import { memo } from "react";
import { useQuery } from "@tanstack/react-query";

import { useWallet } from "@/domains/wallet/adapter/WalletProvider";

// ── Wallet Nav Label — shows balance + address when connected, "Connect" when not ──

export const WalletNavLabel = memo(function WalletNavLabel() {
  const { wallet } = useWallet();
  const isConnected = wallet?.status === "connected";
  const addr = wallet?.address || "";
  const isSolana = wallet?.chain === "solana";

  // Fetch SOL balance when connected on Solana
  const { data: solBalance } = useQuery({
    queryKey: ["wallet-sol-balance", addr],
    queryFn: async () => {
      if (!addr || !isSolana) return null;
      try {
        const { getPhantomSolBalance } = await import("@/domains/wallet/adapters/phantom-adapter");
        return await getPhantomSolBalance(addr);
      } catch {
        // Expected: dynamic import or wallet adapter may fail
        return null;
      }
    },
    enabled: isConnected && isSolana && !!addr,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  if (!isConnected) {
    return <span className="hidden sm:inline">Connect</span>;
  }

  const short = addr.length > 10 ? `${addr.slice(0, 4)}...${addr.slice(-3)}` : addr;
  const balanceStr =
    solBalance != null ? `${solBalance.toFixed(solBalance < 1 ? 3 : 2)} SOL` : null;

  return (
    <span className="hidden sm:inline" style={{ opacity: 0.9 }}>
      {balanceStr ? `${balanceStr} · ` : ""}
      {short}
    </span>
  );
});

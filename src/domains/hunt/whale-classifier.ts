// ============================================================================
// Hunt — Whale Classifier
// ============================================================================
//
// Adapted from VybeWhale-Bot (bigdreamsweb3/VybeWhale-Bot).
// Classifies wallets as "smart money" based on PnL, win rate, trade size, activity.
// Detects whale alert triggers: large buys/sells, accumulation, dump patterns.
// ============================================================================

export interface WalletTx {
  type: "buy" | "sell";
  valueUsd: number;
  timestamp: number; // Unix ms
}

export interface WalletInput {
  address: string;
  txns: WalletTx[];
  totalPnl: number; // USD
  winRate: number; // 0-100
  totalTrades: number;
}

export interface WalletClassification {
  isSmartMoney: boolean;
  isWhale: boolean;
  alertType: "none" | "large_buy" | "large_sell" | "accumulation" | "dump" | "new_wallet_active";
  alertDescription: string;
  reasons: string[];
}

// ── Smart Money Criteria (must meet 2+) ──────────────────────────────────────

const SMART_MONEY_CRITERIA = {
  winRate: 60, // must be > 60%
  totalPnl: 10_000, // must have > $10k PnL
  avgTradeSize: 1_000, // avg trade > $1k
  activeWithin7Days: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  minHoldings: 3, // 3+ different tokens (approximated by trade count)
};

// ── Whale Alert Thresholds ──────────────────────────────────────────────────

const WHALE_THRESHOLDS = {
  largeBuy: 50_000, // $50k single buy
  largeSell: 100_000, // $100k single sell
  accumulationCount: 3, // 3+ buys of same token in 1h
  dumpCount: 3, // 3+ sells in 1h
  newWalletAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  newWalletVolume: 10_000, // $10k+ volume for new wallet
};

/**
 * Classify a wallet as smart money / whale and detect alert patterns.
 */
export function classifyWallet(wallet: WalletInput): WalletClassification {
  const reasons: string[] = [];
  let smartMoneyCriteriaMet = 0;

  // ── Smart Money Evaluation ──

  if (wallet.winRate > SMART_MONEY_CRITERIA.winRate) {
    smartMoneyCriteriaMet++;
    reasons.push(`Win rate ${wallet.winRate.toFixed(1)}% (above 60% threshold)`);
  }

  if (wallet.totalPnl > SMART_MONEY_CRITERIA.totalPnl) {
    smartMoneyCriteriaMet++;
    reasons.push(`Total PnL $${(wallet.totalPnl / 1000).toFixed(1)}K (above $10K threshold)`);
  }

  const avgTradeSize =
    wallet.txns.length > 0
      ? wallet.txns.reduce((s, t) => s + t.valueUsd, 0) / wallet.txns.length
      : 0;

  if (avgTradeSize > SMART_MONEY_CRITERIA.avgTradeSize) {
    smartMoneyCriteriaMet++;
    reasons.push(`Avg trade size $${avgTradeSize.toFixed(0)} (above $1K threshold)`);
  }

  const now = Date.now();
  const lastTx = wallet.txns.length > 0 ? Math.max(...wallet.txns.map((t) => t.timestamp)) : 0;
  const isRecentlyActive = lastTx > 0 && now - lastTx < SMART_MONEY_CRITERIA.activeWithin7Days;

  if (isRecentlyActive) {
    smartMoneyCriteriaMet++;
    reasons.push("Active within last 7 days");
  }

  if (wallet.totalTrades >= SMART_MONEY_CRITERIA.minHoldings) {
    smartMoneyCriteriaMet++;
    reasons.push(`${wallet.totalTrades} trades recorded`);
  }

  const isSmartMoney = smartMoneyCriteriaMet >= 2;

  // ── Whale Alert Detection ──

  let alertType: WalletClassification["alertType"] = "none";
  let alertDescription = "";
  let isWhale = false;

  // Large single buy
  const largeBuys = wallet.txns.filter(
    (t) => t.type === "buy" && t.valueUsd >= WHALE_THRESHOLDS.largeBuy,
  );
  if (largeBuys.length > 0) {
    isWhale = true;
    alertType = "large_buy";
    const largest = Math.max(...largeBuys.map((t) => t.valueUsd));
    alertDescription = `Large buy detected: $${(largest / 1000).toFixed(1)}K`;
  }

  // Large single sell
  const largeSells = wallet.txns.filter(
    (t) => t.type === "sell" && t.valueUsd >= WHALE_THRESHOLDS.largeSell,
  );
  if (largeSells.length > 0 && alertType === "none") {
    isWhale = true;
    alertType = "large_sell";
    const largest = Math.max(...largeSells.map((t) => t.valueUsd));
    alertDescription = `Large sell detected: $${(largest / 1000).toFixed(1)}K`;
  }

  // Accumulation: 3+ buys in last 1h
  const oneHourAgo = now - 60 * 60 * 1000;
  const recentBuys = wallet.txns.filter((t) => t.type === "buy" && t.timestamp >= oneHourAgo);
  if (recentBuys.length >= WHALE_THRESHOLDS.accumulationCount && alertType === "none") {
    isWhale = true;
    alertType = "accumulation";
    alertDescription = `Accumulation pattern: ${recentBuys.length} buys in last hour`;
  }

  // Dump: 3+ sells in last 1h
  const recentSells = wallet.txns.filter((t) => t.type === "sell" && t.timestamp >= oneHourAgo);
  if (recentSells.length >= WHALE_THRESHOLDS.dumpCount && alertType === "none") {
    isWhale = true;
    alertType = "dump";
    alertDescription = `Dump pattern: ${recentSells.length} sells in last hour`;
  }

  // New wallet with high volume
  const totalVolume = wallet.txns.reduce((s, t) => s + t.valueUsd, 0);
  if (
    alertType === "none" &&
    totalVolume >= WHALE_THRESHOLDS.newWalletVolume &&
    wallet.totalTrades < 50
  ) {
    isWhale = true;
    alertType = "new_wallet_active";
    alertDescription = `New wallet with $${(totalVolume / 1000).toFixed(1)}K volume`;
  }

  return {
    isSmartMoney,
    isWhale,
    alertType,
    alertDescription,
    reasons,
  };
}

/** Format wallet address for display (first 6...last 4) */
export function formatWalletAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// ============================================================================
// Shield — Trust Score Algorithm
// ============================================================================
//
// Converts raw GoPlus/RugCheck API data into a unified trust score (0-100).
// Higher score = safer token.
//
// This algorithm is adapted from token-sniffer and rugpull-scam-detection repos.
// ============================================================================

import type { GoPlusTokenSecurity } from "./goplus-client";
import { getTop10HolderPct, isLpBurned } from "./goplus-client";
import type { RugCheckReport } from "./rugcheck-client";
import {
  getTop10HolderPctFromRugCheck,
  isLpBurnedFromRugCheck,
  isMintDisabled,
  isFreezeDisabled,
} from "./rugcheck-client";

export type RiskLevel = "safe" | "low" | "medium" | "high" | "critical";

export interface RiskFactor {
  name: string;
  status: "pass" | "partial" | "fail";
  weight: number;
  score: number; // earned points (0, weight/2, or weight)
  detail: string;
}

export interface TrustScoreResult {
  score: number; // 0-100
  level: RiskLevel;
  factors: RiskFactor[];
  verdict: string; // human-readable verdict
  honeypot: boolean;
  quickRed: boolean; // immediate red flags (score forced to 0)
}

export interface MarketContext {
  price: number;
  liquidity: number;
  volume24h: number;
  marketCap: number;
  holders: number;
  hasWebsite: boolean;
  hasTwitter: boolean;
  ageDays: number; // days since token creation (0 if unknown)
}

// ── Score thresholds ────────────────────────────────────────────────────────

export function scoreToLevel(score: number): RiskLevel {
  if (score >= 85) return "safe";
  if (score >= 65) return "low";
  if (score >= 40) return "medium";
  if (score >= 20) return "high";
  return "critical";
}

export function levelToVerdict(level: RiskLevel): string {
  switch (level) {
    case "safe":
      return "Token appears safe based on available data";
    case "low":
      return "Low risk — minor concerns detected";
    case "medium":
      return "Medium risk — review before investing";
    case "high":
      return "High risk — significant red flags detected";
    case "critical":
      return "Critical risk — do NOT interact with this token";
  }
}

// ── EVM Trust Score (from GoPlus data) ──────────────────────────────────────

export function calculateEvmTrustScore(
  security: GoPlusTokenSecurity,
  market: MarketContext,
): TrustScoreResult {
  const factors: RiskFactor[] = [];
  let totalScore = 0;

  const isHoneypot = security.is_honeypot === "1";
  const buyTax = parseFloat(security.buy_tax || "0") * 100;
  const sellTax = parseFloat(security.sell_tax || "0") * 100;
  const top10Pct = getTop10HolderPct(security);
  const lpBurned = isLpBurned(security);
  const ownershipRenounced =
    !security.can_take_back_ownership || security.can_take_back_ownership === "0";
  const isMintable = security.is_mintable === "1";
  const isProxy = security.is_proxy === "1";

  // Quick red flags — instant critical
  if (security.is_airdrop_scam === "1") {
    return {
      score: 0,
      level: "critical",
      factors: [],
      verdict: "Token is flagged as an airdrop scam",
      honeypot: false,
      quickRed: true,
    };
  }

  // 1. Honeypot Detection (25 pts)
  const honeypotFactor: RiskFactor = {
    name: "Honeypot Detection",
    weight: 25,
    status: isHoneypot ? "fail" : "pass",
    score: isHoneypot ? 0 : 25,
    detail: isHoneypot ? "⚠️ Token is a honeypot — cannot sell" : "✓ Not a honeypot",
  };
  factors.push(honeypotFactor);
  totalScore += honeypotFactor.score;

  // 2. Buy/Sell Tax (15 pts)
  const maxTax = Math.max(buyTax, sellTax);
  let taxScore: number;
  let taxStatus: "pass" | "partial" | "fail";
  let taxDetail: string;

  if (maxTax <= 3) {
    taxScore = 15;
    taxStatus = "pass";
    taxDetail = `✓ Low tax: buy ${buyTax.toFixed(1)}% / sell ${sellTax.toFixed(1)}%`;
  } else if (maxTax <= 10) {
    taxScore = 7;
    taxStatus = "partial";
    taxDetail = `⚠️ High tax: buy ${buyTax.toFixed(1)}% / sell ${sellTax.toFixed(1)}%`;
  } else {
    taxScore = 0;
    taxStatus = "fail";
    taxDetail = `⛔ Very high tax: buy ${buyTax.toFixed(1)}% / sell ${sellTax.toFixed(1)}%`;
  }
  factors.push({
    name: "Buy/Sell Tax",
    weight: 15,
    status: taxStatus,
    score: taxScore,
    detail: taxDetail,
  });
  totalScore += taxScore;

  // 3. Ownership Renounced (10 pts)
  const ownFactor: RiskFactor = {
    name: "Ownership Renounced",
    weight: 10,
    status: ownershipRenounced ? "pass" : "fail",
    score: ownershipRenounced ? 10 : 0,
    detail: ownershipRenounced ? "✓ Ownership renounced" : "⛔ Owner can take back ownership",
  };
  factors.push(ownFactor);
  totalScore += ownFactor.score;

  // 4. LP Burned/Locked (10 pts)
  const lpFactor: RiskFactor = {
    name: "Liquidity Lock",
    weight: 10,
    status: lpBurned ? "pass" : "fail",
    score: lpBurned ? 10 : 0,
    detail: lpBurned ? "✓ LP burned or locked (≥80%)" : "⛔ LP not burned or locked",
  };
  factors.push(lpFactor);
  totalScore += lpFactor.score;

  // 5. Holder Distribution (10 pts)
  let holdersScore: number;
  let holdersStatus: "pass" | "partial" | "fail";
  let holdersDetail: string;

  if (top10Pct <= 30) {
    holdersScore = 10;
    holdersStatus = "pass";
    holdersDetail = `✓ Top 10 holders: ${top10Pct.toFixed(1)}% (healthy distribution)`;
  } else if (top10Pct <= 60) {
    holdersScore = 5;
    holdersStatus = "partial";
    holdersDetail = `⚠️ Top 10 holders: ${top10Pct.toFixed(1)}% (concentrated)`;
  } else {
    holdersScore = 0;
    holdersStatus = "fail";
    holdersDetail = `⛔ Top 10 holders: ${top10Pct.toFixed(1)}% (highly concentrated)`;
  }
  factors.push({
    name: "Holder Distribution",
    weight: 10,
    status: holdersStatus,
    score: holdersScore,
    detail: holdersDetail,
  });
  totalScore += holdersScore;

  // 6. Contract Age (5 pts)
  let ageScore: number;
  let ageStatus: "pass" | "partial" | "fail";
  let ageDetail: string;

  if (market.ageDays >= 30) {
    ageScore = 5;
    ageStatus = "pass";
    ageDetail = `✓ Contract age: ${market.ageDays} days`;
  } else if (market.ageDays >= 7) {
    ageScore = 2;
    ageStatus = "partial";
    ageDetail = `⚠️ Young contract: ${market.ageDays} days`;
  } else {
    ageScore = 0;
    ageStatus = "fail";
    ageDetail =
      market.ageDays === 0 ? "⚠️ Contract age unknown" : `⛔ Very new: ${market.ageDays} days`;
  }
  factors.push({
    name: "Contract Age",
    weight: 5,
    status: ageStatus,
    score: ageScore,
    detail: ageDetail,
  });
  totalScore += ageScore;

  // 7. Liquidity Depth (10 pts)
  let liqScore: number;
  let liqStatus: "pass" | "partial" | "fail";
  let liqDetail: string;

  if (market.liquidity >= 100_000) {
    liqScore = 10;
    liqStatus = "pass";
    liqDetail = `✓ Strong liquidity: $${(market.liquidity / 1000).toFixed(1)}K`;
  } else if (market.liquidity >= 10_000) {
    liqScore = 5;
    liqStatus = "partial";
    liqDetail = `⚠️ Low liquidity: $${(market.liquidity / 1000).toFixed(1)}K`;
  } else {
    liqScore = 0;
    liqStatus = "fail";
    liqDetail = `⛔ Very low liquidity: $${market.liquidity.toFixed(0)}`;
  }
  factors.push({
    name: "Liquidity Depth",
    weight: 10,
    status: liqStatus,
    score: liqScore,
    detail: liqDetail,
  });
  totalScore += liqScore;

  // 8. Social Links (5 pts)
  const hasSocials = market.hasWebsite || market.hasTwitter;
  const socialScore = market.hasWebsite && market.hasTwitter ? 5 : hasSocials ? 2 : 0;
  const socialStatus: "pass" | "partial" | "fail" =
    market.hasWebsite && market.hasTwitter ? "pass" : hasSocials ? "partial" : "fail";
  factors.push({
    name: "Social Links",
    weight: 5,
    status: socialStatus,
    score: socialScore,
    detail: hasSocials
      ? `✓ Has ${[market.hasWebsite && "website", market.hasTwitter && "Twitter"].filter(Boolean).join(" + ")}`
      : "⚠️ No verified social links",
  });
  totalScore += socialScore;

  // 9. Mintable / Proxy (10 pts)
  const mintProxy = !isMintable && !isProxy;
  const mintProxyPartial = isMintable !== isProxy; // only one is bad
  const mintProxyScore = mintProxy ? 10 : mintProxyPartial ? 5 : 0;
  const mintProxyStatus: "pass" | "partial" | "fail" = mintProxy
    ? "pass"
    : mintProxyPartial
      ? "partial"
      : "fail";
  const mintProxyDetails: string[] = [];
  if (isMintable) mintProxyDetails.push("token is mintable");
  if (isProxy) mintProxyDetails.push("proxy contract");
  factors.push({
    name: "Contract Safety",
    weight: 10,
    status: mintProxyStatus,
    score: mintProxyScore,
    detail: mintProxy ? "✓ Not mintable, not a proxy" : `⚠️ ${mintProxyDetails.join(", ")}`,
  });
  totalScore += mintProxyScore;

  const finalScore = Math.min(100, Math.max(0, totalScore));
  const level = scoreToLevel(finalScore);

  return {
    score: finalScore,
    level,
    factors,
    verdict: levelToVerdict(level),
    honeypot: isHoneypot,
    quickRed: false,
  };
}

// ── Solana Trust Score (from RugCheck data) ──────────────────────────────────

export function calculateSolanaTrustScore(
  report: RugCheckReport,
  market: MarketContext,
): TrustScoreResult {
  const factors: RiskFactor[] = [];
  let totalScore = 0;

  const top10Pct = getTop10HolderPctFromRugCheck(report);
  const lpBurned = isLpBurnedFromRugCheck(report);
  const mintDisabled = isMintDisabled(report);
  const freezeDisabled = isFreezeDisabled(report);
  const isRugged = report.rugged === true;
  const criticalRisks = (report.risks || []).filter((r) => r.level === "danger");

  // Quick red flag
  if (isRugged) {
    return {
      score: 0,
      level: "critical",
      factors: [],
      verdict: "Token has been identified as a rug pull",
      honeypot: false,
      quickRed: true,
    };
  }

  // 1. Rug Pull Detection (25 pts — equivalent to honeypot for Solana)
  const rugScore = criticalRisks.length === 0 ? 25 : criticalRisks.length === 1 ? 5 : 0;
  const rugStatus: "pass" | "partial" | "fail" =
    criticalRisks.length === 0 ? "pass" : criticalRisks.length === 1 ? "partial" : "fail";
  factors.push({
    name: "Rug Pull Check",
    weight: 25,
    status: rugStatus,
    score: rugScore,
    detail:
      criticalRisks.length === 0
        ? "✓ No critical risks detected"
        : `⚠️ ${criticalRisks.length} critical risk(s): ${criticalRisks[0]?.name || ""}`,
  });
  totalScore += rugScore;

  // 2. Mint Authority Disabled (15 pts — equivalent to tax for Solana)
  const mintScore = mintDisabled ? 15 : freezeDisabled ? 7 : 0;
  const mintStatus: "pass" | "partial" | "fail" = mintDisabled
    ? "pass"
    : freezeDisabled
      ? "partial"
      : "fail";
  factors.push({
    name: "Mint Authority",
    weight: 15,
    status: mintStatus,
    score: mintScore,
    detail: mintDisabled
      ? "✓ Mint authority disabled"
      : freezeDisabled
        ? "⚠️ Mint enabled, freeze disabled"
        : "⛔ Both mint and freeze authorities active",
  });
  totalScore += mintScore;

  // 3. Token Metadata (10 pts — equivalent to ownership for Solana)
  const metaMutable = report.tokenMeta?.mutable === true;
  const metaScore = metaMutable ? 0 : 10;
  factors.push({
    name: "Metadata Immutable",
    weight: 10,
    status: metaMutable ? "fail" : "pass",
    score: metaScore,
    detail: metaMutable
      ? "⚠️ Token metadata is mutable (can be changed)"
      : "✓ Metadata is immutable",
  });
  totalScore += metaScore;

  // 4. LP Burned/Locked (10 pts)
  factors.push({
    name: "Liquidity Lock",
    weight: 10,
    status: lpBurned ? "pass" : "fail",
    score: lpBurned ? 10 : 0,
    detail: lpBurned ? "✓ LP burned or locked (≥80%)" : "⛔ LP not burned or locked",
  });
  totalScore += lpBurned ? 10 : 0;

  // 5. Holder Distribution (10 pts)
  let holdersScore: number;
  let holdersStatus: "pass" | "partial" | "fail";
  if (top10Pct <= 30) {
    holdersScore = 10;
    holdersStatus = "pass";
  } else if (top10Pct <= 60) {
    holdersScore = 5;
    holdersStatus = "partial";
  } else {
    holdersScore = 0;
    holdersStatus = "fail";
  }
  factors.push({
    name: "Holder Distribution",
    weight: 10,
    status: holdersStatus,
    score: holdersScore,
    detail:
      holdersStatus === "pass"
        ? `✓ Top 10 holders: ${top10Pct.toFixed(1)}%`
        : `⚠️ Top 10 holders: ${top10Pct.toFixed(1)}% (concentrated)`,
  });
  totalScore += holdersScore;

  // 6. Contract Age (5 pts)
  const ageScore = market.ageDays >= 30 ? 5 : market.ageDays >= 7 ? 2 : 0;
  const ageStatus: "pass" | "partial" | "fail" =
    market.ageDays >= 30 ? "pass" : market.ageDays >= 7 ? "partial" : "fail";
  factors.push({
    name: "Token Age",
    weight: 5,
    status: ageStatus,
    score: ageScore,
    detail:
      market.ageDays === 0
        ? "⚠️ Age unknown"
        : market.ageDays >= 30
          ? `✓ ${market.ageDays} days old`
          : `⚠️ Only ${market.ageDays} days old`,
  });
  totalScore += ageScore;

  // 7. Liquidity Depth (10 pts)
  const liqScore = market.liquidity >= 100_000 ? 10 : market.liquidity >= 10_000 ? 5 : 0;
  const liqStatus: "pass" | "partial" | "fail" =
    market.liquidity >= 100_000 ? "pass" : market.liquidity >= 10_000 ? "partial" : "fail";
  factors.push({
    name: "Liquidity Depth",
    weight: 10,
    status: liqStatus,
    score: liqScore,
    detail:
      liqStatus === "pass"
        ? `✓ Strong liquidity: $${(market.liquidity / 1000).toFixed(1)}K`
        : liqStatus === "partial"
          ? `⚠️ Low liquidity: $${(market.liquidity / 1000).toFixed(1)}K`
          : `⛔ Very low: $${market.liquidity.toFixed(0)}`,
  });
  totalScore += liqScore;

  // 8. Social Links (5 pts)
  const socialScore =
    market.hasWebsite && market.hasTwitter ? 5 : market.hasWebsite || market.hasTwitter ? 2 : 0;
  const socialStatus: "pass" | "partial" | "fail" =
    market.hasWebsite && market.hasTwitter
      ? "pass"
      : market.hasWebsite || market.hasTwitter
        ? "partial"
        : "fail";
  factors.push({
    name: "Social Links",
    weight: 5,
    status: socialStatus,
    score: socialScore,
    detail: socialScore > 0 ? "✓ Has verified social links" : "⚠️ No verified social links",
  });
  totalScore += socialScore;

  // 9. Freeze Authority (10 pts)
  factors.push({
    name: "Freeze Authority",
    weight: 10,
    status: freezeDisabled ? "pass" : "fail",
    score: freezeDisabled ? 10 : 0,
    detail: freezeDisabled
      ? "✓ Freeze authority disabled"
      : "⚠️ Freeze authority active (wallets can be frozen)",
  });
  totalScore += freezeDisabled ? 10 : 0;

  const finalScore = Math.min(100, Math.max(0, totalScore));
  const level = scoreToLevel(finalScore);

  return {
    score: finalScore,
    level,
    factors,
    verdict: levelToVerdict(level),
    honeypot: false,
    quickRed: false,
  };
}

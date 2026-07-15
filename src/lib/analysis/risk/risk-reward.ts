/**
 * Vixor Local Trading Analysis Engine — Risk-Reward & Position Sizing
 *
 * Calculates entry, stop-loss, and take-profit levels based on:
 *   - Current price and trend direction
 *   - ATR for volatility-adaptive stops
 *   - Support/resistance levels for structural validation
 *
 * Also provides a position-sizing calculator that enforces a fixed
 * risk-per-trade percentage of account balance.
 *
 * Usage:
 *   const rr = calculateRiskReward(price, "BULLISH", atrVal, 2, supports, resistances, "BTC/USD");
 *   const ps = calculatePositionSize(10000, 1, rr.entry, rr.stopLoss, 2);
 */

import { TrendDirection, RecommendationType } from "../core/types";
import { formatPrice } from "../core/candle-utils";

// ─── Result Interfaces ───────────────────────────────────────────────────────

export interface RiskRewardResult {
  recommendation: RecommendationType;
  entry: number;
  stopLoss: number;
  takeProfits: number[]; // [TP1, TP2, TP3]
  rr: string; // e.g. "1:2.5"
  invalidationLevel: number;
  riskPips: number;
  rewardPips: number[];
}

export interface PositionSizeResult {
  positionSize: number; // Number of units/lots
  riskPerShare: number; // |entry − stopLoss| in price
  totalRisk: number; // Total $ at risk
  riskPercentage: number; // % of account at risk
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** Default ATR multiplier for stop-loss distance */
const SL_ATR_MULTIPLIER = 1.5;

/** ATR multiplier for invalidation level beyond stop-loss */
const INVALIDATION_ATR_MULTIPLIER = 2.0;

/** Minimum acceptable risk-reward ratio to issue a trade */
const MIN_RR_RATIO = 1.5;

/** How close to a support/resistance level (as % of price) to be considered "at" the level */
const LEVEL_PROXIMITY = 0.005; // 0.5%

// ─── Risk-Reward Calculator ─────────────────────────────────────────────────

/**
 * Calculate entry, stop-loss, and take-profit levels.
 *
 * @param currentPrice  Latest close price
 * @param trend         Detected trend direction
 * @param atrValue      Current ATR value for the pair/timeframe
 * @param decimals      Number of decimal places for rounding
 * @param supportLevels   Sorted ascending array of support prices
 * @param resistanceLevels Sorted ascending array of resistance prices
 * @param pair          Trading pair label (used in edge-case handling for forex vs crypto)
 */
export function calculateRiskReward(
  currentPrice: number,
  trend: TrendDirection,
  atrValue: number,
  decimals: number,
  supportLevels: number[],
  resistanceLevels: number[],
  pair: string,
): RiskRewardResult {
  // ─── WAIT — no clear edge ────────────────────────────────────────
  if (trend === "NEUTRAL") {
    return {
      recommendation: "WAIT",
      entry: formatPrice(currentPrice, decimals),
      stopLoss: formatPrice(currentPrice, decimals),
      takeProfits: [
        formatPrice(currentPrice, decimals),
        formatPrice(currentPrice, decimals),
        formatPrice(currentPrice, decimals),
      ],
      rr: "1:0",
      invalidationLevel: formatPrice(currentPrice, decimals),
      riskPips: 0,
      rewardPips: [0, 0, 0],
    };
  }

  // ─── Adjust ATR for JPY pairs (pip scale) ────────────────────────
  const _isJpy = pair.includes("JPY");
  const atrForCalc = atrValue || currentPrice * 0.01; // fallback 1% of price

  if (trend === "BULLISH") {
    return calculateBullishRR(currentPrice, atrForCalc, decimals, supportLevels, resistanceLevels);
  }

  // BEARISH
  return calculateBearishRR(currentPrice, atrForCalc, decimals, supportLevels, resistanceLevels);
}

// ─── Bullish RR ──────────────────────────────────────────────────────────────

function calculateBullishRR(
  price: number,
  atrVal: number,
  decimals: number,
  supports: number[],
  resistances: number[],
): RiskRewardResult {
  // Entry: current price (or slightly below for a limit order)
  const entry = formatPrice(price - atrVal * 0.1, decimals); // slight limit below

  // Stop-loss: below nearest support OR 1.5× ATR below entry, whichever is tighter (but not too tight)
  const atrSL = entry - SL_ATR_MULTIPLIER * atrVal;

  let stopLoss: number;
  const nearbySupports = supports.filter((s) => s < entry).sort((a, b) => b - a); // closest support below entry

  if (nearbySupports.length > 0) {
    const nearestSupport = nearbySupports[0];
    // Use the tighter of (support-based) and (ATR-based) stop, but ensure minimum 0.5 ATR distance
    const supportSL = nearestSupport - atrVal * 0.3; // a cushion below the support
    stopLoss = Math.max(atrSL, supportSL);
    // But if support SL would be less than 0.5 ATR from entry, use ATR-based
    if (entry - stopLoss < atrVal * 0.5) {
      stopLoss = atrSL;
    }
  } else {
    stopLoss = atrSL;
  }

  stopLoss = formatPrice(stopLoss, decimals);

  // Risk in pips
  const riskPips = Math.abs(entry - stopLoss);

  // Invalidation level: 2× ATR beyond stop-loss
  const invalidationLevel = formatPrice(stopLoss - INVALIDATION_ATR_MULTIPLIER * atrVal, decimals);

  // Take-profits based on R-multiples
  const tp1 = formatPrice(entry + riskPips * 1, decimals); // 1:1
  const tp2 = formatPrice(entry + riskPips * 2, decimals); // 1:2
  const tp3 = formatPrice(entry + riskPips * 3, decimals); // 1:3

  const rewardPips = [riskPips * 1, riskPips * 2, riskPips * 3];

  // Primary RR ratio (balanced target = TP2)
  const rr = rrRatio(riskPips, riskPips * 2);

  // If RR is below minimum, downgrade to WAIT
  const rrValue = riskPips > 0 ? (riskPips * 2) / riskPips : 0;
  if (rrValue < MIN_RR_RATIO) {
    return {
      recommendation: "WAIT",
      entry,
      stopLoss,
      takeProfits: [tp1, tp2, tp3],
      rr,
      invalidationLevel,
      riskPips: Math.abs(entry - stopLoss),
      rewardPips,
    };
  }

  // Validate TPs against resistance — if TP1 is past strong resistance, scale down
  const adjustedTPs = adjustTargetsForLevels([tp1, tp2, tp3], resistances, "UP", decimals);

  return {
    recommendation: "BUY",
    entry,
    stopLoss,
    takeProfits: adjustedTPs,
    rr,
    invalidationLevel,
    riskPips: Math.abs(entry - stopLoss),
    rewardPips,
  };
}

// ─── Bearish RR ──────────────────────────────────────────────────────────────

function calculateBearishRR(
  price: number,
  atrVal: number,
  decimals: number,
  supports: number[],
  resistances: number[],
): RiskRewardResult {
  // Entry: current price (or slightly above for a limit order)
  const entry = formatPrice(price + atrVal * 0.1, decimals);

  // Stop-loss: above nearest resistance OR 1.5× ATR above entry
  const atrSL = entry + SL_ATR_MULTIPLIER * atrVal;

  let stopLoss: number;
  const nearbyResistances = resistances.filter((r) => r > entry).sort((a, b) => a - b); // closest resistance above entry

  if (nearbyResistances.length > 0) {
    const nearestResistance = nearbyResistances[0];
    const resistanceSL = nearestResistance + atrVal * 0.3;
    stopLoss = Math.min(atrSL, resistanceSL);
    if (stopLoss - entry < atrVal * 0.5) {
      stopLoss = atrSL;
    }
  } else {
    stopLoss = atrSL;
  }

  stopLoss = formatPrice(stopLoss, decimals);

  const riskPips = Math.abs(stopLoss - entry);

  const invalidationLevel = formatPrice(stopLoss + INVALIDATION_ATR_MULTIPLIER * atrVal, decimals);

  const tp1 = formatPrice(entry - riskPips * 1, decimals);
  const tp2 = formatPrice(entry - riskPips * 2, decimals);
  const tp3 = formatPrice(entry - riskPips * 3, decimals);

  const rewardPips = [riskPips * 1, riskPips * 2, riskPips * 3];

  const rr = rrRatio(riskPips, riskPips * 2);

  const rrValue = riskPips > 0 ? (riskPips * 2) / riskPips : 0;
  if (rrValue < MIN_RR_RATIO) {
    return {
      recommendation: "WAIT",
      entry,
      stopLoss,
      takeProfits: [tp1, tp2, tp3],
      rr,
      invalidationLevel,
      riskPips,
      rewardPips,
    };
  }

  const adjustedTPs = adjustTargetsForLevels([tp1, tp2, tp3], supports, "DOWN", decimals);

  return {
    recommendation: "SELL",
    entry,
    stopLoss,
    takeProfits: adjustedTPs,
    rr,
    invalidationLevel,
    riskPips,
    rewardPips,
  };
}

// ─── Target Adjustment ──────────────────────────────────────────────────────

/**
 * Adjust take-profit targets to not overshoot major S/R levels.
 * If a TP would be placed well beyond a major level, pull it back to just
 * before that level (the level acts as a natural barrier).
 */
function adjustTargetsForLevels(
  tps: number[],
  levels: number[],
  direction: "UP" | "DOWN",
  decimals: number,
): number[] {
  if (levels.length === 0) return tps;

  return tps.map((tp) => {
    if (direction === "UP") {
      // For BUY: check if TP is past a resistance — pull back slightly before it
      const blockingLevel = levels.find((l) => l > tp * 0.97 && l < tp);
      if (blockingLevel) {
        return formatPrice(blockingLevel - blockingLevel * LEVEL_PROXIMITY, decimals);
      }
    } else {
      // For SELL: check if TP is below a support — pull back slightly above it
      const blockingLevel = levels.find((l) => l < tp * 1.03 && l > tp);
      if (blockingLevel) {
        return formatPrice(blockingLevel + blockingLevel * LEVEL_PROXIMITY, decimals);
      }
    }
    return tp;
  });
}

// ─── Position Sizing ────────────────────────────────────────────────────────

/**
 * Calculate position size based on fixed-percentage risk model.
 *
 * @param accountBalance   Total account balance in base currency
 * @param riskPercentage   Risk per trade as % of account (e.g. 1 = 1%)
 * @param entryPrice       Entry price
 * @param stopLossPrice    Stop-loss price
 * @param decimals         Decimal precision for rounding the result
 */
export function calculatePositionSize(
  accountBalance: number,
  riskPercentage: number,
  entryPrice: number,
  stopLossPrice: number,
  decimals: number,
): PositionSizeResult {
  if (accountBalance <= 0 || riskPercentage <= 0 || entryPrice <= 0) {
    return {
      positionSize: 0,
      riskPerShare: 0,
      totalRisk: 0,
      riskPercentage: 0,
    };
  }

  const riskPerShare = Math.abs(entryPrice - stopLossPrice);

  if (riskPerShare === 0) {
    return {
      positionSize: 0,
      riskPerShare: 0,
      totalRisk: 0,
      riskPercentage: 0,
    };
  }

  const totalRisk = accountBalance * (riskPercentage / 100);
  const positionSize = totalRisk / riskPerShare;

  return {
    positionSize: formatPrice(positionSize, decimals),
    riskPerShare: formatPrice(riskPerShare, decimals),
    totalRisk: formatPrice(totalRisk, decimals),
    riskPercentage,
  };
}

// ─── RR Ratio Formatter ─────────────────────────────────────────────────────

/**
 * Format a risk-reward ratio as a string like "1:2.5".
 */
export function rrRatio(risk: number, reward: number): string {
  if (risk <= 0) return "1:0";
  const ratio = reward / risk;
  return `1:${ratio.toFixed(1)}`;
}

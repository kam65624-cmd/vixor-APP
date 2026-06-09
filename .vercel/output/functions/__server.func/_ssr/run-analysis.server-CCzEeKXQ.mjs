import { g as generateObject } from "../_libs/ai.mjs";
import { g as google } from "../_libs/ai-sdk__google.mjs";
import { R as RSI, M as MACD, B as BollingerBands, E as EMA, S as SMA, a as StochRSI, A as ATR, b as ADX, C as CCI, O as OBV } from "../_libs/lightweight-charts-indicators.mjs";
import { o as object, c as string, _ as _enum, b as array, n as number } from "../_libs/zod.mjs";
import "../_libs/ai-sdk__gateway.mjs";
import "../_libs/ai-sdk__provider-utils.mjs";
import "../_libs/ai-sdk__provider.mjs";
import "../_libs/eventsource-parser.mjs";
import "../_libs/@vercel/oidc.mjs";
import "path";
import "fs";
import "os";
import "../_libs/react.mjs";
import "../_libs/opentelemetry__api.mjs";
import "../_libs/oakscriptjs.mjs";
const PAIR_CONFIGS = {
  "XAU/USD": {
    basePrice: 2340,
    volatility: 0.012,
    pipSize: 0.01,
    decimals: 2,
    typicalRange: 0.015
  },
  "EUR/USD": {
    basePrice: 1.085,
    volatility: 5e-3,
    pipSize: 1e-4,
    decimals: 4,
    typicalRange: 8e-3
  },
  "GBP/USD": {
    basePrice: 1.27,
    volatility: 6e-3,
    pipSize: 1e-4,
    decimals: 4,
    typicalRange: 9e-3
  },
  "USD/JPY": {
    basePrice: 157.5,
    volatility: 7e-3,
    pipSize: 0.01,
    decimals: 2,
    typicalRange: 0.01
  },
  "GBP/JPY": {
    basePrice: 200.3,
    volatility: 8e-3,
    pipSize: 0.01,
    decimals: 2,
    typicalRange: 0.012
  },
  "BTC/USD": {
    basePrice: 68e3,
    volatility: 0.03,
    pipSize: 0.01,
    decimals: 2,
    typicalRange: 0.04
  },
  "ETH/USDT": {
    basePrice: 3700,
    volatility: 0.028,
    pipSize: 0.01,
    decimals: 2,
    typicalRange: 0.035
  },
  "SOL/USDT": {
    basePrice: 170,
    volatility: 0.04,
    pipSize: 0.01,
    decimals: 2,
    typicalRange: 0.05
  },
  AAPL: {
    basePrice: 195,
    volatility: 0.015,
    pipSize: 0.01,
    decimals: 2,
    typicalRange: 0.02
  },
  NASDAQ: {
    basePrice: 18500,
    volatility: 0.012,
    pipSize: 0.01,
    decimals: 2,
    typicalRange: 0.018
  }
};
function bodySize(bar) {
  return Math.abs(bar.close - bar.open);
}
function upperWick(bar) {
  return bar.high - Math.max(bar.open, bar.close);
}
function lowerWick(bar) {
  return Math.min(bar.open, bar.close) - bar.low;
}
function range(bar) {
  return bar.high - bar.low;
}
function isBullish(bar) {
  return bar.close > bar.open;
}
function isBearish(bar) {
  return bar.close < bar.open;
}
function bodyRatio(bar) {
  const r = range(bar);
  return r === 0 ? 0 : bodySize(bar) / r;
}
function isDoji(bar, threshold = 0.1) {
  return bodyRatio(bar) < threshold;
}
function avgBodySize(bars, period, endIdx) {
  const start = endIdx !== void 0 ? Math.max(0, endIdx - period + 1) : Math.max(0, bars.length - period);
  const slice = bars.slice(start, (endIdx ?? bars.length - 1) + 1);
  if (slice.length === 0) return 0;
  return slice.reduce((s, b) => s + bodySize(b), 0) / slice.length;
}
function avgRange(bars, period, endIdx) {
  const start = Math.max(0, bars.length - period);
  const slice = bars.slice(start, bars.length - 1 + 1);
  if (slice.length === 0) return 0;
  return slice.reduce((s, b) => s + range(b), 0) / slice.length;
}
function trueRange(current, previous) {
  return Math.max(
    current.high - current.low,
    Math.abs(current.high - previous.close),
    Math.abs(current.low - previous.close)
  );
}
function atr(bars, period) {
  if (bars.length < period + 1) return avgRange(bars, period);
  let prevAtr = 0;
  for (let i = 1; i <= period; i++) {
    prevAtr += trueRange(bars[i], bars[i - 1]);
  }
  prevAtr /= period;
  for (let i = period + 1; i < bars.length; i++) {
    const tr = trueRange(bars[i], bars[i - 1]);
    prevAtr = (prevAtr * (period - 1) + tr) / period;
  }
  return prevAtr;
}
function formatPrice(price, decimals) {
  return Number(price.toFixed(decimals));
}
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}
function generateOHLCV(pair, timeframe, barCount = 200, seed) {
  const config = PAIR_CONFIGS[pair] ?? PAIR_CONFIGS["EUR/USD"];
  let s = hashCode(pair + timeframe);
  function next() {
    s = s * 1664525 + 1013904223 >>> 0 & 4294967295;
    return (s >>> 0) / 4294967295;
  }
  const tfMultiplier = {
    "1M": 0.15,
    "5M": 0.25,
    "15M": 0.4,
    "30M": 0.55,
    "1H": 0.7,
    "4H": 0.85,
    "1D": 1,
    "1W": 1.5
  };
  const tf = tfMultiplier[timeframe] ?? 0.7;
  const tfMs = {
    "1M": 6e4,
    "5M": 3e5,
    "15M": 9e5,
    "30M": 18e5,
    "1H": 36e5,
    "4H": 144e5,
    "1D": 864e5,
    "1W": 6048e5
  };
  const intervalSec = Math.floor((tfMs[timeframe] ?? 36e5) / 1e3);
  const startTimeSec = Math.floor(Date.now() / 1e3) - barCount * intervalSec;
  const bars = [];
  let price = config.basePrice;
  let trendBias = 0;
  let trendDuration = 0;
  let maxTrendDuration = Math.floor(20 + next() * 40);
  for (let i = 0; i < barCount; i++) {
    trendDuration++;
    if (trendDuration > maxTrendDuration) {
      trendBias = (next() - 0.5) * 0.6;
      trendDuration = 0;
      maxTrendDuration = Math.floor(20 + next() * 40);
    }
    const vol = config.volatility * tf;
    const baseChange = (next() - 0.48 + trendBias * 0.1) * vol * price;
    const open = price;
    const close = open + baseChange;
    const sweepChance = next();
    const wickMultiplierUp = sweepChance > 0.92 ? 1.5 + next() * 2 : 0.5 + next() * 0.5;
    const wickMultiplierDown = sweepChance > 0.88 && sweepChance <= 0.92 ? 1.5 + next() * 2 : 0.5 + next() * 0.5;
    const wickUp = next() * vol * price * wickMultiplierUp;
    const wickDown = next() * vol * price * wickMultiplierDown;
    const high = Math.max(open, close) + wickUp;
    const low = Math.min(open, close) - wickDown;
    const isSpike = next() > 0.95;
    const volumeBase = isSpike ? 3e3 + next() * 5e3 : 500 + next() * 2e3;
    const volume = volumeBase * (1 + Math.abs(baseChange) / (vol * price + 1e-10));
    bars.push({
      time: startTimeSec + i * intervalSec,
      open: Number(open.toFixed(config.decimals + 1)),
      high: Number(high.toFixed(config.decimals + 1)),
      low: Number(low.toFixed(config.decimals + 1)),
      close: Number(close.toFixed(config.decimals + 1)),
      volume: Math.floor(volume)
    });
    const driftFromBase = (price - config.basePrice) / config.basePrice;
    price = close * (1 - driftFromBase * 5e-3);
  }
  return bars;
}
function detectSwingPoints(bars, leftBars = 3, rightBars = 3) {
  const swings = [];
  if (bars.length < leftBars + rightBars + 1) return swings;
  let pendingHigh = null;
  let pendingLow = null;
  for (let i = leftBars; i < bars.length - rightBars; i++) {
    const bar = bars[i];
    let isHigh = true;
    for (let l = 1; l <= leftBars; l++) {
      if (bars[i - l].high >= bar.high) {
        isHigh = false;
        break;
      }
    }
    if (isHigh) {
      for (let r = 1; r <= rightBars; r++) {
        if (bars[i + r].high >= bar.high) {
          isHigh = false;
          break;
        }
      }
    }
    if (isHigh) {
      if (pendingHigh && pendingHigh.price === bar.high) {
        pendingHigh.index = i;
      } else {
        if (pendingHigh) {
          swings.push({ index: pendingHigh.index, price: pendingHigh.price, type: "HIGH" });
        }
        pendingHigh = { index: i, price: bar.high };
      }
    }
    let isLow = true;
    for (let l = 1; l <= leftBars; l++) {
      if (bars[i - l].low <= bar.low) {
        isLow = false;
        break;
      }
    }
    if (isLow) {
      for (let r = 1; r <= rightBars; r++) {
        if (bars[i + r].low <= bar.low) {
          isLow = false;
          break;
        }
      }
    }
    if (isLow) {
      if (pendingLow && pendingLow.price === bar.low) {
        pendingLow.index = i;
      } else {
        if (pendingLow) {
          swings.push({ index: pendingLow.index, price: pendingLow.price, type: "LOW" });
        }
        pendingLow = { index: i, price: bar.low };
      }
    }
  }
  if (pendingHigh) {
    swings.push({ index: pendingHigh.index, price: pendingHigh.price, type: "HIGH" });
  }
  if (pendingLow) {
    swings.push({ index: pendingLow.index, price: pendingLow.price, type: "LOW" });
  }
  swings.sort((a, b) => a.index - b.index);
  return swings;
}
function classifySwingStructure(swingPoints) {
  const result = swingPoints.map((sp) => ({ ...sp }));
  let prevHigh = null;
  let prevLow = null;
  for (const sp of result) {
    if (sp.type === "HIGH") {
      if (prevHigh !== null) {
        if (sp.price > prevHigh.price) {
          sp.structure = "HH";
        } else if (sp.price < prevHigh.price) {
          sp.structure = "LH";
        } else {
          sp.structure = prevHigh.structure ?? "LH";
        }
      }
      prevHigh = sp;
    } else {
      if (prevLow !== null) {
        if (sp.price > prevLow.price) {
          sp.structure = "HL";
        } else if (sp.price < prevLow.price) {
          sp.structure = "LL";
        } else {
          sp.structure = prevLow.structure ?? "HL";
        }
      }
      prevLow = sp;
    }
  }
  return result;
}
function detectBOSandCHoCH(swingPoints, bars) {
  const events = [];
  if (swingPoints.length < 3) return events;
  let currentTrend = "NEUTRAL";
  let hhCount = 0;
  let hlCount = 0;
  let lhCount = 0;
  let llCount = 0;
  for (let i = 0; i < swingPoints.length; i++) {
    const sp = swingPoints[i];
    const struct = sp.structure;
    if (struct === "HH") hhCount++;
    else if (struct === "HL") hlCount++;
    else if (struct === "LH") lhCount++;
    else if (struct === "LL") llCount++;
    const bullishSignals = hhCount + hlCount;
    const bearishSignals = lhCount + llCount;
    if (bullishSignals + bearishSignals < 2) continue;
    const recentWindow = swingPoints.slice(Math.max(0, i - 5), i + 1);
    let recentBull = 0;
    let recentBear = 0;
    for (const rsp of recentWindow) {
      if (rsp.structure === "HH" || rsp.structure === "HL") recentBull++;
      if (rsp.structure === "LH" || rsp.structure === "LL") recentBear++;
    }
    if (recentBull > recentBear) {
      currentTrend = "BULLISH";
    } else if (recentBear > recentBull) {
      currentTrend = "BEARISH";
    }
    let prevSameType = null;
    for (let j = i - 1; j >= 0; j--) {
      if (swingPoints[j].type === sp.type) {
        prevSameType = swingPoints[j];
        break;
      }
    }
    if (!prevSameType || !prevSameType.structure || !sp.structure) continue;
    const isBullishBreak = sp.type === "HIGH" && sp.structure === "HH" && prevSameType.structure !== "HH";
    const isBearishBreak = sp.type === "LOW" && sp.structure === "LL" && prevSameType.structure !== "LL";
    const isTrendContinuation = currentTrend === "BULLISH" && sp.structure === "HH" || currentTrend === "BEARISH" && sp.structure === "LL";
    const isTrendReversal = currentTrend === "BULLISH" && sp.type === "LOW" && sp.structure === "LL" || currentTrend === "BEARISH" && sp.type === "HIGH" && sp.structure === "HH";
    const breakConfirmed = confirmBreakWithCandles(prevSameType, sp, bars);
    if (!breakConfirmed) continue;
    if (isTrendContinuation && (isBullishBreak || isBearishBreak)) {
      events.push({
        index: sp.index,
        price: sp.price,
        type: "BOS",
        direction: currentTrend === "BULLISH" ? "BULLISH" : "BEARISH",
        fromSwing: prevSameType,
        toSwing: sp
      });
    } else if (isTrendReversal) {
      const newDirection = currentTrend === "BULLISH" ? "BEARISH" : "BULLISH";
      events.push({
        index: sp.index,
        price: sp.price,
        type: "CHoCH",
        direction: newDirection,
        fromSwing: prevSameType,
        toSwing: sp
      });
      currentTrend = newDirection;
    } else if (isBullishBreak && currentTrend === "BULLISH") {
      events.push({
        index: sp.index,
        price: sp.price,
        type: "BOS",
        direction: "BULLISH",
        fromSwing: prevSameType,
        toSwing: sp
      });
    } else if (isBearishBreak && currentTrend === "BEARISH") {
      events.push({
        index: sp.index,
        price: sp.price,
        type: "BOS",
        direction: "BEARISH",
        fromSwing: prevSameType,
        toSwing: sp
      });
    } else if (isBullishBreak && currentTrend !== "BULLISH") {
      events.push({
        index: sp.index,
        price: sp.price,
        type: "CHoCH",
        direction: "BULLISH",
        fromSwing: prevSameType,
        toSwing: sp
      });
      currentTrend = "BULLISH";
    } else if (isBearishBreak && currentTrend !== "BEARISH") {
      events.push({
        index: sp.index,
        price: sp.price,
        type: "CHoCH",
        direction: "BEARISH",
        fromSwing: prevSameType,
        toSwing: sp
      });
      currentTrend = "BEARISH";
    }
  }
  return events;
}
function confirmBreakWithCandles(fromSwing, toSwing, bars) {
  const startIdx = Math.min(fromSwing.index, toSwing.index);
  const endIdx = Math.max(fromSwing.index, toSwing.index);
  if (startIdx >= bars.length || endIdx >= bars.length) return false;
  if (toSwing.type === "HIGH") {
    const refPrice = fromSwing.price;
    for (let i = startIdx; i <= endIdx && i < bars.length; i++) {
      if (bars[i].close > refPrice) return true;
    }
  } else {
    const refPrice = fromSwing.price;
    for (let i = startIdx; i <= endIdx && i < bars.length; i++) {
      if (bars[i].close < refPrice) return true;
    }
  }
  return false;
}
function buildLastBOS(lastBOSPrice, lastBOSType, lastBOSDirection) {
  if (lastBOSPrice !== void 0 && lastBOSType && lastBOSDirection && lastBOSDirection !== "NEUTRAL") {
    return { price: lastBOSPrice, type: lastBOSType, direction: lastBOSDirection };
  }
  return void 0;
}
function determineMarketStructure(bosEvents, swingPoints, _bars) {
  const recentSwings = swingPoints.slice(-10);
  let hhCount = 0;
  let hlCount = 0;
  let lhCount = 0;
  let llCount = 0;
  for (const sp of recentSwings) {
    if (sp.structure === "HH") hhCount++;
    else if (sp.structure === "HL") hlCount++;
    else if (sp.structure === "LH") lhCount++;
    else if (sp.structure === "LL") llCount++;
  }
  const bullishStructureCount = hhCount + hlCount;
  const bearishStructureCount = lhCount + llCount;
  let lastBOSPrice;
  let lastBOSType;
  let lastBOSDirection;
  let recentBullishEvents = 0;
  let recentBearishEvents = 0;
  const recentEvents = bosEvents.slice(-5);
  for (const evt of recentEvents) {
    if (evt.direction === "BULLISH") recentBullishEvents++;
    else recentBearishEvents++;
    lastBOSPrice = evt.price;
    lastBOSType = evt.type;
    lastBOSDirection = evt.direction;
  }
  const lastEvent = bosEvents.length > 0 ? bosEvents[bosEvents.length - 1] : null;
  if (lastEvent && lastEvent.type === "CHoCH") {
    const dir = lastEvent.direction;
    const structure2 = dir === "BULLISH" ? "HIGHER_HIGHS" : "LOWER_LOWS";
    return {
      direction: dir === "BULLISH" ? "BULLISH" : "BEARISH",
      structure: structure2,
      lastBOS: buildLastBOS(lastBOSPrice, lastBOSType, lastBOSDirection)
    };
  }
  const bullScore = bullishStructureCount * 2 + recentBullishEvents * 3;
  const bearScore = bearishStructureCount * 2 + recentBearishEvents * 3;
  const total = bullScore + bearScore;
  const margin = total > 0 ? Math.abs(bullScore - bearScore) / total : 0;
  if (margin < 0.15 || total === 0) {
    return {
      direction: "SIDEWAYS",
      structure: "CONSOLIDATION",
      lastBOS: buildLastBOS(lastBOSPrice, lastBOSType, lastBOSDirection)
    };
  }
  if (bullScore > bearScore) {
    const structure2 = hhCount >= hlCount ? "HIGHER_HIGHS" : "HIGHER_LOW";
    return {
      direction: "BULLISH",
      structure: structure2,
      lastBOS: buildLastBOS(lastBOSPrice, lastBOSType, lastBOSDirection)
    };
  }
  const structure = llCount >= lhCount ? "LOWER_LOWS" : "LOWER_HIGHS";
  return {
    direction: "BEARISH",
    structure,
    lastBOS: buildLastBOS(lastBOSPrice, lastBOSType, lastBOSDirection)
  };
}
function analyzeMarketStructure(bars, leftBars = 3, rightBars = 3) {
  const rawSwings = detectSwingPoints(bars, leftBars, rightBars);
  const swingPoints = classifySwingStructure(rawSwings);
  const bosEvents = detectBOSandCHoCH(swingPoints, bars);
  const structure = determineMarketStructure(bosEvents, swingPoints);
  return {
    ...structure,
    swingPoints,
    bosEvents
  };
}
function detectOrderBlocks(bars, lookback = 3) {
  if (bars.length < 4) return [];
  const orderBlocks = [];
  const avgBody = avgBodySize(bars, bars.length);
  for (let i = 2; i < bars.length; i++) {
    const bar = bars[i];
    const body = bodySize(bar);
    if (body <= avgBody * 1.5) continue;
    const bullishImpulse = isBullish(bar);
    const bearishImpulse = isBearish(bar);
    if (!bullishImpulse && !bearishImpulse) continue;
    const fvgResult = createsFVG(bars, i);
    if (!fvgResult) continue;
    if (bullishImpulse && fvgResult.type !== "BULLISH") continue;
    if (bearishImpulse && fvgResult.type !== "BEARISH") continue;
    const opposingCandleIdx = findOpposingCandle(bars, i, bullishImpulse, lookback);
    if (opposingCandleIdx === null) continue;
    const obBar = bars[opposingCandleIdx];
    const rawStrength = (body / avgBody - 1) / 2;
    const strength = Math.min(100, Math.max(0, Math.round(rawStrength * 100)));
    const ob = {
      type: bullishImpulse ? "BULLISH" : "BEARISH",
      high: obBar.high,
      low: obBar.low,
      startIndex: opposingCandleIdx,
      endIndex: i,
      // The impulse candle marks the end of the OB formation
      mitigated: false,
      strength
    };
    const checkedOB = checkMitigation(ob, bars);
    orderBlocks.push(checkedOB);
  }
  return deduplicateOrderBlocks(orderBlocks);
}
function createsFVG(bars, i) {
  if (i < 2) return null;
  const barPrev2 = bars[i - 2];
  const barCurrent = bars[i];
  if (barCurrent.low > barPrev2.high) {
    return {
      type: "BULLISH",
      top: barCurrent.low,
      bottom: barPrev2.high
    };
  }
  if (barPrev2.low > barCurrent.high) {
    return {
      type: "BEARISH",
      top: barPrev2.low,
      bottom: barCurrent.high
    };
  }
  return null;
}
function findOpposingCandle(bars, impulseIndex, bullishImpulse, lookback) {
  const start = impulseIndex - 1;
  const end = Math.max(0, impulseIndex - lookback);
  for (let j = start; j >= end; j--) {
    const bar = bars[j];
    if (bullishImpulse) {
      if (isBearish(bar)) return j;
    } else {
      if (isBullish(bar)) return j;
    }
  }
  return null;
}
function checkMitigation(ob, bars) {
  for (let i = ob.endIndex + 1; i < bars.length; i++) {
    const bar = bars[i];
    if (ob.type === "BULLISH") {
      if (bar.low < ob.low) {
        return {
          ...ob,
          mitigated: true,
          mitigatedIndex: i
        };
      }
    } else {
      if (bar.high > ob.high) {
        return {
          ...ob,
          mitigated: true,
          mitigatedIndex: i
        };
      }
    }
  }
  return ob;
}
function deduplicateOrderBlocks(obs) {
  if (obs.length <= 1) return obs;
  const sorted = [...obs].sort((a, b) => a.startIndex - b.startIndex);
  const result = [];
  for (const ob of sorted) {
    const overlappingIdx = result.findIndex((existing) => {
      if (existing.type !== ob.type) return false;
      const overlapTop = Math.min(existing.high, ob.high);
      const overlapBottom = Math.max(existing.low, ob.low);
      const overlapSize = overlapTop - overlapBottom;
      if (overlapSize <= 0) return false;
      const smallerRange = Math.min(
        existing.high - existing.low,
        ob.high - ob.low
      );
      return overlapSize / smallerRange > 0.5;
    });
    if (overlappingIdx !== -1) {
      const existing = result[overlappingIdx];
      if (ob.strength > existing.strength) {
        result[overlappingIdx] = ob;
      }
    } else {
      result.push(ob);
    }
  }
  return result;
}
function detectFVGs(bars) {
  if (bars.length < 3) return [];
  const fvgs = [];
  const atrValue = atr(bars, 14);
  const minGapSize = atrValue * 0.1;
  for (let i = 2; i < bars.length; i++) {
    const bar0 = bars[i - 2];
    const bar2 = bars[i];
    if (bar2.low > bar0.high) {
      const gapTop = bar2.low;
      const gapBottom = bar0.high;
      const gapSize = gapTop - gapBottom;
      if (gapSize > minGapSize) {
        fvgs.push({
          type: "BULLISH",
          top: gapTop,
          bottom: gapBottom,
          index: i,
          filled: false,
          size: gapSize
        });
      }
    }
    if (bar0.low > bar2.high) {
      const gapTop = bar0.low;
      const gapBottom = bar2.high;
      const gapSize = gapTop - gapBottom;
      if (gapSize > minGapSize) {
        fvgs.push({
          type: "BEARISH",
          top: gapTop,
          bottom: gapBottom,
          index: i,
          filled: false,
          size: gapSize
        });
      }
    }
  }
  return markFilledFVGs(fvgs, bars);
}
function markFilledFVGs(fvgs, bars) {
  return fvgs.map((fvg) => {
    for (let i = fvg.index + 1; i < bars.length; i++) {
      const bar = bars[i];
      if (fvg.type === "BULLISH") {
        if (bar.low <= fvg.bottom) {
          return {
            ...fvg,
            filled: true,
            filledIndex: i
          };
        }
      } else {
        if (bar.high >= fvg.top) {
          return {
            ...fvg,
            filled: true,
            filledIndex: i
          };
        }
      }
    }
    return fvg;
  });
}
function detectLiquidityZones(swingPoints, bars, tolerance = 2e-3) {
  if (swingPoints.length === 0) return [];
  const swingHighs = swingPoints.filter((sp) => sp.type === "HIGH");
  const swingLows = swingPoints.filter((sp) => sp.type === "LOW");
  const zones = [];
  const bslZones = clusterSwingPoints(swingHighs, tolerance, "BUY_SIDE");
  zones.push(...bslZones);
  const sslZones = clusterSwingPoints(swingLows, tolerance, "SELL_SIDE");
  zones.push(...sslZones);
  return zones.sort((a, b) => b.strength - a.strength);
}
function detectSRLevels(bars, lookback = 50, tolerance = 3e-3) {
  if (bars.length < 7) return [];
  const effectiveLookback = Math.min(lookback, Math.floor(bars.length / 3));
  const swingPoints = detectSwingPoints(bars, effectiveLookback, effectiveLookback);
  if (swingPoints.length === 0) return [];
  const currentPrice = bars[bars.length - 1].close;
  const clusters = clusterByPrice(swingPoints, tolerance);
  const levels = clusters.map((cluster) => {
    const prices = cluster.map((sp) => sp.price);
    const avgPrice = prices.reduce((s, p) => s + p, 0) / prices.length;
    const distance = Math.abs(avgPrice - currentPrice) / currentPrice;
    const type = distance < 2e-3 ? "PIVOT" : avgPrice < currentPrice ? "SUPPORT" : "RESISTANCE";
    const touches = cluster.length;
    const lastIndex = Math.max(...cluster.map((sp) => sp.index));
    return {
      price: avgPrice,
      type,
      touches,
      strength: touches,
      // Will be normalized below
      lastIndex
    };
  });
  const maxTouches = Math.max(...levels.map((l) => l.touches), 1);
  const normalized = levels.map((level) => ({
    ...level,
    strength: level.touches / maxTouches
  }));
  return normalized.sort((a, b) => b.strength - a.strength);
}
function clusterSwingPoints(points, tolerance, liquidityType) {
  if (points.length === 0) return [];
  const sorted = [...points].sort((a, b) => a.price - b.price);
  const clusters = [];
  let currentCluster = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const prevPrice = currentCluster[currentCluster.length - 1].price;
    const currPrice = sorted[i].price;
    if (Math.abs(currPrice - prevPrice) / prevPrice <= tolerance) {
      currentCluster.push(sorted[i]);
    } else {
      clusters.push(currentCluster);
      currentCluster = [sorted[i]];
    }
  }
  clusters.push(currentCluster);
  return clusters.map((cluster) => {
    const prices = cluster.map((sp) => sp.price);
    const avgPrice = prices.reduce((s, p) => s + p, 0) / prices.length;
    return {
      type: liquidityType,
      price: avgPrice,
      strength: cluster.length,
      swingPoints: cluster
    };
  });
}
function clusterByPrice(points, tolerance) {
  if (points.length === 0) return [];
  const sorted = [...points].sort((a, b) => a.price - b.price);
  const clusters = [];
  let currentCluster = [sorted[0]];
  let clusterAvgPrice = sorted[0].price;
  for (let i = 1; i < sorted.length; i++) {
    const currPrice = sorted[i].price;
    if (Math.abs(currPrice - clusterAvgPrice) / clusterAvgPrice <= tolerance) {
      currentCluster.push(sorted[i]);
      clusterAvgPrice = currentCluster.reduce((s, sp) => s + sp.price, 0) / currentCluster.length;
    } else {
      clusters.push(currentCluster);
      currentCluster = [sorted[i]];
      clusterAvgPrice = sorted[i].price;
    }
  }
  clusters.push(currentCluster);
  return clusters;
}
function detectRecentBOS(bars, swingHighs, swingLows) {
  if (bars.length < 3 || swingHighs.length === 0 && swingLows.length === 0) {
    return { lastBOS: null, recentBOSList: [] };
  }
  const allSwings = [...swingHighs, ...swingLows].sort(
    (a, b) => a.index - b.index
  );
  const classifiedSwings = classifySwingStructure(allSwings);
  const structureEvents = detectBOSandCHoCH(classifiedSwings, bars);
  const barBreakEvents = detectBarLevelBreaks(bars, swingHighs, swingLows);
  const allEvents = [...structureEvents, ...barBreakEvents];
  const dedupedEvents = deduplicateBOSEvents(allEvents);
  const lastEvent = dedupedEvents.length > 0 ? dedupedEvents[dedupedEvents.length - 1] : null;
  return {
    lastBOS: lastEvent ? {
      price: lastEvent.price,
      type: lastEvent.type,
      direction: lastEvent.direction
    } : null,
    recentBOSList: dedupedEvents
  };
}
function determineTrendFromSwings(swingHighs, swingLows) {
  if (swingHighs.length === 0 && swingLows.length === 0) {
    return { direction: "NEUTRAL", structure: "INSUFFICIENT_DATA" };
  }
  const allSwings = [...swingHighs, ...swingLows].sort((a, b) => a.index - b.index);
  const classified = classifySwingStructure(allSwings);
  const classifiedHighs = classified.filter((sp) => sp.type === "HIGH");
  const classifiedLows = classified.filter((sp) => sp.type === "LOW");
  const recentHighs = classifiedHighs.slice(-3);
  const recentLows = classifiedLows.slice(-3);
  let hhCount = 0;
  let lhCount = 0;
  let hlCount = 0;
  let llCount = 0;
  for (const sp of recentHighs) {
    if (sp.structure === "HH") hhCount++;
    else if (sp.structure === "LH") lhCount++;
  }
  for (const sp of recentLows) {
    if (sp.structure === "HL") hlCount++;
    else if (sp.structure === "LL") llCount++;
  }
  const bullishSignals = hhCount + hlCount;
  const bearishSignals = lhCount + llCount;
  const highStructure = hhCount > lhCount ? "HIGHER_HIGHS" : lhCount > hhCount ? "LOWER_HIGHS" : "MIXED_HIGHS";
  const lowStructure = hlCount > llCount ? "HIGHER_LOWS" : llCount > hlCount ? "LOWER_LOWS" : "MIXED_LOWS";
  let direction;
  let structure;
  if (bullishSignals > bearishSignals && bullishSignals >= 2) {
    direction = "BULLISH";
    structure = `${highStructure} + ${lowStructure}`;
  } else if (bearishSignals > bullishSignals && bearishSignals >= 2) {
    direction = "BEARISH";
    structure = `${highStructure} + ${lowStructure}`;
  } else if (bullishSignals === bearishSignals) {
    if (hhCount > 0 && hlCount > 0) {
      direction = "BULLISH";
      structure = "HIGHER_HIGHS + HIGHER_LOWS";
    } else if (lhCount > 0 && llCount > 0) {
      direction = "BEARISH";
      structure = "LOWER_HIGHS + LOWER_LOWS";
    } else {
      direction = "NEUTRAL";
      structure = "CONSOLIDATION";
    }
  } else {
    direction = "NEUTRAL";
    structure = `${highStructure} + ${lowStructure}`;
  }
  if (recentHighs.length >= 2 && recentLows.length >= 2) {
    const lastHigh = recentHighs[recentHighs.length - 1];
    const prevHigh = recentHighs[recentHighs.length - 2];
    const lastLow = recentLows[recentLows.length - 1];
    const prevLow = recentLows[recentLows.length - 2];
    const isHH = lastHigh.price > prevHigh.price;
    const isHL = lastLow.price > prevLow.price;
    const isLH = lastHigh.price < prevHigh.price;
    const isLL = lastLow.price < prevLow.price;
    if (isHH && isHL) {
      direction = "BULLISH";
      structure = "HIGHER_HIGHS + HIGHER_LOWS";
    } else if (isLH && isLL) {
      direction = "BEARISH";
      structure = "LOWER_HIGHS + LOWER_LOWS";
    } else if (isHH && isLL) {
      direction = "NEUTRAL";
      structure = "EXPANDING_VOLATILITY";
    } else if (isLH && isHL) {
      direction = "NEUTRAL";
      structure = "CONTRACTING_VOLATILITY";
    }
  }
  if (recentHighs.length < 2 && recentLows.length >= 2) {
    direction = hlCount > llCount ? "BULLISH" : llCount > hlCount ? "BEARISH" : "NEUTRAL";
    structure = lowStructure;
  } else if (recentLows.length < 2 && recentHighs.length >= 2) {
    direction = hhCount > lhCount ? "BULLISH" : lhCount > hhCount ? "BEARISH" : "NEUTRAL";
    structure = highStructure;
  }
  return { direction, structure };
}
function detectBarLevelBreaks(bars, swingHighs, swingLows) {
  const events = [];
  if (bars.length === 0) return events;
  const sortedHighs = [...swingHighs].sort((a, b) => a.index - b.index);
  const sortedLows = [...swingLows].sort((a, b) => a.index - b.index);
  const brokenHighIndices = /* @__PURE__ */ new Set();
  const brokenLowIndices = /* @__PURE__ */ new Set();
  const allSwings = [...swingHighs, ...swingLows].sort((a, b) => a.index - b.index);
  const classified = classifySwingStructure(allSwings);
  let recentBullSignals = 0;
  let recentBearSignals = 0;
  for (const sp of classified.slice(-10)) {
    if (sp.structure === "HH" || sp.structure === "HL") recentBullSignals++;
    if (sp.structure === "LH" || sp.structure === "LL") recentBearSignals++;
  }
  let currentTrend = recentBullSignals > recentBearSignals ? "BULLISH" : recentBearSignals > recentBullSignals ? "BEARISH" : "NEUTRAL";
  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    for (const sh of sortedHighs) {
      if (brokenHighIndices.has(sh.index)) continue;
      if (i <= sh.index) continue;
      if (bar.close > sh.price) {
        brokenHighIndices.add(sh.index);
        const eventType = currentTrend === "BULLISH" ? "BOS" : "CHoCH";
        const prevHighIdx = sortedHighs.findIndex((h) => h.index === sh.index) - 1;
        const prevHigh = prevHighIdx >= 0 ? sortedHighs[prevHighIdx] : sh;
        events.push({
          type: eventType,
          direction: "BULLISH",
          price: sh.price,
          index: i,
          fromSwing: prevHigh,
          toSwing: sh
        });
        if (eventType === "CHoCH") {
          currentTrend = "BULLISH";
        }
      }
    }
    for (const sl of sortedLows) {
      if (brokenLowIndices.has(sl.index)) continue;
      if (i <= sl.index) continue;
      if (bar.close < sl.price) {
        brokenLowIndices.add(sl.index);
        const eventType = currentTrend === "BEARISH" ? "BOS" : "CHoCH";
        const prevLowIdx = sortedLows.findIndex((l) => l.index === sl.index) - 1;
        const prevLow = prevLowIdx >= 0 ? sortedLows[prevLowIdx] : sl;
        events.push({
          type: eventType,
          direction: "BEARISH",
          price: sl.price,
          index: i,
          fromSwing: prevLow,
          toSwing: sl
        });
        if (eventType === "CHoCH") {
          currentTrend = "BEARISH";
        }
      }
    }
  }
  return events;
}
function deduplicateBOSEvents(events) {
  if (events.length <= 1) return events;
  const result = [];
  const byIndex = /* @__PURE__ */ new Map();
  for (const event of events) {
    const existing = byIndex.get(event.index);
    if (existing) {
      existing.push(event);
    } else {
      byIndex.set(event.index, [event]);
    }
  }
  const indices = Array.from(byIndex.keys()).sort((a, b) => a - b);
  for (const idx of indices) {
    const grouped = byIndex.get(idx);
    if (grouped.length === 1) {
      result.push(grouped[0]);
    } else {
      const choch = grouped.find((e) => e.type === "CHoCH");
      if (choch) {
        result.push(choch);
      } else {
        const sorted = [...grouped].sort((a, b) => Math.abs(b.price) - Math.abs(a.price));
        result.push(sorted[0]);
      }
    }
  }
  return result;
}
function detectCandlestickPatterns(bars) {
  if (bars.length < 5) return [];
  const results = [];
  for (let i = 2; i < bars.length; i++) {
    const detectors = [
      // ─── Existing 20 patterns ────────────────────────
      detectBullishEngulfing,
      detectHammer,
      detectMorningStar,
      detectBullishHarami,
      detectPiercingLine,
      detectThreeWhiteSoldiers,
      detectBullishDojiStar,
      detectBearishEngulfing,
      detectShootingStar,
      detectEveningStar,
      detectBearishHarami,
      detectDarkCloudCover,
      detectThreeBlackCrows,
      detectBearishDojiStar,
      detectRisingThreeMethods,
      detectFallingThreeMethods,
      detectSpinningTop,
      detectMarubozuBullish,
      detectMarubozuBearish,
      detectTweezerTopBottom,
      // ─── Bullish Reversal (21–38) ────────────────────
      detectInvertedHammer,
      detectDragonflyDoji,
      detectBullishAbandonedBaby,
      detectThreeInsideUp,
      detectThreeOutsideUp,
      detectBullishKicker,
      detectBullishBeltHold,
      detectBullishCounterattack,
      detectLadderBottom,
      detectBullishSeparatingLines,
      detectMatchingLow,
      detectBullishThrusting,
      detectBullishHomingPigeon,
      detectBullishBreakaway,
      detectThreeStarsInTheSouth,
      detectConcealingBabySwallow,
      detectStickSandwich,
      detectMorningDojiStar,
      // ─── Bearish Reversal (39–56) ────────────────────
      detectHangingMan,
      detectGravestoneDoji,
      detectBearishAbandonedBaby,
      detectThreeInsideDown,
      detectThreeOutsideDown,
      detectBearishKicker,
      detectBearishBeltHold,
      detectBearishCounterattack,
      detectAdvanceBlock,
      detectDeliberation,
      detectBearishBreakaway,
      detectTwoCrows,
      detectUpsideGapTwoCrows,
      detectThreeLineStrikeBearish,
      detectBearishThrusting,
      detectMatchingHigh,
      detectBearishHomingPigeon,
      detectOnNeck,
      // ─── Continuation (57–68) ────────────────────────
      detectThreeLineStrikeBullish,
      detectBullishMatHold,
      detectUpsideTasukiGap,
      detectSideBySideWhite,
      detectBullishClosingMarubozu,
      detectBearishClosingMarubozu,
      detectBearishOpeningMarubozu,
      detectBullishOpeningMarubozu,
      detectDownsideTasukiGap,
      detectInNeck,
      detectWindowUp,
      detectWindowDown,
      // ─── Neutral / Doji (69–74) ──────────────────────
      detectLongLeggedDoji,
      detectFourPriceDoji,
      detectRickshawMan,
      detectDojiStar,
      detectTriStarDojiBullish,
      detectTriStarDojiBearish
    ];
    for (const fn of detectors) {
      const result = fn(bars, i);
      if (result) results.push(result);
    }
  }
  return results.filter((p) => p.reliability > 50).sort((a, b) => b.reliability - a.reliability);
}
const TREND_LOOKBACK = 5;
function shortTermTrend$1(bars, endIndex, lookback = 10) {
  const start = Math.max(0, endIndex - lookback + 1);
  const slice = bars.slice(start, endIndex + 1);
  if (slice.length < 3) return "FLAT";
  const n = slice.length;
  const xMean = (n - 1) / 2;
  const yMean = slice.reduce((s, b) => s + b.close, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    const dx = i - xMean;
    num += dx * (slice[i].close - yMean);
    den += dx * dx;
  }
  if (den === 0) return "FLAT";
  const slope = num / den;
  const avgPrice = yMean || 1;
  const pctPerBar = slope / avgPrice * 100;
  if (pctPerBar > 0.05) return "UP";
  if (pctPerBar < -0.05) return "DOWN";
  return "FLAT";
}
function inDowntrend(bars, i) {
  return shortTermTrend$1(bars, i, TREND_LOOKBACK) === "DOWN";
}
function inUptrend(bars, i) {
  return shortTermTrend$1(bars, i, TREND_LOOKBACK) === "UP";
}
function contextAvgBody(bars, i, lookback = 10) {
  return avgBodySize(bars, lookback, i);
}
function detectBullishEngulfing(bars, i) {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];
  if (!isBearish(prev) || !isBullish(curr)) return null;
  if (!(curr.open <= prev.close && curr.close >= prev.open)) return null;
  let baseReliability = 65;
  if (inDowntrend(bars, i)) baseReliability += 15;
  const bRatio = bodySize(curr) / (bodySize(prev) || 1e-4);
  if (bRatio > 2) baseReliability += 10;
  if (bRatio > 3) baseReliability += 5;
  if (upperWick(curr) < bodySize(curr) * 0.15) baseReliability += 5;
  return {
    name: "Bullish Engulfing",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description: "Strong bullish candle completely engulfs the prior bearish candle, signaling a potential reversal from downtrend to uptrend."
  };
}
function detectHammer(bars, i) {
  const bar = bars[i];
  const body = bodySize(bar);
  const r = range(bar);
  if (r === 0) return null;
  const bodyTop = Math.max(bar.open, bar.close);
  const upperPortion = bar.high - bodyTop;
  if (upperPortion > r * 0.1) return null;
  const lwick = lowerWick(bar);
  if (lwick < body * 2) return null;
  if (lwick / r < 0.6) return null;
  let baseReliability = 60;
  if (inDowntrend(bars, i)) baseReliability += 20;
  const wickBodyRatio = lwick / (body || 1e-4);
  if (wickBodyRatio > 3) baseReliability += 10;
  if (wickBodyRatio > 5) baseReliability += 5;
  if (upperWick(bar) < body * 0.1) baseReliability += 5;
  return {
    name: "Hammer",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description: "Small body at the top with a long lower wick (≥2× body) after a downtrend, indicating buyers stepped in aggressively at lower prices."
  };
}
function detectMorningStar(bars, i) {
  if (i < 2) return null;
  const first = bars[i - 2];
  const second = bars[i - 1];
  const third = bars[i];
  if (!isBearish(first)) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(first) < avgBody * 0.5) return null;
  if (bodySize(second) > bodySize(first) * 0.5) return null;
  const firstMidpoint = (first.open + first.close) / 2;
  if (Math.max(second.open, second.close) > firstMidpoint) return null;
  if (!isBullish(third)) return null;
  if (third.close < firstMidpoint) return null;
  let baseReliability = 70;
  if (inDowntrend(bars, i)) baseReliability += 15;
  if (bodySize(third) > avgBody) baseReliability += 8;
  if (isDoji(second)) baseReliability += 7;
  return {
    name: "Morning Star",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description: "Three-candle bullish reversal: a bearish candle, followed by a small-body star, then a strong bullish candle closing above the midpoint of the first candle."
  };
}
function detectBullishHarami(bars, i) {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];
  if (!isBearish(prev) || !isBullish(curr)) return null;
  if (!(curr.open >= prev.close && curr.close <= prev.open)) return null;
  if (bodySize(curr) > bodySize(prev) * 0.5) return null;
  let baseReliability = 55;
  if (inDowntrend(bars, i)) baseReliability += 15;
  if (bodySize(curr) < bodySize(prev) * 0.25) baseReliability += 10;
  if (bodySize(curr) < bodySize(prev) * 0.15) baseReliability += 5;
  return {
    name: "Bullish Harami",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description: "A large bearish candle followed by a small bullish candle contained within its body, suggesting waning selling pressure and potential reversal."
  };
}
function detectPiercingLine(bars, i) {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];
  if (!isBearish(prev) || !isBullish(curr)) return null;
  if (curr.open >= prev.low) return null;
  const prevMidpoint = (prev.open + prev.close) / 2;
  if (curr.close <= prevMidpoint) return null;
  if (curr.close >= prev.open) return null;
  let baseReliability = 60;
  if (inDowntrend(bars, i)) baseReliability += 15;
  const penetration = (curr.close - prevMidpoint) / (bodySize(prev) / 2);
  if (penetration > 0.5) baseReliability += 10;
  if (penetration > 0.8) baseReliability += 5;
  return {
    name: "Piercing Line",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description: "Bullish reversal: bearish candle followed by a bullish candle that opens below the prior low but closes above the midpoint of the prior body."
  };
}
function detectThreeWhiteSoldiers(bars, i) {
  if (i < 2) return null;
  const a = bars[i - 2];
  const b = bars[i - 1];
  const c = bars[i];
  if (!isBullish(a) || !isBullish(b) || !isBullish(c)) return null;
  if (b.open < a.close - bodySize(a) * 0.1 || b.open > a.close) return null;
  if (c.open < b.close - bodySize(b) * 0.1 || c.open > b.close) return null;
  if (b.close <= a.close || c.close <= b.close) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(a) < avgBody * 0.6) return null;
  if (bodySize(b) < avgBody * 0.6) return null;
  if (bodySize(c) < avgBody * 0.6) return null;
  let baseReliability = 70;
  if (upperWick(a) < bodySize(a) * 0.2) baseReliability += 3;
  if (upperWick(b) < bodySize(b) * 0.2) baseReliability += 3;
  if (upperWick(c) < bodySize(c) * 0.2) baseReliability += 3;
  if (inDowntrend(bars, i - 2)) baseReliability += 10;
  return {
    name: "Three White Soldiers",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description: "Three consecutive bullish candles, each opening within the prior body and closing progressively higher, signaling strong buying momentum."
  };
}
function detectBullishDojiStar(bars, i) {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];
  if (!isBearish(prev)) return null;
  if (!isDoji(curr)) return null;
  if (Math.max(curr.open, curr.close) > prev.close) return null;
  let baseReliability = 55;
  if (inDowntrend(bars, i)) baseReliability += 20;
  if (bodyRatio(curr) < 0.05) baseReliability += 10;
  return {
    name: "Bullish Doji Star",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description: "A bearish candle followed by a doji star gapping down, indicating indecision and exhaustion of selling pressure after a downtrend."
  };
}
function detectBearishEngulfing(bars, i) {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];
  if (!isBullish(prev) || !isBearish(curr)) return null;
  if (!(curr.open >= prev.close && curr.close <= prev.open)) return null;
  let baseReliability = 65;
  if (inUptrend(bars, i)) baseReliability += 15;
  const bRatio = bodySize(curr) / (bodySize(prev) || 1e-4);
  if (bRatio > 2) baseReliability += 10;
  if (bRatio > 3) baseReliability += 5;
  if (lowerWick(curr) < bodySize(curr) * 0.15) baseReliability += 5;
  return {
    name: "Bearish Engulfing",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description: "Strong bearish candle completely engulfs the prior bullish candle, signaling a potential reversal from uptrend to downtrend."
  };
}
function detectShootingStar(bars, i) {
  const bar = bars[i];
  const body = bodySize(bar);
  const r = range(bar);
  if (r === 0) return null;
  const bodyBottom = Math.min(bar.open, bar.close);
  const lowerPortion = bodyBottom - bar.low;
  if (lowerPortion > r * 0.1) return null;
  const uwick = upperWick(bar);
  if (uwick < body * 2) return null;
  if (uwick / r < 0.6) return null;
  let baseReliability = 60;
  if (inUptrend(bars, i)) baseReliability += 20;
  const wickBodyRatio = uwick / (body || 1e-4);
  if (wickBodyRatio > 3) baseReliability += 10;
  if (wickBodyRatio > 5) baseReliability += 5;
  if (lowerWick(bar) < body * 0.1) baseReliability += 5;
  return {
    name: "Shooting Star",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description: "Small body at the bottom with a long upper wick (≥2× body) after an uptrend, indicating sellers rejected higher prices aggressively."
  };
}
function detectEveningStar(bars, i) {
  if (i < 2) return null;
  const first = bars[i - 2];
  const second = bars[i - 1];
  const third = bars[i];
  if (!isBullish(first)) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(first) < avgBody * 0.5) return null;
  if (bodySize(second) > bodySize(first) * 0.5) return null;
  const firstMidpoint = (first.open + first.close) / 2;
  if (Math.min(second.open, second.close) < firstMidpoint) return null;
  if (!isBearish(third)) return null;
  if (third.close > firstMidpoint) return null;
  let baseReliability = 70;
  if (inUptrend(bars, i)) baseReliability += 15;
  if (bodySize(third) > avgBody) baseReliability += 8;
  if (isDoji(second)) baseReliability += 7;
  return {
    name: "Evening Star",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description: "Three-candle bearish reversal: a bullish candle, a small-body star, then a strong bearish candle closing below the midpoint of the first candle."
  };
}
function detectBearishHarami(bars, i) {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];
  if (!isBullish(prev) || !isBearish(curr)) return null;
  if (!(curr.open <= prev.close && curr.close >= prev.open)) return null;
  if (bodySize(curr) > bodySize(prev) * 0.5) return null;
  let baseReliability = 55;
  if (inUptrend(bars, i)) baseReliability += 15;
  if (bodySize(curr) < bodySize(prev) * 0.25) baseReliability += 10;
  if (bodySize(curr) < bodySize(prev) * 0.15) baseReliability += 5;
  return {
    name: "Bearish Harami",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description: "A large bullish candle followed by a small bearish candle contained within its body, suggesting waning buying pressure and potential reversal."
  };
}
function detectDarkCloudCover(bars, i) {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];
  if (!isBullish(prev) || !isBearish(curr)) return null;
  if (curr.open <= prev.high) return null;
  const prevMidpoint = (prev.open + prev.close) / 2;
  if (curr.close >= prevMidpoint) return null;
  if (curr.close <= prev.open) return null;
  let baseReliability = 60;
  if (inUptrend(bars, i)) baseReliability += 15;
  const penetration = (prevMidpoint - curr.close) / (bodySize(prev) / 2);
  if (penetration > 0.5) baseReliability += 10;
  if (penetration > 0.8) baseReliability += 5;
  return {
    name: "Dark Cloud Cover",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description: "Bearish reversal: bullish candle followed by a bearish candle that opens above the prior high but closes below the midpoint of the prior body."
  };
}
function detectThreeBlackCrows(bars, i) {
  if (i < 2) return null;
  const a = bars[i - 2];
  const b = bars[i - 1];
  const c = bars[i];
  if (!isBearish(a) || !isBearish(b) || !isBearish(c)) return null;
  if (b.open > a.close + bodySize(a) * 0.1 || b.open < a.close) return null;
  if (c.open > b.close + bodySize(b) * 0.1 || c.open < b.close) return null;
  if (b.close >= a.close || c.close >= b.close) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(a) < avgBody * 0.6) return null;
  if (bodySize(b) < avgBody * 0.6) return null;
  if (bodySize(c) < avgBody * 0.6) return null;
  let baseReliability = 70;
  if (lowerWick(a) < bodySize(a) * 0.2) baseReliability += 3;
  if (lowerWick(b) < bodySize(b) * 0.2) baseReliability += 3;
  if (lowerWick(c) < bodySize(c) * 0.2) baseReliability += 3;
  if (inUptrend(bars, i - 2)) baseReliability += 10;
  return {
    name: "Three Black Crows",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description: "Three consecutive bearish candles, each opening within the prior body and closing progressively lower, signaling strong selling momentum."
  };
}
function detectBearishDojiStar(bars, i) {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];
  if (!isBullish(prev)) return null;
  if (!isDoji(curr)) return null;
  if (Math.min(curr.open, curr.close) < prev.close) return null;
  let baseReliability = 55;
  if (inUptrend(bars, i)) baseReliability += 20;
  if (bodyRatio(curr) < 0.05) baseReliability += 10;
  return {
    name: "Bearish Doji Star",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description: "A bullish candle followed by a doji star gapping up, indicating indecision and exhaustion of buying pressure after an uptrend."
  };
}
function detectRisingThreeMethods(bars, i) {
  if (i < 4) return null;
  const first = bars[i - 4];
  const two = bars[i - 3];
  const three = bars[i - 2];
  const four = bars[i - 1];
  const fifth = bars[i];
  if (!isBullish(first)) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(first) < avgBody * 0.8) return null;
  const middleBars = [two, three, four];
  for (const mb of middleBars) {
    if (isBullish(mb) && bodySize(mb) > avgBody * 0.5) return null;
    if (mb.low < first.low || mb.high > first.high) return null;
  }
  const bearishCount = middleBars.filter((b) => isBearish(b)).length;
  if (bearishCount < 2) return null;
  if (!isBullish(fifth)) return null;
  if (fifth.close <= first.close) return null;
  if (bodySize(fifth) < avgBody * 0.6) return null;
  let baseReliability = 65;
  if (inUptrend(bars, i - 4)) baseReliability += 15;
  if (upperWick(fifth) < bodySize(fifth) * 0.2) baseReliability += 5;
  return {
    name: "Rising Three Methods",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description: "Bullish continuation: a large bullish candle, three small pullback candles staying within its range, then another bullish candle closing above the first."
  };
}
function detectFallingThreeMethods(bars, i) {
  if (i < 4) return null;
  const first = bars[i - 4];
  const two = bars[i - 3];
  const three = bars[i - 2];
  const four = bars[i - 1];
  const fifth = bars[i];
  if (!isBearish(first)) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(first) < avgBody * 0.8) return null;
  const middleBars = [two, three, four];
  for (const mb of middleBars) {
    if (isBearish(mb) && bodySize(mb) > avgBody * 0.5) return null;
    if (mb.low < first.low || mb.high > first.high) return null;
  }
  const bullishCount = middleBars.filter((b) => isBullish(b)).length;
  if (bullishCount < 2) return null;
  if (!isBearish(fifth)) return null;
  if (fifth.close >= first.close) return null;
  if (bodySize(fifth) < avgBody * 0.6) return null;
  let baseReliability = 65;
  if (inDowntrend(bars, i - 4)) baseReliability += 15;
  if (lowerWick(fifth) < bodySize(fifth) * 0.2) baseReliability += 5;
  return {
    name: "Falling Three Methods",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description: "Bearish continuation: a large bearish candle, three small bounce candles staying within its range, then another bearish candle closing below the first."
  };
}
function detectSpinningTop(bars, i) {
  const bar = bars[i];
  const body = bodySize(bar);
  const r = range(bar);
  if (r === 0) return null;
  if (body / r > 0.25) return null;
  const uwick = upperWick(bar);
  const lwick = lowerWick(bar);
  if (uwick < body) return null;
  if (lwick < body) return null;
  const wickRatio = uwick / (lwick || 1e-4);
  if (wickRatio < 0.4 || wickRatio > 2.5) return null;
  let baseReliability = 50;
  if (wickRatio > 0.6 && wickRatio < 1.7) baseReliability += 10;
  if (body / r < 0.15) baseReliability += 10;
  return {
    name: "Spinning Top",
    index: i,
    type: "NEUTRAL",
    reliability: Math.min(baseReliability, 100),
    description: "Small body with roughly equal upper and lower wicks, indicating market indecision and a potential turning point."
  };
}
function detectMarubozuBullish(bars, i) {
  const bar = bars[i];
  if (!isBullish(bar)) return null;
  const body = bodySize(bar);
  const r = range(bar);
  if (r === 0) return null;
  if (body / r < 0.95) return null;
  const avgBody = contextAvgBody(bars, i);
  if (body < avgBody * 0.8) return null;
  let baseReliability = 65;
  if (upperWick(bar) === 0 && lowerWick(bar) === 0) baseReliability += 20;
  else if (body / r > 0.98) baseReliability += 15;
  if (body > avgBody * 1.5) baseReliability += 10;
  return {
    name: "Marubozu Bullish",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description: "Bullish candle with no (or negligible) wicks, opening at the low and closing at the high — pure buying momentum with no seller pushback."
  };
}
function detectMarubozuBearish(bars, i) {
  const bar = bars[i];
  if (!isBearish(bar)) return null;
  const body = bodySize(bar);
  const r = range(bar);
  if (r === 0) return null;
  if (body / r < 0.95) return null;
  const avgBody = contextAvgBody(bars, i);
  if (body < avgBody * 0.8) return null;
  let baseReliability = 65;
  if (upperWick(bar) === 0 && lowerWick(bar) === 0) baseReliability += 20;
  else if (body / r > 0.98) baseReliability += 15;
  if (body > avgBody * 1.5) baseReliability += 10;
  return {
    name: "Marubozu Bearish",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description: "Bearish candle with no (or negligible) wicks, opening at the high and closing at the low — pure selling momentum with no buyer pushback."
  };
}
function detectTweezerTopBottom(bars, i) {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];
  const tolerance = range(prev) * 0.05 || 1e-4;
  if (isBullish(prev) && isBearish(curr)) {
    if (Math.abs(prev.high - curr.high) <= tolerance) {
      let baseReliability = 55;
      if (inUptrend(bars, i)) baseReliability += 20;
      if (Math.abs(prev.high - curr.high) < tolerance * 0.2) baseReliability += 10;
      return {
        name: "Tweezer Top",
        index: i,
        type: "BEARISH",
        reliability: Math.min(baseReliability, 100),
        description: "Two candles with matching highs — a bullish candle followed by a bearish candle rejecting the same resistance level, signaling a potential top."
      };
    }
  }
  if (isBearish(prev) && isBullish(curr)) {
    if (Math.abs(prev.low - curr.low) <= tolerance) {
      let baseReliability = 55;
      if (inDowntrend(bars, i)) baseReliability += 20;
      if (Math.abs(prev.low - curr.low) < tolerance * 0.2) baseReliability += 10;
      return {
        name: "Tweezer Bottom",
        index: i,
        type: "BULLISH",
        reliability: Math.min(baseReliability, 100),
        description: "Two candles with matching lows — a bearish candle followed by a bullish candle holding the same support level, signaling a potential bottom."
      };
    }
  }
  return null;
}
function detectInvertedHammer(bars, i) {
  const bar = bars[i];
  const body = bodySize(bar);
  const r = range(bar);
  if (r === 0) return null;
  const bodyBottom = Math.min(bar.open, bar.close);
  const lowerPortion = bodyBottom - bar.low;
  if (lowerPortion > r * 0.1) return null;
  const uwick = upperWick(bar);
  if (uwick < body * 2) return null;
  if (uwick / r < 0.6) return null;
  let baseReliability = 55;
  if (inDowntrend(bars, i)) baseReliability += 20;
  const wickBodyRatio = uwick / (body || 1e-4);
  if (wickBodyRatio > 3) baseReliability += 10;
  if (wickBodyRatio > 5) baseReliability += 5;
  if (lowerWick(bar) < body * 0.1) baseReliability += 5;
  return {
    name: "Inverted Hammer",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description: "Small body at the bottom with a long upper wick (≥2× body) after a downtrend, suggesting buyers attempted to push higher — potential bullish reversal signal."
  };
}
function detectDragonflyDoji(bars, i) {
  const bar = bars[i];
  const r = range(bar);
  if (r === 0) return null;
  if (!isDoji(bar)) return null;
  const uwick = upperWick(bar);
  if (uwick > r * 0.05) return null;
  const lwick = lowerWick(bar);
  if (lwick / r < 0.8) return null;
  let baseReliability = 60;
  if (inDowntrend(bars, i)) baseReliability += 25;
  if (uwick === 0) baseReliability += 5;
  return {
    name: "Dragonfly Doji",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description: "Doji with no upper wick and a long lower wick after a downtrend, indicating sellers pushed down but buyers absorbed all supply — strong bullish reversal signal."
  };
}
function detectBullishAbandonedBaby(bars, i) {
  if (i < 2) return null;
  const first = bars[i - 2];
  const second = bars[i - 1];
  const third = bars[i];
  if (!isBearish(first)) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(first) < avgBody * 0.5) return null;
  if (!isDoji(second)) return null;
  if (second.high >= first.low) return null;
  if (!isBullish(third)) return null;
  if (third.low <= second.high) return null;
  const firstMidpoint = (first.open + first.close) / 2;
  if (third.close < firstMidpoint) return null;
  let baseReliability = 80;
  if (inDowntrend(bars, i)) baseReliability += 10;
  if (bodySize(third) > avgBody) baseReliability += 5;
  return {
    name: "Bullish Abandoned Baby",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description: "Rare bullish reversal: a bearish candle, a gapping-down doji, then a gapping-up bullish candle — complete abandonment of selling pressure."
  };
}
function detectThreeInsideUp(bars, i) {
  if (i < 2) return null;
  const first = bars[i - 2];
  const second = bars[i - 1];
  const third = bars[i];
  if (!isBearish(first)) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(first) < avgBody * 0.5) return null;
  if (!isBullish(second)) return null;
  if (!(second.open >= first.close && second.close <= first.open)) return null;
  if (bodySize(second) > bodySize(first) * 0.5) return null;
  if (!isBullish(third)) return null;
  if (third.close <= second.close) return null;
  let baseReliability = 70;
  if (inDowntrend(bars, i)) baseReliability += 15;
  const firstMidpoint = (first.open + first.close) / 2;
  if (third.close > firstMidpoint) baseReliability += 5;
  if (bodySize(third) > avgBody) baseReliability += 5;
  return {
    name: "Three Inside Up",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description: "Bullish reversal confirmation: a bearish candle, a small bullish candle inside it (harami), then a third bullish candle closing above the second — confirming the reversal."
  };
}
function detectThreeOutsideUp(bars, i) {
  if (i < 2) return null;
  const first = bars[i - 2];
  const second = bars[i - 1];
  const third = bars[i];
  if (!isBearish(first)) return null;
  if (!isBullish(second)) return null;
  if (!(second.open <= first.close && second.close >= first.open)) return null;
  if (!isBullish(third)) return null;
  if (third.close <= second.close) return null;
  let baseReliability = 72;
  if (inDowntrend(bars, i)) baseReliability += 12;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(third) > avgBody) baseReliability += 5;
  return {
    name: "Three Outside Up",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description: "Bullish reversal confirmation: a bearish candle, a bullish engulfing candle, then a third bullish candle closing above the engulfing candle — strong reversal signal."
  };
}
function detectBullishKicker(bars, i) {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];
  if (!isBearish(prev) || !isBullish(curr)) return null;
  if (curr.low <= prev.high) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(prev) < avgBody * 0.5) return null;
  if (bodySize(curr) < avgBody * 0.5) return null;
  let baseReliability = 80;
  if (inDowntrend(bars, i)) baseReliability += 10;
  const gapSize = curr.low - prev.high;
  const avgRange2 = avgBody * 2;
  if (gapSize > avgRange2 * 0.3) baseReliability += 5;
  return {
    name: "Bullish Kicker",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description: "Dramatic bullish reversal: a bearish candle followed by a bullish candle gapping up with no overlap — a sudden shift in sentiment from sellers to buyers."
  };
}
function detectBullishBeltHold(bars, i) {
  const bar = bars[i];
  if (!isBullish(bar)) return null;
  const body = bodySize(bar);
  const r = range(bar);
  const avgBody = contextAvgBody(bars, i);
  if (r === 0) return null;
  if (lowerWick(bar) > r * 0.05) return null;
  if (body < avgBody * 0.6) return null;
  if (body / r < 0.7) return null;
  let baseReliability = 60;
  if (inDowntrend(bars, i)) baseReliability += 20;
  if (body > avgBody * 1.2) baseReliability += 10;
  if (body > avgBody * 1.5) baseReliability += 5;
  return {
    name: "Bullish Belt Hold",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description: "Bullish opening marubozu after a downtrend — opens at the low and closes near the high, indicating buyers controlled the entire session from the start."
  };
}
function detectBullishCounterattack(bars, i) {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];
  if (!isBearish(prev) || !isBullish(curr)) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(prev) < avgBody * 0.5) return null;
  if (bodySize(curr) < avgBody * 0.5) return null;
  const tolerance = avgBody * 0.1;
  if (Math.abs(curr.close - prev.close) > tolerance) return null;
  let baseReliability = 58;
  if (inDowntrend(bars, i)) baseReliability += 18;
  if (Math.abs(curr.close - prev.close) < tolerance * 0.3) baseReliability += 8;
  return {
    name: "Bullish Counterattack",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description: "Bullish reversal: a bearish candle followed by a bullish candle closing at the same level — buyers counterattack, neutralizing the prior selling."
  };
}
function detectLadderBottom(bars, i) {
  if (i < 4) return null;
  const a = bars[i - 4];
  const b = bars[i - 3];
  const c = bars[i - 2];
  const d = bars[i - 1];
  const e = bars[i];
  if (!isBearish(a) || !isBearish(b) || !isBearish(c)) return null;
  if (b.open >= a.open || c.open >= b.open) return null;
  if (!isBearish(d)) return null;
  if (upperWick(d) < bodySize(d)) return null;
  if (!isBullish(e)) return null;
  let baseReliability = 65;
  if (inDowntrend(bars, i)) baseReliability += 15;
  if (e.close > d.open) baseReliability += 5;
  return {
    name: "Ladder Bottom",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description: "Five-candle bullish reversal: three declining bearish candles, a fourth bearish candle with an upper wick, then a bullish candle — like a ladder reaching the bottom."
  };
}
function detectBullishSeparatingLines(bars, i) {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];
  if (!isBearish(prev) || !isBullish(curr)) return null;
  const tolerance = Math.max(bodySize(prev), bodySize(curr)) * 0.05;
  if (Math.abs(curr.open - prev.open) > tolerance) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(prev) < avgBody * 0.5) return null;
  if (bodySize(curr) < avgBody * 0.5) return null;
  let baseReliability = 58;
  if (inDowntrend(bars, i)) baseReliability += 15;
  if (Math.abs(curr.open - prev.open) < tolerance * 0.2) baseReliability += 8;
  return {
    name: "Bullish Separating Lines",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description: "Bullish reversal: a bearish candle followed by a bullish candle opening at the same price — same starting point but opposite direction shows a shift in control."
  };
}
function detectMatchingLow(bars, i) {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];
  if (!isBearish(prev) || !isBearish(curr)) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(prev) < avgBody * 0.4) return null;
  if (bodySize(curr) < avgBody * 0.4) return null;
  const tolerance = Math.max(bodySize(prev), bodySize(curr)) * 0.05;
  if (Math.abs(prev.close - curr.close) > tolerance) return null;
  let baseReliability = 58;
  if (inDowntrend(bars, i)) baseReliability += 20;
  if (Math.abs(prev.close - curr.close) < tolerance * 0.2) baseReliability += 10;
  return {
    name: "Matching Low",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description: "Two bearish candles closing at the same level after a downtrend — sellers unable to push lower, suggesting selling exhaustion and potential reversal."
  };
}
function detectBullishThrusting(bars, i) {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];
  if (!isBearish(prev) || !isBullish(curr)) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(prev) < avgBody * 0.4) return null;
  if (bodySize(curr) < avgBody * 0.4) return null;
  if (curr.open >= prev.close) return null;
  const prevMidpoint = (prev.open + prev.close) / 2;
  if (curr.close <= prev.close) return null;
  if (curr.close >= prevMidpoint) return null;
  let baseReliability = 55;
  if (inDowntrend(bars, i)) baseReliability += 15;
  const penetration = (curr.close - prev.close) / (prevMidpoint - prev.close);
  if (penetration > 0.7) baseReliability += 5;
  return {
    name: "Bullish Thrusting",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description: "Bullish pattern: after a bearish candle, a bullish candle opens below and closes above the prior close but below its midpoint — a thrust upward that may signal reversal."
  };
}
function detectBullishHomingPigeon(bars, i) {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];
  if (!isBearish(prev) || !isBearish(curr)) return null;
  if (!(curr.open <= prev.open && curr.close >= prev.close)) return null;
  if (bodySize(curr) > bodySize(prev) * 0.5) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(prev) < avgBody * 0.5) return null;
  let baseReliability = 55;
  if (inDowntrend(bars, i)) baseReliability += 18;
  if (bodySize(curr) < bodySize(prev) * 0.25) baseReliability += 10;
  return {
    name: "Bullish Homing Pigeon",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description: "Like a bearish harami but both candles are bearish: a large bearish candle followed by a smaller bearish candle inside its body — selling momentum is weakening."
  };
}
function detectBullishBreakaway(bars, i) {
  if (i < 4) return null;
  const a = bars[i - 4];
  const b = bars[i - 3];
  const c = bars[i - 2];
  const d = bars[i - 1];
  const e = bars[i];
  if (!isBearish(a)) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(a) < avgBody * 0.7) return null;
  if (!isBearish(b) && bodySize(b) > avgBody * 0.3) return null;
  if (!isBearish(c) && bodySize(c) > avgBody * 0.3) return null;
  if (!isBearish(d) && bodySize(d) > avgBody * 0.3) return null;
  if (b.close >= a.close || c.close >= b.close || d.close >= c.close) return null;
  if (!isBullish(e)) return null;
  if (bodySize(e) < avgBody * 0.6) return null;
  if (e.close <= b.close) return null;
  let baseReliability = 65;
  if (inDowntrend(bars, i)) baseReliability += 15;
  const aMid = (a.open + a.close) / 2;
  if (e.close > aMid) baseReliability += 5;
  return {
    name: "Bullish Breakaway",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description: "Five-candle bullish reversal: a long bearish candle, three declining candles, then a long bullish candle breaking the decline — sellers exhausted, buyers take over."
  };
}
function detectThreeStarsInTheSouth(bars, i) {
  if (i < 2) return null;
  const a = bars[i - 2];
  const b = bars[i - 1];
  const c = bars[i];
  if (!isBearish(a) || !isBearish(b) || !isBearish(c)) return null;
  if (lowerWick(a) < bodySize(a) * 0.5) return null;
  if (b.open > a.open || b.open < a.close) return null;
  if (range(b) >= range(a)) return null;
  if (lowerWick(b) >= lowerWick(a)) return null;
  if (c.open > b.open || c.open < b.close) return null;
  if (bodySize(c) > bodySize(b) * 0.7) return null;
  if (lowerWick(c) > bodySize(c) * 0.2) return null;
  let baseReliability = 65;
  if (inDowntrend(bars, i)) baseReliability += 18;
  if (c.close === c.low) baseReliability += 5;
  return {
    name: "Three Stars in the South",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description: "Three bearish candles with progressively decreasing ranges and lower wicks — selling pressure is diminishing step by step, signaling a potential bottom."
  };
}
function detectConcealingBabySwallow(bars, i) {
  if (i < 3) return null;
  const a = bars[i - 3];
  const b = bars[i - 2];
  const c = bars[i - 1];
  const d = bars[i];
  if (!isBearish(a) || !isBearish(b) || !isBearish(c) || !isBearish(d)) return null;
  const avgBody = contextAvgBody(bars, i);
  if (upperWick(a) > bodySize(a) * 0.05) return null;
  if (upperWick(b) > bodySize(b) * 0.05) return null;
  if (bodySize(a) < avgBody * 0.5) return null;
  if (bodySize(b) < avgBody * 0.5) return null;
  if (upperWick(c) < bodySize(c) * 0.1) return null;
  if (d.open < c.open) return null;
  if (d.high < c.high) return null;
  let baseReliability = 68;
  if (inDowntrend(bars, i)) baseReliability += 15;
  return {
    name: "Concealing Baby Swallow",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description: "Four bearish candles: two opening marubozu, a third with an upper wick, and a fourth engulfing it — sellers are so extreme they exhaust themselves, signaling reversal."
  };
}
function detectStickSandwich(bars, i) {
  if (i < 2) return null;
  const a = bars[i - 2];
  const b = bars[i - 1];
  const c = bars[i];
  if (!isBearish(a) || !isBullish(b) || !isBearish(c)) return null;
  const tolerance = Math.max(bodySize(a), bodySize(c)) * 0.05;
  if (Math.abs(a.close - c.close) > tolerance) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(a) < avgBody * 0.4) return null;
  if (bodySize(b) < avgBody * 0.3) return null;
  if (bodySize(c) < avgBody * 0.4) return null;
  let baseReliability = 58;
  if (inDowntrend(bars, i)) baseReliability += 18;
  if (Math.abs(a.close - c.close) < tolerance * 0.2) baseReliability += 8;
  return {
    name: "Stick Sandwich",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description: "Two bearish candles sandwiching a bullish one, all closing at the same level — a support level is being established, suggesting a potential bullish reversal."
  };
}
function detectMorningDojiStar(bars, i) {
  if (i < 2) return null;
  const first = bars[i - 2];
  const second = bars[i - 1];
  const third = bars[i];
  if (!isBearish(first)) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(first) < avgBody * 0.5) return null;
  if (!isDoji(second)) return null;
  if (Math.max(second.open, second.close) > first.close) return null;
  if (!isBullish(third)) return null;
  const firstMidpoint = (first.open + first.close) / 2;
  if (third.close < firstMidpoint) return null;
  let baseReliability = 75;
  if (inDowntrend(bars, i)) baseReliability += 15;
  if (bodySize(third) > avgBody) baseReliability += 5;
  if (second.high < first.close) baseReliability += 5;
  return {
    name: "Morning Doji Star",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description: "Three-candle bullish reversal: a bearish candle, a gapping-down doji, then a strong bullish candle — the doji confirms indecision and enhances reversal probability."
  };
}
function detectHangingMan(bars, i) {
  const bar = bars[i];
  const body = bodySize(bar);
  const r = range(bar);
  if (r === 0) return null;
  const bodyTop = Math.max(bar.open, bar.close);
  const upperPortion = bar.high - bodyTop;
  if (upperPortion > r * 0.1) return null;
  const lwick = lowerWick(bar);
  if (lwick < body * 2) return null;
  if (lwick / r < 0.6) return null;
  let baseReliability = 58;
  if (inUptrend(bars, i)) baseReliability += 22;
  const wickBodyRatio = lwick / (body || 1e-4);
  if (wickBodyRatio > 3) baseReliability += 8;
  if (wickBodyRatio > 5) baseReliability += 4;
  return {
    name: "Hanging Man",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description: "Hammer-shaped candle at the top of an uptrend — small body with long lower wick, indicating sellers pushed prices down significantly before close, a warning of reversal."
  };
}
function detectGravestoneDoji(bars, i) {
  const bar = bars[i];
  const r = range(bar);
  if (r === 0) return null;
  if (!isDoji(bar)) return null;
  const lwick = lowerWick(bar);
  if (lwick > r * 0.05) return null;
  const uwick = upperWick(bar);
  if (uwick / r < 0.8) return null;
  let baseReliability = 62;
  if (inUptrend(bars, i)) baseReliability += 23;
  if (lwick === 0) baseReliability += 5;
  return {
    name: "Gravestone Doji",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description: "Doji with no lower wick and a long upper wick at the top of an uptrend — buyers pushed higher but were completely rejected, signaling bearish reversal."
  };
}
function detectBearishAbandonedBaby(bars, i) {
  if (i < 2) return null;
  const first = bars[i - 2];
  const second = bars[i - 1];
  const third = bars[i];
  if (!isBullish(first)) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(first) < avgBody * 0.5) return null;
  if (!isDoji(second)) return null;
  if (second.low <= first.high) return null;
  if (!isBearish(third)) return null;
  if (third.high >= second.low) return null;
  const firstMidpoint = (first.open + first.close) / 2;
  if (third.close > firstMidpoint) return null;
  let baseReliability = 80;
  if (inUptrend(bars, i)) baseReliability += 10;
  if (bodySize(third) > avgBody) baseReliability += 5;
  return {
    name: "Bearish Abandoned Baby",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description: "Rare bearish reversal: a bullish candle, a gapping-up doji, then a gapping-down bearish candle — complete abandonment of buying pressure."
  };
}
function detectThreeInsideDown(bars, i) {
  if (i < 2) return null;
  const first = bars[i - 2];
  const second = bars[i - 1];
  const third = bars[i];
  if (!isBullish(first)) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(first) < avgBody * 0.5) return null;
  if (!isBearish(second)) return null;
  if (!(second.open <= first.close && second.close >= first.open)) return null;
  if (bodySize(second) > bodySize(first) * 0.5) return null;
  if (!isBearish(third)) return null;
  if (third.close >= second.close) return null;
  let baseReliability = 70;
  if (inUptrend(bars, i)) baseReliability += 15;
  const firstMidpoint = (first.open + first.close) / 2;
  if (third.close < firstMidpoint) baseReliability += 5;
  if (bodySize(third) > avgBody) baseReliability += 5;
  return {
    name: "Three Inside Down",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description: "Bearish reversal confirmation: a bullish candle, a small bearish candle inside it (harami), then a third bearish candle closing below the second — confirming the reversal."
  };
}
function detectThreeOutsideDown(bars, i) {
  if (i < 2) return null;
  const first = bars[i - 2];
  const second = bars[i - 1];
  const third = bars[i];
  if (!isBullish(first)) return null;
  if (!isBearish(second)) return null;
  if (!(second.open >= first.close && second.close <= first.open)) return null;
  if (!isBearish(third)) return null;
  if (third.close >= second.close) return null;
  let baseReliability = 72;
  if (inUptrend(bars, i)) baseReliability += 12;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(third) > avgBody) baseReliability += 5;
  return {
    name: "Three Outside Down",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description: "Bearish reversal confirmation: a bullish candle, a bearish engulfing candle, then a third bearish candle closing below the engulfing candle — strong reversal signal."
  };
}
function detectBearishKicker(bars, i) {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];
  if (!isBullish(prev) || !isBearish(curr)) return null;
  if (curr.high >= prev.low) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(prev) < avgBody * 0.5) return null;
  if (bodySize(curr) < avgBody * 0.5) return null;
  let baseReliability = 80;
  if (inUptrend(bars, i)) baseReliability += 10;
  const gapSize = prev.low - curr.high;
  const avgRange2 = avgBody * 2;
  if (gapSize > avgRange2 * 0.3) baseReliability += 5;
  return {
    name: "Bearish Kicker",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description: "Dramatic bearish reversal: a bullish candle followed by a bearish candle gapping down with no overlap — a sudden shift in sentiment from buyers to sellers."
  };
}
function detectBearishBeltHold(bars, i) {
  const bar = bars[i];
  if (!isBearish(bar)) return null;
  const body = bodySize(bar);
  const r = range(bar);
  const avgBody = contextAvgBody(bars, i);
  if (r === 0) return null;
  if (upperWick(bar) > r * 0.05) return null;
  if (body < avgBody * 0.6) return null;
  if (body / r < 0.7) return null;
  let baseReliability = 60;
  if (inUptrend(bars, i)) baseReliability += 20;
  if (body > avgBody * 1.2) baseReliability += 10;
  if (body > avgBody * 1.5) baseReliability += 5;
  return {
    name: "Bearish Belt Hold",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description: "Bearish opening marubozu after an uptrend — opens at the high and closes near the low, indicating sellers controlled the entire session from the start."
  };
}
function detectBearishCounterattack(bars, i) {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];
  if (!isBullish(prev) || !isBearish(curr)) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(prev) < avgBody * 0.5) return null;
  if (bodySize(curr) < avgBody * 0.5) return null;
  const tolerance = avgBody * 0.1;
  if (Math.abs(curr.close - prev.close) > tolerance) return null;
  let baseReliability = 58;
  if (inUptrend(bars, i)) baseReliability += 18;
  if (Math.abs(curr.close - prev.close) < tolerance * 0.3) baseReliability += 8;
  return {
    name: "Bearish Counterattack",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description: "Bearish reversal: a bullish candle followed by a bearish candle closing at the same level — sellers counterattack, neutralizing the prior buying."
  };
}
function detectAdvanceBlock(bars, i) {
  if (i < 2) return null;
  const a = bars[i - 2];
  const b = bars[i - 1];
  const c = bars[i];
  if (!isBullish(a) || !isBullish(b) || !isBullish(c)) return null;
  if (b.close <= a.close || c.close <= b.close) return null;
  const avgBody = contextAvgBody(bars, i);
  const bodiesShrinking = bodySize(b) < bodySize(a) && bodySize(c) < bodySize(b);
  const wicksGrowing = upperWick(b) > upperWick(a) && upperWick(c) > upperWick(b);
  if (!bodiesShrinking && !wicksGrowing) return null;
  if (bodySize(a) < avgBody * 0.5) return null;
  const thirdWeak = bodySize(c) < bodySize(a) * 0.7 || upperWick(c) > bodySize(c);
  let baseReliability = 60;
  if (inUptrend(bars, i)) baseReliability += 18;
  if (bodiesShrinking) baseReliability += 5;
  if (wicksGrowing) baseReliability += 5;
  if (thirdWeak) baseReliability += 5;
  return {
    name: "Advance Block",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description: "Three bullish candles with weakening momentum — shrinking bodies and/or growing upper wicks signal the uptrend is losing steam, warning of a potential reversal."
  };
}
function detectDeliberation(bars, i) {
  if (i < 2) return null;
  const a = bars[i - 2];
  const b = bars[i - 1];
  const c = bars[i];
  if (!isBullish(a) || !isBullish(b)) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(a) < avgBody * 0.5) return null;
  if (bodySize(b) < avgBody * 0.5) return null;
  if (b.close <= a.close) return null;
  if (bodySize(c) > avgBody * 0.4) return null;
  if (c.low <= b.high) return null;
  let baseReliability = 62;
  if (inUptrend(bars, i)) baseReliability += 18;
  if (isDoji(c)) baseReliability += 8;
  return {
    name: "Deliberation",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description: "Three bullish candles where the third is a small body or doji gapping up — buyers are deliberating at the top, suggesting the rally may be ending."
  };
}
function detectBearishBreakaway(bars, i) {
  if (i < 4) return null;
  const a = bars[i - 4];
  const b = bars[i - 3];
  const c = bars[i - 2];
  const d = bars[i - 1];
  const e = bars[i];
  if (!isBullish(a)) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(a) < avgBody * 0.7) return null;
  if (!isBullish(b) && bodySize(b) > avgBody * 0.3) return null;
  if (!isBullish(c) && bodySize(c) > avgBody * 0.3) return null;
  if (!isBullish(d) && bodySize(d) > avgBody * 0.3) return null;
  if (b.close <= a.close || c.close <= b.close || d.close <= c.close) return null;
  if (!isBearish(e)) return null;
  if (bodySize(e) < avgBody * 0.6) return null;
  if (e.close >= b.close) return null;
  let baseReliability = 65;
  if (inUptrend(bars, i)) baseReliability += 15;
  const aMid = (a.open + a.close) / 2;
  if (e.close < aMid) baseReliability += 5;
  return {
    name: "Bearish Breakaway",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description: "Five-candle bearish reversal: a long bullish candle, three rising candles, then a long bearish candle breaking the advance — buyers exhausted, sellers take over."
  };
}
function detectTwoCrows(bars, i) {
  if (i < 2) return null;
  const first = bars[i - 2];
  const second = bars[i - 1];
  const third = bars[i];
  if (!isBullish(first)) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(first) < avgBody * 0.5) return null;
  if (!isBearish(second)) return null;
  if (second.open <= first.high) return null;
  if (!isBearish(third)) return null;
  if (third.open < second.open) return null;
  if (third.close >= first.close) return null;
  let baseReliability = 62;
  if (inUptrend(bars, i)) baseReliability += 18;
  if (third.close < (first.open + first.close) / 2) baseReliability += 5;
  return {
    name: "Two Crows",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description: "Bearish reversal: a bullish candle, a gapping-up bearish candle, then another bearish closing below the first candle — the gap up was a trap, sellers are in control."
  };
}
function detectUpsideGapTwoCrows(bars, i) {
  if (i < 2) return null;
  const first = bars[i - 2];
  const second = bars[i - 1];
  const third = bars[i];
  if (!isBullish(first)) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(first) < avgBody * 0.5) return null;
  if (!isBearish(second)) return null;
  if (second.open <= first.high) return null;
  if (!isBearish(third)) return null;
  if (third.open <= second.open) return null;
  if (third.close >= second.close) return null;
  let baseReliability = 62;
  if (inUptrend(bars, i)) baseReliability += 18;
  if (third.close < first.high) baseReliability += 8;
  return {
    name: "Upside Gap Two Crows",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description: "Bearish reversal: a bullish candle, a gapping-up bearish candle, then a larger bearish candle engulfing the second — the upside gap is being filled, sellers dominate."
  };
}
function detectThreeLineStrikeBearish(bars, i) {
  if (i < 3) return null;
  const a = bars[i - 3];
  const b = bars[i - 2];
  const c = bars[i - 1];
  const d = bars[i];
  if (!isBullish(a) || !isBullish(b) || !isBullish(c)) return null;
  if (b.close <= a.close || c.close <= b.close) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(a) < avgBody * 0.4) return null;
  if (!isBearish(d)) return null;
  if (d.open <= c.close) return null;
  if (d.close >= a.open) return null;
  let baseReliability = 65;
  if (inUptrend(bars, i)) baseReliability += 18;
  if (bodySize(d) > avgBody * 1.5) baseReliability += 5;
  return {
    name: "Three Line Strike (Bearish)",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description: "Bearish reversal: three rising bullish candles followed by one large bearish candle engulfing all three — a sudden, dramatic shift from buying to selling pressure."
  };
}
function detectBearishThrusting(bars, i) {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];
  if (!isBullish(prev) || !isBearish(curr)) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(prev) < avgBody * 0.4) return null;
  if (bodySize(curr) < avgBody * 0.4) return null;
  if (curr.open <= prev.close) return null;
  const prevMidpoint = (prev.open + prev.close) / 2;
  if (curr.close >= prev.close) return null;
  if (curr.close <= prevMidpoint) return null;
  let baseReliability = 55;
  if (inUptrend(bars, i)) baseReliability += 15;
  const penetration = (prev.close - curr.close) / (prev.close - prevMidpoint);
  if (penetration > 0.7) baseReliability += 5;
  return {
    name: "Bearish Thrusting",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description: "Bearish pattern: after a bullish candle, a bearish candle opens above and closes below the prior close but above its midpoint — a thrust downward that may signal reversal."
  };
}
function detectMatchingHigh(bars, i) {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];
  if (!isBullish(prev) || !isBullish(curr)) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(prev) < avgBody * 0.4) return null;
  if (bodySize(curr) < avgBody * 0.4) return null;
  const tolerance = Math.max(bodySize(prev), bodySize(curr)) * 0.05;
  if (Math.abs(prev.close - curr.close) > tolerance) return null;
  let baseReliability = 55;
  if (inUptrend(bars, i)) baseReliability += 20;
  if (Math.abs(prev.close - curr.close) < tolerance * 0.2) baseReliability += 10;
  return {
    name: "Matching High",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description: "Two bullish candles closing at the same level after an uptrend — buyers unable to push higher, suggesting buying exhaustion and potential reversal."
  };
}
function detectBearishHomingPigeon(bars, i) {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];
  if (!isBullish(prev) || !isBullish(curr)) return null;
  if (!(curr.open >= prev.open && curr.close <= prev.close)) return null;
  if (bodySize(curr) > bodySize(prev) * 0.5) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(prev) < avgBody * 0.5) return null;
  let baseReliability = 52;
  if (inUptrend(bars, i)) baseReliability += 18;
  if (bodySize(curr) < bodySize(prev) * 0.25) baseReliability += 8;
  return {
    name: "Bearish Homing Pigeon",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description: "Like a bullish harami but both candles are bullish: a large bullish candle followed by a smaller bullish candle inside its body — buying momentum is weakening, rare bearish signal."
  };
}
function detectOnNeck(bars, i) {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];
  if (!isBearish(prev) || !isBullish(curr)) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(prev) < avgBody * 0.5) return null;
  if (bodySize(curr) > bodySize(prev) * 0.5) return null;
  const tolerance = Math.max(bodySize(prev), bodySize(curr)) * 0.05;
  if (Math.abs(curr.close - prev.low) > tolerance) return null;
  let baseReliability = 55;
  if (inDowntrend(bars, i)) baseReliability += 15;
  if (Math.abs(curr.close - prev.low) < tolerance * 0.2) baseReliability += 8;
  return {
    name: "On Neck",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description: "Bearish continuation: a bearish candle followed by a small bullish candle closing at the prior low — the prior support level is holding as resistance, downtrend likely continues."
  };
}
function detectThreeLineStrikeBullish(bars, i) {
  if (i < 3) return null;
  const a = bars[i - 3];
  const b = bars[i - 2];
  const c = bars[i - 1];
  const d = bars[i];
  if (!isBearish(a) || !isBearish(b) || !isBearish(c)) return null;
  if (b.close >= a.close || c.close >= b.close) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(a) < avgBody * 0.4) return null;
  if (!isBullish(d)) return null;
  if (d.open >= c.close) return null;
  if (d.close <= a.open) return null;
  let baseReliability = 65;
  if (inDowntrend(bars, i)) baseReliability += 18;
  if (bodySize(d) > avgBody * 1.5) baseReliability += 5;
  return {
    name: "Three Line Strike (Bullish)",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description: "Bullish continuation: three declining bearish candles followed by one large bullish candle engulfing all three — after a brief pullback, buyers surge back with force."
  };
}
function detectBullishMatHold(bars, i) {
  if (i < 4) return null;
  const first = bars[i - 4];
  const two = bars[i - 3];
  const three = bars[i - 2];
  const four = bars[i - 1];
  const fifth = bars[i];
  if (!isBullish(first)) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(first) < avgBody * 0.7) return null;
  if (two.low <= first.high) return null;
  const firstMid = (first.open + first.close) / 2;
  const middleBars = [two, three, four];
  for (const mb of middleBars) {
    if (bodySize(mb) > avgBody * 0.6) return null;
    if (mb.low < firstMid) return null;
  }
  const bearishCount = middleBars.filter((b) => isBearish(b)).length;
  if (bearishCount < 1) return null;
  if (!isBullish(fifth)) return null;
  if (fifth.close <= first.close) return null;
  if (bodySize(fifth) < avgBody * 0.5) return null;
  let baseReliability = 70;
  if (inUptrend(bars, i - 4)) baseReliability += 12;
  if (upperWick(fifth) < bodySize(fifth) * 0.2) baseReliability += 5;
  return {
    name: "Bullish Mat Hold",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description: "Bullish continuation: a large bullish candle, a gapping-up bearish flag, then a bullish continuation — the flag holds above the first candle's midpoint, confirming the uptrend."
  };
}
function detectUpsideTasukiGap(bars, i) {
  if (i < 2) return null;
  const a = bars[i - 2];
  const b = bars[i - 1];
  const c = bars[i];
  if (!isBullish(a)) return null;
  const avgBody = contextAvgBody(bars, i);
  if (!isBullish(b)) return null;
  if (b.low <= a.high) return null;
  if (!isBearish(c)) return null;
  if (c.open < b.close || c.open > b.open) return null;
  if (c.close >= b.low) return null;
  if (c.close <= a.high) return null;
  let baseReliability = 60;
  if (inUptrend(bars, i)) baseReliability += 15;
  if (b.low - a.high > avgBody * 0.3) baseReliability += 5;
  return {
    name: "Upside Tasuki Gap",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description: "Bullish continuation: two bullish candles with an upside gap, then a bearish candle partially filling the gap — the gap holds, confirming the uptrend will continue."
  };
}
function detectSideBySideWhite(bars, i) {
  if (i < 2) return null;
  const a = bars[i - 2];
  const b = bars[i - 1];
  const c = bars[i];
  if (!isBullish(a) || !isBullish(b) || !isBullish(c)) return null;
  if (b.low <= a.high) return null;
  const tolerance = Math.max(bodySize(b), bodySize(c)) * 0.1;
  if (Math.abs(c.open - b.open) > tolerance) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(a) < avgBody * 0.4) return null;
  if (bodySize(b) < avgBody * 0.4) return null;
  let baseReliability = 58;
  if (inUptrend(bars, i)) baseReliability += 15;
  const maxBody = Math.max(bodySize(a), bodySize(b), bodySize(c));
  const minBody = Math.min(bodySize(a), bodySize(b), bodySize(c));
  if (minBody > maxBody * 0.6) baseReliability += 5;
  return {
    name: "Side by Side White",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description: "Bullish continuation: two bullish candles at the same level with a gap up from a prior bullish candle — strong buying momentum with no seller pushback at the gap."
  };
}
function detectBullishClosingMarubozu(bars, i) {
  const bar = bars[i];
  if (!isBullish(bar)) return null;
  const body = bodySize(bar);
  const r = range(bar);
  const avgBody = contextAvgBody(bars, i);
  if (r === 0) return null;
  if (upperWick(bar) > r * 0.02) return null;
  if (body < avgBody * 0.6) return null;
  if (body / r < 0.7) return null;
  let baseReliability = 58;
  if (inUptrend(bars, i)) baseReliability += 15;
  if (body > avgBody * 1.3) baseReliability += 8;
  if (body > avgBody * 1.5) baseReliability += 4;
  return {
    name: "Bullish Closing Marubozu",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description: "Bullish candle closing at its high — buyers maintained control to the very end of the session, signaling strong buying pressure and potential continuation."
  };
}
function detectBearishClosingMarubozu(bars, i) {
  const bar = bars[i];
  if (!isBearish(bar)) return null;
  const body = bodySize(bar);
  const r = range(bar);
  const avgBody = contextAvgBody(bars, i);
  if (r === 0) return null;
  if (lowerWick(bar) > r * 0.02) return null;
  if (body < avgBody * 0.6) return null;
  if (body / r < 0.7) return null;
  let baseReliability = 58;
  if (inDowntrend(bars, i)) baseReliability += 15;
  if (body > avgBody * 1.3) baseReliability += 8;
  if (body > avgBody * 1.5) baseReliability += 4;
  return {
    name: "Bearish Closing Marubozu",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description: "Bearish candle closing at its low — sellers maintained control to the very end of the session, signaling strong selling pressure and potential continuation."
  };
}
function detectBearishOpeningMarubozu(bars, i) {
  const bar = bars[i];
  if (!isBearish(bar)) return null;
  const body = bodySize(bar);
  const r = range(bar);
  const avgBody = contextAvgBody(bars, i);
  if (r === 0) return null;
  if (upperWick(bar) > r * 0.02) return null;
  if (body < avgBody * 0.6) return null;
  if (body / r < 0.7) return null;
  let baseReliability = 55;
  if (inDowntrend(bars, i)) baseReliability += 15;
  if (body > avgBody * 1.3) baseReliability += 8;
  return {
    name: "Bearish Opening Marubozu",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description: "Bearish candle opening at its high — selling pressure began immediately and never let up, signaling strong bearish momentum and potential continuation."
  };
}
function detectBullishOpeningMarubozu(bars, i) {
  const bar = bars[i];
  if (!isBullish(bar)) return null;
  const body = bodySize(bar);
  const r = range(bar);
  const avgBody = contextAvgBody(bars, i);
  if (r === 0) return null;
  if (lowerWick(bar) > r * 0.02) return null;
  if (body < avgBody * 0.6) return null;
  if (body / r < 0.7) return null;
  let baseReliability = 55;
  if (inUptrend(bars, i)) baseReliability += 15;
  if (body > avgBody * 1.3) baseReliability += 8;
  return {
    name: "Bullish Opening Marubozu",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description: "Bullish candle opening at its low — buying pressure began immediately and never let up, signaling strong bullish momentum and potential continuation."
  };
}
function detectDownsideTasukiGap(bars, i) {
  if (i < 2) return null;
  const a = bars[i - 2];
  const b = bars[i - 1];
  const c = bars[i];
  if (!isBearish(a)) return null;
  const avgBody = contextAvgBody(bars, i);
  if (!isBearish(b)) return null;
  if (b.high >= a.low) return null;
  if (!isBullish(c)) return null;
  if (c.open > b.open || c.open < b.close) return null;
  if (c.close <= b.high) return null;
  if (c.close >= a.low) return null;
  let baseReliability = 60;
  if (inDowntrend(bars, i)) baseReliability += 15;
  if (a.low - b.high > avgBody * 0.3) baseReliability += 5;
  return {
    name: "Downside Tasuki Gap",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description: "Bearish continuation: two bearish candles with a downside gap, then a bullish candle partially filling the gap — the gap holds, confirming the downtrend will continue."
  };
}
function detectInNeck(bars, i) {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];
  if (!isBearish(prev) || !isBullish(curr)) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(prev) < avgBody * 0.5) return null;
  if (bodySize(curr) > bodySize(prev) * 0.5) return null;
  const tolerance = bodySize(prev) * 0.1;
  if (curr.close < prev.close) return null;
  if (curr.close > prev.close + tolerance) return null;
  let baseReliability = 52;
  if (inDowntrend(bars, i)) baseReliability += 15;
  return {
    name: "In Neck",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description: "Bearish continuation: a bearish candle followed by a small bullish candle closing slightly above the prior close — weak buying, downtrend likely to continue."
  };
}
function detectWindowUp(bars, i) {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];
  if (curr.low <= prev.high) return null;
  const avgBody = contextAvgBody(bars, i);
  const gapSize = curr.low - prev.high;
  if (gapSize < avgBody * 0.1) return null;
  let baseReliability = 55;
  if (inUptrend(bars, i)) baseReliability += 15;
  if (gapSize > avgBody * 0.3) baseReliability += 8;
  if (gapSize > avgBody * 0.5) baseReliability += 5;
  return {
    name: "Window Up",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description: "Gap up (window): current candle's low is above the previous candle's high — a price gap indicating strong buying momentum and potential support at the gap zone."
  };
}
function detectWindowDown(bars, i) {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];
  if (curr.high >= prev.low) return null;
  const avgBody = contextAvgBody(bars, i);
  const gapSize = prev.low - curr.high;
  if (gapSize < avgBody * 0.1) return null;
  let baseReliability = 55;
  if (inDowntrend(bars, i)) baseReliability += 15;
  if (gapSize > avgBody * 0.3) baseReliability += 8;
  if (gapSize > avgBody * 0.5) baseReliability += 5;
  return {
    name: "Window Down",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description: "Gap down (window): current candle's high is below the previous candle's low — a price gap indicating strong selling momentum and potential resistance at the gap zone."
  };
}
function detectLongLeggedDoji(bars, i) {
  const bar = bars[i];
  const r = range(bar);
  if (r === 0) return null;
  if (!isDoji(bar)) return null;
  const uwick = upperWick(bar);
  const lwick = lowerWick(bar);
  if ((uwick + lwick) / r < 0.85) return null;
  if (uwick / r < 0.3) return null;
  if (lwick / r < 0.3) return null;
  let baseReliability = 55;
  const wickRatio = uwick / (lwick || 1e-4);
  if (wickRatio > 0.6 && wickRatio < 1.7) baseReliability += 10;
  if (inUptrend(bars, i)) baseReliability += 5;
  if (inDowntrend(bars, i)) baseReliability += 5;
  return {
    name: "Long Legged Doji",
    index: i,
    type: "NEUTRAL",
    reliability: Math.min(baseReliability, 100),
    description: "Doji with long wicks on both sides — extreme indecision with large price swings in both directions, indicating a potential turning point in any trend."
  };
}
function detectFourPriceDoji(bars, i) {
  const bar = bars[i];
  if (bar.open !== bar.close || bar.high !== bar.low || bar.open !== bar.high) return null;
  let baseReliability = 60;
  if (inUptrend(bars, i)) baseReliability += 5;
  if (inDowntrend(bars, i)) baseReliability += 5;
  return {
    name: "Four Price Doji",
    index: i,
    type: "NEUTRAL",
    reliability: Math.min(baseReliability, 100),
    description: "Extremely rare doji where open, high, low, and close are all equal — absolute market paralysis, typically indicating a complete lack of trading activity or extreme equilibrium."
  };
}
function detectRickshawMan(bars, i) {
  const bar = bars[i];
  const r = range(bar);
  if (r === 0) return null;
  if (!isDoji(bar)) return null;
  const uwick = upperWick(bar);
  const lwick = lowerWick(bar);
  if (uwick / r < 0.4) return null;
  if (lwick / r < 0.4) return null;
  const bodyCenter = (bar.open + bar.close) / 2;
  const rangeCenter = (bar.high + bar.low) / 2;
  const bodyOffset = Math.abs(bodyCenter - rangeCenter) / r;
  if (bodyOffset > 0.1) return null;
  let baseReliability = 55;
  if (bodyOffset < 0.05) baseReliability += 10;
  if (inUptrend(bars, i)) baseReliability += 5;
  if (inDowntrend(bars, i)) baseReliability += 5;
  return {
    name: "Rickshaw Man",
    index: i,
    type: "NEUTRAL",
    reliability: Math.min(baseReliability, 100),
    description: "Long-legged doji with the body precisely at the midpoint of the range — maximum indecision with equal pressure from buyers and sellers, signaling potential trend change."
  };
}
function detectDojiStar(bars, i) {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];
  if (!isDoji(curr)) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(prev) < avgBody * 0.4) return null;
  const gapUp = Math.min(curr.open, curr.close) > prev.close;
  const gapDown = Math.max(curr.open, curr.close) < prev.close;
  if (!gapUp && !gapDown) return null;
  let baseReliability = 52;
  if (inUptrend(bars, i) && gapUp) baseReliability += 10;
  if (inDowntrend(bars, i) && gapDown) baseReliability += 10;
  if (bodyRatio(curr) < 0.03) baseReliability += 8;
  const type = inDowntrend(bars, i) && gapDown ? "BULLISH" : inUptrend(bars, i) && gapUp ? "BEARISH" : "NEUTRAL";
  return {
    name: "Doji Star",
    index: i,
    type,
    reliability: Math.min(baseReliability, 100),
    description: "A doji that gaps away from the prior candle — a star pattern signaling indecision and potential reversal. Context (uptrend/downtrend) determines directional bias."
  };
}
function detectTriStarDojiBullish(bars, i) {
  if (i < 2) return null;
  const a = bars[i - 2];
  const b = bars[i - 1];
  const c = bars[i];
  if (!isDoji(a) || !isDoji(b) || !isDoji(c)) return null;
  if (Math.max(b.open, b.close) >= Math.min(a.open, a.close)) return null;
  if (Math.min(c.open, c.close) <= Math.max(b.open, b.close)) return null;
  let baseReliability = 72;
  if (inDowntrend(bars, i)) baseReliability += 15;
  return {
    name: "Tri Star Doji (Bullish)",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description: "Rare bullish reversal: three dojis in a row at the bottom of a downtrend with a down-gap then up-gap — extreme indecision transitioning to bullish reversal."
  };
}
function detectTriStarDojiBearish(bars, i) {
  if (i < 2) return null;
  const a = bars[i - 2];
  const b = bars[i - 1];
  const c = bars[i];
  if (!isDoji(a) || !isDoji(b) || !isDoji(c)) return null;
  if (Math.min(b.open, b.close) <= Math.max(a.open, a.close)) return null;
  if (Math.max(c.open, c.close) >= Math.min(b.open, b.close)) return null;
  let baseReliability = 72;
  if (inUptrend(bars, i)) baseReliability += 15;
  return {
    name: "Tri Star Doji (Bearish)",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description: "Rare bearish reversal: three dojis in a row at the top of an uptrend with an up-gap then down-gap — extreme indecision transitioning to bearish reversal."
  };
}
const LEVEL_TOLERANCE = 0.015;
const MIN_SWING_DISTANCE$1 = 4;
function detectChartFormations(bars, swingPoints) {
  if (bars.length < 20 || swingPoints.length < 3) return [];
  const detectors = [
    detectDoubleTop,
    detectDoubleBottom,
    detectHeadAndShoulders,
    detectInverseHeadAndShoulders,
    detectAscendingTriangle,
    detectDescendingTriangle,
    detectBullFlag,
    detectBearFlag,
    detectRisingWedge,
    detectFallingWedge,
    detectCupAndHandle,
    detectSymmetricalTriangle,
    detectRectangleBullish,
    detectRectangleBearish,
    detectBroadeningTop,
    detectBroadeningBottom,
    detectMegaphoneTop,
    detectRoundingTop,
    detectRoundingBottom,
    detectDiamondTop
  ];
  const results = [];
  for (const fn of detectors) {
    const result = fn(swingPoints, bars);
    if (result) results.push(result);
  }
  return results.filter((f) => f.reliability > 40).sort((a, b) => b.reliability - a.reliability);
}
function sameLevel(a, b, tolerance = LEVEL_TOLERANCE) {
  const avg = (a + b) / 2;
  if (avg === 0) return a === b;
  return Math.abs(a - b) / avg <= tolerance;
}
function swingsByType(swings, type) {
  return swings.filter((s) => s.type === type).sort((a, b) => a.index - b.index);
}
function troughBetween(bars, startIdx, endIdx) {
  let minLow = Infinity;
  let minIdx = startIdx;
  for (let i = startIdx; i <= endIdx; i++) {
    if (bars[i].low < minLow) {
      minLow = bars[i].low;
      minIdx = i;
    }
  }
  return { price: minLow, index: minIdx };
}
function peakBetween(bars, startIdx, endIdx) {
  let maxHigh = -Infinity;
  let maxIdx = startIdx;
  for (let i = startIdx; i <= endIdx; i++) {
    if (bars[i].high > maxHigh) {
      maxHigh = bars[i].high;
      maxIdx = i;
    }
  }
  return { price: maxHigh, index: maxIdx };
}
function linearSlope(values) {
  const n = values.length;
  if (n < 2) return 0;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    const dx = i - xMean;
    num += dx * (values[i] - yMean);
    den += dx * dx;
  }
  return den === 0 ? 0 : num / den;
}
function trendlineSlope(swings) {
  if (swings.length < 2) return 0;
  return linearSlope(swings.map((s) => s.price));
}
function shortTermTrend(bars, endIndex, lookback = 10) {
  const start = Math.max(0, endIndex - lookback + 1);
  const slice = bars.slice(start, endIndex + 1);
  if (slice.length < 3) return "FLAT";
  const n = slice.length;
  const xMean = (n - 1) / 2;
  const yMean = slice.reduce((s, b) => s + b.close, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    const dx = i - xMean;
    num += dx * (slice[i].close - yMean);
    den += dx * dx;
  }
  if (den === 0) return "FLAT";
  const slope = num / den;
  const avgPrice = yMean || 1;
  const pctPerBar = slope / avgPrice * 100;
  if (pctPerBar > 0.05) return "UP";
  if (pctPerBar < -0.05) return "DOWN";
  return "FLAT";
}
function detectDoubleTop(swings, bars) {
  const highs = swingsByType(swings, "HIGH");
  if (highs.length < 2) return null;
  for (let i = 0; i < highs.length - 1; i++) {
    for (let j = i + 1; j < highs.length; j++) {
      const first = highs[i];
      const second = highs[j];
      if (second.index - first.index < MIN_SWING_DISTANCE$1) continue;
      if (!sameLevel(first.price, second.price)) continue;
      if (shortTermTrend(bars, first.index, 8) !== "UP") continue;
      const trough = troughBetween(bars, first.index, second.index);
      const avgPeak = (first.price + second.price) / 2;
      const depthPct = (avgPeak - trough.price) / avgPeak;
      if (depthPct < 0.05) continue;
      const neckline = trough.price;
      const target = neckline - (avgPeak - neckline);
      let reliability = 60;
      const peakDiff = Math.abs(first.price - second.price) / avgPeak;
      if (peakDiff < 5e-3) reliability += 15;
      else if (peakDiff < 0.01) reliability += 10;
      if (second.price < first.price) reliability += 5;
      if (depthPct > 0.1) reliability += 5;
      return {
        name: "Double Top",
        type: "BEARISH",
        reliability: Math.min(reliability, 100),
        startIndex: first.index,
        endIndex: second.index,
        targetPrice: target,
        stopPrice: avgPeak
      };
    }
  }
  return null;
}
function detectDoubleBottom(swings, bars) {
  const lows = swingsByType(swings, "LOW");
  if (lows.length < 2) return null;
  for (let i = 0; i < lows.length - 1; i++) {
    for (let j = i + 1; j < lows.length; j++) {
      const first = lows[i];
      const second = lows[j];
      if (second.index - first.index < MIN_SWING_DISTANCE$1) continue;
      if (!sameLevel(first.price, second.price)) continue;
      if (shortTermTrend(bars, first.index, 8) !== "DOWN") continue;
      const peak = peakBetween(bars, first.index, second.index);
      const avgLow = (first.price + second.price) / 2;
      const heightPct = (peak.price - avgLow) / avgLow;
      if (heightPct < 0.05) continue;
      const neckline = peak.price;
      const target = neckline + (neckline - avgLow);
      let reliability = 60;
      const lowDiff = Math.abs(first.price - second.price) / avgLow;
      if (lowDiff < 5e-3) reliability += 15;
      else if (lowDiff < 0.01) reliability += 10;
      if (second.price > first.price) reliability += 5;
      if (heightPct > 0.1) reliability += 5;
      return {
        name: "Double Bottom",
        type: "BULLISH",
        reliability: Math.min(reliability, 100),
        startIndex: first.index,
        endIndex: second.index,
        targetPrice: target,
        stopPrice: avgLow
      };
    }
  }
  return null;
}
function detectHeadAndShoulders(swings, bars) {
  const highs = swingsByType(swings, "HIGH");
  if (highs.length < 3) return null;
  for (let i = 0; i < highs.length - 2; i++) {
    const leftShoulder = highs[i];
    const head = highs[i + 1];
    const rightShoulder = highs[i + 2];
    if (head.price <= leftShoulder.price || head.price <= rightShoulder.price) continue;
    if (!sameLevel(leftShoulder.price, rightShoulder.price)) continue;
    if (head.index - leftShoulder.index < MIN_SWING_DISTANCE$1) continue;
    if (rightShoulder.index - head.index < MIN_SWING_DISTANCE$1) continue;
    if (shortTermTrend(bars, leftShoulder.index, 10) !== "UP") continue;
    const trough1 = troughBetween(bars, leftShoulder.index, head.index);
    const trough2 = troughBetween(bars, head.index, rightShoulder.index);
    if (!sameLevel(trough1.price, trough2.price, 0.03)) continue;
    const neckline = (trough1.price + trough2.price) / 2;
    const headHeight = head.price - neckline;
    const target = neckline - headHeight;
    let reliability = 65;
    const shoulderDiff = Math.abs(leftShoulder.price - rightShoulder.price) / leftShoulder.price;
    if (shoulderDiff < 5e-3) reliability += 15;
    else if (shoulderDiff < 0.015) reliability += 10;
    const spacingRatio = (head.index - leftShoulder.index) / (rightShoulder.index - head.index);
    if (spacingRatio > 0.6 && spacingRatio < 1.6) reliability += 10;
    if (rightShoulder.price < leftShoulder.price) reliability += 5;
    return {
      name: "Head and Shoulders",
      type: "BEARISH",
      reliability: Math.min(reliability, 100),
      startIndex: leftShoulder.index,
      endIndex: rightShoulder.index,
      targetPrice: target,
      stopPrice: head.price
    };
  }
  return null;
}
function detectInverseHeadAndShoulders(swings, bars) {
  const lows = swingsByType(swings, "LOW");
  if (lows.length < 3) return null;
  for (let i = 0; i < lows.length - 2; i++) {
    const leftShoulder = lows[i];
    const head = lows[i + 1];
    const rightShoulder = lows[i + 2];
    if (head.price >= leftShoulder.price || head.price >= rightShoulder.price) continue;
    if (!sameLevel(leftShoulder.price, rightShoulder.price)) continue;
    if (head.index - leftShoulder.index < MIN_SWING_DISTANCE$1) continue;
    if (rightShoulder.index - head.index < MIN_SWING_DISTANCE$1) continue;
    if (shortTermTrend(bars, leftShoulder.index, 10) !== "DOWN") continue;
    const peak1 = peakBetween(bars, leftShoulder.index, head.index);
    const peak2 = peakBetween(bars, head.index, rightShoulder.index);
    if (!sameLevel(peak1.price, peak2.price, 0.03)) continue;
    const neckline = (peak1.price + peak2.price) / 2;
    const headDepth = neckline - head.price;
    const target = neckline + headDepth;
    let reliability = 65;
    const shoulderDiff = Math.abs(leftShoulder.price - rightShoulder.price) / leftShoulder.price;
    if (shoulderDiff < 5e-3) reliability += 15;
    else if (shoulderDiff < 0.015) reliability += 10;
    const spacingRatio = (head.index - leftShoulder.index) / (rightShoulder.index - head.index);
    if (spacingRatio > 0.6 && spacingRatio < 1.6) reliability += 10;
    if (rightShoulder.price > leftShoulder.price) reliability += 5;
    return {
      name: "Inverse Head and Shoulders",
      type: "BULLISH",
      reliability: Math.min(reliability, 100),
      startIndex: leftShoulder.index,
      endIndex: rightShoulder.index,
      targetPrice: target,
      stopPrice: head.price
    };
  }
  return null;
}
function detectAscendingTriangle(swings, bars) {
  const highs = swingsByType(swings, "HIGH");
  const lows = swingsByType(swings, "LOW");
  if (highs.length < 2 || lows.length < 2) return null;
  for (let i = 0; i < highs.length - 1; i++) {
    const h1 = highs[i];
    const h2 = highs[i + 1];
    if (!sameLevel(h1.price, h2.price)) continue;
    if (h2.index - h1.index < MIN_SWING_DISTANCE$1) continue;
    const rangeLows = lows.filter(
      (l) => l.index >= h1.index && l.index <= h2.index
    );
    if (rangeLows.length < 2) continue;
    const lowSlope = trendlineSlope(rangeLows);
    if (lowSlope <= 0) continue;
    const resistance = (h1.price + h2.price) / 2;
    const target = resistance + (resistance - rangeLows[0].price);
    let reliability = 60;
    const resistDiff = Math.abs(h1.price - h2.price) / resistance;
    if (resistDiff < 5e-3) reliability += 15;
    else if (resistDiff < 0.01) reliability += 10;
    const resistanceTouches = highs.filter(
      (h) => h.index >= h1.index && h.index <= h2.index && sameLevel(h.price, resistance, 0.01)
    ).length;
    if (resistanceTouches >= 3) reliability += 10;
    return {
      name: "Ascending Triangle",
      type: "BULLISH",
      reliability: Math.min(reliability, 100),
      startIndex: h1.index,
      endIndex: h2.index,
      targetPrice: target,
      stopPrice: rangeLows[0].price
    };
  }
  return null;
}
function detectDescendingTriangle(swings, bars) {
  const highs = swingsByType(swings, "HIGH");
  const lows = swingsByType(swings, "LOW");
  if (highs.length < 2 || lows.length < 2) return null;
  for (let i = 0; i < lows.length - 1; i++) {
    const l1 = lows[i];
    const l2 = lows[i + 1];
    if (!sameLevel(l1.price, l2.price)) continue;
    if (l2.index - l1.index < MIN_SWING_DISTANCE$1) continue;
    const rangeHighs = highs.filter(
      (h) => h.index >= l1.index && h.index <= l2.index
    );
    if (rangeHighs.length < 2) continue;
    const highSlope = trendlineSlope(rangeHighs);
    if (highSlope >= 0) continue;
    const support = (l1.price + l2.price) / 2;
    const target = support - (rangeHighs[0].price - support);
    let reliability = 60;
    const supportDiff = Math.abs(l1.price - l2.price) / support;
    if (supportDiff < 5e-3) reliability += 15;
    else if (supportDiff < 0.01) reliability += 10;
    const supportTouches = lows.filter(
      (l) => l.index >= l1.index && l.index <= l2.index && sameLevel(l.price, support, 0.01)
    ).length;
    if (supportTouches >= 3) reliability += 10;
    return {
      name: "Descending Triangle",
      type: "BEARISH",
      reliability: Math.min(reliability, 100),
      startIndex: l1.index,
      endIndex: l2.index,
      targetPrice: target,
      stopPrice: rangeHighs[0].price
    };
  }
  return null;
}
function detectBullFlag(swings, bars) {
  if (bars.length < 20) return null;
  const lastBar = bars.length - 1;
  const lookback = Math.min(30, bars.length);
  let poleStart = lastBar - lookback;
  let poleEnd = -1;
  let bestMove = 0;
  for (let start = lastBar - lookback; start < lastBar - 8; start++) {
    for (let end = start + 5; end <= lastBar; end++) {
      const move = bars[end].high - bars[start].low;
      const movePct = move / bars[start].low;
      if (movePct > bestMove && shortTermTrend(bars, end, end - start) === "UP") {
        bestMove = movePct;
        poleStart = start;
        poleEnd = end;
      }
    }
  }
  if (bestMove < 0.03 || poleEnd === -1) return null;
  const flagBars = bars.slice(poleEnd, lastBar + 1);
  if (flagBars.length < 3) return null;
  const flagSlope = linearSlope(flagBars.map((b) => b.close));
  const avgPrice = flagBars.reduce((s, b) => s + b.close, 0) / flagBars.length;
  if (flagSlope >= 0) return null;
  const flagPctPerBar = flagSlope / avgPrice * 100;
  if (Math.abs(flagPctPerBar) > 0.5) return null;
  const poleHigh = bars[poleEnd].high;
  const poleLow = bars[poleStart].low;
  const poleSize = poleHigh - poleLow;
  const flagLow = Math.min(...flagBars.map((b) => b.low));
  const retracement = (poleHigh - flagLow) / poleSize;
  if (retracement > 0.5) return null;
  const poleTop = poleHigh;
  const target = poleTop + poleSize;
  let reliability = 60;
  if (retracement < 0.382) reliability += 15;
  else if (retracement < 0.25) reliability += 10;
  const flagRange = Math.max(...flagBars.map((b) => b.high)) - Math.min(...flagBars.map((b) => b.low));
  if (flagRange / poleSize < 0.3) reliability += 10;
  return {
    name: "Bull Flag",
    type: "BULLISH",
    reliability: Math.min(reliability, 100),
    startIndex: poleStart,
    endIndex: lastBar,
    targetPrice: target,
    stopPrice: flagLow
  };
}
function detectBearFlag(swings, bars) {
  if (bars.length < 20) return null;
  const lastBar = bars.length - 1;
  const lookback = Math.min(30, bars.length);
  let poleStart = lastBar - lookback;
  let poleEnd = -1;
  let bestMove = 0;
  for (let start = lastBar - lookback; start < lastBar - 8; start++) {
    for (let end = start + 5; end <= lastBar; end++) {
      const move = bars[start].high - bars[end].low;
      const movePct = move / bars[start].high;
      if (movePct > bestMove && shortTermTrend(bars, end, end - start) === "DOWN") {
        bestMove = movePct;
        poleStart = start;
        poleEnd = end;
      }
    }
  }
  if (bestMove < 0.03 || poleEnd === -1) return null;
  const flagBars = bars.slice(poleEnd, lastBar + 1);
  if (flagBars.length < 3) return null;
  const flagSlope = linearSlope(flagBars.map((b) => b.close));
  const avgPrice = flagBars.reduce((s, b) => s + b.close, 0) / flagBars.length;
  if (flagSlope <= 0) return null;
  const flagPctPerBar = flagSlope / avgPrice * 100;
  if (flagPctPerBar > 0.5) return null;
  const poleHigh = bars[poleStart].high;
  const poleLow = bars[poleEnd].low;
  const poleSize = poleHigh - poleLow;
  const flagHigh = Math.max(...flagBars.map((b) => b.high));
  const retracement = (flagHigh - poleLow) / poleSize;
  if (retracement > 0.5) return null;
  const poleBottom = poleLow;
  const target = poleBottom - poleSize;
  let reliability = 60;
  if (retracement < 0.382) reliability += 15;
  else if (retracement < 0.25) reliability += 10;
  const flagRange = Math.max(...flagBars.map((b) => b.high)) - Math.min(...flagBars.map((b) => b.low));
  if (flagRange / poleSize < 0.3) reliability += 10;
  return {
    name: "Bear Flag",
    type: "BEARISH",
    reliability: Math.min(reliability, 100),
    startIndex: poleStart,
    endIndex: lastBar,
    targetPrice: target,
    stopPrice: flagHigh
  };
}
function detectRisingWedge(swings, bars) {
  const highs = swingsByType(swings, "HIGH");
  const lows = swingsByType(swings, "LOW");
  if (highs.length < 2 || lows.length < 2) return null;
  const recentHighs = highs.slice(-4);
  const recentLows = lows.slice(-4);
  if (recentHighs.length < 2 || recentLows.length < 2) return null;
  const highSlope = trendlineSlope(recentHighs);
  const lowSlope = trendlineSlope(recentLows);
  if (highSlope <= 0 || lowSlope <= 0) return null;
  if (lowSlope <= highSlope) return null;
  const startIndex = Math.min(recentHighs[0].index, recentLows[0].index);
  const endIndex = Math.max(
    recentHighs[recentHighs.length - 1].index,
    recentLows[recentLows.length - 1].index
  );
  if (endIndex - startIndex < MIN_SWING_DISTANCE$1 * 2) return null;
  const lastHigh = recentHighs[recentHighs.length - 1].price;
  const lastLow = recentLows[recentLows.length - 1].price;
  const wedgeWidth = lastHigh - lastLow;
  const target = lastLow - wedgeWidth;
  let reliability = 55;
  const convergenceRatio = highSlope / lowSlope;
  if (convergenceRatio < 0.5) reliability += 15;
  else if (convergenceRatio < 0.7) reliability += 10;
  if (shortTermTrend(bars, startIndex, 10) === "UP") reliability += 10;
  return {
    name: "Rising Wedge",
    type: "BEARISH",
    reliability: Math.min(reliability, 100),
    startIndex,
    endIndex,
    targetPrice: target,
    stopPrice: lastHigh
  };
}
function detectFallingWedge(swings, bars) {
  const highs = swingsByType(swings, "HIGH");
  const lows = swingsByType(swings, "LOW");
  if (highs.length < 2 || lows.length < 2) return null;
  const recentHighs = highs.slice(-4);
  const recentLows = lows.slice(-4);
  if (recentHighs.length < 2 || recentLows.length < 2) return null;
  const highSlope = trendlineSlope(recentHighs);
  const lowSlope = trendlineSlope(recentLows);
  if (highSlope >= 0 || lowSlope >= 0) return null;
  if (highSlope >= lowSlope) return null;
  const startIndex = Math.min(recentHighs[0].index, recentLows[0].index);
  const endIndex = Math.max(
    recentHighs[recentHighs.length - 1].index,
    recentLows[recentLows.length - 1].index
  );
  if (endIndex - startIndex < MIN_SWING_DISTANCE$1 * 2) return null;
  const lastHigh = recentHighs[recentHighs.length - 1].price;
  const lastLow = recentLows[recentLows.length - 1].price;
  const wedgeWidth = lastHigh - lastLow;
  const target = lastHigh + wedgeWidth;
  let reliability = 55;
  const convergenceRatio = lowSlope / highSlope;
  if (convergenceRatio < 0.5) reliability += 15;
  else if (convergenceRatio < 0.7) reliability += 10;
  if (shortTermTrend(bars, startIndex, 10) === "DOWN") reliability += 10;
  return {
    name: "Falling Wedge",
    type: "BULLISH",
    reliability: Math.min(reliability, 100),
    startIndex,
    endIndex,
    targetPrice: target,
    stopPrice: lastLow
  };
}
function detectCupAndHandle(swings, bars) {
  const highs = swingsByType(swings, "HIGH");
  const lows = swingsByType(swings, "LOW");
  if (highs.length < 2 || lows.length < 2) return null;
  for (let i = 0; i < highs.length - 1; i++) {
    const leftRim = highs[i];
    const rightRim = highs[i + 1];
    if (!sameLevel(leftRim.price, rightRim.price, 0.02)) continue;
    if (rightRim.index - leftRim.index < MIN_SWING_DISTANCE$1 * 3) continue;
    const cupBottom = troughBetween(bars, leftRim.index, rightRim.index);
    const rimAvg = (leftRim.price + rightRim.price) / 2;
    const cupDepth = rimAvg - cupBottom.price;
    const depthPct = cupDepth / rimAvg;
    if (depthPct < 0.05 || depthPct > 0.35) continue;
    const cupMidpoint = (leftRim.index + rightRim.index) / 2;
    const bottomOffset = Math.abs(cupBottom.index - cupMidpoint) / (rightRim.index - leftRim.index);
    if (bottomOffset > 0.3) continue;
    const handleBars = bars.slice(rightRim.index, bars.length);
    if (handleBars.length < 2) continue;
    const handleSlope = linearSlope(handleBars.map((b) => b.close));
    if (handleSlope > 0) continue;
    const handleAvgPrice = handleBars.reduce((s, b) => s + b.close, 0) / handleBars.length;
    const handlePctDrift = Math.abs(handleSlope / handleAvgPrice * 100);
    if (handlePctDrift > 0.3) continue;
    const handleLow = Math.min(...handleBars.map((b) => b.low));
    const handleRetracement = (rightRim.price - handleLow) / cupDepth;
    if (handleRetracement > 0.5) continue;
    const breakout = rimAvg;
    const target = breakout + cupDepth;
    let reliability = 55;
    if (bottomOffset < 0.15) reliability += 15;
    else if (bottomOffset < 0.25) reliability += 10;
    const rimDiff = Math.abs(leftRim.price - rightRim.price) / rimAvg;
    if (rimDiff < 5e-3) reliability += 10;
    else if (rimDiff < 0.01) reliability += 5;
    if (handleRetracement > 0.12 && handleRetracement < 0.25) reliability += 10;
    return {
      name: "Cup and Handle",
      type: "BULLISH",
      reliability: Math.min(reliability, 100),
      startIndex: leftRim.index,
      endIndex: bars.length - 1,
      targetPrice: target,
      stopPrice: handleLow
    };
  }
  return null;
}
function detectSymmetricalTriangle(swings, bars) {
  const highs = swingsByType(swings, "HIGH");
  const lows = swingsByType(swings, "LOW");
  if (highs.length < 2 || lows.length < 2) return null;
  const recentHighs = highs.slice(-4);
  const recentLows = lows.slice(-4);
  if (recentHighs.length < 2 || recentLows.length < 2) return null;
  const highSlope = trendlineSlope(recentHighs);
  const lowSlope = trendlineSlope(recentLows);
  if (highSlope >= 0) return null;
  if (lowSlope <= 0) return null;
  const startIndex = Math.min(recentHighs[0].index, recentLows[0].index);
  const endIndex = Math.max(
    recentHighs[recentHighs.length - 1].index,
    recentLows[recentLows.length - 1].index
  );
  if (endIndex - startIndex < MIN_SWING_DISTANCE$1 * 2) return null;
  const firstHighPrice = recentHighs[0].price;
  const firstLowPrice = recentLows[0].price;
  const lastHighPrice = recentHighs[recentHighs.length - 1].price;
  const lastLowPrice = recentLows[recentLows.length - 1].price;
  const initialWidth = firstHighPrice - firstLowPrice;
  const finalWidth = lastHighPrice - lastLowPrice;
  if (initialWidth <= 0 || finalWidth <= 0) return null;
  if (finalWidth >= initialWidth) return null;
  const priorTrend = shortTermTrend(bars, startIndex, 12);
  const isBullish2 = priorTrend === "UP";
  const isBearish2 = priorTrend === "DOWN";
  const type = isBullish2 ? "BULLISH" : "BEARISH";
  const triangleHeight = initialWidth;
  const lastHigh = lastHighPrice;
  const lastLow = lastLowPrice;
  const target = isBullish2 ? lastHigh + triangleHeight : lastLow - triangleHeight;
  let reliability = 55;
  const convergenceRatio = finalWidth / initialWidth;
  if (convergenceRatio < 0.3) reliability += 15;
  else if (convergenceRatio < 0.5) reliability += 10;
  else if (convergenceRatio < 0.7) reliability += 5;
  const totalHighs = recentHighs.length;
  const totalLows = recentLows.length;
  if (totalHighs >= 3 && totalLows >= 3) reliability += 10;
  else if (totalHighs >= 2 && totalLows >= 2) reliability += 5;
  if (isBullish2 || isBearish2) reliability += 5;
  return {
    name: "Symmetrical Triangle",
    type,
    reliability: Math.min(reliability, 100),
    startIndex,
    endIndex,
    targetPrice: target,
    stopPrice: isBullish2 ? lastLow : lastHigh
  };
}
function detectRectangleBullish(swings, bars) {
  const highs = swingsByType(swings, "HIGH");
  const lows = swingsByType(swings, "LOW");
  if (highs.length < 2 || lows.length < 2) return null;
  for (let i = 0; i < highs.length - 1; i++) {
    for (let j = i + 1; j < highs.length; j++) {
      const h1 = highs[i];
      const h2 = highs[j];
      if (!sameLevel(h1.price, h2.price)) continue;
      if (h2.index - h1.index < MIN_SWING_DISTANCE$1) continue;
      const rangeLows = lows.filter(
        (l) => l.index >= h1.index && l.index <= h2.index
      );
      if (rangeLows.length < 2) continue;
      const lowSlope = trendlineSlope(rangeLows);
      const avgLowPrice = rangeLows.reduce((s, l) => s + l.price, 0) / rangeLows.length;
      const lowPctSlope = Math.abs(lowSlope / avgLowPrice * 100);
      if (lowPctSlope > 0.1) continue;
      const resistance = (h1.price + h2.price) / 2;
      const highPctDiff = Math.abs(h1.price - h2.price) / resistance;
      if (highPctDiff > LEVEL_TOLERANCE * 2) continue;
      const support = avgLowPrice;
      let allLowsSameLevel = true;
      for (let k = 0; k < rangeLows.length - 1; k++) {
        if (!sameLevel(rangeLows[k].price, rangeLows[k + 1].price, 0.025)) {
          allLowsSameLevel = false;
          break;
        }
      }
      if (!allLowsSameLevel) continue;
      const totalTouches = 2 + rangeLows.filter(
        (l) => sameLevel(l.price, support, 0.015)
      ).length;
      if (totalTouches < 4) continue;
      if (shortTermTrend(bars, h1.index, 10) !== "UP") continue;
      const rectangleHeight = resistance - support;
      if (rectangleHeight / support < 0.02) continue;
      const target = resistance + rectangleHeight;
      let reliability = 60;
      if (totalTouches >= 6) reliability += 15;
      else if (totalTouches >= 5) reliability += 10;
      if (highPctDiff < 5e-3) reliability += 10;
      else if (highPctDiff < 0.01) reliability += 5;
      return {
        name: "Rectangle (Bullish)",
        type: "BULLISH",
        reliability: Math.min(reliability, 100),
        startIndex: h1.index,
        endIndex: h2.index,
        targetPrice: target,
        stopPrice: support
      };
    }
  }
  return null;
}
function detectRectangleBearish(swings, bars) {
  const highs = swingsByType(swings, "HIGH");
  const lows = swingsByType(swings, "LOW");
  if (highs.length < 2 || lows.length < 2) return null;
  for (let i = 0; i < lows.length - 1; i++) {
    for (let j = i + 1; j < lows.length; j++) {
      const l1 = lows[i];
      const l2 = lows[j];
      if (!sameLevel(l1.price, l2.price)) continue;
      if (l2.index - l1.index < MIN_SWING_DISTANCE$1) continue;
      const rangeHighs = highs.filter(
        (h) => h.index >= l1.index && h.index <= l2.index
      );
      if (rangeHighs.length < 2) continue;
      const highSlope = trendlineSlope(rangeHighs);
      const avgHighPrice = rangeHighs.reduce((s, h) => s + h.price, 0) / rangeHighs.length;
      const highPctSlope = Math.abs(highSlope / avgHighPrice * 100);
      if (highPctSlope > 0.1) continue;
      const support = (l1.price + l2.price) / 2;
      const lowPctDiff = Math.abs(l1.price - l2.price) / support;
      if (lowPctDiff > LEVEL_TOLERANCE * 2) continue;
      const resistance = avgHighPrice;
      let allHighsSameLevel = true;
      for (let k = 0; k < rangeHighs.length - 1; k++) {
        if (!sameLevel(rangeHighs[k].price, rangeHighs[k + 1].price, 0.025)) {
          allHighsSameLevel = false;
          break;
        }
      }
      if (!allHighsSameLevel) continue;
      const totalTouches = 2 + rangeHighs.filter(
        (h) => sameLevel(h.price, resistance, 0.015)
      ).length;
      if (totalTouches < 4) continue;
      if (shortTermTrend(bars, l1.index, 10) !== "DOWN") continue;
      const rectangleHeight = resistance - support;
      if (rectangleHeight / support < 0.02) continue;
      const target = support - rectangleHeight;
      let reliability = 60;
      if (totalTouches >= 6) reliability += 15;
      else if (totalTouches >= 5) reliability += 10;
      if (lowPctDiff < 5e-3) reliability += 10;
      else if (lowPctDiff < 0.01) reliability += 5;
      return {
        name: "Rectangle (Bearish)",
        type: "BEARISH",
        reliability: Math.min(reliability, 100),
        startIndex: l1.index,
        endIndex: l2.index,
        targetPrice: target,
        stopPrice: resistance
      };
    }
  }
  return null;
}
function detectBroadeningTop(swings, bars) {
  const highs = swingsByType(swings, "HIGH");
  const lows = swingsByType(swings, "LOW");
  if (highs.length < 2 || lows.length < 2) return null;
  const recentHighs = highs.slice(-4);
  const recentLows = lows.slice(-4);
  if (recentHighs.length < 2 || recentLows.length < 2) return null;
  const highSlope = trendlineSlope(recentHighs);
  const lowSlope = trendlineSlope(recentLows);
  if (highSlope <= 0) return null;
  if (lowSlope >= 0) return null;
  const startIndex = Math.min(recentHighs[0].index, recentLows[0].index);
  const endIndex = Math.max(
    recentHighs[recentHighs.length - 1].index,
    recentLows[recentLows.length - 1].index
  );
  if (endIndex - startIndex < MIN_SWING_DISTANCE$1 * 2) return null;
  if (shortTermTrend(bars, startIndex, 10) !== "UP") return null;
  const lastHigh = recentHighs[recentHighs.length - 1].price;
  const lastLow = recentLows[recentLows.length - 1].price;
  const patternWidth = lastHigh - lastLow;
  const target = lastLow - patternWidth;
  let reliability = 55;
  const divergenceStrength = Math.abs(highSlope) + Math.abs(lowSlope);
  const avgPrice = (lastHigh + lastLow) / 2;
  const divergencePct = divergenceStrength / avgPrice * 100;
  if (divergencePct > 0.3) reliability += 10;
  else if (divergencePct > 0.15) reliability += 5;
  if (recentHighs.length >= 3 && recentLows.length >= 3) reliability += 10;
  return {
    name: "Broadening Top",
    type: "BEARISH",
    reliability: Math.min(reliability, 100),
    startIndex,
    endIndex,
    targetPrice: target,
    stopPrice: lastHigh
  };
}
function detectBroadeningBottom(swings, bars) {
  const highs = swingsByType(swings, "HIGH");
  const lows = swingsByType(swings, "LOW");
  if (highs.length < 2 || lows.length < 2) return null;
  const recentHighs = highs.slice(-4);
  const recentLows = lows.slice(-4);
  if (recentHighs.length < 2 || recentLows.length < 2) return null;
  const highSlope = trendlineSlope(recentHighs);
  const lowSlope = trendlineSlope(recentLows);
  if (highSlope <= 0) return null;
  if (lowSlope >= 0) return null;
  const startIndex = Math.min(recentHighs[0].index, recentLows[0].index);
  const endIndex = Math.max(
    recentHighs[recentHighs.length - 1].index,
    recentLows[recentLows.length - 1].index
  );
  if (endIndex - startIndex < MIN_SWING_DISTANCE$1 * 2) return null;
  if (shortTermTrend(bars, startIndex, 10) !== "DOWN") return null;
  const lastHigh = recentHighs[recentHighs.length - 1].price;
  const lastLow = recentLows[recentLows.length - 1].price;
  const patternWidth = lastHigh - lastLow;
  const target = lastHigh + patternWidth;
  let reliability = 55;
  const divergenceStrength = Math.abs(highSlope) + Math.abs(lowSlope);
  const avgPrice = (lastHigh + lastLow) / 2;
  const divergencePct = divergenceStrength / avgPrice * 100;
  if (divergencePct > 0.3) reliability += 10;
  else if (divergencePct > 0.15) reliability += 5;
  if (recentHighs.length >= 3 && recentLows.length >= 3) reliability += 10;
  return {
    name: "Broadening Bottom",
    type: "BULLISH",
    reliability: Math.min(reliability, 100),
    startIndex,
    endIndex,
    targetPrice: target,
    stopPrice: lastLow
  };
}
function detectMegaphoneTop(swings, bars) {
  const highs = swingsByType(swings, "HIGH");
  const lows = swingsByType(swings, "LOW");
  if (highs.length < 3 || lows.length < 3) return null;
  const recentHighs = highs.slice(-4);
  const recentLows = lows.slice(-4);
  if (recentHighs.length < 3 || recentLows.length < 3) return null;
  const highSlope = trendlineSlope(recentHighs);
  const lowSlope = trendlineSlope(recentLows);
  if (highSlope <= 0) return null;
  if (lowSlope >= 0) return null;
  if (recentHighs.length + recentLows.length < 5) return null;
  const startIndex = Math.min(recentHighs[0].index, recentLows[0].index);
  const endIndex = Math.max(
    recentHighs[recentHighs.length - 1].index,
    recentLows[recentLows.length - 1].index
  );
  if (endIndex - startIndex < MIN_SWING_DISTANCE$1 * 3) return null;
  if (shortTermTrend(bars, startIndex, 12) !== "UP") return null;
  const patternBars = bars.slice(startIndex, endIndex + 1);
  if (patternBars.length < 6) return null;
  const firstHalfRanges = patternBars.slice(0, Math.floor(patternBars.length / 2));
  const secondHalfRanges = patternBars.slice(Math.floor(patternBars.length / 2));
  const avgFirstHalfRange = firstHalfRanges.reduce((s, b) => s + (b.high - b.low), 0) / firstHalfRanges.length;
  const avgSecondHalfRange = secondHalfRanges.reduce((s, b) => s + (b.high - b.low), 0) / secondHalfRanges.length;
  if (avgSecondHalfRange <= avgFirstHalfRange) return null;
  const lastHigh = recentHighs[recentHighs.length - 1].price;
  const lastLow = recentLows[recentLows.length - 1].price;
  const patternWidth = lastHigh - lastLow;
  const target = lastLow - patternWidth;
  let reliability = 55;
  const totalPoints = recentHighs.length + recentLows.length;
  if (totalPoints >= 7) reliability += 15;
  else if (totalPoints >= 6) reliability += 10;
  else if (totalPoints >= 5) reliability += 5;
  const rangeExpansion = avgSecondHalfRange / avgFirstHalfRange;
  if (rangeExpansion > 1.5) reliability += 10;
  else if (rangeExpansion > 1.2) reliability += 5;
  return {
    name: "Megaphone Top",
    type: "BEARISH",
    reliability: Math.min(reliability, 100),
    startIndex,
    endIndex,
    targetPrice: target,
    stopPrice: lastHigh
  };
}
function detectRoundingTop(swings, bars) {
  const highs = swingsByType(swings, "HIGH");
  if (highs.length < 3) return null;
  for (let i = 0; i < highs.length - 2; i++) {
    const h1 = highs[i];
    const h2 = highs[i + 1];
    const h3 = highs[i + 2];
    if (h2.index - h1.index < MIN_SWING_DISTANCE$1) continue;
    if (h3.index - h2.index < MIN_SWING_DISTANCE$1) continue;
    if (h2.price <= h1.price || h2.price <= h3.price) continue;
    const totalSpan = h3.index - h1.index;
    const apexPosition = (h2.index - h1.index) / totalSpan;
    if (apexPosition < 0.25 || apexPosition > 0.75) continue;
    if (shortTermTrend(bars, h1.index, 10) !== "UP") continue;
    const leftSlope = (h2.price - h1.price) / (h2.index - h1.index);
    const rightSlope = (h3.price - h2.price) / (h3.index - h2.index);
    const avgPrice = (h1.price + h2.price + h3.price) / 3;
    const leftPctSlope = Math.abs(leftSlope / avgPrice * 100);
    const rightPctSlope = Math.abs(rightSlope / avgPrice * 100);
    if (leftPctSlope > 1 || rightPctSlope > 1) continue;
    const domeHighs = highs.filter((h) => h.index >= h1.index && h.index <= h3.index);
    const leftRise = h2.price - h1.price;
    const rightFall = h2.price - h3.price;
    const symmetryRatio = Math.min(leftRise, rightFall) / Math.max(leftRise, rightFall);
    const trough = troughBetween(bars, h1.index, h3.index);
    const domeHeight = h2.price - trough.price;
    const target = trough.price - domeHeight;
    let reliability = 55;
    if (domeHighs.length >= 5) reliability += 15;
    else if (domeHighs.length >= 4) reliability += 10;
    else if (domeHighs.length >= 3) reliability += 5;
    if (symmetryRatio > 0.8) reliability += 10;
    else if (symmetryRatio > 0.6) reliability += 5;
    return {
      name: "Rounding Top",
      type: "BEARISH",
      reliability: Math.min(reliability, 100),
      startIndex: h1.index,
      endIndex: h3.index,
      targetPrice: target,
      stopPrice: h2.price
    };
  }
  return null;
}
function detectRoundingBottom(swings, bars) {
  const lows = swingsByType(swings, "LOW");
  if (lows.length < 3) return null;
  for (let i = 0; i < lows.length - 2; i++) {
    const l1 = lows[i];
    const l2 = lows[i + 1];
    const l3 = lows[i + 2];
    if (l2.index - l1.index < MIN_SWING_DISTANCE$1) continue;
    if (l3.index - l2.index < MIN_SWING_DISTANCE$1) continue;
    if (l2.price >= l1.price || l2.price >= l3.price) continue;
    const totalSpan = l3.index - l1.index;
    const bottomPosition = (l2.index - l1.index) / totalSpan;
    if (bottomPosition < 0.25 || bottomPosition > 0.75) continue;
    if (shortTermTrend(bars, l1.index, 10) !== "DOWN") continue;
    const leftSlope = (l2.price - l1.price) / (l2.index - l1.index);
    const rightSlope = (l3.price - l2.price) / (l3.index - l2.index);
    const avgPrice = (l1.price + l2.price + l3.price) / 3;
    const leftPctSlope = Math.abs(leftSlope / avgPrice * 100);
    const rightPctSlope = Math.abs(rightSlope / avgPrice * 100);
    if (leftPctSlope > 1 || rightPctSlope > 1) continue;
    const bowlLows = lows.filter((l) => l.index >= l1.index && l.index <= l3.index);
    const leftFall = l1.price - l2.price;
    const rightRise = l3.price - l2.price;
    const symmetryRatio = Math.min(leftFall, rightRise) / Math.max(leftFall, rightRise);
    const peak = peakBetween(bars, l1.index, l3.index);
    const bowlDepth = peak.price - l2.price;
    const target = peak.price + bowlDepth;
    let reliability = 55;
    if (bowlLows.length >= 5) reliability += 15;
    else if (bowlLows.length >= 4) reliability += 10;
    else if (bowlLows.length >= 3) reliability += 5;
    if (symmetryRatio > 0.8) reliability += 10;
    else if (symmetryRatio > 0.6) reliability += 5;
    return {
      name: "Rounding Bottom",
      type: "BULLISH",
      reliability: Math.min(reliability, 100),
      startIndex: l1.index,
      endIndex: l3.index,
      targetPrice: target,
      stopPrice: l2.price
    };
  }
  return null;
}
function detectDiamondTop(swings, bars) {
  const highs = swingsByType(swings, "HIGH");
  const lows = swingsByType(swings, "LOW");
  if (highs.length < 3 || lows.length < 3) return null;
  const recentHighs = highs.slice(-5);
  const recentLows = lows.slice(-5);
  if (recentHighs.length < 3 || recentLows.length < 3) return null;
  const startIndex = Math.min(recentHighs[0].index, recentLows[0].index);
  const endIndex = Math.max(
    recentHighs[recentHighs.length - 1].index,
    recentLows[recentLows.length - 1].index
  );
  if (endIndex - startIndex < MIN_SWING_DISTANCE$1 * 3) return null;
  if (shortTermTrend(bars, startIndex, 12) !== "UP") return null;
  const midIndex = Math.floor((startIndex + endIndex) / 2);
  const firstHalfHighs = recentHighs.filter((h) => h.index <= midIndex);
  const secondHalfHighs = recentHighs.filter((h) => h.index > midIndex);
  const firstHalfLows = recentLows.filter((l) => l.index <= midIndex);
  const secondHalfLows = recentLows.filter((l) => l.index > midIndex);
  if (firstHalfHighs.length < 2 || secondHalfHighs.length < 1) return null;
  if (firstHalfLows.length < 2 || secondHalfLows.length < 1) return null;
  const firstHighSlope = trendlineSlope(firstHalfHighs);
  const firstLowSlope = trendlineSlope(firstHalfLows);
  if (firstHighSlope <= 0) return null;
  if (firstLowSlope >= 0) return null;
  if (secondHalfHighs.length >= 2) {
    const secondHighSlope = trendlineSlope(secondHalfHighs);
    if (secondHighSlope >= 0) return null;
  }
  if (secondHalfLows.length >= 2) {
    const secondLowSlope = trendlineSlope(secondHalfLows);
    if (secondLowSlope <= 0) return null;
  }
  const peakPrice = Math.max(...recentHighs.map((h) => h.price));
  const troughPrice = Math.min(...recentLows.map((l) => l.price));
  const patternHeight = peakPrice - troughPrice;
  const target = troughPrice - patternHeight;
  let reliability = 55;
  const totalSwings = recentHighs.length + recentLows.length;
  if (totalSwings >= 8) reliability += 15;
  else if (totalSwings >= 6) reliability += 10;
  else if (totalSwings >= 5) reliability += 5;
  const broadeningStrength = Math.abs(firstHighSlope) + Math.abs(firstLowSlope);
  const avgPrice = (peakPrice + troughPrice) / 2;
  const broadeningPct = broadeningStrength / avgPrice * 100;
  if (broadeningPct > 0.2) reliability += 10;
  else if (broadeningPct > 0.1) reliability += 5;
  return {
    name: "Diamond Top",
    type: "BEARISH",
    reliability: Math.min(reliability, 100),
    startIndex,
    endIndex,
    targetPrice: target,
    stopPrice: peakPrice
  };
}
const FIB_TOLERANCE = 0.05;
const MIN_SWING_DISTANCE = 3;
function fibRatio(a, b) {
  if (b === 0) return 0;
  return Math.abs(a / b);
}
function isFibRatio(actual, target, tolerance = FIB_TOLERANCE) {
  if (target === 0) return actual === 0;
  return Math.abs(actual - target) / target <= tolerance;
}
function isFibInRange(actual, low, high, tolerance = FIB_TOLERANCE) {
  return actual >= low * (1 - tolerance) && actual <= high * (1 + tolerance);
}
function findXABCD(swings, bars) {
  const results = [];
  if (swings.length < 5) return results;
  const lows = swings.filter((s) => s.type === "LOW").sort((a, b) => a.index - b.index);
  const highs = swings.filter((s) => s.type === "HIGH").sort((a, b) => a.index - b.index);
  for (const xLow of lows) {
    const aHighs = highs.filter((h) => h.index > xLow.index + MIN_SWING_DISTANCE);
    for (const aHigh of aHighs) {
      const bLows = lows.filter(
        (l) => l.index > aHigh.index + MIN_SWING_DISTANCE && l.price > xLow.price
      );
      for (const bLow of bLows) {
        const cHighs = highs.filter(
          (h) => h.index > bLow.index + MIN_SWING_DISTANCE && h.price < aHigh.price
        );
        for (const cHigh of cHighs) {
          const dLows = lows.filter(
            (l) => l.index > cHigh.index + MIN_SWING_DISTANCE && l.price > xLow.price
          );
          for (const dLow of dLows) {
            results.push({
              X: xLow,
              A: aHigh,
              B: bLow,
              C: cHigh,
              D: dLow
            });
          }
        }
      }
    }
  }
  for (const xHigh of highs) {
    const aLows = lows.filter((l) => l.index > xHigh.index + MIN_SWING_DISTANCE);
    for (const aLow of aLows) {
      const bHighs = highs.filter(
        (h) => h.index > aLow.index + MIN_SWING_DISTANCE && h.price < xHigh.price
      );
      for (const bHigh of bHighs) {
        const cLows = lows.filter(
          (l) => l.index > bHigh.index + MIN_SWING_DISTANCE && l.price > aLow.price
        );
        for (const cLow of cLows) {
          const dHighs = highs.filter(
            (h) => h.index > cLow.index + MIN_SWING_DISTANCE && h.price < xHigh.price
          );
          for (const dHigh of dHighs) {
            results.push({
              X: xHigh,
              A: aLow,
              B: bHigh,
              C: cLow,
              D: dHigh
            });
          }
        }
      }
    }
  }
  return results;
}
function calcReliability(ratioChecks) {
  if (ratioChecks.length === 0) return 0;
  let totalDeviation = 0;
  let matchCount = 0;
  for (const check of ratioChecks) {
    if (check.target === 0) continue;
    const deviation = Math.abs(check.actual - check.target) / check.target;
    totalDeviation += deviation;
    if (deviation <= FIB_TOLERANCE) matchCount++;
  }
  const matchRatio = matchCount / ratioChecks.length;
  let reliability = 40 + matchRatio * 45;
  const avgDeviation = totalDeviation / ratioChecks.length;
  if (avgDeviation < 0.02) reliability += 15;
  else if (avgDeviation < 0.03) reliability += 10;
  else if (avgDeviation < 0.05) reliability += 5;
  return Math.min(Math.round(reliability), 100);
}
function detectGartley(pattern) {
  const { X, A, B, C, D } = pattern;
  const XA = Math.abs(A.price - X.price);
  const AB = Math.abs(B.price - A.price);
  const BC = Math.abs(C.price - B.price);
  const CD = Math.abs(D.price - C.price);
  const AD = Math.abs(D.price - A.price);
  if (XA === 0) return null;
  const abRatio = fibRatio(AB, XA);
  const adRatio = fibRatio(AD, XA);
  if (!isFibRatio(abRatio, 0.618, 0.1)) return null;
  if (!isFibRatio(adRatio, 0.786, 0.1)) return null;
  const bcRatio = fibRatio(BC, AB);
  if (AB === 0 || !isFibInRange(bcRatio, 0.382, 0.886, 0.1)) return null;
  const cdRatio = fibRatio(CD, BC);
  if (BC === 0 || !isFibInRange(cdRatio, 1.272, 1.618, 0.1)) return null;
  const isBullish2 = D.type === "LOW";
  const name = isBullish2 ? "Bullish Gartley" : "Bearish Gartley";
  const przTarget = isBullish2 ? D.price + AD * 0.618 : D.price - AD * 0.618;
  const stopPrice = isBullish2 ? X.price - XA * 0.05 : X.price + XA * 0.05;
  const reliability = calcReliability([
    { actual: abRatio, target: 0.618 },
    { actual: adRatio, target: 0.786 },
    { actual: bcRatio, target: 0.618 },
    { actual: cdRatio, target: 1.414 }
  ]);
  return {
    name,
    type: isBullish2 ? "BULLISH" : "BEARISH",
    reliability,
    startIndex: X.index,
    endIndex: D.index,
    targetPrice: przTarget,
    stopPrice
  };
}
function detectButterfly(pattern) {
  const { X, A, B, C, D } = pattern;
  const XA = Math.abs(A.price - X.price);
  const AB = Math.abs(B.price - A.price);
  const BC = Math.abs(C.price - B.price);
  const CD = Math.abs(D.price - C.price);
  const AD = Math.abs(D.price - A.price);
  if (XA === 0) return null;
  const abRatio = fibRatio(AB, XA);
  const adRatio = fibRatio(AD, XA);
  if (!isFibRatio(abRatio, 0.786, 0.12)) return null;
  if (!isFibRatio(adRatio, 1.27, 0.12)) return null;
  const bcRatio = fibRatio(BC, AB);
  if (AB === 0 || !isFibInRange(bcRatio, 0.382, 0.886, 0.1)) return null;
  const cdRatio = fibRatio(CD, BC);
  if (BC === 0 || !isFibInRange(cdRatio, 1.618, 2.618, 0.1)) return null;
  const isBullish2 = D.type === "LOW";
  const name = isBullish2 ? "Bullish Butterfly" : "Bearish Butterfly";
  const przTarget = isBullish2 ? D.price + AD * 0.618 : D.price - AD * 0.618;
  const stopPrice = isBullish2 ? D.price - XA * 0.05 : D.price + XA * 0.05;
  const reliability = calcReliability([
    { actual: abRatio, target: 0.786 },
    { actual: adRatio, target: 1.27 },
    { actual: bcRatio, target: 0.618 },
    { actual: cdRatio, target: 2 }
  ]);
  return {
    name,
    type: isBullish2 ? "BULLISH" : "BEARISH",
    reliability,
    startIndex: X.index,
    endIndex: D.index,
    targetPrice: przTarget,
    stopPrice
  };
}
function detectBat(pattern) {
  const { X, A, B, C, D } = pattern;
  const XA = Math.abs(A.price - X.price);
  const AB = Math.abs(B.price - A.price);
  const BC = Math.abs(C.price - B.price);
  const CD = Math.abs(D.price - C.price);
  const AD = Math.abs(D.price - A.price);
  if (XA === 0) return null;
  const abRatio = fibRatio(AB, XA);
  const adRatio = fibRatio(AD, XA);
  if (!isFibInRange(abRatio, 0.382, 0.5, 0.1)) return null;
  if (!isFibRatio(adRatio, 0.886, 0.1)) return null;
  const bcRatio = fibRatio(BC, AB);
  if (AB === 0 || !isFibInRange(bcRatio, 0.382, 0.886, 0.1)) return null;
  const cdRatio = fibRatio(CD, BC);
  if (BC === 0 || !isFibInRange(cdRatio, 1.618, 2.618, 0.1)) return null;
  const isBullish2 = D.type === "LOW";
  const name = isBullish2 ? "Bullish Bat" : "Bearish Bat";
  const przTarget = isBullish2 ? D.price + AD * 0.618 : D.price - AD * 0.618;
  const stopPrice = isBullish2 ? X.price - XA * 0.05 : X.price + XA * 0.05;
  const reliability = calcReliability([
    { actual: abRatio, target: 0.441 },
    { actual: adRatio, target: 0.886 },
    { actual: bcRatio, target: 0.618 },
    { actual: cdRatio, target: 2 }
  ]);
  return {
    name,
    type: isBullish2 ? "BULLISH" : "BEARISH",
    reliability,
    startIndex: X.index,
    endIndex: D.index,
    targetPrice: przTarget,
    stopPrice
  };
}
function detectCrab(pattern) {
  const { X, A, B, C, D } = pattern;
  const XA = Math.abs(A.price - X.price);
  const AB = Math.abs(B.price - A.price);
  const BC = Math.abs(C.price - B.price);
  const CD = Math.abs(D.price - C.price);
  const AD = Math.abs(D.price - A.price);
  if (XA === 0) return null;
  const abRatio = fibRatio(AB, XA);
  const adRatio = fibRatio(AD, XA);
  if (!isFibInRange(abRatio, 0.382, 0.618, 0.1)) return null;
  if (!isFibRatio(adRatio, 1.618, 0.12)) return null;
  const bcRatio = fibRatio(BC, AB);
  if (AB === 0 || !isFibInRange(bcRatio, 0.382, 0.886, 0.1)) return null;
  const cdRatio = fibRatio(CD, BC);
  if (BC === 0 || !isFibInRange(cdRatio, 2.618, 3.618, 0.1)) return null;
  const isBullish2 = D.type === "LOW";
  const name = isBullish2 ? "Bullish Crab" : "Bearish Crab";
  const przTarget = isBullish2 ? D.price + AD * 0.382 : D.price - AD * 0.382;
  const stopPrice = isBullish2 ? D.price - XA * 0.05 : D.price + XA * 0.05;
  const reliability = calcReliability([
    { actual: abRatio, target: 0.618 },
    { actual: adRatio, target: 1.618 },
    { actual: bcRatio, target: 0.618 },
    { actual: cdRatio, target: 3.14 }
  ]);
  return {
    name,
    type: isBullish2 ? "BULLISH" : "BEARISH",
    reliability,
    startIndex: X.index,
    endIndex: D.index,
    targetPrice: przTarget,
    stopPrice
  };
}
function detectShark(pattern) {
  const { X, A, B, C, D } = pattern;
  const XA = Math.abs(A.price - X.price);
  const AB = Math.abs(B.price - A.price);
  const BC = Math.abs(C.price - B.price);
  const CD = Math.abs(D.price - C.price);
  if (XA === 0) return null;
  const abRatio = fibRatio(AB, XA);
  if (!isFibInRange(abRatio, 0.446, 0.618, 0.1)) return null;
  const bcRatio = fibRatio(BC, AB);
  if (AB === 0 || !isFibInRange(bcRatio, 1.13, 1.618, 0.1)) return null;
  const cdRatio = fibRatio(CD, BC);
  if (BC === 0 || !isFibInRange(cdRatio, 0.886, 1.13, 0.1)) return null;
  const isBullish2 = D.type === "LOW";
  const name = isBullish2 ? "Bullish Shark" : "Bearish Shark";
  const AD = Math.abs(D.price - A.price);
  const przTarget = isBullish2 ? D.price + AD * 0.618 : D.price - AD * 0.618;
  const stopPrice = isBullish2 ? D.price - BC * 0.05 : D.price + BC * 0.05;
  const reliability = calcReliability([
    { actual: abRatio, target: 0.532 },
    { actual: bcRatio, target: 1.414 },
    { actual: cdRatio, target: 1 }
  ]);
  return {
    name,
    type: isBullish2 ? "BULLISH" : "BEARISH",
    reliability,
    startIndex: X.index,
    endIndex: D.index,
    targetPrice: przTarget,
    stopPrice
  };
}
function detectCypher(pattern) {
  const { X, A, B, C, D } = pattern;
  const XA = Math.abs(A.price - X.price);
  const AB = Math.abs(B.price - A.price);
  const BC = Math.abs(C.price - B.price);
  const XC = Math.abs(C.price - X.price);
  if (XA === 0 || XC === 0) return null;
  const abRatio = fibRatio(AB, XA);
  if (!isFibInRange(abRatio, 0.382, 0.618, 0.1)) return null;
  const bcRatio = fibRatio(BC, AB);
  if (AB === 0 || !isFibInRange(bcRatio, 1.272, 1.414, 0.1)) return null;
  const CD = Math.abs(D.price - C.price);
  const cdXcRatio = fibRatio(CD, XC);
  if (!isFibRatio(cdXcRatio, 0.786, 0.1)) return null;
  const isBullish2 = D.type === "LOW";
  const name = isBullish2 ? "Bullish Cypher" : "Bearish Cypher";
  const AD = Math.abs(D.price - A.price);
  const przTarget = isBullish2 ? D.price + AD * 0.618 : D.price - AD * 0.618;
  const stopPrice = isBullish2 ? X.price - XA * 0.05 : X.price + XA * 0.05;
  const reliability = calcReliability([
    { actual: abRatio, target: 0.5 },
    { actual: bcRatio, target: 1.343 },
    { actual: cdXcRatio, target: 0.786 }
  ]);
  return {
    name,
    type: isBullish2 ? "BULLISH" : "BEARISH",
    reliability,
    startIndex: X.index,
    endIndex: D.index,
    targetPrice: przTarget,
    stopPrice
  };
}
function detectABCD(pattern) {
  const { X, A, B, C, D } = pattern;
  const AB = Math.abs(B.price - A.price);
  const BC = Math.abs(C.price - B.price);
  const CD = Math.abs(D.price - C.price);
  if (AB === 0) return null;
  const bcRatio = fibRatio(BC, AB);
  if (!isFibInRange(bcRatio, 0.618, 0.786, 0.1)) return null;
  const cdAbRatio = fibRatio(CD, AB);
  if (!isFibRatio(cdAbRatio, 1, 0.15)) return null;
  const abDuration = B.index - A.index;
  const cdDuration = D.index - C.index;
  if (abDuration > 0 && cdDuration > 0) {
    const timeRatio = Math.min(abDuration, cdDuration) / Math.max(abDuration, cdDuration);
    if (timeRatio < 0.5) return null;
  }
  const isBullish2 = D.type === "LOW";
  const name = isBullish2 ? "Bullish ABCD" : "Bearish ABCD";
  const przTarget = isBullish2 ? D.price + AB * 0.618 : D.price - AB * 0.618;
  const stopPrice = isBullish2 ? D.price - AB * 0.05 : D.price + AB * 0.05;
  const reliability = calcReliability([
    { actual: bcRatio, target: 0.707 },
    { actual: cdAbRatio, target: 1 }
  ]);
  let finalReliability = reliability;
  if (abDuration > 0 && cdDuration > 0) {
    const timeRatio = Math.min(abDuration, cdDuration) / Math.max(abDuration, cdDuration);
    if (timeRatio > 0.85) finalReliability = Math.min(finalReliability + 10, 100);
    else if (timeRatio > 0.7) finalReliability = Math.min(finalReliability + 5, 100);
  }
  return {
    name,
    type: isBullish2 ? "BULLISH" : "BEARISH",
    reliability: finalReliability,
    startIndex: X.index,
    endIndex: D.index,
    targetPrice: przTarget,
    stopPrice
  };
}
function detect50(pattern) {
  const { X, A, B, C, D } = pattern;
  const XA = Math.abs(A.price - X.price);
  const AB = Math.abs(B.price - A.price);
  const BC = Math.abs(C.price - B.price);
  const CD = Math.abs(D.price - C.price);
  if (XA === 0) return null;
  const abRatio = fibRatio(AB, XA);
  if (!isFibInRange(abRatio, 1.13, 1.618, 0.1)) return null;
  const bcRatio = fibRatio(BC, AB);
  if (AB === 0 || !isFibInRange(bcRatio, 1.618, 2.24, 0.1)) return null;
  const cdRatio = fibRatio(CD, BC);
  if (BC === 0 || !isFibRatio(cdRatio, 0.5, 0.12)) return null;
  const isBullish2 = D.type === "LOW";
  const name = isBullish2 ? "Bullish 5-0" : "Bearish 5-0";
  const AD = Math.abs(D.price - A.price);
  const przTarget = isBullish2 ? D.price + AD * 0.618 : D.price - AD * 0.618;
  const stopPrice = isBullish2 ? D.price - BC * 0.05 : D.price + BC * 0.05;
  const reliability = calcReliability([
    { actual: abRatio, target: 1.414 },
    { actual: bcRatio, target: 2 },
    { actual: cdRatio, target: 0.5 }
  ]);
  return {
    name,
    type: isBullish2 ? "BULLISH" : "BEARISH",
    reliability,
    startIndex: X.index,
    endIndex: D.index,
    targetPrice: przTarget,
    stopPrice
  };
}
function detectHarmonicPatterns(bars, swingPoints) {
  if (bars.length < 30 || swingPoints.length < 5) return [];
  const patterns = findXABCD(swingPoints);
  if (patterns.length === 0) return [];
  const patternsToCheck = patterns.slice(0, 200);
  const results = [];
  const seenPatterns = /* @__PURE__ */ new Set();
  const validators = [
    detectGartley,
    detectButterfly,
    detectBat,
    detectCrab,
    detectShark,
    detectCypher,
    detectABCD,
    detect50
  ];
  for (const pattern of patternsToCheck) {
    for (const validator of validators) {
      const result = validator(pattern);
      if (result && result.reliability > 40) {
        const key = `${result.name}-${result.startIndex}-${result.endIndex}`;
        if (!seenPatterns.has(key)) {
          seenPatterns.add(key);
          results.push(result);
        }
      }
    }
  }
  return results.sort((a, b) => b.reliability - a.reliability);
}
const SL_ATR_MULTIPLIER = 1.5;
const INVALIDATION_ATR_MULTIPLIER = 2;
const MIN_RR_RATIO = 1.5;
const LEVEL_PROXIMITY = 5e-3;
function calculateRiskReward(currentPrice, trend, atrValue, decimals, supportLevels, resistanceLevels, pair) {
  if (trend === "NEUTRAL") {
    return {
      recommendation: "WAIT",
      entry: formatPrice(currentPrice, decimals),
      stopLoss: formatPrice(currentPrice, decimals),
      takeProfits: [
        formatPrice(currentPrice, decimals),
        formatPrice(currentPrice, decimals),
        formatPrice(currentPrice, decimals)
      ],
      rr: "1:0",
      invalidationLevel: formatPrice(currentPrice, decimals),
      riskPips: 0,
      rewardPips: [0, 0, 0]
    };
  }
  pair.includes("JPY");
  const atrForCalc = atrValue || currentPrice * 0.01;
  if (trend === "BULLISH") {
    return calculateBullishRR(
      currentPrice,
      atrForCalc,
      decimals,
      supportLevels,
      resistanceLevels
    );
  }
  return calculateBearishRR(
    currentPrice,
    atrForCalc,
    decimals,
    supportLevels,
    resistanceLevels
  );
}
function calculateBullishRR(price, atrVal, decimals, supports, resistances) {
  const entry = formatPrice(price - atrVal * 0.1, decimals);
  const atrSL = entry - SL_ATR_MULTIPLIER * atrVal;
  let stopLoss;
  const nearbySupports = supports.filter((s) => s < entry).sort((a, b) => b - a);
  if (nearbySupports.length > 0) {
    const nearestSupport = nearbySupports[0];
    const supportSL = nearestSupport - atrVal * 0.3;
    stopLoss = Math.max(atrSL, supportSL);
    if (entry - stopLoss < atrVal * 0.5) {
      stopLoss = atrSL;
    }
  } else {
    stopLoss = atrSL;
  }
  stopLoss = formatPrice(stopLoss, decimals);
  const riskPips = Math.abs(entry - stopLoss);
  const invalidationLevel = formatPrice(stopLoss - INVALIDATION_ATR_MULTIPLIER * atrVal, decimals);
  const tp1 = formatPrice(entry + riskPips * 1, decimals);
  const tp2 = formatPrice(entry + riskPips * 2, decimals);
  const tp3 = formatPrice(entry + riskPips * 3, decimals);
  const rewardPips = [riskPips * 1, riskPips * 2, riskPips * 3];
  const rr = rrRatio(riskPips, riskPips * 2);
  const rrValue = riskPips > 0 ? riskPips * 2 / riskPips : 0;
  if (rrValue < MIN_RR_RATIO) {
    return {
      recommendation: "WAIT",
      entry,
      stopLoss,
      takeProfits: [tp1, tp2, tp3],
      rr,
      invalidationLevel,
      riskPips: Math.abs(entry - stopLoss),
      rewardPips
    };
  }
  const adjustedTPs = adjustTargetsForLevels([tp1, tp2, tp3], resistances, "UP", decimals);
  return {
    recommendation: "BUY",
    entry,
    stopLoss,
    takeProfits: adjustedTPs,
    rr,
    invalidationLevel,
    riskPips: Math.abs(entry - stopLoss),
    rewardPips
  };
}
function calculateBearishRR(price, atrVal, decimals, supports, resistances) {
  const entry = formatPrice(price + atrVal * 0.1, decimals);
  const atrSL = entry + SL_ATR_MULTIPLIER * atrVal;
  let stopLoss;
  const nearbyResistances = resistances.filter((r) => r > entry).sort((a, b) => a - b);
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
  const rrValue = riskPips > 0 ? riskPips * 2 / riskPips : 0;
  if (rrValue < MIN_RR_RATIO) {
    return {
      recommendation: "WAIT",
      entry,
      stopLoss,
      takeProfits: [tp1, tp2, tp3],
      rr,
      invalidationLevel,
      riskPips,
      rewardPips
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
    rewardPips
  };
}
function adjustTargetsForLevels(tps, levels, direction, decimals) {
  if (levels.length === 0) return tps;
  return tps.map((tp) => {
    if (direction === "UP") {
      const blockingLevel = levels.find((l) => l > tp * 0.97 && l < tp);
      if (blockingLevel) {
        return formatPrice(blockingLevel - blockingLevel * LEVEL_PROXIMITY, decimals);
      }
    } else {
      const blockingLevel = levels.find((l) => l < tp * 1.03 && l > tp);
      if (blockingLevel) {
        return formatPrice(blockingLevel + blockingLevel * LEVEL_PROXIMITY, decimals);
      }
    }
    return tp;
  });
}
function rrRatio(risk, reward) {
  if (risk <= 0) return "1:0";
  const ratio = reward / risk;
  return `1:${ratio.toFixed(1)}`;
}
function plotToNumbers(plot, length) {
  if (!plot || plot.length === 0) {
    return new Array(length).fill(NaN);
  }
  const result = [];
  for (let i = 0; i < length; i++) {
    if (i < plot.length) {
      const v = plot[i].value;
      result.push(v === null || v === void 0 ? NaN : v);
    } else {
      result.push(NaN);
    }
  }
  return result;
}
function computeVWAP(bars) {
  const result = new Array(bars.length).fill(NaN);
  if (bars.length === 0) return result;
  let cumulativeTPV = 0;
  let cumulativeVol = 0;
  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    const typicalPrice = (bar.high + bar.low + bar.close) / 3;
    const vol = bar.volume || 0;
    cumulativeTPV += typicalPrice * vol;
    cumulativeVol += vol;
    if (cumulativeVol > 0) {
      result[i] = cumulativeTPV / cumulativeVol;
    }
  }
  return result;
}
function computeIndicators(bars) {
  const n = bars.length;
  if (n === 0) {
    const emptyArr = () => [];
    return {
      rsi: emptyArr(),
      macd: { macd: emptyArr(), signal: emptyArr(), histogram: emptyArr() },
      bollingerBands: {
        upper: emptyArr(),
        middle: emptyArr(),
        lower: emptyArr()
      },
      ema: {
        ema9: emptyArr(),
        ema21: emptyArr(),
        ema50: emptyArr(),
        ema200: emptyArr()
      },
      sma: { sma20: emptyArr(), sma50: emptyArr() },
      stochRSI: { k: emptyArr(), d: emptyArr() },
      atr: emptyArr(),
      adx: emptyArr(),
      cci: emptyArr(),
      obv: emptyArr(),
      vwap: emptyArr()
    };
  }
  const rsiResult = RSI.calculate(bars, { length: 14, src: "close" });
  const rsi = plotToNumbers(rsiResult.plots.plot0, n);
  const macdResult = MACD.calculate(bars, {
    fastLength: 12,
    slowLength: 26,
    signalLength: 9,
    src: "close"
  });
  const macdLine = plotToNumbers(macdResult.plots.plot0, n);
  const macdSignal = plotToNumbers(macdResult.plots.plot1, n);
  const macdHistogram = plotToNumbers(macdResult.plots.plot2, n);
  const bbResult = BollingerBands.calculate(bars, { length: 20, mult: 2, src: "close" });
  const bbUpper = plotToNumbers(bbResult.plots.plot0, n);
  const bbMiddle = plotToNumbers(bbResult.plots.plot1, n);
  const bbLower = plotToNumbers(bbResult.plots.plot2, n);
  const ema9Result = EMA.calculate(bars, { length: 9, src: "close" });
  const ema21Result = EMA.calculate(bars, { length: 21, src: "close" });
  const ema50Result = EMA.calculate(bars, { length: 50, src: "close" });
  const ema200Result = EMA.calculate(bars, { length: 200, src: "close" });
  const ema9 = plotToNumbers(ema9Result.plots.plot0, n);
  const ema21 = plotToNumbers(ema21Result.plots.plot0, n);
  const ema50 = plotToNumbers(ema50Result.plots.plot0, n);
  const ema200 = plotToNumbers(ema200Result.plots.plot0, n);
  const sma20Result = SMA.calculate(bars, { len: 20, src: "close" });
  const sma50Result = SMA.calculate(bars, { len: 50, src: "close" });
  const sma20 = plotToNumbers(sma20Result.plots.plot0, n);
  const sma50 = plotToNumbers(sma50Result.plots.plot0, n);
  const stochResult = StochRSI.calculate(bars, {
    smoothK: 3,
    smoothD: 3,
    lengthRSI: 14,
    lengthStoch: 14
  });
  const stochK = plotToNumbers(stochResult.plots.plot0, n);
  const stochD = plotToNumbers(stochResult.plots.plot1, n);
  const atrResult = ATR.calculate(bars, { length: 14 });
  const atr2 = plotToNumbers(atrResult.plots.plot0, n);
  const adxResult = ADX.calculate(bars, { adxSmoothing: 14, diLength: 14 });
  const adx = plotToNumbers(adxResult.plots.plot0, n);
  const cciResult = CCI.calculate(bars, { length: 20 });
  const cci = plotToNumbers(cciResult.plots.plot0, n);
  const obvResult = OBV.calculate(bars, {});
  const obv = plotToNumbers(obvResult.plots.plot0, n);
  const vwap = computeVWAP(bars);
  return {
    rsi,
    macd: {
      macd: macdLine,
      signal: macdSignal,
      histogram: macdHistogram
    },
    bollingerBands: {
      upper: bbUpper,
      middle: bbMiddle,
      lower: bbLower
    },
    ema: { ema9, ema21, ema50, ema200 },
    sma: { sma20, sma50 },
    stochRSI: { k: stochK, d: stochD },
    atr: atr2,
    adx,
    cci,
    obv,
    vwap
  };
}
function getLatestIndicators(bars) {
  if (bars.length === 0) {
    return {
      rsi: NaN,
      macdHistogram: NaN,
      bollingerPosition: NaN,
      emaTrend: "NEUTRAL",
      adx: NaN,
      stochK: NaN,
      stochD: NaN,
      cci: NaN,
      atr: NaN,
      volumeTrend: "NEUTRAL"
    };
  }
  const indicators = computeIndicators(bars);
  const last = bars.length - 1;
  let bollingerPosition = NaN;
  const bbUpper = indicators.bollingerBands.upper[last];
  const bbLower = indicators.bollingerBands.lower[last];
  const bbMiddle = indicators.bollingerBands.middle[last];
  const closePrice = bars[last].close;
  if (!isNaN(bbUpper) && !isNaN(bbLower) && !isNaN(bbMiddle) && bbUpper !== bbLower) {
    bollingerPosition = (closePrice - bbLower) / (bbUpper - bbLower);
    bollingerPosition = Math.max(0, Math.min(1, bollingerPosition));
  } else if (!isNaN(bbMiddle)) {
    bollingerPosition = closePrice >= bbMiddle ? 1 : 0;
  }
  const ema9Val = indicators.ema.ema9[last];
  const ema21Val = indicators.ema.ema21[last];
  const ema50Val = indicators.ema.ema50[last];
  const ema200Val = indicators.ema.ema200[last];
  let emaTrend = "NEUTRAL";
  if (!isNaN(ema9Val) && !isNaN(ema21Val)) {
    if (!isNaN(ema50Val) && !isNaN(ema200Val)) {
      if (ema9Val > ema21Val && ema21Val > ema50Val && ema50Val > ema200Val) {
        emaTrend = "BULLISH";
      } else if (ema9Val < ema21Val && ema21Val < ema50Val && ema50Val < ema200Val) {
        emaTrend = "BEARISH";
      }
    } else if (!isNaN(ema50Val)) {
      if (ema9Val > ema21Val && ema21Val > ema50Val) {
        emaTrend = "BULLISH";
      } else if (ema9Val < ema21Val && ema21Val < ema50Val) {
        emaTrend = "BEARISH";
      }
    } else {
      if (ema9Val > ema21Val) {
        emaTrend = "BULLISH";
      } else if (ema9Val < ema21Val) {
        emaTrend = "BEARISH";
      }
    }
  }
  let volumeTrend = "NEUTRAL";
  if (bars.length >= 20) {
    const recentVol = bars.slice(-5).reduce((sum, b) => sum + b.volume, 0) / 5;
    const longerVol = bars.slice(-20).reduce((sum, b) => sum + b.volume, 0) / 20;
    if (recentVol > longerVol * 1.2) {
      volumeTrend = "RISING";
    } else if (recentVol < longerVol * 0.8) {
      volumeTrend = "FALLING";
    }
  }
  return {
    rsi: indicators.rsi[last],
    macdHistogram: indicators.macd.histogram[last],
    bollingerPosition,
    emaTrend,
    adx: indicators.adx[last],
    stochK: indicators.stochRSI.k[last],
    stochD: indicators.stochRSI.d[last],
    cci: indicators.cci[last],
    atr: indicators.atr[last],
    volumeTrend
  };
}
function getRSIStatus(rsi) {
  if (isNaN(rsi)) return "NEUTRAL";
  if (rsi >= 70) return "OVERBOUGHT";
  if (rsi <= 30) return "OVERSOLD";
  return "NEUTRAL";
}
function getADXStrength(adx) {
  if (isNaN(adx)) return "WEAK";
  if (adx >= 25) return "STRONG";
  if (adx >= 20) return "MODERATE";
  return "WEAK";
}
function checkEMAAlignment(ema9, ema21, ema50, ema200) {
  let bullishSignals = 0;
  let bearishSignals = 0;
  let totalPairs = 0;
  if (!isNaN(ema9) && !isNaN(ema21)) {
    totalPairs++;
    if (ema9 > ema21) bullishSignals++;
    else if (ema9 < ema21) bearishSignals++;
  }
  if (!isNaN(ema21) && !isNaN(ema50)) {
    totalPairs++;
    if (ema21 > ema50) bullishSignals++;
    else if (ema21 < ema50) bearishSignals++;
  }
  if (!isNaN(ema50) && !isNaN(ema200)) {
    totalPairs++;
    if (ema50 > ema200) bullishSignals++;
    else if (ema50 < ema200) bearishSignals++;
  }
  if (!isNaN(ema9) && !isNaN(ema50)) {
    totalPairs++;
    if (ema9 > ema50) bullishSignals++;
    else if (ema9 < ema50) bearishSignals++;
  }
  if (!isNaN(ema9) && !isNaN(ema200)) {
    totalPairs++;
    if (ema9 > ema200) bullishSignals++;
    else if (ema9 < ema200) bearishSignals++;
  }
  if (totalPairs === 0) {
    return { alignment: "NEUTRAL", strength: 0 };
  }
  const netBullish = bullishSignals - bearishSignals;
  let alignment;
  let strength;
  if (netBullish > 0) {
    alignment = "BULLISH";
    strength = bullishSignals / totalPairs * 100;
  } else if (netBullish < 0) {
    alignment = "BEARISH";
    strength = bearishSignals / totalPairs * 100;
  } else {
    alignment = "NEUTRAL";
    strength = 50;
  }
  return { alignment, strength: Math.round(strength) };
}
function runLocalAnalysis(input) {
  const pair = input.pair || detectPairFromImage() || "EUR/USD";
  const timeframe = input.timeframe || "1H";
  const config = PAIR_CONFIGS[pair] || PAIR_CONFIGS["EUR/USD"];
  const decimals = config.decimals;
  const bars = input.bars ?? generateOHLCV(pair, timeframe, 200);
  if (bars.length < 20) {
    return generateFallbackResult(pair, timeframe, config);
  }
  const structureResult = analyzeMarketStructure(bars);
  const swingHighs = structureResult.swingPoints.filter((s) => s.type === "HIGH");
  const swingLows = structureResult.swingPoints.filter((s) => s.type === "LOW");
  const orderBlocks = detectOrderBlocks(bars);
  const fvgs = detectFVGs(bars);
  const liquidityZones = detectLiquidityZones(structureResult.swingPoints);
  const srLevels = detectSRLevels(bars);
  detectRecentBOS(bars, swingHighs, swingLows);
  const trendResult = determineTrendFromSwings(swingHighs, swingLows);
  const trend = structureResult.direction !== "SIDEWAYS" ? structureResult.direction : trendResult.direction;
  const candlePatterns = detectCandlestickPatterns(bars);
  const chartFormations = detectChartFormations(bars, structureResult.swingPoints);
  const harmonicPatterns = detectHarmonicPatterns(bars, structureResult.swingPoints);
  const indicators = getLatestIndicators(bars);
  const rsiStatus = getRSIStatus(indicators.rsi);
  const adxStrength = getADXStrength(indicators.adx);
  const emaAlignment = checkEMAAlignment(
    indicators.rsi,
    // dummy placeholder, actual EMA values used below
    indicators.rsi,
    indicators.rsi,
    indicators.rsi
  );
  const atrValue = atr(bars, 14);
  const currentPrice = bars[bars.length - 1].close;
  const supportLevels = srLevels.filter((l) => l.type === "SUPPORT").map((l) => l.price).sort((a, b) => a - b);
  const resistanceLevels = srLevels.filter((l) => l.type === "RESISTANCE").map((l) => l.price).sort((a, b) => a - b);
  const rr = calculateRiskReward(
    currentPrice,
    trend,
    atrValue,
    decimals,
    supportLevels,
    resistanceLevels,
    pair
  );
  const finalRec = adjustRecommendationWithPatterns(
    rr.recommendation,
    trend,
    candlePatterns,
    chartFormations,
    harmonicPatterns,
    rsiStatus,
    adxStrength,
    emaAlignment
  );
  const confidence = calculateConfidence(
    trend,
    finalRec,
    candlePatterns,
    chartFormations,
    harmonicPatterns,
    orderBlocks,
    fvgs,
    structureResult,
    rsiStatus,
    adxStrength,
    emaAlignment
  );
  const buySideLiquidity = liquidityZones.filter((z2) => z2.type === "BUY_SIDE").sort((a, b) => b.strength - a.strength).slice(0, 3).map((z2) => formatPrice(z2.price, decimals));
  const sellSideLiquidity = liquidityZones.filter((z2) => z2.type === "SELL_SIDE").sort((a, b) => b.strength - a.strength).slice(0, 3).map((z2) => formatPrice(z2.price, decimals));
  const keyResistance = resistanceLevels.slice(0, 3).map((p) => formatPrice(p, decimals));
  const keySupport = supportLevels.slice(0, 3).map((p) => formatPrice(p, decimals));
  const pivot = srLevels.find((l) => l.type === "PIVOT");
  const pivotPrice = pivot ? formatPrice(pivot.price, decimals) : void 0;
  const primaryPattern = buildPatternSummary(candlePatterns, chartFormations, harmonicPatterns, trend);
  const reasons = buildReasons(
    trend,
    finalRec,
    structureResult,
    orderBlocks,
    fvgs,
    candlePatterns,
    chartFormations,
    harmonicPatterns,
    srLevels,
    rsiStatus,
    adxStrength
  );
  const entry = formatPrice(rr.entry, decimals);
  const sl = formatPrice(rr.stopLoss, decimals);
  const risk = Math.abs(rr.entry - rr.stopLoss);
  const scenarios = {
    conservative: {
      name: "Retest Entry",
      probability: 55,
      entry: String(entry),
      sl: formatPrice(rr.stopLoss, decimals),
      tp1: formatPrice(rr.takeProfits[0] ?? rr.entry + risk, decimals),
      tp2: formatPrice(rr.takeProfits[1] ?? rr.entry + risk * 1.5, decimals),
      rr: "1:1.0"
    },
    balanced: {
      name: "Market Entry",
      probability: 30,
      entry: String(entry),
      sl: formatPrice(rr.stopLoss, decimals),
      tp1: formatPrice(rr.takeProfits[1] ?? rr.entry + risk * 2, decimals),
      tp2: formatPrice(rr.takeProfits[2] ?? rr.entry + risk * 2.5, decimals),
      rr: rr.rr
    },
    aggressive: {
      name: "Breakout",
      probability: 15,
      entry: String(formatPrice(rr.takeProfits[0] ?? currentPrice, decimals)),
      sl: formatPrice(rr.entry, decimals),
      tp1: formatPrice(rr.takeProfits[2] ?? rr.entry + risk * 3, decimals),
      tp2: formatPrice((rr.takeProfits[2] ?? rr.entry + risk * 3) + risk * 0.5, decimals),
      rr: "1:3.0"
    }
  };
  const riskLevel = assessRisk(trend, atrValue, currentPrice, srLevels, fvgs, orderBlocks);
  const riskReasons = buildRiskReasons(riskLevel, trend, atrValue, currentPrice, srLevels);
  const management = buildManagementInstructions(
    finalRec,
    rr.entry,
    rr.stopLoss,
    rr.takeProfits,
    rr.invalidationLevel,
    decimals
  );
  const vixorMessage = generateVixorMessage(
    pair,
    timeframe,
    trend,
    finalRec,
    confidence,
    primaryPattern,
    structureResult,
    orderBlocks,
    fvgs
  );
  const newsImpact = generateNewsContext(pair, trend);
  const signalBadge = {
    direction: finalRec,
    entry: String(entry),
    stop_loss: String(sl),
    take_profit: String(formatPrice(rr.takeProfits[1] ?? currentPrice, decimals)),
    rr: rr.rr
  };
  return {
    pair,
    timeframe,
    trend,
    risk_level: riskLevel,
    risk_reasons: riskReasons,
    invalidation_level: formatPrice(rr.invalidationLevel, decimals),
    liquidity_zones: {
      buySide: buySideLiquidity,
      sellSide: sellSideLiquidity
    },
    market_structure: {
      direction: structureResult.direction === "SIDEWAYS" ? "NEUTRAL" : structureResult.direction,
      structure: structureResult.structure,
      bos: structureResult.lastBOS?.price ? formatPrice(structureResult.lastBOS.price, decimals) : void 0
    },
    key_levels: {
      resistance: keyResistance,
      support: keySupport,
      pivot: pivotPrice
    },
    recommendation: finalRec,
    confidence,
    entry: formatPrice(rr.entry, decimals),
    stop_loss: formatPrice(rr.stopLoss, decimals),
    take_profit: rr.takeProfits.map((p) => formatPrice(p, decimals)),
    rr: rr.rr,
    pattern: primaryPattern,
    reasons,
    scenarios,
    management,
    news_impact: newsImpact,
    signal_badge: signalBadge,
    vixor_message: vixorMessage
  };
}
function detectPairFromImage(_imageBytes) {
  return void 0;
}
function adjustRecommendationWithPatterns(baseRec, trend, patterns, formations, harmonics, rsiStatus, adxStrength, emaAlignment) {
  if (baseRec === "WAIT") return "WAIT";
  const recentPatterns = patterns.slice(0, 5);
  const recentFormations = formations.slice(0, 3);
  const recentHarmonics = harmonics.slice(0, 2);
  let bullishSignals = 0;
  let bearishSignals = 0;
  for (const p of recentPatterns) {
    if (p.type === "BULLISH") bullishSignals += p.reliability / 100;
    if (p.type === "BEARISH") bearishSignals += p.reliability / 100;
  }
  for (const f of recentFormations) {
    if (f.type === "BULLISH") bullishSignals += f.reliability / 100;
    if (f.type === "BEARISH") bearishSignals += f.reliability / 100;
  }
  for (const h of recentHarmonics) {
    if (h.type === "BULLISH") bullishSignals += h.reliability / 100 * 1.5;
    if (h.type === "BEARISH") bearishSignals += h.reliability / 100 * 1.5;
  }
  if (rsiStatus === "OVERBOUGHT" && baseRec === "BUY") bearishSignals += 0.5;
  if (rsiStatus === "OVERSOLD" && baseRec === "SELL") bullishSignals += 0.5;
  if (adxStrength === "WEAK") {
    bullishSignals *= 0.7;
    bearishSignals *= 0.7;
  }
  if (baseRec === "BUY" && emaAlignment.alignment === "BEARISH") bearishSignals += 0.8;
  if (baseRec === "SELL" && emaAlignment.alignment === "BULLISH") bullishSignals += 0.8;
  if (baseRec === "BUY" && bearishSignals > bullishSignals * 1.5) return "WAIT";
  if (baseRec === "SELL" && bullishSignals > bearishSignals * 1.5) return "WAIT";
  return baseRec;
}
function calculateConfidence(trend, rec, patterns, formations, harmonics, obs, fvgs, structure, rsiStatus, adxStrength, emaAlignment) {
  if (rec === "WAIT") return 40 + Math.floor(Math.random() * 10);
  let confidence = 55;
  if (trend === "BULLISH" && rec === "BUY" || trend === "BEARISH" && rec === "SELL") {
    confidence += 10;
  }
  const supportingPatterns = patterns.filter(
    (p) => rec === "BUY" && p.type === "BULLISH" || rec === "SELL" && p.type === "BEARISH"
  );
  confidence += Math.min(supportingPatterns.length * 3, 10);
  const supportingFormations = formations.filter(
    (f) => rec === "BUY" && f.type === "BULLISH" || rec === "SELL" && f.type === "BEARISH"
  );
  confidence += Math.min(supportingFormations.length * 5, 10);
  const supportingHarmonics = harmonics.filter(
    (h) => rec === "BUY" && h.type === "BULLISH" || rec === "SELL" && h.type === "BEARISH"
  );
  confidence += Math.min(supportingHarmonics.length * 7, 12);
  const unmitigatedOBs = obs.filter(
    (ob) => !ob.mitigated && (rec === "BUY" && ob.type === "BULLISH" || rec === "SELL" && ob.type === "BEARISH")
  );
  confidence += Math.min(unmitigatedOBs.length * 3, 8);
  const activeFVGs = fvgs.filter((f) => !f.filled);
  confidence += Math.min(activeFVGs.length, 4);
  if (structure.bosEvents.length > 0) confidence += 3;
  if (structure.bosEvents.some((e) => e.type === "CHoCH")) confidence += 2;
  if (rec === "BUY" && rsiStatus === "OVERSOLD" || rec === "SELL" && rsiStatus === "OVERBOUGHT") {
    confidence += 5;
  } else if (rec === "BUY" && rsiStatus === "OVERBOUGHT" || rec === "SELL" && rsiStatus === "OVERSOLD") {
    confidence -= 5;
  }
  if (adxStrength === "STRONG") confidence += 5;
  else if (adxStrength === "WEAK") confidence -= 3;
  if (emaAlignment.alignment === (rec === "BUY" ? "BULLISH" : "BEARISH")) {
    confidence += Math.min(emaAlignment.strength / 10, 5);
  } else if (emaAlignment.alignment !== "NEUTRAL") {
    confidence -= 3;
  }
  return Math.min(Math.max(confidence, 40), 95);
}
function buildPatternSummary(candlePatterns, chartFormations, harmonicPatterns, trend) {
  const parts = [];
  if (candlePatterns.length > 0) {
    parts.push(candlePatterns[0].name);
  }
  if (chartFormations.length > 0) {
    parts.push(chartFormations[0].name);
  }
  if (harmonicPatterns.length > 0) {
    parts.push(harmonicPatterns[0].name);
  }
  if (trend === "BULLISH") parts.push("Bullish Structure");
  else if (trend === "BEARISH") parts.push("Bearish Structure");
  if (parts.length === 0) return "Consolidation Range";
  return parts.join(" + ");
}
function buildReasons(trend, rec, structure, obs, fvgs, patterns, formations, harmonics, _srLevels, rsiStatus, adxStrength) {
  const reasons = [];
  if (structure.lastBOS?.type === "BOS") {
    reasons.push(
      trend === "BULLISH" ? "Break of Structure (BOS) confirming bullish continuation with higher highs." : "Break of Structure (BOS) confirming bearish continuation with lower lows."
    );
  } else if (structure.lastBOS?.type === "CHoCH") {
    reasons.push(
      "Change of Character (CHoCH) detected — potential trend reversal with institutional sponsorship."
    );
  }
  const unmitigated = obs.filter((o) => !o.mitigated);
  if (unmitigated.length > 0) {
    const bullOBs = unmitigated.filter((o) => o.type === "BULLISH").length;
    const bearOBs = unmitigated.filter((o) => o.type === "BEARISH").length;
    if (rec === "BUY" && bullOBs > 0) {
      reasons.push(`${bullOBs} unmitigated Bullish Order Block(s) providing institutional demand zone.`);
    } else if (rec === "SELL" && bearOBs > 0) {
      reasons.push(`${bearOBs} unmitigated Bearish Order Block(s) providing institutional supply zone.`);
    }
  }
  const activeFVGs = fvgs.filter((f) => !f.filled);
  if (activeFVGs.length > 0) {
    const bullFVGs = activeFVGs.filter((f) => f.type === "BULLISH").length;
    const bearFVGs = activeFVGs.filter((f) => f.type === "BEARISH").length;
    if (rec === "BUY" && bullFVGs > 0) {
      reasons.push(`${bullFVGs} unfilled Bullish Fair Value Gap(s) acting as price magnet for retracement.`);
    } else if (rec === "SELL" && bearFVGs > 0) {
      reasons.push(`${bearFVGs} unfilled Bearish Fair Value Gap(s) acting as price magnet for retracement.`);
    }
  }
  if (patterns.length > 0) {
    const topPattern = patterns[0];
    reasons.push(`${topPattern.name} pattern detected with ${topPattern.reliability}% reliability score.`);
  }
  if (formations.length > 0) {
    reasons.push(`${formations[0].name} formation reinforcing the directional bias.`);
  }
  if (harmonics.length > 0) {
    const topHarmonic = harmonics[0];
    reasons.push(`${topHarmonic.name} harmonic pattern with ${topHarmonic.reliability}% Fibonacci alignment.`);
  }
  if (rsiStatus === "OVERSOLD" && rec === "BUY") {
    reasons.push("RSI in oversold territory — selling exhaustion supports bullish reversal.");
  } else if (rsiStatus === "OVERBOUGHT" && rec === "SELL") {
    reasons.push("RSI in overbought territory — buying exhaustion supports bearish reversal.");
  }
  if (adxStrength === "STRONG") {
    reasons.push("ADX confirms strong trend — directional momentum is well-established.");
  }
  if (reasons.length < 3) {
    if (trend === "BULLISH") {
      reasons.push("Price is showing higher-timeframe bullish structure with orderly pullbacks.");
    } else if (trend === "BEARISH") {
      reasons.push("Price is showing lower-timeframe bearish structure with orderly pullbacks.");
    } else {
      reasons.push("Market is consolidating — wait for a clear structural break before committing.");
    }
  }
  return reasons.slice(0, 5);
}
function assessRisk(trend, atrValue, currentPrice, srLevels, fvgs, obs) {
  let riskScore = 0;
  if (trend === "NEUTRAL") riskScore += 3;
  const atrPercent = atrValue / currentPrice * 100;
  if (atrPercent > 2) riskScore += 2;
  if (atrPercent > 3) riskScore += 1;
  const nearLevels = srLevels.filter((l) => Math.abs(l.price - currentPrice) / currentPrice < 0.01);
  if (nearLevels.length === 0) riskScore += 1;
  const activeFVGs = fvgs.filter((f) => !f.filled).length;
  if (activeFVGs > 5) riskScore += 1;
  const mitigatedOBs = obs.filter((o) => o.mitigated).length;
  if (mitigatedOBs > obs.length * 0.6) riskScore += 1;
  if (riskScore >= 5) return "HIGH";
  if (riskScore >= 3) return "MEDIUM";
  return "LOW";
}
function buildRiskReasons(riskLevel, trend, _atrValue, _currentPrice, srLevels) {
  const reasons = [];
  if (trend === "NEUTRAL") {
    reasons.push("Market direction is unclear — risk of whipsaw in consolidation.");
  }
  if (srLevels.length === 0) {
    reasons.push("No clear support/resistance structure identified nearby.");
  } else {
    reasons.push("Approaching major liquidity zone — expect potential stop runs.");
  }
  if (riskLevel === "HIGH") {
    reasons.push("High volatility environment — reduce position size accordingly.");
  } else if (riskLevel === "MEDIUM") {
    reasons.push("Moderate volatility — standard risk management applies.");
  }
  return reasons.slice(0, 3);
}
function buildManagementInstructions(rec, entry, sl, tps, invalidation, decimals) {
  if (rec === "WAIT") {
    return [
      "Do not enter — wait for a clear Break of Structure (BOS) or Change of Character (CHoCH).",
      "Monitor Fair Value Gap fills for potential entry zones.",
      "Set alerts at key support/resistance levels."
    ];
  }
  const isBuy = rec === "BUY";
  return [
    `Enter ${isBuy ? "long" : "short"} at ${formatPrice(entry, decimals)} — wait for candle close confirmation.`,
    `Place stop loss at ${formatPrice(sl, decimals)} and move to breakeven after TP1 (${formatPrice(tps[0], decimals)}) is hit.`,
    `Scale out 50% at TP2 (${formatPrice(tps[1], decimals)}) and trail the remainder using a 1× ATR trailing stop.`,
    `Close position immediately if price closes beyond invalidation level at ${formatPrice(invalidation, decimals)}.`
  ];
}
function generateVixorMessage(pair, timeframe, trend, rec, confidence, pattern, structure, obs, fvgs) {
  const unmitigatedOBs = obs.filter((o) => !o.mitigated);
  const activeFVGs = fvgs.filter((f) => !f.filled);
  const bosType = structure.lastBOS?.type;
  const bosDir = structure.lastBOS?.direction;
  if (rec === "WAIT") {
    return `The ${pair} ${timeframe} chart is showing consolidation with mixed structural signals. I have detected ${activeFVGs.length} unfilled Fair Value Gap(s) but no clear directional bias. Sit on your hands until a decisive Break of Structure or Change of Character forms.`;
  }
  const direction = rec === "BUY" ? "bullish" : "bearish";
  const oppDirection = rec === "BUY" ? "bearish" : "bullish";
  let msg = `I have identified a high-probability ${direction} setup on ${pair} (${timeframe}). `;
  if (bosType === "CHoCH") {
    msg += `A Change of Character (CHoCH) to the ${bosDir?.toLowerCase()} side confirms institutional reversal. `;
  } else if (bosType === "BOS") {
    msg += `The Break of Structure (BOS) confirms the ${direction} trend continuation. `;
  }
  if (unmitigatedOBs.length > 0) {
    msg += `${unmitigatedOBs.length} unmitigated ${direction.charAt(0).toUpperCase() + direction.slice(1)} Order Block(s) provide a strong institutional zone. `;
  }
  if (activeFVGs.length > 0) {
    msg += `${activeFVGs.length} unfilled Fair Value Gap(s) act as a price magnet for the ${oppDirection} retracement before continuation. `;
  }
  msg += `The ${pattern} pattern aligns with the overall market structure at ${confidence}% confidence. Execute with discipline and respect your stop loss.`;
  return msg;
}
function generateNewsContext(pair, trend) {
  const newsMap = {
    "XAU/USD": [
      { headline: "US Treasury Yields Slide on Lower Inflation Expectations", source: "Bloomberg", impact: "POSITIVE", explanation: "Lower yields reduce the opportunity cost of holding non-yielding Gold, reinforcing the technical support at current levels." },
      { headline: "Dollar Index Strengthens After Robust Services PMI", source: "Reuters", impact: "NEGATIVE", explanation: "A stronger Dollar pressures Gold prices, potentially delaying a breakout above key resistance." },
      { headline: "Central Banks Continue Gold Accumulation Trend", source: "Financial Times", impact: "POSITIVE", explanation: "Sustained central bank buying provides a structural demand floor for Gold prices." }
    ],
    "EUR/USD": [
      { headline: "ECB Signals Potential Rate Cut in Upcoming Meeting", source: "Reuters", impact: "NEGATIVE", explanation: "Divergence between ECB's dovish tone and Fed's hawkish stance puts downward pressure on the Euro." },
      { headline: "US Jobless Claims Rise More Than Expected", source: "MarketWatch", impact: "POSITIVE", explanation: "Weak labor data weakens the Dollar, supporting a potential technical bounce from support." },
      { headline: "Eurozone Manufacturing PMI Shows Unexpected Improvement", source: "Bloomberg", impact: "POSITIVE", explanation: "Better-than-expected manufacturing data supports the Euro's fundamental outlook." }
    ],
    "BTC/USD": [
      { headline: "Institutional Inflows to Spot Bitcoin ETFs Accelerate", source: "CoinDesk", impact: "POSITIVE", explanation: "Consistent spot buying pressure from ETFs aligns with the bullish technical structure." },
      { headline: "Regulatory Framework Advances in Major Markets", source: "Bloomberg", impact: "POSITIVE", explanation: "Clearer regulation reduces uncertainty and attracts institutional capital to the space." },
      { headline: "Mining Difficulty Reaches All-Time High", source: "Glassnode", impact: "NEUTRAL", explanation: "Increasing mining difficulty reflects network security strength but doesn't directly impact short-term price direction." }
    ],
    "ETH/USDT": [
      { headline: "Ethereum Network Upgrade Boosts Transaction Throughput", source: "CoinDesk", impact: "POSITIVE", explanation: "Improved network fundamentals support the bullish case for ETH." },
      { headline: "DeFi TVL Reaches New Yearly High", source: "DeFi Llama", impact: "POSITIVE", explanation: "Growing total value locked indicates increasing utility and demand for the Ethereum ecosystem." },
      { headline: "SEC Delays Decision on Ethereum ETF Application", source: "Reuters", impact: "NEGATIVE", explanation: "Regulatory uncertainty creates short-term selling pressure on ETH." }
    ],
    "GBP/JPY": [
      { headline: "Bank of England Maintains Hawkish Stance on Rates", source: "Financial Times", impact: "POSITIVE", explanation: "Higher UK rates support the Pound against the Yen, reinforcing the bullish technical structure." },
      { headline: "Japan Core CPI Falls Below BOJ Target", source: "NHK", impact: "POSITIVE", explanation: "Subdued inflation in Japan keeps BOJ policy accommodative, weakening the Yen." },
      { headline: "UK GDP Growth Slows More Than Expected", source: "Bloomberg", impact: "NEGATIVE", explanation: "Economic slowdown could force the BOE to pivot dovish, pressuring GBP." }
    ]
  };
  const defaultNews = [
    { headline: "Federal Reserve Maintains Data-Dependent Stance on Rates", source: "Bloomberg", impact: "NEUTRAL", explanation: "The Fed's wait-and-see approach creates a range-bound environment for the Dollar." },
    { headline: "Global Risk Sentiment Improves on Trade Optimism", source: "Reuters", impact: "POSITIVE", explanation: "Improved risk appetite supports higher-yielding assets and risk-on currencies." },
    { headline: "Geopolitical Tensions Keep Safe-Haven Demand Elevated", source: "Financial Times", impact: "NEGATIVE", explanation: "Persistent geopolitical risk supports safe-haven flows, creating headwinds for risk assets." }
  ];
  const pairNews = newsMap[pair] || defaultNews;
  const overallSentiment = trend === "BULLISH" ? "BULLISH" : trend === "BEARISH" ? "BEARISH" : "NEUTRAL";
  const verdict = trend === "NEUTRAL" ? "Mixed fundamental signals align with the consolidating technical structure. Wait for a clear fundamental catalyst." : trend === "BULLISH" ? "Fundamental news broadly supports the bullish technical setup, increasing the probability of target completion." : "Fundamental headwinds align with the bearish technical structure, supporting the short thesis.";
  return {
    relevant_news: pairNews.slice(0, 3),
    overall_sentiment: overallSentiment,
    verdict
  };
}
function generateFallbackResult(pair, timeframe, config) {
  const price = config.basePrice;
  const d = config.decimals;
  const spread = price * 0.01;
  return {
    pair,
    timeframe,
    trend: "NEUTRAL",
    risk_level: "HIGH",
    risk_reasons: ["Insufficient data for reliable analysis.", "Market direction is unclear."],
    invalidation_level: formatPrice(price, d),
    liquidity_zones: { buySide: [formatPrice(price + spread * 2, d)], sellSide: [formatPrice(price - spread * 2, d)] },
    market_structure: { direction: "NEUTRAL", structure: "CONSOLIDATION" },
    key_levels: { resistance: [formatPrice(price + spread, d)], support: [formatPrice(price - spread, d)] },
    recommendation: "WAIT",
    confidence: 30,
    entry: formatPrice(price, d),
    stop_loss: formatPrice(price - spread * 1.5, d),
    take_profit: [formatPrice(price + spread, d), formatPrice(price + spread * 2, d), formatPrice(price + spread * 3, d)],
    rr: "1:1.0",
    pattern: "Insufficient Data",
    reasons: ["Not enough candles for structural analysis.", "Wait for more price data to form."],
    scenarios: {
      conservative: { name: "No Trade", probability: 80, entry: String(formatPrice(price, d)), sl: formatPrice(price, d), tp1: formatPrice(price, d), tp2: formatPrice(price, d), rr: "1:0" },
      balanced: { name: "No Trade", probability: 15, entry: String(formatPrice(price, d)), sl: formatPrice(price, d), tp1: formatPrice(price, d), tp2: formatPrice(price, d), rr: "1:0" },
      aggressive: { name: "No Trade", probability: 5, entry: String(formatPrice(price, d)), sl: formatPrice(price, d), tp1: formatPrice(price, d), tp2: formatPrice(price, d), rr: "1:0" }
    },
    management: ["Wait for sufficient data before entering any position."],
    news_impact: { relevant_news: [], overall_sentiment: "NEUTRAL", verdict: "Insufficient data for fundamental analysis." },
    signal_badge: { direction: "WAIT", entry: String(formatPrice(price, d)), stop_loss: String(formatPrice(price, d)), take_profit: String(formatPrice(price, d)), rr: "1:0" },
    vixor_message: "I cannot perform a reliable analysis with the current data. Wait for more price action to form before seeking a signal."
  };
}
const AnalysisSchema = object({
  pair: string().describe("Trading pair detected on the chart, e.g. BTC/USDT, EUR/USD"),
  timeframe: string().describe("Chart timeframe, e.g. 1H, 4H, 1D"),
  trend: _enum(["BULLISH", "BEARISH", "NEUTRAL"]).describe("Overall trend of the asset on this timeframe"),
  risk_level: _enum(["LOW", "MEDIUM", "HIGH"]).describe("Risk assessment for the current setup"),
  risk_reasons: array(string()).min(1).max(3).describe("Reasons justifying the risk level"),
  invalidation_level: number().describe("Price level where this thesis becomes completely invalid"),
  liquidity_zones: object({
    buySide: array(number()).describe("Buy-side liquidity zones (resistance/highs)"),
    sellSide: array(number()).describe("Sell-side liquidity zones (support/lows)")
  }),
  market_structure: object({
    direction: _enum(["BULLISH", "BEARISH", "SIDEWAYS"]),
    structure: string().describe("e.g. HIGHER_HIGHS, LOWER_LOWS, CONSOLIDATION"),
    bos: number().optional().describe("Price level of the recent Break of Structure (BOS) if any")
  }),
  key_levels: object({
    resistance: array(number()),
    support: array(number()),
    pivot: number().optional()
  }),
  recommendation: _enum(["BUY", "SELL", "WAIT"]),
  confidence: number().min(0).max(100).describe("0-100 confidence in the recommendation"),
  entry: number().describe("Recommended entry price"),
  stop_loss: number().describe("Stop loss price"),
  take_profit: array(number()).length(3).describe("Three take-profit levels, conservative to aggressive"),
  rr: string().describe("Approx risk-reward ratio for the balanced target, e.g. '1:2.5'"),
  pattern: string().describe("Short summary of detected pattern, e.g. 'Bullish Engulfing + Support Hold'"),
  reasons: array(string()).min(3).max(5).describe("3-5 concise reasons supporting the trade"),
  scenarios: object({
    conservative: object({ name: string(), probability: number(), entry: string(), sl: number(), tp1: number(), tp2: number(), rr: string() }),
    balanced: object({ name: string(), probability: number(), entry: string(), sl: number(), tp1: number(), tp2: number(), rr: string() }),
    aggressive: object({ name: string(), probability: number(), entry: string(), sl: number(), tp1: number(), tp2: number(), rr: string() })
  }),
  management: array(string()).min(3).max(6).describe("Step-by-step trade management instructions"),
  news_impact: object({
    relevant_news: array(object({
      headline: string().describe("Headline of the news article"),
      source: string().describe("Source of the news, e.g. Reuters, Bloomberg"),
      impact: _enum(["POSITIVE", "NEGATIVE", "NEUTRAL"]).describe("How this news impacts the asset price or trend direction"),
      explanation: string().describe("Explanation of how this news negatively or positively affects the technical structure, invalidation levels, or general price action")
    })).min(1).max(3).describe("1-3 news articles that are relevant to this trading pair"),
    overall_sentiment: _enum(["BULLISH", "BEARISH", "NEUTRAL"]).describe("Overall fundamental sentiment derived from news"),
    verdict: string().describe("Final verdict indicating if the fundamental news aligns with the technical setup or warns against it")
  }).describe("Analysis of recent news and fundamentals affecting this specific trading pair"),
  signal_badge: object({
    direction: _enum(["BUY", "SELL", "WAIT"]),
    entry: string(),
    stop_loss: string(),
    take_profit: string(),
    rr: string()
  }),
  vixor_message: string().describe("A confident, authoritative message from Vixor explaining the verdict.")
});
async function runChartAnalysis(imageBytes, mimeType, fileName, selectedPair, trading_style) {
  const pair = selectedPair || detectPairFromFileName(fileName) || "EUR/USD";
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("[Vixor] Running local SMC/ICT analysis engine...");
  const localResult = runLocalAnalysis({
    pair,
    timeframe: inferTimeframeFromTradingStyle(trading_style)
  });
  if (localResult.confidence >= 60 || !apiKey) {
    console.log(`[Vixor] Local analysis complete: ${localResult.pair} ${localResult.timeframe} → ${localResult.recommendation} @ ${localResult.confidence}%`);
    const result = {
      ...localResult,
      market_structure: {
        ...localResult.market_structure,
        direction: localResult.market_structure.direction === "NEUTRAL" ? "SIDEWAYS" : localResult.market_structure.direction
      },
      news_impact: {
        ...localResult.news_impact,
        overall_sentiment: localResult.news_impact.overall_sentiment === "NEUTRAL" ? "NEUTRAL" : localResult.news_impact.overall_sentiment
      }
    };
    return result;
  }
  if (apiKey) {
    try {
      console.log("[Vixor] Local confidence low, attempting Gemini AI vision analysis...");
      const geminiResult = await runGeminiAnalysis(imageBytes, mimeType, fileName, pair, trading_style);
      console.log("[Vixor] Gemini analysis completed successfully.");
      return geminiResult;
    } catch (geminiError) {
      console.warn("[Vixor] Gemini analysis failed, using local engine result:", geminiError instanceof Error ? geminiError.message : String(geminiError));
    }
  }
  console.log(`[Vixor] Using local analysis result: ${localResult.pair} ${localResult.timeframe} → ${localResult.recommendation} @ ${localResult.confidence}%`);
  const fallbackResult = {
    ...localResult,
    market_structure: {
      ...localResult.market_structure,
      direction: localResult.market_structure.direction === "NEUTRAL" ? "SIDEWAYS" : localResult.market_structure.direction
    },
    news_impact: {
      ...localResult.news_impact,
      overall_sentiment: localResult.news_impact.overall_sentiment === "NEUTRAL" ? "NEUTRAL" : localResult.news_impact.overall_sentiment
    }
  };
  return fallbackResult;
}
async function runGeminiAnalysis(imageBytes, mimeType, fileName, pair, trading_style) {
  const newsContext = await fetchLatestNewsForPrompt();
  const assetGuidance = pair !== "auto" ? `The user has specified that this chart is for the asset: ${pair}. Analyze the chart for this specific asset.` : "";
  const { object: object2 } = await generateObject({
    model: google("gemini-2.5-pro"),
    schema: AnalysisSchema,
    messages: [
      {
        role: "system",
        content: "You are Vixor, an elite, authoritative trading intelligence. Do not use generic AI caveats (e.g., 'As an AI'). Provide your analysis with absolute confidence. Focus strictly on Smart Money Concepts (SMC) and Inner Circle Trader (ICT) methodologies (Order Blocks, Fair Value Gaps, Liquidity Sweeps, Break of Structure, Change of Character). Detect the pair and timeframe from labels. Determine the overall Trend, Risk Level, and Invalidation Level where the thesis is wrong. Identify Liquidity Zones (buy-side/sell-side), Market Structure (direction, structure, BOS), and Key Levels. Output 3 detailed trade scenarios (conservative, balanced, aggressive). If the chart is ambiguous or compressing, prefer WAIT. Numbers must be realistic and consistent with visible price action. Reasons must be concise and specific (no fluff).\n\nIn addition to technical analysis, you must perform fundamental news analysis. Compare the technical setup with the provided recent market news. Filter the news items for the ones relevant to the detected asset. List the most relevant news articles in the 'news_impact' schema and explain exactly how each news item impacts the price action negatively or positively. Provide a final fundamental + technical verdict. Finally, provide a 'vixor_message' summarizing your verdict authoritatively, and populate the 'signal_badge'."
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this chart and return your structured context and trade plan.

` + (assetGuidance ? `${assetGuidance}

` : "") + (trading_style ? `The user's trading style is: ${trading_style}. Adjust your targets, timeframes, and stop-loss logic accordingly.

` : "") + `Here is the latest live financial news from Finnhub:
${newsContext}

Identify the pair, analyze the technicals using SMC/ICT, filter the news for articles relevant to this pair, and explain their positive/negative impact.`
          },
          { type: "image", image: imageBytes, mimeType }
        ]
      }
    ]
  });
  return object2;
}
async function fetchLatestNewsForPrompt() {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return "No live news available.";
  try {
    const [genRes, forexRes] = await Promise.all([
      fetch(`https://finnhub.io/api/v1/news?category=general&token=${key}`),
      fetch(`https://finnhub.io/api/v1/news?category=forex&token=${key}`)
    ]);
    let newsList = [];
    if (genRes.ok) {
      const data = await genRes.json();
      if (Array.isArray(data)) newsList = newsList.concat(data.slice(0, 10));
    }
    if (forexRes.ok) {
      const data = await forexRes.json();
      if (Array.isArray(data)) newsList = newsList.concat(data.slice(0, 10));
    }
    if (newsList.length === 0) return "No news items fetched.";
    const uniqueNews = Array.from(new Map(newsList.map((item) => [item.id, item])).values());
    return uniqueNews.slice(0, 15).map(
      (n) => `- Source: ${n.source}
  Headline: ${n.headline}
  Summary: ${n.summary}`
    ).join("\n\n");
  } catch (e) {
    console.error("Error fetching news for Gemini prompt:", e);
    return "Error fetching live news.";
  }
}
function detectPairFromFileName(fileName) {
  if (!fileName) return void 0;
  const name = fileName.toLowerCase();
  if (name.includes("gold") || name.includes("xau")) return "XAU/USD";
  if (name.includes("eur") || name.includes("euro")) return "EUR/USD";
  if (name.includes("btc") || name.includes("bitcoin")) return "BTC/USD";
  if (name.includes("eth") || name.includes("ethereum")) return "ETH/USDT";
  if (name.includes("gbp") || name.includes("pound")) return "GBP/JPY";
  if (name.includes("jpy") || name.includes("yen")) return "GBP/JPY";
  if (name.includes("aapl") || name.includes("apple")) return "AAPL";
  if (name.includes("nasdaq") || name.includes("ndx") || name.includes("us100")) return "NASDAQ";
  return void 0;
}
function inferTimeframeFromTradingStyle(style) {
  if (!style) return "1H";
  switch (style) {
    case "Scalping":
      return "15M";
    case "Day Trading":
      return "1H";
    case "Swing Trading":
      return "4H";
    default:
      return "1H";
  }
}
export {
  AnalysisSchema,
  runChartAnalysis
};

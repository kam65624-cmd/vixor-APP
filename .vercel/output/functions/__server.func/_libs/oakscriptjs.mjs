var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var ta_exports = {};
__export(ta_exports, {
  alma: () => alma,
  atr: () => atr,
  barssince: () => barssince,
  bb: () => bb,
  bbw: () => bbw,
  cci: () => cci,
  change: () => change,
  cmo: () => cmo,
  cog: () => cog,
  correlation: () => correlation,
  cross: () => cross,
  crossover: () => crossover,
  crossunder: () => crossunder,
  cum: () => cum,
  dev: () => dev,
  dmi: () => dmi,
  ema: () => ema,
  falling: () => falling,
  highest: () => highest,
  highestbars: () => highestbars,
  hma: () => hma,
  ichimoku: () => ichimoku,
  kc: () => kc,
  kcw: () => kcw,
  linreg: () => linreg,
  lowest: () => lowest,
  lowestbars: () => lowestbars,
  macd: () => macd,
  max: () => max,
  median: () => median,
  mfi: () => mfi,
  min: () => min,
  mode: () => mode,
  mom: () => mom,
  percentile_linear_interpolation: () => percentile_linear_interpolation,
  percentile_nearest_rank: () => percentile_nearest_rank,
  percentrank: () => percentrank,
  pivot_point_levels: () => pivot_point_levels,
  pivothigh: () => pivothigh,
  pivotlow: () => pivotlow,
  range: () => range,
  rci: () => rci,
  rising: () => rising,
  rma: () => rma,
  roc: () => roc,
  rsi: () => rsi,
  sar: () => sar,
  sma: () => sma,
  stdev: () => stdev,
  stoch: () => stoch,
  supertrend: () => supertrend,
  swma: () => swma,
  tr: () => tr,
  tsi: () => tsi,
  valuewhen: () => valuewhen,
  variance: () => variance,
  vwap: () => vwap,
  vwma: () => vwma,
  wma: () => wma,
  wpr: () => wpr,
  zigzag: () => zigzag
});
function sma(source, length2) {
  const result = [];
  const len = Math.floor(length2);
  for (let i = 0; i < source.length; i++) {
    if (i < len - 1) {
      result.push(NaN);
    } else {
      let sum4 = 0;
      for (let j = 0; j < len; j++) {
        sum4 += source[i - j];
      }
      result.push(sum4 / len);
    }
  }
  return result;
}
function ema(source, length2) {
  const result = [];
  const len = Math.floor(length2);
  const multiplier = 2 / (len + 1);
  let firstValidIndex = -1;
  let validCount = 0;
  let initSum = 0;
  for (let i = 0; i < source.length; i++) {
    const val = source[i];
    if (val !== void 0 && !isNaN(val)) {
      initSum += val;
      validCount++;
      if (validCount === len) {
        firstValidIndex = i;
        break;
      }
    }
  }
  let emaValue = validCount > 0 ? initSum / validCount : NaN;
  let emaInitialized = firstValidIndex >= 0;
  for (let i = 0; i < source.length; i++) {
    if (!emaInitialized || i < firstValidIndex) {
      result.push(NaN);
    } else if (i === firstValidIndex) {
      result.push(emaValue);
    } else {
      const val = source[i];
      if (val !== void 0 && !isNaN(val)) {
        emaValue = (val - emaValue) * multiplier + emaValue;
      }
      result.push(emaValue);
    }
  }
  return result;
}
function rsi(source, length2) {
  const result = [];
  const changes = [];
  for (let i = 1; i < source.length; i++) {
    changes.push(source[i] - source[i - 1]);
  }
  const gains = changes.map((c) => c > 0 ? c : 0);
  const losses = changes.map((c) => c < 0 ? -c : 0);
  const avgGains = rma(gains, length2);
  const avgLosses = rma(losses, length2);
  result.push(NaN);
  for (let i = 0; i < avgGains.length; i++) {
    if (avgLosses[i] === 0) {
      result.push(100);
    } else {
      const rs = avgGains[i] / avgLosses[i];
      result.push(100 - 100 / (1 + rs));
    }
  }
  return result;
}
function macd(source, fastLength, slowLength, signalLength) {
  const fastEma = ema(source, fastLength);
  const slowEma = ema(source, slowLength);
  const macdLine = [];
  for (let i = 0; i < source.length; i++) {
    macdLine.push(fastEma[i] - slowEma[i]);
  }
  const signalLine = ema(macdLine, signalLength);
  const histogram = [];
  for (let i = 0; i < source.length; i++) {
    histogram.push(macdLine[i] - signalLine[i]);
  }
  return [macdLine, signalLine, histogram];
}
function bb(series, length2, mult2) {
  const basis = sma(series, length2);
  const dev3 = stdev(series, length2);
  const upper2 = [];
  const lower2 = [];
  for (let i = 0; i < series.length; i++) {
    upper2.push(basis[i] + mult2 * dev3[i]);
    lower2.push(basis[i] - mult2 * dev3[i]);
  }
  return [basis, upper2, lower2];
}
function stdev(source, length2) {
  const result = [];
  const len = Math.floor(length2);
  const avg4 = sma(source, len);
  for (let i = 0; i < source.length; i++) {
    if (i < len - 1) {
      result.push(NaN);
    } else {
      let sumSquares = 0;
      for (let j = 0; j < len; j++) {
        const diff2 = source[i - j] - avg4[i];
        sumSquares += diff2 * diff2;
      }
      result.push(Math.sqrt(sumSquares / len));
    }
  }
  return result;
}
function crossover(series1, series2) {
  const result = [];
  for (let i = 0; i < series1.length; i++) {
    if (i === 0) {
      result.push(false);
    } else {
      result.push(series1[i] > series2[i] && series1[i - 1] <= series2[i - 1]);
    }
  }
  return result;
}
function crossunder(series1, series2) {
  const result = [];
  for (let i = 0; i < series1.length; i++) {
    if (i === 0) {
      result.push(false);
    } else {
      result.push(series1[i] < series2[i] && series1[i - 1] >= series2[i - 1]);
    }
  }
  return result;
}
function change(source, length2 = 1) {
  const result = [];
  for (let i = 0; i < source.length; i++) {
    if (i < length2) {
      result.push(NaN);
    } else {
      result.push(source[i] - source[i - length2]);
    }
  }
  return result;
}
function tr(handle_na = false, high, low, close) {
  if (!high || !low || !close) {
    throw new Error(
      "ta.tr() requires high, low, and close series. Either pass them explicitly or use createContext({ chart: { high, low, close } }) for implicit data."
    );
  }
  const result = [];
  for (let i = 0; i < high.length; i++) {
    if (i === 0) {
      result.push(high[i] - low[i]);
    } else {
      const prevClose = close[i - 1];
      if (isNaN(prevClose)) {
        if (handle_na) {
          result.push(high[i] - low[i]);
        } else {
          result.push(NaN);
        }
      } else {
        const tr3 = Math.max(
          high[i] - low[i],
          Math.abs(high[i] - prevClose),
          Math.abs(low[i] - prevClose)
        );
        result.push(tr3);
      }
    }
  }
  return result;
}
function atr(length2, high, low, close) {
  if (!high || !low || !close) {
    throw new Error(
      "ta.atr() requires high, low, and close series. Either pass them explicitly or use createContext({ chart: { high, low, close } }) for implicit data."
    );
  }
  const trueRange = tr(false, high, low, close);
  return rma(trueRange, length2);
}
function supertrend(factor, atrPeriod, high, low, close, wicks = false) {
  if (!high || !low || !close) {
    throw new Error(
      "ta.supertrend() requires high, low, and close series. Either pass them explicitly or use createContext({ chart: { high, low, close } }) for implicit data."
    );
  }
  const supertrendValues = [];
  const directions = [];
  const source = [];
  for (let i = 0; i < high.length; i++) {
    source.push((high[i] + low[i]) / 2);
  }
  const atrValues = atr(atrPeriod, high, low, close);
  let prevLowerBand = NaN;
  let prevUpperBand = NaN;
  let prevSuperTrend = NaN;
  for (let i = 0; i < source.length; i++) {
    const atrValue = atrValues[i] * factor;
    if (isNaN(atrValue)) {
      supertrendValues.push(NaN);
      directions.push(1);
      continue;
    }
    let upperBand = source[i] + atrValue;
    let lowerBand = source[i] - atrValue;
    const highPrice = wicks ? high[i] : close[i];
    const lowPrice = wicks ? low[i] : close[i];
    const prevLowPrice = i > 0 ? wicks ? low[i - 1] : close[i - 1] : 0;
    const prevHighPrice = i > 0 ? wicks ? high[i - 1] : close[i - 1] : 0;
    if (i > 0 && !isNaN(prevLowerBand) && !isNaN(prevUpperBand)) {
      lowerBand = lowerBand > prevLowerBand || prevLowPrice < prevLowerBand ? lowerBand : prevLowerBand;
      upperBand = upperBand < prevUpperBand || prevHighPrice > prevUpperBand ? upperBand : prevUpperBand;
    }
    let currentDirection;
    if (isNaN(prevSuperTrend)) {
      currentDirection = 1;
    } else if (prevSuperTrend === prevUpperBand) {
      currentDirection = highPrice > upperBand ? -1 : 1;
    } else {
      currentDirection = lowPrice < lowerBand ? 1 : -1;
    }
    const superTrendValue = currentDirection === -1 ? lowerBand : upperBand;
    supertrendValues.push(superTrendValue);
    directions.push(currentDirection);
    prevLowerBand = lowerBand;
    prevUpperBand = upperBand;
    prevSuperTrend = superTrendValue;
  }
  return [supertrendValues, directions];
}
function rma(source, length2) {
  const result = [];
  const len = Math.floor(length2);
  const alpha = 1 / len;
  let firstValidIndex = -1;
  let validCount = 0;
  let initSum = 0;
  for (let i = 0; i < source.length; i++) {
    const val = source[i];
    if (val !== void 0 && !isNaN(val)) {
      initSum += val;
      validCount++;
      if (validCount === len) {
        firstValidIndex = i;
        break;
      }
    }
  }
  let rmaValue = validCount > 0 ? initSum / validCount : NaN;
  let rmaInitialized = firstValidIndex >= 0;
  for (let i = 0; i < source.length; i++) {
    if (!rmaInitialized || i < firstValidIndex) {
      result.push(NaN);
    } else if (i === firstValidIndex) {
      result.push(rmaValue);
    } else {
      const val = source[i];
      if (val !== void 0 && !isNaN(val)) {
        rmaValue = alpha * val + (1 - alpha) * rmaValue;
      }
      result.push(rmaValue);
    }
  }
  return result;
}
function wma(source, length2) {
  const result = [];
  const len = Math.floor(length2);
  for (let i = 0; i < source.length; i++) {
    if (i < len - 1) {
      result.push(NaN);
    } else {
      let sum4 = 0;
      let weightSum = 0;
      for (let j = 0; j < len; j++) {
        const weight = len - j;
        sum4 += source[i - j] * weight;
        weightSum += weight;
      }
      result.push(sum4 / weightSum);
    }
  }
  return result;
}
function highest(source, length2) {
  const result = [];
  for (let i = 0; i < source.length; i++) {
    if (i < length2 - 1) {
      result.push(NaN);
    } else {
      let max6 = -Infinity;
      for (let j = 0; j < length2; j++) {
        if (!isNaN(source[i - j])) {
          max6 = Math.max(max6, source[i - j]);
        }
      }
      result.push(max6 === -Infinity ? NaN : max6);
    }
  }
  return result;
}
function lowest(source, length2) {
  const result = [];
  for (let i = 0; i < source.length; i++) {
    if (i < length2 - 1) {
      result.push(NaN);
    } else {
      let min6 = Infinity;
      for (let j = 0; j < length2; j++) {
        if (!isNaN(source[i - j])) {
          min6 = Math.min(min6, source[i - j]);
        }
      }
      result.push(min6 === Infinity ? NaN : min6);
    }
  }
  return result;
}
function cum(source) {
  const result = [];
  let sum4 = 0;
  for (let i = 0; i < source.length; i++) {
    sum4 += source[i];
    result.push(sum4);
  }
  return result;
}
function cross(source1, source2) {
  const result = [];
  for (let i = 0; i < source1.length; i++) {
    if (i === 0) {
      result.push(false);
    } else {
      const crossedUp = source1[i] > source2[i] && source1[i - 1] <= source2[i - 1];
      const crossedDown = source1[i] < source2[i] && source1[i - 1] >= source2[i - 1];
      result.push(crossedUp || crossedDown);
    }
  }
  return result;
}
function rising(source, length2) {
  const result = [];
  for (let i = 0; i < source.length; i++) {
    if (i < length2) {
      result.push(false);
    } else {
      let isRising = true;
      for (let j = 1; j <= length2; j++) {
        if (source[i - j + 1] <= source[i - j]) {
          isRising = false;
          break;
        }
      }
      result.push(isRising);
    }
  }
  return result;
}
function falling(source, length2) {
  const result = [];
  for (let i = 0; i < source.length; i++) {
    if (i < length2) {
      result.push(false);
    } else {
      let isFalling = true;
      for (let j = 1; j <= length2; j++) {
        if (source[i - j + 1] >= source[i - j]) {
          isFalling = false;
          break;
        }
      }
      result.push(isFalling);
    }
  }
  return result;
}
function roc(source, length2) {
  const result = [];
  for (let i = 0; i < source.length; i++) {
    if (i < length2) {
      result.push(NaN);
    } else {
      const oldValue = source[i - length2];
      if (oldValue === 0 || isNaN(oldValue) || isNaN(source[i])) {
        result.push(NaN);
      } else {
        const changeValue = source[i] - oldValue;
        result.push(100 * changeValue / oldValue);
      }
    }
  }
  return result;
}
function mom(source, length2) {
  const result = [];
  for (let i = 0; i < source.length; i++) {
    if (i < length2) {
      result.push(NaN);
    } else {
      if (isNaN(source[i]) || isNaN(source[i - length2])) {
        result.push(NaN);
      } else {
        result.push(source[i] - source[i - length2]);
      }
    }
  }
  return result;
}
function dev(source, length2) {
  const result = [];
  const meanValues = sma(source, length2);
  for (let i = 0; i < source.length; i++) {
    if (i < length2 - 1 || isNaN(meanValues[i])) {
      result.push(NaN);
    } else {
      let sum4 = 0;
      for (let j = 0; j < length2; j++) {
        if (!isNaN(source[i - j])) {
          sum4 += Math.abs(source[i - j] - meanValues[i]);
        }
      }
      result.push(sum4 / length2);
    }
  }
  return result;
}
function variance(source, length2, biased = true) {
  const result = [];
  const meanValues = sma(source, length2);
  for (let i = 0; i < source.length; i++) {
    if (i < length2 - 1 || isNaN(meanValues[i])) {
      result.push(NaN);
    } else {
      let sumSquares = 0;
      let count = 0;
      for (let j = 0; j < length2; j++) {
        if (!isNaN(source[i - j])) {
          const diff2 = source[i - j] - meanValues[i];
          sumSquares += diff2 * diff2;
          count++;
        }
      }
      const divisor = biased ? count : count - 1;
      result.push(divisor > 0 ? sumSquares / divisor : NaN);
    }
  }
  return result;
}
function median(source, length2) {
  const result = [];
  for (let i = 0; i < source.length; i++) {
    if (i < length2 - 1) {
      result.push(NaN);
    } else {
      const values = [];
      for (let j = 0; j < length2; j++) {
        if (!isNaN(source[i - j])) {
          values.push(source[i - j]);
        }
      }
      if (values.length === 0) {
        result.push(NaN);
      } else {
        values.sort((a, b2) => a - b2);
        const mid = Math.floor(values.length / 2);
        if (values.length % 2 === 0) {
          result.push((values[mid - 1] + values[mid]) / 2);
        } else {
          result.push(values[mid]);
        }
      }
    }
  }
  return result;
}
function swma(source) {
  const result = [];
  for (let i = 0; i < source.length; i++) {
    if (i < 3) {
      result.push(NaN);
    } else {
      if (isNaN(source[i]) || isNaN(source[i - 1]) || isNaN(source[i - 2]) || isNaN(source[i - 3])) {
        result.push(NaN);
      } else {
        const value = source[i - 3] * (1 / 6) + source[i - 2] * (2 / 6) + source[i - 1] * (2 / 6) + source[i] * (1 / 6);
        result.push(value);
      }
    }
  }
  return result;
}
function vwma(source, length2, volume) {
  if (!volume) {
    throw new Error(
      "ta.vwma() requires volume series. Either pass it explicitly or use createContext({ chart: { ..., volume } }) for implicit data."
    );
  }
  const sourceTimesVolume = [];
  for (let i = 0; i < source.length; i++) {
    sourceTimesVolume.push(source[i] * volume[i]);
  }
  const numerator = sma(sourceTimesVolume, length2);
  const denominator = sma(volume, length2);
  const result = [];
  for (let i = 0; i < source.length; i++) {
    if (denominator[i] === 0 || isNaN(denominator[i])) {
      result.push(NaN);
    } else {
      result.push(numerator[i] / denominator[i]);
    }
  }
  return result;
}
function linreg(source, length2, offset = 0) {
  const result = [];
  const len = Math.floor(length2);
  for (let i = 0; i < source.length; i++) {
    if (i < len - 1) {
      result.push(NaN);
    } else {
      let hasNaN = false;
      for (let j = 0; j < len; j++) {
        if (isNaN(source[i - j])) {
          hasNaN = true;
          break;
        }
      }
      if (hasNaN) {
        result.push(NaN);
      } else {
        let sumX = 0;
        let sumY = 0;
        let sumXY = 0;
        let sumX2 = 0;
        for (let j = 0; j < len; j++) {
          const x2 = j;
          const y = source[i - (len - 1 - j)];
          sumX += x2;
          sumY += y;
          sumXY += x2 * y;
          sumX2 += x2 * x2;
        }
        const slope = (len * sumXY - sumX * sumY) / (len * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / len;
        const x = len - 1 - offset;
        result.push(intercept + slope * x);
      }
    }
  }
  return result;
}
function correlation(source1, source2, length2) {
  const result = [];
  for (let i = 0; i < source1.length; i++) {
    if (i < length2 - 1) {
      result.push(NaN);
    } else {
      const pairs = [];
      for (let j = 0; j < length2; j++) {
        if (!isNaN(source1[i - j]) && !isNaN(source2[i - j])) {
          pairs.push([source1[i - j], source2[i - j]]);
        }
      }
      if (pairs.length === 0) {
        result.push(NaN);
      } else {
        let sum1 = 0;
        let sum22 = 0;
        for (const [v1, v2] of pairs) {
          sum1 += v1;
          sum22 += v2;
        }
        const mean1 = sum1 / pairs.length;
        const mean2 = sum22 / pairs.length;
        let numerator = 0;
        let sum1Sq = 0;
        let sum2Sq = 0;
        for (const [v1, v2] of pairs) {
          const dev1 = v1 - mean1;
          const dev22 = v2 - mean2;
          numerator += dev1 * dev22;
          sum1Sq += dev1 * dev1;
          sum2Sq += dev22 * dev22;
        }
        const denominator = Math.sqrt(sum1Sq * sum2Sq);
        if (denominator === 0) {
          result.push(NaN);
        } else {
          result.push(numerator / denominator);
        }
      }
    }
  }
  return result;
}
function percentrank(source, length2) {
  const result = [];
  for (let i = 0; i < source.length; i++) {
    if (i < length2) {
      result.push(NaN);
    } else {
      if (isNaN(source[i])) {
        result.push(NaN);
        continue;
      }
      let hasNaN = false;
      for (let j = 1; j <= length2; j++) {
        if (isNaN(source[i - j])) {
          hasNaN = true;
          break;
        }
      }
      if (hasNaN) {
        result.push(NaN);
      } else {
        const currentValue = source[i];
        let countLessOrEqual = 0;
        for (let j = 1; j <= length2; j++) {
          if (source[i - j] <= currentValue) {
            countLessOrEqual++;
          }
        }
        result.push(countLessOrEqual / length2 * 100);
      }
    }
  }
  return result;
}
function cci(source, length2) {
  const result = [];
  const smaValues = sma(source, length2);
  const devValues = dev(source, length2);
  for (let i = 0; i < source.length; i++) {
    if (isNaN(smaValues[i]) || isNaN(devValues[i]) || devValues[i] === 0) {
      result.push(NaN);
    } else {
      const cci3 = (source[i] - smaValues[i]) / (0.015 * devValues[i]);
      result.push(cci3);
    }
  }
  return result;
}
function stoch(source, high, low, length2) {
  const result = [];
  const lowestValues = lowest(low, length2);
  const highestValues = highest(high, length2);
  for (let i = 0; i < source.length; i++) {
    if (isNaN(lowestValues[i]) || isNaN(highestValues[i])) {
      result.push(NaN);
    } else {
      const range4 = highestValues[i] - lowestValues[i];
      if (range4 === 0) {
        result.push(NaN);
      } else {
        const stochValue = 100 * (source[i] - lowestValues[i]) / range4;
        result.push(stochValue);
      }
    }
  }
  return result;
}
function mfi(source, length2, volume) {
  if (!volume) {
    throw new Error(
      "ta.mfi() requires volume series. Either pass it explicitly or use createContext({ chart: { ..., volume } }) for implicit data."
    );
  }
  const result = [];
  const changes = [NaN];
  for (let i = 1; i < source.length; i++) {
    changes.push(source[i] - source[i - 1]);
  }
  const positiveFlow = [];
  const negativeFlow = [];
  for (let i = 0; i < source.length; i++) {
    if (i === 0 || isNaN(changes[i])) {
      positiveFlow.push(0);
      negativeFlow.push(0);
    } else if (changes[i] > 0) {
      positiveFlow.push(volume[i] * source[i]);
      negativeFlow.push(0);
    } else if (changes[i] < 0) {
      positiveFlow.push(0);
      negativeFlow.push(volume[i] * source[i]);
    } else {
      positiveFlow.push(0);
      negativeFlow.push(0);
    }
  }
  for (let i = 0; i < source.length; i++) {
    if (i < length2) {
      result.push(NaN);
    } else {
      let posSum = 0;
      let negSum = 0;
      for (let j = 0; j < length2; j++) {
        posSum += positiveFlow[i - j];
        negSum += negativeFlow[i - j];
      }
      if (negSum === 0) {
        result.push(100);
      } else {
        const moneyRatio = posSum / negSum;
        const mfiValue = 100 - 100 / (1 + moneyRatio);
        result.push(mfiValue);
      }
    }
  }
  return result;
}
function hma(source, length2) {
  const halfLength = Math.floor(length2 / 2);
  const sqrtLength = Math.floor(Math.sqrt(length2));
  const wmaHalf = wma(source, halfLength);
  const wmaFull = wma(source, length2);
  const diff2 = [];
  for (let i = 0; i < source.length; i++) {
    diff2.push(2 * wmaHalf[i] - wmaFull[i]);
  }
  return wma(diff2, sqrtLength);
}
function sar(start, inc, max6, high, low, close) {
  if (!high || !low || !close) {
    throw new Error(
      "ta.sar() requires high, low, and close series. Either pass them explicitly or use createContext({ chart: { high, low, close } }) for implicit data."
    );
  }
  const result = [];
  let sarValue = NaN;
  let extremePoint = NaN;
  let acceleration = start;
  let isUpTrend = false;
  let isFirstTrendBar = false;
  for (let i = 0; i < close.length; i++) {
    if (i === 0) {
      result.push(NaN);
      continue;
    }
    if (i === 1) {
      if (close[i] > close[i - 1]) {
        isUpTrend = true;
        extremePoint = high[i];
        sarValue = low[i - 1];
      } else {
        isUpTrend = false;
        extremePoint = low[i];
        sarValue = high[i - 1];
      }
      isFirstTrendBar = true;
      acceleration = start;
    }
    sarValue = sarValue + acceleration * (extremePoint - sarValue);
    if (isUpTrend) {
      if (sarValue > low[i]) {
        isFirstTrendBar = true;
        isUpTrend = false;
        sarValue = Math.max(high[i], extremePoint);
        extremePoint = low[i];
        acceleration = start;
      }
    } else {
      if (sarValue < high[i]) {
        isFirstTrendBar = true;
        isUpTrend = true;
        sarValue = Math.min(low[i], extremePoint);
        extremePoint = high[i];
        acceleration = start;
      }
    }
    if (!isFirstTrendBar) {
      if (isUpTrend) {
        if (high[i] > extremePoint) {
          extremePoint = high[i];
          acceleration = Math.min(acceleration + inc, max6);
        }
      } else {
        if (low[i] < extremePoint) {
          extremePoint = low[i];
          acceleration = Math.min(acceleration + inc, max6);
        }
      }
    }
    if (isUpTrend) {
      sarValue = Math.min(sarValue, low[i - 1]);
      if (i > 1) {
        sarValue = Math.min(sarValue, low[i - 2]);
      }
    } else {
      sarValue = Math.max(sarValue, high[i - 1]);
      if (i > 1) {
        sarValue = Math.max(sarValue, high[i - 2]);
      }
    }
    result.push(sarValue);
    isFirstTrendBar = false;
  }
  return result;
}
function pivothigh(sourceOrLeftbars, leftbarsOrRightbars, rightbars, high) {
  let source;
  let leftbars;
  let right;
  if (rightbars === void 0) {
    if (!high) {
      throw new Error("ta.pivothigh() requires high series when using two-parameter version.");
    }
    source = high;
    leftbars = sourceOrLeftbars;
    right = leftbarsOrRightbars;
  } else {
    source = sourceOrLeftbars;
    leftbars = leftbarsOrRightbars;
    right = rightbars;
  }
  const result = [];
  for (let i = 0; i < source.length; i++) {
    if (i < leftbars || i + right >= source.length) {
      result.push(NaN);
      continue;
    }
    const centerValue = source[i];
    let isPivot = true;
    for (let j = 1; j <= leftbars; j++) {
      if (source[i - j] >= centerValue) {
        isPivot = false;
        break;
      }
    }
    if (isPivot) {
      for (let j = 1; j <= right; j++) {
        if (source[i + j] >= centerValue) {
          isPivot = false;
          break;
        }
      }
    }
    result.push(isPivot ? centerValue : NaN);
  }
  return result;
}
function pivotlow(sourceOrLeftbars, leftbarsOrRightbars, rightbars, low) {
  let source;
  let leftbars;
  let right;
  if (rightbars === void 0) {
    if (!low) {
      throw new Error("ta.pivotlow() requires low series when using two-parameter version.");
    }
    source = low;
    leftbars = sourceOrLeftbars;
    right = leftbarsOrRightbars;
  } else {
    source = sourceOrLeftbars;
    leftbars = leftbarsOrRightbars;
    right = rightbars;
  }
  const result = [];
  for (let i = 0; i < source.length; i++) {
    if (i < leftbars || i + right >= source.length) {
      result.push(NaN);
      continue;
    }
    const centerValue = source[i];
    let isPivot = true;
    for (let j = 1; j <= leftbars; j++) {
      if (source[i - j] <= centerValue) {
        isPivot = false;
        break;
      }
    }
    if (isPivot) {
      for (let j = 1; j <= right; j++) {
        if (source[i + j] <= centerValue) {
          isPivot = false;
          break;
        }
      }
    }
    result.push(isPivot ? centerValue : NaN);
  }
  return result;
}
function barssince(condition) {
  const result = [];
  let barsSinceTrue = NaN;
  for (let i = 0; i < condition.length; i++) {
    if (condition[i]) {
      barsSinceTrue = 0;
    } else if (!isNaN(barsSinceTrue)) {
      barsSinceTrue++;
    }
    result.push(barsSinceTrue);
  }
  return result;
}
function valuewhen(condition, source, occurrence) {
  const result = [];
  for (let i = 0; i < condition.length; i++) {
    let occurrenceCount = 0;
    let foundValue = NaN;
    for (let j = i; j >= 0; j--) {
      if (condition[j]) {
        if (occurrenceCount === occurrence) {
          foundValue = source[j];
          break;
        }
        occurrenceCount++;
      }
    }
    result.push(foundValue);
  }
  return result;
}
function dmi(diLength, adxSmoothing, high, low, close) {
  const len = Math.max(high.length, low.length, close.length);
  const plusDM = [];
  const minusDM = [];
  const trueRangeValues = tr(false, high, low, close);
  for (let i = 0; i < len; i++) {
    if (i === 0) {
      plusDM.push(0);
      minusDM.push(0);
    } else {
      const upMove = high[i] - high[i - 1];
      const downMove = low[i - 1] - low[i];
      let plusDMVal = 0;
      let minusDMVal = 0;
      if (upMove > downMove && upMove > 0) {
        plusDMVal = upMove;
      }
      if (downMove > upMove && downMove > 0) {
        minusDMVal = downMove;
      }
      plusDM.push(plusDMVal);
      minusDM.push(minusDMVal);
    }
  }
  const smoothedPlusDM = rma(plusDM, diLength);
  const smoothedMinusDM = rma(minusDM, diLength);
  const smoothedTR = rma(trueRangeValues, diLength);
  const plusDI = [];
  const minusDI = [];
  for (let i = 0; i < len; i++) {
    if (smoothedTR[i] === 0) {
      plusDI.push(0);
      minusDI.push(0);
    } else {
      plusDI.push(smoothedPlusDM[i] / smoothedTR[i] * 100);
      minusDI.push(smoothedMinusDM[i] / smoothedTR[i] * 100);
    }
  }
  const dx = [];
  for (let i = 0; i < len; i++) {
    const sum4 = plusDI[i] + minusDI[i];
    if (sum4 === 0) {
      dx.push(0);
    } else {
      dx.push(Math.abs(plusDI[i] - minusDI[i]) / sum4 * 100);
    }
  }
  const adx = rma(dx, adxSmoothing);
  return [plusDI, minusDI, adx];
}
function tsi(source, shortLength, longLength) {
  const momentum = [];
  for (let i = 0; i < source.length; i++) {
    if (i === 0) {
      momentum.push(NaN);
    } else {
      momentum.push(source[i] - source[i - 1]);
    }
  }
  const smoothedMomentum = ema(ema(momentum, longLength), shortLength);
  const absMomentum = momentum.map(Math.abs);
  const smoothedAbsMomentum = ema(ema(absMomentum, longLength), shortLength);
  const result = [];
  for (let i = 0; i < source.length; i++) {
    if (smoothedAbsMomentum[i] === 0) {
      result.push(0);
    } else {
      result.push(smoothedMomentum[i] / smoothedAbsMomentum[i] * 100);
    }
  }
  return result;
}
function cmo(source, length2) {
  const result = [];
  for (let i = 0; i < source.length; i++) {
    if (i < length2) {
      result.push(NaN);
      continue;
    }
    let sumGains = 0;
    let sumLosses = 0;
    for (let j = 0; j < length2; j++) {
      const change3 = source[i - j] - source[i - j - 1];
      if (change3 > 0) {
        sumGains += change3;
      } else {
        sumLosses += Math.abs(change3);
      }
    }
    const totalMovement = sumGains + sumLosses;
    if (totalMovement === 0) {
      result.push(0);
    } else {
      const cmoValue = (sumGains - sumLosses) / totalMovement * 100;
      result.push(cmoValue);
    }
  }
  return result;
}
function kc(source, length2, mult2, useTrueRange = true, high, low, close) {
  const middle = ema(source, length2);
  let range4;
  if (useTrueRange) {
    if (!high || !low || !close) {
      throw new Error("ta.kc() with useTrueRange=true requires high, low, and close data");
    }
    range4 = tr(false, high, low, close);
  } else {
    if (!high || !low) {
      throw new Error("ta.kc() requires high and low data");
    }
    range4 = [];
    for (let i = 0; i < high.length; i++) {
      range4.push(high[i] - low[i]);
    }
  }
  const rangeEma = ema(range4, length2);
  const upper2 = [];
  const lower2 = [];
  for (let i = 0; i < middle.length; i++) {
    upper2.push(middle[i] + rangeEma[i] * mult2);
    lower2.push(middle[i] - rangeEma[i] * mult2);
  }
  return [middle, upper2, lower2];
}
function bbw(source, length2, mult2) {
  const [basis, upper2, lower2] = bb(source, length2, mult2);
  const result = [];
  for (let i = 0; i < source.length; i++) {
    if (basis[i] === 0) {
      result.push(NaN);
    } else {
      const width = (upper2[i] - lower2[i]) / basis[i] * 100;
      result.push(width);
    }
  }
  return result;
}
function wpr(high, low, close, length2 = 14) {
  const result = [];
  for (let i = 0; i < close.length; i++) {
    if (i < length2 - 1) {
      result.push(NaN);
      continue;
    }
    let highestHigh = high[i - length2 + 1];
    let lowestLow = low[i - length2 + 1];
    for (let j = i - length2 + 2; j <= i; j++) {
      if (high[j] > highestHigh)
        highestHigh = high[j];
      if (low[j] < lowestLow)
        lowestLow = low[j];
    }
    const range4 = highestHigh - lowestLow;
    if (range4 === 0) {
      result.push(NaN);
    } else {
      const wprValue = (highestHigh - close[i]) / range4 * -100;
      result.push(wprValue);
    }
  }
  return result;
}
function vwap(source, volume) {
  if (source.length !== volume.length) {
    throw new Error("ta.vwap: source and volume must have the same length");
  }
  const result = [];
  let cumulativePV = 0;
  let cumulativeVolume = 0;
  for (let i = 0; i < source.length; i++) {
    if (isNaN(source[i]) || isNaN(volume[i])) {
      result.push(NaN);
      continue;
    }
    cumulativePV += source[i] * volume[i];
    cumulativeVolume += volume[i];
    if (cumulativeVolume === 0) {
      result.push(NaN);
    } else {
      result.push(cumulativePV / cumulativeVolume);
    }
  }
  return result;
}
function alma(source, length2 = 9, offset = 0.85, sigma = 6, floor2 = false) {
  const result = [];
  const m = floor2 ? Math.floor(offset * (length2 - 1)) : offset * (length2 - 1);
  const s = length2 / sigma;
  const weights = [];
  let weightSum = 0;
  for (let i = 0; i < length2; i++) {
    const weight = Math.exp(-1 * Math.pow(i - m, 2) / (2 * Math.pow(s, 2)));
    weights.push(weight);
    weightSum += weight;
  }
  for (let i = 0; i < length2; i++) {
    weights[i] /= weightSum;
  }
  for (let i = 0; i < source.length; i++) {
    if (i < length2 - 1) {
      result.push(NaN);
      continue;
    }
    let almaValue = 0;
    for (let j = 0; j < length2; j++) {
      almaValue += source[i - length2 + 1 + j] * weights[j];
    }
    result.push(almaValue);
  }
  return result;
}
function kcw(source, length2 = 20, mult2 = 2, useTrueRange = true, high, low, close) {
  const [basis, upper2, lower2] = kc(source, length2, mult2, useTrueRange, high, low, close);
  const result = [];
  for (let i = 0; i < source.length; i++) {
    if (isNaN(basis[i]) || basis[i] === 0) {
      result.push(NaN);
    } else {
      const width = (upper2[i] - lower2[i]) / basis[i] * 100;
      result.push(width);
    }
  }
  return result;
}
function range(high, low) {
  if (high.length !== low.length) {
    throw new Error("ta.range: high and low must have the same length");
  }
  const result = [];
  for (let i = 0; i < high.length; i++) {
    if (isNaN(high[i]) || isNaN(low[i])) {
      result.push(NaN);
    } else {
      result.push(high[i] - low[i]);
    }
  }
  return result;
}
function highestbars(source, length2) {
  const result = [];
  for (let i = 0; i < source.length; i++) {
    if (i < length2 - 1) {
      result.push(NaN);
      continue;
    }
    let highestValue = source[i - length2 + 1];
    let highestOffset = length2 - 1;
    for (let j = i - length2 + 2; j <= i; j++) {
      if (source[j] > highestValue) {
        highestValue = source[j];
        highestOffset = i - j;
      }
    }
    result.push(highestOffset);
  }
  return result;
}
function lowestbars(source, length2) {
  const result = [];
  for (let i = 0; i < source.length; i++) {
    if (i < length2 - 1) {
      result.push(NaN);
      continue;
    }
    let lowestValue = source[i - length2 + 1];
    let lowestOffset = length2 - 1;
    for (let j = i - length2 + 2; j <= i; j++) {
      if (source[j] < lowestValue) {
        lowestValue = source[j];
        lowestOffset = i - j;
      }
    }
    result.push(lowestOffset);
  }
  return result;
}
function max(source1, source2) {
  if (source1.length !== source2.length) {
    throw new Error("ta.max: source1 and source2 must have the same length");
  }
  const result = [];
  for (let i = 0; i < source1.length; i++) {
    if (isNaN(source1[i]) || isNaN(source2[i])) {
      result.push(NaN);
    } else {
      result.push(Math.max(source1[i], source2[i]));
    }
  }
  return result;
}
function min(source1, source2) {
  if (source1.length !== source2.length) {
    throw new Error("ta.min: source1 and source2 must have the same length");
  }
  const result = [];
  for (let i = 0; i < source1.length; i++) {
    if (isNaN(source1[i]) || isNaN(source2[i])) {
      result.push(NaN);
    } else {
      result.push(Math.min(source1[i], source2[i]));
    }
  }
  return result;
}
function cog(source, length2 = 10) {
  const result = [];
  for (let i = 0; i < source.length; i++) {
    if (i < length2 - 1) {
      result.push(NaN);
      continue;
    }
    let numerator = 0;
    let denominator = 0;
    for (let j = 0; j < length2; j++) {
      const weight = j + 1;
      const price = source[i - length2 + 1 + j];
      numerator += weight * price;
      denominator += price;
    }
    if (denominator === 0) {
      result.push(NaN);
    } else {
      const cog3 = -1 * (numerator / denominator) + (length2 + 1) / 2;
      result.push(cog3);
    }
  }
  return result;
}
function mode(source, length2) {
  const result = [];
  for (let i = 0; i < source.length; i++) {
    if (i < length2 - 1) {
      result.push(NaN);
      continue;
    }
    const values = [];
    for (let j = 0; j < length2; j++) {
      const value = source[i - j];
      if (!isNaN(value)) {
        values.push(value);
      }
    }
    if (values.length === 0) {
      result.push(NaN);
      continue;
    }
    const frequencyMap = /* @__PURE__ */ new Map();
    for (const value of values) {
      frequencyMap.set(value, (frequencyMap.get(value) || 0) + 1);
    }
    let maxFrequency = 0;
    frequencyMap.forEach((freq) => {
      if (freq > maxFrequency) {
        maxFrequency = freq;
      }
    });
    const modesWithMaxFreq = [];
    frequencyMap.forEach((freq, value) => {
      if (freq === maxFrequency) {
        modesWithMaxFreq.push(value);
      }
    });
    result.push(Math.min(...modesWithMaxFreq));
  }
  return result;
}
function percentile_linear_interpolation(source, length2, percentage) {
  const result = [];
  for (let i = 0; i < source.length; i++) {
    if (i < length2 - 1) {
      result.push(NaN);
      continue;
    }
    const values = [];
    for (let j = 0; j < length2; j++) {
      const value = source[i - j];
      values.push(value);
    }
    if (values.some((v) => isNaN(v))) {
      result.push(NaN);
      continue;
    }
    const sorted = [...values].sort((a, b2) => a - b2);
    const position = percentage / 100 * (sorted.length - 1);
    const lowerIndex = Math.floor(position);
    const upperIndex = Math.ceil(position);
    if (lowerIndex === upperIndex) {
      result.push(sorted[lowerIndex]);
    } else {
      const fraction = position - lowerIndex;
      const interpolated = sorted[lowerIndex] + fraction * (sorted[upperIndex] - sorted[lowerIndex]);
      result.push(interpolated);
    }
  }
  return result;
}
function percentile_nearest_rank(source, length2, percentage) {
  const result = [];
  for (let i = 0; i < source.length; i++) {
    if (i < length2 - 1) {
      result.push(NaN);
      continue;
    }
    const values = [];
    for (let j = 0; j < length2; j++) {
      const value = source[i - j];
      if (!isNaN(value)) {
        values.push(value);
      }
    }
    if (values.length === 0) {
      result.push(NaN);
      continue;
    }
    const sorted = [...values].sort((a, b2) => a - b2);
    if (percentage >= 100) {
      result.push(sorted[sorted.length - 1]);
      continue;
    }
    const rank2 = Math.ceil(percentage / 100 * sorted.length);
    const index = Math.max(0, rank2 - 1);
    result.push(sorted[index]);
  }
  return result;
}
function rci(source, length2) {
  const result = [];
  for (let i = 0; i < source.length; i++) {
    if (i < length2 - 1) {
      result.push(NaN);
      continue;
    }
    const values = [];
    for (let j = 0; j < length2; j++) {
      values.push(source[i - length2 + 1 + j]);
    }
    if (values.some((v) => isNaN(v))) {
      result.push(NaN);
      continue;
    }
    const indexed = values.map((value, index) => ({ value, index }));
    const sorted = [...indexed].sort((a, b2) => a.value - b2.value);
    const ranks = new Array(length2).fill(0);
    let currentRank = 1;
    for (let j = 0; j < sorted.length; j++) {
      let tieCount = 1;
      while (j + tieCount < sorted.length && sorted[j].value === sorted[j + tieCount].value) {
        tieCount++;
      }
      const avgRank = (currentRank + (currentRank + tieCount - 1)) / 2;
      for (let k = 0; k < tieCount; k++) {
        ranks[sorted[j + k].index] = avgRank;
      }
      j += tieCount - 1;
      currentRank += tieCount;
    }
    let sumSquaredDiff = 0;
    for (let j = 0; j < length2; j++) {
      const timeRank = j + 1;
      const diff2 = ranks[j] - timeRank;
      sumSquaredDiff += diff2 * diff2;
    }
    const n = length2;
    const base = (n * n * n - n) / 12;
    let tieCorrection = 0;
    for (let j = 0; j < sorted.length; ) {
      let tieCount = 1;
      while (j + tieCount < sorted.length && sorted[j].value === sorted[j + tieCount].value) {
        tieCount++;
      }
      if (tieCount > 1) {
        tieCorrection += (tieCount * tieCount * tieCount - tieCount) / 12;
      }
      j += tieCount;
    }
    const A = base - tieCorrection;
    const B = base;
    let rho;
    if (A === 0 || B === 0) {
      rho = 0;
    } else {
      rho = (A + B - sumSquaredDiff) / (2 * Math.sqrt(A * B));
    }
    result.push(rho * 100);
  }
  return result;
}
function pivot_point_levels(type, anchor, developing = false, high, low, close, open) {
  const typeStr = typeof type === "string" ? type : String(type[0]);
  const isDeveloping = typeof developing === "boolean" ? developing : developing[0];
  if (typeStr === "Woodie" && isDeveloping) {
    throw new Error("ta.pivot_point_levels: Woodie type cannot use developing=true");
  }
  const length2 = anchor.length;
  if (high && high.length !== length2)
    throw new Error("High series length mismatch");
  if (low && low.length !== length2)
    throw new Error("Low series length mismatch");
  if (close && close.length !== length2)
    throw new Error("Close series length mismatch");
  if (open && open.length !== length2)
    throw new Error("Open series length mismatch");
  const results = Array.from({ length: 11 }, () => []);
  let lastH = NaN, lastL = NaN, lastC = NaN, lastO = NaN;
  let lastAnchorIndex = -1;
  for (let i = 0; i < length2; i++) {
    if (anchor[i]) {
      lastAnchorIndex = i;
      lastH = high ? high[i] : NaN;
      lastL = low ? low[i] : NaN;
      lastC = close ? close[i] : NaN;
      lastO = open ? open[i] : NaN;
    }
    let h, l, c, o;
    if (isDeveloping && lastAnchorIndex >= 0) {
      h = high ? Math.max(...high.slice(lastAnchorIndex, i + 1).filter((v) => !isNaN(v))) : NaN;
      l = low ? Math.min(...low.slice(lastAnchorIndex, i + 1).filter((v) => !isNaN(v))) : NaN;
      c = close ? close[i] : NaN;
      o = open && lastAnchorIndex >= 0 ? open[lastAnchorIndex] : NaN;
    } else {
      h = lastH;
      l = lastL;
      c = lastC;
      o = lastO;
    }
    const levels = calculatePivotLevels(typeStr, h, l, c, o);
    for (let j = 0; j < 11; j++) {
      results[j].push(levels[j]);
    }
  }
  return results;
}
function calculatePivotLevels(type, h, l, c, o) {
  if (isNaN(h) || isNaN(l) || isNaN(c)) {
    return Array(11).fill(NaN);
  }
  const levels = Array(11).fill(NaN);
  let P;
  switch (type) {
    case "Traditional":
    case "Fibonacci":
    case "Classic":
      P = (h + l + c) / 3;
      break;
    case "Woodie":
      P = (h + l + 2 * c) / 4;
      break;
    case "DM":
      P = (h + l + c) / 3;
      break;
    case "Camarilla":
      P = (h + l + c) / 3;
      break;
    default:
      P = (h + l + c) / 3;
  }
  levels[0] = P;
  switch (type) {
    case "Traditional":
    case "Classic":
      levels[1] = 2 * P - l;
      levels[2] = 2 * P - h;
      levels[3] = P + (h - l);
      levels[4] = P - (h - l);
      levels[5] = h + 2 * (P - l);
      levels[6] = l - 2 * (h - P);
      levels[7] = levels[5] + (h - l);
      levels[8] = levels[6] - (h - l);
      levels[9] = levels[7] + (h - l);
      levels[10] = levels[8] - (h - l);
      break;
    case "Fibonacci":
      levels[1] = P + 0.382 * (h - l);
      levels[2] = P - 0.382 * (h - l);
      levels[3] = P + 0.618 * (h - l);
      levels[4] = P - 0.618 * (h - l);
      levels[5] = P + (h - l);
      levels[6] = P - (h - l);
      levels[7] = levels[5] + 0.618 * (h - l);
      levels[8] = levels[6] - 0.618 * (h - l);
      levels[9] = levels[7] + 0.382 * (h - l);
      levels[10] = levels[8] - 0.382 * (h - l);
      break;
    case "Woodie":
      levels[1] = 2 * P - l;
      levels[2] = 2 * P - h;
      levels[3] = P + (h - l);
      levels[4] = P - (h - l);
      levels[5] = h + 2 * (P - l);
      levels[6] = l - 2 * (h - P);
      levels[7] = levels[5] + (h - l);
      levels[8] = levels[6] - (h - l);
      levels[9] = levels[7] + (h - l);
      levels[10] = levels[8] - (h - l);
      break;
    case "DM":
      const x = h + l + c * 2 + (isNaN(o) ? c : o);
      const newP = x / (isNaN(o) ? 4 : 5);
      levels[0] = newP;
      levels[1] = x / 2 - l;
      levels[2] = x / 2 - h;
      break;
    case "Camarilla":
      const range4 = h - l;
      levels[1] = c + range4 * 1.1 / 12;
      levels[2] = c - range4 * 1.1 / 12;
      levels[3] = c + range4 * 1.1 / 6;
      levels[4] = c - range4 * 1.1 / 6;
      levels[5] = c + range4 * 1.1 / 4;
      levels[6] = c - range4 * 1.1 / 4;
      levels[7] = c + range4 * 1.1 / 2;
      levels[8] = c - range4 * 1.1 / 2;
      levels[9] = h;
      levels[10] = l;
      break;
  }
  return levels;
}
function ichimoku(conversionPeriods, basePeriods, laggingSpan2Periods, displacement, high, low, close) {
  const length2 = high.length;
  const highestConversion = highest(high, conversionPeriods);
  const lowestConversion = lowest(low, conversionPeriods);
  const tenkanSen = [];
  for (let i = 0; i < length2; i++) {
    if (isNaN(highestConversion[i]) || isNaN(lowestConversion[i])) {
      tenkanSen.push(NaN);
    } else {
      tenkanSen.push((highestConversion[i] + lowestConversion[i]) / 2);
    }
  }
  const highestBase = highest(high, basePeriods);
  const lowestBase = lowest(low, basePeriods);
  const kijunSen = [];
  for (let i = 0; i < length2; i++) {
    if (isNaN(highestBase[i]) || isNaN(lowestBase[i])) {
      kijunSen.push(NaN);
    } else {
      kijunSen.push((highestBase[i] + lowestBase[i]) / 2);
    }
  }
  const senkouSpanA = [];
  for (let i = 0; i < length2; i++) {
    const sourceIndex = i - displacement;
    if (sourceIndex < 0 || isNaN(tenkanSen[sourceIndex]) || isNaN(kijunSen[sourceIndex])) {
      senkouSpanA.push(NaN);
    } else {
      senkouSpanA.push((tenkanSen[sourceIndex] + kijunSen[sourceIndex]) / 2);
    }
  }
  const highestLagging = highest(high, laggingSpan2Periods);
  const lowestLagging = lowest(low, laggingSpan2Periods);
  const senkouSpanB = [];
  for (let i = 0; i < length2; i++) {
    const sourceIndex = i - displacement;
    if (sourceIndex < 0 || isNaN(highestLagging[sourceIndex]) || isNaN(lowestLagging[sourceIndex])) {
      senkouSpanB.push(NaN);
    } else {
      senkouSpanB.push((highestLagging[sourceIndex] + lowestLagging[sourceIndex]) / 2);
    }
  }
  const chikouSpan = [];
  for (let i = 0; i < length2; i++) {
    const sourceIndex = i + displacement;
    if (sourceIndex >= length2 || isNaN(close[sourceIndex])) {
      chikouSpan.push(NaN);
    } else {
      chikouSpan.push(close[sourceIndex]);
    }
  }
  return [tenkanSen, kijunSen, senkouSpanA, senkouSpanB, chikouSpan];
}
function zigzag(deviation = 5, depth = 10, backstep = 3, source, high, low) {
  let highSource;
  let lowSource;
  if (high && low) {
    highSource = high;
    lowSource = low;
  } else if (source) {
    highSource = source;
    lowSource = source;
  } else {
    throw new Error(
      "ta.zigzag() requires either source series or high/low series. Either pass them explicitly or use createContext({ chart: { high, low, close } }) for implicit data."
    );
  }
  const length2 = highSource.length;
  if (lowSource.length !== length2) {
    throw new Error("ta.zigzag: high and low must have the same length");
  }
  const zigzagValues = new Array(length2).fill(NaN);
  const directions = new Array(length2).fill(0);
  const isPivot = new Array(length2).fill(false);
  const getDeviation = (price1, price2) => {
    if (Math.abs(price1) < 1e-10 || isNaN(price1) || isNaN(price2))
      return 0;
    return Math.abs((price2 - price1) / price1) * 100;
  };
  let lastConfirmedPivot = null;
  let potentialPivot = null;
  let currentDirection = 0;
  const confirmedPivots = [];
  let startIndex = -1;
  let initialHighest = -Infinity;
  let initialLowest = Infinity;
  let initialHighIndex = -1;
  let initialLowIndex = -1;
  for (let i = 0; i < Math.min(depth, length2); i++) {
    if (!isNaN(highSource[i]) && highSource[i] > initialHighest) {
      initialHighest = highSource[i];
      initialHighIndex = i;
    }
    if (!isNaN(lowSource[i]) && lowSource[i] < initialLowest) {
      initialLowest = lowSource[i];
      initialLowIndex = i;
    }
  }
  if (initialHighIndex >= 0 && initialLowIndex >= 0) {
    if (initialLowIndex <= initialHighIndex) {
      lastConfirmedPivot = { index: initialLowIndex, price: initialLowest, type: "low" };
      currentDirection = 1;
    } else {
      lastConfirmedPivot = { index: initialHighIndex, price: initialHighest, type: "high" };
      currentDirection = -1;
    }
    confirmedPivots.push(lastConfirmedPivot);
    startIndex = lastConfirmedPivot.index + 1;
  } else {
    startIndex = depth;
  }
  for (let i = Math.max(startIndex, depth); i < length2; i++) {
    const currentHigh = highSource[i];
    const currentLow = lowSource[i];
    if (isNaN(currentHigh) || isNaN(currentLow)) {
      directions[i] = currentDirection;
      continue;
    }
    let isPotentialHigh = true;
    for (let j = 1; j <= backstep && i - j >= 0; j++) {
      if (!isNaN(highSource[i - j]) && highSource[i - j] >= currentHigh) {
        isPotentialHigh = false;
        break;
      }
    }
    let isPotentialLow = true;
    for (let j = 1; j <= backstep && i - j >= 0; j++) {
      if (!isNaN(lowSource[i - j]) && lowSource[i - j] <= currentLow) {
        isPotentialLow = false;
        break;
      }
    }
    if (currentDirection === 1) {
      if (isPotentialHigh) {
        if (potentialPivot === null || potentialPivot.type !== "high") {
          if (lastConfirmedPivot && getDeviation(lastConfirmedPivot.price, currentHigh) >= deviation) {
            potentialPivot = { index: i, price: currentHigh, type: "high" };
          }
        } else {
          if (currentHigh > potentialPivot.price) {
            potentialPivot = { index: i, price: currentHigh, type: "high" };
          }
        }
      }
      if (potentialPivot && potentialPivot.type === "high") {
        const deviationFromPotential = getDeviation(potentialPivot.price, currentLow);
        if (deviationFromPotential >= deviation && i - potentialPivot.index >= backstep) {
          confirmedPivots.push(potentialPivot);
          lastConfirmedPivot = potentialPivot;
          currentDirection = -1;
          potentialPivot = null;
        }
      }
    } else if (currentDirection === -1) {
      if (isPotentialLow) {
        if (potentialPivot === null || potentialPivot.type !== "low") {
          if (lastConfirmedPivot && getDeviation(lastConfirmedPivot.price, currentLow) >= deviation) {
            potentialPivot = { index: i, price: currentLow, type: "low" };
          }
        } else {
          if (currentLow < potentialPivot.price) {
            potentialPivot = { index: i, price: currentLow, type: "low" };
          }
        }
      }
      if (potentialPivot && potentialPivot.type === "low") {
        const deviationFromPotential = getDeviation(potentialPivot.price, currentHigh);
        if (deviationFromPotential >= deviation && i - potentialPivot.index >= backstep) {
          confirmedPivots.push(potentialPivot);
          lastConfirmedPivot = potentialPivot;
          currentDirection = 1;
          potentialPivot = null;
        }
      }
    } else {
      if (lastConfirmedPivot) {
        if (lastConfirmedPivot.type === "low" && getDeviation(lastConfirmedPivot.price, currentHigh) >= deviation) {
          currentDirection = 1;
        } else if (lastConfirmedPivot.type === "high" && getDeviation(lastConfirmedPivot.price, currentLow) >= deviation) {
          currentDirection = -1;
        }
      }
    }
    directions[i] = currentDirection;
  }
  const lastPotentialWasAdded = potentialPivot !== null;
  if (potentialPivot) {
    confirmedPivots.push(potentialPivot);
  }
  for (const pivot of confirmedPivots) {
    zigzagValues[pivot.index] = pivot.price;
    isPivot[pivot.index] = true;
  }
  let currentDir = 0;
  let pivotIdx = 0;
  const numConfirmed = lastPotentialWasAdded ? confirmedPivots.length - 1 : confirmedPivots.length;
  for (let i = 0; i < length2; i++) {
    while (pivotIdx < numConfirmed && confirmedPivots[pivotIdx].index <= i) {
      const pivot = confirmedPivots[pivotIdx];
      currentDir = pivot.type === "low" ? 1 : -1;
      pivotIdx++;
    }
    directions[i] = currentDir;
  }
  return [zigzagValues, directions, isPivot];
}
var math_exports = {};
__export(math_exports, {
  abs: () => abs,
  acos: () => acos,
  asin: () => asin,
  atan: () => atan,
  avg: () => avg,
  ceil: () => ceil,
  cos: () => cos,
  e: () => e,
  exp: () => exp,
  floor: () => floor,
  log: () => log,
  log10: () => log10,
  max: () => max2,
  min: () => min2,
  phi: () => phi,
  pi: () => pi,
  pow: () => pow,
  random: () => random,
  round: () => round,
  round_to_mintick: () => round_to_mintick,
  rphi: () => rphi,
  sign: () => sign,
  sin: () => sin,
  sqrt: () => sqrt,
  sum: () => sum,
  tan: () => tan,
  todegrees: () => todegrees,
  toradians: () => toradians
});
var BarData = class _BarData {
  _bars;
  _version = 0;
  /**
   * Create a new BarData wrapper
   * @param bars - Initial bar data (defaults to empty array)
   */
  constructor(bars = []) {
    this._bars = bars;
  }
  /**
   * Get the current version number
   * Version increments whenever data is mutated
   */
  get version() {
    return this._version;
  }
  /**
   * Get the underlying bar array
   * Note: Direct mutations to this array will NOT increment version
   * Use the provided mutation methods instead
   */
  get bars() {
    return this._bars;
  }
  /**
   * Get the number of bars
   */
  get length() {
    return this._bars.length;
  }
  /**
   * Add a new bar to the end
   * @param bar - Bar to add
   */
  push(bar) {
    this._bars.push(bar);
    this._version++;
  }
  /**
   * Remove and return the last bar
   * @returns The removed bar, or undefined if empty
   */
  pop() {
    const bar = this._bars.pop();
    if (bar !== void 0) {
      this._version++;
    }
    return bar;
  }
  /**
   * Replace a bar at a specific index
   * @param index - Index to update
   * @param bar - New bar data
   */
  set(index, bar) {
    if (index >= 0 && index < this._bars.length) {
      this._bars[index] = bar;
      this._version++;
    }
  }
  /**
   * Update the last bar (useful for real-time/streaming updates)
   * @param bar - New bar data
   */
  updateLast(bar) {
    if (this._bars.length > 0) {
      this._bars[this._bars.length - 1] = bar;
      this._version++;
    }
  }
  /**
   * Replace all bars with new data
   * @param bars - New bar array
   */
  setAll(bars) {
    this._bars = bars;
    this._version++;
  }
  /**
   * Manually increment version (for advanced use cases)
   * Call this after direct mutations to the bars array
   */
  invalidate() {
    this._version++;
  }
  /**
   * Get a bar at a specific index
   * @param index - Bar index
   * @returns Bar at that index, or undefined
   */
  at(index) {
    return this._bars[index];
  }
  /**
   * Create a BarData from an existing Bar array
   * @param bars - Bar array
   * @returns New BarData instance
   */
  static from(bars) {
    return new _BarData(bars);
  }
};
var Series = class _Series {
  extractor;
  dataSource;
  cached = null;
  cachedVersion = -1;
  /**
   * Create a new Series
   *
   * @param data - Bar data (Bar[] or BarData)
   * @param extractor - Function to extract/compute value for each bar
   */
  constructor(data, extractor) {
    this.dataSource = data instanceof BarData ? data : new BarData(data);
    this.extractor = extractor;
  }
  /**
   * Get the underlying bar data
   * @returns Bar array
   */
  get bars() {
    return this.dataSource.bars;
  }
  /**
   * Get the underlying BarData source
   * @returns BarData instance
   */
  get barData() {
    return this.dataSource;
  }
  // ============================================
  // Static Factory Methods
  // ============================================
  /**
   * Create Series from bar data by extracting a specific field
   * @param bars - Bar data (Bar[] or BarData)
   * @param field - Field to extract ('open', 'high', 'low', 'close', 'volume')
   * @returns Series with extracted field values
   */
  static fromBars(bars, field) {
    return new _Series(bars, (bar) => bar[field] ?? NaN);
  }
  /**
   * Create a constant series (same value for all bars)
   * @param bars - Bar data (Bar[] or BarData)
   * @param value - Constant value
   * @returns Series with constant value
   */
  static constant(bars, value) {
    return new _Series(bars, () => value);
  }
  /**
   * Create series from array of values
   * @param bars - Bar data (Bar[] or BarData) for time alignment
   * @param values - Array of values
   * @returns Series
   */
  static fromArray(bars, values) {
    return new _Series(bars, (_bar, i) => values[i] ?? NaN);
  }
  // ============================================
  // Arithmetic Operations
  // ============================================
  /**
   * Add two series or a series and a number
   * @param other - Series or number to add
   * @returns New Series representing the sum
   */
  add(other) {
    return new _Series(this.dataSource, (bar, i, data) => {
      const a = this.extractor(bar, i, data);
      const b2 = typeof other === "number" ? other : other.extractor(bar, i, data);
      return a + b2;
    });
  }
  /**
   * Subtract two series or subtract a number from a series
   * @param other - Series or number to subtract
   * @returns New Series representing the difference
   */
  sub(other) {
    return new _Series(this.dataSource, (bar, i, data) => {
      const a = this.extractor(bar, i, data);
      const b2 = typeof other === "number" ? other : other.extractor(bar, i, data);
      return a - b2;
    });
  }
  /**
   * Multiply two series or a series by a number
   * @param other - Series or number to multiply
   * @returns New Series representing the product
   */
  mul(other) {
    return new _Series(this.dataSource, (bar, i, data) => {
      const a = this.extractor(bar, i, data);
      const b2 = typeof other === "number" ? other : other.extractor(bar, i, data);
      return a * b2;
    });
  }
  /**
   * Divide two series or a series by a number
   * @param other - Series or number to divide by
   * @returns New Series representing the quotient
   */
  div(other) {
    return new _Series(this.dataSource, (bar, i, data) => {
      const a = this.extractor(bar, i, data);
      const b2 = typeof other === "number" ? other : other.extractor(bar, i, data);
      return b2 !== 0 ? a / b2 : NaN;
    });
  }
  /**
   * Modulo operation
   * @param other - Series or number for modulo
   * @returns New Series representing the remainder
   */
  mod(other) {
    return new _Series(this.dataSource, (bar, i, data) => {
      const a = this.extractor(bar, i, data);
      const b2 = typeof other === "number" ? other : other.extractor(bar, i, data);
      return b2 !== 0 ? a % b2 : NaN;
    });
  }
  /**
   * Negation
   * @returns New Series with negated values
   */
  neg() {
    return new _Series(this.dataSource, (bar, i, data) => {
      return -this.extractor(bar, i, data);
    });
  }
  // ============================================
  // Comparison Operations
  // ============================================
  /**
   * Greater than comparison
   * @param other - Series or number to compare
   * @returns New Series with 1 where true, 0 where false
   */
  gt(other) {
    return new _Series(this.dataSource, (bar, i, data) => {
      const a = this.extractor(bar, i, data);
      const b2 = typeof other === "number" ? other : other.extractor(bar, i, data);
      return a > b2 ? 1 : 0;
    });
  }
  /**
   * Greater than or equal comparison
   * @param other - Series or number to compare
   * @returns New Series with 1 where true, 0 where false
   */
  gte(other) {
    return new _Series(this.dataSource, (bar, i, data) => {
      const a = this.extractor(bar, i, data);
      const b2 = typeof other === "number" ? other : other.extractor(bar, i, data);
      return a >= b2 ? 1 : 0;
    });
  }
  /**
   * Less than comparison
   * @param other - Series or number to compare
   * @returns New Series with 1 where true, 0 where false
   */
  lt(other) {
    return new _Series(this.dataSource, (bar, i, data) => {
      const a = this.extractor(bar, i, data);
      const b2 = typeof other === "number" ? other : other.extractor(bar, i, data);
      return a < b2 ? 1 : 0;
    });
  }
  /**
   * Less than or equal comparison
   * @param other - Series or number to compare
   * @returns New Series with 1 where true, 0 where false
   */
  lte(other) {
    return new _Series(this.dataSource, (bar, i, data) => {
      const a = this.extractor(bar, i, data);
      const b2 = typeof other === "number" ? other : other.extractor(bar, i, data);
      return a <= b2 ? 1 : 0;
    });
  }
  /**
   * Equality comparison
   * @param other - Series or number to compare
   * @returns New Series with 1 where true, 0 where false
   */
  eq(other) {
    return new _Series(this.dataSource, (bar, i, data) => {
      const a = this.extractor(bar, i, data);
      const b2 = typeof other === "number" ? other : other.extractor(bar, i, data);
      return a === b2 ? 1 : 0;
    });
  }
  /**
   * Not equal comparison
   * @param other - Series or number to compare
   * @returns New Series with 1 where true, 0 where false
   */
  neq(other) {
    return new _Series(this.dataSource, (bar, i, data) => {
      const a = this.extractor(bar, i, data);
      const b2 = typeof other === "number" ? other : other.extractor(bar, i, data);
      return a !== b2 ? 1 : 0;
    });
  }
  // ============================================
  // Logical Operations (for boolean series)
  // ============================================
  /**
   * Logical AND
   * @param other - Series or number (truthy/falsy)
   * @returns New Series with 1 where both true, 0 otherwise
   */
  and(other) {
    return new _Series(this.dataSource, (bar, i, data) => {
      const a = this.extractor(bar, i, data);
      const b2 = typeof other === "number" ? other : other.extractor(bar, i, data);
      return a && b2 ? 1 : 0;
    });
  }
  /**
   * Logical OR
   * @param other - Series or number (truthy/falsy)
   * @returns New Series with 1 where either true, 0 otherwise
   */
  or(other) {
    return new _Series(this.dataSource, (bar, i, data) => {
      const a = this.extractor(bar, i, data);
      const b2 = typeof other === "number" ? other : other.extractor(bar, i, data);
      return a || b2 ? 1 : 0;
    });
  }
  /**
   * Logical NOT
   * @returns New Series with inverted boolean values
   */
  not() {
    return new _Series(this.dataSource, (bar, i, data) => {
      const a = this.extractor(bar, i, data);
      return !a ? 1 : 0;
    });
  }
  // ============================================
  // Conditional Selection
  // ============================================
  /**
   * Bar-by-bar conditional selection (ternary operator for Series)
   * Uses this Series as the condition (truthy = nonzero, falsy = zero/NaN)
   *
   * @param trueValue - Value or Series to use when condition is truthy
   * @param falseValue - Value or Series to use when condition is falsy
   * @returns New Series with bar-by-bar selected values
   *
   * @example
   * ```typescript
   * // PineScript: result = condition ? trueVal : falseVal
   * const result = condition.iff(trueVal, falseVal);
   *
   * // Example: RSI formula uses ternary for edge cases
   * // rsi = down == 0 ? 100 : up == 0 ? 0 : formula
   * const rsi = down.eq(0).iff(100, up.eq(0).iff(0, formula));
   * ```
   */
  iff(trueValue, falseValue) {
    return new _Series(this.dataSource, (bar, i, data) => {
      const condition = this.extractor(bar, i, data);
      const isTruthy = condition !== 0 && !Number.isNaN(condition);
      if (isTruthy) {
        return typeof trueValue === "number" ? trueValue : trueValue.extractor(bar, i, data);
      } else {
        return typeof falseValue === "number" ? falseValue : falseValue.extractor(bar, i, data);
      }
    });
  }
  // ============================================
  // Offset/History
  // ============================================
  /**
   * Access previous bars (like close[1] in PineScript)
   * @param offset - Number of bars back (positive = past)
   * @returns New Series with offset values
   */
  offset(offset) {
    return new _Series(this.dataSource, (_bar, i, data) => {
      const targetIndex = i - offset;
      if (targetIndex < 0 || targetIndex >= data.length) {
        return NaN;
      }
      return this.extractor(data[targetIndex], targetIndex, data);
    });
  }
  // ============================================
  // Computation & Access
  // ============================================
  /**
   * Compute all values for the series
   * 
   * Now includes automatic cache invalidation:
   * - Checks if dataSource version has changed since cache was computed
   * - Recomputes if version mismatch detected
   * - Stores version when cache is created
   * 
   * @returns Array of computed values
   */
  toArray() {
    if (this.cached !== null && this.cachedVersion === this.dataSource.version) {
      return this.cached;
    }
    const bars = this.dataSource.bars;
    this.cached = bars.map((bar, i) => this.extractor(bar, i, bars));
    this.cachedVersion = this.dataSource.version;
    return this.cached;
  }
  /**
   * Materialize this Series by eagerly computing values and breaking closure chain
   * 
   * This method addresses the closure chain memory leak issue:
   * - Computes all values immediately
   * - Creates a new Series that stores values directly
   * - Breaks references to parent Series objects
   * - Useful for complex expressions to free intermediate Series memory
   * 
   * @example
   * ```typescript
   * // Without materialize: keeps a, b, c, d in memory via closures
   * const result = a.add(b).mul(c).div(d).sub(e);
   * 
   * // With materialize: breaks chain, frees a, b, c memory
   * const result = a.add(b).mul(c).materialize().div(d).sub(e);
   * ```
   * 
   * @returns New Series with computed values and no closure dependencies
   */
  materialize() {
    const values = this.toArray();
    const valuesCopy = [...values];
    return _Series.fromArray(this.dataSource, valuesCopy);
  }
  /**
   * Invalidate cache (when data changes)
   * 
   * Note: With BarData versioning, manual invalidation is rarely needed.
   * The cache is automatically invalidated when the underlying BarData changes.
   * This method is kept for backward compatibility and advanced use cases.
   * 
   * @internal
   */
  _invalidate() {
    this.cached = null;
    this.cachedVersion = -1;
  }
  /**
   * Compute all values (alias for toArray)
   * @returns Array of computed values
   * @internal
   */
  _compute() {
    return this.toArray();
  }
  /**
   * Get value at specific index
   * @param index - Bar index
   * @returns Value at that index
   */
  get(index) {
    const values = this.toArray();
    return values[index] ?? NaN;
  }
  /**
   * Get the last value (most recent bar)
   * @returns Most recent value
   */
  last() {
    const values = this.toArray();
    return values[values.length - 1] ?? NaN;
  }
  /**
   * Get number of values
   * @returns Length of series
   */
  length() {
    return this.dataSource.length;
  }
  /**
   * Convert series to time-value pairs for charting
   * @returns Array of { time, value } objects
   */
  toTimeValuePairs() {
    const values = this.toArray();
    const bars = this.dataSource.bars;
    return bars.map((bar, i) => ({
      time: bar.time,
      value: values[i]
    })).filter((point) => !Number.isNaN(point.value));
  }
};
function abs(value) {
  if (value instanceof Series) {
    const bars = value.bars;
    const valueArray = value.toArray();
    const length2 = bars.length;
    const result = [];
    for (let i = 0; i < length2; i++) {
      const v = valueArray[i] ?? NaN;
      result.push(Math.abs(v));
    }
    return Series.fromArray(bars, result);
  }
  return Math.abs(value);
}
function ceil(value) {
  if (value instanceof Series) {
    const bars = value.bars;
    const valueArray = value.toArray();
    const length2 = bars.length;
    const result = [];
    for (let i = 0; i < length2; i++) {
      const v = valueArray[i] ?? NaN;
      result.push(Math.ceil(v));
    }
    return Series.fromArray(bars, result);
  }
  return Math.ceil(value);
}
function floor(value) {
  if (value instanceof Series) {
    const bars = value.bars;
    const valueArray = value.toArray();
    const length2 = bars.length;
    const result = [];
    for (let i = 0; i < length2; i++) {
      const v = valueArray[i] ?? NaN;
      result.push(Math.floor(v));
    }
    return Series.fromArray(bars, result);
  }
  return Math.floor(value);
}
function round(value, precision) {
  if (value instanceof Series) {
    const bars = value.bars;
    const valueArray = value.toArray();
    const length2 = bars.length;
    const result = [];
    if (precision === void 0) {
      for (let i = 0; i < length2; i++) {
        const v = valueArray[i] ?? NaN;
        result.push(Math.round(v));
      }
    } else {
      const multiplier2 = Math.pow(10, precision);
      for (let i = 0; i < length2; i++) {
        const v = valueArray[i] ?? NaN;
        result.push(Math.round(v * multiplier2) / multiplier2);
      }
    }
    return Series.fromArray(bars, result);
  }
  if (precision === void 0) {
    return Math.round(value);
  }
  const multiplier = Math.pow(10, precision);
  return Math.round(value * multiplier) / multiplier;
}
function max2(...values) {
  const hasSeries = values.some((v) => v instanceof Series);
  if (!hasSeries) {
    return Math.max(...values);
  }
  const firstSeries = values.find((v) => v instanceof Series);
  const bars = firstSeries.bars;
  const length2 = bars.length;
  const valueArrays = values.map(
    (v) => v instanceof Series ? v.toArray() : null
  );
  const result = [];
  for (let i = 0; i < length2; i++) {
    const nums = values.map(
      (v, idx) => valueArrays[idx] ? valueArrays[idx][i] ?? NaN : v
    );
    result.push(Math.max(...nums));
  }
  return Series.fromArray(bars, result);
}
function min2(...values) {
  const hasSeries = values.some((v) => v instanceof Series);
  if (!hasSeries) {
    return Math.min(...values);
  }
  const firstSeries = values.find((v) => v instanceof Series);
  const bars = firstSeries.bars;
  const length2 = bars.length;
  const valueArrays = values.map(
    (v) => v instanceof Series ? v.toArray() : null
  );
  const result = [];
  for (let i = 0; i < length2; i++) {
    const nums = values.map(
      (v, idx) => valueArrays[idx] ? valueArrays[idx][i] ?? NaN : v
    );
    result.push(Math.min(...nums));
  }
  return Series.fromArray(bars, result);
}
function avg(...values) {
  const hasSeries = values.some((v) => v instanceof Series);
  if (!hasSeries) {
    return values.reduce((a, b2) => a + b2, 0) / values.length;
  }
  const firstSeries = values.find((v) => v instanceof Series);
  const bars = firstSeries.bars;
  const length2 = bars.length;
  const valueArrays = values.map(
    (v) => v instanceof Series ? v.toArray() : null
  );
  const result = [];
  for (let i = 0; i < length2; i++) {
    const nums = values.map(
      (v, idx) => valueArrays[idx] ? valueArrays[idx][i] ?? NaN : v
    );
    const sum4 = nums.reduce((a, b2) => a + b2, 0);
    result.push(sum4 / nums.length);
  }
  return Series.fromArray(bars, result);
}
function sum(source, length2) {
  const sourceArray = source instanceof Series ? source.toArray() : source;
  const result = [];
  for (let i = 0; i < sourceArray.length; i++) {
    if (i < length2 - 1) {
      result.push(NaN);
    } else {
      let total = 0;
      for (let j = 0; j < length2; j++) {
        total += sourceArray[i - j];
      }
      result.push(total);
    }
  }
  if (source instanceof Series) {
    return Series.fromArray(source.bars, result);
  }
  return result;
}
function sqrt(value) {
  if (value instanceof Series) {
    const bars = value.bars;
    const valueArray = value.toArray();
    const length2 = bars.length;
    const result = [];
    for (let i = 0; i < length2; i++) {
      const v = valueArray[i] ?? NaN;
      result.push(Math.sqrt(v));
    }
    return Series.fromArray(bars, result);
  }
  return Math.sqrt(value);
}
function pow(base, exponent) {
  const baseIsSeries = base instanceof Series;
  const expIsSeries = exponent instanceof Series;
  if (!baseIsSeries && !expIsSeries) {
    return Math.pow(base, exponent);
  }
  const bars = baseIsSeries ? base.bars : exponent.bars;
  const baseArray = baseIsSeries ? base.toArray() : null;
  const expArray = expIsSeries ? exponent.toArray() : null;
  const length2 = bars.length;
  const result = [];
  for (let i = 0; i < length2; i++) {
    const b2 = baseArray ? baseArray[i] ?? NaN : base;
    const e2 = expArray ? expArray[i] ?? NaN : exponent;
    result.push(Math.pow(b2, e2));
  }
  return Series.fromArray(bars, result);
}
function exp(value) {
  if (value instanceof Series) {
    const bars = value.bars;
    const valueArray = value.toArray();
    const length2 = bars.length;
    const result = [];
    for (let i = 0; i < length2; i++) {
      const v = valueArray[i] ?? NaN;
      result.push(Math.exp(v));
    }
    return Series.fromArray(bars, result);
  }
  return Math.exp(value);
}
function log(value) {
  if (value instanceof Series) {
    const bars = value.bars;
    const valueArray = value.toArray();
    const length2 = bars.length;
    const result = [];
    for (let i = 0; i < length2; i++) {
      const v = valueArray[i] ?? NaN;
      result.push(Math.log(v));
    }
    return Series.fromArray(bars, result);
  }
  return Math.log(value);
}
function log10(value) {
  if (value instanceof Series) {
    const bars = value.bars;
    const valueArray = value.toArray();
    const length2 = bars.length;
    const result = [];
    for (let i = 0; i < length2; i++) {
      const v = valueArray[i] ?? NaN;
      result.push(Math.log10(v));
    }
    return Series.fromArray(bars, result);
  }
  return Math.log10(value);
}
function sin(value) {
  if (value instanceof Series) {
    const bars = value.bars;
    const valueArray = value.toArray();
    const length2 = bars.length;
    const result = [];
    for (let i = 0; i < length2; i++) {
      const v = valueArray[i] ?? NaN;
      result.push(Math.sin(v));
    }
    return Series.fromArray(bars, result);
  }
  return Math.sin(value);
}
function cos(value) {
  if (value instanceof Series) {
    const bars = value.bars;
    const valueArray = value.toArray();
    const length2 = bars.length;
    const result = [];
    for (let i = 0; i < length2; i++) {
      const v = valueArray[i] ?? NaN;
      result.push(Math.cos(v));
    }
    return Series.fromArray(bars, result);
  }
  return Math.cos(value);
}
function tan(value) {
  if (value instanceof Series) {
    const bars = value.bars;
    const valueArray = value.toArray();
    const length2 = bars.length;
    const result = [];
    for (let i = 0; i < length2; i++) {
      const v = valueArray[i] ?? NaN;
      result.push(Math.tan(v));
    }
    return Series.fromArray(bars, result);
  }
  return Math.tan(value);
}
function asin(value) {
  if (value instanceof Series) {
    const bars = value.bars;
    const valueArray = value.toArray();
    const length2 = bars.length;
    const result = [];
    for (let i = 0; i < length2; i++) {
      const v = valueArray[i] ?? NaN;
      result.push(Math.asin(v));
    }
    return Series.fromArray(bars, result);
  }
  return Math.asin(value);
}
function acos(value) {
  if (value instanceof Series) {
    const bars = value.bars;
    const valueArray = value.toArray();
    const length2 = bars.length;
    const result = [];
    for (let i = 0; i < length2; i++) {
      const v = valueArray[i] ?? NaN;
      result.push(Math.acos(v));
    }
    return Series.fromArray(bars, result);
  }
  return Math.acos(value);
}
function atan(value) {
  if (value instanceof Series) {
    const bars = value.bars;
    const valueArray = value.toArray();
    const length2 = bars.length;
    const result = [];
    for (let i = 0; i < length2; i++) {
      const v = valueArray[i] ?? NaN;
      result.push(Math.atan(v));
    }
    return Series.fromArray(bars, result);
  }
  return Math.atan(value);
}
function toradians(degrees) {
  if (degrees instanceof Series) {
    const bars = degrees.bars;
    const valueArray = degrees.toArray();
    const length2 = bars.length;
    const result = [];
    for (let i = 0; i < length2; i++) {
      const v = valueArray[i] ?? NaN;
      result.push(v * (Math.PI / 180));
    }
    return Series.fromArray(bars, result);
  }
  return degrees * (Math.PI / 180);
}
function todegrees(radians) {
  if (radians instanceof Series) {
    const bars = radians.bars;
    const valueArray = radians.toArray();
    const length2 = bars.length;
    const result = [];
    for (let i = 0; i < length2; i++) {
      const v = valueArray[i] ?? NaN;
      result.push(v * (180 / Math.PI));
    }
    return Series.fromArray(bars, result);
  }
  return radians * (180 / Math.PI);
}
function random(min6, max6, _seed) {
  const rand = Math.random();
  if (min6 !== void 0 && max6 !== void 0) {
    return min6 + rand * (max6 - min6);
  }
  return rand;
}
function sign(value) {
  if (value instanceof Series) {
    const bars = value.bars;
    const valueArray = value.toArray();
    const length2 = bars.length;
    const result = [];
    for (let i = 0; i < length2; i++) {
      const v = valueArray[i] ?? NaN;
      result.push(v > 0 ? 1 : v < 0 ? -1 : 0);
    }
    return Series.fromArray(bars, result);
  }
  return value > 0 ? 1 : value < 0 ? -1 : 0;
}
function round_to_mintick(number, mintick) {
  if (number instanceof Series) {
    const bars = number.bars;
    const valueArray = number.toArray();
    const length2 = bars.length;
    if (mintick === void 0) {
      throw new Error(
        "math.round_to_mintick() requires mintick value. Either pass it explicitly or use createContext({ syminfo: { mintick } }) for implicit data."
      );
    }
    const result = [];
    if (mintick === 0) {
      for (let i = 0; i < length2; i++) {
        result.push(valueArray[i] ?? NaN);
      }
    } else {
      for (let i = 0; i < length2; i++) {
        const v = valueArray[i];
        if (v === void 0 || isNaN(v)) {
          result.push(NaN);
        } else {
          result.push(Math.round(v / mintick) * mintick);
        }
      }
    }
    return Series.fromArray(bars, result);
  }
  if (isNaN(number)) {
    return NaN;
  }
  if (mintick === void 0) {
    throw new Error(
      "math.round_to_mintick() requires mintick value. Either pass it explicitly or use createContext({ syminfo: { mintick } }) for implicit data."
    );
  }
  if (mintick === 0) {
    return number;
  }
  return Math.round(number / mintick) * mintick;
}
var pi = Math.PI;
var e = Math.E;
var phi = 1.618033988749895;
var rphi = 0.618033988749895;
var array_exports = {};
__export(array_exports, {
  abs: () => abs2,
  avg: () => avg2,
  binary_search: () => binary_search,
  binary_search_leftmost: () => binary_search_leftmost,
  binary_search_rightmost: () => binary_search_rightmost,
  clear: () => clear,
  concat: () => concat,
  copy: () => copy,
  covariance: () => covariance,
  every: () => every,
  fill: () => fill,
  first: () => first,
  from: () => from,
  get: () => get,
  includes: () => includes,
  indexof: () => indexof,
  insert: () => insert,
  join: () => join,
  last: () => last,
  lastindexof: () => lastindexof,
  max: () => max3,
  median: () => median2,
  min: () => min3,
  mode: () => mode2,
  new_array: () => new_array,
  new_bool: () => new_bool,
  new_box: () => new_box,
  new_color: () => new_color,
  new_float: () => new_float,
  new_int: () => new_int,
  new_label: () => new_label,
  new_line: () => new_line,
  new_linefill: () => new_linefill,
  new_string: () => new_string,
  newtype: () => newtype,
  percentile_linear_interpolation: () => percentile_linear_interpolation2,
  percentile_nearest_rank: () => percentile_nearest_rank2,
  percentrank: () => percentrank2,
  pop: () => pop,
  push: () => push,
  range: () => range2,
  remove: () => remove,
  reverse: () => reverse,
  set: () => set,
  shift: () => shift,
  size: () => size,
  slice: () => slice,
  some: () => some,
  sort: () => sort,
  sort_indices: () => sort_indices,
  standardize: () => standardize,
  stdev: () => stdev2,
  sum: () => sum2,
  unshift: () => unshift,
  variance: () => variance2
});
function new_array(size2 = 0, initial_value) {
  const arr = [];
  for (let i = 0; i < size2; i++) {
    arr.push(initial_value);
  }
  return arr;
}
function size(id) {
  return id.length;
}
function get(id, index) {
  return id[index];
}
function set(id, index, value) {
  id[index] = value;
}
function push(id, value) {
  id.push(value);
}
function pop(id) {
  return id.pop();
}
function unshift(id, value) {
  id.unshift(value);
}
function shift(id) {
  return id.shift();
}
function clear(id) {
  id.length = 0;
}
function insert(id, index, value) {
  id.splice(index, 0, value);
}
function remove(id, index) {
  return id.splice(index, 1)[0];
}
function includes(id, value) {
  return id.includes(value);
}
function indexof(id, value) {
  return id.indexOf(value);
}
function lastindexof(id, value) {
  return id.lastIndexOf(value);
}
function copy(id) {
  return [...id];
}
function concat(id1, id2) {
  return [...id1, ...id2];
}
function join(id, separator = ",") {
  return id.join(separator);
}
function reverse(id) {
  id.reverse();
}
function slice(id, index_from, index_to) {
  return id.slice(index_from, index_to);
}
function sort(id, order = "asc") {
  id.sort((a, b2) => {
    if (order === "asc") {
      return a - b2;
    } else {
      return b2 - a;
    }
  });
}
function sum2(id) {
  return id.reduce((acc, val) => acc + val, 0);
}
function avg2(id) {
  return sum2(id) / size(id);
}
function min3(id) {
  return Math.min(...id);
}
function max3(id) {
  return Math.max(...id);
}
function median2(id) {
  const sorted = [...id].sort((a, b2) => a - b2);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}
function mode2(id) {
  const frequency = /* @__PURE__ */ new Map();
  let maxFreq = 0;
  let mode5 = id[0];
  for (const val of id) {
    const freq = (frequency.get(val) || 0) + 1;
    frequency.set(val, freq);
    if (freq > maxFreq) {
      maxFreq = freq;
      mode5 = val;
    }
  }
  return mode5;
}
function stdev2(id) {
  const mean = avg2(id);
  const squareDiffs = id.map((value) => Math.pow(value - mean, 2));
  const avgSquareDiff = sum2(squareDiffs) / size(id);
  return Math.sqrt(avgSquareDiff);
}
function variance2(id) {
  const mean = avg2(id);
  const squareDiffs = id.map((value) => Math.pow(value - mean, 2));
  return sum2(squareDiffs) / size(id);
}
function fill(id, value, index_from = 0, index_to) {
  const end = index_to ?? id.length;
  for (let i = index_from; i < end; i++) {
    id[i] = value;
  }
}
function from(id) {
  return copy(id);
}
function first(id) {
  return id[0];
}
function last(id) {
  return id[id.length - 1];
}
function some(id, predicate) {
  return id.some(predicate);
}
function every(id, predicate) {
  return id.every(predicate);
}
function new_bool(size2 = 0, initial_value = false) {
  return new_array(size2, initial_value);
}
function new_float(size2 = 0, initial_value = NaN) {
  return new_array(size2, initial_value);
}
function new_int(size2 = 0, initial_value = NaN) {
  return new_array(size2, initial_value);
}
function new_string(size2 = 0, initial_value) {
  return new_array(size2, initial_value);
}
function new_color(size2 = 0, initial_value) {
  return new_array(size2, initial_value);
}
function new_line(size2 = 0, initial_value) {
  return new_array(size2, initial_value);
}
function new_box(size2 = 0, initial_value) {
  return new_array(size2, initial_value);
}
function new_label(size2 = 0, initial_value) {
  return new_array(size2, initial_value);
}
function new_linefill(size2 = 0, initial_value) {
  return new_array(size2, initial_value);
}
function abs2(id) {
  return id.map((x) => Math.abs(x));
}
function range2(id) {
  if (id.length === 0) {
    return NaN;
  }
  return max3(id) - min3(id);
}
function binary_search(id, val) {
  let left = 0;
  let right = id.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (id[mid] === val) {
      return mid;
    }
    if (id[mid] < val) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  return -1;
}
function binary_search_leftmost(id, val) {
  let left = 0;
  let right = id.length - 1;
  let result = -1;
  let found = false;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (id[mid] < val) {
      if (!found) {
        result = mid;
      }
      left = mid + 1;
    } else if (id[mid] === val) {
      result = mid;
      found = true;
      right = mid - 1;
    } else {
      right = mid - 1;
    }
  }
  return result;
}
function binary_search_rightmost(id, val) {
  let left = 0;
  let right = id.length - 1;
  let result = -1;
  let found = false;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (id[mid] <= val) {
      if (id[mid] === val) {
        result = mid;
        found = true;
      }
      left = mid + 1;
    } else {
      if (!found) {
        result = mid;
      }
      right = mid - 1;
    }
  }
  return result;
}
function covariance(id1, id2, biased = true) {
  if (id1.length === 0 || id2.length === 0) {
    return NaN;
  }
  if (id1.length !== id2.length) {
    return NaN;
  }
  const n = id1.length;
  const mean1 = avg2(id1);
  const mean2 = avg2(id2);
  let sum4 = 0;
  for (let i = 0; i < n; i++) {
    sum4 += (id1[i] - mean1) * (id2[i] - mean2);
  }
  const divisor = biased ? n : n - 1;
  return sum4 / divisor;
}
function percentile_linear_interpolation2(id, percentage) {
  if (id.length === 0) {
    return NaN;
  }
  const result = percentile_linear_interpolation(id, id.length, percentage);
  return result[result.length - 1];
}
function percentile_nearest_rank2(id, percentage) {
  if (id.length === 0) {
    return NaN;
  }
  const result = percentile_nearest_rank(id, id.length, percentage);
  return result[result.length - 1];
}
function percentrank2(id, index) {
  if (id.length === 0 || index < 0 || index >= id.length) {
    return NaN;
  }
  const value = id[index];
  if (isNaN(value)) {
    return NaN;
  }
  let count = 0;
  for (let i = 0; i < id.length; i++) {
    if (!isNaN(id[i]) && id[i] <= value) {
      count++;
    }
  }
  return count / id.length * 100;
}
function sort_indices(id, order = "asc") {
  const indices = Array.from({ length: id.length }, (_, i) => i);
  indices.sort((a, b2) => {
    if (order === "asc") {
      return id[a] - id[b2];
    } else {
      return id[b2] - id[a];
    }
  });
  return indices;
}
function standardize(id) {
  if (id.length === 0) {
    return [];
  }
  const mean = avg2(id);
  const stdDev = stdev2(id);
  if (stdDev === 0) {
    return id.map(() => NaN);
  }
  return id.map((value) => (value - mean) / stdDev);
}
function newtype(size2 = 0, initial_value) {
  return new_array(size2, initial_value);
}
var str_exports = {};
__export(str_exports, {
  charAt: () => charAt,
  concat: () => concat2,
  contains: () => contains,
  endswith: () => endswith,
  format: () => format,
  format_time: () => format_time,
  length: () => length,
  lower: () => lower,
  match: () => match,
  pos: () => pos,
  repeat: () => repeat,
  replace: () => replace,
  replace_all: () => replace_all,
  split: () => split,
  startswith: () => startswith,
  substring: () => substring,
  tonumber: () => tonumber,
  tostring: () => tostring,
  trim: () => trim,
  trimLeft: () => trimLeft,
  trimRight: () => trimRight,
  upper: () => upper
});
function length(str) {
  return str.length;
}
function tostring(value, format2) {
  if (typeof value === "number" && format2) {
    const decimals = format2.split(".")[1]?.length || 0;
    return value.toFixed(decimals);
  }
  return String(value);
}
function tonumber(str) {
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}
function substring(str, begin, end) {
  return str.substring(begin, end);
}
function upper(str) {
  return str.toUpperCase();
}
function lower(str) {
  return str.toLowerCase();
}
function contains(source, str) {
  return source.includes(str);
}
function pos(source, str) {
  return source.indexOf(str);
}
function replace(source, target, replacement, occurrence) {
  if (occurrence === 0) {
    return source.replace(target, replacement);
  } else {
    return source.replaceAll(target, replacement);
  }
}
function replace_all(source, target, replacement) {
  return source.replaceAll(target, replacement);
}
function split(str, separator) {
  return str.split(separator);
}
function concat2(...strings) {
  return strings.join("");
}
function format(formatStr, ...args) {
  let result = formatStr;
  args.forEach((arg, index) => {
    result = result.replaceAll(`{${index}}`, String(arg));
  });
  return result;
}
function startswith(source, str) {
  return source.startsWith(str);
}
function endswith(source, str) {
  return source.endsWith(str);
}
function charAt(str, pos2) {
  return str.charAt(pos2);
}
function trim(str) {
  return str.trim();
}
function trimLeft(str) {
  return str.trimStart();
}
function trimRight(str) {
  return str.trimEnd();
}
function match(source, regex) {
  return new RegExp(regex).test(source);
}
function repeat(source, count, separator = "") {
  if (source == null)
    return null;
  if (count <= 0)
    return "";
  return Array(count).fill(source).join(separator);
}
function format_time(time, format2) {
  const date = new Date(time);
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];
  const monthNamesShort = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();
  const pad = (num, len = 2) => num.toString().padStart(len, "0");
  const hours12 = hours % 12 || 12;
  const ampm = hours < 12 ? "AM" : "PM";
  const replacements = [
    // Year (process yyyy before yy)
    [/yyyy/g, year.toString()],
    [/yy/g, year.toString().slice(-2)],
    // Month (process MMMM before MMM before MM before M)
    [/MMMM/g, monthNames[month]],
    [/MMM/g, monthNamesShort[month]],
    [/MM/g, pad(month + 1)],
    [/M/g, (month + 1).toString()],
    // Day (process dd before d)
    [/dd/g, pad(day)],
    [/d/g, day.toString()],
    // Hours 24-hour (process HH before H)
    [/HH/g, pad(hours)],
    [/H/g, hours.toString()],
    // Hours 12-hour (process hh before h)
    [/hh/g, pad(hours12)],
    [/h/g, hours12.toString()],
    // Minutes (process mm before m)
    [/mm/g, pad(minutes)],
    [/m/g, minutes.toString()],
    // Seconds (process ss before s)
    [/ss/g, pad(seconds)],
    [/s/g, seconds.toString()],
    // AM/PM
    [/a/g, ampm]
  ];
  let result = format2;
  const tokens = [];
  replacements.forEach(([pattern, value], index) => {
    const token = `￰${index}￱`;
    result = result.replace(pattern, token);
    tokens[index] = value;
  });
  tokens.forEach((value, index) => {
    const token = `￰${index}￱`;
    result = result.replaceAll(token, value);
  });
  return result;
}
var color_exports = {};
__export(color_exports, {
  aqua: () => aqua,
  b: () => b,
  black: () => black,
  blue: () => blue,
  from_gradient: () => from_gradient,
  from_hex: () => from_hex,
  fuchsia: () => fuchsia,
  g: () => g,
  gray: () => gray,
  green: () => green,
  lime: () => lime,
  maroon: () => maroon,
  navy: () => navy,
  new: () => new_color2,
  new_color: () => new_color2,
  olive: () => olive,
  orange: () => orange,
  purple: () => purple,
  r: () => r,
  red: () => red,
  rgb: () => rgb,
  silver: () => silver,
  t: () => t,
  teal: () => teal,
  white: () => white,
  yellow: () => yellow
});
function rgb(red2, green2, blue2, transp) {
  const r2 = Math.max(0, Math.min(255, red2));
  const g2 = Math.max(0, Math.min(255, green2));
  const b2 = Math.max(0, Math.min(255, blue2));
  const a = transp !== void 0 ? 1 - transp / 100 : 1;
  if (a === 1) {
    return `rgb(${r2}, ${g2}, ${b2})`;
  }
  return `rgba(${r2}, ${g2}, ${b2}, ${a})`;
}
function from_hex(hex, transp) {
  hex = hex.replace("#", "");
  const r2 = parseInt(hex.substring(0, 2), 16);
  const g2 = parseInt(hex.substring(2, 4), 16);
  const b2 = parseInt(hex.substring(4, 6), 16);
  return rgb(r2, g2, b2, transp);
}
function new_color2(baseColor, transp) {
  const rgba = parseColor(baseColor);
  return rgb(rgba.r, rgba.g, rgba.b, transp);
}
function r(clr) {
  return parseColor(clr).r;
}
function g(clr) {
  return parseColor(clr).g;
}
function b(clr) {
  return parseColor(clr).b;
}
function t(clr) {
  return parseColor(clr).t;
}
function parseColor(clr) {
  if (typeof clr === "string") {
    const match2 = clr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match2) {
      return {
        r: parseInt(match2[1]),
        g: parseInt(match2[2]),
        b: parseInt(match2[3]),
        t: match2[4] ? (1 - parseFloat(match2[4])) * 100 : 0
      };
    }
  }
  return { r: 0, g: 0, b: 0, t: 0 };
}
var aqua = "#00FFFF";
var black = "#000000";
var blue = "#0000FF";
var fuchsia = "#FF00FF";
var gray = "#808080";
var green = "#00FF00";
var lime = "#00FF00";
var maroon = "#800000";
var navy = "#000080";
var olive = "#808000";
var orange = "#FFA500";
var purple = "#800080";
var red = "#FF0000";
var silver = "#C0C0C0";
var teal = "#008080";
var white = "#FFFFFF";
var yellow = "#FFFF00";
function from_gradient(value, bottom_value, top_value, bottom_color, top_color) {
  const parseColor2 = (col2) => {
    if (typeof col2 === "string") {
      if (col2.startsWith("#")) {
        const hex = col2.slice(1);
        const r4 = parseInt(hex.slice(0, 2), 16);
        const g4 = parseInt(hex.slice(2, 4), 16);
        const b4 = parseInt(hex.slice(4, 6), 16);
        return [r4, g4, b4, 1];
      }
      const match2 = col2.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (match2) {
        return [
          parseInt(match2[1]),
          parseInt(match2[2]),
          parseInt(match2[3]),
          match2[4] ? parseFloat(match2[4]) : 1
        ];
      }
    }
    return [0, 0, 0, 1];
  };
  const [r1, g1, b1, a1] = parseColor2(bottom_color);
  const [r2, g2, b2, a2] = parseColor2(top_color);
  let t2;
  if (value <= bottom_value) {
    t2 = 0;
  } else if (value >= top_value) {
    t2 = 1;
  } else {
    t2 = (value - bottom_value) / (top_value - bottom_value);
  }
  const r3 = Math.round(r1 + (r2 - r1) * t2);
  const g3 = Math.round(g1 + (g2 - g1) * t2);
  const b3 = Math.round(b1 + (b2 - b1) * t2);
  const a = a1 + (a2 - a1) * t2;
  if (a === 1) {
    return `rgb(${r3}, ${g3}, ${b3})`;
  }
  return `rgba(${r3}, ${g3}, ${b3}, ${a})`;
}
var time_exports = {};
__export(time_exports, {
  now: () => now,
  timestamp: () => timestamp
});
function now() {
  return Date.now();
}
function timestamp(year, month, day, hour, minute, second) {
  return new Date(
    year,
    month - 1,
    day,
    hour || 0,
    minute || 0,
    second || 0
  ).getTime();
}
var matrix_exports = {};
__export(matrix_exports, {
  add_col: () => add_col,
  add_row: () => add_row,
  avg: () => avg3,
  col: () => col,
  columns: () => columns,
  concat: () => concat3,
  copy: () => copy2,
  det: () => det,
  diff: () => diff,
  eigenvalues: () => eigenvalues,
  eigenvectors: () => eigenvectors,
  elements_count: () => elements_count,
  fill: () => fill2,
  get: () => get2,
  inv: () => inv,
  is_antidiagonal: () => is_antidiagonal,
  is_antisymmetric: () => is_antisymmetric,
  is_binary: () => is_binary,
  is_diagonal: () => is_diagonal,
  is_identity: () => is_identity,
  is_square: () => is_square,
  is_stochastic: () => is_stochastic,
  is_symmetric: () => is_symmetric,
  is_triangular: () => is_triangular,
  is_zero: () => is_zero,
  kron: () => kron,
  max: () => max4,
  median: () => median3,
  min: () => min4,
  mode: () => mode3,
  mult: () => mult,
  new_matrix: () => new_matrix,
  newtype: () => newtype2,
  pinv: () => pinv,
  pow: () => pow2,
  rank: () => rank,
  remove_col: () => remove_col,
  remove_row: () => remove_row,
  reshape: () => reshape,
  reverse: () => reverse2,
  row: () => row,
  rows: () => rows,
  set: () => set2,
  sort: () => sort2,
  submatrix: () => submatrix,
  sum: () => sum3,
  swap_columns: () => swap_columns,
  swap_rows: () => swap_rows,
  trace: () => trace,
  transpose: () => transpose
});
function new_matrix(rows2, columns2, initial_value) {
  const data = [];
  for (let i = 0; i < rows2; i++) {
    const row2 = [];
    for (let j = 0; j < columns2; j++) {
      row2.push(initial_value);
    }
    data.push(row2);
  }
  return { rows: rows2, columns: columns2, data };
}
function get2(id, row2, column) {
  if (row2 < 0 || row2 >= id.rows || column < 0 || column >= id.columns) {
    throw new Error(`Matrix index out of bounds: [${row2}, ${column}] for matrix of size [${id.rows}, ${id.columns}]`);
  }
  return id.data[row2][column];
}
function set2(id, row2, column, value) {
  if (row2 < 0 || row2 >= id.rows || column < 0 || column >= id.columns) {
    throw new Error(`Matrix index out of bounds: [${row2}, ${column}] for matrix of size [${id.rows}, ${id.columns}]`);
  }
  id.data[row2][column] = value;
}
function rows(id) {
  return id.rows;
}
function columns(id) {
  return id.columns;
}
function elements_count(id) {
  return id.rows * id.columns;
}
function row(id, row_index) {
  if (row_index < 0 || row_index >= id.rows) {
    throw new Error(`Row index out of bounds: ${row_index} for matrix with ${id.rows} rows`);
  }
  return [...id.data[row_index]];
}
function col(id, column_index) {
  if (column_index < 0 || column_index >= id.columns) {
    throw new Error(`Column index out of bounds: ${column_index} for matrix with ${id.columns} columns`);
  }
  return id.data.map((r2) => r2[column_index]);
}
function copy2(id) {
  const newData = id.data.map((r2) => [...r2]);
  return {
    rows: id.rows,
    columns: id.columns,
    data: newData
  };
}
function fill2(id, value, from_row = 0, to_row, from_column = 0, to_column) {
  const endRow = to_row ?? id.rows;
  const endCol = to_column ?? id.columns;
  for (let i = from_row; i < endRow; i++) {
    for (let j = from_column; j < endCol; j++) {
      id.data[i][j] = value;
    }
  }
}
function is_square(id) {
  return id.rows === id.columns;
}
function is_zero(id) {
  for (let i = 0; i < id.rows; i++) {
    for (let j = 0; j < id.columns; j++) {
      if (id.data[i][j] !== 0) {
        return false;
      }
    }
  }
  return true;
}
function is_binary(id) {
  for (let i = 0; i < id.rows; i++) {
    for (let j = 0; j < id.columns; j++) {
      const val = id.data[i][j];
      if (val !== 0 && val !== 1) {
        return false;
      }
    }
  }
  return true;
}
function add_row(id, row2, array_id) {
  const insertIndex = row2 ?? id.rows;
  if (insertIndex < 0 || insertIndex > id.rows) {
    throw new Error(`Row index out of bounds: ${insertIndex} for matrix with ${id.rows} rows`);
  }
  let newRow;
  if (array_id !== void 0) {
    if (id.columns > 0 && array_id.length !== id.columns) {
      throw new Error(`Array size ${array_id.length} does not match matrix columns ${id.columns}`);
    }
    newRow = [...array_id];
    if (id.rows === 0 && id.columns === 0) {
      id.columns = array_id.length;
    }
  } else {
    newRow = new Array(id.columns).fill(void 0);
  }
  id.data.splice(insertIndex, 0, newRow);
  id.rows++;
}
function add_col(id, column, array_id) {
  const insertIndex = column ?? id.columns;
  if (insertIndex < 0 || insertIndex > id.columns) {
    throw new Error(`Column index out of bounds: ${insertIndex} for matrix with ${id.columns} columns`);
  }
  if (array_id !== void 0) {
    if (id.rows > 0 && array_id.length !== id.rows) {
      throw new Error(`Array size ${array_id.length} does not match matrix rows ${id.rows}`);
    }
    if (id.rows === 0 && id.columns === 0) {
      id.rows = array_id.length;
      for (let i = 0; i < array_id.length; i++) {
        id.data.push([]);
      }
    }
    for (let i = 0; i < id.rows; i++) {
      id.data[i].splice(insertIndex, 0, array_id[i]);
    }
  } else {
    for (let i = 0; i < id.rows; i++) {
      id.data[i].splice(insertIndex, 0, void 0);
    }
  }
  id.columns++;
}
function remove_row(id, row2) {
  const removeIndex = row2 ?? id.rows - 1;
  if (removeIndex < 0 || removeIndex >= id.rows) {
    throw new Error(`Row index out of bounds: ${removeIndex} for matrix with ${id.rows} rows`);
  }
  const removedRow = id.data.splice(removeIndex, 1)[0];
  id.rows--;
  return removedRow;
}
function remove_col(id, column) {
  const removeIndex = column ?? id.columns - 1;
  if (removeIndex < 0 || removeIndex >= id.columns) {
    throw new Error(`Column index out of bounds: ${removeIndex} for matrix with ${id.columns} columns`);
  }
  const removedCol = [];
  for (let i = 0; i < id.rows; i++) {
    removedCol.push(id.data[i].splice(removeIndex, 1)[0]);
  }
  id.columns--;
  return removedCol;
}
function swap_rows(id, row1, row2) {
  if (row1 < 0 || row1 >= id.rows) {
    throw new Error(`Row1 index out of bounds: ${row1} for matrix with ${id.rows} rows`);
  }
  if (row2 < 0 || row2 >= id.rows) {
    throw new Error(`Row2 index out of bounds: ${row2} for matrix with ${id.rows} rows`);
  }
  const temp = id.data[row1];
  id.data[row1] = id.data[row2];
  id.data[row2] = temp;
}
function swap_columns(id, column1, column2) {
  if (column1 < 0 || column1 >= id.columns) {
    throw new Error(`Column1 index out of bounds: ${column1} for matrix with ${id.columns} columns`);
  }
  if (column2 < 0 || column2 >= id.columns) {
    throw new Error(`Column2 index out of bounds: ${column2} for matrix with ${id.columns} columns`);
  }
  for (let i = 0; i < id.rows; i++) {
    const temp = id.data[i][column1];
    id.data[i][column1] = id.data[i][column2];
    id.data[i][column2] = temp;
  }
}
function transpose(id) {
  const newData = [];
  for (let j = 0; j < id.columns; j++) {
    const newRow = [];
    for (let i = 0; i < id.rows; i++) {
      newRow.push(id.data[i][j]);
    }
    newData.push(newRow);
  }
  return {
    rows: id.columns,
    columns: id.rows,
    data: newData
  };
}
function concat3(id1, id2) {
  if (id1.columns !== id2.columns) {
    throw new Error(`Column count mismatch: ${id1.columns} vs ${id2.columns}`);
  }
  for (let i = 0; i < id2.rows; i++) {
    id1.data.push([...id2.data[i]]);
  }
  id1.rows += id2.rows;
  return id1;
}
function submatrix(id, from_row = 0, to_row, from_column = 0, to_column) {
  const endRow = to_row ?? id.rows;
  const endCol = to_column ?? id.columns;
  if (from_row < 0 || from_row > id.rows) {
    throw new Error(`from_row index out of bounds: ${from_row}`);
  }
  if (endRow < 0 || endRow > id.rows) {
    throw new Error(`to_row index out of bounds: ${endRow}`);
  }
  if (from_column < 0 || from_column > id.columns) {
    throw new Error(`from_column index out of bounds: ${from_column}`);
  }
  if (endCol < 0 || endCol > id.columns) {
    throw new Error(`to_column index out of bounds: ${endCol}`);
  }
  const newRows = endRow - from_row;
  const newCols = endCol - from_column;
  const newData = [];
  for (let i = from_row; i < endRow; i++) {
    const newRow = [];
    for (let j = from_column; j < endCol; j++) {
      newRow.push(id.data[i][j]);
    }
    newData.push(newRow);
  }
  return {
    rows: newRows,
    columns: newCols,
    data: newData
  };
}
function reshape(id, rows2, columns2) {
  const totalElements = id.rows * id.columns;
  const newTotalElements = rows2 * columns2;
  if (totalElements !== newTotalElements) {
    throw new Error(`Cannot reshape ${id.rows}x${id.columns} (${totalElements} elements) to ${rows2}x${columns2} (${newTotalElements} elements)`);
  }
  const flat = [];
  for (let i = 0; i < id.rows; i++) {
    for (let j = 0; j < id.columns; j++) {
      flat.push(id.data[i][j]);
    }
  }
  const newData = [];
  let index = 0;
  for (let i = 0; i < rows2; i++) {
    const newRow = [];
    for (let j = 0; j < columns2; j++) {
      newRow.push(flat[index++]);
    }
    newData.push(newRow);
  }
  id.rows = rows2;
  id.columns = columns2;
  id.data = newData;
}
function reverse2(id) {
  id.data.reverse();
  for (let i = 0; i < id.rows; i++) {
    id.data[i].reverse();
  }
}
function sort2(id, column = 0, order = "ascending") {
  if (column < 0 || column >= id.columns) {
    throw new Error(`Column index out of bounds: ${column} for matrix with ${id.columns} columns`);
  }
  id.data.sort((a, b2) => {
    const valA = a[column];
    const valB = b2[column];
    if (typeof valA === "number" && typeof valB === "number") {
      return order === "ascending" ? valA - valB : valB - valA;
    }
    if (order === "ascending") {
      return valA < valB ? -1 : valA > valB ? 1 : 0;
    } else {
      return valB < valA ? -1 : valB > valA ? 1 : 0;
    }
  });
}
function sum3(id1, id2) {
  const newData = [];
  if (typeof id2 === "number") {
    for (let i = 0; i < id1.rows; i++) {
      const newRow = [];
      for (let j = 0; j < id1.columns; j++) {
        newRow.push(id1.data[i][j] + id2);
      }
      newData.push(newRow);
    }
    return {
      rows: id1.rows,
      columns: id1.columns,
      data: newData
    };
  } else {
    if (id1.rows !== id2.rows || id1.columns !== id2.columns) {
      throw new Error(`Matrix dimensions must match: ${id1.rows}x${id1.columns} vs ${id2.rows}x${id2.columns}`);
    }
    for (let i = 0; i < id1.rows; i++) {
      const newRow = [];
      for (let j = 0; j < id1.columns; j++) {
        newRow.push(id1.data[i][j] + id2.data[i][j]);
      }
      newData.push(newRow);
    }
    return {
      rows: id1.rows,
      columns: id1.columns,
      data: newData
    };
  }
}
function diff(id1, id2) {
  const newData = [];
  if (typeof id2 === "number") {
    for (let i = 0; i < id1.rows; i++) {
      const newRow = [];
      for (let j = 0; j < id1.columns; j++) {
        newRow.push(id1.data[i][j] - id2);
      }
      newData.push(newRow);
    }
    return {
      rows: id1.rows,
      columns: id1.columns,
      data: newData
    };
  } else {
    if (id1.rows !== id2.rows || id1.columns !== id2.columns) {
      throw new Error(`Matrix dimensions must match: ${id1.rows}x${id1.columns} vs ${id2.rows}x${id2.columns}`);
    }
    for (let i = 0; i < id1.rows; i++) {
      const newRow = [];
      for (let j = 0; j < id1.columns; j++) {
        newRow.push(id1.data[i][j] - id2.data[i][j]);
      }
      newData.push(newRow);
    }
    return {
      rows: id1.rows,
      columns: id1.columns,
      data: newData
    };
  }
}
function avg3(id) {
  if (id.rows === 0 || id.columns === 0) {
    return NaN;
  }
  let total = 0;
  let count = 0;
  for (let i = 0; i < id.rows; i++) {
    for (let j = 0; j < id.columns; j++) {
      const val = id.data[i][j];
      if (val !== null && val !== void 0 && !isNaN(val)) {
        total += val;
        count++;
      }
    }
  }
  return count === 0 ? NaN : total / count;
}
function min4(id) {
  if (id.rows === 0 || id.columns === 0) {
    return NaN;
  }
  let minVal = Infinity;
  for (let i = 0; i < id.rows; i++) {
    for (let j = 0; j < id.columns; j++) {
      const val = id.data[i][j];
      if (val !== null && val !== void 0 && !isNaN(val) && val < minVal) {
        minVal = val;
      }
    }
  }
  return minVal === Infinity ? NaN : minVal;
}
function max4(id) {
  if (id.rows === 0 || id.columns === 0) {
    return NaN;
  }
  let maxVal = -Infinity;
  for (let i = 0; i < id.rows; i++) {
    for (let j = 0; j < id.columns; j++) {
      const val = id.data[i][j];
      if (val !== null && val !== void 0 && !isNaN(val) && val > maxVal) {
        maxVal = val;
      }
    }
  }
  return maxVal === -Infinity ? NaN : maxVal;
}
function median3(id) {
  if (id.rows === 0 || id.columns === 0) {
    return NaN;
  }
  const values = [];
  for (let i = 0; i < id.rows; i++) {
    for (let j = 0; j < id.columns; j++) {
      const val = id.data[i][j];
      if (val !== null && val !== void 0 && !isNaN(val)) {
        values.push(val);
      }
    }
  }
  if (values.length === 0) {
    return NaN;
  }
  values.sort((a, b2) => a - b2);
  const mid = Math.floor(values.length / 2);
  if (values.length % 2 === 0) {
    return (values[mid - 1] + values[mid]) / 2;
  } else {
    return values[mid];
  }
}
function mode3(id) {
  if (id.rows === 0 || id.columns === 0) {
    return NaN;
  }
  const frequency = /* @__PURE__ */ new Map();
  let maxFreq = 0;
  let modeValue = NaN;
  for (let i = 0; i < id.rows; i++) {
    for (let j = 0; j < id.columns; j++) {
      const val = id.data[i][j];
      if (val !== null && val !== void 0 && !isNaN(val)) {
        const freq = (frequency.get(val) || 0) + 1;
        frequency.set(val, freq);
        if (freq > maxFreq || freq === maxFreq && val < modeValue) {
          maxFreq = freq;
          modeValue = val;
        }
      }
    }
  }
  return modeValue;
}
function trace(id) {
  if (!is_square(id)) {
    throw new Error(`Matrix must be square for trace calculation: ${id.rows}x${id.columns}`);
  }
  if (id.rows === 0) {
    return 0;
  }
  let sum4 = 0;
  for (let i = 0; i < id.rows; i++) {
    const val = id.data[i][i];
    if (val !== null && val !== void 0 && !isNaN(val)) {
      sum4 += val;
    }
  }
  return sum4;
}
function is_diagonal(id) {
  if (!is_square(id)) {
    return false;
  }
  for (let i = 0; i < id.rows; i++) {
    for (let j = 0; j < id.columns; j++) {
      if (i !== j && id.data[i][j] !== 0) {
        return false;
      }
    }
  }
  return true;
}
function is_identity(id) {
  if (!is_square(id)) {
    return false;
  }
  for (let i = 0; i < id.rows; i++) {
    for (let j = 0; j < id.columns; j++) {
      const val = id.data[i][j];
      if (i === j) {
        if (val !== 1) {
          return false;
        }
      } else {
        if (val !== 0) {
          return false;
        }
      }
    }
  }
  return true;
}
function is_symmetric(id) {
  if (!is_square(id)) {
    return false;
  }
  for (let i = 0; i < id.rows; i++) {
    for (let j = i + 1; j < id.columns; j++) {
      if (id.data[i][j] !== id.data[j][i]) {
        return false;
      }
    }
  }
  return true;
}
function is_antisymmetric(id) {
  if (!is_square(id)) {
    return false;
  }
  for (let i = 0; i < id.rows; i++) {
    if (id.data[i][i] !== 0) {
      return false;
    }
    for (let j = i + 1; j < id.columns; j++) {
      const upperVal = id.data[i][j];
      const lowerVal = id.data[j][i];
      if (upperVal !== -lowerVal) {
        return false;
      }
    }
  }
  return true;
}
function is_triangular(id) {
  if (!is_square(id)) {
    return false;
  }
  let isUpper = true;
  for (let i = 1; i < id.rows && isUpper; i++) {
    for (let j = 0; j < i && isUpper; j++) {
      if (id.data[i][j] !== 0) {
        isUpper = false;
      }
    }
  }
  if (isUpper) {
    return true;
  }
  let isLower = true;
  for (let i = 0; i < id.rows - 1 && isLower; i++) {
    for (let j = i + 1; j < id.columns && isLower; j++) {
      if (id.data[i][j] !== 0) {
        isLower = false;
      }
    }
  }
  return isLower;
}
function is_antidiagonal(id) {
  if (!is_square(id)) {
    return false;
  }
  const n = id.rows;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const isAntiDiag = i + j === n - 1;
      if (!isAntiDiag && id.data[i][j] !== 0) {
        return false;
      }
    }
  }
  return true;
}
function is_stochastic(id) {
  if (id.rows === 0 || id.columns === 0) {
    return false;
  }
  const tolerance = 1e-10;
  for (let i = 0; i < id.rows; i++) {
    let rowSum = 0;
    for (let j = 0; j < id.columns; j++) {
      const val = id.data[i][j];
      if (val < 0) {
        return false;
      }
      rowSum += val;
    }
    if (Math.abs(rowSum - 1) > tolerance) {
      return false;
    }
  }
  return true;
}
var EPSILON = 1e-10;
function createIdentity(n) {
  const m = new_matrix(n, n, 0);
  for (let i = 0; i < n; i++) {
    m.data[i][i] = 1;
  }
  return m;
}
function mult(id1, id2) {
  if (typeof id2 === "number") {
    const newData2 = [];
    for (let i = 0; i < id1.rows; i++) {
      const newRow = [];
      for (let j = 0; j < id1.columns; j++) {
        newRow.push(id1.data[i][j] * id2);
      }
      newData2.push(newRow);
    }
    return {
      rows: id1.rows,
      columns: id1.columns,
      data: newData2
    };
  }
  if (Array.isArray(id2) && !("rows" in id2)) {
    const vec = id2;
    if (vec.length !== id1.columns) {
      throw new Error(`Vector length ${vec.length} must equal matrix columns ${id1.columns}`);
    }
    const result = [];
    for (let i = 0; i < id1.rows; i++) {
      let sum4 = 0;
      for (let j = 0; j < id1.columns; j++) {
        sum4 += id1.data[i][j] * vec[j];
      }
      result.push(sum4);
    }
    return result;
  }
  const m2 = id2;
  if (id1.columns !== m2.rows) {
    throw new Error(`Matrix multiplication dimension mismatch: ${id1.rows}x${id1.columns} × ${m2.rows}x${m2.columns}. First matrix columns (${id1.columns}) must equal second matrix rows (${m2.rows})`);
  }
  const newRows = id1.rows;
  const newCols = m2.columns;
  const newData = [];
  for (let i = 0; i < newRows; i++) {
    const newRow = [];
    for (let j = 0; j < newCols; j++) {
      let sum4 = 0;
      for (let k = 0; k < id1.columns; k++) {
        sum4 += id1.data[i][k] * m2.data[k][j];
      }
      newRow.push(sum4);
    }
    newData.push(newRow);
  }
  return {
    rows: newRows,
    columns: newCols,
    data: newData
  };
}
function pow2(id, power) {
  if (!is_square(id)) {
    throw new Error(`Matrix must be square for power calculation: ${id.rows}x${id.columns}`);
  }
  const n = id.rows;
  if (power === 0) {
    return createIdentity(n);
  }
  let base;
  let p = power;
  if (power < 0) {
    const inverse = inv(id);
    if (inverse === null) {
      throw new Error("Cannot compute negative power of singular matrix");
    }
    base = inverse;
    p = -power;
  } else {
    base = copy2(id);
  }
  let result = createIdentity(n);
  while (p > 0) {
    if (p % 2 === 1) {
      result = mult(result, base);
    }
    base = mult(base, base);
    p = Math.floor(p / 2);
  }
  return result;
}
function det(id) {
  if (!is_square(id)) {
    throw new Error(`Matrix must be square for determinant calculation: ${id.rows}x${id.columns}`);
  }
  const n = id.rows;
  if (n === 0) {
    return 1;
  }
  if (n === 1) {
    return id.data[0][0];
  }
  if (n === 2) {
    return id.data[0][0] * id.data[1][1] - id.data[0][1] * id.data[1][0];
  }
  const a = id.data.map((row2) => [...row2]);
  let determinant = 1;
  let swapCount = 0;
  for (let col2 = 0; col2 < n; col2++) {
    let maxRow = col2;
    let maxVal = Math.abs(a[col2][col2]);
    for (let row2 = col2 + 1; row2 < n; row2++) {
      const absVal = Math.abs(a[row2][col2]);
      if (absVal > maxVal) {
        maxVal = absVal;
        maxRow = row2;
      }
    }
    if (maxRow !== col2) {
      const temp = a[col2];
      a[col2] = a[maxRow];
      a[maxRow] = temp;
      swapCount++;
    }
    const pivot = a[col2][col2];
    if (Math.abs(pivot) < EPSILON) {
      return 0;
    }
    determinant *= pivot;
    for (let row2 = col2 + 1; row2 < n; row2++) {
      const factor = a[row2][col2] / pivot;
      for (let j = col2; j < n; j++) {
        a[row2][j] = a[row2][j] - factor * a[col2][j];
      }
    }
  }
  if (swapCount % 2 === 1) {
    determinant = -determinant;
  }
  return determinant;
}
function inv(id) {
  if (!is_square(id)) {
    throw new Error(`Matrix must be square for inverse calculation: ${id.rows}x${id.columns}`);
  }
  const n = id.rows;
  if (n === 0) {
    return new_matrix(0, 0, 0);
  }
  const aug = [];
  for (let i = 0; i < n; i++) {
    const row2 = [];
    for (let j = 0; j < n; j++) {
      row2.push(id.data[i][j]);
    }
    for (let j = 0; j < n; j++) {
      row2.push(i === j ? 1 : 0);
    }
    aug.push(row2);
  }
  for (let col2 = 0; col2 < n; col2++) {
    let maxRow = col2;
    let maxVal = Math.abs(aug[col2][col2]);
    for (let row2 = col2 + 1; row2 < n; row2++) {
      const absVal = Math.abs(aug[row2][col2]);
      if (absVal > maxVal) {
        maxVal = absVal;
        maxRow = row2;
      }
    }
    if (maxRow !== col2) {
      const temp = aug[col2];
      aug[col2] = aug[maxRow];
      aug[maxRow] = temp;
    }
    const pivot = aug[col2][col2];
    if (Math.abs(pivot) < EPSILON) {
      return null;
    }
    for (let j = 0; j < 2 * n; j++) {
      aug[col2][j] = aug[col2][j] / pivot;
    }
    for (let row2 = 0; row2 < n; row2++) {
      if (row2 !== col2) {
        const factor = aug[row2][col2];
        for (let j = 0; j < 2 * n; j++) {
          aug[row2][j] = aug[row2][j] - factor * aug[col2][j];
        }
      }
    }
  }
  const inverse = [];
  for (let i = 0; i < n; i++) {
    const row2 = [];
    for (let j = 0; j < n; j++) {
      row2.push(aug[i][n + j]);
    }
    inverse.push(row2);
  }
  return {
    rows: n,
    columns: n,
    data: inverse
  };
}
function pinv(id) {
  const m = id.rows;
  const n = id.columns;
  if (m === 0 || n === 0) {
    return new_matrix(n, m, 0);
  }
  if (m === n) {
    const inverse = inv(id);
    if (inverse !== null) {
      return inverse;
    }
  }
  const At = transpose(id);
  if (m >= n) {
    const AtA2 = mult(At, id);
    const AtA_inv2 = inv(AtA2);
    if (AtA_inv2 !== null) {
      return mult(AtA_inv2, At);
    }
  }
  const AAt = mult(id, At);
  const AAt_inv = inv(AAt);
  if (AAt_inv !== null) {
    return mult(At, AAt_inv);
  }
  const lambda = 1e-10;
  const AtA = mult(At, id);
  for (let i = 0; i < AtA.rows; i++) {
    AtA.data[i][i] = AtA.data[i][i] + lambda;
  }
  const AtA_inv = inv(AtA);
  if (AtA_inv !== null) {
    return mult(AtA_inv, At);
  }
  return new_matrix(n, m, 0);
}
function rank(id) {
  if (id.rows === 0 || id.columns === 0) {
    return 0;
  }
  const a = id.data.map((row2) => [...row2]);
  const m = id.rows;
  const n = id.columns;
  let r2 = 0;
  for (let col2 = 0; col2 < n && r2 < m; col2++) {
    let maxRow = r2;
    let maxVal = Math.abs(a[r2][col2]);
    for (let row2 = r2 + 1; row2 < m; row2++) {
      const absVal = Math.abs(a[row2][col2]);
      if (absVal > maxVal) {
        maxVal = absVal;
        maxRow = row2;
      }
    }
    if (maxVal < EPSILON) {
      continue;
    }
    if (maxRow !== r2) {
      const temp = a[r2];
      a[r2] = a[maxRow];
      a[maxRow] = temp;
    }
    const pivot = a[r2][col2];
    for (let row2 = r2 + 1; row2 < m; row2++) {
      const factor = a[row2][col2] / pivot;
      for (let j = col2; j < n; j++) {
        a[row2][j] = a[row2][j] - factor * a[r2][j];
      }
    }
    r2++;
  }
  return r2;
}
function eigenvalues(id) {
  if (!is_square(id)) {
    throw new Error(`Matrix must be square for eigenvalue calculation: ${id.rows}x${id.columns}`);
  }
  const n = id.rows;
  if (n === 0) {
    return [];
  }
  if (n === 1) {
    return [id.data[0][0]];
  }
  if (n === 2) {
    const a = id.data[0][0];
    const b2 = id.data[0][1];
    const c = id.data[1][0];
    const d = id.data[1][1];
    const trace2 = a + d;
    const determinant = a * d - b2 * c;
    const discriminant = trace2 * trace2 - 4 * determinant;
    if (discriminant >= 0) {
      const sqrtDisc = Math.sqrt(discriminant);
      return [(trace2 + sqrtDisc) / 2, (trace2 - sqrtDisc) / 2];
    } else {
      return [trace2 / 2, trace2 / 2];
    }
  }
  const h = toHessenberg(id);
  const result = qrAlgorithm(h, 100);
  return result;
}
function toHessenberg(m) {
  const n = m.rows;
  const h = m.data.map((row2) => [...row2]);
  for (let k = 0; k < n - 2; k++) {
    let maxVal = 0;
    for (let i = k + 1; i < n; i++) {
      maxVal = Math.max(maxVal, Math.abs(h[i][k]));
    }
    if (maxVal < EPSILON)
      continue;
    let sigma = 0;
    for (let i = k + 1; i < n; i++) {
      sigma += h[i][k] * h[i][k];
    }
    sigma = Math.sqrt(sigma);
    if (h[k + 1][k] < 0)
      sigma = -sigma;
    const u = new Array(n).fill(0);
    u[k + 1] = h[k + 1][k] + sigma;
    for (let i = k + 2; i < n; i++) {
      u[i] = h[i][k];
    }
    let uTu = 0;
    for (let i = k + 1; i < n; i++) {
      uTu += u[i] * u[i];
    }
    if (uTu < EPSILON)
      continue;
    for (let j = k; j < n; j++) {
      let dot = 0;
      for (let i = k + 1; i < n; i++) {
        dot += u[i] * h[i][j];
      }
      const factor = 2 * dot / uTu;
      for (let i = k + 1; i < n; i++) {
        h[i][j] = h[i][j] - factor * u[i];
      }
    }
    for (let i = 0; i < n; i++) {
      let dot = 0;
      for (let j = k + 1; j < n; j++) {
        dot += h[i][j] * u[j];
      }
      const factor = 2 * dot / uTu;
      for (let j = k + 1; j < n; j++) {
        h[i][j] = h[i][j] - factor * u[j];
      }
    }
  }
  return { rows: n, columns: n, data: h };
}
function qrAlgorithm(h, maxIter) {
  const n = h.rows;
  const a = h.data.map((row2) => [...row2]);
  const eigenvals = [];
  let remaining = n;
  for (let iter = 0; iter < maxIter && remaining > 1; iter++) {
    let converged = false;
    for (let i = remaining - 1; i >= 1; i--) {
      if (Math.abs(a[i][i - 1]) < EPSILON * (Math.abs(a[i - 1][i - 1]) + Math.abs(a[i][i]))) {
        a[i][i - 1] = 0;
        if (i === remaining - 1) {
          eigenvals.push(a[remaining - 1][remaining - 1]);
          remaining--;
          converged = true;
          break;
        }
      }
    }
    if (converged)
      continue;
    if (remaining <= 1)
      break;
    const d = (a[remaining - 2][remaining - 2] - a[remaining - 1][remaining - 1]) / 2;
    const sign2 = d >= 0 ? 1 : -1;
    const mu = a[remaining - 1][remaining - 1] - sign2 * a[remaining - 1][remaining - 2] * a[remaining - 1][remaining - 2] / (Math.abs(d) + Math.sqrt(d * d + a[remaining - 1][remaining - 2] * a[remaining - 1][remaining - 2]));
    let x = a[0][0] - mu;
    let z = a[1][0];
    for (let k = 0; k < remaining - 1; k++) {
      let r2 = Math.sqrt(x * x + z * z);
      if (r2 < EPSILON) {
        r2 = EPSILON;
      }
      const c = x / r2;
      const s = z / r2;
      for (let j = Math.max(0, k - 1); j < remaining; j++) {
        const temp = c * a[k][j] + s * a[k + 1][j];
        a[k + 1][j] = -s * a[k][j] + c * a[k + 1][j];
        a[k][j] = temp;
      }
      for (let i = 0; i < Math.min(k + 3, remaining); i++) {
        const temp = c * a[i][k] + s * a[i][k + 1];
        a[i][k + 1] = -s * a[i][k] + c * a[i][k + 1];
        a[i][k] = temp;
      }
      if (k < remaining - 2) {
        x = a[k + 1][k];
        z = a[k + 2][k];
      }
    }
  }
  for (let i = 0; i < remaining; i++) {
    eigenvals.push(a[i][i]);
  }
  eigenvals.sort((a2, b2) => Math.abs(b2) - Math.abs(a2));
  return eigenvals;
}
function eigenvectors(id) {
  if (!is_square(id)) {
    throw new Error(`Matrix must be square for eigenvector calculation: ${id.rows}x${id.columns}`);
  }
  const n = id.rows;
  if (n === 0) {
    return new_matrix(0, 0, 0);
  }
  const evals = eigenvalues(id);
  const vectors = [];
  for (let i = 0; i < n; i++) {
    const lambda = evals[i];
    const vec = inverseIteration(id, lambda);
    vectors.push(vec);
  }
  const result = [];
  for (let i = 0; i < n; i++) {
    const row2 = [];
    for (let j = 0; j < n; j++) {
      row2.push(vectors[j][i]);
    }
    result.push(row2);
  }
  return {
    rows: n,
    columns: n,
    data: result
  };
}
function inverseIteration(m, lambda) {
  const n = m.rows;
  const shifted = m.data.map(
    (row2, i) => row2.map((val, j) => i === j ? val - lambda : val)
  );
  for (let i = 0; i < n; i++) {
    if (Math.abs(shifted[i][i]) < EPSILON) {
      shifted[i][i] = EPSILON;
    }
  }
  let v = new Array(n).fill(1);
  for (let iter = 0; iter < 50; iter++) {
    const w = solveLinearSystem(shifted, v);
    let norm = 0;
    for (let i = 0; i < n; i++) {
      norm += w[i] * w[i];
    }
    norm = Math.sqrt(norm);
    if (norm < EPSILON) {
      return v;
    }
    const newV = [];
    for (let i = 0; i < n; i++) {
      newV.push(w[i] / norm);
    }
    let diff2 = 0;
    for (let i = 0; i < n; i++) {
      diff2 += Math.abs(Math.abs(newV[i]) - Math.abs(v[i]));
    }
    v = newV;
    if (diff2 < EPSILON) {
      break;
    }
  }
  return v;
}
function solveLinearSystem(a, b2) {
  const n = a.length;
  const aug = a.map((row2, i) => [...row2, b2[i]]);
  for (let col2 = 0; col2 < n; col2++) {
    let maxRow = col2;
    let maxVal = Math.abs(aug[col2][col2]);
    for (let row2 = col2 + 1; row2 < n; row2++) {
      const absVal = Math.abs(aug[row2][col2]);
      if (absVal > maxVal) {
        maxVal = absVal;
        maxRow = row2;
      }
    }
    if (maxRow !== col2) {
      const temp = aug[col2];
      aug[col2] = aug[maxRow];
      aug[maxRow] = temp;
    }
    const pivot = aug[col2][col2];
    if (Math.abs(pivot) < EPSILON) {
      continue;
    }
    for (let row2 = col2 + 1; row2 < n; row2++) {
      const factor = aug[row2][col2] / pivot;
      for (let j = col2; j <= n; j++) {
        aug[row2][j] = aug[row2][j] - factor * aug[col2][j];
      }
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum4 = aug[i][n];
    for (let j = i + 1; j < n; j++) {
      sum4 -= aug[i][j] * x[j];
    }
    const diag = aug[i][i];
    x[i] = Math.abs(diag) < EPSILON ? 0 : sum4 / diag;
  }
  return x;
}
function kron(id1, id2) {
  const m1 = id1.rows;
  const n1 = id1.columns;
  const m2 = id2.rows;
  const n2 = id2.columns;
  const resultRows = m1 * m2;
  const resultCols = n1 * n2;
  const data = [];
  for (let i = 0; i < resultRows; i++) {
    data.push(new Array(resultCols).fill(0));
  }
  for (let i1 = 0; i1 < m1; i1++) {
    for (let j1 = 0; j1 < n1; j1++) {
      const a = id1.data[i1][j1];
      for (let i2 = 0; i2 < m2; i2++) {
        for (let j2 = 0; j2 < n2; j2++) {
          const row2 = i1 * m2 + i2;
          const col2 = j1 * n2 + j2;
          data[row2][col2] = a * id2.data[i2][j2];
        }
      }
    }
  }
  return {
    rows: resultRows,
    columns: resultCols,
    data
  };
}
function newtype2(rows2 = 0, columns2 = 0, initial_value) {
  return new_matrix(rows2, columns2, initial_value);
}
var line_exports = {};
__export(line_exports, {
  copy: () => copy3,
  delete_line: () => delete_line,
  get_price: () => get_price,
  get_x1: () => get_x1,
  get_x2: () => get_x2,
  get_y1: () => get_y1,
  get_y2: () => get_y2,
  new: () => new_line2,
  new_line: () => new_line2,
  set_color: () => set_color,
  set_extend: () => set_extend,
  set_style: () => set_style,
  set_width: () => set_width,
  set_x1: () => set_x1,
  set_x2: () => set_x2,
  set_xloc: () => set_xloc,
  set_xy1: () => set_xy1,
  set_xy2: () => set_xy2,
  set_y1: () => set_y1,
  set_y2: () => set_y2
});
function new_line2(x1, y1, x2, y2, xloc2 = "bar_index", extend = "none", lineColor, style, width) {
  return {
    x1,
    y1,
    x2,
    y2,
    xloc: xloc2,
    extend,
    color: lineColor,
    style: style || "solid",
    width: width || 1
  };
}
function get_price(id, x) {
  const { x1, y1, x2, y2, extend, xloc: xloc2 } = id;
  if (xloc2 === "bar_time") {
    throw new Error("line.get_price() only works with xloc.bar_index lines, not xloc.bar_time");
  }
  if (x2 === x1) {
    return NaN;
  }
  const slope = (y2 - y1) / (x2 - x1);
  const price = y1 + slope * (x - x1);
  if (extend === "none") {
    if (x < Math.min(x1, x2) || x > Math.max(x1, x2)) {
      return NaN;
    }
  } else if (extend === "left") {
    if (x > Math.max(x1, x2)) {
      return NaN;
    }
  } else if (extend === "right") {
    if (x < Math.min(x1, x2)) {
      return NaN;
    }
  }
  return price;
}
function get_x1(id) {
  return id.x1;
}
function get_x2(id) {
  return id.x2;
}
function get_y1(id) {
  return id.y1;
}
function get_y2(id) {
  return id.y2;
}
function copy3(id) {
  return { ...id };
}
function set_x1(id, x) {
  id.x1 = x;
  return id;
}
function set_x2(id, x) {
  id.x2 = x;
  return id;
}
function set_y1(id, y) {
  id.y1 = y;
  return id;
}
function set_y2(id, y) {
  id.y2 = y;
  return id;
}
function set_xy1(id, x, y) {
  id.x1 = x;
  id.y1 = y;
  return id;
}
function set_xy2(id, x, y) {
  id.x2 = x;
  id.y2 = y;
  return id;
}
function set_xloc(id, x1, x2, xloc2) {
  id.x1 = x1;
  id.x2 = x2;
  id.xloc = xloc2;
  return id;
}
function set_extend(id, extend) {
  id.extend = extend;
  return id;
}
function set_color(id, lineColor) {
  id.color = lineColor;
  return id;
}
function set_style(id, style) {
  id.style = style;
  return id;
}
function set_width(id, width) {
  id.width = width;
  return id;
}
function delete_line(_id) {
}
var box_exports = {};
__export(box_exports, {
  copy: () => copy4,
  delete_box: () => delete_box,
  get_bottom: () => get_bottom,
  get_left: () => get_left,
  get_right: () => get_right,
  get_top: () => get_top,
  new: () => new_box2,
  new_box: () => new_box2,
  set_bgcolor: () => set_bgcolor,
  set_border_color: () => set_border_color,
  set_border_style: () => set_border_style,
  set_border_width: () => set_border_width,
  set_bottom: () => set_bottom,
  set_extend: () => set_extend2,
  set_left: () => set_left,
  set_lefttop: () => set_lefttop,
  set_right: () => set_right,
  set_rightbottom: () => set_rightbottom,
  set_text: () => set_text,
  set_text_color: () => set_text_color,
  set_text_font_family: () => set_text_font_family,
  set_text_halign: () => set_text_halign,
  set_text_size: () => set_text_size,
  set_text_valign: () => set_text_valign,
  set_text_wrap: () => set_text_wrap,
  set_top: () => set_top,
  set_xloc: () => set_xloc2
});
function new_box2(left, top, right, bottom, xloc2 = "bar_index", extend = "none", border_color, border_width, border_style, bgcolor, text, text_size, text_color, text_halign, text_valign, text_wrap, text_font_family) {
  return {
    left,
    top,
    right,
    bottom,
    xloc: xloc2,
    extend,
    border_color,
    border_width: border_width || 1,
    border_style: border_style || "solid",
    bgcolor,
    text,
    text_size,
    text_color,
    text_halign,
    text_valign,
    text_wrap,
    text_font_family
  };
}
function get_left(id) {
  return id.left;
}
function get_right(id) {
  return id.right;
}
function get_top(id) {
  return id.top;
}
function get_bottom(id) {
  return id.bottom;
}
function copy4(id) {
  return { ...id };
}
function set_left(id, left) {
  id.left = left;
  return id;
}
function set_right(id, right) {
  id.right = right;
  return id;
}
function set_top(id, top) {
  id.top = top;
  return id;
}
function set_bottom(id, bottom) {
  id.bottom = bottom;
  return id;
}
function set_lefttop(id, left, top) {
  id.left = left;
  id.top = top;
  return id;
}
function set_rightbottom(id, right, bottom) {
  id.right = right;
  id.bottom = bottom;
  return id;
}
function set_xloc2(id, left, right, xloc2) {
  id.left = left;
  id.right = right;
  id.xloc = xloc2;
  return id;
}
function set_extend2(id, extend) {
  id.extend = extend;
  return id;
}
function set_border_color(id, borderColor) {
  id.border_color = borderColor;
  return id;
}
function set_border_width(id, width) {
  id.border_width = width;
  return id;
}
function set_border_style(id, style) {
  id.border_style = style;
  return id;
}
function set_bgcolor(id, bgColor) {
  id.bgcolor = bgColor;
  return id;
}
function set_text(id, text) {
  id.text = text;
  return id;
}
function set_text_color(id, textColor) {
  id.text_color = textColor;
  return id;
}
function set_text_size(id, size2) {
  id.text_size = size2;
  return id;
}
function set_text_halign(id, align) {
  id.text_halign = align;
  return id;
}
function set_text_valign(id, align) {
  id.text_valign = align;
  return id;
}
function set_text_wrap(id, wrap) {
  id.text_wrap = wrap;
  return id;
}
function set_text_font_family(id, font) {
  id.text_font_family = font;
  return id;
}
function delete_box(_id) {
}
var label_exports = {};
__export(label_exports, {
  copy: () => copy5,
  delete_label: () => delete_label,
  get_text: () => get_text,
  get_x: () => get_x,
  get_y: () => get_y,
  new: () => new_label2,
  new_label: () => new_label2,
  set_color: () => set_color2,
  set_size: () => set_size,
  set_style: () => set_style2,
  set_text: () => set_text2,
  set_text_font_family: () => set_text_font_family2,
  set_textalign: () => set_textalign,
  set_textcolor: () => set_textcolor,
  set_tooltip: () => set_tooltip,
  set_x: () => set_x,
  set_xloc: () => set_xloc3,
  set_xy: () => set_xy,
  set_y: () => set_y,
  set_yloc: () => set_yloc
});
function new_label2(x, y, text, xloc2 = "bar_index", yloc = "price", labelColor, style, textcolor, size2, textalign, tooltip, text_font_family) {
  return {
    x,
    y,
    xloc: xloc2,
    yloc,
    text,
    tooltip,
    color: labelColor,
    style,
    textcolor,
    size: size2,
    textalign,
    text_font_family
  };
}
function get_x(id) {
  return id.x;
}
function get_y(id) {
  return id.y;
}
function get_text(id) {
  return id.text;
}
function copy5(id) {
  return { ...id };
}
function set_x(id, x) {
  id.x = x;
  return id;
}
function set_y(id, y) {
  id.y = y;
  return id;
}
function set_xy(id, x, y) {
  id.x = x;
  id.y = y;
  return id;
}
function set_xloc3(id, x, xloc2) {
  id.x = x;
  id.xloc = xloc2;
  return id;
}
function set_yloc(id, y, yloc) {
  id.y = y;
  id.yloc = yloc;
  return id;
}
function set_text2(id, text) {
  id.text = text;
  return id;
}
function set_tooltip(id, tooltip) {
  id.tooltip = tooltip;
  return id;
}
function set_color2(id, labelColor) {
  id.color = labelColor;
  return id;
}
function set_textcolor(id, textColor) {
  id.textcolor = textColor;
  return id;
}
function set_style2(id, style) {
  id.style = style;
  return id;
}
function set_size(id, size2) {
  id.size = size2;
  return id;
}
function set_textalign(id, align) {
  id.textalign = align;
  return id;
}
function set_text_font_family2(id, font) {
  id.text_font_family = font;
  return id;
}
function delete_label(_id) {
}
var linefill_exports = {};
__export(linefill_exports, {
  delete_linefill: () => delete_linefill,
  get_line1: () => get_line1,
  get_line2: () => get_line2,
  new: () => new_linefill2,
  new_linefill: () => new_linefill2,
  set_color: () => set_color3
});
function new_linefill2(line1, line2, fillColor) {
  return {
    line1,
    line2,
    color: fillColor
  };
}
function get_line1(id) {
  return id.line1;
}
function get_line2(id) {
  return id.line2;
}
function set_color3(id, fillColor) {
  id.color = fillColor;
  return id;
}
function delete_linefill(_id) {
}
var chartpoint_exports = {};
__export(chartpoint_exports, {
  copy: () => copy6,
  from_index: () => from_index,
  from_time: () => from_time,
  new: () => new_point,
  new_point: () => new_point
});
function new_point(time, index, price) {
  return {
    time,
    index,
    price
  };
}
function from_time(time, price) {
  return {
    time,
    index: null,
    price
  };
}
function from_index(index, price) {
  return {
    time: null,
    index,
    price
  };
}
function copy6(point) {
  return {
    time: point.time,
    index: point.index,
    price: point.price
  };
}
var polyline_exports = {};
__export(polyline_exports, {
  clear_all: () => clear_all,
  delete: () => delete_polyline,
  delete_polyline: () => delete_polyline,
  get_all: () => get_all,
  new: () => new_polyline,
  new_polyline: () => new_polyline,
  reset_id_counter: () => reset_id_counter
});
var polylineIdCounter = 0;
var allPolylines = [];
function generateId() {
  return `polyline_${++polylineIdCounter}`;
}
function new_polyline(points, curved = false, closed = false, xloc2 = "bar_index", line_color = "#2196F3", fill_color = null, line_style = "solid", line_width = 1, force_overlay = false) {
  if (curved) {
    console.warn(
      "polyline.new(): curved polylines are not yet supported. Using straight-line connections."
    );
  }
  if (line_width < 1) {
    console.warn("polyline.new(): line_width must be at least 1. Using 1.");
    line_width = 1;
  }
  const polyline = {
    id: generateId(),
    points: [...points],
    // Create a copy of the points array
    curved,
    closed,
    xloc: xloc2,
    line_color,
    fill_color,
    line_style,
    line_width,
    force_overlay
  };
  allPolylines.push(polyline);
  return polyline;
}
function delete_polyline(id) {
  const index = allPolylines.findIndex((p) => p.id === id.id);
  if (index !== -1) {
    allPolylines.splice(index, 1);
  }
}
function get_all() {
  return [...allPolylines];
}
function clear_all() {
  allPolylines.length = 0;
}
function reset_id_counter() {
  polylineIdCounter = 0;
}
var ta_series_exports = {};
__export(ta_series_exports, {
  alma: () => alma2,
  atr: () => atr2,
  barssince: () => barssince2,
  bb: () => bb2,
  bbw: () => bbw2,
  cci: () => cci2,
  change: () => change2,
  cmo: () => cmo2,
  cog: () => cog2,
  correlation: () => correlation2,
  cross: () => cross2,
  crossover: () => crossover2,
  crossunder: () => crossunder2,
  cum: () => cum2,
  dev: () => dev2,
  dmi: () => dmi2,
  ema: () => ema2,
  falling: () => falling2,
  highest: () => highest2,
  highestbars: () => highestbars2,
  hma: () => hma2,
  ichimoku: () => ichimoku2,
  kc: () => kc2,
  kcw: () => kcw2,
  linreg: () => linreg2,
  lowest: () => lowest2,
  lowestbars: () => lowestbars2,
  macd: () => macd2,
  max: () => max5,
  median: () => median4,
  mfi: () => mfi2,
  min: () => min5,
  mode: () => mode4,
  mom: () => mom2,
  percentile_linear_interpolation: () => percentile_linear_interpolation3,
  percentile_nearest_rank: () => percentile_nearest_rank3,
  percentrank: () => percentrank3,
  pivothigh: () => pivothigh2,
  pivotlow: () => pivotlow2,
  range: () => range3,
  rci: () => rci2,
  rising: () => rising2,
  rma: () => rma2,
  roc: () => roc2,
  rsi: () => rsi2,
  sar: () => sar2,
  sma: () => sma2,
  stdev: () => stdev3,
  stoch: () => stoch2,
  supertrend: () => supertrend2,
  swma: () => swma2,
  ta: () => ta,
  tr: () => tr2,
  tsi: () => tsi2,
  valuewhen: () => valuewhen2,
  variance: () => variance3,
  vwap: () => vwap2,
  vwma: () => vwma2,
  wma: () => wma2,
  wpr: () => wpr2,
  zigzag: () => zigzag2
});
function sma2(source, length2) {
  const bars = source.bars;
  const sourceValues = source.toArray();
  const result = sma(sourceValues, length2);
  return Series.fromArray(bars, result);
}
function ema2(source, length2) {
  const bars = source.bars;
  const sourceValues = source.toArray();
  const result = ema(sourceValues, length2);
  return Series.fromArray(bars, result);
}
function wma2(source, length2) {
  const bars = source.bars;
  const sourceValues = source.toArray();
  const result = wma(sourceValues, length2);
  return Series.fromArray(bars, result);
}
function rma2(source, length2) {
  const bars = source.bars;
  const sourceValues = source.toArray();
  const result = rma(sourceValues, length2);
  return Series.fromArray(bars, result);
}
function rsi2(source, length2) {
  const bars = source.bars;
  const sourceValues = source.toArray();
  const result = rsi(sourceValues, length2);
  return Series.fromArray(bars, result);
}
function macd2(source, fastLength, slowLength, signalLength) {
  const bars = source.bars;
  const sourceValues = source.toArray();
  const [macdVals, signalVals, histVals] = macd(sourceValues, fastLength, slowLength, signalLength);
  const macdSeries = Series.fromArray(bars, macdVals);
  const signalSeries = Series.fromArray(bars, signalVals);
  const histSeries = Series.fromArray(bars, histVals);
  return [macdSeries, signalSeries, histSeries];
}
function bb2(source, length2, mult2) {
  const bars = source.bars;
  const sourceValues = source.toArray();
  const [upperVals, basisVals, lowerVals] = bb(sourceValues, length2, mult2);
  const upperSeries = Series.fromArray(bars, upperVals);
  const basisSeries = Series.fromArray(bars, basisVals);
  const lowerSeries = Series.fromArray(bars, lowerVals);
  return [upperSeries, basisSeries, lowerSeries];
}
function stdev3(source, length2) {
  const bars = source.bars;
  const sourceValues = source.toArray();
  const result = stdev(sourceValues, length2);
  return Series.fromArray(bars, result);
}
function atr2(bars, length2) {
  const high = bars.map((b2) => b2.high);
  const low = bars.map((b2) => b2.low);
  const close = bars.map((b2) => b2.close);
  const result = atr(length2, high, low, close);
  return Series.fromArray(bars, result);
}
function tr2(bars, handle_na = false) {
  const high = bars.map((b2) => b2.high);
  const low = bars.map((b2) => b2.low);
  const close = bars.map((b2) => b2.close);
  const result = tr(handle_na, high, low, close);
  return Series.fromArray(bars, result);
}
function stoch2(source, high, low, length2) {
  const bars = source.bars;
  const sourceValues = source.toArray();
  const highValues = high.toArray();
  const lowValues = low.toArray();
  const result = stoch(sourceValues, highValues, lowValues, length2);
  return Series.fromArray(bars, result);
}
function crossover2(source1, source2) {
  const bars = source1.bars;
  const vals1 = source1.toArray();
  const vals2 = typeof source2 === "number" ? Array(bars.length).fill(source2) : source2.toArray();
  const result = crossover(vals1, vals2);
  const numResult = result.map((b2) => b2 ? 1 : 0);
  return Series.fromArray(bars, numResult);
}
function crossunder2(source1, source2) {
  const bars = source1.bars;
  const vals1 = source1.toArray();
  const vals2 = typeof source2 === "number" ? Array(bars.length).fill(source2) : source2.toArray();
  const result = crossunder(vals1, vals2);
  const numResult = result.map((b2) => b2 ? 1 : 0);
  return Series.fromArray(bars, numResult);
}
function cross2(source1, source2) {
  const bars = source1.bars;
  const vals1 = source1.toArray();
  const vals2 = typeof source2 === "number" ? Array(bars.length).fill(source2) : source2.toArray();
  const result = cross(vals1, vals2);
  const numResult = result.map((b2) => b2 ? 1 : 0);
  return Series.fromArray(bars, numResult);
}
function change2(source, length2 = 1) {
  const bars = source.bars;
  const sourceValues = source.toArray();
  const result = change(sourceValues, length2);
  return Series.fromArray(bars, result);
}
function mom2(source, length2) {
  const bars = source.bars;
  const sourceValues = source.toArray();
  const result = mom(sourceValues, length2);
  return Series.fromArray(bars, result);
}
function roc2(source, length2) {
  const bars = source.bars;
  const sourceValues = source.toArray();
  const result = roc(sourceValues, length2);
  return Series.fromArray(bars, result);
}
function highest2(source, length2) {
  const bars = source.bars;
  const sourceValues = source.toArray();
  const result = highest(sourceValues, length2);
  return Series.fromArray(bars, result);
}
function lowest2(source, length2) {
  const bars = source.bars;
  const sourceValues = source.toArray();
  const result = lowest(sourceValues, length2);
  return Series.fromArray(bars, result);
}
function rising2(source, length2) {
  const bars = source.bars;
  const sourceValues = source.toArray();
  const result = rising(sourceValues, length2);
  const numResult = result.map((b2) => b2 ? 1 : 0);
  return Series.fromArray(bars, numResult);
}
function falling2(source, length2) {
  const bars = source.bars;
  const sourceValues = source.toArray();
  const result = falling(sourceValues, length2);
  const numResult = result.map((b2) => b2 ? 1 : 0);
  return Series.fromArray(bars, numResult);
}
function cum2(source) {
  const bars = source.bars;
  const sourceValues = source.toArray();
  const result = cum(sourceValues);
  return Series.fromArray(bars, result);
}
function supertrend2(bars, factor, atrLength) {
  const high = bars.map((b2) => b2.high);
  const low = bars.map((b2) => b2.low);
  const close = bars.map((b2) => b2.close);
  const [trendVals, dirVals] = supertrend(factor, atrLength, high, low, close);
  const trendSeries = Series.fromArray(bars, trendVals);
  const dirSeries = Series.fromArray(bars, dirVals);
  return [trendSeries, dirSeries];
}
function vwap2(source, volume) {
  const bars = source.bars;
  const sourceValues = source.toArray();
  const volumeValues = volume.toArray();
  const result = vwap(sourceValues, volumeValues);
  return Series.fromArray(bars, result);
}
function ichimoku2(bars, conversionPeriods, basePeriods, laggingSpan2Periods, displacement) {
  const high = bars.map((b2) => b2.high);
  const low = bars.map((b2) => b2.low);
  const close = bars.map((b2) => b2.close);
  const [tenkan, kijun, senkouA, senkouB, chikou] = ichimoku(
    conversionPeriods,
    basePeriods,
    laggingSpan2Periods,
    displacement,
    high,
    low,
    close
  );
  return [
    Series.fromArray(bars, tenkan),
    Series.fromArray(bars, kijun),
    Series.fromArray(bars, senkouA),
    Series.fromArray(bars, senkouB),
    Series.fromArray(bars, chikou)
  ];
}
function vwma2(source, length2, volume) {
  const bars = source.bars;
  const sourceValues = source.toArray();
  const volumeValues = volume.toArray();
  const result = vwma(sourceValues, length2, volumeValues);
  return Series.fromArray(bars, result);
}
function linreg2(source, length2, offset = 0) {
  const bars = source.bars;
  const sourceValues = source.toArray();
  const result = linreg(sourceValues, length2, offset);
  return Series.fromArray(bars, result);
}
function alma2(source, length2 = 9, offset = 0.85, sigma = 6, floor2 = false) {
  const bars = source.bars;
  const sourceValues = source.toArray();
  const result = alma(sourceValues, length2, offset, sigma, floor2);
  return Series.fromArray(bars, result);
}
function zigzag2(bars, deviation = 5, depth = 10, backstep = 3) {
  const high = bars.map((b2) => b2.high);
  const low = bars.map((b2) => b2.low);
  const [zigzagVals, dirVals, pivotVals] = zigzag(
    deviation,
    depth,
    backstep,
    void 0,
    high,
    low
  );
  return [
    Series.fromArray(bars, zigzagVals),
    Series.fromArray(bars, dirVals),
    Series.fromArray(bars, pivotVals.map((b2) => b2 ? 1 : 0))
  ];
}
function cci2(source, length2) {
  const bars = source.bars;
  const sourceValues = source.toArray();
  const result = cci(sourceValues, length2);
  return Series.fromArray(bars, result);
}
function sar2(bars, start = 0.02, inc = 0.02, max6 = 0.2) {
  const high = bars.map((b2) => b2.high);
  const low = bars.map((b2) => b2.low);
  const close = bars.map((b2) => b2.close);
  const result = sar(start, inc, max6, high, low, close);
  return Series.fromArray(bars, result);
}
function dev2(source, length2) {
  const bars = source.bars;
  const result = dev(source.toArray(), length2);
  return Series.fromArray(bars, result);
}
function variance3(source, length2, biased = true) {
  const bars = source.bars;
  const result = variance(source.toArray(), length2, biased);
  return Series.fromArray(bars, result);
}
function median4(source, length2) {
  const bars = source.bars;
  const result = median(source.toArray(), length2);
  return Series.fromArray(bars, result);
}
function swma2(source) {
  const bars = source.bars;
  const result = swma(source.toArray());
  return Series.fromArray(bars, result);
}
function correlation2(source1, source2, length2) {
  const bars = source1.bars;
  const result = correlation(source1.toArray(), source2.toArray(), length2);
  return Series.fromArray(bars, result);
}
function percentrank3(source, length2) {
  const bars = source.bars;
  const result = percentrank(source.toArray(), length2);
  return Series.fromArray(bars, result);
}
function mfi2(source, length2, volume) {
  const bars = source.bars;
  const result = mfi(source.toArray(), length2, volume.toArray());
  return Series.fromArray(bars, result);
}
function hma2(source, length2) {
  const bars = source.bars;
  const result = hma(source.toArray(), length2);
  return Series.fromArray(bars, result);
}
function pivothigh2(source, leftbars, rightbars) {
  const bars = source.bars;
  const result = pivothigh(source.toArray(), leftbars, rightbars);
  return Series.fromArray(bars, result);
}
function pivotlow2(source, leftbars, rightbars) {
  const bars = source.bars;
  const result = pivotlow(source.toArray(), leftbars, rightbars);
  return Series.fromArray(bars, result);
}
function barssince2(condition) {
  const bars = condition.bars;
  const boolValues = condition.toArray().map((v) => v === 1);
  const result = barssince(boolValues);
  return Series.fromArray(bars, result);
}
function valuewhen2(condition, source, occurrence) {
  const bars = condition.bars;
  const boolValues = condition.toArray().map((v) => v === 1);
  const result = valuewhen(boolValues, source.toArray(), occurrence);
  return Series.fromArray(bars, result);
}
function dmi2(bars, diLength, adxSmoothing) {
  const high = bars.map((b2) => b2.high);
  const low = bars.map((b2) => b2.low);
  const close = bars.map((b2) => b2.close);
  const [plusDI, minusDI, adx] = dmi(diLength, adxSmoothing, high, low, close);
  return [
    Series.fromArray(bars, plusDI),
    Series.fromArray(bars, minusDI),
    Series.fromArray(bars, adx)
  ];
}
function tsi2(source, shortLength, longLength) {
  const bars = source.bars;
  const result = tsi(source.toArray(), shortLength, longLength);
  return Series.fromArray(bars, result);
}
function cmo2(source, length2) {
  const bars = source.bars;
  const result = cmo(source.toArray(), length2);
  return Series.fromArray(bars, result);
}
function kc2(bars, source, length2, mult2, useTrueRange = true) {
  const high = bars.map((b2) => b2.high);
  const low = bars.map((b2) => b2.low);
  const close = bars.map((b2) => b2.close);
  const [middle, upper2, lower2] = kc(source.toArray(), length2, mult2, useTrueRange, high, low, close);
  return [
    Series.fromArray(bars, middle),
    Series.fromArray(bars, upper2),
    Series.fromArray(bars, lower2)
  ];
}
function bbw2(source, length2, mult2) {
  const bars = source.bars;
  const result = bbw(source.toArray(), length2, mult2);
  return Series.fromArray(bars, result);
}
function wpr2(bars, length2 = 14) {
  const high = bars.map((b2) => b2.high);
  const low = bars.map((b2) => b2.low);
  const close = bars.map((b2) => b2.close);
  const result = wpr(high, low, close, length2);
  return Series.fromArray(bars, result);
}
function kcw2(bars, source, length2 = 20, mult2 = 2, useTrueRange = true) {
  const high = bars.map((b2) => b2.high);
  const low = bars.map((b2) => b2.low);
  const close = bars.map((b2) => b2.close);
  const result = kcw(source.toArray(), length2, mult2, useTrueRange, high, low, close);
  return Series.fromArray(bars, result);
}
function range3(high, low) {
  const bars = high.bars;
  const result = range(high.toArray(), low.toArray());
  return Series.fromArray(bars, result);
}
function highestbars2(source, length2) {
  const bars = source.bars;
  const result = highestbars(source.toArray(), length2);
  return Series.fromArray(bars, result);
}
function lowestbars2(source, length2) {
  const bars = source.bars;
  const result = lowestbars(source.toArray(), length2);
  return Series.fromArray(bars, result);
}
function max5(source1, source2) {
  const bars = source1.bars;
  const result = max(source1.toArray(), source2.toArray());
  return Series.fromArray(bars, result);
}
function min5(source1, source2) {
  const bars = source1.bars;
  const result = min(source1.toArray(), source2.toArray());
  return Series.fromArray(bars, result);
}
function cog2(source, length2 = 10) {
  const bars = source.bars;
  const result = cog(source.toArray(), length2);
  return Series.fromArray(bars, result);
}
function mode4(source, length2) {
  const bars = source.bars;
  const result = mode(source.toArray(), length2);
  return Series.fromArray(bars, result);
}
function percentile_linear_interpolation3(source, length2, percentage) {
  const bars = source.bars;
  const result = percentile_linear_interpolation(source.toArray(), length2, percentage);
  return Series.fromArray(bars, result);
}
function percentile_nearest_rank3(source, length2, percentage) {
  const bars = source.bars;
  const result = percentile_nearest_rank(source.toArray(), length2, percentage);
  return Series.fromArray(bars, result);
}
function rci2(source, length2) {
  const bars = source.bars;
  const result = rci(source.toArray(), length2);
  return Series.fromArray(bars, result);
}
var ta = {
  sma: sma2,
  ema: ema2,
  wma: wma2,
  vwma: vwma2,
  rma: rma2,
  rsi: rsi2,
  macd: macd2,
  bb: bb2,
  stdev: stdev3,
  atr: atr2,
  tr: tr2,
  stoch: stoch2,
  crossover: crossover2,
  crossunder: crossunder2,
  cross: cross2,
  change: change2,
  mom: mom2,
  roc: roc2,
  highest: highest2,
  lowest: lowest2,
  rising: rising2,
  falling: falling2,
  cum: cum2,
  supertrend: supertrend2,
  vwap: vwap2,
  ichimoku: ichimoku2,
  linreg: linreg2,
  alma: alma2,
  zigzag: zigzag2,
  cci: cci2,
  sar: sar2,
  dev: dev2,
  variance: variance3,
  median: median4,
  swma: swma2,
  correlation: correlation2,
  percentrank: percentrank3,
  mfi: mfi2,
  hma: hma2,
  pivothigh: pivothigh2,
  pivotlow: pivotlow2,
  barssince: barssince2,
  valuewhen: valuewhen2,
  dmi: dmi2,
  tsi: tsi2,
  cmo: cmo2,
  kc: kc2,
  bbw: bbw2,
  wpr: wpr2,
  kcw: kcw2,
  range: range3,
  highestbars: highestbars2,
  lowestbars: lowestbars2,
  max: max5,
  min: min5,
  cog: cog2,
  mode: mode4,
  percentile_linear_interpolation: percentile_linear_interpolation3,
  percentile_nearest_rank: percentile_nearest_rank3,
  rci: rci2
};
function getSourceSeries(bars, source = "close") {
  const open = new Series(bars, (bar) => bar.open);
  const high = new Series(bars, (bar) => bar.high);
  const low = new Series(bars, (bar) => bar.low);
  const close = new Series(bars, (bar) => bar.close);
  switch (source) {
    case "open":
      return open;
    case "high":
      return high;
    case "low":
      return low;
    case "close":
      return close;
    case "hl2":
      return high.add(low).div(2);
    case "hlc3":
      return high.add(low).add(close).div(3);
    case "ohlc4":
      return open.add(high).add(low).add(close).div(4);
    case "hlcc4":
      return high.add(low).add(close).add(close).div(4);
    default:
      return close;
  }
}
var defaultSettings = {
  devThreshold: 5,
  depth: 10,
  lineColor: "#2962FF",
  extendLast: true,
  displayReversalPrice: true,
  displayCumulativeVolume: true,
  displayReversalPriceChange: true,
  differencePriceMode: "Absolute",
  allowZigZagOnOneBar: true
};
var ZigZag = class {
  settings;
  pivots = [];
  sumVol = 0;
  highBuffer = [];
  lowBuffer = [];
  timeBuffer = [];
  barCount = 0;
  constructor(settings) {
    this.settings = { ...defaultSettings, ...settings };
  }
  /**
   * Process a single bar, detecting pivots.
   * Must be called sequentially for each bar.
   * @returns true if a new pivot was detected or updated
   */
  update(bar, barIndex) {
    this.highBuffer.push(bar.high);
    this.lowBuffer.push(bar.low);
    this.timeBuffer.push(bar.time);
    this.barCount++;
    const depth = Math.max(2, Math.floor(this.settings.depth / 2));
    this.sumVol += bar.volume ?? 0;
    if (this.barCount < depth * 2 + 1)
      return false;
    let somethingChanged = this.tryFindPivot(true, depth, barIndex);
    somethingChanged = this.tryFindPivot(
      false,
      depth,
      barIndex,
      this.settings.allowZigZagOnOneBar || !somethingChanged
    ) || somethingChanged;
    return somethingChanged;
  }
  /**
   * Get the last confirmed pivot
   */
  lastPivot() {
    if (this.pivots.length === 0)
      return null;
    const last2 = this.pivots[this.pivots.length - 1];
    return last2 !== void 0 ? last2 : null;
  }
  /**
   * Get extension line to current bar (if extendLast enabled)
   */
  getExtension(currentBar, barIndex) {
    if (!this.settings.extendLast)
      return null;
    const last2 = this.lastPivot();
    if (!last2)
      return null;
    const isHigh = !last2.isHigh;
    const price = isHigh ? currentBar.high : currentBar.low;
    return {
      isHigh,
      volume: this.sumVol,
      start: last2.end,
      end: { time: currentBar.time, barIndex, price }
    };
  }
  // ============ Private Methods ============
  tryFindPivot(isHigh, depth, currentBarIndex, registerPivot = true) {
    const point = this.findPivotPoint(isHigh, depth, currentBarIndex);
    if (!point || !registerPivot)
      return false;
    return this.newPivotPointFound(isHigh, point);
  }
  /**
   * Check if a bar from `depth` bars back is a pivot point.
   * A pivot high has prices below it on both sides.
   * A pivot low has prices above it on both sides.
   */
  findPivotPoint(isHigh, depth, currentBarIndex) {
    const buffer = isHigh ? this.highBuffer : this.lowBuffer;
    const pivotBufferIdx = buffer.length - 1 - depth;
    if (pivotBufferIdx < depth)
      return null;
    const pivotPrice = buffer[pivotBufferIdx];
    if (pivotPrice === void 0)
      return null;
    for (let i = pivotBufferIdx + 1; i < buffer.length; i++) {
      const price = buffer[i];
      if (price === void 0)
        return null;
      if (isHigh) {
        if (price > pivotPrice)
          return null;
      } else {
        if (price < pivotPrice)
          return null;
      }
    }
    for (let i = pivotBufferIdx - depth; i < pivotBufferIdx; i++) {
      const price = buffer[i];
      if (price === void 0)
        return null;
      if (isHigh) {
        if (price >= pivotPrice)
          return null;
      } else {
        if (price <= pivotPrice)
          return null;
      }
    }
    const pivotBarIndex = currentBarIndex - depth;
    const pivotTime = this.timeBuffer[pivotBufferIdx];
    if (pivotTime === void 0)
      return null;
    return {
      time: pivotTime,
      barIndex: pivotBarIndex,
      price: pivotPrice
    };
  }
  /**
   * Calculate percentage deviation from base price to new price
   */
  calcDev(basePrice, price) {
    return 100 * (price - basePrice) / Math.abs(basePrice);
  }
  /**
   * Handle a newly detected pivot point.
   * Either updates existing pivot (if same direction) or adds new pivot (if direction changed).
   */
  newPivotPointFound(isHigh, point) {
    const last2 = this.lastPivot();
    if (!last2) {
      this.pivots.push({
        isHigh,
        volume: this.sumVol,
        start: point,
        end: point
      });
      this.sumVol = 0;
      return true;
    }
    if (last2.isHigh === isHigh) {
      const isMoreExtreme = isHigh ? point.price > last2.end.price : point.price < last2.end.price;
      if (isMoreExtreme) {
        last2.end = point;
        last2.volume += this.sumVol;
        this.sumVol = 0;
        return true;
      }
    } else {
      const dev3 = this.calcDev(last2.end.price, point.price);
      const threshold = this.settings.devThreshold;
      const meetsThreshold = last2.isHigh ? dev3 <= -threshold : dev3 >= threshold;
      if (meetsThreshold) {
        this.pivots.push({
          isHigh,
          volume: this.sumVol,
          start: last2.end,
          end: point
        });
        this.sumVol = 0;
        return true;
      }
    }
    return false;
  }
};
function calculateZigZag(bars, settings) {
  if (bars.length === 0) {
    return { pivots: [], extension: null };
  }
  const zz = new ZigZag(settings);
  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    if (bar !== void 0) {
      zz.update(bar, i);
    }
  }
  const lastBar = bars[bars.length - 1];
  if (lastBar === void 0) {
    return { pivots: zz.pivots, extension: null };
  }
  const extension = zz.getExtension(lastBar, bars.length - 1);
  return {
    pivots: zz.pivots,
    extension
  };
}
export {
  Series as S,
  array_exports as a,
  calculateZigZag as c,
  getSourceSeries as g,
  math_exports as m,
  ta_series_exports as t
};

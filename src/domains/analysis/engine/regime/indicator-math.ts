// ============================================================================
// VIXOR Analysis Engine — Indicator Math (shared)
// ============================================================================
// Small, dependency-free indicator math helpers used by the regime detector
// and the strategy scorer. Kept here so the analysis-engine/regime/ subtree is
// self-contained (does NOT depend on the strategy runtime).

export function sma(values: number[], period: number): number[] {
  const out = new Array<number>(values.length).fill(NaN);
  if (period <= 0) return out;
  let sum = 0;
  let count = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (Number.isFinite(v)) {
      sum += v;
      count++;
    }
    if (i >= period) {
      const old = values[i - period];
      if (Number.isFinite(old)) {
        sum -= old;
        count--;
      }
    }
    if (count >= period) out[i] = sum / period;
  }
  return out;
}

export function ema(values: number[], period: number): number[] {
  const out = new Array<number>(values.length).fill(NaN);
  if (period <= 0 || values.length === 0) return out;
  const k = 2 / (period + 1);
  let prev = NaN;
  let seedSum = 0;
  let seedCount = 0;
  let seeded = false;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (!Number.isFinite(v)) {
      out[i] = prev;
      continue;
    }
    if (!seeded) {
      seedSum += v;
      seedCount++;
      if (seedCount === period) {
        prev = seedSum / period;
        out[i] = prev;
        seeded = true;
      }
      continue;
    }
    prev = v * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

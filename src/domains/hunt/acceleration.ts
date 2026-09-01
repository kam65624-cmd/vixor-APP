// ============================================================================
// Hunt — Token Acceleration Score
// ============================================================================
//
// Adapted from MbotixTech/meme-coins-signal repo.
// Measures how fast a token is accelerating (volume, price, holders, liquidity).
//
// Score: 0-100
//   70-100: HOT 🔥
//   40-69:  WARM ♨️
//   0-39:   COOL 🧊
// ============================================================================

export interface AccelerationInput {
  priceChange1h: number; // % price change in last 1h
  priceChange24h: number; // % price change in last 24h
  volume24h: number; // current 24h volume in USD
  volumePrev24h: number; // previous 24h volume (or estimate)
  liquidity: number; // current liquidity in USD
  txCount1h: number; // tx count in last 1h
  txCountPrev1h: number; // tx count in previous 1h
  holderGrowthPct: number; // % holder growth in last 1h (0 if unknown)
}

export interface AccelerationScore {
  score: number; // 0-100
  level: "hot" | "warm" | "cool";
  breakdown: {
    volumeAccel: number; // 0-30
    priceVelocity: number; // 0-25
    holderGrowth: number; // 0-20
    liquidityInflux: number; // 0-15
    txCountAccel: number; // 0-10
  };
}

/**
 * Calculate the acceleration score for a token.
 *
 * Weights:
 *   Volume Acceleration:  30%
 *   Price Velocity:       25%
 *   Holder Growth:        20%
 *   Liquidity Influx:     15%
 *   Transaction Count:    10%
 */
export function calculateAccelerationScore(input: AccelerationInput): AccelerationScore {
  // 1. Volume Acceleration (0-30)
  let volumeAccel = 0;
  if (input.volumePrev24h > 0) {
    const ratio = input.volume24h / input.volumePrev24h;
    volumeAccel = Math.min(30, Math.round((ratio - 1) * 30));
  } else if (input.volume24h > 0) {
    volumeAccel = 15; // No previous data — neutral
  }
  volumeAccel = Math.max(0, volumeAccel);

  // 2. Price Velocity (0-25) — based on 1h change (more sensitive) or 24h
  const priceChange =
    Math.abs(input.priceChange1h) > 0 ? input.priceChange1h : input.priceChange24h / 24;
  const priceVelocity = Math.min(25, Math.round(Math.abs(priceChange) * 5));

  // 3. Holder Growth (0-20)
  const holderGrowth = Math.min(20, Math.round(input.holderGrowthPct * 200));

  // 4. Liquidity Influx (0-15)
  // Scored based on absolute liquidity depth (proxy for influx)
  let liquidityInflux = 0;
  if (input.liquidity >= 1_000_000) liquidityInflux = 15;
  else if (input.liquidity >= 100_000) liquidityInflux = 10;
  else if (input.liquidity >= 10_000) liquidityInflux = 5;
  else if (input.liquidity >= 1_000) liquidityInflux = 2;

  // 5. Transaction Count Acceleration (0-10)
  let txCountAccel = 0;
  if (input.txCountPrev1h > 0) {
    const ratio = input.txCount1h / input.txCountPrev1h;
    txCountAccel = Math.min(10, Math.round((ratio - 1) * 10));
  }
  txCountAccel = Math.max(0, txCountAccel);

  const score = Math.min(
    100,
    volumeAccel + priceVelocity + holderGrowth + liquidityInflux + txCountAccel,
  );

  const level: "hot" | "warm" | "cool" = score >= 70 ? "hot" : score >= 40 ? "warm" : "cool";

  return {
    score,
    level,
    breakdown: {
      volumeAccel,
      priceVelocity,
      holderGrowth,
      liquidityInflux,
      txCountAccel,
    },
  };
}

/** Get emoji for acceleration level */
export function accelerationEmoji(level: "hot" | "warm" | "cool"): string {
  return level === "hot" ? "🔥" : level === "warm" ? "♨️" : "🧊";
}

/** Get color for acceleration level */
export function accelerationColor(level: "hot" | "warm" | "cool"): string {
  return level === "hot"
    ? "var(--color-bearish)"
    : level === "warm"
      ? "var(--color-gold)"
      : "var(--color-muted-foreground)";
}

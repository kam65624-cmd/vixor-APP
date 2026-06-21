import { defineEventHandler } from "h3";

// Simple SOL price endpoint — fetches from Binance (free, no API key)
const CACHE_TTL = 30_000; // 30 seconds
let cachedPrice: { price: number; change24h: number; timestamp: number } | null = null;

export default defineEventHandler(async (event) => {
  const now = Date.now();

  // Return cached if fresh
  if (cachedPrice && now - cachedPrice.timestamp < CACHE_TTL) {
    return cachedPrice;
  }

  try {
    // Fetch SOL/USDT from Binance
    const res = await fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=SOLUSDT", {
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) throw new Error(`Binance ${res.status}`);

    const data = await res.json();
    const price = parseFloat(data.lastPrice);
    const change24h = parseFloat(data.priceChangePercent);

    cachedPrice = { price, change24h, timestamp: now };
    return cachedPrice;
  } catch {
    // Return cached even if stale, or fallback
    if (cachedPrice) return cachedPrice;
    return { price: 0, change24h: 0, timestamp: now };
  }
});

import { defineEventHandler } from "h3";
import { cache, CACHE_TTL } from "@/shared/cache";

const CACHE_KEY = "sol-price";

export default defineEventHandler(async () => {
  const cached = await cache.get<{ price: number; change24h: number }>(CACHE_KEY);
  if (cached) return { ...cached, cached: true };

  try {
    const res = await fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=SOLUSDT", {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Binance ${res.status}`);
    const data = await res.json();
    const result = { price: parseFloat(data.lastPrice), change24h: parseFloat(data.priceChangePercent) };
    await cache.set(CACHE_KEY, result, CACHE_TTL.PRICE);
    return result;
  } catch {
    if (cached) return { ...cached, stale: true };
    return { price: 0, change24h: 0 };
  }
});

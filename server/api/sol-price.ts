import { defineEventHandler } from "h3";
import { cache, CACHE_TTL } from "@/shared/cache";
import { withRateLimit } from "../utils/with-rate-limit";
import { handlePreflight, rateLimit } from "./_security";

const CACHE_KEY = "sol-price";

const handler = defineEventHandler(async (event) => {
  if (handlePreflight(event)) return;
  if (!rateLimit(event)) return;

  const cached = await cache.get<{ price: number; change24h: number }>(CACHE_KEY);
  if (cached) return { ...cached, cached: true };

  try {
    const res = await fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=SOLUSDT", {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Binance ${res.status}`);
    const data = await res.json();
    const result = {
      price: parseFloat(data.lastPrice),
      change24h: parseFloat(data.priceChangePercent),
    };
    await cache.set(CACHE_KEY, result, CACHE_TTL.PRICE);
    return result;
  } catch {
    return { price: 0, change24h: 0, error: "Price data unavailable" };
  }
});

export default withRateLimit(handler, { maxRequests: 120, windowSec: 60 });

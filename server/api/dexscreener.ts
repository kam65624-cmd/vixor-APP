import { defineEventHandler, getQuery } from "h3";

// Fetches fresh Solana trending/new pairs from DexScreener (free, no API key)
const CACHE_TTL = 60_000;
let cachedTokens: { data: any[]; timestamp: number } | null = null;

export default defineEventHandler(async (event) => {
  const now = Date.now();
  const query = getQuery(event);
  const chain = (query.chain as string) || "solana";
  const sortBy = (query.sortBy as string) || "volume";
  const limit = parseInt((query.limit as string) || "50", 10);
  const search = (query.search as string) || "";

  // Return cached if fresh
  if (cachedTokens && now - cachedTokens.timestamp < CACHE_TTL && !search) {
    return {
      success: true,
      data: cachedTokens.data.slice(0, limit),
      total: cachedTokens.data.length,
      source: "dexscreener-cache",
    };
  }

  try {
    let url: string;
    let pairs: any[] = [];

    if (search) {
      url = `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(search + " " + chain)}&limit=${limit}`;
    } else {
      url = `https://api.dexscreener.com/latest/dex/tokens/new-pairs?chainId=${chain}&sort_by=${sortBy === "volume" ? "volume" : "txCount"}&sort_order=desc&limit=${limit}`;
    }

    const res = await fetch(url, {
      signal: AbortSignal.timeout(12_000),
      headers: { "Accept": "application/json" },
    });

    if (!res.ok) throw new Error(`DexScreener ${res.status}`);

    const json = await res.json();

    // Normalize to client-friendly format
    if (search) {
      pairs = (json.pairs || []).map((p: any) => ({
        symbol: p.baseToken?.symbol || "?",
        name: p.baseToken?.name || "Unknown",
        price: p.priceUsd || 0,
        change24h: p.priceChange?.h24 || 0,
        change5m: p.priceChange?.m5 || 0,
        change1h: p.priceChange?.h1 || 0,
        volume24h: p.volume?.h24 || 0,
        liquidity: p.liquidity?.usd || 0,
        marketCap: p.fdv || 0,
        chain: chain,
        chainId: p.chainId,
        pairAddress: p.pairAddress,
        baseToken: p.baseToken?.address,
        quoteToken: p.quoteToken?.address,
        dexId: p.dexId,
        txCount24h: p.txns?.h24 ?? p.txns?.m5 ?? 0,
        pairCreatedAt: p.pairCreatedAt,
        info: p.info,
        risk: "medium",
        smartMoneyPct: 0,
        paid: false,
      }));
    } else {
      pairs = (json.pairs || []).map((p: any) => {
        const changeH24 = p.priceChange?.h24 || 0;
        return {
          symbol: p.baseToken?.symbol || "?",
          name: p.baseToken?.name || "Unknown",
          price: p.priceUsd || 0,
          change24h: changeH24,
          change5m: p.priceChange?.m5 || 0,
          change1h: p.priceChange?.h1 || 0,
          volume24h: p.volume?.h24 || 0,
          liquidity: p.liquidity?.usd || 0,
          marketCap: p.fdv || 0,
          chain,
          chainId: p.chainId,
          pairAddress: p.pairAddress,
          baseToken: p.baseToken?.address,
          quoteToken: p.quoteToken?.address,
          dexId: p.dexId,
          txCount24h: p.txns?.h24 ?? p.txns?.m5 ?? 0,
          pairCreatedAt: p.pairCreatedAt,
          info: p.info,
          risk: changeH24 > 50 ? "high" : changeH24 > 10 ? "medium" : "low",
          smartMoneyPct: 0,
          paid: false,
        };
      });
    }

    if (!search) {
      cachedTokens = { data: pairs, timestamp: now };
    }

    return {
      success: true,
      data: pairs.slice(0, limit),
      total: pairs.length,
      source: "dexscreener",
    };
  } catch (err) {
    return {
      success: false,
      data: [],
      total: 0,
      error: err instanceof Error ? err.message : "Failed to fetch",
    };
  }
});

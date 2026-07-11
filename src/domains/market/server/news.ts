// ============================================================================
// News Fetching for Analysis Engine
// ============================================================================
//
// Priority order:
//   1. Finnhub (free, crypto & forex, real sentiment)
//   2. NewsAPI (general, requires paid key)
//   3. CoinGecko news endpoint (free, crypto only)
//   4. Empty array fallback (non-fatal)
// ============================================================================

export interface NewsItem {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment?: "positive" | "negative" | "neutral";
  summary?: string;
}

// Simple rule-based sentiment scoring
function scoreSentiment(title: string): "positive" | "negative" | "neutral" {
  const lower = title.toLowerCase();
  const positiveWords = [
    "surge",
    "rally",
    "gain",
    "bullish",
    "rise",
    "pump",
    "all-time high",
    "record",
    "breakout",
    "bull",
    "soar",
    "uptrend",
    "recovery",
    "growth",
    "adoption",
    "partnership",
    "launch",
    "wins",
    "approval",
    "approval",
  ];
  const negativeWords = [
    "crash",
    "drop",
    "fall",
    "bearish",
    "plunge",
    "decline",
    "selloff",
    "bear",
    "collapse",
    "warning",
    "risk",
    "hack",
    "ban",
    "fine",
    "lawsuit",
    "fraud",
    "sell",
    "dump",
    "fear",
    "concern",
    "regulation",
    "block",
    "halt",
  ];

  let score = 0;
  for (const w of positiveWords) if (lower.includes(w)) score++;
  for (const w of negativeWords) if (lower.includes(w)) score--;

  if (score > 0) return "positive";
  if (score < 0) return "negative";
  return "neutral";
}

// Convert pair to Finnhub-compatible symbol
function toFinnhubSymbol(pair: string): string {
  const p = pair.toUpperCase().replace("/", "").replace("-", "");
  // Crypto pairs
  if (p.includes("BTC") || p.includes("ETH") || p.includes("SOL") || p.includes("BNB")) {
    return p.replace("USDT", "").replace("USD", "");
  }
  // Forex / commodities → use as-is
  return p.replace("USD", "");
}

export async function getNewsForSymbol(
  symbol: string,
  options?: { limit?: number },
): Promise<NewsItem[]> {
  const limit = options?.limit ?? 5;

  // ── Strategy 1: Finnhub (free tier, 60 req/min) ──
  const finnhubKey = process.env.FINNHUB_API_KEY;
  if (finnhubKey) {
    try {
      const from = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]; // 3 days ago
      const to = new Date().toISOString().split("T")[0];
      const category = symbol.includes("USD") && !symbol.includes("BTC") ? "forex" : "crypto";
      const url = `https://finnhub.io/api/v1/news?category=${category}&from=${from}&to=${to}&token=${finnhubKey}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = (await res.json()) as Array<{
          headline: string;
          source: string;
          url: string;
          datetime: number;
          summary?: string;
        }>;
        if (Array.isArray(data) && data.length > 0) {
          return data.slice(0, limit).map((a) => ({
            title: a.headline || "",
            source: a.source || "Finnhub",
            url: a.url || "",
            publishedAt: a.datetime ? new Date(a.datetime * 1000).toISOString() : "",
            sentiment: scoreSentiment(a.headline || ""),
            summary: a.summary?.slice(0, 200) || undefined,
          }));
        }
      }
    } catch {
      // fall through
    }
  }

  // ── Strategy 2: CoinGecko News (free, crypto only) ──
  const baseCoin = toFinnhubSymbol(symbol).toLowerCase();
  const cryptoCoins: Record<string, string> = {
    btc: "bitcoin",
    eth: "ethereum",
    sol: "solana",
    bnb: "binancecoin",
    xrp: "ripple",
    ada: "cardano",
    avax: "avalanche-2",
    dot: "polkadot",
    doge: "dogecoin",
    uni: "uniswap",
    ltc: "litecoin",
    link: "chainlink",
  };
  const coinId = cryptoCoins[baseCoin];
  if (coinId) {
    try {
      const url = `https://api.coingecko.com/api/v3/news?ids=${coinId}&count=${limit}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = (await res.json()) as {
          data?: Array<{
            title: string;
            author: { name: string };
            url: string;
            updated_at: number;
            description?: string;
          }>;
        };
        if (data?.data && data.data.length > 0) {
          return data.data.slice(0, limit).map((a) => ({
            title: a.title || "",
            source: a.author?.name || "CoinGecko",
            url: a.url || "",
            publishedAt: a.updated_at ? new Date(a.updated_at * 1000).toISOString() : "",
            sentiment: scoreSentiment(a.title || ""),
            summary: a.description?.slice(0, 200) || undefined,
          }));
        }
      }
    } catch {
      // fall through
    }
  }

  // ── Strategy 3: NewsAPI (requires paid key after 100 req/day) ──
  const newsApiKey = process.env.NEWS_API_KEY;
  if (newsApiKey) {
    try {
      const q = encodeURIComponent(`${symbol.replace("/", " ")} price`);
      const url = `https://newsapi.org/v2/everything?q=${q}&sortBy=publishedAt&pageSize=${limit}&language=en&apiKey=${newsApiKey}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = (await res.json()) as any;
        const articles = data.articles ?? [];
        if (articles.length > 0) {
          return articles.slice(0, limit).map((a: any) => ({
            title: a.title || "",
            source: a.source?.name || "NewsAPI",
            url: a.url || "",
            publishedAt: a.publishedAt || "",
            sentiment: scoreSentiment(a.title || ""),
            summary: a.description?.slice(0, 200) || undefined,
          }));
        }
      }
    } catch {
      // fall through
    }
  }

  // ── Fallback: No news (non-fatal) ──
  return [];
}

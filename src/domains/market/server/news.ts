// News fetching for analysis engine — stub
export interface NewsItem {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment?: "positive" | "negative" | "neutral";
  summary?: string;
}

export async function getNewsForSymbol(
  symbol: string,
  _options?: { limit?: number },
): Promise<NewsItem[]> {
  try {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(symbol + " crypto trading")}&sortBy=publishedAt&pageSize=5&apiKey=${process.env.NEWS_API_KEY || ""}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const data = (await res.json()) as any;
    return (data.articles ?? []).map((a: any) => ({
      title: a.title || "",
      source: a.source?.name || "",
      url: a.url || "",
      publishedAt: a.publishedAt || "",
      sentiment: "neutral" as const,
    }));
  } catch {
    return [];
  }
}
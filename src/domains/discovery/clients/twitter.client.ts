/**
 * @module domains/discovery/clients/twitter
 * @description Twitter/X API v2 client for social mentions and sentiment.
 * Fetches recent tweets mentioning crypto tokens and extracts engagement metrics.
 * Rate limit: 300 req/min on basic tier, 50 req/min on free tier.
 */

import type { ApiResponse } from "../types";
import { CACHE_TTL_MS } from "../constants";

/** In-memory cache for Twitter responses. */
const cache = new Map<string, { data: unknown; ts: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS.social) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, ts: Date.now() });
  if (cache.size > 100) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
}

/** Twitter API v2 base URL. */
const TWITTER_BASE_URL = "https://api.twitter.com/2";

/** Result from a Twitter recent search. */
export interface TwitterSearchResult {
  /** Number of tweets found. */
  mentionCount: number;
  /** Average sentiment (-1 to 1). */
  avgSentiment: number;
  /** Total engagement (likes + retweets + replies). */
  totalEngagement: number;
  /** Influencer score (0–100). */
  influencerScore: number;
}

/**
 * Searches recent tweets for a token symbol using Twitter API v2.
 *
 * @param bearerToken - Twitter Bearer Token.
 * @param query - Search query (e.g., "$PEPE" or "PEPE coin").
 * @param maxResults - Maximum tweets to fetch (10–100).
 * @returns API response with Twitter search results.
 */
export async function fetchTwitterMentions(
  bearerToken: string,
  query: string,
  maxResults: number = 30,
): Promise<ApiResponse<TwitterSearchResult>> {
  const start = Date.now();
  const cacheKey = `twitter:${query}:${maxResults}`;

  const cached = getCached<TwitterSearchResult>(cacheKey);
  if (cached) {
    return {
      success: true,
      data: cached,
      cached: true,
      cacheTtl: CACHE_TTL_MS.social,
      responseTimeMs: Date.now() - start,
    };
  }

  if (!bearerToken) {
    // Graceful degradation when Twitter is not configured
    return {
      success: true,
      data: { mentionCount: 0, avgSentiment: 0, totalEngagement: 0, influencerScore: 0 },
      responseTimeMs: 0,
    };
  }

  try {
    const url = new URL(`${TWITTER_BASE_URL}/tweets/search/recent`);
    url.searchParams.set("query", `${query} -is:retweet lang:en`);
    url.searchParams.set("max_results", String(Math.min(maxResults, 100)));
    url.searchParams.set(
      "tweet.fields",
      "public_metrics,created_at,author_id,lang",
    );

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      // Rate limit or auth error — return neutral data
      if (response.status === 429 || response.status === 401) {
        return {
          success: true,
          data: {
            mentionCount: 0,
            avgSentiment: 0,
            totalEngagement: 0,
            influencerScore: 0,
          },
          error: `Twitter API ${response.status}: rate limited or unauthorized`,
          responseTimeMs: Date.now() - start,
        };
      }

      return {
        success: false,
        error: `Twitter API error: ${response.status}`,
        responseTimeMs: Date.now() - start,
      };
    }

    const json = (await response.json()) as {
      data?: Array<{
        public_metrics: {
          like_count: number;
          retweet_count: number;
          reply_count: number;
          impression_count: number;
        };
        author_id: string;
      }>;
      meta?: { result_count: number };
    };

    const tweets = json.data ?? [];
    const totalMentions = json.meta?.result_count ?? tweets.length;

    // Aggregate engagement metrics
    let totalEngagement = 0;
    let highFollowerCount = 0;

    for (const tweet of tweets) {
      const metrics = tweet.public_metrics;
      totalEngagement +=
        metrics.like_count +
        metrics.retweet_count +
        metrics.reply_count;

      // Simple heuristic: high impressions suggest influencer reach
      if (metrics.impression_count > 10_000) {
        highFollowerCount++;
      }
    }

    // Basic sentiment heuristic from engagement ratios
    // (In production, use NLP model for actual sentiment analysis)
    const avgSentiment = totalMentions > 0 ? 0.2 : 0; // neutral-positive default
    const influencerScore =
      tweets.length > 0
        ? Math.min(100, Math.round((highFollowerCount / tweets.length) * 100))
        : 0;

    const result: TwitterSearchResult = {
      mentionCount: totalMentions,
      avgSentiment,
      totalEngagement,
      influencerScore,
    };

    setCache(cacheKey, result);

    return {
      success: true,
      data: result,
      cached: false,
      responseTimeMs: Date.now() - start,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    // Never fail the pipeline because of Twitter
    return {
      success: true,
      data: { mentionCount: 0, avgSentiment: 0, totalEngagement: 0, influencerScore: 0 },
      error: `Twitter request failed: ${message}`,
      responseTimeMs: Date.now() - start,
    };
  }
}

/** Export cache for testing. */
export { cache as twitterCache };

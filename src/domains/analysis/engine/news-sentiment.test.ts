// ============================================================================
// VIXOR Analysis Engine — Enhanced News Sentiment Tests
// ============================================================================

import { describe, it, expect } from "vitest";
import { analyzeNewsSentiment, type NewsArticle } from "./news-sentiment";

describe("analyzeNewsSentiment", () => {
  it("returns neutral for empty articles", () => {
    const result = analyzeNewsSentiment([]);
    expect(result.overallSentiment).toBe("neutral");
    expect(result.score).toBe(0);
    expect(result.articleCount).toBe(0);
    expect(result.topPositive).toEqual([]);
    expect(result.topNegative).toEqual([]);
  });

  it("detects bullish sentiment from positive phrases", () => {
    const articles: NewsArticle[] = [
      { title: "Bitcoin surges past $70,000 on strong ETF demand", source: "Reuters" },
      { title: "Ethereum rally continues with DeFi adoption growth" },
    ];
    const result = analyzeNewsSentiment(articles);
    expect(result.overallSentiment).toBe("bullish");
    expect(result.score).toBeGreaterThan(0);
    expect(result.topPositive.length).toBeGreaterThan(0);
  });

  it("detects bearish sentiment from negative phrases", () => {
    const articles: NewsArticle[] = [
      { title: "Crypto market crashes as selloff intensifies", source: "Bloomberg" },
      { title: "Bitcoin plunge triggers fear and concern among investors" },
    ];
    const result = analyzeNewsSentiment(articles);
    expect(result.overallSentiment).toBe("bearish");
    expect(result.score).toBeLessThan(0);
    expect(result.topNegative.length).toBeGreaterThan(0);
  });

  it("applies 1.5x weight to high-credibility sources", () => {
    const reutersArticles: NewsArticle[] = [
      { title: "Markets rally on positive data", source: "Reuters" },
    ];
    const unknownArticles: NewsArticle[] = [{ title: "Markets rally on positive data" }];

    const reutersResult = analyzeNewsSentiment(reutersArticles);
    const unknownResult = analyzeNewsSentiment(unknownArticles);

    // Reuters should have a higher score due to 1.5x source weight
    expect(reutersResult.score).toBeGreaterThan(unknownResult.score);
  });

  it("handles negation: 'not bullish' is negative", () => {
    const articles: NewsArticle[] = [
      { title: "Earnings report is not bullish for company outlook" },
    ];
    const result = analyzeNewsSentiment(articles);
    expect(result.score).toBeLessThan(0);
  });

  it("handles negation: 'no longer bullish' is negative", () => {
    const articles: NewsArticle[] = [{ title: "Market is no longer bullish as selloff continues" }];
    const result = analyzeNewsSentiment(articles);
    // 'no longer' negates bullish, 'selloff' is negative → overall negative
    expect(result.score).toBeLessThan(0);
  });

  it("handles negation: 'not a crash' is positive", () => {
    const articles: NewsArticle[] = [
      { title: "Analysts say this is not a crash, just a correction" },
    ];
    const result = analyzeNewsSentiment(articles);
    // 'not' negates 'crash' → positive contribution
    expect(result.score).toBeGreaterThan(0);
  });

  it("caps topPositive and topNegative at 3 headlines", () => {
    const articles: NewsArticle[] = [
      { title: "Bitcoin surges to all-time high" },
      { title: "Ethereum rally breaks key resistance" },
      { title: "Solana soars on adoption news" },
      { title: "Cardano gains momentum" },
      { title: "Market crashes heavily" },
      { title: "Major selloff wipes billions" },
      { title: "Fear dominates as prices plunge" },
      { title: "Regulation concerns grow" },
    ];
    const result = analyzeNewsSentiment(articles);
    expect(result.topPositive.length).toBeLessThanOrEqual(3);
    expect(result.topNegative.length).toBeLessThanOrEqual(3);
    expect(result.articleCount).toBe(8);
  });

  it("returns neutral for mixed/ambiguous articles", () => {
    const articles: NewsArticle[] = [
      { title: "Market awaits Federal Reserve decision" },
      { title: "Trading volume remains stable" },
    ];
    const result = analyzeNewsSentiment(articles);
    expect(result.overallSentiment).toBe("neutral");
    expect(Math.abs(result.score)).toBeLessThanOrEqual(0.1);
  });

  it("phrase matching works for multi-word phrases", () => {
    const articles: NewsArticle[] = [
      { title: "Company earnings beat expectations, above forecast" },
    ];
    const result = analyzeNewsSentiment(articles);
    // "beat expectations" and "above forecast" are both strong positive phrases
    expect(result.overallSentiment).toBe("bullish");
    expect(result.score).toBeGreaterThan(0);
  });
});

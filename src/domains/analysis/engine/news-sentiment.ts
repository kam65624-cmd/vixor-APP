// ============================================================================
// VIXOR Analysis Engine — Enhanced News Sentiment
// ============================================================================
//
// Improvements over the crude word-matching in market/server/news.ts:
// 1. Phrase matching (not just words): "beat expectations", "above forecast"
// 2. Source weighting: Reuters, Bloomberg = 1.5x, unknown sources = 0.8x
// 3. Negation handling: "not good" → negative, "no longer bullish" → negative
// 4. Compound scoring: Average per-article scores, then overall average
//
// Pure function — no side effects, no API calls.
// ============================================================================

// ── Types ──────────────────────────────────────────────────────────────────

export interface NewsSentimentResult {
  overallSentiment: "bullish" | "bearish" | "neutral";
  score: number; // -1 to +1
  articleCount: number;
  topPositive: string[]; // top 3 positive headlines
  topNegative: string[]; // top 3 negative headlines
}

export interface NewsArticle {
  title: string;
  source?: string;
  sentiment?: string;
}

// ── Source weight map ──────────────────────────────────────────────────────

const HIGH_WEIGHT_SOURCES = new Set([
  "reuters",
  "bloomberg",
  "financial times",
  "ft.com",
  "wall street journal",
  "wsj",
  "cnbc",
]);

function getSourceWeight(source?: string): number {
  if (!source) return 0.8; // unknown source
  const lower = source.toLowerCase();
  if (HIGH_WEIGHT_SOURCES.has(lower)) return 1.5;
  return 1.0;
}

// ── Phrase dictionaries ────────────────────────────────────────────────────

// Strong positive phrases (weight +2 each match)
const STRONG_POSITIVE_PHRASES = [
  "beat expectations",
  "above forecast",
  "exceeded estimates",
  "better than expected",
  "surge",
  "soar",
  "rally",
  "all-time high",
  "record high",
  "breakout",
];

// Mild positive phrases (weight +1 each match)
const MILD_POSITIVE_PHRASES = [
  "bullish",
  "rise",
  "gain",
  "growth",
  "recovery",
  "adoption",
  "partnership",
  "launch",
  "approval",
  "uptrend",
  "upgrade",
  "positive outlook",
  "optimistic",
];

// Strong negative phrases (weight -2 each match)
const STRONG_NEGATIVE_PHRASES = [
  "missed estimates",
  "below expectations",
  "below forecast",
  "worse than expected",
  "crash",
  "plunge",
  "collapse",
  "selloff",
  "hack",
  "fraud",
  "ban",
  "lawsuit",
];

// Mild negative phrases (weight -1 each match)
const MILD_NEGATIVE_PHRASES = [
  "bearish",
  "drop",
  "fall",
  "decline",
  "dump",
  "fear",
  "concern",
  "regulation",
  "risk",
  "warning",
  "sell-off",
  "downtrend",
  "negative outlook",
  "pessimistic",
];

// ── Negation words ──────────────────────────────────────────────────────────

const NEGATION_WORDS = new Set([
  "not",
  "no",
  "never",
  "neither",
  "nor",
  "hardly",
  "barely",
  "scarcely",
  "don't",
  "doesn't",
  "didn't",
  "won't",
  "wouldn't",
  "shouldn't",
  "couldn't",
  "isn't",
  "aren't",
  "wasn't",
  "weren't",
]);

/**
 * Check if a phrase match is negated.
 * Looks backwards from the match position for a negation word within 3 words.
 */
function isNegated(text: string, matchIndex: number): boolean {
  // Get the text before the match
  const before = text.slice(0, matchIndex);
  // Get the last 3 words before the match
  const words = before.split(/\s+/).slice(-3);
  return words.some((w) => NEGATION_WORDS.has(w.toLowerCase().replace(/[^a-z']/g, "")));
}

/**
 * Find all occurrences of phrases in a text, returning matches with their indices.
 */
function findPhraseMatches(
  text: string,
  phrases: string[],
): Array<{ phrase: string; index: number }> {
  const lower = text.toLowerCase();
  const matches: Array<{ phrase: string; index: number }> = [];

  for (const phrase of phrases) {
    const phraseLower = phrase.toLowerCase();
    let searchFrom = 0;
    while (searchFrom < lower.length) {
      const idx = lower.indexOf(phraseLower, searchFrom);
      if (idx === -1) break;
      matches.push({ phrase, index: idx });
      searchFrom = idx + phraseLower.length;
    }
  }

  return matches;
}

// ── Per-article scoring ─────────────────────────────────────────────────────

function scoreArticle(article: NewsArticle): {
  score: number; // -1 to +1, weighted
  rawTitle: string;
  isPositive: boolean;
  isNegative: boolean;
} {
  const text = article.title.toLowerCase();
  const sourceWeight = getSourceWeight(article.source);

  let rawScore = 0;

  // Strong positive phrases (+2 each, unless negated)
  const strongPosMatches = findPhraseMatches(text, STRONG_POSITIVE_PHRASES);
  for (const match of strongPosMatches) {
    if (!isNegated(text, match.index)) {
      rawScore += 2;
    } else {
      rawScore -= 2; // Negated positive → negative
    }
  }

  // Mild positive phrases (+1 each, unless negated)
  const mildPosMatches = findPhraseMatches(text, MILD_POSITIVE_PHRASES);
  for (const match of mildPosMatches) {
    if (!isNegated(text, match.index)) {
      rawScore += 1;
    } else {
      rawScore -= 1;
    }
  }

  // Strong negative phrases (-2 each, unless negated)
  const strongNegMatches = findPhraseMatches(text, STRONG_NEGATIVE_PHRASES);
  for (const match of strongNegMatches) {
    if (!isNegated(text, match.index)) {
      rawScore -= 2;
    } else {
      rawScore += 2; // Negated negative → positive
    }
  }

  // Mild negative phrases (-1 each, unless negated)
  const mildNegMatches = findPhraseMatches(text, MILD_NEGATIVE_PHRASES);
  for (const match of mildNegMatches) {
    if (!isNegated(text, match.index)) {
      rawScore -= 1;
    } else {
      rawScore += 1;
    }
  }

  // Normalize to -1..+1 (max possible rawScore magnitude is ~6 per article)
  const normalized = Math.max(-1, Math.min(1, rawScore / 4));
  const weighted = normalized * sourceWeight;
  const clamped = Math.max(-1, Math.min(1, weighted));

  return {
    score: clamped,
    rawTitle: article.title,
    isPositive: clamped > 0.1,
    isNegative: clamped < -0.1,
  };
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Analyze news sentiment for a symbol using enhanced scoring.
 * Uses weighted word lists + phrase matching + source weighting.
 */
export function analyzeNewsSentiment(articles: NewsArticle[]): NewsSentimentResult {
  if (!articles || articles.length === 0) {
    return {
      overallSentiment: "neutral",
      score: 0,
      articleCount: 0,
      topPositive: [],
      topNegative: [],
    };
  }

  // Score each article
  const scored = articles.map((a) => scoreArticle(a));

  // Compute overall score (simple average)
  const avgScore = scored.reduce((sum, s) => sum + s.score, 0) / scored.length;
  const clampedScore = Math.max(-1, Math.min(1, avgScore));

  // Determine overall sentiment
  let overallSentiment: "bullish" | "bearish" | "neutral";
  if (clampedScore > 0.1) {
    overallSentiment = "bullish";
  } else if (clampedScore < -0.1) {
    overallSentiment = "bearish";
  } else {
    overallSentiment = "neutral";
  }

  // Extract top 3 positive and negative headlines
  const positiveArticles = scored.filter((s) => s.isPositive).sort((a, b) => b.score - a.score);
  const negativeArticles = scored.filter((s) => s.isNegative).sort((a, b) => a.score - b.score); // most negative first

  return {
    overallSentiment,
    score: Math.round(clampedScore * 1000) / 1000, // 3 decimal places
    articleCount: articles.length,
    topPositive: positiveArticles.slice(0, 3).map((s) => s.rawTitle),
    topNegative: negativeArticles.slice(0, 3).map((s) => s.rawTitle),
  };
}

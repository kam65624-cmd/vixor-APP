// ============================================================================
// VIXOR Experiment — LLM Prompt Templates
// ============================================================================
// Ported from QuantDinger/backend_api_python/app/services/experiment/prompts.py
//
// Pure string templates + parsing helpers. The experiment runner imports these
// and passes them to LLMRouter (Agent 2's `@/shared/llm/` module). No LLM
// calls happen here.

import {
  IndicatorParamsParser,
  type IndicatorParam,
} from "@/domains/strategy/runtime/indicator-params";
import type { RegimeClassification } from "@/domains/analysis/engine/regime/regime-detector";

export const SYSTEM_PROMPT = `You are a quantitative trading strategy optimization expert.
Your task is to propose parameter combinations for backtesting a trading indicator.
You MUST return ONLY valid JSON — no explanations, no markdown fences.
The JSON must be an array of objects.`;

export interface CandidateRiskParams {
  stopLossPct: number;
  takeProfitPct: number;
  entryPct: number;
  leverage: number;
  trailingStop: {
    enabled: boolean;
    pct: number;
    activationPct: number;
  };
}

export interface LlmCandidate {
  name: string;
  reasoning: string;
  indicatorParams: Record<string, number | string | boolean>;
  riskParams: CandidateRiskParams;
}

export interface PreviousResult {
  name: string;
  score?: { overall?: number; grade?: string };
  result?: {
    totalReturn?: number;
    maxDrawdown?: number;
    sharpeRatio?: number;
    totalTrades?: number;
  };
}

/**
 * Extract `# @param name type default description` declarations from indicator
 * source. Returns a typed list.
 */
export function extractIndicatorParams(code: string): IndicatorParam[] {
  return IndicatorParamsParser.parseParams(code ?? "");
}

export function buildRoundPrompt(opts: {
  indicatorCode: string;
  indicatorParams: IndicatorParam[];
  regime: RegimeClassification | null;
  previousResults: PreviousResult[] | null;
  roundNumber: number;
  nCandidates?: number;
}): string {
  const nCandidates = opts.nCandidates ?? 5;
  const learning =
    opts.previousResults && opts.previousResults.length > 0
      ? "Analyze the previous results carefully. Identify patterns: which parameter ranges yielded high scores vs low scores. Propose parameters that explore promising directions while also trying novel approaches."
      : "Since this is the first round, propose a diverse spread of parameters: some conservative (tight stops, smaller positions), some moderate, some aggressive.";

  return `## Indicator Code
\`\`\`typescript
${opts.indicatorCode.slice(0, 4000)}
\`\`\`

## Tunable Indicator Parameters (extracted from @param annotations)
${formatIndicatorParams(opts.indicatorParams)}

## Risk / Position Parameters (always tunable)
- stopLossPct: stop-loss as a fraction of price (0 = disabled, typical 0.01-0.10)
- takeProfitPct: take-profit as a fraction of price (0 = disabled, typical 0.02-0.20)
- entryPct: position size as fraction of capital (0.1-1.0)
- leverage: leverage multiplier (1-10, integer)
- trailingStop.enabled: true/false
- trailingStop.pct: trailing stop distance as fraction (0.005-0.05)
- trailingStop.activationPct: trailing activation threshold (0.01-0.10)

## Market Regime
${formatRegime(opts.regime)}

## Previous Round Results
${formatPreviousResults(opts.previousResults)}

## Task
Generate exactly ${nCandidates} diverse parameter sets.
Each set MUST contain both indicatorParams and riskParams.
${learning}

Return a JSON array:
[
  {
    "name": "short descriptive name",
    "reasoning": "1 sentence why this combination should perform well",
    "indicatorParams": { ... },
    "riskParams": {
      "stopLossPct": <float>,
      "takeProfitPct": <float>,
      "entryPct": <float>,
      "leverage": <int>,
      "trailingStop": { "enabled": <bool>, "pct": <float>, "activationPct": <float> }
    }
  }
]`;
}

/**
 * Parse an LLM response into a list of normalised candidates. Tolerates
 * markdown fences and partial JSON.
 */
export function parseLlmCandidates(raw: string): LlmCandidate[] {
  if (!raw) return [];
  let text = raw.trim();
  // Strip ``` fences
  if (text.startsWith("```")) {
    const firstNl = text.indexOf("\n");
    if (firstNl !== -1) text = text.slice(firstNl + 1);
    if (text.endsWith("```")) text = text.slice(0, -3);
    text = text.trim();
  }
  // Direct parse
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed.filter((c) => c && typeof c === "object").map(normalizeCandidate);
    }
    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as { candidates?: unknown }).candidates)
    ) {
      return (parsed as { candidates: unknown[] }).candidates
        .filter((c): c is Record<string, unknown> => c != null && typeof c === "object")
        .map(normalizeCandidate);
    }
    if (parsed && typeof parsed === "object") {
      return [normalizeCandidate(parsed)];
    }
  } catch {
    // fall through to regex extraction
  }
  // Fallback: extract JSON array substring
  const match = text.match(/\[[\s\S]*\]/);
  if (match) {
    try {
      const arr = JSON.parse(match[0]);
      if (Array.isArray(arr)) {
        return arr.filter((c) => c && typeof c === "object").map(normalizeCandidate);
      }
    } catch {
      // give up
    }
  }
  return [];
}

/**
 * Prompt for suggesting a strategy template given a market regime.
 */
export function buildStrategyTemplatePrompt(regime: RegimeClassification): string {
  return `You are a quantitative strategy designer. Given the current market regime, suggest a TypeScript strategy template suitable for backtesting.

## Market Regime
- Regime: ${regime.label} (${regime.regime})
- Confidence: ${(regime.confidence * 100).toFixed(0)}%
- ADX: ${regime.indicators.adx}
- ATR percentile: ${regime.indicators.atrPercentile}
- Hurst exponent: ${regime.indicators.hurst}
- Trend strength: ${regime.indicators.trendStrength}
- Preferred strategy families: ${regime.strategyFamilies.join(", ")}

## Strategy Runtime API
Your strategy must define an onBar(ctx) function. ctx exposes:
- ctx.bar / ctx.bars / ctx.currentIndex (lookback only — no future bars)
- ctx.buy({ qty, kind, stopLoss, takeProfit, scaleIn })
- ctx.sell({ qty, kind, stopLoss, takeProfit, scaleIn })
- ctx.close()
- ctx.indicator.{ sma, ema, rsi, macd, atr, bollinger, stochastic, adx, obc }
- ctx.log(msg), ctx.emit(event, payload), ctx.param(name, default)

## Task
Produce a TypeScript strategy source tuned for the regime above. The source MUST define a top-level onBar function. Return only the code, no markdown fences.`;
}

/**
 * Prompt for suggesting parameter mutations given current best params + scores.
 */
export function buildMutationPrompt(opts: {
  currentBest: PreviousResult;
  parameterSpace: Record<string, unknown>;
  nMutations?: number;
}): string {
  const nMutations = opts.nMutations ?? 3;
  return `You are a strategy parameter optimiser. Given the current best parameter set and its score, suggest ${nMutations} mutated variants to try next.

## Current Best
${JSON.stringify(opts.currentBest, null, 2)}

## Parameter Space (keys you may tune)
${JSON.stringify(opts.parameterSpace, null, 2)}

## Task
Return a JSON array of ${nMutations} objects, each with:
{ "name": string, "reasoning": string, "indicatorParams": {...}, "riskParams": {...} }`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatIndicatorParams(params: IndicatorParam[]): string {
  if (!params || params.length === 0) {
    return "(No @param annotations found — indicator has no tunable params)";
  }
  return params
    .map(
      (p) =>
        `- ${p.name} (${p.type}): default=${p.default}${p.description ? `  — ${p.description}` : ""}`,
    )
    .join("\n");
}

function formatRegime(regime: RegimeClassification | null): string {
  if (!regime) return "Not available.";
  const f = regime.indicators;
  return [
    `Regime: ${regime.label}`,
    `Confidence: ${(regime.confidence * 100).toFixed(0)}%`,
    `Price change: ${f.priceChangePct.toFixed(2)}%`,
    `Volatility: ${f.realizedVolPct.toFixed(2)}%`,
    `ATR%: ${f.emaGapPct.toFixed(2)}%`,
    `Efficiency: ${f.directionalEfficiency.toFixed(2)}`,
    `ADX: ${f.adx.toFixed(2)}`,
    `Hurst: ${f.hurst.toFixed(2)}`,
  ].join(" | ");
}

function formatPreviousResults(results: PreviousResult[] | null): string {
  if (!results || results.length === 0) return "This is Round 1 — no previous results.";
  return results
    .map((r) => {
      const score = r.score ?? {};
      const result = r.result ?? {};
      return `- ${r.name ?? "?"}: score=${(score.overall ?? 0).toFixed(1)} grade=${score.grade ?? "?"} return=${(result.totalReturn ?? 0).toFixed(2)}% drawdown=${(result.maxDrawdown ?? 0).toFixed(2)}% sharpe=${(result.sharpeRatio ?? 0).toFixed(2)} trades=${result.totalTrades ?? 0}`;
    })
    .join("\n");
}

function normalizeCandidate(raw: Record<string, unknown>): LlmCandidate {
  const indicatorParams = (raw.indicatorParams ?? raw.indicator_params ?? {}) as Record<
    string,
    number | string | boolean
  >;
  const riskRaw = (raw.riskParams ?? raw.risk_params ?? {}) as Record<string, unknown>;
  const trailingRaw = (riskRaw.trailingStop ?? riskRaw.trailing_stop ?? {}) as Record<
    string,
    unknown
  >;
  return {
    name: String(raw.name ?? "unnamed"),
    reasoning: String(raw.reasoning ?? ""),
    indicatorParams,
    riskParams: {
      stopLossPct: clamp(parseFloat(String(riskRaw.stopLossPct ?? 0)), 0, 1),
      takeProfitPct: clamp(parseFloat(String(riskRaw.takeProfitPct ?? 0)), 0, 5),
      entryPct: clamp(parseFloat(String(riskRaw.entryPct ?? 0.5)), 0.01, 1),
      leverage: Math.max(1, parseInt(String(riskRaw.leverage ?? 1), 10) || 1),
      trailingStop: {
        enabled: Boolean(trailingRaw.enabled ?? false),
        pct: clamp(parseFloat(String(trailingRaw.pct ?? 0.02)), 0, 0.5),
        activationPct: clamp(parseFloat(String(trailingRaw.activationPct ?? 0.01)), 0, 0.5),
      },
    },
  };
}

function clamp(v: number, lo: number, hi: number): number {
  if (!Number.isFinite(v)) return lo;
  return Math.max(lo, Math.min(hi, v));
}

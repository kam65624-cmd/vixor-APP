import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";

// ── Predictions Data (for predictions page) ────────────────────────
export const getPredictionsData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [{ data: analyses }, { data: signals }] = await Promise.all([
      supabase
        .from("analyses")
        .select(
          "id, pair, recommendation, confidence, pattern, trend, status, entry, stop_loss, take_profit, created_at, timeframe, reasons, risk_level",
        )
        .eq("user_id", userId)
        .eq("status", "complete")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("daily_signals")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    // Build predictions from analyses
    const analysisPredictions = (analyses || []).map((a) => ({
      id: a.id,
      source: "analysis" as const,
      pair: a.pair || "—",
      predictedDirection: a.recommendation || "WAIT",
      confidence: a.confidence ?? 0,
      pattern: a.pattern,
      trend: a.trend,
      entry: a.entry,
      stopLoss: a.stop_loss,
      takeProfit: a.take_profit,
      timeframe: a.timeframe,
      reasons: a.reasons,
      riskLevel: a.risk_level,
      createdAt: a.created_at,
      // No actual outcome data available — mark as pending
      outcome: null as string | null,
      correct: null as boolean | null,
    }));

    // Build predictions from daily_signals
    const signalPredictions = (signals || []).map((s) => ({
      id: s.id,
      source: "signal" as const,
      pair: s.pair,
      predictedDirection: s.recommendation,
      confidence: s.confidence,
      pattern: s.pattern,
      trend: null,
      entry: s.entry,
      stopLoss: s.stop_loss,
      takeProfit: s.take_profit,
      timeframe: s.timeframe,
      reasons: s.reasons,
      riskLevel: null,
      createdAt: s.created_at,
      outcome: null as string | null,
      correct: null as boolean | null,
    }));

    // Merge and sort by date
    const allPredictions = [...analysisPredictions, ...signalPredictions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const totalPredictions = allPredictions.length;
    const buyPredictions = allPredictions.filter((p) => p.predictedDirection === "BUY").length;
    const sellPredictions = allPredictions.filter((p) => p.predictedDirection === "SELL").length;
    const avgConfidence =
      totalPredictions > 0
        ? Math.round(allPredictions.reduce((s, p) => s + p.confidence, 0) / totalPredictions)
        : 0;

    const predictionsWithOutcome = allPredictions.filter((p) => p.correct !== null);
    const accuracy =
      predictionsWithOutcome.length > 0
        ? Math.round(
            (predictionsWithOutcome.filter((p) => p.correct).length /
              predictionsWithOutcome.length) *
              100,
          )
        : 0;

    return {
      predictions: allPredictions,
      totalPredictions,
      buyPredictions,
      sellPredictions,
      avgConfidence,
      accuracy,
    };
  });

// ── Alpha Signals Data ────────────────────────
export const getAlphaData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: signals } = await supabase
      .from("daily_signals")
      .select("*")
      .eq("recommendation", "BUY")
      .gte("confidence", 70)
      .order("confidence", { ascending: false })
      .limit(30);

    const { data: analyses } = await supabase
      .from("analyses")
      .select("*")
      .eq("user_id", userId)
      .eq("recommendation", "BUY")
      .eq("status", "complete")
      .gte("confidence", 70)
      .order("confidence", { ascending: false })
      .limit(20);

    const allSignals = signals || [];
    const allAnalyses = analyses || [];

    // Combine into a unified alpha feed
    const alphaFeed = [
      ...allSignals.map((s) => ({
        id: s.id,
        source: "signal" as const,
        pair: s.pair,
        confidence: s.confidence,
        pattern: s.pattern,
        entry: s.entry,
        stopLoss: s.stop_loss,
        takeProfit: s.take_profit,
        timeframe: s.timeframe,
        reasons: s.reasons,
        createdAt: s.created_at,
      })),
      ...allAnalyses.map((a) => ({
        id: a.id,
        source: "analysis" as const,
        pair: a.pair,
        confidence: a.confidence,
        pattern: a.pattern,
        entry: a.entry,
        stopLoss: a.stop_loss,
        takeProfit: a.take_profit,
        timeframe: a.timeframe,
        reasons: a.reasons,
        createdAt: a.created_at,
      })),
    ].sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));

    const avgConfidence =
      alphaFeed.length > 0
        ? Math.round(alphaFeed.reduce((s, a) => s + (a.confidence ?? 0), 0) / alphaFeed.length)
        : 0;
    const highestConf = alphaFeed.length > 0 ? (alphaFeed[0].confidence ?? 0) : 0;
    const highestPair = alphaFeed.length > 0 ? alphaFeed[0].pair : "—";

    return {
      alphaFeed,
      stats: {
        activeBuySignals: alphaFeed.length,
        avgConfidence,
        highestConfidence: highestConf,
        highestConfidencePair: highestPair,
        signalCount: allSignals.length,
        analysisCount: allAnalyses.length,
      },
    };
  });

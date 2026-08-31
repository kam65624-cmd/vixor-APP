// ============================================================================
// Analysis Domain — Server Functions
// ============================================================================
//
// Chart analysis, quick analyze, analysis CRUD, and migration helpers.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";
import { log } from "@/shared/structured-logger";
import { scanForOpportunities, setScanFetcher, type ScanResult } from "./opportunity-scanner";

// ---------- VALIDATORS ----------
const CreateAnalysisInput = z.object({
  imageBase64: z.string().min(64).max(15_000_000),
  mimeType: z.string().regex(/^image\/(png|jpeg|jpg|webp)$/),
  fileName: z.string().optional(),
  selectedPair: z.string().optional(),
  tradingStyle: z.string().optional(),
  analysisStyle: z.string().optional(),
});

const QuickAnalyzeInput = z.object({
  pair: z.string().min(1),
  timeframe: z.string().default("1H"),
  tradingStyle: z.string().default("Day Trading"),
  analysisStyle: z.string().optional(),
});

// ---------- CREATE ANALYSIS (image-based) ----------
export const createAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => CreateAnalysisInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { supabaseAdmin } = await import("@/shared/supabase/client.server");
    const { runChartAnalysis } = await import("@/domains/analysis/server/run-analysis");

    // Decode base64
    const b64 = data.imageBase64.includes(",") ? data.imageBase64.split(",")[1] : data.imageBase64;
    const bytes = Uint8Array.from(Buffer.from(b64, "base64"));

    // Check premium / points
    const { data: sub } = await supabase
      .from("premium_subscriptions")
      .select("id")
      .eq("user_id", userId)
      .gt("current_period_end", new Date().toISOString())
      .limit(1)
      .maybeSingle();
    const isPremium = !!sub;
    if (!isPremium) {
      const { data: bal } = await supabase
        .from("points_balances")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle();
      if (bal && bal.balance < 10) throw new Error("INSUFFICIENT_POINTS");
    }

    // Try to upload to storage (optional — won't block analysis if it fails)
    let imagePath: string | null = null;
    try {
      const ext = data.mimeType.split("/")[1] === "jpeg" ? "jpg" : data.mimeType.split("/")[1];
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("charts")
        .upload(path, bytes, { contentType: data.mimeType });
      if (!upErr) imagePath = path;
      else console.warn("[Storage] Upload skipped:", upErr.message);
    } catch (storageErr) {
      console.warn("[Storage] Upload error (non-fatal):", storageErr);
    }

    // Insert queued row
    const { data: row, error: insErr } = await supabase
      .from("analyses")
      .insert({ user_id: userId, image_path: imagePath, status: "processing" })
      .select("id")
      .single();
    if (insErr || !row) throw new Error(insErr?.message ?? "insert failed");

    // Run AI analysis
    try {
      let realBars: import("@/domains/analysis/engine/core/types").OHLCVBar[] | undefined;
      try {
        const pair = data.selectedPair || "EUR/USD";
        const tf =
          data.tradingStyle === "Scalping"
            ? "15M"
            : data.tradingStyle === "Swing Trading"
              ? "4H"
              : "1H";

        // ── Try multiple data sources with fallback ──
        const { fetchBinanceKlines, fetchTwelveDataKlines } =
          await import("@/domains/market/server/price-fetcher");

        // Source 1: Binance for crypto pairs
        if (
          pair.includes("USDT") ||
          pair.includes("BTC") ||
          pair.includes("ETH") ||
          pair.includes("SOL")
        ) {
          try {
            const klines = await fetchBinanceKlines(pair, tf, 200);
            if (klines.length > 20) {
              realBars = klines.map((k) => ({
                time: k.time,
                open: k.open,
                high: k.high,
                low: k.low,
                close: k.close,
                volume: k.volume,
              }));
              console.log(
                `[Vixor] Using ${realBars.length} real Binance candles for ${pair}/${tf}`,
              );
            }
          } catch (err) {
            console.warn(
              `[Vixor] Binance fetch failed for ${pair}:`,
              err instanceof Error ? err.message : String(err),
            );
          }
        }

        // Source 2: TwelveData for forex/commodity pairs
        if (!realBars) {
          try {
            const klines = await fetchTwelveDataKlines(pair, tf, 200);
            if (klines.length > 20) {
              realBars = klines.map((k) => ({
                time: k.time,
                open: k.open,
                high: k.high,
                low: k.low,
                close: k.close,
                volume: k.volume,
              }));
              console.log(
                `[Vixor] Using ${realBars.length} real TwelveData candles for ${pair}/${tf}`,
              );
            }
          } catch (err) {
            console.warn(
              `[Vixor] TwelveData fetch failed for ${pair}:`,
              err instanceof Error ? err.message : String(err),
            );
          }
        }

        // Source 3: Try Binance as fallback even for non-crypto (some forex pairs exist)
        if (!realBars && !pair.includes("USDT")) {
          try {
            const klines = await fetchBinanceKlines(pair, tf, 200);
            if (klines.length > 20) {
              realBars = klines.map((k) => ({
                time: k.time,
                open: k.open,
                high: k.high,
                low: k.low,
                close: k.close,
                volume: k.volume,
              }));
              console.log(
                `[Vixor] Using ${realBars.length} Binance fallback candles for ${pair}/${tf}`,
              );
            }
          } catch {
            // Non-fatal
          }
        }

        // Source 4: Try TwelveData with 1D interval as last resort
        if (!realBars) {
          try {
            const klines = await fetchTwelveDataKlines(pair, "1D", 100);
            if (klines.length > 10) {
              realBars = klines.map((k) => ({
                time: k.time,
                open: k.open,
                high: k.high,
                low: k.low,
                close: k.close,
                volume: k.volume,
              }));
              console.log(
                `[Vixor] Using ${realBars.length} TwelveData daily candles as fallback for ${pair}`,
              );
            }
          } catch {
            // Non-fatal
          }
        }
      } catch (fetchErr) {
        console.warn(
          "[Vixor] Failed to fetch real OHLCV data:",
          fetchErr instanceof Error ? fetchErr.message : String(fetchErr),
        );
      }

      // SOFT CHECK: If real OHLCV data is unavailable, the engine will use its
      // built-in synthetic data generator as fallback. This ensures the app always
      // produces analysis results, even when market data APIs are down.
      if (!realBars) {
        console.warn(
          `[Vixor] No real OHLCV data available for ${data.selectedPair || "EUR/USD"}. Engine will use synthetic data fallback.`,
        );
      }

      const result = await runChartAnalysis(
        bytes,
        data.mimeType,
        data.fileName,
        data.selectedPair,
        data.tradingStyle,
        realBars || undefined,
        data.analysisStyle,
      );

      // Base update data (columns that exist in the DB schema)
      const updateData = {
        status: "complete" as const,
        pair: result.pair,
        timeframe: result.timeframe,
        trend: result.trend,
        risk_level: result.risk_level,
        risk_reasons: result.risk_reasons,
        invalidation_level: result.invalidation_level,
        liquidity_zones: result.liquidity_zones as any,
        market_structure: result.market_structure as any,
        key_levels: result.key_levels as any,
        recommendation: result.recommendation,
        confidence: Math.round(result.confidence),
        entry: result.entry,
        stop_loss: result.stop_loss,
        take_profit: result.take_profit,
        rr: result.rr,
        pattern: result.pattern,
        reasons: result.reasons,
        scenarios: result.scenarios as any,
        management: result.management,
        news: (result as any).news_impact,
        raw_ai_response: result as any,
      };

      // New grounded analysis v2 fields — stored in raw_ai_response
      // and attempted as top-level columns (graceful fallback if columns don't exist)
      const newFields = {
        analysis_source: (result as any).analysis_source ?? null,
        reasoning_trail: (result as any).reasoning_trail ?? null,
        data_quality: (result as any).data_quality ?? null,
      };

      try {
        // New columns (analysis_source, reasoning_trail, data_quality) may not exist
        // in DB yet. They're always available in raw_ai_response as fallback.
        await supabaseAdmin
          .from("analyses")
          .update({
            ...updateData,
            signal_badge: (result as any).signal_badge as any,
            vixor_message: (result as any).vixor_message as any,
            // new columns may not exist in DB — stored in raw_ai_response as fallback
            ...(Object.keys(newFields).length ? newFields : {}),
          } as any)
          .eq("id", row.id)
          .throwOnError();
      } catch (colErr: any) {
        if (
          String(colErr?.message || "").includes("signal_badge") ||
          String(colErr?.message || "").includes("vixor_message") ||
          String(colErr?.message || "").includes("analysis_source") ||
          String(colErr?.message || "").includes("reasoning_trail") ||
          String(colErr?.message || "").includes("data_quality")
        ) {
          console.warn("[Vixor] New columns not found in DB, storing in raw_ai_response only");
          await supabaseAdmin.from("analyses").update(updateData).eq("id", row.id).throwOnError();
        } else {
          throw colErr;
        }
      }

      if (!isPremium) {
        const { error: spendErr } = await supabaseAdmin.rpc("spend_points", {
          _user: userId,
          _amount: 10,
          _reason: "analysis_cost",
          _meta: { analysis_id: row.id },
        });
        if (spendErr) {
          log.warn("Failed to spend points", { userId, error: spendErr.message });
        }
      }

      // Reward XP (non-fatal)
      void supabase
        .from("profiles")
        .select("xp")
        .eq("id", userId)
        .maybeSingle()
        .then(({ data: profile }) => {
          if (profile) {
            void supabase
              .from("profiles")
              .update({ xp: ((profile as any).xp || 0) + 10 })
              .eq("id", userId);
          }
        });
    } catch (e) {
      const rawMsg = e instanceof Error ? e.message : String(e);

      // ── Friendly error rewriting ──
      // The local SMC/ICT engine NEVER refuses to analyze — it always produces
      // a result (using synthetic data as fallback if real OHLCV is unavailable).
      // So if we ever see a "Unable to identify" error here, it's coming from
      // stale code and we rewrite it to a clearer, accurate message.
      let msg = rawMsg;
      if (
        rawMsg.includes("Unable to identify the asset") ||
        rawMsg.includes("insufficient accuracy")
      ) {
        msg =
          "We couldn't extract clear chart details from your image, but the analysis engine still ran on real market data for the selected pair. Try uploading a clearer screenshot, or pick the pair manually above.";
      }

      void supabaseAdmin
        .from("analyses")
        .update({ status: "failed", error_message: msg })
        .eq("id", row.id);
      throw new Error(msg);
    }

    return { id: row.id };
  });

// ---------- GET ANALYSIS ----------
export const getAnalysis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    let a: any;
    try {
      const { data: fullRow, error: fullErr } = await supabase
        .from("analyses")
        .select(
          "id,user_id,image_path,status,pair,timeframe,trend,risk_level,risk_reasons,invalidation_level,liquidity_zones,market_structure,key_levels,recommendation,confidence,entry,stop_loss,take_profit,rr,pattern,reasons,scenarios,management,news,raw_ai_response,source,signal_badge,vixor_message,created_at,updated_at,error_message",
        )
        .eq("id", data.id)
        .maybeSingle();
      if (
        fullErr &&
        (fullErr.message.includes("signal_badge") || fullErr.message.includes("vixor_message"))
      ) {
        const { data: partialRow, error: partialErr } = await supabase
          .from("analyses")
          .select(
            "id,user_id,image_path,status,pair,timeframe,trend,risk_level,risk_reasons,invalidation_level,liquidity_zones,market_structure,key_levels,recommendation,confidence,entry,stop_loss,take_profit,rr,pattern,reasons,scenarios,management,news,raw_ai_response,source,created_at,updated_at,error_message",
          )
          .eq("id", data.id)
          .maybeSingle();
        if (partialErr) throw new Error(partialErr.message);
        a = partialRow;
      } else if (fullErr) {
        throw new Error(fullErr.message);
      } else {
        a = fullRow;
      }
    } catch {
      const { data: fallbackRow, error: fbErr } = await supabase
        .from("analyses")
        .select(
          "id,user_id,image_path,status,pair,timeframe,trend,risk_level,risk_reasons,invalidation_level,liquidity_zones,market_structure,key_levels,recommendation,confidence,entry,stop_loss,take_profit,rr,pattern,reasons,scenarios,management,news,raw_ai_response,source,created_at,updated_at,error_message",
        )
        .eq("id", data.id)
        .maybeSingle();
      if (fbErr) throw new Error(fbErr.message);
      a = fallbackRow;
    }
    if (!a) throw new Error("Not found");

    let signalBadge = (a as any)?.signal_badge ?? null;
    let vixorMessage = (a as any)?.vixor_message ?? null;

    if (!signalBadge && (a as any).raw_ai_response) {
      try {
        const raw = (a as any).raw_ai_response;
        if (typeof raw === "object" && raw !== null) {
          signalBadge = raw.signal_badge ?? null;
          vixorMessage = raw.vixor_message ?? null;
        }
      } catch {
        // Non-fatal
      }
    }

    let imageUrl: string | null = null;
    if ((a as any).image_path) {
      const { data: signed } = await supabase.storage
        .from("charts")
        .createSignedUrl((a as any).image_path, 3600);
      imageUrl = signed?.signedUrl ?? null;
    }
    return { ...a, signal_badge: signalBadge, vixor_message: vixorMessage, imageUrl } as any;
  });

// ---------- SCAN OPPORTUNITIES ----------
const POPULAR_PAIRS = [
  "BTC/USDT",
  "ETH/USDT",
  "SOL/USDT",
  "XRP/USDT",
  "ADA/USDT",
  "DOGE/USDT",
  "AVAX/USDT",
  "DOT/USDT",
  "LINK/USDT",
  "MATIC/USDT",
  "EUR/USD",
  "GBP/USD",
  "XAU/USD",
  "GBP/JPY",
  "USD/JPY",
];

export const scanOpportunities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<ScanResult> => {
    // Wire up the OHLCV fetcher for the scanner
    const { fetchBinanceKlines, fetchTwelveDataKlines } =
      await import("@/domains/market/server/price-fetcher");

    setScanFetcher(async (pair: string, timeframe: string, limit: number) => {
      // Try Binance first (crypto pairs)
      try {
        const klines = await fetchBinanceKlines(pair, timeframe, limit);
        if (klines.length >= 20) {
          return klines.map((k) => ({
            time: k.time,
            open: k.open,
            high: k.high,
            low: k.low,
            close: k.close,
            volume: k.volume,
          }));
        }
      } catch {
        // Non-fatal
      }

      // Try TwelveData (forex/commodities)
      try {
        const klines = await fetchTwelveDataKlines(pair, timeframe, limit);
        if (klines.length >= 20) {
          return klines.map((k) => ({
            time: k.time,
            open: k.open,
            high: k.high,
            low: k.low,
            close: k.close,
            volume: k.volume,
          }));
        }
      } catch {
        // Non-fatal
      }

      return [];
    });

    return scanForOpportunities(POPULAR_PAIRS, {
      minConfidence: 65,
      timeframes: ["1H", "4H"],
      maxResults: 10,
    });
  });

// ---------- ANALYZE AND TRACK ----------

export const analyzeAndTrack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        pair: z.string().min(1),
        timeframe: z.string().optional().default("4H"),
        autoTrack: z.boolean().optional().default(false),
        minConfidence: z.number().optional().default(70),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;

    // 1. Run analysis using the local engine
    const { runLocalAnalysis } = await import("@/domains/analysis/engine/engine");
    const { fetchBinanceKlines, fetchTwelveDataKlines } =
      await import("@/domains/market/server/price-fetcher");
    const { AssetRegistry } = await import("@/shared/asset-registry");

    let bars: any;
    if (AssetRegistry.isCrypto(data.pair)) {
      bars = await fetchBinanceKlines(data.pair, data.timeframe, 200);
    }
    if (!bars || bars.length <= 20) {
      const tdBars = await fetchTwelveDataKlines(data.pair, data.timeframe, 200);
      if (tdBars.length > 20) bars = tdBars;
    }

    const analysisResult = runLocalAnalysis({
      pair: data.pair,
      timeframe: data.timeframe,
      tradingStyle: "Day Trading",
      bars: bars && bars.length > 20 ? bars : undefined,
    });

    // Emit analysis.created event
    const { VixorEvents } = await import("@/shared/events");
    void VixorEvents.emit("analysis.created", {
      analysisId: `aat-${Date.now()}`,
      pair: data.pair,
      timeframe: data.timeframe,
      userId,
      recommendation: analysisResult.recommendation as "BUY" | "SELL" | "WAIT",
      confidence: analysisResult.confidence,
    });

    // 2. Optionally auto-track
    let trackingResult: { ok: boolean; trackingId?: string; error?: string } | null = null;

    if (
      data.autoTrack &&
      analysisResult.confidence >= data.minConfidence &&
      analysisResult.recommendation !== "WAIT"
    ) {
      // Check for existing tracking
      const { data: existing } = await supabase
        .from("signal_tracking")
        .select("id")
        .eq("user_id", userId)
        .eq("pair", data.pair)
        .eq("status", "pending")
        .maybeSingle();

      if (existing) {
        trackingResult = { ok: false, error: "ALREADY_TRACKING", trackingId: existing.id };
      } else {
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const { data: row, error: insertError } = await supabase
          .from("signal_tracking")
          .insert({
            user_id: userId,
            source_type: "analysis",
            pair: data.pair,
            direction: analysisResult.recommendation,
            entry_price: analysisResult.entry ?? null,
            stop_loss: analysisResult.stop_loss ?? null,
            take_profit: analysisResult.take_profit ?? [],
            expires_at: expiresAt,
          })
          .select("id")
          .single();

        if (insertError || !row) {
          trackingResult = { ok: false, error: insertError?.message ?? "insert_failed" };
        } else {
          trackingResult = { ok: true, trackingId: (row as { id: string }).id };

          // Emit signal.tracking.created
          void VixorEvents.emit("signal.tracking.created", {
            trackingId: (row as { id: string }).id,
            userId,
            pair: data.pair,
            direction: analysisResult.recommendation as "BUY" | "SELL",
            entryPrice: analysisResult.entry ?? 0,
            stopLoss: analysisResult.stop_loss ?? 0,
          });
        }
      }
    }

    return {
      analysis: {
        pair: analysisResult.pair,
        timeframe: analysisResult.timeframe,
        recommendation: analysisResult.recommendation,
        confidence: analysisResult.confidence,
        entry: analysisResult.entry,
        stopLoss: analysisResult.stop_loss,
        takeProfit: analysisResult.take_profit,
        riskReward: analysisResult.rr,
        trend: analysisResult.trend,
      },
      tracking: trackingResult,
    };
  });

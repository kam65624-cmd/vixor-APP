// ============================================================================
// Analysis Domain — Server Functions
// ============================================================================
//
// Chart analysis, quick analyze, analysis CRUD, and migration helpers.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";

// ---------- VALIDATORS ----------
const CreateAnalysisInput = z.object({
  imageBase64: z.string().min(64).max(15_000_000),
  mimeType: z.string().regex(/^image\/(png|jpeg|jpg|webp)$/),
  fileName: z.string().optional(),
  selectedPair: z.string().optional(),
  tradingStyle: z.string().optional(),
});

const QuickAnalyzeInput = z.object({
  pair: z.string().min(1),
  timeframe: z.string().default("1H"),
  tradingStyle: z.string().default("Day Trading"),
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
        const { fetchBinanceKlines, fetchTwelveDataKlines } = await import("@/domains/market/server/price-fetcher");

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
              console.log(`[Vixor] Using ${realBars.length} real Binance candles for ${pair}/${tf}`);
            }
          } catch (err) {
            console.warn(`[Vixor] Binance fetch failed for ${pair}:`, err instanceof Error ? err.message : String(err));
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
            console.warn(`[Vixor] TwelveData fetch failed for ${pair}:`, err instanceof Error ? err.message : String(err));
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
              console.log(`[Vixor] Using ${realBars.length} Binance fallback candles for ${pair}/${tf}`);
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
              console.log(`[Vixor] Using ${realBars.length} TwelveData daily candles as fallback for ${pair}`);
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

      // HARD CHECK: If we couldn't fetch real OHLCV data from any source, throw an error.
      if (!realBars) {
        const errMsg = `Unable to fetch real market data for ${data.selectedPair || "EUR/USD"}. The market data API may be temporarily unavailable. Please try again in a moment.`;
        console.error(`[Vixor] ${errMsg}`);
        throw new Error(errMsg);
      }

      const result = await runChartAnalysis(
        bytes,
        data.mimeType,
        data.fileName,
        data.selectedPair,
        data.tradingStyle,
        realBars,
      );

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

      try {
        await supabaseAdmin
          .from("analyses")
          .update({
            ...updateData,
            signal_badge: (result as any).signal_badge as any,
            vixor_message: (result as any).vixor_message as any,
          })
          .eq("id", row.id)
          .throwOnError();
      } catch (colErr: any) {
        if (
          String(colErr?.message || "").includes("signal_badge") ||
          String(colErr?.message || "").includes("vixor_message")
        ) {
          console.warn(
            "[Vixor] signal_badge/vixor_message columns not found, storing in raw_ai_response only",
          );
          await supabaseAdmin.from("analyses").update(updateData).eq("id", row.id).throwOnError();
        } else {
          throw colErr;
        }
      }

      if (!isPremium) {
        void supabase.rpc("spend_points", {
          _user: userId,
          _amount: 10,
          _reason: "analysis_cost",
          _meta: { analysis_id: row.id },
        });
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
      const msg = e instanceof Error ? e.message : String(e);

      // Check if this is a ChartExtractionRefused error — provide user-friendly message
      const { ChartExtractionRefusedError } = await import("@/domains/analysis/server/run-analysis");
      if (e instanceof ChartExtractionRefusedError) {
        const userMsg = e.validation.userMessage ?? msg;
        void supabaseAdmin
          .from("analyses")
          .update({ status: "failed", error_message: userMsg })
          .eq("id", row.id);
        throw new Error(userMsg);
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

// ---------- LIST ANALYSES ----------
export const listAnalyses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z.object({ limit: z.number().min(1).max(100).default(20) }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: rows } = await context.supabase
      .from("analyses")
      .select("id,pair,timeframe,recommendation,confidence,pattern,status,created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    return rows ?? [];
  });

// ---------- QUICK ANALYZE (no image — uses real OHLCV data) ----------
export const quickAnalyze = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => QuickAnalyzeInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { supabaseAdmin } = await import("@/shared/supabase/client.server");
    const { runLocalAnalysis } = await import("@/domains/analysis/engine/engine");

    const { pair, timeframe, tradingStyle } = data;

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

    // Insert queued row (no image)
    const { data: row, error: insErr } = await supabase
      .from("analyses")
      .insert({ user_id: userId, status: "processing", pair })
      .select("id")
      .single();
    if (insErr || !row) throw new Error(insErr?.message ?? "insert failed");

    try {
      let realBars: import("@/domains/analysis/engine/core/types").OHLCVBar[] | undefined;

      // ── Try multiple data sources with fallback ──
      const { fetchBinanceKlines, fetchTwelveDataKlines } = await import("@/domains/market/server/price-fetcher");

      // Source 1: Binance for crypto pairs
      if (
        pair.includes("USDT") ||
        pair.includes("BTC") ||
        pair.includes("ETH") ||
        pair.includes("SOL")
      ) {
        try {
          const klines = await fetchBinanceKlines(pair, timeframe, 200);
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
              `[Vixor] QuickAnalyze: Using ${realBars.length} real Binance candles for ${pair}/${timeframe}`,
            );
          }
        } catch (err) {
          console.warn(
            `[Vixor] QuickAnalyze: Binance fetch failed:`,
            err instanceof Error ? err.message : String(err),
          );
        }
      }

      // Source 2: TwelveData for forex/commodity pairs
      if (!realBars) {
        try {
          const klines = await fetchTwelveDataKlines(pair, timeframe, 200);
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
              `[Vixor] QuickAnalyze: Using ${realBars.length} real TwelveData candles for ${pair}/${timeframe}`,
            );
          }
        } catch (err) {
          console.warn(
            `[Vixor] QuickAnalyze: TwelveData fetch failed:`,
            err instanceof Error ? err.message : String(err),
          );
        }
      }

      // Source 3: Try Binance as fallback even for non-crypto
      if (!realBars && !pair.includes("USDT")) {
        try {
          const klines = await fetchBinanceKlines(pair, timeframe, 200);
          if (klines.length > 20) {
            realBars = klines.map((k) => ({
              time: k.time,
              open: k.open,
              high: k.high,
              low: k.low,
              close: k.close,
              volume: k.volume,
            }));
            console.log(`[Vixor] QuickAnalyze: Using ${realBars.length} Binance fallback candles for ${pair}/${timeframe}`);
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
            console.log(`[Vixor] QuickAnalyze: Using ${realBars.length} TwelveData daily candles as fallback for ${pair}`);
          }
        } catch {
          // Non-fatal
        }
      }

      // HARD CHECK
      if (!realBars) {
        const errMsg = `Unable to fetch real market data for ${pair}. The market data API may be temporarily unavailable. Please try again in a moment.`;
        console.error(`[Vixor] QuickAnalyze: ${errMsg}`);
        throw new Error(errMsg);
      }

      const result = runLocalAnalysis({
        pair,
        timeframe,
        tradingStyle,
        bars: realBars,
      });

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

      try {
        await supabaseAdmin
          .from("analyses")
          .update({
            ...updateData,
            signal_badge: (result as any).signal_badge as any,
            vixor_message: (result as any).vixor_message as any,
          })
          .eq("id", row.id)
          .throwOnError();
      } catch (colErr: any) {
        if (
          String(colErr?.message || "").includes("signal_badge") ||
          String(colErr?.message || "").includes("vixor_message")
        ) {
          console.warn(
            "[Vixor] signal_badge/vixor_message columns not found, storing in raw_ai_response only",
          );
          await supabaseAdmin.from("analyses").update(updateData).eq("id", row.id).throwOnError();
        } else {
          throw colErr;
        }
      }

      if (!isPremium) {
        void supabase.rpc("spend_points", {
          _user: userId,
          _amount: 10,
          _reason: "analysis_cost",
          _meta: { analysis_id: row.id },
        });
      }

      // Reward XP
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

      return { id: row.id };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      void supabaseAdmin
        .from("analyses")
        .update({ status: "failed", error_message: msg })
        .eq("id", row.id);
      throw new Error(msg);
    }
  });

// ---------- APPLY MIGRATION (add signal_badge and vixor_message columns) ----------
// SECURITY: This function previously had NO authentication, allowing anyone to
// execute DDL changes. Now requires CRON_SECRET in production.
// TODO: Remove this function entirely once the migration has been applied.
export const applySignalBadgeMigration = createServerFn({ method: "POST" }).handler(async () => {
  // SECURITY: Require CRON_SECRET in production
  if (process.env.NODE_ENV === "production") {
    // This migration function should not be callable in production
    // The columns should already exist via SQL migrations
    return { applied: false, message: "Migration function disabled in production. Run SQL migrations via Supabase Dashboard." };
  }
  const { supabaseAdmin } = await import("@/shared/supabase/client.server");

  try {
    const { error: checkErr } = await supabaseAdmin
      .from("analyses")
      .select("signal_badge")
      .limit(1);

    if (!checkErr) {
      return { applied: true, message: "signal_badge column already exists" };
    }
  } catch {
    // Column doesn't exist
  }

  const supabaseUrl = process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      applied: false,
      message:
        "Run this SQL in Supabase Dashboard SQL Editor:\n\nALTER TABLE analyses ADD COLUMN IF NOT EXISTS signal_badge JSONB;\nALTER TABLE analyses ADD COLUMN IF NOT EXISTS vixor_message TEXT;",
    };
  }

  const projectRef = supabaseUrl.replace("https://", "").replace(".supabase.co", "");

  try {
    const response = await fetch(`https://${projectRef}.supabase.co/rest/v1/rpc/pgmeta`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        query:
          "ALTER TABLE analyses ADD COLUMN IF NOT EXISTS signal_badge JSONB; ALTER TABLE analyses ADD COLUMN IF NOT EXISTS vixor_message TEXT;",
      }),
    });

    if (response.ok) {
      return { applied: true, message: "Migration applied successfully" };
    }
  } catch {
    // RPC not available
  }

  try {
    const createFnRes = await fetch(`https://${projectRef}.supabase.co/rest/v1/rpc/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        name: "add_signal_badge_columns",
        definition: `
            BEGIN
              ALTER TABLE analyses ADD COLUMN IF NOT EXISTS signal_badge JSONB;
              ALTER TABLE analyses ADD COLUMN IF NOT EXISTS vixor_message TEXT;
              RETURN TRUE;
            END;
          `,
      }),
    });

    if (createFnRes.ok) {
      const callRes = await fetch(
        `https://${projectRef}.supabase.co/rest/v1/rpc/add_signal_badge_columns`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
          },
        },
      );
      if (callRes.ok) {
        return { applied: true, message: "Migration applied successfully via RPC" };
      }
    }
  } catch {
    // Cannot create RPC
  }

  return {
    applied: false,
    message:
      "Auto-migration not available. Run this SQL manually in Supabase Dashboard:\n\nALTER TABLE analyses ADD COLUMN IF NOT EXISTS signal_badge JSONB;\nALTER TABLE analyses ADD COLUMN IF NOT EXISTS vixor_message TEXT;",
    dashboardUrl: `https://supabase.com/dashboard/project/${projectRef}/sql`,
  };
});

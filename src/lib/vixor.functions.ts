import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------- ME / PROFILE ----------
export const getMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: balance }, { data: sub }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("points_balances").select("*").eq("user_id", userId).maybeSingle(),
      supabase
        .from("premium_subscriptions")
        .select("*, premium_plans(*)")
        .eq("user_id", userId)
        .gt("current_period_end", new Date().toISOString())
        .order("current_period_end", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    return {
      profile,
      balance: balance ?? { balance: 0, lifetime_earned: 0 },
      premium: sub,
      isPremium: !!sub,
    };
  });

// ---------- CATALOG ----------
export const getPointPacks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("point_packs")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    return data ?? [];
  });

export const getPremiumPlans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("premium_plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    return data ?? [];
  });

// ---------- PURCHASES (instant grant; no payments yet) ----------
export const purchasePack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ packId: z.string().min(1).max(64) }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: pack } = await supabaseAdmin
      .from("point_packs")
      .select("*")
      .eq("id", data.packId)
      .eq("is_active", true)
      .maybeSingle();
    if (!pack) throw new Error("Pack not found");
    const total = pack.points + (pack.bonus_points ?? 0);
    const { error } = await supabaseAdmin.rpc("credit_points", {
      _user: userId,
      _amount: total,
      _reason: "pack_purchase",
      _meta: { pack_id: pack.id, price_cents: pack.price_cents },
    });
    if (error) throw new Error(error.message);
    return { ok: true, credited: total };
  });

export const subscribePremium = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ planId: z.string().min(1).max(64) }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: plan } = await supabaseAdmin
      .from("premium_plans")
      .select("*")
      .eq("id", data.planId)
      .eq("is_active", true)
      .maybeSingle();
    if (!plan) throw new Error("Plan not found");
    const days = plan.interval === "year" ? 365 : 30;
    const periodEnd = new Date(Date.now() + days * 86400 * 1000).toISOString();
    const { error } = await supabaseAdmin.from("premium_subscriptions").insert({
      user_id: userId,
      plan_id: plan.id,
      status: "active",
      current_period_end: periodEnd,
    });
    if (error) throw new Error(error.message);
    return { ok: true, current_period_end: periodEnd };
  });

// ---------- ANALYSES ----------
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

export const createAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => CreateAnalysisInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { runChartAnalysis } = await import("@/server/run-analysis.server");

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
      // ── Fetch real OHLCV data for the analysis ──
      // This ensures the analysis is based on REAL market data, not generated fake data.
      // Without this, the local engine uses generateOHLCV() which produces deterministic
      // but FAKE prices that don't match the actual chart → user complaint: "analysis doesn't match chart"
      let realBars: import("@/lib/analysis/core/types").OHLCVBar[] | undefined;
      try {
        const pair = data.selectedPair || "EUR/USD";
        const tf = data.tradingStyle === "Scalping" ? "15M" : data.tradingStyle === "Swing Trading" ? "4H" : "1H";

        // Try Binance for crypto pairs
        if (pair.includes("USDT") || pair.includes("BTC") || pair.includes("ETH") || pair.includes("SOL")) {
          const { fetchBinanceKlines } = await import("@/server/price-fetcher.server");
          const klines = await fetchBinanceKlines(pair, tf, 200);
          if (klines.length > 20) {
            realBars = klines.map(k => ({ time: k.time, open: k.open, high: k.high, low: k.low, close: k.close, volume: k.volume }));
            console.log(`[Vixor] Using ${realBars.length} real Binance candles for ${pair}/${tf}`);
          }
        }

        // Try TwelveData for forex/commodity pairs (XAU/USD, EUR/USD, etc.)
        if (!realBars && (pair.includes("USD") || pair.includes("JPY") || pair.includes("GBP") || pair.includes("EUR") || pair.includes("AUD"))) {
          const { fetchTwelveDataKlines } = await import("@/server/price-fetcher.server");
          const klines = await fetchTwelveDataKlines(pair, tf, 200);
          if (klines.length > 20) {
            realBars = klines.map(k => ({ time: k.time, open: k.open, high: k.high, low: k.low, close: k.close, volume: k.volume }));
            console.log(`[Vixor] Using ${realBars.length} real TwelveData candles for ${pair}/${tf}`);
          }
        }
      } catch (fetchErr) {
        console.warn("[Vixor] Failed to fetch real OHLCV data, using generated data:", fetchErr instanceof Error ? fetchErr.message : String(fetchErr));
      }

      const result = await runChartAnalysis(bytes, data.mimeType, data.fileName, data.selectedPair, data.tradingStyle, realBars);

      // Build update object — only include columns that exist in the DB
      // signal_badge and vixor_message may not exist yet (migration pending)
      // They are always stored inside raw_ai_response as fallback
      const updateData: Record<string, any> = {
        status: "complete",
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

      // Try to include signal_badge and vixor_message as dedicated columns
      // If the migration hasn't been applied, this will fail gracefully
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
        // If signal_badge column doesn't exist, try without it
        if (String(colErr?.message || "").includes("signal_badge") || String(colErr?.message || "").includes("vixor_message")) {
          console.warn("[Vixor] signal_badge/vixor_message columns not found, storing in raw_ai_response only");
          await supabaseAdmin
            .from("analyses")
            .update(updateData)
            .eq("id", row.id)
            .throwOnError();
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
        }); // non-fatal
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
      void supabaseAdmin
        .from("analyses")
        .update({ status: "failed", error_message: msg })
        .eq("id", row.id);
      throw new Error(msg);
    }

    return { id: row.id };
  });

export const getAnalysis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    // Explicitly list columns to avoid errors if signal_badge/vixor_message columns don't exist yet
    const { data: a, error } = await supabase
      .from("analyses")
      .select("id,user_id,image_path,status,pair,timeframe,trend,risk_level,risk_reasons,invalidation_level,liquidity_zones,market_structure,key_levels,recommendation,confidence,entry,stop_loss,take_profit,rr,pattern,reasons,scenarios,management,news,raw_ai_response,source,created_at,updated_at,error_message")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!a) throw new Error("Not found");

    // Also try to get signal_badge and vixor_message if the columns exist
    let signalBadge = null;
    let vixorMessage = null;
    try {
      const { data: extra } = await supabase
        .from("analyses")
        .select("signal_badge,vixor_message")
        .eq("id", data.id)
        .maybeSingle();
      if (extra) {
        signalBadge = (extra as any).signal_badge ?? null;
        vixorMessage = (extra as any).vixor_message ?? null;
      }
    } catch {
      // Columns don't exist yet — will read from raw_ai_response
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

export const listAnalyses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ limit: z.number().min(1).max(100).default(20) }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { data: rows } = await context.supabase
      .from("analyses")
      .select("id,pair,timeframe,recommendation,confidence,pattern,status,created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    return rows ?? [];
  });

// ---------- NOTIFICATIONS ----------
export const listNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    return data ?? [];
  });

export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await context.supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .is("read_at", null);
    return { ok: true };
  });

// ---------- REFERRALS ----------
export const claimReferral = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ code: z.string().min(4).max(16).regex(/^[A-Z0-9]+$/) }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: me } = await supabase.from("profiles").select("referred_by").eq("id", userId).maybeSingle();
    if (me?.referred_by) throw new Error("Referral already applied");

    const { data: ref } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("referral_code", data.code)
      .maybeSingle();
    if (!ref || ref.id === userId) throw new Error("Invalid code");

    await supabaseAdmin.from("profiles").update({ referred_by: ref.id }).eq("id", userId);
    await supabaseAdmin.rpc("credit_points", { _user: userId, _amount: 15, _reason: "referral_bonus", _meta: { from: ref.id } });
    await supabaseAdmin.rpc("credit_points", { _user: ref.id, _amount: 25, _reason: "referral_bonus", _meta: { from: userId } });
    return { ok: true };
  });

export const getReferralStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { count } = await context.supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("referred_by", context.userId);
    return { count: count ?? 0 };
  });

// ---------- MARKET DATA ----------
export const getMarketNews = createServerFn({ method: "GET" })
  .validator((d: unknown) => z.object({ category: z.string().default("general") }).parse(d ?? {}))
  .handler(async ({ data }) => {
    const key = process.env.FINNHUB_API_KEY;
    if (!key) return [];
    try {
      const res = await fetch(`https://finnhub.io/api/v1/news?category=${data.category}&token=${key}`);
      if (!res.ok) return [];
      const dataJson = await res.json();
      if (!Array.isArray(dataJson)) return [];
      
      return dataJson.slice(0, 15).map((n: any) => ({
        id: n.id,
        title: n.headline,
        summary: n.summary,
        url: n.url,
        source: n.source,
        time: n.datetime * 1000,
        image: n.image
      }));
    } catch (e) {
      console.error("Finnhub Error:", e);
      return [];
    }
  });

// ---------- TELEGRAM INTEGRATION ----------
export const linkTelegramAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ initData: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) throw new Error("Server configuration error: missing bot token");

    // Dynamically import the server-only verifier to avoid Vite import protection errors in client bundle
    const { verifyTelegramInitData } = await import("@/server/telegram-verify.server");
    
    const user = verifyTelegramInitData(data.initData, botToken);
    if (!user) throw new Error("Invalid Telegram signature");

    const photoUrl = user.photo_url || null;
    const username = user.username || user.first_name || "Trader";

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        telegram_id: String(user.id) as any,
        telegram_username: username,
        telegram_photo_url: photoUrl
      })
      .eq("id", userId);

    if (error) throw new Error("Failed to link Telegram account");

    return { ok: true, telegram_username: username, telegram_photo_url: photoUrl };
  });

export const createStarsInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ packId: z.string(), amountStars: z.number() }).parse(d))
  .handler(async ({ data, context }) => {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) throw new Error("Bot token not configured");

    const payload = `${context.userId}_${data.packId}_${Date.now()}`;
    
    const res = await fetch(`https://api.telegram.org/bot${botToken}/createInvoiceLink`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Vixor Points",
        description: `Purchase Vixor Points Pack`,
        payload: payload,
        provider_token: "", // Empty for Stars
        currency: "XTR",
        prices: [{ label: "Points", amount: data.amountStars }]
      })
    });
    
    const result = await res.json();
    if (!result.ok) throw new Error(result.description || "Failed to create invoice");
    
    return { invoiceUrl: result.result };
  });

// ---------- PRICE ALERTS ----------
export const createAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({
    symbol: z.string().min(1),
    pair: z.string().min(1),
    condition: z.enum(["above", "below", "crosses_up", "crosses_down"]),
    targetPrice: z.number().positive(),
    currentPrice: z.number().optional(),
    note: z.string().max(200).optional(),
    timeframe: z.string().default("1H"),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { data: alert, error } = await supabase
      .from("price_alerts")
      .insert({
        user_id: userId,
        symbol: data.symbol,
        pair: data.pair,
        condition: data.condition,
        target_price: data.targetPrice,
        current_price: data.currentPrice ?? null,
        note: data.note ?? null,
        timeframe: data.timeframe,
        status: "active",
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return alert;
  });

export const listAlerts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({
    pair: z.string().optional(),
    status: z.enum(["active", "triggered", "cancelled"]).optional(),
  }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("price_alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (data.pair) query = query.eq("pair", data.pair);
    if (data.status) query = query.eq("status", data.status);
    else query = query.in("status", ["active", "triggered"]);

    const { data: alerts, error } = await query;
    if (error) throw new Error(error.message);
    return alerts ?? [];
  });

export const deleteAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ alertId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("price_alerts")
      .update({ status: "cancelled" })
      .eq("id", data.alertId)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const runAlertCheck = createServerFn({ method: "POST" })
  .handler(async () => {
    const { checkAllAlerts } = await import("@/server/alert-checker.server");
    return await checkAllAlerts();
  });

// ---------- QUICK ANALYZE (no image required — uses real OHLCV data) ----------
export const quickAnalyze = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => QuickAnalyzeInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { runLocalAnalysis } = await import("@/lib/analysis/engine");

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

    // Run analysis with real OHLCV data
    try {
      let realBars: import("@/lib/analysis/core/types").OHLCVBar[] | undefined;

      // Try Binance for crypto pairs
      if (pair.includes("USDT") || pair.includes("BTC") || pair.includes("ETH") || pair.includes("SOL")) {
        try {
          const { fetchBinanceKlines } = await import("@/server/price-fetcher.server");
          const klines = await fetchBinanceKlines(pair, timeframe, 200);
          if (klines.length > 20) {
            realBars = klines.map(k => ({ time: k.time, open: k.open, high: k.high, low: k.low, close: k.close, volume: k.volume }));
            console.log(`[Vixor] QuickAnalyze: Using ${realBars.length} real Binance candles for ${pair}/${timeframe}`);
          }
        } catch (err) {
          console.warn(`[Vixor] QuickAnalyze: Binance fetch failed:`, err instanceof Error ? err.message : String(err));
        }
      }

      // Try TwelveData for forex/commodity pairs
      if (!realBars && (pair.includes("USD") || pair.includes("JPY") || pair.includes("GBP") || pair.includes("EUR") || pair.includes("AUD"))) {
        try {
          const { fetchTwelveDataKlines } = await import("@/server/price-fetcher.server");
          const klines = await fetchTwelveDataKlines(pair, timeframe, 200);
          if (klines.length > 20) {
            realBars = klines.map(k => ({ time: k.time, open: k.open, high: k.high, low: k.low, close: k.close, volume: k.volume }));
            console.log(`[Vixor] QuickAnalyze: Using ${realBars.length} real TwelveData candles for ${pair}/${timeframe}`);
          }
        } catch (err) {
          console.warn(`[Vixor] QuickAnalyze: TwelveData fetch failed:`, err instanceof Error ? err.message : String(err));
        }
      }

      const result = runLocalAnalysis({
        pair,
        timeframe,
        tradingStyle,
        bars: realBars,
      });

      // Build update object
      const updateData: Record<string, any> = {
        status: "complete",
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

      // Try to include signal_badge and vixor_message as dedicated columns
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
        if (String(colErr?.message || "").includes("signal_badge") || String(colErr?.message || "").includes("vixor_message")) {
          console.warn("[Vixor] signal_badge/vixor_message columns not found, storing in raw_ai_response only");
          await supabaseAdmin
            .from("analyses")
            .update(updateData)
            .eq("id", row.id)
            .throwOnError();
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
export const applySignalBadgeMigration = createServerFn({ method: "POST" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Check if signal_badge column already exists by trying to select it
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

    // Try to apply the migration using the Supabase Management API
    const supabaseUrl = process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return {
        applied: false,
        message: "Run this SQL in Supabase Dashboard SQL Editor:\n\nALTER TABLE analyses ADD COLUMN IF NOT EXISTS signal_badge JSONB;\nALTER TABLE analyses ADD COLUMN IF NOT EXISTS vixor_message TEXT;",
      };
    }

    // Extract project reference from URL
    const projectRef = supabaseUrl.replace("https://", "").replace(".supabase.co", "");

    // Try Supabase Management API to run SQL
    // Note: This requires the service role key to have the necessary permissions
    try {
      const response = await fetch(`https://${projectRef}.supabase.co/rest/v1/rpc/exec_sql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": serviceRoleKey,
          "Authorization": `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          query: "ALTER TABLE analyses ADD COLUMN IF NOT EXISTS signal_badge JSONB; ALTER TABLE analyses ADD COLUMN IF NOT EXISTS vixor_message TEXT;",
        }),
      });

      if (response.ok) {
        return { applied: true, message: "Migration applied successfully" };
      }
    } catch {
      // RPC not available
    }

    return {
      applied: false,
      message: "Auto-migration not available. Run this SQL manually in Supabase Dashboard:\n\nALTER TABLE analyses ADD COLUMN IF NOT EXISTS signal_badge JSONB;\nALTER TABLE analyses ADD COLUMN IF NOT EXISTS vixor_message TEXT;",
      dashboardUrl: `https://supabase.com/dashboard/project/${projectRef}/sql`,
    };
  });

// ---------- MARKET PRICES (for dashboard) ----------
export const getMarketPrices = createServerFn({ method: "GET" })
  .handler(async () => {
    const { fetchPrices, POPULAR_PAIRS } = await import("@/server/price-fetcher.server");
    const pairs = POPULAR_PAIRS.map(p => p.pair);
    const results = await fetchPrices(pairs);
    return results;
  });

// ---------- OHLCV DATA (for charts page price bar) ----------
export const getOHLCV = createServerFn({ method: "GET" })
  .validator((d: unknown) => z.object({
    pair: z.string().min(1),
    interval: z.string().default("1H"),
  }).parse(d))
  .handler(async ({ data }) => {
    const { pair, interval } = data;

    // Try Binance for crypto pairs
    if (pair.includes("USDT") || pair.includes("BTC") || pair.includes("ETH") || pair.includes("SOL")) {
      try {
        const { fetchBinanceKlines } = await import("@/server/price-fetcher.server");
        const klines = await fetchBinanceKlines(pair, interval, 2);
        if (klines.length > 0) {
          const bar = klines[klines.length - 1];
          return {
            open: bar.open,
            high: bar.high,
            low: bar.low,
            close: bar.close,
            volume: bar.volume,
            source: "binance",
          };
        }
      } catch (err) {
        console.warn("[OHLCV] Binance fetch failed:", err instanceof Error ? err.message : String(err));
      }
    }

    // Try TwelveData for forex/commodity pairs
    try {
      const { fetchTwelveDataKlines } = await import("@/server/price-fetcher.server");
      const klines = await fetchTwelveDataKlines(pair, interval, 2);
      if (klines.length > 0) {
        const bar = klines[klines.length - 1];
        return {
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
          volume: bar.volume,
          source: "twelvedata",
        };
      }
    } catch (err) {
      console.warn("[OHLCV] TwelveData fetch failed:", err instanceof Error ? err.message : String(err));
    }

    // Fallback: return price data from market prices
    try {
      const { fetchPrice } = await import("@/server/price-fetcher.server");
      const priceData = await fetchPrice(pair);
      if (priceData) {
        return {
          open: priceData.price * (1 - Math.random() * 0.002),
          high: priceData.price * (1 + Math.random() * 0.005),
          low: priceData.price * (1 - Math.random() * 0.005),
          close: priceData.price,
          volume: 0,
          source: priceData.source,
        };
      }
    } catch {
      // Non-fatal
    }

    return null;
  });

// ---------- DAILY SIGNALS ----------
export const generateDailySignals = createServerFn({ method: "POST" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { fetchBinanceKlines } = await import("@/server/price-fetcher.server");
    const { runLocalAnalysis } = await import("@/lib/analysis/engine");

    const pairs = ["BTC/USDT", "ETH/USDT", "XAU/USD", "EUR/USD", "GBP/JPY", "SOL/USDT"];
    const timeframes = ["1H", "4H"];
    const today = new Date().toISOString().split("T")[0];

    let generated = 0;

    for (const pair of pairs) {
      for (const tf of timeframes) {
        try {
          // Try to get real OHLCV data
          let bars;
          if (pair.includes("USDT")) {
            bars = await fetchBinanceKlines(pair, tf, 200);
          }
          // Try TwelveData for forex/commodity pairs
          if (!bars || bars.length <= 20) {
            const { fetchTwelveDataKlines } = await import("@/server/price-fetcher.server");
            const tdBars = await fetchTwelveDataKlines(pair, tf, 200);
            if (tdBars.length > 20) bars = tdBars;
          }

          // Run local analysis (with real data if available)
          const result = runLocalAnalysis({
            pair,
            timeframe: tf,
            tradingStyle: "Day Trading",
            bars: bars && bars.length > 20 ? bars : undefined,
          });

          // Insert signal
          const { error } = await supabaseAdmin
            .from("daily_signals")
            .insert({
              pair,
              timeframe: tf,
              recommendation: result.recommendation,
              confidence: result.confidence,
              entry: result.entry,
              stop_loss: result.stop_loss,
              take_profit: result.take_profit,
              reasons: result.reasons,
              pattern: result.pattern,
              market_structure: result.market_structure as any,
              liquidity_zones: result.liquidity_zones as any,
              signal_date: today,
            });

          if (!error) generated++;
          else console.warn(`[Signals] Insert failed for ${pair}/${tf}:`, error.message);
        } catch (err) {
          console.warn(`[Signals] Failed for ${pair}/${tf}:`, err instanceof Error ? err.message : String(err));
        }
      }
    }

    return { generated, date: today };
  });

export const getDailySignals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({
    pair: z.string().optional(),
    timeframe: z.string().optional(),
    recommendation: z.enum(["BUY", "SELL", "WAIT"]).optional(),
  }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Get user's strategy preferences
    const { data: strategy } = await supabase
      .from("user_strategies")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    const today = new Date().toISOString().split("T")[0];
    let query = supabase
      .from("daily_signals")
      .select("*")
      .eq("signal_date", today)
      .order("confidence", { ascending: false })
      .limit(20);

    // Filter by user strategy pairs if available
    if (data.pair) {
      query = query.eq("pair", data.pair);
    } else if (strategy?.pairs && strategy.pairs.length > 0) {
      query = query.in("pair", strategy.pairs);
    }

    if (data.timeframe) query = query.eq("timeframe", data.timeframe);
    else if (strategy?.preferred_timeframes && strategy.preferred_timeframes.length > 0) {
      query = query.in("timeframe", strategy.preferred_timeframes);
    }

    if (data.recommendation) query = query.eq("recommendation", data.recommendation);

    const { data: signals, error } = await query;
    if (error) throw new Error(error.message);
    return signals ?? [];
  });

// ---------- USER STRATEGIES ----------
export const getUserStrategy = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_strategies")
      .select("*")
      .eq("user_id", context.userId)
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw new Error(error.message);

    // Return default strategy if none exists
    if (!data) {
      return {
        id: null,
        name: "Default Strategy",
        pairs: ["BTC/USDT", "ETH/USDT", "XAU/USD", "EUR/USD"],
        trading_style: "Day Trading",
        risk_tolerance: "MEDIUM",
        preferred_timeframes: ["1H", "4H"],
        is_active: true,
      };
    }
    return data;
  });

export const updateUserStrategy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({
    name: z.string().min(1).max(50).optional(),
    pairs: z.array(z.string()).optional(),
    tradingStyle: z.enum(["Scalping", "Day Trading", "Swing Trading"]).optional(),
    riskTolerance: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    preferredTimeframes: z.array(z.string()).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;

    // Check if strategy exists
    const { data: existing } = await supabase
      .from("user_strategies")
      .select("id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    const updateData: { name?: string; pairs?: string[]; trading_style?: string; risk_tolerance?: string; preferred_timeframes?: string[] } = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.pairs !== undefined) updateData.pairs = data.pairs;
    if (data.tradingStyle !== undefined) updateData.trading_style = data.tradingStyle;
    if (data.riskTolerance !== undefined) updateData.risk_tolerance = data.riskTolerance;
    if (data.preferredTimeframes !== undefined) updateData.preferred_timeframes = data.preferredTimeframes;

    if (existing) {
      const { error } = await supabase
        .from("user_strategies")
        .update(updateData)
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { ok: true };
    } else {
      const { error } = await supabase
        .from("user_strategies")
        .insert({
          user_id: userId,
          name: updateData.name,
          pairs: updateData.pairs,
          trading_style: updateData.trading_style,
          risk_tolerance: updateData.risk_tolerance,
          preferred_timeframes: updateData.preferred_timeframes,
        });
      if (error) throw new Error(error.message);
      return { ok: true };
    }
  });

// ---------- TWELVE DATA: EXCHANGE RATE ----------
export const getExchangeRate = createServerFn({ method: "GET" })
  .validator((d: unknown) => z.object({ symbol: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const { fetchExchangeRate } = await import("@/server/twelvedata.server");
    const result = await fetchExchangeRate(data.symbol);
    if (!result) throw new Error("Failed to fetch exchange rate");
    return result;
  });

// ---------- TWELVE DATA: CURRENCY CONVERSION ----------
export const convertCurrency = createServerFn({ method: "GET" })
  .validator((d: unknown) => z.object({
    symbol: z.string().min(1),
    amount: z.number().positive(),
  }).parse(d))
  .handler(async ({ data }) => {
    const { convertCurrency: tdConvert } = await import("@/server/twelvedata.server");
    const result = await tdConvert(data.symbol, data.amount);
    if (!result) throw new Error("Failed to convert currency");
    return result;
  });

// ---------- TWELVE DATA: ETFs DIRECTORY ----------
export const getETFsDirectory = createServerFn({ method: "GET" })
  .validator((d: unknown) => z.object({
    country: z.string().optional(),
    fund_family: z.string().optional(),
    fund_type: z.string().optional(),
    page: z.number().min(1).default(1).optional(),
    outputsize: z.number().min(1).max(50).default(20).optional(),
  }).parse(d ?? {}))
  .handler(async ({ data }) => {
    const { fetchETFsDirectory } = await import("@/server/twelvedata.server");
    const result = await fetchETFsDirectory(data);
    if (!result) return { count: 0, list: [] };
    return result;
  });

// ---------- TWELVE DATA: ETF SUMMARY ----------
export const getETFSummary = createServerFn({ method: "GET" })
  .validator((d: unknown) => z.object({ symbol: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const { fetchETFSummary } = await import("@/server/twelvedata.server");
    const result = await fetchETFSummary(data.symbol);
    if (!result) throw new Error("Failed to fetch ETF summary");
    return result;
  });

// ---------- TWELVE DATA: ETF PERFORMANCE ----------
export const getETFPerformance = createServerFn({ method: "GET" })
  .validator((d: unknown) => z.object({ symbol: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const { fetchETFPerformance } = await import("@/server/twelvedata.server");
    const result = await fetchETFPerformance(data.symbol);
    if (!result) throw new Error("Failed to fetch ETF performance");
    return result;
  });

// ---------- TWELVE DATA: ETF FULL DATA ----------
export const getETFFullData = createServerFn({ method: "GET" })
  .validator((d: unknown) => z.object({ symbol: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const { fetchETFFullData } = await import("@/server/twelvedata.server");
    const result = await fetchETFFullData(data.symbol);
    if (!result) throw new Error("Failed to fetch ETF full data");
    return result;
  });

// ---------- TWELVE DATA: CASH FLOW ----------
export const getCashFlow = createServerFn({ method: "GET" })
  .validator((d: unknown) => z.object({
    symbol: z.string().min(1),
    period: z.enum(["annual", "quarterly"]).default("quarterly"),
    outputsize: z.number().min(1).max(40).default(4),
  }).parse(d))
  .handler(async ({ data }) => {
    const { fetchCashFlow } = await import("@/server/twelvedata.server");
    const result = await fetchCashFlow(data);
    if (!result) throw new Error("Failed to fetch cash flow data");
    return result;
  });

// ---------- TWELVE DATA: EARNINGS ESTIMATE ----------
export const getEarningsEstimate = createServerFn({ method: "GET" })
  .validator((d: unknown) => z.object({ symbol: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const { fetchEarningsEstimate } = await import("@/server/twelvedata.server");
    const result = await fetchEarningsEstimate(data.symbol);
    if (!result) throw new Error("Failed to fetch earnings estimate");
    return result;
  });

// ---------- TWELVE DATA: EPS TREND ----------
export const getEPSTrend = createServerFn({ method: "GET" })
  .validator((d: unknown) => z.object({ symbol: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const { fetchEPSTrend } = await import("@/server/twelvedata.server");
    const result = await fetchEPSTrend(data.symbol);
    if (!result) throw new Error("Failed to fetch EPS trend");
    return result;
  });

// ---------- TWELVE DATA: GROWTH ESTIMATES ----------
export const getGrowthEstimates = createServerFn({ method: "GET" })
  .validator((d: unknown) => z.object({ symbol: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const { fetchGrowthEstimates } = await import("@/server/twelvedata.server");
    const result = await fetchGrowthEstimates(data.symbol);
    if (!result) throw new Error("Failed to fetch growth estimates");
    return result;
  });

// ---------- TWELVE DATA: STOCK FUNDAMENTALS (combined) ----------
export const getStockFundamentals = createServerFn({ method: "GET" })
  .validator((d: unknown) => z.object({ symbol: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const { fetchStockFundamentals } = await import("@/server/twelvedata.server");
    const result = await fetchStockFundamentals(data.symbol);
    return result;
  });

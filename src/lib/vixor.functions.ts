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
      const result = await runChartAnalysis(bytes, data.mimeType, data.fileName, data.selectedPair, data.tradingStyle);

      await supabaseAdmin
        .from("analyses")
        .update({
          status: "complete",
          pair: result.pair,
          timeframe: result.timeframe,
          trend: result.trend,
          risk_level: result.risk_level,
          risk_reasons: result.risk_reasons,
          invalidation_level: result.invalidation_level,
          liquidity_zones: result.liquidity_zones,
          market_structure: result.market_structure,
          key_levels: result.key_levels,
          recommendation: result.recommendation,
          confidence: Math.round(result.confidence),
          entry: result.entry,
          stop_loss: result.stop_loss,
          take_profit: result.take_profit,
          rr: result.rr,
          pattern: result.pattern,
          reasons: result.reasons,
          scenarios: result.scenarios,
          management: result.management,
          news: (result as any).news_impact,
          raw_ai_response: result as any,
        })
        .eq("id", row.id)
        .throwOnError();

      if (!isPremium) {
        await supabase.rpc("spend_points", {
          _user: userId,
          _amount: 10,
          _reason: "analysis_cost",
          _meta: { analysis_id: row.id },
        }).then(() => {}).catch(() => {}); // non-fatal
      }

      // Reward XP (non-fatal)
      supabase
        .from("profiles")
        .select("xp")
        .eq("id", userId)
        .maybeSingle()
        .then(({ data: profile }) => {
          if (profile) {
            supabase
              .from("profiles")
              .update({ xp: ((profile as any).xp || 0) + 10 })
              .eq("id", userId)
              .then(() => {}).catch(() => {});
          }
        })
        .catch(() => {});

    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await supabaseAdmin
        .from("analyses")
        .update({ status: "failed", error_message: msg })
        .eq("id", row.id)
        .then(() => {}).catch(() => {});
      throw new Error(msg);
    }

    return { id: row.id };
  });

export const getAnalysis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: a, error } = await supabase
      .from("analyses")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!a) throw new Error("Not found");

    let imageUrl: string | null = null;
    if (a.image_path) {
      const { data: signed } = await supabase.storage
        .from("charts")
        .createSignedUrl(a.image_path, 3600);
      imageUrl = signed?.signedUrl ?? null;
    }
    return { ...a, imageUrl };
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
        telegram_id: String(user.id),
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

// ---------- MARKET PRICES (for dashboard) ----------
export const getMarketPrices = createServerFn({ method: "GET" })
  .handler(async () => {
    const { fetchPrices, POPULAR_PAIRS } = await import("@/server/price-fetcher.server");
    const pairs = POPULAR_PAIRS.map(p => p.pair);
    const results = await fetchPrices(pairs);
    return results;
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
          // Try to get real OHLCV data from Binance for crypto pairs
          let bars;
          if (pair.includes("USDT")) {
            bars = await fetchBinanceKlines(pair, tf, 200);
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

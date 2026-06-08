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
      const result = await runChartAnalysis(bytes, data.mimeType, data.fileName, data.selectedPair);

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
          raw_ai_response: result,
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

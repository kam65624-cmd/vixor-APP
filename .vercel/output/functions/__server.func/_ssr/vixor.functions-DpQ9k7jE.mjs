import { c as createServerRpc } from "./createServerRpc-CfpnEBba.mjs";
import { c as createServerFn } from "./server-CRLpRGUh.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-C7dty81q.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import { o as object, c as string, n as number, _ as _enum, b as array } from "../_libs/zod.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "node:stream";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "async_hooks";
import "stream";
import "crypto";
import "../_libs/isbot.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
const getMe_createServerFn_handler = createServerRpc({
  id: "6ca79208ef9c4066dad6cd1a3ab1451e3040c7383cec027f6b92729ccc50c3d5",
  name: "getMe",
  filename: "src/lib/vixor.functions.ts"
}, (opts) => getMe.__executeServer(opts));
const getMe = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getMe_createServerFn_handler, async ({
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const [{
    data: profile
  }, {
    data: balance
  }, {
    data: sub
  }] = await Promise.all([supabase.from("profiles").select("*").eq("id", userId).maybeSingle(), supabase.from("points_balances").select("*").eq("user_id", userId).maybeSingle(), supabase.from("premium_subscriptions").select("*, premium_plans(*)").eq("user_id", userId).gt("current_period_end", (/* @__PURE__ */ new Date()).toISOString()).order("current_period_end", {
    ascending: false
  }).limit(1).maybeSingle()]);
  return {
    profile,
    balance: balance ?? {
      balance: 0,
      lifetime_earned: 0
    },
    premium: sub,
    isPremium: !!sub
  };
});
const getPointPacks_createServerFn_handler = createServerRpc({
  id: "cb296644a2f9a048d6bb4c16138ebd2b254738ba633107c33aa50f6c25675d9f",
  name: "getPointPacks",
  filename: "src/lib/vixor.functions.ts"
}, (opts) => getPointPacks.__executeServer(opts));
const getPointPacks = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getPointPacks_createServerFn_handler, async ({
  context
}) => {
  const {
    data
  } = await context.supabase.from("point_packs").select("*").eq("is_active", true).order("sort_order");
  return data ?? [];
});
const getPremiumPlans_createServerFn_handler = createServerRpc({
  id: "89b585d1d9fc395c1ff9793765fc5e5288ee79c251a8aa780da4b3027ea4b893",
  name: "getPremiumPlans",
  filename: "src/lib/vixor.functions.ts"
}, (opts) => getPremiumPlans.__executeServer(opts));
const getPremiumPlans = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getPremiumPlans_createServerFn_handler, async ({
  context
}) => {
  const {
    data
  } = await context.supabase.from("premium_plans").select("*").eq("is_active", true).order("sort_order");
  return data ?? [];
});
const purchasePack_createServerFn_handler = createServerRpc({
  id: "45dbf160bcf3e906c5305bd6589501c3ed28167a490ea94072a165bd2490ab51",
  name: "purchasePack",
  filename: "src/lib/vixor.functions.ts"
}, (opts) => purchasePack.__executeServer(opts));
const purchasePack = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).validator((d) => object({
  packId: string().min(1).max(64)
}).parse(d)).handler(purchasePack_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    userId
  } = context;
  const {
    supabaseAdmin
  } = await import("./client.server-C0IjiWLc.mjs");
  const {
    data: pack
  } = await supabaseAdmin.from("point_packs").select("*").eq("id", data.packId).eq("is_active", true).maybeSingle();
  if (!pack) throw new Error("Pack not found");
  const total = pack.points + (pack.bonus_points ?? 0);
  const {
    error
  } = await supabaseAdmin.rpc("credit_points", {
    _user: userId,
    _amount: total,
    _reason: "pack_purchase",
    _meta: {
      pack_id: pack.id,
      price_cents: pack.price_cents
    }
  });
  if (error) throw new Error(error.message);
  return {
    ok: true,
    credited: total
  };
});
const subscribePremium_createServerFn_handler = createServerRpc({
  id: "d22b0fb6c719a9163ecfe9e033b2d0efca5db2e3e0c5d955fc13eca336063508",
  name: "subscribePremium",
  filename: "src/lib/vixor.functions.ts"
}, (opts) => subscribePremium.__executeServer(opts));
const subscribePremium = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).validator((d) => object({
  planId: string().min(1).max(64)
}).parse(d)).handler(subscribePremium_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    userId
  } = context;
  const {
    supabaseAdmin
  } = await import("./client.server-C0IjiWLc.mjs");
  const {
    data: plan
  } = await supabaseAdmin.from("premium_plans").select("*").eq("id", data.planId).eq("is_active", true).maybeSingle();
  if (!plan) throw new Error("Plan not found");
  const days = plan.interval === "year" ? 365 : 30;
  const periodEnd = new Date(Date.now() + days * 86400 * 1e3).toISOString();
  const {
    error
  } = await supabaseAdmin.from("premium_subscriptions").insert({
    user_id: userId,
    plan_id: plan.id,
    status: "active",
    current_period_end: periodEnd
  });
  if (error) throw new Error(error.message);
  return {
    ok: true,
    current_period_end: periodEnd
  };
});
const CreateAnalysisInput = object({
  imageBase64: string().min(64).max(15e6),
  mimeType: string().regex(/^image\/(png|jpeg|jpg|webp)$/),
  fileName: string().optional(),
  selectedPair: string().optional(),
  tradingStyle: string().optional()
});
const createAnalysis_createServerFn_handler = createServerRpc({
  id: "b5c8229b29e46a8f81b244120156ed019e274415d4be41272d7106a370296687",
  name: "createAnalysis",
  filename: "src/lib/vixor.functions.ts"
}, (opts) => createAnalysis.__executeServer(opts));
const createAnalysis = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).validator((d) => CreateAnalysisInput.parse(d)).handler(createAnalysis_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    userId,
    supabase
  } = context;
  const {
    supabaseAdmin
  } = await import("./client.server-C0IjiWLc.mjs");
  const {
    runChartAnalysis
  } = await import("./run-analysis.server-D6ODySM9.mjs");
  const b64 = data.imageBase64.includes(",") ? data.imageBase64.split(",")[1] : data.imageBase64;
  const bytes = Uint8Array.from(Buffer.from(b64, "base64"));
  const {
    data: sub
  } = await supabase.from("premium_subscriptions").select("id").eq("user_id", userId).gt("current_period_end", (/* @__PURE__ */ new Date()).toISOString()).limit(1).maybeSingle();
  const isPremium = !!sub;
  if (!isPremium) {
    const {
      data: bal
    } = await supabase.from("points_balances").select("balance").eq("user_id", userId).maybeSingle();
    if (bal && bal.balance < 10) throw new Error("INSUFFICIENT_POINTS");
  }
  let imagePath = null;
  try {
    const ext = data.mimeType.split("/")[1] === "jpeg" ? "jpg" : data.mimeType.split("/")[1];
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const {
      error: upErr
    } = await supabase.storage.from("charts").upload(path, bytes, {
      contentType: data.mimeType
    });
    if (!upErr) imagePath = path;
    else console.warn("[Storage] Upload skipped:", upErr.message);
  } catch (storageErr) {
    console.warn("[Storage] Upload error (non-fatal):", storageErr);
  }
  const {
    data: row,
    error: insErr
  } = await supabase.from("analyses").insert({
    user_id: userId,
    image_path: imagePath,
    status: "processing"
  }).select("id").single();
  if (insErr || !row) throw new Error(insErr?.message ?? "insert failed");
  try {
    let realBars;
    try {
      const pair = data.selectedPair || "EUR/USD";
      const tf = data.tradingStyle === "Scalping" ? "15M" : data.tradingStyle === "Swing Trading" ? "4H" : "1H";
      if (pair.includes("USDT") || pair.includes("BTC") || pair.includes("ETH") || pair.includes("SOL")) {
        const {
          fetchBinanceKlines
        } = await import("./price-fetcher.server-DmN5aFU4.mjs");
        const klines = await fetchBinanceKlines(pair, tf, 200);
        if (klines.length > 20) {
          realBars = klines.map((k) => ({
            time: k.time,
            open: k.open,
            high: k.high,
            low: k.low,
            close: k.close,
            volume: k.volume
          }));
          console.log(`[Vixor] Using ${realBars.length} real Binance candles for ${pair}/${tf}`);
        }
      }
      if (!realBars && (pair.includes("USD") || pair.includes("JPY") || pair.includes("GBP") || pair.includes("EUR") || pair.includes("AUD"))) {
        const {
          fetchTwelveDataKlines
        } = await import("./price-fetcher.server-DmN5aFU4.mjs");
        const klines = await fetchTwelveDataKlines(pair, tf, 200);
        if (klines.length > 20) {
          realBars = klines.map((k) => ({
            time: k.time,
            open: k.open,
            high: k.high,
            low: k.low,
            close: k.close,
            volume: k.volume
          }));
          console.log(`[Vixor] Using ${realBars.length} real TwelveData candles for ${pair}/${tf}`);
        }
      }
    } catch (fetchErr) {
      console.warn("[Vixor] Failed to fetch real OHLCV data, using generated data:", fetchErr instanceof Error ? fetchErr.message : String(fetchErr));
    }
    const result = await runChartAnalysis(bytes, data.mimeType, data.fileName, data.selectedPair, data.tradingStyle, realBars);
    await supabaseAdmin.from("analyses").update({
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
      news: result.news_impact,
      signal_badge: result.signal_badge,
      vixor_message: result.vixor_message,
      raw_ai_response: result
    }).eq("id", row.id).throwOnError();
    if (!isPremium) {
      void supabase.rpc("spend_points", {
        _user: userId,
        _amount: 10,
        _reason: "analysis_cost",
        _meta: {
          analysis_id: row.id
        }
      });
    }
    void supabase.from("profiles").select("xp").eq("id", userId).maybeSingle().then(({
      data: profile
    }) => {
      if (profile) {
        void supabase.from("profiles").update({
          xp: (profile.xp || 0) + 10
        }).eq("id", userId);
      }
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    void supabaseAdmin.from("analyses").update({
      status: "failed",
      error_message: msg
    }).eq("id", row.id);
    throw new Error(msg);
  }
  return {
    id: row.id
  };
});
const getAnalysis_createServerFn_handler = createServerRpc({
  id: "b59bcf6511b3020036361dae2f1a70673f2541388682281eb563c430bddc81ee",
  name: "getAnalysis",
  filename: "src/lib/vixor.functions.ts"
}, (opts) => getAnalysis.__executeServer(opts));
const getAnalysis = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).validator((d) => object({
  id: string().uuid()
}).parse(d)).handler(getAnalysis_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase
  } = context;
  const {
    data: a,
    error
  } = await supabase.from("analyses").select("*").eq("id", data.id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!a) throw new Error("Not found");
  let imageUrl = null;
  if (a.image_path) {
    const {
      data: signed
    } = await supabase.storage.from("charts").createSignedUrl(a.image_path, 3600);
    imageUrl = signed?.signedUrl ?? null;
  }
  return {
    ...a,
    imageUrl
  };
});
const listAnalyses_createServerFn_handler = createServerRpc({
  id: "3e22292f15cabf364231519245a61d0a27aa8922c53737dbe4290036af679b61",
  name: "listAnalyses",
  filename: "src/lib/vixor.functions.ts"
}, (opts) => listAnalyses.__executeServer(opts));
const listAnalyses = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).validator((d) => object({
  limit: number().min(1).max(100).default(20)
}).parse(d ?? {})).handler(listAnalyses_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    data: rows
  } = await context.supabase.from("analyses").select("id,pair,timeframe,recommendation,confidence,pattern,status,created_at").order("created_at", {
    ascending: false
  }).limit(data.limit);
  return rows ?? [];
});
const listNotifications_createServerFn_handler = createServerRpc({
  id: "9e47b7f9d55d7174faabcd406baf936dc0572e9b4cf066e1daa5b71e3cc91794",
  name: "listNotifications",
  filename: "src/lib/vixor.functions.ts"
}, (opts) => listNotifications.__executeServer(opts));
const listNotifications = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(listNotifications_createServerFn_handler, async ({
  context
}) => {
  const {
    data
  } = await context.supabase.from("notifications").select("*").order("created_at", {
    ascending: false
  }).limit(50);
  return data ?? [];
});
const markAllNotificationsRead_createServerFn_handler = createServerRpc({
  id: "ee9b2b9c40e6b87e601e8a248236cf26d2076f053d0e449dbb552e0164b9b499",
  name: "markAllNotificationsRead",
  filename: "src/lib/vixor.functions.ts"
}, (opts) => markAllNotificationsRead.__executeServer(opts));
const markAllNotificationsRead = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(markAllNotificationsRead_createServerFn_handler, async ({
  context
}) => {
  await context.supabase.from("notifications").update({
    read_at: (/* @__PURE__ */ new Date()).toISOString()
  }).is("read_at", null);
  return {
    ok: true
  };
});
const claimReferral_createServerFn_handler = createServerRpc({
  id: "fc83294feba346665eb81f3ef3955fccc1a154ffdff6c6425c403c745950dfb2",
  name: "claimReferral",
  filename: "src/lib/vixor.functions.ts"
}, (opts) => claimReferral.__executeServer(opts));
const claimReferral = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).validator((d) => object({
  code: string().min(4).max(16).regex(/^[A-Z0-9]+$/)
}).parse(d)).handler(claimReferral_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    userId,
    supabase
  } = context;
  const {
    supabaseAdmin
  } = await import("./client.server-C0IjiWLc.mjs");
  const {
    data: me
  } = await supabase.from("profiles").select("referred_by").eq("id", userId).maybeSingle();
  if (me?.referred_by) throw new Error("Referral already applied");
  const {
    data: ref
  } = await supabaseAdmin.from("profiles").select("id").eq("referral_code", data.code).maybeSingle();
  if (!ref || ref.id === userId) throw new Error("Invalid code");
  await supabaseAdmin.from("profiles").update({
    referred_by: ref.id
  }).eq("id", userId);
  await supabaseAdmin.rpc("credit_points", {
    _user: userId,
    _amount: 15,
    _reason: "referral_bonus",
    _meta: {
      from: ref.id
    }
  });
  await supabaseAdmin.rpc("credit_points", {
    _user: ref.id,
    _amount: 25,
    _reason: "referral_bonus",
    _meta: {
      from: userId
    }
  });
  return {
    ok: true
  };
});
const getReferralStats_createServerFn_handler = createServerRpc({
  id: "1be115425d998b8b2f28b2d572d52b6b6eb1428db38069c10841ff9887ca5d9c",
  name: "getReferralStats",
  filename: "src/lib/vixor.functions.ts"
}, (opts) => getReferralStats.__executeServer(opts));
const getReferralStats = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getReferralStats_createServerFn_handler, async ({
  context
}) => {
  const {
    count
  } = await context.supabase.from("profiles").select("id", {
    count: "exact",
    head: true
  }).eq("referred_by", context.userId);
  return {
    count: count ?? 0
  };
});
const getMarketNews_createServerFn_handler = createServerRpc({
  id: "2a29fe47665b5c27b0e3e1992921497be92eb965d831b23d8095fbbc6637e705",
  name: "getMarketNews",
  filename: "src/lib/vixor.functions.ts"
}, (opts) => getMarketNews.__executeServer(opts));
const getMarketNews = createServerFn({
  method: "GET"
}).validator((d) => object({
  category: string().default("general")
}).parse(d ?? {})).handler(getMarketNews_createServerFn_handler, async ({
  data
}) => {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return [];
  try {
    const res = await fetch(`https://finnhub.io/api/v1/news?category=${data.category}&token=${key}`);
    if (!res.ok) return [];
    const dataJson = await res.json();
    if (!Array.isArray(dataJson)) return [];
    return dataJson.slice(0, 15).map((n) => ({
      id: n.id,
      title: n.headline,
      summary: n.summary,
      url: n.url,
      source: n.source,
      time: n.datetime * 1e3,
      image: n.image
    }));
  } catch (e) {
    console.error("Finnhub Error:", e);
    return [];
  }
});
const linkTelegramAccount_createServerFn_handler = createServerRpc({
  id: "ca08d6854b607c25e06525c403218138fa7247757a2c228ed077a64d3bff07e3",
  name: "linkTelegramAccount",
  filename: "src/lib/vixor.functions.ts"
}, (opts) => linkTelegramAccount.__executeServer(opts));
const linkTelegramAccount = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).validator((d) => object({
  initData: string()
}).parse(d)).handler(linkTelegramAccount_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    userId
  } = context;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) throw new Error("Server configuration error: missing bot token");
  const {
    verifyTelegramInitData
  } = await import("./telegram-verify.server-ChzSxnYq.mjs");
  const user = verifyTelegramInitData(data.initData, botToken);
  if (!user) throw new Error("Invalid Telegram signature");
  const photoUrl = user.photo_url || null;
  const username = user.username || user.first_name || "Trader";
  const {
    supabaseAdmin
  } = await import("./client.server-C0IjiWLc.mjs");
  const {
    error
  } = await supabaseAdmin.from("profiles").update({
    telegram_id: String(user.id),
    telegram_username: username,
    telegram_photo_url: photoUrl
  }).eq("id", userId);
  if (error) throw new Error("Failed to link Telegram account");
  return {
    ok: true,
    telegram_username: username,
    telegram_photo_url: photoUrl
  };
});
const createStarsInvoice_createServerFn_handler = createServerRpc({
  id: "687dd7b3cee4fe88a7de141690a0905638e455e8754ca3f86731a522e1a23dbe",
  name: "createStarsInvoice",
  filename: "src/lib/vixor.functions.ts"
}, (opts) => createStarsInvoice.__executeServer(opts));
const createStarsInvoice = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).validator((d) => object({
  packId: string(),
  amountStars: number()
}).parse(d)).handler(createStarsInvoice_createServerFn_handler, async ({
  data,
  context
}) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) throw new Error("Bot token not configured");
  const payload = `${context.userId}_${data.packId}_${Date.now()}`;
  const res = await fetch(`https://api.telegram.org/bot${botToken}/createInvoiceLink`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title: "Vixor Points",
      description: `Purchase Vixor Points Pack`,
      payload,
      provider_token: "",
      // Empty for Stars
      currency: "XTR",
      prices: [{
        label: "Points",
        amount: data.amountStars
      }]
    })
  });
  const result = await res.json();
  if (!result.ok) throw new Error(result.description || "Failed to create invoice");
  return {
    invoiceUrl: result.result
  };
});
const createAlert_createServerFn_handler = createServerRpc({
  id: "0a11415a236345a5ebe5a69699f9c9871943e5a282f1e85c6a98f65ce0f0c736",
  name: "createAlert",
  filename: "src/lib/vixor.functions.ts"
}, (opts) => createAlert.__executeServer(opts));
const createAlert = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).validator((d) => object({
  symbol: string().min(1),
  pair: string().min(1),
  condition: _enum(["above", "below", "crosses_up", "crosses_down"]),
  targetPrice: number().positive(),
  currentPrice: number().optional(),
  note: string().max(200).optional(),
  timeframe: string().default("1H")
}).parse(d)).handler(createAlert_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    userId,
    supabase
  } = context;
  const {
    data: alert,
    error
  } = await supabase.from("price_alerts").insert({
    user_id: userId,
    symbol: data.symbol,
    pair: data.pair,
    condition: data.condition,
    target_price: data.targetPrice,
    current_price: data.currentPrice ?? null,
    note: data.note ?? null,
    timeframe: data.timeframe,
    status: "active"
  }).select("*").single();
  if (error) throw new Error(error.message);
  return alert;
});
const listAlerts_createServerFn_handler = createServerRpc({
  id: "7cc883cd1ace66d82706afa98163780d2075e5c33882d7bb07dd029033521b27",
  name: "listAlerts",
  filename: "src/lib/vixor.functions.ts"
}, (opts) => listAlerts.__executeServer(opts));
const listAlerts = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).validator((d) => object({
  pair: string().optional(),
  status: _enum(["active", "triggered", "cancelled"]).optional()
}).parse(d ?? {})).handler(listAlerts_createServerFn_handler, async ({
  data,
  context
}) => {
  let query = context.supabase.from("price_alerts").select("*").order("created_at", {
    ascending: false
  }).limit(50);
  if (data.pair) query = query.eq("pair", data.pair);
  if (data.status) query = query.eq("status", data.status);
  else query = query.in("status", ["active", "triggered"]);
  const {
    data: alerts,
    error
  } = await query;
  if (error) throw new Error(error.message);
  return alerts ?? [];
});
const deleteAlert_createServerFn_handler = createServerRpc({
  id: "ab6bfd9651332911522df5fdd49d9790fa31369afa15d1650285119f067ab89a",
  name: "deleteAlert",
  filename: "src/lib/vixor.functions.ts"
}, (opts) => deleteAlert.__executeServer(opts));
const deleteAlert = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).validator((d) => object({
  alertId: string().uuid()
}).parse(d)).handler(deleteAlert_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    error
  } = await context.supabase.from("price_alerts").update({
    status: "cancelled"
  }).eq("id", data.alertId).eq("user_id", context.userId);
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
const runAlertCheck_createServerFn_handler = createServerRpc({
  id: "0361c258dc05de5eb14c6361a1e3bd8610f3397945d9c38679b4636fd2233e33",
  name: "runAlertCheck",
  filename: "src/lib/vixor.functions.ts"
}, (opts) => runAlertCheck.__executeServer(opts));
const runAlertCheck = createServerFn({
  method: "POST"
}).handler(runAlertCheck_createServerFn_handler, async () => {
  const {
    checkAllAlerts
  } = await import("./alert-checker.server-jE3FDn5-.mjs");
  return await checkAllAlerts();
});
const getMarketPrices_createServerFn_handler = createServerRpc({
  id: "fa093454c95b97a95dceb951789cba547f84c71829184a52caf95484955cc4a0",
  name: "getMarketPrices",
  filename: "src/lib/vixor.functions.ts"
}, (opts) => getMarketPrices.__executeServer(opts));
const getMarketPrices = createServerFn({
  method: "GET"
}).handler(getMarketPrices_createServerFn_handler, async () => {
  const {
    fetchPrices,
    POPULAR_PAIRS
  } = await import("./price-fetcher.server-DmN5aFU4.mjs");
  const pairs = POPULAR_PAIRS.map((p) => p.pair);
  const results = await fetchPrices(pairs);
  return results;
});
const generateDailySignals_createServerFn_handler = createServerRpc({
  id: "2978d5e40c17c47813ab54d63fe4eb0f3b3a512484bd02b357edbab52c160946",
  name: "generateDailySignals",
  filename: "src/lib/vixor.functions.ts"
}, (opts) => generateDailySignals.__executeServer(opts));
const generateDailySignals = createServerFn({
  method: "POST"
}).handler(generateDailySignals_createServerFn_handler, async () => {
  const {
    supabaseAdmin
  } = await import("./client.server-C0IjiWLc.mjs");
  const {
    fetchBinanceKlines
  } = await import("./price-fetcher.server-DmN5aFU4.mjs");
  const {
    runLocalAnalysis
  } = await import("./engine-xaDgdmy-.mjs");
  const pairs = ["BTC/USDT", "ETH/USDT", "XAU/USD", "EUR/USD", "GBP/JPY", "SOL/USDT"];
  const timeframes = ["1H", "4H"];
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  let generated = 0;
  for (const pair of pairs) {
    for (const tf of timeframes) {
      try {
        let bars;
        if (pair.includes("USDT")) {
          bars = await fetchBinanceKlines(pair, tf, 200);
        }
        if (!bars || bars.length <= 20) {
          const {
            fetchTwelveDataKlines
          } = await import("./price-fetcher.server-DmN5aFU4.mjs");
          const tdBars = await fetchTwelveDataKlines(pair, tf, 200);
          if (tdBars.length > 20) bars = tdBars;
        }
        const result = runLocalAnalysis({
          pair,
          timeframe: tf,
          tradingStyle: "Day Trading",
          bars: bars && bars.length > 20 ? bars : void 0
        });
        const {
          error
        } = await supabaseAdmin.from("daily_signals").insert({
          pair,
          timeframe: tf,
          recommendation: result.recommendation,
          confidence: result.confidence,
          entry: result.entry,
          stop_loss: result.stop_loss,
          take_profit: result.take_profit,
          reasons: result.reasons,
          pattern: result.pattern,
          market_structure: result.market_structure,
          liquidity_zones: result.liquidity_zones,
          signal_date: today
        });
        if (!error) generated++;
        else console.warn(`[Signals] Insert failed for ${pair}/${tf}:`, error.message);
      } catch (err) {
        console.warn(`[Signals] Failed for ${pair}/${tf}:`, err instanceof Error ? err.message : String(err));
      }
    }
  }
  return {
    generated,
    date: today
  };
});
const getDailySignals_createServerFn_handler = createServerRpc({
  id: "2250cae46d85fa6f8e51a4428b1f24ffd8281369cee51f60b8e3300317443853",
  name: "getDailySignals",
  filename: "src/lib/vixor.functions.ts"
}, (opts) => getDailySignals.__executeServer(opts));
const getDailySignals = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).validator((d) => object({
  pair: string().optional(),
  timeframe: string().optional(),
  recommendation: _enum(["BUY", "SELL", "WAIT"]).optional()
}).parse(d ?? {})).handler(getDailySignals_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    data: strategy
  } = await supabase.from("user_strategies").select("*").eq("user_id", userId).eq("is_active", true).maybeSingle();
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  let query = supabase.from("daily_signals").select("*").eq("signal_date", today).order("confidence", {
    ascending: false
  }).limit(20);
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
  const {
    data: signals,
    error
  } = await query;
  if (error) throw new Error(error.message);
  return signals ?? [];
});
const getUserStrategy_createServerFn_handler = createServerRpc({
  id: "0222c4a5f76333bcef66ddb14d20976005903d41a3839f13743d3c855f3e7abc",
  name: "getUserStrategy",
  filename: "src/lib/vixor.functions.ts"
}, (opts) => getUserStrategy.__executeServer(opts));
const getUserStrategy = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getUserStrategy_createServerFn_handler, async ({
  context
}) => {
  const {
    data,
    error
  } = await context.supabase.from("user_strategies").select("*").eq("user_id", context.userId).eq("is_active", true).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) {
    return {
      id: null,
      name: "Default Strategy",
      pairs: ["BTC/USDT", "ETH/USDT", "XAU/USD", "EUR/USD"],
      trading_style: "Day Trading",
      risk_tolerance: "MEDIUM",
      preferred_timeframes: ["1H", "4H"],
      is_active: true
    };
  }
  return data;
});
const updateUserStrategy_createServerFn_handler = createServerRpc({
  id: "6087d62e084d263168dfde2c2e7ff1473a610920324376ab44b08717c96ac529",
  name: "updateUserStrategy",
  filename: "src/lib/vixor.functions.ts"
}, (opts) => updateUserStrategy.__executeServer(opts));
const updateUserStrategy = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).validator((d) => object({
  name: string().min(1).max(50).optional(),
  pairs: array(string()).optional(),
  tradingStyle: _enum(["Scalping", "Day Trading", "Swing Trading"]).optional(),
  riskTolerance: _enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  preferredTimeframes: array(string()).optional()
}).parse(d)).handler(updateUserStrategy_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    userId,
    supabase
  } = context;
  const {
    data: existing
  } = await supabase.from("user_strategies").select("id").eq("user_id", userId).eq("is_active", true).maybeSingle();
  const updateData = {};
  if (data.name !== void 0) updateData.name = data.name;
  if (data.pairs !== void 0) updateData.pairs = data.pairs;
  if (data.tradingStyle !== void 0) updateData.trading_style = data.tradingStyle;
  if (data.riskTolerance !== void 0) updateData.risk_tolerance = data.riskTolerance;
  if (data.preferredTimeframes !== void 0) updateData.preferred_timeframes = data.preferredTimeframes;
  if (existing) {
    const {
      error
    } = await supabase.from("user_strategies").update(updateData).eq("id", existing.id);
    if (error) throw new Error(error.message);
    return {
      ok: true
    };
  } else {
    const {
      error
    } = await supabase.from("user_strategies").insert({
      user_id: userId,
      name: updateData.name,
      pairs: updateData.pairs,
      trading_style: updateData.trading_style,
      risk_tolerance: updateData.risk_tolerance,
      preferred_timeframes: updateData.preferred_timeframes
    });
    if (error) throw new Error(error.message);
    return {
      ok: true
    };
  }
});
const getExchangeRate_createServerFn_handler = createServerRpc({
  id: "42ad4fa8fac4f53c13979fd2de764a0d7673abae5a07b08e1128bf3d49aff281",
  name: "getExchangeRate",
  filename: "src/lib/vixor.functions.ts"
}, (opts) => getExchangeRate.__executeServer(opts));
const getExchangeRate = createServerFn({
  method: "GET"
}).validator((d) => object({
  symbol: string().min(1)
}).parse(d)).handler(getExchangeRate_createServerFn_handler, async ({
  data
}) => {
  const {
    fetchExchangeRate
  } = await import("./twelvedata.server-CsSmrfI3.mjs");
  const result = await fetchExchangeRate(data.symbol);
  if (!result) throw new Error("Failed to fetch exchange rate");
  return result;
});
const convertCurrency_createServerFn_handler = createServerRpc({
  id: "3704c4ae5dc84daff150b56423fdce5e5bdeeb750b6dad59cd4427b9594feee9",
  name: "convertCurrency",
  filename: "src/lib/vixor.functions.ts"
}, (opts) => convertCurrency.__executeServer(opts));
const convertCurrency = createServerFn({
  method: "GET"
}).validator((d) => object({
  symbol: string().min(1),
  amount: number().positive()
}).parse(d)).handler(convertCurrency_createServerFn_handler, async ({
  data
}) => {
  const {
    convertCurrency: tdConvert
  } = await import("./twelvedata.server-CsSmrfI3.mjs");
  const result = await tdConvert(data.symbol, data.amount);
  if (!result) throw new Error("Failed to convert currency");
  return result;
});
const getETFsDirectory_createServerFn_handler = createServerRpc({
  id: "a993c7a7b00b2e84385012d692044a9a86734f381b116787164a2d533378bdb5",
  name: "getETFsDirectory",
  filename: "src/lib/vixor.functions.ts"
}, (opts) => getETFsDirectory.__executeServer(opts));
const getETFsDirectory = createServerFn({
  method: "GET"
}).validator((d) => object({
  country: string().optional(),
  fund_family: string().optional(),
  fund_type: string().optional(),
  page: number().min(1).default(1).optional(),
  outputsize: number().min(1).max(50).default(20).optional()
}).parse(d ?? {})).handler(getETFsDirectory_createServerFn_handler, async ({
  data
}) => {
  const {
    fetchETFsDirectory
  } = await import("./twelvedata.server-CsSmrfI3.mjs");
  const result = await fetchETFsDirectory(data);
  if (!result) return {
    count: 0,
    list: []
  };
  return result;
});
const getETFSummary_createServerFn_handler = createServerRpc({
  id: "14e3ec1e54b76e21b015af136401f08e3b4e04333fe72e8e4dc7e4da13483d18",
  name: "getETFSummary",
  filename: "src/lib/vixor.functions.ts"
}, (opts) => getETFSummary.__executeServer(opts));
const getETFSummary = createServerFn({
  method: "GET"
}).validator((d) => object({
  symbol: string().min(1)
}).parse(d)).handler(getETFSummary_createServerFn_handler, async ({
  data
}) => {
  const {
    fetchETFSummary
  } = await import("./twelvedata.server-CsSmrfI3.mjs");
  const result = await fetchETFSummary(data.symbol);
  if (!result) throw new Error("Failed to fetch ETF summary");
  return result;
});
const getETFPerformance_createServerFn_handler = createServerRpc({
  id: "097624e72a52651a46efbca692ba9e81c94030a4487fcef364565d2b61f186dc",
  name: "getETFPerformance",
  filename: "src/lib/vixor.functions.ts"
}, (opts) => getETFPerformance.__executeServer(opts));
const getETFPerformance = createServerFn({
  method: "GET"
}).validator((d) => object({
  symbol: string().min(1)
}).parse(d)).handler(getETFPerformance_createServerFn_handler, async ({
  data
}) => {
  const {
    fetchETFPerformance
  } = await import("./twelvedata.server-CsSmrfI3.mjs");
  const result = await fetchETFPerformance(data.symbol);
  if (!result) throw new Error("Failed to fetch ETF performance");
  return result;
});
const getETFFullData_createServerFn_handler = createServerRpc({
  id: "37a41c096bde66f0a44fc7c5139c720d8b02237d98d39d65e2a49d622a983ab7",
  name: "getETFFullData",
  filename: "src/lib/vixor.functions.ts"
}, (opts) => getETFFullData.__executeServer(opts));
const getETFFullData = createServerFn({
  method: "GET"
}).validator((d) => object({
  symbol: string().min(1)
}).parse(d)).handler(getETFFullData_createServerFn_handler, async ({
  data
}) => {
  const {
    fetchETFFullData
  } = await import("./twelvedata.server-CsSmrfI3.mjs");
  const result = await fetchETFFullData(data.symbol);
  if (!result) throw new Error("Failed to fetch ETF full data");
  return result;
});
const getCashFlow_createServerFn_handler = createServerRpc({
  id: "f6aecc3762761e217bda8ebeb2e88f2f38c5b1ed41b817b9e87d0bdfb905ad7f",
  name: "getCashFlow",
  filename: "src/lib/vixor.functions.ts"
}, (opts) => getCashFlow.__executeServer(opts));
const getCashFlow = createServerFn({
  method: "GET"
}).validator((d) => object({
  symbol: string().min(1),
  period: _enum(["annual", "quarterly"]).default("quarterly"),
  outputsize: number().min(1).max(40).default(4)
}).parse(d)).handler(getCashFlow_createServerFn_handler, async ({
  data
}) => {
  const {
    fetchCashFlow
  } = await import("./twelvedata.server-CsSmrfI3.mjs");
  const result = await fetchCashFlow(data);
  if (!result) throw new Error("Failed to fetch cash flow data");
  return result;
});
const getEarningsEstimate_createServerFn_handler = createServerRpc({
  id: "129b4ee99e0e545d6235f131340b9ef036b8e1573adc6023a38b20723782cc6b",
  name: "getEarningsEstimate",
  filename: "src/lib/vixor.functions.ts"
}, (opts) => getEarningsEstimate.__executeServer(opts));
const getEarningsEstimate = createServerFn({
  method: "GET"
}).validator((d) => object({
  symbol: string().min(1)
}).parse(d)).handler(getEarningsEstimate_createServerFn_handler, async ({
  data
}) => {
  const {
    fetchEarningsEstimate
  } = await import("./twelvedata.server-CsSmrfI3.mjs");
  const result = await fetchEarningsEstimate(data.symbol);
  if (!result) throw new Error("Failed to fetch earnings estimate");
  return result;
});
const getEPSTrend_createServerFn_handler = createServerRpc({
  id: "43c431402a1e938a0fa881732eba5f430f2f20d699a1a20d146747fa8b9791a4",
  name: "getEPSTrend",
  filename: "src/lib/vixor.functions.ts"
}, (opts) => getEPSTrend.__executeServer(opts));
const getEPSTrend = createServerFn({
  method: "GET"
}).validator((d) => object({
  symbol: string().min(1)
}).parse(d)).handler(getEPSTrend_createServerFn_handler, async ({
  data
}) => {
  const {
    fetchEPSTrend
  } = await import("./twelvedata.server-CsSmrfI3.mjs");
  const result = await fetchEPSTrend(data.symbol);
  if (!result) throw new Error("Failed to fetch EPS trend");
  return result;
});
const getGrowthEstimates_createServerFn_handler = createServerRpc({
  id: "0a4880e8d7693e27bb440efbdfef044c9d241436791a926b82a53d1cc80474bd",
  name: "getGrowthEstimates",
  filename: "src/lib/vixor.functions.ts"
}, (opts) => getGrowthEstimates.__executeServer(opts));
const getGrowthEstimates = createServerFn({
  method: "GET"
}).validator((d) => object({
  symbol: string().min(1)
}).parse(d)).handler(getGrowthEstimates_createServerFn_handler, async ({
  data
}) => {
  const {
    fetchGrowthEstimates
  } = await import("./twelvedata.server-CsSmrfI3.mjs");
  const result = await fetchGrowthEstimates(data.symbol);
  if (!result) throw new Error("Failed to fetch growth estimates");
  return result;
});
const getStockFundamentals_createServerFn_handler = createServerRpc({
  id: "d33a41d5f3dbd0fa5426a4de7573d8ae1abd7cfc2651518646902dff486305bf",
  name: "getStockFundamentals",
  filename: "src/lib/vixor.functions.ts"
}, (opts) => getStockFundamentals.__executeServer(opts));
const getStockFundamentals = createServerFn({
  method: "GET"
}).validator((d) => object({
  symbol: string().min(1)
}).parse(d)).handler(getStockFundamentals_createServerFn_handler, async ({
  data
}) => {
  const {
    fetchStockFundamentals
  } = await import("./twelvedata.server-CsSmrfI3.mjs");
  const result = await fetchStockFundamentals(data.symbol);
  return result;
});
export {
  claimReferral_createServerFn_handler,
  convertCurrency_createServerFn_handler,
  createAlert_createServerFn_handler,
  createAnalysis_createServerFn_handler,
  createStarsInvoice_createServerFn_handler,
  deleteAlert_createServerFn_handler,
  generateDailySignals_createServerFn_handler,
  getAnalysis_createServerFn_handler,
  getCashFlow_createServerFn_handler,
  getDailySignals_createServerFn_handler,
  getEPSTrend_createServerFn_handler,
  getETFFullData_createServerFn_handler,
  getETFPerformance_createServerFn_handler,
  getETFSummary_createServerFn_handler,
  getETFsDirectory_createServerFn_handler,
  getEarningsEstimate_createServerFn_handler,
  getExchangeRate_createServerFn_handler,
  getGrowthEstimates_createServerFn_handler,
  getMarketNews_createServerFn_handler,
  getMarketPrices_createServerFn_handler,
  getMe_createServerFn_handler,
  getPointPacks_createServerFn_handler,
  getPremiumPlans_createServerFn_handler,
  getReferralStats_createServerFn_handler,
  getStockFundamentals_createServerFn_handler,
  getUserStrategy_createServerFn_handler,
  linkTelegramAccount_createServerFn_handler,
  listAlerts_createServerFn_handler,
  listAnalyses_createServerFn_handler,
  listNotifications_createServerFn_handler,
  markAllNotificationsRead_createServerFn_handler,
  purchasePack_createServerFn_handler,
  runAlertCheck_createServerFn_handler,
  subscribePremium_createServerFn_handler,
  updateUserStrategy_createServerFn_handler
};

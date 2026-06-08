import { c as createServerRpc } from "./createServerRpc-BHz3-G67.mjs";
import { c as createServerFn } from "./server-DgZVuMzr.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-C9iXm7zZ.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import { o as object, c as string, n as number } from "../_libs/zod.mjs";
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
  trading_style: string().optional()
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
  } = await import("./run-analysis.server-EeYno8_s.mjs");
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
    const result = await runChartAnalysis(bytes, data.mimeType, data.fileName, data.selectedPair, data.trading_style);
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
      raw_ai_response: result
    }).eq("id", row.id).throwOnError();
    if (!isPremium) {
      await supabase.rpc("spend_points", {
        _user: userId,
        _amount: 10,
        _reason: "analysis_cost",
        _meta: {
          analysis_id: row.id
        }
      }).then(() => {
      }).catch(() => {
      });
    }
    supabase.from("profiles").select("xp").eq("id", userId).maybeSingle().then(({
      data: profile
    }) => {
      if (profile) {
        supabase.from("profiles").update({
          xp: (profile.xp || 0) + 10
        }).eq("id", userId).then(() => {
        }).catch(() => {
        });
      }
    }).catch(() => {
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabaseAdmin.from("analyses").update({
      status: "failed",
      error_message: msg
    }).eq("id", row.id).then(() => {
    }).catch(() => {
    });
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
export {
  claimReferral_createServerFn_handler,
  createAnalysis_createServerFn_handler,
  createStarsInvoice_createServerFn_handler,
  getAnalysis_createServerFn_handler,
  getMarketNews_createServerFn_handler,
  getMe_createServerFn_handler,
  getPointPacks_createServerFn_handler,
  getPremiumPlans_createServerFn_handler,
  getReferralStats_createServerFn_handler,
  linkTelegramAccount_createServerFn_handler,
  listAnalyses_createServerFn_handler,
  listNotifications_createServerFn_handler,
  markAllNotificationsRead_createServerFn_handler,
  purchasePack_createServerFn_handler,
  subscribePremium_createServerFn_handler
};

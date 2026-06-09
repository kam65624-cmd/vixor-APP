import { fetchPrice } from "./price-fetcher.server-B6Qlu9qv.mjs";
function isConditionMet(condition, currentPrice, targetPrice, previousPrice) {
  switch (condition) {
    case "above":
      return currentPrice >= targetPrice;
    case "below":
      return currentPrice <= targetPrice;
    case "crosses_up":
      if (previousPrice === null) return currentPrice >= targetPrice;
      return currentPrice >= targetPrice && previousPrice < targetPrice;
    case "crosses_down":
      if (previousPrice === null) return currentPrice <= targetPrice;
      return currentPrice <= targetPrice && previousPrice > targetPrice;
    default:
      return false;
  }
}
function formatCondition(condition) {
  const map = {
    above: "ABOVE",
    below: "BELOW",
    crosses_up: "CROSSES UP above",
    crosses_down: "CROSSES DOWN below"
  };
  return map[condition] || condition;
}
function formatAlertPrice(price, pair) {
  if (pair.includes("JPY") || pair === "XAU/USD" || pair.includes("USDT") || pair.includes("USD")) {
    return price.toLocaleString(void 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return price.toFixed(4);
}
async function sendTelegramAlert(botToken, chatId, alert, currentPrice) {
  const conditionText = formatCondition(alert.condition);
  const priceStr = formatAlertPrice(alert.target_price, alert.pair);
  const currentStr = formatAlertPrice(currentPrice, alert.pair);
  const text = `🔔 <b>Price Alert Triggered!</b>

<b>${alert.pair}</b> is now ${conditionText} <b>$${priceStr}</b>

📊 Target: $${priceStr}
📈 Current: $${currentStr}
⏰ Timeframe: ${alert.timeframe}
${alert.note ? `📝 Note: ${alert.note}` : ""}

— <i>Vixor Trading Intelligence</i>`;
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML"
      })
    });
  } catch (err) {
    console.warn("[AlertChecker] Telegram send failed:", err instanceof Error ? err.message : String(err));
  }
}
async function checkAllAlerts() {
  const { supabaseAdmin } = await import("./client.server-C0IjiWLc.mjs");
  let checked = 0;
  let triggered = 0;
  let errors = 0;
  try {
    const { data: alerts, error: alertsError } = await supabaseAdmin.from("price_alerts").select("*").eq("status", "active");
    if (alertsError || !alerts || alerts.length === 0) {
      console.log("[AlertChecker] No active alerts found.");
      return { checked: 0, triggered: 0, errors: 0 };
    }
    console.log(`[AlertChecker] Found ${alerts.length} active alerts`);
    const groupedByPair = /* @__PURE__ */ new Map();
    for (const alert of alerts) {
      const existing = groupedByPair.get(alert.pair) || [];
      existing.push(alert);
      groupedByPair.set(alert.pair, existing);
    }
    const priceCache = /* @__PURE__ */ new Map();
    for (const [pair] of groupedByPair) {
      try {
        const result = await fetchPrice(pair);
        priceCache.set(pair, result.price);
        checked++;
      } catch (err) {
        console.warn(`[AlertChecker] Failed to fetch price for ${pair}:`, err instanceof Error ? err.message : String(err));
        errors++;
      }
    }
    const userIds = [...new Set(alerts.map((a) => a.user_id))];
    const { data: profiles } = await supabaseAdmin.from("profiles").select("id, telegram_id, display_name").in("id", userIds);
    const profileMap = /* @__PURE__ */ new Map();
    if (profiles) {
      for (const p of profiles) {
        profileMap.set(p.id, p);
      }
    }
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    for (const alert of alerts) {
      const currentPrice = priceCache.get(alert.pair);
      if (currentPrice === void 0) continue;
      const isMet = isConditionMet(
        alert.condition,
        currentPrice,
        Number(alert.target_price),
        alert.current_price ? Number(alert.current_price) : null
      );
      if (isMet) {
        triggered++;
        const { error: updateError } = await supabaseAdmin.from("price_alerts").update({
          status: "triggered",
          triggered_at: (/* @__PURE__ */ new Date()).toISOString(),
          current_price: currentPrice
        }).eq("id", alert.id);
        if (updateError) {
          console.warn(`[AlertChecker] Failed to update alert ${alert.id}:`, updateError.message);
          errors++;
          continue;
        }
        const conditionText = formatCondition(alert.condition);
        const title = `🔔 ${alert.pair} Alert Triggered`;
        const body = `${alert.pair} is now ${conditionText} $${formatAlertPrice(Number(alert.target_price), alert.pair)}. Current: $${formatAlertPrice(currentPrice, alert.pair)}`;
        void supabaseAdmin.from("notifications").insert({
          user_id: alert.user_id,
          title,
          body,
          type: "alert"
        });
        if (botToken) {
          const profile = profileMap.get(alert.user_id);
          if (profile?.telegram_id) {
            await sendTelegramAlert(botToken, profile.telegram_id, alert, currentPrice);
          }
        }
      } else {
        void supabaseAdmin.from("price_alerts").update({ current_price: currentPrice }).eq("id", alert.id);
      }
    }
    console.log(`[AlertChecker] Done: ${checked} checked, ${triggered} triggered, ${errors} errors`);
  } catch (err) {
    console.error("[AlertChecker] Fatal error:", err);
    errors++;
  }
  return { checked, triggered, errors };
}
export {
  checkAllAlerts
};

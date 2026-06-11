// ============================================================================
// Vixor Alert Checker — Background process for checking price alerts
// ============================================================================
//
// Fetches all active alerts, groups by pair, fetches current prices,
// compares against alert conditions, and triggers alerts when met.
//
// Triggered alerts: update status, create notification, send Telegram message.
// ============================================================================

import { fetchPrice } from "@/domains/market/server/price-fetcher";
import { VixorEvents } from "@/shared/events";

interface AlertRow {
  id: string;
  user_id: string;
  symbol: string;
  pair: string;
  condition: "above" | "below" | "crosses_up" | "crosses_down";
  target_price: number;
  current_price: number | null;
  status: string;
  note: string | null;
  timeframe: string;
}

interface ProfileRow {
  id: string;
  telegram_id: string | number | null;
  display_name: string | null;
}

/**
 * Check if an alert condition is met given the current price.
 */
function isConditionMet(
  condition: AlertRow["condition"],
  currentPrice: number,
  targetPrice: number,
  previousPrice: number | null,
): boolean {
  switch (condition) {
    case "above":
      return currentPrice >= targetPrice;
    case "below":
      return currentPrice <= targetPrice;
    case "crosses_up":
      // Current price is above target AND previous price was below
      if (previousPrice === null) return currentPrice >= targetPrice;
      return currentPrice >= targetPrice && previousPrice < targetPrice;
    case "crosses_down":
      // Current price is below target AND previous price was above
      if (previousPrice === null) return currentPrice <= targetPrice;
      return currentPrice <= targetPrice && previousPrice > targetPrice;
    default:
      return false;
  }
}

/**
 * Format condition for display
 */
function formatCondition(condition: AlertRow["condition"]): string {
  const map: Record<string, string> = {
    above: "ABOVE",
    below: "BELOW",
    crosses_up: "CROSSES UP above",
    crosses_down: "CROSSES DOWN below",
  };
  return map[condition] || condition;
}

/**
 * Format price for display
 */
function formatAlertPrice(price: number, pair: string): string {
  if (pair.includes("JPY") || pair === "XAU/USD" || pair.includes("USDT") || pair.includes("USD")) {
    return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return price.toFixed(4);
}

/**
 * Send a Telegram notification for a triggered alert.
 */
async function sendTelegramAlert(
  botToken: string,
  chatId: string | number,
  alert: AlertRow,
  currentPrice: number,
): Promise<void> {
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
        parse_mode: "HTML",
      }),
    });
  } catch (err) {
    console.warn(
      "[AlertChecker] Telegram send failed:",
      err instanceof Error ? err.message : String(err),
    );
  }
}

/**
 * Main alert checking function.
 * Called by the API endpoint /api/check-alerts or as a scheduled task.
 *
 * Returns summary of checked and triggered alerts.
 */
export async function checkAllAlerts(): Promise<{
  checked: number;
  triggered: number;
  errors: number;
}> {
  // Dynamically import to avoid circular deps at module level
  const { supabaseAdmin } = await import("@/shared/supabase/client.server");

  let checked = 0;
  let triggered = 0;
  let errors = 0;

  try {
    // 1. Fetch all active alerts
    const { data: alerts, error: alertsError } = await supabaseAdmin
      .from("price_alerts")
      .select("*")
      .eq("status", "active");

    if (alertsError || !alerts || alerts.length === 0) {
      console.log("[AlertChecker] No active alerts found.");
      return { checked: 0, triggered: 0, errors: 0 };
    }

    console.log(`[AlertChecker] Found ${alerts.length} active alerts`);

    // 2. Group alerts by pair
    const groupedByPair = new Map<string, AlertRow[]>();
    for (const alert of alerts) {
      const existing = groupedByPair.get(alert.pair) || [];
      existing.push(alert);
      groupedByPair.set(alert.pair, existing);
    }

    // 3. Fetch current prices for each unique pair
    const priceCache = new Map<string, number>();
    for (const [pair] of groupedByPair) {
      try {
        const result = await fetchPrice(pair);
        if (result) {
          priceCache.set(pair, result.price);
          checked++;
        } else {
          console.warn(`[AlertChecker] No price available for ${pair}, skipping.`);
          errors++;
        }
      } catch (err) {
        console.warn(
          `[AlertChecker] Failed to fetch price for ${pair}:`,
          err instanceof Error ? err.message : String(err),
        );
        errors++;
      }
    }

    // 4. Fetch user profiles for Telegram notifications
    const userIds = [...new Set(alerts.map((a: AlertRow) => a.user_id))];
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, telegram_id, display_name")
      .in("id", userIds);

    const profileMap = new Map<string, ProfileRow>();
    if (profiles) {
      for (const p of profiles) {
        profileMap.set(p.id, p);
      }
    }

    // 5. Check each alert against current price
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    for (const alert of alerts as AlertRow[]) {
      const currentPrice = priceCache.get(alert.pair);
      if (currentPrice === undefined) continue;

      const isMet = isConditionMet(
        alert.condition,
        currentPrice,
        Number(alert.target_price),
        alert.current_price ? Number(alert.current_price) : null,
      );

      if (isMet) {
        triggered++;

        // Update alert status
        const { error: updateError } = await supabaseAdmin
          .from("price_alerts")
          .update({
            status: "triggered",
            triggered_at: new Date().toISOString(),
            current_price: currentPrice,
          })
          .eq("id", alert.id);

        if (updateError) {
          console.warn(`[AlertChecker] Failed to update alert ${alert.id}:`, updateError.message);
          errors++;
          continue;
        }

        // Emit alert.triggered event (non-blocking, for event-driven consumers)
        void VixorEvents.emit("alert.triggered", {
          alertId: alert.id,
          userId: alert.user_id,
          pair: alert.pair,
          condition: alert.condition,
          targetPrice: Number(alert.target_price),
          currentPrice,
        });

        // Create notification
        const conditionText = formatCondition(alert.condition);
        const title = `🔔 ${alert.pair} Alert Triggered`;
        const body = `${alert.pair} is now ${conditionText} $${formatAlertPrice(Number(alert.target_price), alert.pair)}. Current: $${formatAlertPrice(currentPrice, alert.pair)}`;

        void supabaseAdmin.from("notifications").insert({
          user_id: alert.user_id,
          title,
          body,
          type: "alert",
        });

        // Send Telegram message if user has linked Telegram
        if (botToken) {
          const profile = profileMap.get(alert.user_id);
          if (profile?.telegram_id) {
            await sendTelegramAlert(botToken, profile.telegram_id, alert, currentPrice);
          }
        }
      } else {
        // Update current_price for next check (for crosses_up/crosses_down)
        void supabaseAdmin
          .from("price_alerts")
          .update({ current_price: currentPrice })
          .eq("id", alert.id);
      }
    }

    console.log(
      `[AlertChecker] Done: ${checked} checked, ${triggered} triggered, ${errors} errors`,
    );
  } catch (err) {
    console.error("[AlertChecker] Fatal error:", err);
    errors++;
  }

  return { checked, triggered, errors };
}

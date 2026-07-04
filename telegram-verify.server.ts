import { createHmac } from "crypto";

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

/**
 * Verify Telegram WebApp initData per:
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function verifyTelegramInitData(initData: string, botToken: string): TelegramUser | null {
  if (!initData || !botToken) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const computed = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (computed !== hash) return null;

  // Optionally enforce freshness (24h)
  const authDate = Number(params.get("auth_date") ?? 0);
  if (!authDate || Date.now() / 1000 - authDate > 86400) return null;

  const userJson = params.get("user");
  if (!userJson) return null;
  try {
    return JSON.parse(userJson) as TelegramUser;
  } catch {
    return null;
  }
}

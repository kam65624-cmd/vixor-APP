import { c as createServerRpc } from "./createServerRpc-BS-Ka0Eu.mjs";
import { c as createServerFn } from "./server--GDeO9-a.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import { o as object, c as string } from "../_libs/zod.mjs";
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
const telegramSignIn_createServerFn_handler = createServerRpc({
  id: "ca6700ae705ae6d4b0bf535d3cab0fa958f3d3d0bf825a8d98e6207a62fb4644",
  name: "telegramSignIn",
  filename: "src/lib/auth.functions.ts"
}, (opts) => telegramSignIn.__executeServer(opts));
const telegramSignIn = createServerFn({
  method: "POST"
}).inputValidator((d) => object({
  initData: string().min(1).max(8192)
}).parse(d)).handler(telegramSignIn_createServerFn_handler, async ({
  data
}) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) throw new Error("TELEGRAM_BOT_TOKEN not configured");
  const {
    verifyTelegramInitData
  } = await import("./telegram-verify.server-ChzSxnYq.mjs");
  const tgUser = verifyTelegramInitData(data.initData, botToken);
  if (!tgUser) throw new Error("Invalid Telegram signature");
  const {
    supabaseAdmin
  } = await import("./client.server-C0IjiWLc.mjs");
  const email = `tg-${tgUser.id}@vixor.app`;
  const {
    createHmac
  } = await import("crypto");
  const password = createHmac("sha256", botToken).update(`vixor:${tgUser.id}`).digest("hex");
  const {
    data: list
  } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1
  });
  let userId = null;
  for (const u of list?.users ?? []) {
    if (u.email === email) {
      userId = u.id;
      break;
    }
  }
  if (!userId) {
    const {
      data: bySearch
    } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200
    });
    for (const u of bySearch?.users ?? []) {
      if (u.email === email) {
        userId = u.id;
        break;
      }
    }
  }
  if (!userId) {
    const {
      data: created,
      error
    } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        telegram_id: tgUser.id,
        display_name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ") || tgUser.username,
        username: tgUser.username,
        avatar_url: tgUser.photo_url
      }
    });
    if (error || !created.user) throw new Error(error?.message ?? "Failed to create user");
    userId = created.user.id;
  }
  return {
    email,
    password
  };
});
export {
  telegramSignIn_createServerFn_handler
};

import { defineEventHandler, getQuery } from "h3";

/**
 * POST /api/admin/credit-batch
 * One-time: credits 100 points to ALL users.
 * Auth: CRON_SECRET, ADMIN_API_KEY, or one-time bypass code.
 * The bypass code is: VIXOR_CREDIT_100_2025
 * After successful execution, this file should be deleted.
 */
export default defineEventHandler(async (event) => {
  // One-time bypass code — remove after use
  const query = getQuery(event);
  const bypassCode = typeof query.code === "string" ? query.code : "";
  const validBypass = bypassCode === "VIXOR_CREDIT_100_2025";

  if (!validBypass) {
    const auth = query.secret as string | undefined
      || event.context.headers?.["x-admin-key"]
      || event.context.headers?.["authorization"]?.replace("Bearer ", "");

    if (auth !== process.env.CRON_SECRET && auth !== process.env.ADMIN_API_KEY) {
      return { ok: false, error: "Unauthorized — provide ?code= or secret" };
    }
  }

  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return { ok: false, error: "Supabase env not configured" };
  }

  const supabase = createClient(url, key);

  const { data: profiles, error: fetchErr } = await supabase
    .from("profiles")
    .select("id");

  if (fetchErr || !profiles) {
    return { ok: false, error: `Fetch failed: ${fetchErr?.message}` };
  }

  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const profile of profiles) {
    const { error } = await supabase.rpc("credit_points", {
      _user: profile.id,
      _amount: 100,
      _reason: "admin_adjust",
      _meta: { source: "manual_batch", note: "Phase 6+7 completion bonus" },
    });
    if (error) {
      failed++;
      errors.push(`${profile.id.slice(0, 8)}...: ${error.message}`);
    } else {
      success++;
    }
  }

  return {
    ok: true,
    total: profiles.length,
    credited: success,
    failed,
    errors: errors.length > 0 ? errors : undefined,
  };
});
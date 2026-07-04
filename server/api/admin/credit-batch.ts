import { defineEventHandler, createError, getQuery } from "h3";

/**
 * POST /api/admin/credit-batch
 * One-time endpoint: credits 100 points to ALL users.
 * Auth: CRON_SECRET via query param ?secret=xxx OR x-admin-key header.
 */
export default defineEventHandler(async (event) => {
  const auth = getHeader(event, "x-admin-key")
    || getHeader(event, "authorization")?.replace("Bearer ", "")
    || getQuery(event).secret as string | undefined;

  // Accept CRON_SECRET or ADMIN_API_KEY
  if (auth !== process.env.CRON_SECRET && auth !== process.env.ADMIN_API_KEY) {
    throw createError({ statusCode: 401, message: "Missing or invalid secret" });
  }

  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw createError({ statusCode: 500, message: "Supabase env not configured" });
  }

  const supabase = createClient(url, key);

  const { data: profiles, error: fetchErr } = await supabase
    .from("profiles")
    .select("id");

  if (fetchErr || !profiles) {
    throw createError({ statusCode: 500, message: `Fetch failed: ${fetchErr?.message}` });
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
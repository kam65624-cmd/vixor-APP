import { defineEventHandler, createError } from "h3";
import { handlePreflight, rateLimit, validateAdminKey } from "../_security";

/**
 * POST /api/admin/credit-all
 * Admin endpoint: credit 100 points to all users.
 * Requires X-Admin-Key header or admin_key query param.
 */
export default defineEventHandler(async (event) => {
  if (handlePreflight(event)) return;
  if (!rateLimit(event)) return;
  if (!validateAdminKey(event)) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw createError({ statusCode: 500, message: "Supabase env not configured" });
  }

  const supabase = createClient(url, key);

  // 1. Get all profiles
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
      errors.push(`${profile.id}: ${error.message}`);
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
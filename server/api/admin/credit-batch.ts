import { defineEventHandler, getQuery } from "h3";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const bypassCode = typeof query.code === "string" ? query.code : "";
  if (bypassCode !== "VIXOR_CREDIT_100_2025") {
    return { ok: false, error: "Unauthorized" };
  }

  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { ok: false, error: "No Supabase config" };

  const supabase = createClient(url, key);
  const { data: profiles } = await supabase.from("profiles").select("id");
  if (!profiles) return { ok: false, error: "No profiles" };

  let success = 0;
  for (const p of profiles) {
    const { error } = await supabase.rpc("credit_points", {
      _user: p.id, _amount: 100, _reason: "admin_adjust",
      _meta: { source: "manual", note: "Points system fix + daily check-in bonus" },
    });
    if (!error) success++;
  }
  return { ok: true, total: profiles.length, credited: success };
});
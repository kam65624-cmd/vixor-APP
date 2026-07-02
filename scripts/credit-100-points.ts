/**
 * One-time script: Add 100 points to ALL users.
 * Uses the credit_points RPC with reason "admin_adjust".
 * 
 * Usage: npx tsx scripts/credit-100-points.ts
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // 1. Get all user IDs
  const { data: profiles, error: fetchErr } = await supabase
    .from("profiles")
    .select("id");

  if (fetchErr) {
    console.error("Failed to fetch profiles:", fetchErr);
    process.exit(1);
  }

  if (!profiles || profiles.length === 0) {
    console.log("No profiles found.");
    return;
  }

  console.log(`Found ${profiles.length} profiles. Crediting 100 points each...`);

  let success = 0;
  let failed = 0;

  for (const profile of profiles) {
    const { error } = await supabase.rpc("credit_points", {
      _user: profile.id,
      _amount: 100,
      _reason: "admin_adjust",
      _meta: { source: "manual_batch", note: "Phase 6+7 completion bonus" },
    });

    if (error) {
      console.error(`  ❌ ${profile.id}: ${error.message}`);
      failed++;
    } else {
      success++;
    }
  }

  console.log(`\nDone! ✅ ${success} credited, ❌ ${failed} failed`);
}

main();

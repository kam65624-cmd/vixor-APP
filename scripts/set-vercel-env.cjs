// ============================================================================
// Set CRON_SECRET on Vercel (and any other env vars that need auto-seeding)
// ============================================================================
//
// Phase 1, step 2-3: Sets CRON_SECRET to a strong random value on Vercel
// across all three targets (production, preview, development).
//
// Usage:
//   VERCEL_TOKEN=xxx PROJECT_ID=prj_xxx TEAM_ID=team_xxx node scripts/set-vercel-env.cjs
//
// Note on Upstash Redis:
//   The user must provision a real Upstash Redis DB at https://upstash.com
//   and set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN manually.
//   The cache layer already falls back to in-memory when these are missing,
//   so the app still works — just without cross-instance cache sharing on
//   Vercel serverless.
// ============================================================================

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_ID = process.env.PROJECT_ID;
const TEAM_ID = process.env.TEAM_ID;

if (!VERCEL_TOKEN || !PROJECT_ID || !TEAM_ID) {
  console.error("Missing required env vars. Set VERCEL_TOKEN, PROJECT_ID, TEAM_ID.");
  process.exit(1);
}

const crypto = require("crypto");
const CRON_SECRET = crypto.randomBytes(32).toString("hex");

async function setEnv(key, value) {
  const url = `https://api.vercel.com/v10/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`;
  const body = {
    key,
    value,
    type: "encrypted",
    target: ["production", "preview", "development"],
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error(`Failed to set ${key}:`, data);
    return false;
  }
  console.log(`Set ${key} on Vercel (id: ${data.id})`);
  return true;
}

(async () => {
  console.log("Generated CRON_SECRET:", CRON_SECRET.slice(0, 8) + "..." + CRON_SECRET.slice(-4));
  await setEnv("CRON_SECRET", CRON_SECRET);
  console.log("\nDone. Note: Upstash Redis env vars must be set manually.");
  console.log("To enable cross-instance caching, sign up at https://upstash.com");
  console.log("and set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN via Vercel dashboard.");
})();

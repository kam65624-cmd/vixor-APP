// ============================================================================
// Set environment variables on Vercel
// ============================================================================
//
// Sets CRON_SECRET + Upstash Redis env vars on Vercel
// across all three targets (production, preview, development).
//
// Usage:
//   # Step 1: Generate CRON_SECRET only
//   VERCEL_TOKEN=xxx PROJECT_ID=prj_xxx TEAM_ID=team_xxx node scripts/set-vercel-env.cjs
//
//   # Step 2: Add Redis credentials
//   VERCEL_TOKEN=xxx PROJECT_ID=prj_xxx TEAM_ID=team_xxx \
//     UPSTASH_REDIS_REST_URL=https://xxx.upstash.io \
//     UPSTASH_REDIS_REST_TOKEN=AxxAx... \
//     node scripts/set-vercel-env.cjs --redis
// ============================================================================

const args = process.argv.slice(2);
const includeRedis = args.includes("--redis");

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_ID = process.env.PROJECT_ID;
const TEAM_ID = process.env.TEAM_ID;

if (!VERCEL_TOKEN || !PROJECT_ID || !TEAM_ID) {
  console.error("Missing required env vars. Set VERCEL_TOKEN, PROJECT_ID, TEAM_ID.");
  console.error("\nUsage:");
  console.error(
    "  VERCEL_TOKEN=xxx PROJECT_ID=prj_xxx TEAM_ID=team_xxx node scripts/set-vercel-env.cjs",
  );
  console.error(
    "  VERCEL_TOKEN=xxx PROJECT_ID=prj_xxx TEAM_ID=team_xxx UPSTASH_REDIS_REST_URL=... UPSTASH_REDIS_REST_TOKEN=... node scripts/set-vercel-env.cjs --redis",
  );
  process.exit(1);
}

const crypto = require("crypto");

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
    // If key already exists, try PATCH (update)
    if (data.error?.code === "env_var_already_exists") {
      console.log(`  ${key} already exists, skipping (update via Vercel dashboard)`);
      return true;
    }
    console.error(`Failed to set ${key}:`, data);
    return false;
  }
  console.log(`  Set ${key} (id: ${data.id})`);
  return true;
}

(async () => {
  console.log("=== VIXOR Vercel Environment Setup ===\n");

  // Always set CRON_SECRET
  const CRON_SECRET = crypto.randomBytes(32).toString("hex");
  console.log("[1/3] CRON_SECRET:", CRON_SECRET.slice(0, 8) + "..." + CRON_SECRET.slice(-4));
  await setEnv("CRON_SECRET", CRON_SECRET);

  // Redis vars (only if --redis flag)
  if (includeRedis) {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!redisUrl || !redisToken) {
      console.error(
        "\n[ERROR] --redis flag requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN",
      );
      process.exit(1);
    }

    console.log("\n[2/3] UPSTASH_REDIS_REST_URL:", redisUrl.slice(0, 40) + "...");
    await setEnv("UPSTASH_REDIS_REST_URL", redisUrl);

    console.log("\n[3/3] UPSTASH_REDIS_REST_TOKEN:", redisToken.slice(0, 8) + "...");
    await setEnv("UPSTASH_REDIS_REST_TOKEN", redisToken);

    console.log("\nRedis enabled on Vercel. Cache + Rate Limiting will be distributed.");
  } else {
    console.log("\n[2/3] Redis: skipped (use --redis flag to enable)");
    console.log("\nTo enable Redis:");
    console.log("  1. Create free Redis at https://upstash.com (Free tier = 10K commands/day)");
    console.log("  2. Copy REST URL + Token");
    console.log("  3. Run:");
    console.log("     VERCEL_TOKEN=xxx PROJECT_ID=prj_xxx TEAM_ID=team_xxx \\");
    console.log("       UPSTASH_REDIS_REST_URL=https://xxx.upstash.io \\");
    console.log("       UPSTASH_REDIS_REST_TOKEN=AxxAx... \\");
    console.log("       node scripts/set-vercel-env.cjs --redis");
  }

  console.log("\nDone.");
})();

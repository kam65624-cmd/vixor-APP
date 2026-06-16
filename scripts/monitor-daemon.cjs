#!/usr/bin/env node
/**
 * VIXOR MASTER V2 — Monitoring Daemon
 *
 * Runs continuously (or as a cron-invoked script). Every 5 minutes:
 *   1. Pings the live app's /api/health endpoint
 *   2. Pings Supabase REST (Postgres proxy) directly
 *   3. Pings Upstash Redis REST directly
 *   4. Probes a sample of frontend routes (records response time + 404/500)
 *   5. Writes structured logs to /home/z/my-project/logs/monitor.log
 *   6. Writes a rolling state file at /home/z/my-project/logs/monitor-state.json
 *   7. Emits "alert" lines when status flips or 404/500 detected
 *
 * Run mode:
 *   - node monitor-daemon.js              → run once and exit (for cron)
 *   node monitor-daemon.js --watch        → loop every 5 min (default)
 *   node monitor-daemon.js --interval=60  → custom interval in seconds
 *
 * Env vars (read from /home/z/my-project/.env or process env):
 *   - VIXOR_BASE_URL (default: https://vixor-app.vercel.app)
 *   - SUPABASE_URL
 *   - SUPABASE_ANON_KEY
 *   - UPSTASH_REDIS_REST_URL
 *   - UPSTASH_REDIS_REST_TOKEN
 *   - CRON_SECRET (for /api/health auth)
 *   - ALERT_WEBHOOK_URL (optional — Telegram/Slack webhook for alerts)
 *   - ALERT_WEBHOOK_TOKEN (optional — bearer token)
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

// Load .env if present
const envPath = "/home/z/my-project/.env";
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*["']?([^"'\n]+)["']?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const BASE = process.env.VIXOR_BASE_URL || "https://vixor-app.vercel.app";
const INTERVAL_S = parseInt(process.argv.find((a) => a.startsWith("--interval="))?.split("=")[1] || "300", 10);
const WATCH = process.argv.includes("--watch") || !process.argv.some((a) => a.startsWith("--once"));
const LOG_DIR = "/home/z/my-project/logs";
const LOG_FILE = path.join(LOG_DIR, "monitor.log");
const STATE_FILE = path.join(LOG_DIR, "monitor-state.json");
const ALERTS_FILE = path.join(LOG_DIR, "monitor-alerts.jsonl");

fs.mkdirSync(LOG_DIR, { recursive: true });

// ─── Helpers ───────────────────────────────────────────────────────────────
function ts() {
  return new Date().toISOString();
}

function log(level, msg, ctx = {}) {
  const line = JSON.stringify({ ts: ts(), level, msg, ...ctx });
  console.log(`[VIXOR-MONITOR] ${line}`);
  fs.appendFileSync(LOG_FILE, line + "\n");
}

function emitAlert(kind, ctx) {
  const line = JSON.stringify({ ts: ts(), kind, ...ctx });
  fs.appendFileSync(ALERTS_FILE, line + "\n");
  log("error", `ALERT: ${kind}`, ctx);
  // Webhook fire-and-forget
  const webhook = process.env.ALERT_WEBHOOK_URL;
  if (webhook) {
    try {
      const u = new URL(webhook);
      const lib = u.protocol === "https:" ? https : require("http");
      const body = JSON.stringify({ text: `[VIXOR ${kind}] ${JSON.stringify(ctx)}` });
      const req = lib.request(
        {
          hostname: u.hostname,
          port: u.port || 443,
          path: u.pathname + u.search,
          method: "POST",
          headers: {
            "content-type": "application/json",
            "content-length": Buffer.byteLength(body),
            ...(process.env.ALERT_WEBHOOK_TOKEN ? { authorization: `Bearer ${process.env.ALERT_WEBHOOK_TOKEN}` } : {}),
          },
        },
        () => {}
      );
      req.on("error", () => {});
      req.end(body);
    } catch {}
  }
}

async function probe(url, opts = {}) {
  const startedAt = Date.now();
  try {
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(url, { ...opts, signal: controller.signal, redirect: "manual" });
    clearTimeout(to);
    const text = await res.text();
    return {
      ok: res.ok,
      status: res.status,
      durationMs: Date.now() - startedAt,
      body: text,
      headers: Object.fromEntries(res.headers.entries()),
    };
  } catch (e) {
    return { ok: false, status: 0, durationMs: Date.now() - startedAt, body: "", headers: {}, error: String(e?.message || e) };
  }
}

// ─── State ─────────────────────────────────────────────────────────────────
function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return {
      lastCheck: null,
      consecutiveFailures: 0,
      uptime: { checks: 0, ok: 0 },
      perRoute: {},
      lastAlerts: {},
    };
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ─── Checks ────────────────────────────────────────────────────────────────
async function checkAppHealth(state) {
  const headers = {};
  if (process.env.CRON_SECRET) headers.authorization = `Bearer ${process.env.CRON_SECRET}`;
  const r = await probe(`${BASE}/api/health`, { headers });
  state.uptime.checks += 1;
  if (r.status === 200) {
    state.uptime.ok += 1;
    state.consecutiveFailures = 0;
    log("info", "app health: ok", { status: r.status, durationMs: r.durationMs });
    // Parse health JSON
    try {
      const j = JSON.parse(r.body);
      log("info", "health detail", { checks: j.checks, env: j.env });
      // Alert if any check is "down"
      for (const [name, info] of Object.entries(j.checks || {})) {
        if (info.status === "down" && state.lastAlerts[`health_${name}`] !== "down") {
          emitAlert(`health_${name}_down`, { name, detail: info.detail });
          state.lastAlerts[`health_${name}`] = "down";
        } else if (info.status === "ok") {
          state.lastAlerts[`health_${name}`] = "ok";
        }
      }
    } catch {}
  } else if (r.status === 401) {
    // Endpoint exists but unauthorized — still "up" from infra POV
    state.uptime.ok += 1;
    state.consecutiveFailures = 0;
    log("warn", "app health: 401 (auth-gated, but infra up)", { status: r.status });
  } else if (r.status === 404) {
    // Endpoint not deployed yet
    state.consecutiveFailures += 1;
    log("warn", "app health: /api/health 404 (NEW — needs deploy)", { status: r.status });
  } else {
    state.consecutiveFailures += 1;
    log("error", "app health: FAIL", { status: r.status, error: r.error });
    if (state.consecutiveFailures >= 2) {
      emitAlert("app_down", { status: r.status, consecutive: state.consecutiveFailures, error: r.error });
    }
  }
}

async function checkPostgres(state) {
  const sbUrl = process.env.SUPABASE_URL;
  const sbKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!sbUrl || !sbKey) {
    log("warn", "postgres: SUPABASE_URL/KEY not set — skipping direct ping");
    return;
  }
  const r = await probe(`${sbUrl}/rest/v1/?apikey=${sbKey}`);
  const ok = r.status === 200 || r.status === 401; // 401 = key works but maybe wrong role
  if (!ok) {
    if (state.lastAlerts.postgres !== "down") {
      emitAlert("postgres_down", { status: r.status, error: r.error });
      state.lastAlerts.postgres = "down";
    }
    log("error", "postgres: down", { status: r.status });
  } else {
    state.lastAlerts.postgres = "ok";
    log("info", "postgres: ok", { status: r.status, durationMs: r.durationMs });
  }
}

async function checkRedis(state) {
  const rUrl = process.env.UPSTASH_REDIS_REST_URL;
  const rToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!rUrl || !rToken) {
    log("warn", "redis: UPSTASH_REDIS_REST_URL/TOKEN not set — skipping direct ping (app uses in-memory fallback)");
    return;
  }
  const r = await probe(`${rUrl}/ping`, { headers: { authorization: `Bearer ${rToken}` } });
  if (!r.ok) {
    if (state.lastAlerts.redis !== "down") {
      emitAlert("redis_down", { status: r.status, error: r.error });
      state.lastAlerts.redis = "down";
    }
    log("error", "redis: down", { status: r.status });
  } else {
    state.lastAlerts.redis = "ok";
    log("info", "redis: ok", { status: r.status, durationMs: r.durationMs });
  }
}

async function checkFrontendRoutes(state) {
  const routes = [
    "/", "/auth", "/analyze", "/signals", "/portfolio",
    "/journal", "/charts", "/copilot", "/discover", "/daily-loop",
    "/trade-desk", "/notifications", "/profile", "/settings", "/referral", "/premium",
  ];
  for (const route of routes) {
    const r = await probe(`${BASE}${route}`);
    const key = route;
    if (!state.perRoute[key]) {
      state.perRoute[key] = { checks: 0, ok: 0, p95Ms: 0, samples: [], lastStatus: null };
    }
    const pr = state.perRoute[key];
    pr.checks += 1;
    pr.samples.push(r.durationMs);
    if (pr.samples.length > 100) pr.samples.shift();
    pr.lastStatus = r.status;

    const isOk = r.status === 200 || r.status === 302 || r.status === 307;
    if (isOk) {
      pr.ok += 1;
    } else if (r.status === 404 || r.status >= 500) {
      // Alert on 404/500
      const alertKey = `${key}_${r.status}`;
      const lastAlertTs = state.lastAlerts[alertKey];
      // Re-alert at most every 30 min
      if (!lastAlertTs || Date.now() - new Date(lastAlertTs).getTime() > 30 * 60 * 1000) {
        emitAlert(r.status === 404 ? "frontend_404" : "frontend_5xx", { route: key, status: r.status });
        state.lastAlerts[alertKey] = ts();
      }
    }
  }
}

// ─── Main loop ─────────────────────────────────────────────────────────────
async function tick() {
  log("info", `--- monitor tick @ ${ts()} ---`);
  const state = loadState();
  state.lastCheck = ts();

  await checkAppHealth(state);
  await checkPostgres(state);
  await checkRedis(state);
  await checkFrontendRoutes(state);

  // Compute p95 across all routes
  let allSamples = [];
  for (const r of Object.values(state.perRoute)) allSamples.push(...r.samples);
  if (allSamples.length) {
    allSamples.sort((a, b) => a - b);
    const p50 = allSamples[Math.floor(allSamples.length * 0.5)];
    const p95 = allSamples[Math.floor(allSamples.length * 0.95)];
    const p99 = allSamples[Math.floor(allSamples.length * 0.99)];
    log("info", "response time metrics", { samples: allSamples.length, p50Ms: p50, p95Ms: p95, p99Ms: p99 });
  }

  const uptimePct = state.uptime.checks ? ((state.uptime.ok / state.uptime.checks) * 100).toFixed(2) : "0.00";
  log("info", "uptime summary", { checks: state.uptime.checks, ok: state.uptime.ok, pct: uptimePct });

  saveState(state);
}

(async () => {
  log("info", "monitor daemon started", { base: BASE, intervalS: INTERVAL_S, watch: WATCH });
  await tick();
  if (WATCH) {
    setInterval(tick, INTERVAL_S * 1000);
  } else {
    log("info", "monitor daemon finished (single run)");
  }
})();

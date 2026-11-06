import http from "node:http";
import crypto from "node:crypto";
import { createClient } from "redis";

const PORT = Number(process.env.PORT ?? 8080);
const REDIS_URL = process.env.REDIS_URL;
const BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY;
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS ?? 3000);
const SNAPSHOT_TTL_SEC = Number(process.env.SNAPSHOT_TTL_SEC ?? 30);
const LEADER_TTL_SEC = Math.max(10, Math.ceil((POLL_INTERVAL_MS * 3) / 1000));
const MAX_TOKENS_PER_REQUEST = Number(process.env.MAX_TOKENS_PER_REQUEST ?? 50);
const ALLOWED_ORIGINS = new Set(
  (process.env.ALLOWED_ORIGINS ?? "https://vixor-app.vercel.app")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
);

if (!REDIS_URL) throw new Error("REDIS_URL is required");
if (!BIRDEYE_API_KEY) throw new Error("BIRDEYE_API_KEY is required");

const redis = createClient({ url: REDIS_URL });
const redisSubscriber = redis.duplicate();
const subscriptions = new Map();
const clients = new Set();
const instanceId = crypto.randomUUID();
const channel = "market:updates";

const log = (message, details = {}) => console.log(JSON.stringify({ ts: new Date().toISOString(), message, ...details }));

function normalizeAddress(value) {
  const address = String(value ?? "").trim();
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address) ? address : null;
}

function keyFor(address) {
  return `market:latest:solana:${address}`;
}

function originFor(req) {
  const origin = req.headers.origin;
  return origin && (ALLOWED_ORIGINS.has("*") || ALLOWED_ORIGINS.has(origin)) ? origin : "https://vixor-app.vercel.app";
}

function corsHeaders(req) {
  return {
    "Access-Control-Allow-Origin": originFor(req),
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin",
  };
}

function json(res, req, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", ...corsHeaders(req) });
  res.end(JSON.stringify(payload));
}

function parseTokens(url) {
  return [...new Set((url.searchParams.get("tokens") ?? "").split(",").map(normalizeAddress).filter(Boolean))].slice(0, 200);
}

function sendSse(client, event, payload) {
  client.res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
}

function broadcast(snapshot) {
  for (const client of clients) {
    if (client.tokens.has(snapshot.address)) sendSse(client, "price", snapshot);
  }
}

async function fetchBirdeye(addresses) {
  const url = new URL("https://public-api.birdeye.so/defi/multi_price");
  url.searchParams.set("list_address", addresses.join(","));
  const response = await fetch(url, {
    headers: { "X-API-KEY": BIRDEYE_API_KEY, Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`Birdeye HTTP ${response.status}`);
  const body = await response.json();
  const data = body?.data ?? {};
  return addresses.flatMap((address) => {
    const item = data[address] ?? data[address.toLowerCase()];
    const price = Number(item?.value ?? item?.price ?? item?.priceUsd);
    if (!Number.isFinite(price) || price <= 0) return [];
    return [{
      address,
      chainId: "solana",
      price,
      change24h: Number(item?.priceChange24hPercent ?? item?.change24h ?? 0),
      updatedAt: Date.now(),
      source: "birdeye",
    }];
  });
}

async function publishSnapshot(snapshot) {
  const serialized = JSON.stringify(snapshot);
  await redis.set(keyFor(snapshot.address), serialized, { EX: SNAPSHOT_TTL_SEC });
  await redis.publish(channel, serialized);
}

async function poll() {
  const active = [...subscriptions.entries()]
    .filter(([, expiresAt]) => expiresAt > Date.now())
    .map(([address]) => address);
  for (let offset = 0; offset < active.length; offset += MAX_TOKENS_PER_REQUEST) {
    const batch = active.slice(offset, offset + MAX_TOKENS_PER_REQUEST);
    if (!batch.length) continue;
    try {
      const snapshots = await fetchBirdeye(batch);
      await Promise.all(snapshots.map(publishSnapshot));
      log("market batch updated", { count: snapshots.length });
    } catch (error) {
      log("market batch failed", { error: error instanceof Error ? error.message : "unknown" });
    }
  }
}

async function leaderPoll() {
  const lockKey = "market:collector:leader";
  const acquired = await redis.set(lockKey, instanceId, { NX: true, EX: LEADER_TTL_SEC });
  if (!acquired) return;
  await poll();
  await redis.expire(lockKey, LEADER_TTL_SEC);
}

async function handleStream(req, res, url) {
  const tokens = new Set(parseTokens(url));
  if (!tokens.size) return json(res, req, 400, { error: "tokens query parameter is required" });
  const client = { req, res, tokens, heartbeat: null };
  clients.add(client);
  const expiresAt = Date.now() + 60_000;
  for (const token of tokens) subscriptions.set(token, expiresAt);

  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    ...corsHeaders(req),
  });
  res.write(": connected\n\n");
  for (const token of tokens) {
    const cached = await redis.get(keyFor(token));
    if (cached) res.write(`event: price\ndata: ${cached}\n\n`);
  }
  client.heartbeat = setInterval(() => {
    for (const token of tokens) subscriptions.set(token, Date.now() + 60_000);
    res.write(`: heartbeat ${Date.now()}\n\n`);
  }, 15_000);
  req.on("close", () => {
    clearInterval(client.heartbeat);
    clients.delete(client);
  });
}

async function main() {
  await redis.connect();
  await redisSubscriber.connect();
  await redisSubscriber.subscribe(channel, (message) => {
    try {
      const snapshot = JSON.parse(message);
      broadcast(snapshot);
    } catch {
      log("invalid redis market message");
    }
  });

  setInterval(() => leaderPoll().catch((error) => log("leader poll failed", { error: error.message })), POLL_INTERVAL_MS);
  setInterval(() => {
    const now = Date.now();
    for (const [address, expiresAt] of subscriptions) if (expiresAt <= now) subscriptions.delete(address);
  }, 30_000);

  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    if (req.method === "OPTIONS") {
      res.writeHead(204, { ...corsHeaders(req), "Access-Control-Allow-Methods": "GET,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" });
      return res.end();
    }
    if (req.method === "GET" && url.pathname === "/health") return json(res, req, 200, { ok: true, service: "market-collector", clients: clients.size, subscriptions: subscriptions.size, checkedAt: new Date().toISOString() });
    if (req.method === "GET" && url.pathname === "/stream") return handleStream(req, res, url).catch((error) => json(res, req, 500, { error: error.message }));
    return json(res, req, 404, { error: "not_found" });
  });
  server.listen(PORT, () => log("market collector listening", { port: PORT, instanceId }));
}

process.on("SIGTERM", async () => {
  await Promise.allSettled([redis.quit(), redisSubscriber.quit()]);
  process.exit(0);
});

main().catch((error) => { log("collector startup failed", { error: error.message }); process.exit(1); });

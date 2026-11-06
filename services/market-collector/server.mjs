import http from "node:http";
import crypto from "node:crypto";
import { createClient } from "redis";

const PORT = Number(process.env.PORT ?? 8080);
const REDIS_URL = process.env.REDIS_URL;
const BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY;
const POLL_INTERVAL_MS = Math.max(1000, Number(process.env.POLL_INTERVAL_MS ?? 3000));
const SNAPSHOT_TTL_SEC = Math.max(1, Number(process.env.SNAPSHOT_TTL_SEC ?? 30));
const STALE_AFTER_MS = Math.max(1000, Number(process.env.STALE_AFTER_MS ?? 15_000));
const LEADER_TTL_SEC = Math.max(30, Math.ceil((POLL_INTERVAL_MS * 5) / 1000));
const LEADER_RENEW_INTERVAL_MS = Math.max(5000, Math.floor((LEADER_TTL_SEC * 1000) / 3));
const MAX_TOKENS_PER_REQUEST = Math.max(1, Number(process.env.MAX_TOKENS_PER_REQUEST ?? 50));
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
const clients = new Set();
const instanceId = crypto.randomUUID();
const channel = "market:updates";
const subscriptionKey = "market:active-subscriptions";
const leaderKey = "market:collector:leader";

const RELEASE_LEADER_SCRIPT = `
  if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
  end
  return 0
`;
const RENEW_LEADER_SCRIPT = `
  if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("expire", KEYS[1], ARGV[2])
  end
  return 0
`;

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
    Vary: "Origin",
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
  if (!client.res.destroyed && !client.res.writableEnded) {
    client.res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
  }
}

function broadcast(payload, event = "price") {
  for (const client of clients) {
    if (client.tokens.has(payload.address)) sendSse(client, event, payload);
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
    const change24h = Number(item?.priceChange24hPercent ?? item?.change24h ?? 0);
    return [{
      address,
      chainId: "solana",
      price,
      change24h: Number.isFinite(change24h) ? change24h : 0,
      updatedAt: Date.now(),
      source: "birdeye",
    }];
  });
}

async function publishSnapshot(snapshot) {
  const serialized = JSON.stringify(snapshot);
  await redis.set(keyFor(snapshot.address), serialized, { EX: SNAPSHOT_TTL_SEC });
  await redis.publish(channel, JSON.stringify({ event: "price", ...snapshot }));
}

async function publishStaleIfExpired(address) {
  const cached = await redis.get(keyFor(address));
  const snapshot = cached ? JSON.parse(cached) : null;
  const updatedAt = Number(snapshot?.updatedAt ?? 0);
  if (updatedAt && Date.now() - updatedAt < STALE_AFTER_MS) return;
  await redis.publish(channel, JSON.stringify({
    event: "stale",
    address,
    chainId: "solana",
    updatedAt: updatedAt || null,
    checkedAt: Date.now(),
  }));
}

async function getActiveSubscriptions() {
  const now = Date.now();
  await redis.zRemRangeByScore(subscriptionKey, "-inf", now);
  const members = await redis.zRangeByScore(subscriptionKey, now, "+inf");
  // Each live SSE connection has its own member. Use the address suffix to
  // deduplicate connections and to keep subscriptions shared across instances.
  return [...new Set(members.map((member) => member.slice(member.lastIndexOf(":") + 1)).filter(Boolean))];
}

async function poll(isLeader = () => true) {
  const active = await getActiveSubscriptions();
  for (let offset = 0; offset < active.length; offset += MAX_TOKENS_PER_REQUEST) {
    if (!isLeader()) break;
    const batch = active.slice(offset, offset + MAX_TOKENS_PER_REQUEST);
    if (!batch.length) continue;
    try {
      const snapshots = await fetchBirdeye(batch);
      await Promise.all(snapshots.map(publishSnapshot));
      const returned = new Set(snapshots.map((snapshot) => snapshot.address));
      await Promise.all(batch.filter((address) => !returned.has(address)).map(publishStaleIfExpired));
      log("market batch updated", { count: snapshots.length });
    } catch (error) {
      log("market batch failed", { error: error instanceof Error ? error.message : "unknown" });
      await Promise.allSettled(batch.map(publishStaleIfExpired));
    }
  }
}

async function leaderPoll() {
  const acquired = await redis.set(leaderKey, instanceId, { NX: true, EX: LEADER_TTL_SEC });
  if (!acquired) return;

  let leaseOwned = true;
  let renewing = false;
  const renewTimer = setInterval(async () => {
    if (renewing || !leaseOwned) return;
    renewing = true;
    try {
      const renewed = await redis.eval(RENEW_LEADER_SCRIPT, {
        keys: [leaderKey],
        arguments: [instanceId, String(LEADER_TTL_SEC)],
      });
      if (!renewed) leaseOwned = false;
    } catch (error) {
      leaseOwned = false;
      log("leader lease renewal failed", { error: error instanceof Error ? error.message : "unknown" });
    } finally {
      renewing = false;
    }
  }, LEADER_RENEW_INTERVAL_MS);

  try {
    await poll(() => leaseOwned);
  } finally {
    clearInterval(renewTimer);
    try {
      await redis.eval(RELEASE_LEADER_SCRIPT, {
        keys: [leaderKey],
        arguments: [instanceId],
      });
    } catch (error) {
      log("leader lease release failed", { error: error instanceof Error ? error.message : "unknown" });
    }
  }
}

function subscriptionMember(clientId, address) {
  return `${instanceId}:${clientId}:${address}`;
}

async function handleStream(req, res, url) {
  const tokens = new Set(parseTokens(url));
  if (!tokens.size) return json(res, req, 400, { error: "tokens query parameter is required" });

  // Read cache and register subscriptions before committing SSE headers. Redis
  // failures can still return a clean HTTP error instead of corrupting a stream.
  const cachedSnapshots = await Promise.all([...tokens].map(async (token) => [token, await redis.get(keyFor(token))]));
  const clientId = crypto.randomUUID();
  const client = {
    id: clientId,
    req,
    res,
    tokens,
    members: [...tokens].map((token) => subscriptionMember(clientId, token)),
    heartbeat: null,
    cleanedUp: false,
  };
  await redis.zAdd(subscriptionKey, client.members.map((member) => ({ score: Date.now() + 60_000, value: member })));
  if (res.destroyed) {
    await redis.zRem(subscriptionKey, client.members);
    return;
  }

  clients.add(client);
  const cleanup = () => {
    if (client.cleanedUp) return;
    client.cleanedUp = true;
    clearInterval(client.heartbeat);
    clients.delete(client);
    void redis.zRem(subscriptionKey, client.members).catch((error) => {
      log("subscription cleanup failed", { error: error instanceof Error ? error.message : "unknown" });
    });
  };
  // IncomingMessage 'close' can fire when the GET request body completes. The
  // ServerResponse 'close' is the correct signal for a disconnected SSE stream.
  res.on("close", cleanup);
  res.on("error", cleanup);
  req.on("aborted", cleanup);

  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    ...corsHeaders(req),
  });
  res.write(": connected\n\n");
  for (const [token, cached] of cachedSnapshots) {
    if (!cached) continue;
    try {
      const snapshot = JSON.parse(cached);
      if (Date.now() - Number(snapshot.updatedAt ?? 0) >= STALE_AFTER_MS) {
        sendSse(client, "stale", { address: token, chainId: "solana", updatedAt: snapshot.updatedAt ?? null, checkedAt: Date.now() });
      } else {
        sendSse(client, "price", snapshot);
      }
    } catch {
      sendSse(client, "stale", { address: token, chainId: "solana", updatedAt: null, checkedAt: Date.now() });
    }
  }

  client.heartbeat = setInterval(() => {
    if (client.cleanedUp || res.destroyed) return cleanup();
    const score = Date.now() + 60_000;
    void redis.zAdd(subscriptionKey, client.members.map((member) => ({ score, value: member }))).catch((error) => {
      log("subscription refresh failed", { error: error instanceof Error ? error.message : "unknown" });
    });
    res.write(`: heartbeat ${Date.now()}\n\n`);
  }, 15_000);
}

async function main() {
  await redis.connect();
  await redisSubscriber.connect();
  await redisSubscriber.subscribe(channel, (message) => {
    try {
      const payload = JSON.parse(message);
      broadcast(payload, payload.event === "stale" ? "stale" : "price");
    } catch {
      log("invalid redis market message");
    }
  });

  const pollTimer = setInterval(() => leaderPoll().catch((error) => log("leader poll failed", { error: error.message })), POLL_INTERVAL_MS);
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    void redis.zRemRangeByScore(subscriptionKey, "-inf", now).catch((error) => {
      log("subscription expiry cleanup failed", { error: error instanceof Error ? error.message : "unknown" });
    });
  }, 30_000);

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    if (req.method === "OPTIONS") {
      res.writeHead(204, { ...corsHeaders(req), "Access-Control-Allow-Methods": "GET,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" });
      return res.end();
    }
    if (req.method === "GET" && url.pathname === "/health") return json(res, req, 200, { ok: true, service: "market-collector", clients: clients.size, subscriptions: await awaitSubscriptionCount(), checkedAt: new Date().toISOString() });
    if (req.method === "GET" && url.pathname === "/stream") return handleStream(req, res, url).catch((error) => {
      log("stream initialization failed", { error: error instanceof Error ? error.message : "unknown" });
      if (!res.headersSent) json(res, req, 503, { error: "stream_unavailable" });
      else res.destroy(error);
    });
    return json(res, req, 404, { error: "not_found" });
  });
  server.listen(PORT, () => log("market collector listening", { port: PORT, instanceId }));

  async function shutdown() {
    clearInterval(pollTimer);
    clearInterval(cleanupTimer);
    const closingClients = [...clients];
    for (const client of closingClients) {
      client.cleanedUp = true;
      clearInterval(client.heartbeat);
      clients.delete(client);
      client.res.end();
    }
    await redis.zRem(subscriptionKey, closingClients.flatMap((client) => client.members));
    await Promise.allSettled([redis.quit(), redisSubscriber.quit()]);
    server.close();
  }
  process.once("SIGTERM", () => void shutdown());
  process.once("SIGINT", () => void shutdown());
}

function awaitSubscriptionCount() {
  return redis.zCard(subscriptionKey).catch(() => 0);
}

main().catch((error) => { log("collector startup failed", { error: error.message }); process.exit(1); });

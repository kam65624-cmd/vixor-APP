import type { H3Event } from "h3";

// --- CORS ---
const ALLOWED_ORIGINS = [
  "https://vixor.app",
  "https://www.vixor.app",
  "https://vixor-*.vercel.app",
];

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.some((o) => {
    if (o.includes("*")) {
      const pattern = o.replace("*", ".*");
      return new RegExp(`^${pattern}$`).test(origin);
    }
    return o === origin;
  });
}

export function setCorsHeaders(event: H3Event) {
  const origin = getHeader(event, "origin") || "";
  if (isAllowedOrigin(origin)) {
    setResponseHeader(event, "Access-Control-Allow-Origin", origin);
    setResponseHeader(event, "Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    setResponseHeader(event, "Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Key");
    setResponseHeader(event, "Vary", "Origin");
  }
}

export function handlePreflight(event: H3Event): boolean {
  if (getMethod(event) === "OPTIONS") {
    setCorsHeaders(event);
    setResponseStatus(event, 204);
    return true;
  }
  setCorsHeaders(event);
  return false;
}

// --- Rate Limiting (in-memory sliding window) ---
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS = 60;
const WINDOW_MS = 60_000;
const MAX_MAP_SIZE = 1000;

function getClientKey(event: H3Event): string {
  const ip = getHeader(event, "x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const path = getRequestURL(event).pathname;
  return `${ip}:${path}`;
}

export function rateLimit(event: H3Event): boolean {
  const key = getClientKey(event);
  const now = Date.now();
  let entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    rateLimitMap.set(key, entry);
  }
  entry.count++;
  // Prune if map too large
  if (rateLimitMap.size > MAX_MAP_SIZE) {
    const oldest = [...rateLimitMap.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt);
    for (let i = 0; i < oldest.length / 2; i++) rateLimitMap.delete(oldest[i][0]);
  }
  if (entry.count > MAX_REQUESTS) {
    setResponseStatus(event, 429);
    return false;
  }
  return true;
}

// --- Auth ---
export function validateAdminKey(event: H3Event): boolean {
  const key = getHeader(event, "x-admin-key") || getQuery(event).admin_key as string | undefined;
  if (!key) return false;
  // Accept the key if it matches ADMIN_API_KEY env or CRON_SECRET
  if (key === process.env.ADMIN_API_KEY || key === process.env.CRON_SECRET) return true;
  return false;
}

export function requireAuth(event: H3Event): boolean {
  const auth = getHeader(event, "authorization");
  if (!auth?.startsWith("Bearer ")) return false;
  return true;
}
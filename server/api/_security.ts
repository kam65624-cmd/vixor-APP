import {
  type H3Event,
  getHeader,
  getMethod,
  setResponseHeader,
  setResponseStatus,
  getRequestURL,
} from "h3";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/supabase/types";

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
    setResponseHeader(
      event,
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Admin-Key",
    );
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
// ⚠️ DEPRECATED: This in-memory rate limiter does NOT work on Vercel Serverless
// because each function invocation gets a fresh process. Use the Redis-backed
// `withRateLimit` wrapper from `@/server/utils/with-rate-limit` or the
// `globalApiRateLimiter` from `@/shared/resilience/redis-rate-limiter` instead.
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
  // Never accept secrets in URLs: query strings are routinely logged and may
  // leak through browser history, referrers, proxies, or analytics systems.
  const key = getHeader(event, "x-admin-key");
  if (!key) return false;
  // Accept the key if it matches ADMIN_API_KEY env or CRON_SECRET
  if (key === process.env.ADMIN_API_KEY || key === process.env.CRON_SECRET) return true;
  return false;
}

/**
 * Result of a successful authentication.
 */
export interface AuthResult {
  userId: string;
  email: string | null;
  supabase: ReturnType<typeof createClient<Database>>;
}

/**
 * Validate the Bearer token against Supabase and return user info.
 * Returns null if the token is missing, malformed, or invalid.
 *
 * This replaces the old `requireAuth` which only checked the "Bearer " prefix
 * and never validated the JWT — a critical auth bypass vulnerability.
 */
export async function authenticateRequest(event: H3Event): Promise<AuthResult | null> {
  const authHeader = getHeader(event, "authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.replace("Bearer ", "");
  if (!token) return null;

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("[Security] SUPABASE_URL or SUPABASE_KEY not configured");
    return null;
  }

  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    if (error) {
      console.warn("[Security] Token validation failed:", error.message);
    }
    return null;
  }

  return {
    userId: data.user.id,
    email: data.user.email,
    supabase,
  };
}

// Simple in-memory rate limiter for createServerFn
const serverFnLimits = new Map<string, { count: number; resetAt: number }>();

export async function rateLimitServerFn() {
  const key = "server-fn-global";
  const now = Date.now();
  let entry = serverFnLimits.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + 60_000 };
    serverFnLimits.set(key, entry);
  }
  entry.count++;
  if (entry.count > 120) {
    throw new Error("Rate limit exceeded");
  }
}
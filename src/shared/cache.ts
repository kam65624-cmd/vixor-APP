// ============================================================================
// Vixor Unified Cache — Upstash Redis with in-memory fallback
// ============================================================================
//
// Provides a type-safe caching abstraction that:
//   - Primary: Uses Upstash Redis when UPSTASH_REDIS_REST_URL is configured
//   - Fallback: Uses in-memory Map when Redis is not available (local dev)
//   - Auto-prefixes keys with `vixor:` to avoid collisions
//   - Supports TTL per cache entry
//   - Never crashes — graceful fallback if Redis is down
//
// Usage:
//   import { cache } from "@/shared/cache";
//   await cache.set("price:BTC/USDT", priceData, 60_000);
//   const data = await cache.get<PriceResult>("price:BTC/USDT");
// ============================================================================

const KEY_PREFIX = "vixor:";

// ── Cache Provider Interface ──

export interface CacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlMs?: number): Promise<void>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

// ── In-Memory Cache Implementation ──

interface InMemoryEntry<T> {
  value: T;
  expiresAt: number | null; // null = no expiry
  timeoutId: ReturnType<typeof setTimeout> | null;
}

class InMemoryCache implements CacheProvider {
  private store = new Map<string, InMemoryEntry<unknown>>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    // Check if expired
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      if (entry.timeoutId) clearTimeout(entry.timeoutId);
      return null;
    }

    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    // Clear existing entry if present
    const existing = this.store.get(key);
    if (existing?.timeoutId) clearTimeout(existing.timeoutId);

    let expiresAt: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    if (ttlMs && ttlMs > 0) {
      expiresAt = Date.now() + ttlMs;
      timeoutId = setTimeout(() => {
        this.store.delete(key);
      }, ttlMs);
      // Don't prevent Node.js process from exiting
      if (timeoutId && typeof timeoutId === "object" && "unref" in timeoutId) {
        timeoutId.unref();
      }
    }

    this.store.set(key, { value, expiresAt, timeoutId });
  }

  async delete(key: string): Promise<void> {
    const entry = this.store.get(key);
    if (entry?.timeoutId) clearTimeout(entry.timeoutId);
    this.store.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    if (!entry) return false;

    // Check if expired
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      if (entry.timeoutId) clearTimeout(entry.timeoutId);
      return false;
    }

    return true;
  }
}

// ── Upstash Redis Cache Implementation ──

class RedisCache implements CacheProvider {
  private redis: import("@upstash/redis").Redis;

  constructor(redis: import("@upstash/redis").Redis) {
    this.redis = redis;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const result = await this.redis.get<string>(key);
      if (result === null) return null;
      return JSON.parse(result) as T;
    } catch (err) {
      console.warn(
        `[Cache] Redis GET failed for key "${key}":`,
        err instanceof Error ? err.message : String(err),
      );
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttlMs && ttlMs > 0) {
        // Redis EX expects seconds, minimum 1
        const ttlSec = Math.max(1, Math.ceil(ttlMs / 1000));
        await this.redis.set(key, serialized, { ex: ttlSec });
      } else {
        await this.redis.set(key, serialized);
      }
    } catch (err) {
      console.warn(
        `[Cache] Redis SET failed for key "${key}":`,
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (err) {
      console.warn(
        `[Cache] Redis DELETE failed for key "${key}":`,
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (err) {
      console.warn(
        `[Cache] Redis EXISTS failed for key "${key}":`,
        err instanceof Error ? err.message : String(err),
      );
      return false;
    }
  }
}

// ── Hybrid Cache: Redis primary with in-memory fallback ──

class HybridCache implements CacheProvider {
  private primary: CacheProvider;
  private fallback: InMemoryCache;
  private useRedis: boolean;

  constructor(primary: CacheProvider, fallback: InMemoryCache, useRedis: boolean) {
    this.primary = primary;
    this.fallback = fallback;
    this.useRedis = useRedis;
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.useRedis) {
      try {
        const result = await this.primary.get<T>(key);
        if (result !== null) return result;
      } catch {
        // Redis failed, try fallback
      }
    }

    // Always check in-memory fallback as well
    return this.fallback.get<T>(key);
  }

  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    // Write to both stores for maximum resilience
    const promises: Promise<void>[] = [this.fallback.set(key, value, ttlMs)];

    if (this.useRedis) {
      promises.push(this.primary.set(key, value, ttlMs));
    }

    await Promise.allSettled(promises);
  }

  async delete(key: string): Promise<void> {
    const promises: Promise<void>[] = [this.fallback.delete(key)];

    if (this.useRedis) {
      promises.push(this.primary.delete(key));
    }

    await Promise.allSettled(promises);
  }

  async exists(key: string): Promise<boolean> {
    if (this.useRedis) {
      try {
        const result = await this.primary.exists(key);
        if (result) return true;
      } catch {
        // Redis failed, check fallback
      }
    }

    return this.fallback.exists(key);
  }
}

// ── Singleton Cache Instance ──

let cacheInstance: HybridCache | null = null;
let cacheInitPromise: Promise<HybridCache> | null = null;

async function createCache(): Promise<HybridCache> {
  if (cacheInstance) return cacheInstance;
  // If initialization is already in progress, wait for it
  if (cacheInitPromise) return cacheInitPromise;

  cacheInitPromise = (async () => {
    const inMemory = new InMemoryCache();

    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    let useRedis = false;
    let primary: CacheProvider;

    if (redisUrl && redisToken) {
      try {
        const { Redis } = await import("@upstash/redis");
        const redis = new Redis({ url: redisUrl, token: redisToken });
        primary = new RedisCache(redis);
        useRedis = true;
        console.log("[Cache] ✅ Upstash Redis connected");
      } catch (err) {
        console.warn(
          "[Cache] ⚠️ Failed to initialize Upstash Redis, using in-memory fallback:",
          err instanceof Error ? err.message : String(err),
        );
        primary = inMemory;
      }
    } else {
      console.log("[Cache] ℹ️ No UPSTASH_REDIS_REST_URL configured, using in-memory cache");
      primary = inMemory;
    }

    cacheInstance = new HybridCache(primary, inMemory, useRedis);
    return cacheInstance;
  })();

  return cacheInitPromise;
}

// ── Public API ──

/**
 * Prefix a raw key with the vixor namespace.
 */
function prefixKey(key: string): string {
  return `${KEY_PREFIX}${key}`;
}

/**
 * The unified cache instance. Use this everywhere in the app.
 *
 * Example:
 *   await cache.set("price:BTC/USDT", priceData, 60_000); // 60s TTL
 *   const data = await cache.get<PriceResult>("price:BTC/USDT");
 */
export const cache: CacheProvider = {
  async get<T>(key: string): Promise<T | null> {
    const instance = await createCache();
    return instance.get<T>(prefixKey(key));
  },

  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    const instance = await createCache();
    return instance.set(prefixKey(key), value, ttlMs);
  },

  async delete(key: string): Promise<void> {
    const instance = await createCache();
    return instance.delete(prefixKey(key));
  },

  async exists(key: string): Promise<boolean> {
    const instance = await createCache();
    return instance.exists(prefixKey(key));
  },
};

// ── Cache Key Constants ──

export const CACHE_KEYS = {
  price: (pair: string) => `price:${pair}`,
  klines: (pair: string, interval: string) => `klines:${pair}:${interval}`,
  marketPrices: () => `market-prices`,
  news: (category: string) => `news:${category}`,
} as const;

// ── Cache TTL Constants (in milliseconds) ──

export const CACHE_TTL = {
  PRICE: 60_000, // 60 seconds
  KLINES_SHORT: 60_000, // 60 seconds (1H and below)
  KLINES_LONG: 300_000, // 300 seconds (4H and above)
  MARKET_PRICES: 30_000, // 30 seconds
  NEWS: 120_000, // 120 seconds
} as const;

/**
 * Determine the appropriate klines TTL based on interval.
 * 4H, 1D, 1W = 300s; everything else = 60s.
 */
export function getKlinesTtl(interval: string): number {
  const longIntervals = ["4H", "1D", "1W"];
  return longIntervals.includes(interval) ? CACHE_TTL.KLINES_LONG : CACHE_TTL.KLINES_SHORT;
}

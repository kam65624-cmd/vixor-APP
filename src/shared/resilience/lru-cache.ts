// ============================================================================
// VIXOR LRU Cache — Least Recently Used with TTL
// ============================================================================
//
// Generic in-memory LRU cache with per-entry TTL support.
// Uses Map's insertion-order guarantee for O(1) LRU eviction.
//
// Usage:
//   const cache = new LRUCache<string, number[]>({ maxSize: 500, defaultTTLMs: 10_000 });
//   cache.set("BTC", [1, 2, 3]);
//   cache.get("BTC"); // [1, 2, 3]
// ============================================================================

/** Configuration for an LRUCache instance. */
export interface LRUCacheConfig {
  /**
   * Maximum number of entries. Default: 1000.
   * Alias: capacity (for backward compatibility).
   */
  maxSize?: number;
  /** @deprecated Use maxSize instead. */
  capacity?: number;
  /**
   * Default TTL for entries in ms. Default: 600_000 (10 min).
   * Alias: defaultTtlMs (for backward compatibility).
   */
  defaultTTLMs?: number;
  /** @deprecated Use defaultTTLMs instead. */
  defaultTtlMs?: number;
  /** Name used for observability. */
  name?: string;
}

/** Cache stats snapshot. */
export interface LRUCacheStats {
  name: string;
  size: number;
  capacity: number;
  hits: number;
  misses: number;
  evictions: number;
  expirations: number;
  hitRate: number;
}

interface CacheEntry<V> {
  value: V;
  expiresAt: number | null;
}

/**
 * Generic LRU cache with TTL support.
 *
 * @typeParam K - Key type (must be usable as a Map key).
 * @typeParam V - Value type.
 */
export class LRUCache<K, V> {
  readonly maxSize: number;
  readonly defaultTTLMs: number;
  readonly name: string;

  private store = new Map<K, CacheEntry<V>>();

  // Stats
  private hits = 0;
  private misses = 0;
  private evictions = 0;
  private expirations = 0;

  constructor(config: LRUCacheConfig = {}) {
    // Support both old (capacity/defaultTtlMs) and new (maxSize/defaultTTLMs) names
    this.maxSize = config.maxSize ?? config.capacity ?? 1000;
    this.defaultTTLMs = config.defaultTTLMs ?? config.defaultTtlMs ?? 600_000;
    this.name = config.name ?? "default";

    if (this.maxSize < 1) {
      throw new Error(`LRUCache: maxSize must be >= 1 (got ${this.maxSize})`);
    }
  }

  /**
   * Get a value by key. Returns undefined on miss or expiry.
   * Side-effect: refreshes LRU order on hit.
   */
  get(key: K): V | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses += 1;
      return undefined;
    }

    // Check TTL
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses += 1;
      this.expirations += 1;
      return undefined;
    }

    // Refresh LRU order: delete + re-insert
    this.store.delete(key);
    this.store.set(key, entry);
    this.hits += 1;
    return entry.value;
  }

  /**
   * Set a value. If the cache is at capacity, the LRU entry is evicted.
   *
   * @param key - Cache key.
   * @param value - Value to cache.
   * @param ttlMs - Optional per-entry TTL override. Uses defaultTTLMs if omitted.
   */
  set(key: K, value: V, ttlMs?: number): void {
    // Remove existing to refresh LRU position
    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= this.maxSize) {
      // Evict LRU (first key in Map iteration order)
      const lruKey = this.store.keys().next().value;
      if (lruKey !== undefined) {
        this.store.delete(lruKey);
        this.evictions += 1;
      }
    }

    const ttl = ttlMs ?? this.defaultTTLMs;
    const expiresAt = ttl > 0 ? Date.now() + ttl : null;

    this.store.set(key, { value, expiresAt });
  }

  /**
   * Check if a key exists and is not expired. Does NOT refresh LRU.
   */
  has(key: K): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.expirations += 1;
      return false;
    }
    return true;
  }

  /**
   * Delete a single entry.
   * @returns True if the entry existed and was removed.
   */
  delete(key: K): boolean {
    return this.store.delete(key);
  }

  /**
   * Remove all entries from the cache.
   * Returns the count removed.
   */
  clear(): number {
    const n = this.store.size;
    this.store.clear();
    return n;
  }

  /**
   * Current number of entries in the cache.
   */
  size(): number {
    return this.store.size;
  }

  // ── Observability ────────────────────────────────────────────────────────

  /** Return a snapshot of cache stats. */
  stats(): LRUCacheStats {
    const total = this.hits + this.misses;
    return {
      name: this.name,
      size: this.store.size,
      capacity: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      expirations: this.expirations,
      hitRate: total === 0 ? 0 : this.hits / total,
    };
  }

  /** Reset all stats counters to zero. Does NOT clear entries. */
  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
    this.expirations = 0;
  }
}

// ── Pre-configured caches for common data types ────────────────────────────

/** Pre-configured LRU caches keyed by data type. */
export const Caches = {
  /** Price quotes: 500 entries, 10s TTL. */
  prices: new LRUCache<string, unknown>({ maxSize: 500, defaultTTLMs: 10_000 }),
  /** Kline/candle data: 200 entries, 1min TTL. */
  klines: new LRUCache<string, unknown>({ maxSize: 200, defaultTTLMs: 60_000 }),
  /** News items: 100 entries, 5min TTL. */
  news: new LRUCache<string, unknown>({ maxSize: 100, defaultTTLMs: 300_000 }),
  /** LLM analysis results: 1000 entries, 10min TTL. */
  analysis: new LRUCache<string, unknown>({ maxSize: 1000, defaultTTLMs: 600_000 }),
} as const;

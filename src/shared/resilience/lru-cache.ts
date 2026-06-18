// ============================================================================
// VIXOR LRU Cache — Least Recently Used with TTL
// ============================================================================
//
// Port of QuantDinger's app/data_sources/cache_manager.py.
//
// Pure in-memory LRU cache. Each entry has:
//   - A value (generic)
//   - An optional TTL (expires after N ms)
//   - A hit count for observability
//
// On access, expired entries are evicted and treated as a miss.
// When `capacity` is exceeded, the least-recently-used entry is evicted.
//
// NOTE: This is a SYNCHRONOUS in-memory cache. It is NOT a drop-in
// replacement for the async CacheProvider in @/shared/cache — use that for
// cross-instance Redis-backed caching. Use LRUCache for hot in-process data
// like the news cache, response-shape memoization, etc.
//
// Usage:
//   import { LRUCache } from "@/shared/resilience/lru-cache";
//
//   const cache = new LRUCache<string, NewsItem[]>({ capacity: 500, defaultTtlMs: 300_000 });
//   cache.set("EURUSD", items, 60_000); // 60s override
//   const hit = cache.get("EURUSD");    // NewsItem[] | undefined
// ============================================================================

export interface LRUCacheOptions {
  /** Max number of entries. When exceeded, LRU is evicted. Default: 1000. */
  capacity?: number;
  /** Default TTL for entries (overridable per-set). Default: no expiry. */
  defaultTtlMs?: number;
  /** Name used in stats() for observability. */
  name?: string;
}

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

interface Entry<V> {
  value: V;
  expiresAt: number | null; // null = never expires
  hitCount: number;
}

/**
 * Generic LRU cache with TTL support and integrated stats.
 *
 * Iteration order of the internal Map IS access order (most-recently-used
 * at the end) because we re-insert on get(). This gives us O(1) LRU
 * eviction via `map.keys().next()` returning the LRU entry.
 */
export class LRUCache<K, V> {
  readonly name: string;
  readonly capacity: number;
  readonly defaultTtlMs: number | null;

  private store = new Map<K, Entry<V>>();

  // Stats
  private hits = 0;
  private misses = 0;
  private evictions = 0;
  private expirations = 0;

  constructor(options: LRUCacheOptions = {}) {
    this.capacity = options.capacity ?? 1000;
    this.defaultTtlMs = options.defaultTtlMs ?? null;
    this.name = options.name ?? "default";

    if (this.capacity < 1) {
      throw new Error(`LRUCache: capacity must be >= 1 (got ${this.capacity})`);
    }
  }

  // ── Core operations ──────────────────────────────────────────────────────

  /**
   * Get a value by key. Returns undefined on miss (expired or never set).
   * Side effect: refreshes LRU order on hit.
   */
  get(key: K): V | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses += 1;
      return undefined;
    }

    // Check TTL expiry.
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses += 1;
      this.expirations += 1;
      return undefined;
    }

    // Refresh LRU: delete + re-insert moves the entry to the end of the Map.
    this.store.delete(key);
    this.store.set(key, entry);
    entry.hitCount += 1;
    this.hits += 1;
    return entry.value;
  }

  /**
   * Set a value. Optionally override the default TTL.
   *
   * If the cache is at capacity, the LRU entry is evicted before insert.
   * If `key` already exists, its value + TTL are updated and LRU refreshed.
   */
  set(key: K, value: V, ttlMs?: number): void {
    // Delete existing entry so re-inserting refreshes LRU position.
    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= this.capacity) {
      // Evict LRU (first key in Map iteration order).
      const lruKey = this.store.keys().next().value;
      if (lruKey !== undefined) {
        this.store.delete(lruKey);
        this.evictions += 1;
      }
    }

    const resolvedTtl = ttlMs ?? this.defaultTtlMs;
    const expiresAt = resolvedTtl !== null && resolvedTtl > 0 ? Date.now() + resolvedTtl : null;

    this.store.set(key, { value, expiresAt, hitCount: 0 });
  }

  /** Check if a key exists and is not expired. Does NOT refresh LRU. */
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

  /** Delete an entry. Returns true if it existed. */
  delete(key: K): boolean {
    return this.store.delete(key);
  }

  /** Remove all entries. Returns the count removed. */
  clear(): number {
    const n = this.store.size;
    this.store.clear();
    return n;
  }

  /** Current entry count. */
  size(): number {
    return this.store.size;
  }

  // ── Maintenance ──────────────────────────────────────────────────────────

  /**
   * Sweep through all entries and remove expired ones.
   * Returns the count removed.
   *
   * This is O(n) — call periodically (e.g., every 5 min) rather than on every
   * request. Gets/sets lazily evict on access, so this is just hygiene.
   */
  cleanupExpired(): number {
    let removed = 0;
    const now = Date.now();
    for (const [k, entry] of this.store) {
      if (entry.expiresAt !== null && now > entry.expiresAt) {
        this.store.delete(k);
        removed += 1;
      }
    }
    this.expirations += removed;
    return removed;
  }

  // ── Observability ────────────────────────────────────────────────────────

  /** Return a snapshot of cache stats. */
  stats(): LRUCacheStats {
    const total = this.hits + this.misses;
    return {
      name: this.name,
      size: this.store.size,
      capacity: this.capacity,
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

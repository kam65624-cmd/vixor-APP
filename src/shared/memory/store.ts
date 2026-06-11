// ============================================================================
// VIXOR Memory System — Long-term User Memory (PostgreSQL Only)
// ============================================================================
//
// Stores user behavior, trading style, strategy preferences, mistakes,
// and learned patterns in Supabase PostgreSQL.
//
// NO pgvector, NO embeddings, NO LLMs — pure structured memory.
//
// Memory Types:
//   - preference: User preferences (pairs, timeframes, style)
//   - behavior: Observed behavior patterns (trade frequency, journal cadence)
//   - mistake: Trading mistakes for learning
//   - insight: Copilot-generated insights about the user
//   - strategy: User's active trading strategy notes
//
// Usage:
//   import { MemoryStore } from "@/shared/memory";
//
//   await MemoryStore.store(userId, "preference", "preferred_pairs", ["BTC/USDT", "XAU/USD"]);
//   const pairs = await MemoryStore.retrieve(userId, "preference", "preferred_pairs");
// ============================================================================

// ── Memory Types ─────────────────────────────────────────────────────────────

export type MemoryCategory = "preference" | "behavior" | "mistake" | "insight" | "strategy";

export interface MemoryEntry {
  id?: string;
  user_id: string;
  category: MemoryCategory;
  key: string;
  value: unknown;
  confidence: number; // 0-1, how confident we are about this memory
  source: string; // what generated this memory (e.g., "copilot", "user_action", "system")
  created_at?: string;
  updated_at?: string;
}

// ── Memory Store Class ───────────────────────────────────────────────────────

class MemoryStoreClass {
  /**
   * Store a memory entry. Upserts if the key already exists for this user+category.
   */
  async store(
    userId: string,
    category: MemoryCategory,
    key: string,
    value: unknown,
    options: { confidence?: number; source?: string } = {},
  ): Promise<{ success: boolean; error?: string }> {
    const { confidence = 0.7, source = "system" } = options;

    try {
      const { supabaseAdmin } = await import("@/shared/supabase/client.server");

      // Upsert: update if exists, insert if not
      const { error } = await supabaseAdmin
        .from("user_memories")
        .upsert(
          {
            user_id: userId,
            category,
            key,
            value: JSON.stringify(value),
            confidence,
            source,
          },
          {
            onConflict: "user_id,category,key",
          },
        );

      if (error) {
        console.warn(`[MemoryStore] Store failed: ${error.message}`);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      console.warn("[MemoryStore] Store error:", err);
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  /**
   * Retrieve a specific memory entry.
   */
  async retrieve<T = unknown>(
    userId: string,
    category: MemoryCategory,
    key: string,
  ): Promise<T | null> {
    try {
      const { supabaseAdmin } = await import("@/shared/supabase/client.server");

      const { data, error } = await supabaseAdmin
        .from("user_memories")
        .select("value")
        .eq("user_id", userId)
        .eq("category", category)
        .eq("key", key)
        .maybeSingle();

      if (error || !data) return null;

      return JSON.parse(data.value as string) as T;
    } catch {
      return null;
    }
  }

  /**
   * Retrieve all memories of a category for a user.
   */
  async retrieveCategory<T = unknown>(
    userId: string,
    category: MemoryCategory,
  ): Promise<Array<{ key: string; value: T; confidence: number; source: string }>> {
    try {
      const { supabaseAdmin } = await import("@/shared/supabase/client.server");

      const { data, error } = await supabaseAdmin
        .from("user_memories")
        .select("key, value, confidence, source")
        .eq("user_id", userId)
        .eq("category", category)
        .order("confidence", { ascending: false });

      if (error || !data) return [];

      return data.map((row) => ({
        key: row.key as string,
        value: JSON.parse(row.value as string) as T,
        confidence: row.confidence as number,
        source: row.source as string,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Retrieve all memories for a user, grouped by category.
   */
  async retrieveAll(
    userId: string,
  ): Promise<Record<MemoryCategory, Array<{ key: string; value: unknown; confidence: number }>>> {
    try {
      const { supabaseAdmin } = await import("@/shared/supabase/client.server");

      const { data, error } = await supabaseAdmin
        .from("user_memories")
        .select("category, key, value, confidence")
        .eq("user_id", userId)
        .order("confidence", { ascending: false });

      if (error || !data) {
        return { preference: [], behavior: [], mistake: [], insight: [], strategy: [] };
      }

      const grouped: Record<string, Array<{ key: string; value: unknown; confidence: number }>> = {
        preference: [],
        behavior: [],
        mistake: [],
        insight: [],
        strategy: [],
      };

      for (const row of data) {
        const cat = row.category as string;
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push({
          key: row.key as string,
          value: JSON.parse(row.value as string),
          confidence: row.confidence as number,
        });
      }

      return grouped as Record<MemoryCategory, Array<{ key: string; value: unknown; confidence: number }>>;
    } catch {
      return { preference: [], behavior: [], mistake: [], insight: [], strategy: [] };
    }
  }

  /**
   * Delete a specific memory entry.
   */
  async forget(
    userId: string,
    category: MemoryCategory,
    key: string,
  ): Promise<{ success: boolean }> {
    try {
      const { supabaseAdmin } = await import("@/shared/supabase/client.server");

      const { error } = await supabaseAdmin
        .from("user_memories")
        .delete()
        .eq("user_id", userId)
        .eq("category", category)
        .eq("key", key);

      return { success: !error };
    } catch {
      return { success: false };
    }
  }

  /**
   * Learn from user behavior — automatically store observations.
   * Increases confidence if the same observation is made repeatedly.
   */
  async learn(
    userId: string,
    category: MemoryCategory,
    key: string,
    value: unknown,
    source: string = "user_action",
  ): Promise<void> {
    // Check if memory already exists
    const existing = await this.retrieve(userId, category, key);

    if (existing !== null) {
      // Memory exists — increase confidence
      try {
        const { supabaseAdmin } = await import("@/shared/supabase/client.server");

        // Increment confidence (capped at 1.0)
        await supabaseAdmin
          .from("user_memories")
          .update({
            confidence: 1, // Max confidence after reinforcement
            value: JSON.stringify(value),
            source,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .eq("category", category)
          .eq("key", key);
      } catch {
        // Non-critical
      }
    } else {
      // New memory — store with initial confidence
      await this.store(userId, category, key, value, {
        confidence: 0.5,
        source,
      });
    }
  }

  /**
   * Format user memories as a context string for Copilot prompts.
   */
  async contextForPrompt(userId: string): Promise<string> {
    const all = await this.retrieveAll(userId);
    const lines: string[] = [];

    const categoryLabels: Record<MemoryCategory, string> = {
      preference: "User Preferences",
      behavior: "Observed Behavior",
      mistake: "Known Mistakes",
      insight: "Insights",
      strategy: "Strategy Notes",
    };

    for (const [cat, entries] of Object.entries(all)) {
      if (entries.length === 0) continue;
      lines.push(`\n**${categoryLabels[cat as MemoryCategory]}:**`);
      for (const entry of entries) {
        lines.push(`  - ${entry.key}: ${JSON.stringify(entry.value)}`);
      }
    }

    return lines.length > 0 ? lines.join("\n") : "No stored memories for this user yet.";
  }
}

// ── Singleton Export ──────────────────────────────────────────────────────────

export const MemoryStore = new MemoryStoreClass();

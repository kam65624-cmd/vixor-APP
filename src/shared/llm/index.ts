// ============================================================================
// VIXOR LLM — LLMRouter
// ============================================================================
//
// Routes a ChatRequest to the appropriate provider, with fallback support.
//
// Selection priority:
//   1. req.provider (explicit override)
//   2. LLM_PROVIDER env var (e.g., "anthropic")
//   3. Auto-select: ZAI is the default (bundled, no key needed). If the user
//      has set OPENAI/ANTHROPIC/GROQ keys, those are preferred for cost /
//      quality when ZAI fails.
//
// Fallback: if the primary provider throws, the router tries each entry in
// req.fallbacks in order. If none are specified, the router tries all other
// configured providers in priority order.
//
// Usage:
//   import { LLMRouter } from "@/shared/llm";
//   const router = new LLMRouter();
//   const res = await router.chat({ messages: [{ role: "user", content: "Hi" }] });
//   console.log(res.content);
//
//   for await (const chunk of router.stream({ messages: [...] })) {
//     process.stdout.write(chunk.delta);
//   }
// ============================================================================

import type {
  ChatRequest,
  ChatResponse,
  ChatStreamChunk,
  LLMProvider,
  LLMProviderId,
} from "./types";
import { LLMError } from "./types";
import { zaiProvider } from "./providers/zai";
import { openaiProvider } from "./providers/openai";
import { anthropicProvider } from "./providers/anthropic";
import { groqProvider } from "./providers/groq";

// ── Provider registry ───────────────────────────────────────────────────────

const PROVIDERS: Record<LLMProviderId, LLMProvider> = {
  zai: zaiProvider,
  openai: openaiProvider,
  anthropic: anthropicProvider,
  groq: groqProvider,
};

// Auto-detect priority: ZAI is bundled and always works, so it's first.
// Then prefer Anthropic > Groq > OpenAI based on quality / latency trade-offs.
const AUTO_PRIORITY: LLMProviderId[] = ["zai", "anthropic", "groq", "openai"];

// ── Router ──────────────────────────────────────────────────────────────────

export interface LLMRouterOptions {
  /** Override the default provider for auto-selection. */
  defaultProvider?: LLMProviderId;
  /** Disable auto-fallback (only use the explicit provider). */
  noFallback?: boolean;
}

export class LLMRouter {
  private readonly defaultProvider: LLMProviderId;
  private readonly noFallback: boolean;

  constructor(options: LLMRouterOptions = {}) {
    this.defaultProvider = options.defaultProvider ?? this.resolveDefaultProviderFromEnv();
    this.noFallback = options.noFallback ?? false;
  }

  private resolveDefaultProviderFromEnv(): LLMProviderId {
    const envProvider = (process.env.LLM_PROVIDER ?? "").trim().toLowerCase();
    if (
      envProvider &&
      (envProvider === "zai" ||
        envProvider === "openai" ||
        envProvider === "anthropic" ||
        envProvider === "groq")
    ) {
      return envProvider as LLMProviderId;
    }
    return "zai";
  }

  /**
   * Resolve the effective provider chain for a request:
   *   [primary, ...fallbacks]
   *
   * If the primary is not configured (missing API key) AND fallbacks aren't
   * specified, we still return the primary — the call will throw a clear
   * "not configured" error from the provider.
   */
  private resolveChain(req: ChatRequest): LLMProviderId[] {
    const primary = req.provider ?? this.defaultProvider;
    const fallbacks: LLMProviderId[] = [];

    if (!this.noFallback) {
      if (req.fallbacks && req.fallbacks.length > 0) {
        fallbacks.push(...req.fallbacks);
      } else {
        // Auto-fallback to all OTHER configured providers in priority order.
        for (const id of AUTO_PRIORITY) {
          if (id !== primary && PROVIDERS[id].isConfigured()) {
            fallbacks.push(id);
          }
        }
      }
    }

    return [primary, ...fallbacks];
  }

  /**
   * Perform a chat completion. Falls back to the next provider on failure.
   */
  async chat(req: ChatRequest): Promise<ChatResponse> {
    const chain = this.resolveChain(req);
    let lastErr: unknown = null;

    for (const id of chain) {
      const provider = PROVIDERS[id];
      // Skip providers that aren't configured (unless they're the primary
      // — let the primary throw a clear "not configured" error).
      if (!provider.isConfigured() && id !== chain[0]) {
        continue;
      }
      try {
        return await provider.chat(req);
      } catch (err) {
        lastErr = err;
        if (err instanceof LLMError && err.code === "LLM_NOT_CONFIGURED") {
          // Don't bother falling back if the user explicitly asked for an
          // unconfigured provider — surface the clear error.
          if (id === chain[0]) throw err;
        }
        // Otherwise, try the next provider in the chain.
      }
    }

    throw lastErr instanceof Error
      ? lastErr
      : new LLMError("All LLM providers failed or were unconfigured.", {
          provider: chain[0] ?? "zai",
          code: "ALL_PROVIDERS_FAILED",
        });
  }

  /**
   * Stream a chat completion. Falls back to the next provider ONLY if the
   * initial connection fails — once streaming starts, mid-stream errors
   * propagate to the caller (we can't retry a half-streamed response).
   */
  async *stream(req: ChatRequest): AsyncGenerator<ChatStreamChunk, void, unknown> {
    const chain = this.resolveChain(req);
    let lastErr: unknown = null;

    for (const id of chain) {
      const provider = PROVIDERS[id];
      if (!provider.isConfigured() && id !== chain[0]) continue;

      try {
        // Try to start the stream. If the first chunk succeeds, we commit
        // to this provider for the rest of the stream.
        const generator = provider.stream(req);
        const firstChunk = await generator.next();

        if (firstChunk.done) return;
        yield firstChunk.value;

        // Stream the rest.
        for await (const chunk of generator) {
          yield chunk;
        }
        return;
      } catch (err) {
        lastErr = err;
        // Try the next provider.
      }
    }

    throw lastErr instanceof Error
      ? lastErr
      : new LLMError("All LLM providers failed to start stream.", {
          provider: chain[0] ?? "zai",
          code: "ALL_PROVIDERS_FAILED",
        });
  }

  // ── Introspection helpers ────────────────────────────────────────────────

  /**
   * Returns a list of all providers with their configured status and config.
   */
  listProviders(): Array<{
    id: LLMProviderId;
    configured: boolean;
    defaultModel: string;
    costPer1m: { prompt: number; completion: number };
    supportsStreaming: boolean;
    supportsToolCalls: boolean;
    supportsJsonMode: boolean;
  }> {
    return (Object.keys(PROVIDERS) as LLMProviderId[]).map((id) => {
      const p = PROVIDERS[id];
      return {
        id,
        configured: p.isConfigured(),
        defaultModel: p.config.defaultModel,
        costPer1m: p.config.costPer1m,
        supportsStreaming: p.config.supportsStreaming,
        supportsToolCalls: p.config.supportsToolCalls,
        supportsJsonMode: p.config.supportsJsonMode,
      };
    });
  }

  /**
   * Returns the default provider that this router will use when none is
   * specified in the request.
   */
  getDefaultProvider(): LLMProviderId {
    return this.defaultProvider;
  }
}

// ── Singleton + barrel re-exports ───────────────────────────────────────────

export const llmRouter = new LLMRouter();

export type {
  ChatMessage,
  ChatRequest,
  ChatResponse,
  ChatStreamChunk,
  LLMProvider,
  LLMProviderId,
  ProviderConfig,
  TokenUsage,
  ToolCall,
  ToolDefinition,
} from "./types";

export { LLMError } from "./types";
export { zaiProvider } from "./providers/zai";
export { openaiProvider } from "./providers/openai";
export { anthropicProvider } from "./providers/anthropic";
export { groqProvider } from "./providers/groq";

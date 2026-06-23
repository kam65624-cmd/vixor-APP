// ============================================================================
// VIXOR LLM — LLMRouter (fallback-compatible router)
// ============================================================================
//
// Routes a ChatRequest to the appropriate provider, with fallback support.
// This is the original router logic, kept for backward compatibility.
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

  private resolveChain(req: ChatRequest): LLMProviderId[] {
    const primary = req.provider ?? this.defaultProvider;
    const fallbacks: LLMProviderId[] = [];

    if (!this.noFallback) {
      if (req.fallbacks && req.fallbacks.length > 0) {
        fallbacks.push(...req.fallbacks);
      } else {
        for (const id of AUTO_PRIORITY) {
          if (id !== primary && PROVIDERS[id].isConfigured()) {
            fallbacks.push(id);
          }
        }
      }
    }

    return [primary, ...fallbacks];
  }

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const chain = this.resolveChain(req);
    let lastErr: unknown = null;

    for (const id of chain) {
      const provider = PROVIDERS[id];
      if (!provider.isConfigured() && id !== chain[0]) {
        continue;
      }
      try {
        return await provider.chat(req);
      } catch (err) {
        lastErr = err;
        if (err instanceof LLMError && err.code === "LLM_NOT_CONFIGURED") {
          if (id === chain[0]) throw err;
        }
      }
    }

    throw lastErr instanceof Error
      ? lastErr
      : new LLMError("All LLM providers failed or were unconfigured.", {
          provider: chain[0] ?? "zai",
          code: "ALL_PROVIDERS_FAILED",
        });
  }

  async *stream(req: ChatRequest): AsyncGenerator<ChatStreamChunk, void, unknown> {
    const chain = this.resolveChain(req);
    let lastErr: unknown = null;

    for (const id of chain) {
      const provider = PROVIDERS[id];
      if (!provider.isConfigured() && id !== chain[0]) continue;

      try {
        const generator = provider.stream(req);
        const firstChunk = await generator.next();

        if (firstChunk.done) return;
        yield firstChunk.value;

        for await (const chunk of generator) {
          yield chunk;
        }
        return;
      } catch (err) {
        lastErr = err;
      }
    }

    throw lastErr instanceof Error
      ? lastErr
      : new LLMError("All LLM providers failed to start stream.", {
          provider: chain[0] ?? "zai",
          code: "ALL_PROVIDERS_FAILED",
        });
  }

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

  getDefaultProvider(): LLMProviderId {
    return this.defaultProvider;
  }
}

/** Singleton LLMRouter instance. */
export const llmRouter = new LLMRouter();
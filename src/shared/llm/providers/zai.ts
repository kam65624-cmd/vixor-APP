// ============================================================================
// VIXOR LLM — ZAI Provider (uses z-ai-web-dev-sdk, no BYO key)
// ============================================================================
//
// The default provider for VIXOR. Uses the bundled z-ai-web-dev-sdk which
// is configured at deploy time and requires NO user API key.
//
// Supports: streaming, JSON mode, system prompt.
// Does NOT support: tool calls (z-ai SDK doesn't expose this in v0.0.18).
// ============================================================================

import type {
  ChatRequest,
  ChatResponse,
  ChatStreamChunk,
  LLMProvider,
  ProviderConfig,
  TokenUsage,
} from "../types";
import { LLMError } from "../types";

const ZAI_CONFIG: ProviderConfig = {
  id: "zai",
  defaultModel: "glm-4.6",
  fallbackModel: "glm-4.5-air",
  // z-ai is bundled and free for this project — zero direct cost.
  costPer1m: { prompt: 0, completion: 0 },
  supportsStreaming: true,
  supportsToolCalls: false,
  supportsJsonMode: true,
};

// ── Lazy singleton ──────────────────────────────────────────────────────────

type AnyZAI = any;
let zaiInstance: AnyZAI | null = null;

async function getZAI(): Promise<AnyZAI> {
  if (zaiInstance) return zaiInstance;
  try {
    const ZAI = await import("z-ai-web-dev-sdk");
    zaiInstance = await ZAI.default.create();
    return zaiInstance;
  } catch (err) {
    throw new LLMError(
      `Failed to initialize z-ai-web-dev-sdk: ${err instanceof Error ? err.message : String(err)}`,
      { provider: "zai", code: "ZAI_INIT_FAILED" },
    );
  }
}

function pickModel(req: ChatRequest): string {
  return req.model ?? ZAI_CONFIG.defaultModel;
}

function buildZaiMessages(req: ChatRequest) {
  const messages: Array<{ role: string; content: string }> = [];
  if (req.systemPrompt) {
    messages.push({ role: "system", content: req.systemPrompt });
  }
  for (const m of req.messages) {
    if (m.role === "tool") {
      // z-ai doesn't support tool messages — fold into user.
      messages.push({ role: "user", content: m.content });
    } else {
      messages.push({ role: m.role, content: m.content });
    }
  }
  return messages;
}

// ── Provider class ──────────────────────────────────────────────────────────

class ZaiProvider implements LLMProvider {
  readonly id = "zai" as const;
  readonly config = ZAI_CONFIG;

  isConfigured(): boolean {
    // z-ai-web-dev-sdk is bundled — always available.
    return true;
  }

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const startedAt = Date.now();
    const model = pickModel(req);
    const zai = await getZAI();
    const messages = buildZaiMessages(req);

    try {
      const response = await zai.chat.completions.create({
        model,
        messages,
        temperature: req.temperature ?? 0.7,
        ...(req.maxTokens ? { max_tokens: req.maxTokens } : {}),
        ...(req.jsonMode ? { response_format: { type: "json_object" } } : {}),
      });

      const content: string = response.choices?.[0]?.message?.content ?? "";
      const usageRaw = response.usage as
        | { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
        | undefined;
      const usage: TokenUsage | undefined = usageRaw
        ? {
            promptTokens: usageRaw.prompt_tokens ?? 0,
            completionTokens: usageRaw.completion_tokens ?? 0,
            totalTokens: usageRaw.total_tokens ?? 0,
          }
        : undefined;

      const estimatedCostUsd = estimateCost(
        ZAI_CONFIG,
        usage?.promptTokens ?? 0,
        usage?.completionTokens ?? 0,
      );

      return {
        provider: "zai",
        model,
        content,
        usage,
        estimatedCostUsd,
        raw: response,
        durationMs: Date.now() - startedAt,
      };
    } catch (err) {
      throw new LLMError(`ZAI chat failed: ${err instanceof Error ? err.message : String(err)}`, {
        provider: "zai",
        code: "ZAI_CHAT_FAILED",
      });
    }
  }

  async *stream(req: ChatRequest): AsyncGenerator<ChatStreamChunk, void, unknown> {
    const model = pickModel(req);
    const zai = await getZAI();
    const messages = buildZaiMessages(req);

    try {
      const stream = await zai.chat.completions.create({
        model,
        messages,
        temperature: req.temperature ?? 0.7,
        stream: true,
        ...(req.maxTokens ? { max_tokens: req.maxTokens } : {}),
        ...(req.jsonMode ? { response_format: { type: "json_object" } } : {}),
      });

      for await (const chunk of stream) {
        const delta: string = chunk.choices?.[0]?.delta?.content ?? "";
        if (delta) {
          yield { delta };
        }
      }
      yield { delta: "", done: true };
    } catch (err) {
      throw new LLMError(`ZAI stream failed: ${err instanceof Error ? err.message : String(err)}`, {
        provider: "zai",
        code: "ZAI_STREAM_FAILED",
      });
    }
  }
}

// ── Cost estimation helper (shared by all providers) ────────────────────────

export function estimateCost(
  config: ProviderConfig,
  promptTokens: number,
  completionTokens: number,
): number {
  const p = (promptTokens / 1_000_000) * config.costPer1m.prompt;
  const c = (completionTokens / 1_000_000) * config.costPer1m.completion;
  return Number((p + c).toFixed(6));
}

// ── Singleton export ────────────────────────────────────────────────────────

export const zaiProvider = new ZaiProvider();

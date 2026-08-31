// ============================================================================
// VIXOR LLM — OpenAI Provider (BYO key via OPENAI_API_KEY)
// ============================================================================
//
// Uses the OpenAI Chat Completions API (https://api.openai.com/v1/chat/completions).
// Supports: streaming, JSON mode, tool calls.
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
import { estimateCost } from "./zai";

const OPENAI_CONFIG: ProviderConfig = {
  id: "openai",
  defaultModel: "gpt-4o-mini",
  fallbackModel: "gpt-4o-mini",
  // Pricing as of 2024-12 — adjust if OpenAI changes their pricing.
  costPer1m: { prompt: 0.15, completion: 0.6 },
  supportsStreaming: true,
  supportsToolCalls: true,
  supportsJsonMode: true,
};

function getApiKey(): string {
  return (process.env.OPENAI_API_KEY ?? "").trim();
}

function getBaseUrl(): string {
  return (process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
}

function pickModel(req: ChatRequest): string {
  return req.model ?? OPENAI_CONFIG.defaultModel;
}

function buildBody(req: ChatRequest, model: string): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model,
    messages: [
      ...(req.systemPrompt ? [{ role: "system", content: req.systemPrompt }] : []),
      ...req.messages,
    ],
    temperature: req.temperature ?? 0.7,
  };
  if (req.maxTokens) body.max_tokens = req.maxTokens;
  if (req.jsonMode) body.response_format = { type: "json_object" };
  if (req.tools && req.tools.length > 0) body.tools = req.tools;
  return body;
}

class OpenAIProvider implements LLMProvider {
  readonly id = "openai" as const;
  readonly config = OPENAI_CONFIG;

  isConfigured(): boolean {
    return getApiKey().length > 0;
  }

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const startedAt = Date.now();
    const key = getApiKey();
    if (!key) {
      throw new LLMError("OpenAI API key not configured. Set OPENAI_API_KEY in the environment.", {
        provider: "openai",
        code: "OPENAI_NOT_CONFIGURED",
      });
    }

    const model = pickModel(req);
    const url = `${getBaseUrl()}/chat/completions`;
    const body = buildBody(req, model);

    const timeoutMs = req.timeoutMs ?? 60_000;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    if (timer && typeof timer === "object" && "unref" in timer) timer.unref();

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new LLMError(`OpenAI API ${res.status}: ${errText.slice(0, 500)}`, {
          provider: "openai",
          code: "OPENAI_HTTP_ERROR",
          statusCode: res.status,
        });
      }

      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string; tool_calls?: unknown[] } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      };

      const content = json.choices?.[0]?.message?.content ?? "";
      const usageRaw = json.usage;
      const usage: TokenUsage | undefined = usageRaw
        ? {
            promptTokens: usageRaw.prompt_tokens ?? 0,
            completionTokens: usageRaw.completion_tokens ?? 0,
            totalTokens: usageRaw.total_tokens ?? 0,
          }
        : undefined;

      const estimatedCostUsd = estimateCost(
        OPENAI_CONFIG,
        usage?.promptTokens ?? 0,
        usage?.completionTokens ?? 0,
      );

      return {
        provider: "openai",
        model,
        content,
        usage,
        estimatedCostUsd,
        raw: json,
        durationMs: Date.now() - startedAt,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  async *stream(req: ChatRequest): AsyncGenerator<ChatStreamChunk, void, unknown> {
    const key = getApiKey();
    if (!key) {
      throw new LLMError("OpenAI API key not configured. Set OPENAI_API_KEY in the environment.", {
        provider: "openai",
        code: "OPENAI_NOT_CONFIGURED",
      });
    }

    const model = pickModel(req);
    const url = `${getBaseUrl()}/chat/completions`;
    const body = { ...buildBody(req, model), stream: true };

    const timeoutMs = req.timeoutMs ?? 120_000;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    if (timer && typeof timer === "object" && "unref" in timer) timer.unref();

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "");
        throw new LLMError(`OpenAI stream ${res.status}: ${errText.slice(0, 500)}`, {
          provider: "openai",
          code: "OPENAI_STREAM_ERROR",
          statusCode: res.status,
        });
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE events are separated by \n\n
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const evt of events) {
          const line = evt.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") {
            yield { delta: "", done: true };
            return;
          }
          try {
            const parsed = JSON.parse(data) as {
              choices?: Array<{ delta?: { content?: string } }>;
            };
            const delta = parsed.choices?.[0]?.delta?.content ?? "";
            if (delta) yield { delta };
          } catch {
            // Skip malformed SSE events.
          }
        }
      }
      yield { delta: "", done: true };
    } finally {
      clearTimeout(timer);
    }
  }
}

export const openaiProvider = new OpenAIProvider();

// ============================================================================
// VIXOR LLM — Groq Provider (BYO key via GROQ_API_KEY)
// ============================================================================
//
// Groq is OpenAI-compatible. Uses https://api.groq.com/openai/v1/chat/completions.
// Supports: streaming, JSON mode, tool calls. Very low latency (LPU inference).
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

const GROQ_CONFIG: ProviderConfig = {
  id: "groq",
  defaultModel: "llama-3.3-70b-versatile",
  fallbackModel: "llama-3.1-8b-instant",
  // Groq pricing as of 2024-12
  costPer1m: { prompt: 0.59, completion: 0.79 },
  supportsStreaming: true,
  supportsToolCalls: true,
  supportsJsonMode: true,
};

function getApiKey(): string {
  return (process.env.GROQ_API_KEY ?? "").trim();
}

function getBaseUrl(): string {
  return (process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1").replace(/\/$/, "");
}

function pickModel(req: ChatRequest): string {
  return req.model ?? GROQ_CONFIG.defaultModel;
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

class GroqProvider implements LLMProvider {
  readonly id = "groq" as const;
  readonly config = GROQ_CONFIG;

  isConfigured(): boolean {
    return getApiKey().length > 0;
  }

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const startedAt = Date.now();
    const key = getApiKey();
    if (!key) {
      throw new LLMError("Groq API key not configured. Set GROQ_API_KEY in the environment.", {
        provider: "groq",
        code: "GROQ_NOT_CONFIGURED",
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
        throw new LLMError(`Groq API ${res.status}: ${errText.slice(0, 500)}`, {
          provider: "groq",
          code: "GROQ_HTTP_ERROR",
          statusCode: res.status,
        });
      }

      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
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
        GROQ_CONFIG,
        usage?.promptTokens ?? 0,
        usage?.completionTokens ?? 0,
      );

      return {
        provider: "groq",
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
      throw new LLMError("Groq API key not configured. Set GROQ_API_KEY in the environment.", {
        provider: "groq",
        code: "GROQ_NOT_CONFIGURED",
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
        throw new LLMError(`Groq stream ${res.status}: ${errText.slice(0, 500)}`, {
          provider: "groq",
          code: "GROQ_STREAM_ERROR",
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
            // Skip malformed events.
          }
        }
      }
      yield { delta: "", done: true };
    } finally {
      clearTimeout(timer);
    }
  }
}

export const groqProvider = new GroqProvider();

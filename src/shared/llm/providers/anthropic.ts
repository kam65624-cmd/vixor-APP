// ============================================================================
// VIXOR LLM — Anthropic Provider (BYO key via ANTHROPIC_API_KEY)
// ============================================================================
//
// Uses the Anthropic Messages API (https://api.anthropic.com/v1/messages).
// Supports: streaming, JSON mode (via system prompt instruction), tool calls.
//
// Note: Anthropic's API uses a different message format than OpenAI. We
// translate here: `system` role becomes a top-level `system` parameter,
// and the `messages` array alternates user/assistant turns.
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

const ANTHROPIC_CONFIG: ProviderConfig = {
  id: "anthropic",
  defaultModel: "claude-3-5-sonnet-latest",
  fallbackModel: "claude-3-5-haiku-latest",
  // Pricing as of 2024-12
  costPer1m: { prompt: 3.0, completion: 15.0 },
  supportsStreaming: true,
  supportsToolCalls: true,
  supportsJsonMode: true, // via prompt instruction
};

function getApiKey(): string {
  return (process.env.ANTHROPIC_API_KEY ?? "").trim();
}

function getBaseUrl(): string {
  return (process.env.ANTHROPIC_BASE_URL ?? "https://api.anthropic.com/v1").replace(/\/$/, "");
}

function pickModel(req: ChatRequest): string {
  return req.model ?? ANTHROPIC_CONFIG.defaultModel;
}

interface AnthropicMessage {
  role: "user" | "assistant";
  content: string | Array<{ type: "text"; text: string }>;
}

function buildAnthropicMessages(req: ChatRequest): {
  system: string | undefined;
  messages: AnthropicMessage[];
} {
  const system = req.systemPrompt;
  const messages: AnthropicMessage[] = [];
  for (const m of req.messages) {
    if (m.role === "system") {
      // Anthropic only accepts system as a top-level param; fold into user.
      messages.push({ role: "user", content: m.content });
    } else if (m.role === "assistant") {
      messages.push({ role: "assistant", content: m.content });
    } else if (m.role === "tool") {
      messages.push({ role: "user", content: `[tool result] ${m.content}` });
    } else {
      messages.push({ role: "user", content: m.content });
    }
  }
  return { system, messages };
}

function buildBody(req: ChatRequest, model: string): Record<string, unknown> {
  const { system, messages } = buildAnthropicMessages(req);
  const body: Record<string, unknown> = {
    model,
    messages,
    max_tokens: req.maxTokens ?? 4096,
    temperature: req.temperature ?? 0.7,
  };
  if (system) body.system = system;
  if (req.jsonMode) {
    body.system =
      (system ? system + "\n\n" : "") + "Return ONLY valid JSON, no prose, no markdown.";
  }
  return body;
}

class AnthropicProvider implements LLMProvider {
  readonly id = "anthropic" as const;
  readonly config = ANTHROPIC_CONFIG;

  isConfigured(): boolean {
    return getApiKey().length > 0;
  }

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const startedAt = Date.now();
    const key = getApiKey();
    if (!key) {
      throw new LLMError(
        "Anthropic API key not configured. Set ANTHROPIC_API_KEY in the environment.",
        { provider: "anthropic", code: "ANTHROPIC_NOT_CONFIGURED" },
      );
    }

    const model = pickModel(req);
    const url = `${getBaseUrl()}/messages`;
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
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new LLMError(`Anthropic API ${res.status}: ${errText.slice(0, 500)}`, {
          provider: "anthropic",
          code: "ANTHROPIC_HTTP_ERROR",
          statusCode: res.status,
        });
      }

      const json = (await res.json()) as {
        content?: Array<{ type: string; text?: string }>;
        usage?: { input_tokens?: number; output_tokens?: number };
      };

      const content = (json.content ?? [])
        .filter((c) => c.type === "text")
        .map((c) => c.text ?? "")
        .join("");

      const usageRaw = json.usage;
      const usage: TokenUsage | undefined = usageRaw
        ? {
            promptTokens: usageRaw.input_tokens ?? 0,
            completionTokens: usageRaw.output_tokens ?? 0,
            totalTokens: (usageRaw.input_tokens ?? 0) + (usageRaw.output_tokens ?? 0),
          }
        : undefined;

      const estimatedCostUsd = estimateCost(
        ANTHROPIC_CONFIG,
        usage?.promptTokens ?? 0,
        usage?.completionTokens ?? 0,
      );

      return {
        provider: "anthropic",
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
      throw new LLMError(
        "Anthropic API key not configured. Set ANTHROPIC_API_KEY in the environment.",
        { provider: "anthropic", code: "ANTHROPIC_NOT_CONFIGURED" },
      );
    }

    const model = pickModel(req);
    const url = `${getBaseUrl()}/messages`;
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
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "");
        throw new LLMError(`Anthropic stream ${res.status}: ${errText.slice(0, 500)}`, {
          provider: "anthropic",
          code: "ANTHROPIC_STREAM_ERROR",
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
          try {
            const parsed = JSON.parse(data) as {
              type?: string;
              delta?: { text?: string };
            };
            if (parsed.type === "content_block_delta" && parsed.delta?.text) {
              yield { delta: parsed.delta.text };
            } else if (parsed.type === "message_stop") {
              yield { delta: "", done: true };
              return;
            }
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

export const anthropicProvider = new AnthropicProvider();

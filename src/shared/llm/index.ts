// ============================================================================
// VIXOR LLM — Multi-Provider LLM Service
// ============================================================================
//
// Provides a simple function-based API for calling multiple LLM providers.
// Detects provider from API key prefix and routes to the correct endpoint.
//
// Usage:
//   import { callLLM, detectProvider } from "@/shared/llm";
//   const provider = detectProvider("sk-or-v1-..."); // "openrouter"
//   const res = await callLLM([{ role: "user", content: "Hello" }]);
//
// Also exports the existing LLMRouter for backward compatibility.
// ============================================================================

import type { ChatRequest, ChatResponse, LLMProviderId } from "./types";
import { LLMError } from "./types";
import { LLMRouter, llmRouter } from "./router";

// Re-export the existing LLMRouter for backward compatibility
export { LLMRouter, llmRouter };

// Re-export existing types (LLMProvider interface omitted — conflicts with
// the new LLMProvider union type defined below)
export type {
  ChatMessage,
  ChatRequest,
  ChatResponse,
  ChatStreamChunk,
  LLMProvider as LLMProviderAdapter,
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

// ── New simplified API types ───────────────────────────────────────────────

/** Message in a conversation. */
export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** Options for a callLLM invocation. */
export interface LLMOptions {
  /** Model name (provider-specific). If omitted, uses the provider's default. */
  model?: string;
  /** Maximum output tokens. */
  maxTokens?: number;
  /** Sampling temperature (0–2). */
  temperature?: number;
  /** Request JSON-mode output where supported. */
  jsonMode?: boolean;
}

/** Response from a callLLM invocation. */
export interface LLMResponse {
  /** The assistant's reply text. */
  content: string;
  /** The model that produced this response. */
  model: string;
  /** Token usage stats. */
  usage: {
    promptTokens: number;
    completionTokens: number;
  };
}

/** Supported LLM provider identifiers. */
export type LLMProvider = "openai" | "openrouter" | "gemini" | "grok" | "deepseek" | "unknown";

// ── Provider detection ─────────────────────────────────────────────────────

/**
 * Detect the LLM provider from an API key prefix.
 *
 * @param apiKey - The API key to inspect.
 * @returns The detected provider identifier.
 *
 * @example
 *   detectProvider("sk-or-v1-abc123");  // "openrouter"
 *   detectProvider("sk-abc123");        // "openai"
 *   detectProvider("AIzaSyXyz...");     // "gemini"
 *   detectProvider("xai-abc123");       // "grok"
 */
export function detectProvider(apiKey: string): LLMProvider {
  if (apiKey.startsWith("sk-or-v1-")) return "openrouter";
  if (apiKey.startsWith("sk-")) return "openai";
  if (apiKey.startsWith("AIza")) return "gemini";
  if (apiKey.startsWith("xai-")) return "grok";
  return "unknown";
}

// ── Internal: OpenAI-compatible call ───────────────────────────────────────

/** Configuration for an OpenAI-compatible endpoint. */
interface OpenAICompatibleConfig {
  baseUrl: string;
  defaultModel: string;
  provider: LLMProvider;
}

/** Map of provider to their OpenAI-compatible base URLs and default models. */
const OPENAI_COMPATIBLE_CONFIGS: Record<string, OpenAICompatibleConfig> = {
  openai: { baseUrl: "https://api.openai.com/v1", defaultModel: "gpt-4o-mini", provider: "openai" },
  openrouter: {
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "openai/gpt-4o-mini",
    provider: "openrouter",
  },
  grok: { baseUrl: "https://api.x.ai/v1", defaultModel: "grok-2", provider: "grok" },
  deepseek: {
    baseUrl: "https://api.deepseek.com/v1",
    defaultModel: "deepseek-chat",
    provider: "deepseek",
  },
};

/**
 * Internal: call an OpenAI-compatible chat completions endpoint.
 *
 * @param messages - The conversation messages.
 * @param options - Optional call parameters.
 * @param config - The provider-specific configuration.
 * @param apiKey - The API key for authentication.
 * @returns An LLMResponse.
 */
async function callOpenAICompatible(
  messages: LLMMessage[],
  options: LLMOptions = {},
  config: OpenAICompatibleConfig,
  apiKey: string,
): Promise<LLMResponse> {
  const url = `${config.baseUrl}/chat/completions`;
  const model = options.model ?? config.defaultModel;

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: options.temperature ?? 0.7,
  };
  if (options.maxTokens) body.max_tokens = options.maxTokens;
  if (options.jsonMode) body.response_format = { type: "json_object" };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`${config.provider} API error ${res.status}: ${errText.slice(0, 500)}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
    model?: string;
  };

  return {
    content: json.choices?.[0]?.message?.content ?? "",
    model: json.model ?? model,
    usage: {
      promptTokens: json.usage?.prompt_tokens ?? 0,
      completionTokens: json.usage?.completion_tokens ?? 0,
    },
  };
}

// ── Internal: Gemini call (placeholder) ────────────────────────────────────

/**
 * Internal: call the Google Gemini API.
 *
 * Currently a placeholder — throws "not implemented".
 *
 * @param _messages - The conversation messages.
 * @param _options - Optional call parameters.
 * @param _apiKey - The Gemini API key.
 */

async function callGemini(
  _messages: LLMMessage[],
  _options: LLMOptions = {},
  _apiKey: string,
): Promise<LLMResponse> {
  throw new Error("Gemini provider is not implemented yet");
}

// ── Main public API ────────────────────────────────────────────────────────

/**
 * Call an LLM with the given messages, auto-detecting the provider from
 * the API key prefix (or falling back to the project's LLMRouter).
 *
 * @param messages - The conversation messages.
 * @param options - Optional call parameters (model, temperature, etc.).
 * @param apiKey - The API key. If omitted, falls back to the project's
 *                 LLMRouter which uses ZAI (bundled, no key needed).
 * @returns An LLMResponse with the assistant's reply.
 *
 * @example
 *   const res = await callLLM(
 *     [{ role: "user", content: "Analyze BTC" }],
 *     { model: "gpt-4o-mini", temperature: 0.5 },
 *     "sk-or-v1-..."
 *   );
 *   console.log(res.content);
 */
export async function callLLM(
  messages: LLMMessage[],
  options: LLMOptions = {},
  apiKey?: string,
): Promise<LLMResponse> {
  // If no API key is provided, fall back to the project's LLMRouter
  if (!apiKey) {
    const routerRes: ChatResponse = await llmRouter.chat({
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      model: options.model,
      maxTokens: options.maxTokens,
      temperature: options.temperature,
      jsonMode: options.jsonMode,
    });

    return {
      content: routerRes.content,
      model: routerRes.model,
      usage: {
        promptTokens: routerRes.usage?.promptTokens ?? 0,
        completionTokens: routerRes.usage?.completionTokens ?? 0,
      },
    };
  }

  // Detect provider from key prefix and route accordingly
  const provider = detectProvider(apiKey);

  if (provider === "gemini") {
    return callGemini(messages, options, apiKey);
  }

  if (provider === "unknown") {
    throw new Error(`Cannot detect LLM provider from API key prefix: "${apiKey.slice(0, 8)}..."`);
  }

  const config = OPENAI_COMPATIBLE_CONFIGS[provider];
  if (!config) {
    throw new Error(`No configuration for provider: ${provider}`);
  }

  return callOpenAICompatible(messages, options, config, apiKey);
}

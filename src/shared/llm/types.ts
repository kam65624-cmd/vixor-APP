// ============================================================================
// VIXOR LLM — Types
// ============================================================================
//
// Shared types for all LLM providers and the LLMRouter.
// Kept side-effect-free so it can be imported from both client and server code.
// ============================================================================

export type LLMProviderId = "zai" | "openai" | "anthropic" | "groq";

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  /** Optional tool call metadata (for multi-turn tool-using conversations). */
  toolCallId?: string;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>; // JSON Schema
  };
}

export interface ChatRequest {
  /** Provider to route to. If omitted, router auto-selects. */
  provider?: LLMProviderId;
  /** Model override (otherwise the provider's default is used). */
  model?: string;
  /** Conversation messages. At least one user message is required. */
  messages: ChatMessage[];
  /** Sampling temperature. Provider should clamp to [0, 2]. Default: 0.7. */
  temperature?: number;
  /** Max output tokens. Default: provider-specific. */
  maxTokens?: number;
  /** Optional system prompt prepended to messages. */
  systemPrompt?: string;
  /** Request JSON-mode output (provider may ignore if unsupported). */
  jsonMode?: boolean;
  /** Optional tool definitions for tool-calling. */
  tools?: ToolDefinition[];
  /** Fallback chain: if primary provider fails, try these in order. */
  fallbacks?: LLMProviderId[];
  /** Per-call timeout in ms. Default: 60_000. */
  timeoutMs?: number;
}

export interface ChatResponse {
  /** The provider that produced this response. */
  provider: LLMProviderId;
  /** The model that produced this response. */
  model: string;
  /** The assistant's reply text. May be empty if toolCalls is present. */
  content: string;
  /** Tool calls requested by the model, if any. */
  toolCalls?: ToolCall[];
  /** Token usage stats if the provider returned them. */
  usage?: TokenUsage;
  /** Estimated cost in USD for this call. */
  estimatedCostUsd: number;
  /** Raw provider response (for advanced consumers). Untyped. */
  raw?: unknown;
  /** Wall-clock duration in ms. */
  durationMs: number;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ChatStreamChunk {
  /** Incremental content (may be empty string for keep-alive chunks). */
  delta: string;
  /** Set when the stream is complete. */
  done?: boolean;
  /** Final usage stats, included only on the final chunk. */
  usage?: TokenUsage;
}

export interface ProviderConfig {
  /** Provider id. */
  id: LLMProviderId;
  /** Default model to use if `model` is not specified in the request. */
  defaultModel: string;
  /** Fallback model (e.g., a cheaper variant). */
  fallbackModel?: string;
  /** Approximate cost per 1M tokens (prompt, completion) in USD. */
  costPer1m: { prompt: number; completion: number };
  /** Whether this provider supports streaming. */
  supportsStreaming: boolean;
  /** Whether this provider supports tool calls. */
  supportsToolCalls: boolean;
  /** Whether this provider supports JSON mode. */
  supportsJsonMode: boolean;
}

/**
 * Provider interface that all provider adapters must implement.
 */
export interface LLMProvider {
  readonly id: LLMProviderId;
  readonly config: ProviderConfig;

  /** Whether the provider is configured (env vars set, etc.). */
  isConfigured(): boolean;

  /** Perform a chat completion. */
  chat(req: ChatRequest): Promise<ChatResponse>;

  /** Stream a chat completion. Yields incremental chunks. */
  stream(req: ChatRequest): AsyncGenerator<ChatStreamChunk, void, unknown>;
}

/**
 * Error thrown when a provider call fails and there are no more fallbacks.
 */
export class LLMError extends Error {
  readonly code: string;
  readonly provider: LLMProviderId;
  readonly statusCode?: number;

  constructor(
    message: string,
    options: { provider: LLMProviderId; code?: string; statusCode?: number } = {
      provider: "zai",
    },
  ) {
    super(message);
    this.name = "LLMError";
    this.provider = options.provider;
    this.code = options.code ?? "LLM_ERROR";
    this.statusCode = options.statusCode;
  }
}

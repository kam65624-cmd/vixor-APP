// ═══════════════════════════════════════════════════════════
// Vixor Multi-Agent Orchestrator
// ═══════════════════════════════════════════════════════════
//
// Uses LLMRouter (src/shared/llm) for all AI operations.
//   - Auto-selects ZAI by default (bundled, no key required).
//   - Falls back to OpenAI / Anthropic / Groq if user has set BYO keys
//     via user_settings.llm_api_keys.
//   - Direct z-ai-web-dev-sdk path remains as a last-resort fallback
//     in case the router has a runtime issue.
// ═══════════════════════════════════════════════════════════

import {
  type AgentId,
  type UserContext,
  ALL_AGENTS,
  getAgentById,
  autoSelectAgent,
} from "./agents";
import { LLMRouter } from "@/shared/llm";
import type { ChatMessage as RouterChatMessage, ChatStreamChunk } from "@/shared/llm/types";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AgentResponse {
  response: string;
  agent: AgentId;
}

export interface ConsensusResponse {
  responses: { agent: AgentId; response: string }[];
  synthesis: string;
}

// ─── LLM Router singleton (lazy init) ───
let routerInstance: LLMRouter | null = null;
function getRouter(): LLMRouter {
  if (!routerInstance) {
    routerInstance = new LLMRouter();
  }
  return routerInstance;
}

// ─── Direct z-ai fallback singleton (lazy init) ───
// Used ONLY if the LLMRouter throws — keeps the orchestrator resilient.
type ZaiSdkInstance = {
  chat: {
    completions: {
      create: (opts: {
        messages: Array<{ role: string; content: string }>;
        temperature?: number;
      }) => Promise<{
        choices?: Array<{ message?: { content?: string } }>;
      }>;
    };
  };
};
let zaiFallback: ZaiSdkInstance | null = null;
async function getZAIFallback(): Promise<ZaiSdkInstance> {
  if (!zaiFallback) {
    const ZAI = await import("z-ai-web-dev-sdk");
    zaiFallback = (await ZAI.default.create()) as ZaiSdkInstance;
  }
  return zaiFallback;
}

// ─── Call the AI model via LLMRouter, with direct-ZAI fallback ───
async function callAI(params: {
  systemPrompt: string;
  messages: ChatMessage[];
  userMessage: string;
  maxOutputTokens?: number;
  temperature?: number;
}): Promise<string> {
  const { systemPrompt, messages, userMessage, temperature = 0.7 } = params;

  // Build the router messages array (system + history + current user msg).
  const routerMessages: RouterChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: userMessage },
  ];

  try {
    const router = getRouter();
    const response = await router.chat({
      messages: routerMessages,
      temperature,
      maxTokens: params.maxOutputTokens,
    });
    return response.content || "No response generated.";
  } catch (routerErr) {
    // Defensive: if the new LLMRouter has any runtime issue, fall back to
    // the direct ZAI SDK path that was used before this change. This
    // guarantees the copilot keeps working even if the router is buggy.
    console.warn(
      "[Copilot] LLMRouter failed, falling back to direct ZAI SDK:",
      routerErr instanceof Error ? routerErr.message : String(routerErr),
    );

    try {
      const zai = await getZAIFallback();
      const response = await zai.chat.completions.create({
        messages: routerMessages,
        temperature,
      });
      return response.choices?.[0]?.message?.content ?? "No response generated.";
    } catch (zaiErr) {
      console.error(
        "[Copilot] Direct ZAI fallback ALSO failed:",
        zaiErr instanceof Error ? zaiErr.message : String(zaiErr),
      );
      throw new Error(
        `Copilot AI call failed (router + ZAI fallback). Router: ${
          routerErr instanceof Error ? routerErr.message : String(routerErr)
        }. ZAI: ${zaiErr instanceof Error ? zaiErr.message : String(zaiErr)}`,
      );
    }
  }
}

// ─── Stream the AI model via LLMRouter (for SSE streaming to frontend) ───
async function* streamAI(params: {
  systemPrompt: string;
  messages: ChatMessage[];
  userMessage: string;
  maxOutputTokens?: number;
  temperature?: number;
}): AsyncGenerator<ChatStreamChunk, void, unknown> {
  const { systemPrompt, messages, userMessage, temperature = 0.7 } = params;

  const routerMessages: RouterChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: userMessage },
  ];

  try {
    const router = getRouter();
    for await (const chunk of router.stream({
      messages: routerMessages,
      temperature,
      maxTokens: params.maxOutputTokens,
    })) {
      yield chunk;
    }
  } catch (err) {
    // Fallback: emit error as a text chunk so the frontend can display it
    console.warn(
      "[Copilot] Stream failed, sending error chunk:",
      err instanceof Error ? err.message : String(err),
    );
    yield {
      delta: `**Error:** ${err instanceof Error ? err.message : "AI streaming failed"}. Falling back to non-streaming mode...`,
      done: false,
    };
  }
}

// ─── Run a single agent with streaming ───
export async function* streamAgent(params: {
  agent: AgentId;
  message: string;
  history: ChatMessage[];
  context: UserContext;
}): AsyncGenerator<ChatStreamChunk & { agent?: AgentId }, void, unknown> {
  const { agent: agentId, message, history, context } = params;

  let selectedAgentId: AgentId = agentId;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (agentId === ("auto" as any)) {
    selectedAgentId = autoSelectAgent(message);
  }

  const agentDef = getAgentById(selectedAgentId);
  const systemPrompt = agentDef.systemPrompt(context);

  // Yield the agent ID as the first "chunk"
  yield { delta: "", agent: selectedAgentId };

  for await (const chunk of streamAI({
    systemPrompt,
    messages: history,
    userMessage: message,
  })) {
    yield chunk;
  }
}

// ─── Run a single agent ───
export async function runAgent(params: {
  agent: AgentId;
  message: string;
  history: ChatMessage[];
  context: UserContext;
}): Promise<AgentResponse> {
  const { agent: agentId, message, history, context } = params;

  // If "auto" mode, select the best agent
  let selectedAgentId: AgentId = agentId;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (agentId === ("auto" as any)) {
    selectedAgentId = autoSelectAgent(message);
  }

  const agentDef = getAgentById(selectedAgentId);
  const systemPrompt = agentDef.systemPrompt(context);

  const response = await callAI({
    systemPrompt,
    messages: history,
    userMessage: message,
  });

  return {
    response,
    agent: selectedAgentId,
  };
}

// ─── Run all agents in parallel for consensus ───
export async function runConsensus(params: {
  message: string;
  history: ChatMessage[];
  context: UserContext;
}): Promise<ConsensusResponse> {
  const { message, context } = params;

  // Run all 4 agents in parallel
  const agentPromises = ALL_AGENTS.map(async (agentDef) => {
    const systemPrompt = agentDef.systemPrompt(context);
    const response = await callAI({
      systemPrompt,
      messages: [], // Fresh context for each agent in consensus mode
      userMessage: message,
      temperature: 0.5, // More focused/consistent
    });
    return {
      agent: agentDef.id,
      response,
    };
  });

  const responses = await Promise.all(agentPromises);

  // Build synthesis
  const synthesis = await synthesizeResponses(message, responses, context);

  return {
    responses,
    synthesis,
  };
}

// ─── Synthesize all agent responses into a unified view ───
async function synthesizeResponses(
  question: string,
  responses: { agent: AgentId; response: string }[],
  _context: UserContext,
): Promise<string> {
  const agentResponses = responses
    .map((r) => {
      const agent = getAgentById(r.agent);
      return `### ${agent.name}\n${r.response}`;
    })
    .join("\n\n---\n\n");

  const synthesisPrompt = `You are the **Vixor AI Synthesis Engine** — you combine perspectives from 4 specialized AI trading agents into a single, coherent, actionable summary.

## THE TRADER'S QUESTION
${question}

## AGENT PERSPECTIVES
${agentResponses}

## YOUR TASK
Synthesize the above perspectives into a unified, actionable summary. Follow this format:

## Key Consensus Points
- List the points where ALL agents agree (these are highest confidence)

## Primary Action
The single most important action the trader should take right now

## Key Warnings
- List critical risk factors or cautions flagged by any agent

## Divergent Views
- Note where agents disagree and explain both sides briefly

## Action Plan
Numbered list of immediate next steps (1-3 items max)

IMPORTANT RULES:
- Be concise — this is a summary, not a new analysis
- Reference specific numbers and levels from the agents
- If all agents agree on direction, say "All 4 agents agree on [direction]"
- Never contradict the individual agents — synthesize, don't override
- Use markdown formatting
- Keep it under 400 words`;

  const synthesis = await callAI({
    systemPrompt: synthesisPrompt,
    messages: [],
    userMessage: "Synthesize the agent perspectives above.",
    temperature: 0.4,
  });

  return synthesis;
}

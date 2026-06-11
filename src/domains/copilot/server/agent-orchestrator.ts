// ═══════════════════════════════════════════════════════════
// Vixor Multi-Agent Orchestrator
// ═══════════════════════════════════════════════════════════
//
// Uses z-ai-web-dev-sdk for all AI operations.
// NO external API keys required — the SDK is installed locally.
// ═══════════════════════════════════════════════════════════

import {
  type AgentId,
  type UserContext,
  ALL_AGENTS,
  getAgentById,
  autoSelectAgent,
} from "./agents";

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

// ─── z-ai singleton (lazy init) ───
let zaiInstance: any = null;
async function getZAI() {
  if (!zaiInstance) {
    const ZAI = await import("z-ai-web-dev-sdk");
    zaiInstance = await ZAI.default.create();
  }
  return zaiInstance;
}

// ─── Call the AI model using z-ai-web-dev-sdk ───
async function callAI(params: {
  systemPrompt: string;
  messages: ChatMessage[];
  userMessage: string;
  maxOutputTokens?: number;
  temperature?: number;
}): Promise<string> {
  const { systemPrompt, messages, userMessage, temperature = 0.7 } = params;

  const zai = await getZAI();

  // Build messages array for z-ai SDK
  const chatMessages: any[] = [
    { role: "system", content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: userMessage },
  ];

  const response = await zai.chat.completions.create({
    messages: chatMessages,
    temperature,
  });

  return response.choices[0]?.message?.content ?? "No response generated.";
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
  if (agentId === "auto" as any) {
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

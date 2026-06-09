import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { askCopilot } from "@/lib/vixor.functions";
import { useStableServerFn } from "@/hooks/use-stable-server-fn";
import { useI18n } from "@/lib/i18n";
import {
  Bot,
  Send,
  Loader2,
  Sparkles,
  BarChart3,
  Shield,
  Newspaper,
  Wrench,
  ChevronDown,
  User,
  RotateCcw,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/copilot")({
  head: () => ({ meta: [{ title: "AI Copilot — Vixor" }] }),
  component: CopilotPage,
});

// ─── Types ───

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  agent?: string;
  timestamp: number;
}

type AgentId = "market_analyst" | "risk_manager" | "news_analyst" | "strategy_builder";

const AGENTS: {
  id: AgentId;
  label: string;
  icon: typeof BarChart3;
  color: string;
  desc: string;
}[] = [
  {
    id: "market_analyst",
    label: "Market Analyst",
    icon: BarChart3,
    color: "text-emerald-400",
    desc: "SMC/ICT Technical Analysis",
  },
  {
    id: "risk_manager",
    label: "Risk Manager",
    icon: Shield,
    color: "text-amber-400",
    desc: "Position Sizing & Risk Control",
  },
  {
    id: "news_analyst",
    label: "News Analyst",
    icon: Newspaper,
    color: "text-sky-400",
    desc: "Fundamental News Impact",
  },
  {
    id: "strategy_builder",
    label: "Strategy Builder",
    icon: Wrench,
    color: "text-violet-400",
    desc: "Trading Plans & Systems",
  },
];

const QUICK_ACTIONS: { label: string; prompt: string; agent: AgentId }[] = [
  {
    label: "Analyze BTC/USDT setup",
    prompt:
      "Give me a detailed SMC analysis of BTC/USDT right now. Identify key Order Blocks, Fair Value Gaps, and liquidity levels.",
    agent: "market_analyst",
  },
  {
    label: "Review my risk exposure",
    prompt:
      "Based on my recent analyses and active alerts, review my current risk exposure. Am I overexposed to any single direction or pair?",
    agent: "risk_manager",
  },
  {
    label: "What's moving the markets?",
    prompt:
      "What are the key fundamental events and news driving the markets right now? How should I position myself?",
    agent: "news_analyst",
  },
  {
    label: "Build a daily routine",
    prompt:
      "Help me build a structured daily trading routine with pre-market, intraday, and post-market checklists.",
    agent: "strategy_builder",
  },
  {
    label: "XAU/USD outlook",
    prompt:
      "What's the current outlook for XAU/USD? Analyze the key levels, market structure, and potential setups.",
    agent: "market_analyst",
  },
  {
    label: "Optimize my stop losses",
    prompt:
      "Review my recent analyses and suggest how I could optimize my stop loss placement using SMC concepts like liquidity sweeps and invalidation levels.",
    agent: "risk_manager",
  },
];

// ─── Main Component ───

function CopilotPage() {
  const { t } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [activeAgent, setActiveAgent] = useState<AgentId>("market_analyst");
  const [showAgents, setShowAgents] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const askCopilotFn = useStableServerFn(askCopilot);

  const copilotMutation = useMutation({
    mutationFn: (data: {
      message: string;
      history: { role: "user" | "assistant"; content: string }[];
      agent: AgentId;
    }) => askCopilotFn({ data }),
    onSuccess: (result) => {
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: result.response,
        agent: result.agent,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    },
    onError: (error) => {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `⚠️ ${error.message || "Failed to get AI response. Please try again."}`,
        agent: "error",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    },
  });

  const sendMessage = useCallback(
    (text: string, agentOverride?: AgentId) => {
      const trimmed = text.trim();
      if (!trimmed || copilotMutation.isPending) return;
      const agent = agentOverride || activeAgent;
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      const history = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));
      copilotMutation.mutate({ message: trimmed, history, agent });
    },
    [activeAgent, copilotMutation, messages],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      sendMessage(input);
      setInput("");
    },
    [input, sendMessage],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input);
        setInput("");
      }
    },
    [input, sendMessage],
  );

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const currentAgentConfig = AGENTS.find((a) => a.id === activeAgent)!;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* ─── Header ─── */}
      <div className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-0.5">
              {t("copilot.vixorAi") || "Vixor AI"}
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {t("copilot.title") || "AI Copilot"}
            </h1>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="size-9 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-card-hover transition-colors"
              title="Clear chat"
            >
              <RotateCcw className="size-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* ─── Agent Selector ─── */}
        <div className="mt-3">
          <button
            onClick={() => setShowAgents(!showAgents)}
            className="flex items-center gap-2 px-3 h-9 rounded-xl bg-card border border-border hover:bg-card-hover transition-colors w-full sm:w-auto"
          >
            <currentAgentConfig.icon className={`size-4 ${currentAgentConfig.color}`} />
            <span className="text-xs font-bold">{currentAgentConfig.label}</span>
            <ChevronDown
              className={`size-3.5 text-muted-foreground transition-transform ${showAgents ? "rotate-180" : ""}`}
            />
          </button>

          {showAgents && (
            <div className="mt-2 grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
              {AGENTS.map((agent) => {
                const Icon = agent.icon;
                const isActive = activeAgent === agent.id;
                return (
                  <button
                    key={agent.id}
                    onClick={() => {
                      setActiveAgent(agent.id);
                      setShowAgents(false);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${isActive ? "bg-primary/10 border-primary/30" : "bg-card border-border hover:bg-card-hover"}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`size-4 ${agent.color}`} />
                      <span
                        className={`text-xs font-bold ${isActive ? "text-primary" : "text-foreground"}`}
                      >
                        {agent.label}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">{agent.desc}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── Messages Area ─── */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        {messages.length === 0 ? (
          <EmptyState onQuickAction={sendMessage} />
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}

        {copilotMutation.isPending && (
          <div className="flex items-start gap-3 animate-in fade-in duration-300">
            <div className="size-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Bot className="size-4 text-primary" />
            </div>
            <div className="vixor-card p-4 flex-1">
              <div className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Vixor is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ─── Input Area ─── */}
      <div className="flex-shrink-0 pt-3 border-t border-border">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("copilot.placeholder") || "Ask Vixor anything about trading..."}
              rows={1}
              className="w-full resize-none rounded-xl bg-card border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all max-h-32 min-h-[44px]"
              style={{ height: "auto" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = Math.min(target.scrollHeight, 128) + "px";
              }}
              disabled={copilotMutation.isPending}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || copilotMutation.isPending}
            className="size-11 rounded-xl gradient-primary text-primary-foreground flex items-center justify-center glow-primary disabled:opacity-40 disabled:cursor-not-allowed shrink-0 transition-all hover:scale-105 active:scale-95"
          >
            {copilotMutation.isPending ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Send className="size-5" />
            )}
          </button>
        </form>
        <div className="mt-1.5 text-center">
          <span className="text-[9px] text-muted-foreground/50">
            AI responses may not always be accurate. Always verify with your own analysis.
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State with Quick Actions ───

function EmptyState({
  onQuickAction,
}: {
  onQuickAction: (prompt: string, agent: AgentId) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col items-center justify-center h-full py-8 px-4">
      <div className="relative mb-6">
        <div className="size-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Sparkles className="size-9 text-primary" />
        </div>
        <div className="absolute -right-1 -top-1 size-5 rounded-full bg-primary flex items-center justify-center">
          <Bot className="size-3 text-primary-foreground" />
        </div>
      </div>

      <h2 className="text-lg font-bold mb-1">
        {t("copilot.welcomeTitle") || "How can I help you today?"}
      </h2>
      <p className="text-sm text-muted-foreground text-center max-w-xs mb-6">
        {t("copilot.welcomeDesc") ||
          "I'm your context-aware AI trading assistant. I know your recent analyses, signals, and alerts."}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
        {QUICK_ACTIONS.map((action, i) => {
          const agentConfig = AGENTS.find((a) => a.id === action.agent);
          const Icon = agentConfig?.icon || BarChart3;
          return (
            <button
              key={i}
              onClick={() => onQuickAction(action.prompt, action.agent)}
              className="p-3 rounded-xl bg-card border border-border text-left hover:bg-card-hover hover:border-primary/30 transition-all group"
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`size-3.5 ${agentConfig?.color || "text-primary"}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">
                  {agentConfig?.label}
                </span>
              </div>
              <div className="text-xs font-medium text-foreground line-clamp-2">{action.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Message Bubble ───

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const isError = message.agent === "error";
  const agentConfig = AGENTS.find((a) => a.id === message.agent);
  const Icon = isUser ? User : agentConfig?.icon || Bot;
  const iconColor = isError
    ? "text-bearish"
    : isUser
      ? "text-muted-foreground"
      : agentConfig?.color || "text-primary";

  return (
    <div
      className={`flex items-start gap-3 animate-in fade-in slide-in-from-bottom-1 duration-300 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`size-8 rounded-xl flex items-center justify-center shrink-0 ${isUser ? "bg-card border border-border" : isError ? "bg-bearish/10 border border-bearish/20" : "bg-primary/10 border border-primary/20"}`}
      >
        <Icon className={`size-4 ${iconColor}`} />
      </div>
      <div
        className={`max-w-[85%] vixor-card p-4 ${isUser ? "bg-primary/5 border-primary/15" : isError ? "border-bearish/20 bg-bearish/5" : ""}`}
      >
        {!isUser && !isError && agentConfig && (
          <div className="flex items-center gap-1.5 mb-2">
            <span className={`text-[9px] font-bold uppercase tracking-widest ${agentConfig.color}`}>
              {agentConfig.label}
            </span>
          </div>
        )}
        <div className="text-sm leading-relaxed prose-sm">
          <FormattedContent content={message.content} />
        </div>
        <div className={`text-[9px] text-muted-foreground/50 mt-2 ${isUser ? "text-right" : ""}`}>
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Formatted Content (Markdown-like rendering) ───

function FormattedContent({ content }: { content: string }) {
  const formatted = useMemo(() => {
    const blocks = content.split(/\n\n+/);
    return blocks.map((block, blockIdx) => {
      const lines = block.split("\n");
      return (
        <div key={blockIdx} className={blockIdx > 0 ? "mt-3" : ""}>
          {lines.map((line, lineIdx) => {
            if (line.startsWith("## "))
              return (
                <h3 key={lineIdx} className="text-sm font-bold text-foreground mt-2 mb-1">
                  {formatInline(line.slice(3))}
                </h3>
              );
            if (line.startsWith("# "))
              return (
                <h3 key={lineIdx} className="text-sm font-bold text-primary mt-2 mb-1">
                  {formatInline(line.slice(2))}
                </h3>
              );
            if (line.startsWith("> "))
              return (
                <div
                  key={lineIdx}
                  className="pl-3 border-l-2 border-primary/40 my-1 text-muted-foreground"
                >
                  {formatInline(line.slice(2))}
                </div>
              );
            if (line.match(/^[-*•]\s/))
              return (
                <div key={lineIdx} className="flex items-start gap-1.5 my-0.5">
                  <span className="text-primary mt-0.5 shrink-0">•</span>
                  <span>{formatInline(line.replace(/^[-*•]\s/, ""))}</span>
                </div>
              );
            if (line.match(/^\d+\.\s/)) {
              const match = line.match(/^(\d+\.)\s(.*)$/);
              if (match)
                return (
                  <div key={lineIdx} className="flex items-start gap-1.5 my-0.5">
                    <span className="text-primary font-bold text-xs mt-0.5 shrink-0">
                      {match[1]}
                    </span>
                    <span>{formatInline(match[2])}</span>
                  </div>
                );
            }
            if (line.trim())
              return (
                <div key={lineIdx} className="my-0.5">
                  {formatInline(line)}
                </div>
              );
            return null;
          })}
        </div>
      );
    });
  }, [content]);

  return <>{formatted}</>;
}

// ─── Inline formatting ───

function formatInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|`([^`]+)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex)
      parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
    if (match[2])
      parts.push(
        <strong key={key++} className="font-bold text-foreground">
          {match[2]}
        </strong>,
      );
    else if (match[3])
      parts.push(
        <code
          key={key++}
          className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-mono text-xs font-bold"
        >
          {match[3]}
        </code>,
      );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  return parts;
}

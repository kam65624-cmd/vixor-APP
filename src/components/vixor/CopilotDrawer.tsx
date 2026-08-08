import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bot, Sparkles, Minimize2 } from "lucide-react";
import { useCopilot } from "@/hooks/useCopilot";

interface CopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Quick suggestion chip shown in the empty state */
function QuickChip({ children }: { children: React.ReactNode }) {
  const { sendMessage } = useCopilot();
  return (
    <button
      onClick={() => sendMessage(String(children))}
      className="px-3 py-1.5 text-xs bg-[#16171C] text-[#9498A8] rounded-full border border-[rgba(255,255,255,0.04)] hover:bg-[#1E1F26] hover:text-white transition-colors"
    >
      {children}
    </button>
  );
}

/** Agent label mapping for Arabic UI */
function agentLabel(agent?: string): string {
  switch (agent) {
    case "analyst":
      return "محلل";
    case "hunter":
      return "صياد";
    case "coach":
      return "مرشد";
    default:
      return "MOXI";
  }
}

export const CopilotDrawer: React.FC<CopilotDrawerProps> = ({ isOpen, onClose }) => {
  const { messages, isLoading, sendMessage, clearMessages } = useCopilot();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    await sendMessage(trimmed);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110]"
          />

          {/* Drawer panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-[120] w-[380px] max-w-[90vw] bg-[#0A0B10] border-l border-[rgba(255,255,255,0.06)] shadow-[0_0_60px_rgba(0,0,0,0.6)] flex flex-col"
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.06)] bg-[#101114]/50 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div
                  className="relative w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    background: "radial-gradient(circle at 35% 35%, #8B5CF6, #6366F1 50%, #4338CA)",
                    boxShadow: "0 4px 20px rgba(99,102,241,0.3)",
                  }}
                >
                  <Bot className="w-5 h-5 text-white" strokeWidth={1.8} />
                  <span
                    className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#22D3A6] rounded-full border-2 border-[#0A0B10] animate-pulse"
                    style={{
                      boxShadow: "0 0 8px rgba(34,211,166,0.5)",
                    }}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    MOXI
                    <span className="text-[8px] px-1.5 py-0.5 bg-[#6366F1]/20 text-[#6366F1] rounded-full font-bold">
                      AI
                    </span>
                  </h3>
                  <span className="text-[10px] text-[#22D3A6] flex items-center gap-1">
                    <span className="w-1 h-1 bg-[#22D3A6] rounded-full animate-pulse" />
                    Online
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => clearMessages()}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-[#9498A8] hover:text-white transition-colors"
                  aria-label="Clear conversation"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-[#9498A8] hover:text-white transition-colors"
                  aria-label="Close assistant"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* ── Messages Area ── */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                    style={{
                      background:
                        "radial-gradient(circle at 35% 35%, #8B5CF6, #6366F1 50%, #4338CA)",
                    }}
                  >
                    <Bot className="w-8 h-8 text-white" strokeWidth={1.5} />
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-1">How can I help you?</h4>
                  <p className="text-xs text-[#9498A8] max-w-[220px]">
                    Ask me about the market, analyze a coin, or request a trading signal.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    <QuickChip>What is the best coin today?</QuickChip>
                    <QuickChip>Analyze my portfolio</QuickChip>
                    <QuickChip>Send a signal</QuickChip>
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-[#6366F1] text-white rounded-br-none"
                          : "bg-[#16171C] text-[#E5E7EB] rounded-bl-none border border-[rgba(255,255,255,0.04)]"
                      }`}
                    >
                      {msg.role === "assistant" && msg.agent && (
                        <span className="text-[10px] font-medium text-[#8B5CF6] block mb-1.5">
                          {agentLabel(msg.agent)}
                        </span>
                      )}
                      {msg.content.split("\n").map((line, i) => (
                        <p key={i} className="mb-1 last:mb-0">
                          {line}
                        </p>
                      ))}
                      <span className="text-[8px] text-[#565A66] block mt-1.5">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              )}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#16171C] px-4 py-3 rounded-2xl rounded-bl-none border border-[rgba(255,255,255,0.04)]">
                    <div className="flex gap-1.5">
                      {[0, 150, 300].map((d) => (
                        <span
                          key={d}
                          className="w-2 h-2 bg-[#6366F1] rounded-full animate-bounce"
                          style={{ animationDelay: `${d}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Input Area ── */}
            <div className="p-3 border-t border-[rgba(255,255,255,0.06)] bg-[#101114]/30">
              <div className="flex items-center gap-2 bg-[#08090C] rounded-2xl border border-[rgba(255,255,255,0.06)] p-1 focus-within:border-[#6366F1]/50 transition-colors">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type your message..."
                  className="flex-1 bg-transparent border-none px-3 py-2 text-sm text-white placeholder-[#565A66] focus:outline-none min-w-0"
                  aria-label="Message to MOXI"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="p-2 rounded-xl bg-[#6366F1] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#4F46E5] transition-colors shadow-[0_4px_12px_rgba(99,102,241,0.3)]"
                  aria-label="Send"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

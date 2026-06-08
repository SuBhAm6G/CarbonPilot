"use client";

import { DefaultChatTransport, type UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import { useRef, useEffect, useState, useCallback } from "react";
import { useCarbonStore } from "@/lib/store/carbonStore";
import type { ActivityDetails } from "@/lib/types";
import { formatCo2, getCategoryEmoji } from "@/lib/utils/formatters";
import { calculateActivityEmissions } from "@/lib/engine/carbonCalculator";

const QUICK_PROMPTS = [
  "I drove 15 km to work today",
  "I had chicken biryani for lunch",
  "I took the metro today",
  "I ate a vegetarian thali",
  "I used AC for 4 hours",
  "I rode my bike to the store",
];

const chatTransport = new DefaultChatTransport({
  api: "/api/chat",
});

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

function tryParseAIResponse(content: string): {
  parsed: boolean; details?: ActivityDetails; summary?: string; activityType?: string;
} {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { parsed: false };
    const json = JSON.parse(jsonMatch[0]);
    if (!json.details || !json.user_message) return { parsed: false };
    return {
      parsed: true,
      details: json.details as ActivityDetails,
      summary: json.user_message,
      activityType: json.activity_type,
    };
  } catch {
    return { parsed: false };
  }
}

function getDisplayContent(content: string): string {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return content;
    const json = JSON.parse(jsonMatch[0]);
    return json.user_message ?? content;
  } catch {
    return content;
  }
}

export default function ChatPanel() {
  const logActivity = useCarbonStore((s) => s.logActivity);
  const profile = useCarbonStore((s) => s.profile);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [, setLoggedIds] = useState<Set<string>>(new Set());

  const { messages, sendMessage, status, error } = useChat({
    transport: chatTransport,
    onFinish: ({ message }) => {
      const content = getMessageText(message);
      const { parsed, details, summary } = tryParseAIResponse(content);
      if (parsed && details && details.type !== "other") {
        setLoggedIds((prev) => {
          if (prev.has(message.id)) return prev;
          logActivity(details, summary);
          return new Set([...prev, message.id]);
        });
      }
    },
  });

  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    sendMessage({ text: trimmed });
    setInput("");
  }, [input, isLoading, sendMessage]);

  const handleQuickPrompt = useCallback((prompt: string) => {
    sendMessage({ text: prompt });
  }, [sendMessage]);

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[800px]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(16,185,129,0.15)" }}>
          <span className="text-xl">🤖</span>
        </div>
        <div>
          <h1 className="font-bold text-lg" style={{ color: "#e2e8f0" }}>AI Carbon Assistant</h1>
          <p className="text-xs" style={{ color: "#64748b" }}>Tell me what you did today — I&apos;ll track your carbon footprint</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="pulse-dot" />
          <span className="text-xs font-medium" style={{ color: "#34d399" }}>Powered by Gemini</span>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-2"
        role="log" aria-label="Chat messages" aria-live="polite">

        {/* Welcome state */}
        {!hasMessages && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-5 py-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(16,185,129,0.1)" }}>
              <span className="text-4xl">🌿</span>
            </div>
            <div>
              <h2 className="font-semibold text-lg" style={{ color: "#e2e8f0" }}>Start tracking your day</h2>
              <p className="text-sm mt-1 max-w-sm" style={{ color: "#64748b" }}>
                Tell me about your commute, meals, or energy use. I&apos;ll calculate exact CO₂ using India-specific emission factors.
              </p>
            </div>
            {profile && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full max-w-md">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => handleQuickPrompt(p)}
                    className="px-3 py-2.5 text-xs text-left rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    style={{
                      background: "rgba(30,41,59,0.6)",
                      border: "1px solid rgba(51,65,85,0.5)",
                      color: "#94a3b8"
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => {
          const textContent = getMessageText(msg);

          return (
            <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 flex-shrink-0 rounded-full flex items-center justify-center mt-1"
                  style={{ background: "rgba(16,185,129,0.2)" }}>
                  <span className="text-sm">🤖</span>
                </div>
              )}
              <div className={`flex flex-col gap-1.5 max-w-[82%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div className={msg.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"}>
                  {msg.role === "assistant" ? getDisplayContent(textContent) : textContent}
                </div>
                {/* Activity tag */}
                {msg.role === "assistant" && (() => {
                  const { parsed, details, activityType } = tryParseAIResponse(textContent);
                  if (!parsed || !details || details.type === "other") return null;
                  const kg = calculateActivityEmissions(details);
                  return (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#34d399" }}>
                      <span>{getCategoryEmoji(activityType ?? "other")}</span>
                      <span>+{formatCo2(kg)} logged to dashboard</span>
                      <span>✓</span>
                    </div>
                  );
                })()}
              </div>
              {msg.role === "user" && (
                <div className="w-7 h-7 flex-shrink-0 rounded-full flex items-center justify-center mt-1"
                  style={{ background: "#1e293b" }}>
                  <span className="text-sm">👤</span>
                </div>
              )}
            </div>
          );
        })}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 flex-shrink-0 rounded-full flex items-center justify-center"
              style={{ background: "rgba(16,185,129,0.2)" }}>
              <span className="text-sm">🤖</span>
            </div>
            <div className="chat-bubble-ai flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full animate-bounce"
                style={{ background: "#64748b", animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full animate-bounce"
                style={{ background: "#64748b", animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full animate-bounce"
                style={{ background: "#64748b", animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-950/30 px-3 py-2 text-sm text-red-200">
            I couldn&apos;t get a response. Please try again in a moment.
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2" aria-label="Chat input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
          placeholder="e.g. I drove 12 km, had chicken for lunch..."
          className="flex-1 px-4 py-3 rounded-xl text-sm transition-all focus:outline-none"
          style={{
            background: "rgba(30,41,59,0.6)",
            border: `1px solid ${input ? "#10b981" : "#334155"}`,
            color: "#e2e8f0",
          }}
          disabled={isLoading}
          aria-label="Message input"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-4 py-3 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{
            background: input.trim() && !isLoading ? "#10b981" : "#064e3b",
            color: "#fff",
            opacity: isLoading || !input.trim() ? 0.5 : 1,
            cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
          }}
          aria-label="Send message"
        >
          {isLoading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </form>
      <p className="text-xs text-center mt-2" style={{ color: "#475569" }}>
        Activities logged automatically · Calculations use India CEA/DEFRA emission factors
      </p>
    </div>
  );
}

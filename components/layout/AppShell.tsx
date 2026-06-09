"use client";

import { useState } from "react";
import { useCarbonStore } from "@/lib/store/carbonStore";
import Dashboard from "@/components/dashboard/Dashboard";
import ChatPanel from "@/components/chat/ChatPanel";
import CarbonTwinCard from "@/components/twin/CarbonTwinCard";
import WhatIfSimulator from "@/components/simulator/WhatIfSimulator";

type Tab = "dashboard" | "chat" | "twin" | "simulator";

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: "dashboard", label: "Dashboard", emoji: "📊" },
  { id: "chat", label: "AI Chat", emoji: "🤖" },
  { id: "twin", label: "Carbon Twin", emoji: "🧬" },
  { id: "simulator", label: "What-If", emoji: "🔮" },
];

export default function AppShell() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const profile = useCarbonStore((s) => s.profile);
  const resetProfile = useCarbonStore((s) => s.resetProfile);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "hsl(222, 47%, 6%)" }}>
      {/* Ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-60 -right-60 w-[500px] h-[500px] rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)" }} />
        <div className="absolute -bottom-60 -left-60 w-[500px] h-[500px] rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(20,184,166,0.04) 0%, transparent 70%)" }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 backdrop-blur-md" style={{ background: "rgba(7, 12, 28, 0.85)" }}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(16,185,129,0.15)" }}>
              <span className="text-base">🌿</span>
            </div>
            <span className="font-bold text-sm gradient-text hidden sm:block">CarbonPilot</span>
          </div>

          <nav className="flex items-center gap-1" role="navigation" aria-label="Main navigation">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 focus:ring-offset-slate-900 ${
                  activeTab === tab.id
                    ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50"
                    : "text-slate-500 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
                aria-current={activeTab === tab.id ? "page" : undefined}
              >
                <span>{tab.emoji}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {profile && <span className="text-xs text-slate-500 hidden md:block">Hey, {profile.name} 👋</span>}
            <button
              onClick={resetProfile}
              className="text-xs text-slate-600 hover:text-slate-400 px-2 py-1 rounded hover:bg-slate-800/50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label="Reset profile"
              title="Reset profile and start over"
            >
              ↩
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 relative z-10" role="main" id="main-content">
        {activeTab === "dashboard" && <Dashboard onGoToChat={() => setActiveTab("chat")} />}
        {activeTab === "chat" && <ChatPanel />}
        {activeTab === "twin" && <CarbonTwinCard />}
        {activeTab === "simulator" && <WhatIfSimulator />}
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="sm:hidden fixed bottom-0 inset-x-0 border-t border-slate-800/80 z-40"
        style={{ background: "rgba(7, 12, 28, 0.95)", backdropFilter: "blur(12px)" }}
        role="navigation" aria-label="Mobile navigation"
      >
        <div className="flex">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors focus:outline-none ${
                activeTab === tab.id ? "text-emerald-400" : "text-slate-600"
              }`}
              aria-current={activeTab === tab.id ? "page" : undefined}
              aria-label={tab.label}
            >
              <span className="text-lg" aria-hidden="true">{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
      <div className="sm:hidden h-16" />
    </div>
  );
}

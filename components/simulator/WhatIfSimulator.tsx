"use client";

import { useState, useMemo } from "react";
import { useCarbonStore } from "@/lib/store/carbonStore";
import { runSimulator, getAllScenarios, type SimulatorScenarioKey } from "@/lib/engine/whatIfCalculator";
import { formatCo2 } from "@/lib/utils/formatters";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="font-bold" style={{ color: p.name === "Current" ? "#f59e0b" : "#10b981" }}>
          {p.name}: {formatCo2(p.value)}
        </p>
      ))}
    </div>
  );
}

export default function WhatIfSimulator() {
  const profile = useCarbonStore((s) => s.profile);
  const activities = useCarbonStore((s) => s.activities);
  const [selected, setSelected] = useState<SimulatorScenarioKey | null>(null);

  const scenarios = useMemo(() => getAllScenarios(), []);

  const weeklyActivities = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const filtered = activities.filter((a) => new Date(a.timestamp) >= weekStart);
    if (filtered.length === 0) {
      const sevenAgo = new Date();
      sevenAgo.setDate(sevenAgo.getDate() - 7);
      return activities.filter((a) => new Date(a.timestamp) >= sevenAgo);
    }
    return filtered;
  }, [activities]);

  const result = useMemo(() => {
    if (!selected || !profile) return null;
    return runSimulator(selected, profile, weeklyActivities);
  }, [selected, profile, weeklyActivities]);

  const chartData = result ? [
    { name: "Current", kg: Math.round(result.currentWeeklyCo2Kg * 10) / 10 },
    { name: "Projected", kg: Math.round(result.projectedWeeklyCo2Kg * 10) / 10 },
  ] : [];

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Complete onboarding to use the simulator.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">🔮 What-If Simulator</h1>
        <p className="text-sm text-slate-500 mt-1">
          See exactly how lifestyle changes reduce your carbon footprint
        </p>
      </div>

      {/* Scenarios */}
      <div className="glass-card p-5">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Choose a Scenario</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {scenarios.map((s) => (
            <button
              key={s.key}
              onClick={() => setSelected(s.key)}
              className={`flex flex-col items-start gap-1 px-4 py-3 rounded-xl text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 border ${
                selected === s.key
                  ? "border-emerald-700 bg-emerald-950/60"
                  : "border-slate-700/50 hover:border-slate-600 bg-slate-800/30 hover:bg-slate-800/50"
              }`}
              aria-pressed={selected === s.key}
            >
              <span className={`text-sm font-semibold ${selected === s.key ? "text-emerald-300" : "text-slate-200"}`}>{s.label}</span>
              <span className="text-xs text-slate-500">{s.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Savings */}
          <div className="glass-card p-6 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl opacity-10"
                style={{ background: "radial-gradient(circle, #10b981 0%, transparent 70%)" }} />
            </div>
            <div className="relative">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-4">
                If you {result.scenarioLabel.toLowerCase()}, you'd save:
              </p>
              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { label: "per week", value: result.weeklySavingsKg },
                  { label: "per month", value: result.monthlySavingsKg },
                  { label: "per year", value: result.yearlySavingsKg },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-2xl md:text-3xl font-extrabold text-emerald-400">{formatCo2(value)}</p>
                    <p className="text-xs text-slate-500 mt-1">{label}</p>
                  </div>
                ))}
              </div>
              {result.treeEquivalent > 0 && (
                <div className="mt-5 pt-4 border-t border-slate-800 text-center">
                  <p className="text-sm text-slate-400">
                    🌳 Equivalent to planting{" "}
                    <span className="font-bold text-emerald-400">{result.treeEquivalent} trees</span> every year
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Chart */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Weekly Emissions — Before vs. After</h3>
            <div className="h-40" role="img" aria-label="Before/after bar chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="kg" radius={[6, 6, 0, 0]} name="kg">
                    <Cell key="current" fill="#f59e0b" />
                    <Cell key="projected" fill="#10b981" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {weeklyActivities.length === 0 && (
            <p className="text-xs text-slate-600 text-center bg-slate-800/30 rounded-xl p-3">
              ℹ️ Results based on your profile estimates. Log activities via AI Chat for real-data projections.
            </p>
          )}
        </div>
      )}

      {!selected && (
        <div className="text-center py-10 text-slate-600">
          <span className="text-5xl block mb-3">🔮</span>
          <p className="text-sm">Select a scenario above to see your projected savings</p>
        </div>
      )}
    </div>
  );
}

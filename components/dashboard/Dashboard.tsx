"use client";

import { useMemo } from "react";
import { useCarbonStore } from "@/lib/store/carbonStore";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { calculateScore, getScoreColor, calculateStreak } from "@/lib/engine/scoreCalculator";
import { generateRecommendations } from "@/lib/engine/recommendationEngine";
import { getLast7DaysStats, sumByCategory } from "@/lib/engine/carbonCalculator";
import { generateInsightCard, getPreviousWeekKg } from "@/lib/engine/insightEngine";
import { formatCo2, formatDayLabel, getCategoryEmoji, getActivityLabel, formatDate } from "@/lib/utils/formatters";
import { GLOBAL_BENCHMARKS } from "@/lib/engine/emissionFactors";
import ManualLogPanel from "./ManualLogPanel";

function ScoreRing({ score, level, label }: { score: number; level: string; label: string }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = getScoreColor(level as Parameters<typeof getScoreColor>[0]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90" aria-hidden="true">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#1e293b" strokeWidth="12" />
          <circle
            cx="60" cy="60" r={r} fill="none"
            stroke={color} strokeWidth="12"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="score-ring"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold" style={{ color }}>{score}</span>
          <span className="text-xs text-slate-500">/100</span>
        </div>
      </div>
      <p className="text-sm font-semibold mt-1" style={{ color }}>{label}</p>
    </div>
  );
}

function StatCard({ emoji, label, value, sub, color = "#10b981" }: {
  emoji: string; label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div className="glass-card p-4 space-y-1">
      <div className="flex items-center gap-1.5">
        <span className="text-sm">{emoji}</span>
        <span className="text-xs text-slate-500 font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-slate-600">{sub}</p>}
    </div>
  );
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="font-bold text-emerald-400">{formatCo2(payload[0].value)}</p>
    </div>
  );
}

export default function Dashboard({ onGoToChat }: { onGoToChat: () => void }) {
  const profile = useCarbonStore((s) => s.profile);
  const activities = useCarbonStore((s) => s.activities);
  const badges = useCarbonStore((s) => s.badges);


  const daily7 = useMemo(() => getLast7DaysStats(activities), [activities]);

  const weeklyKg = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return activities.filter((a) => new Date(a.timestamp) >= weekStart).reduce((s, a) => s + a.co2Kg, 0);
  }, [activities]);

  const monthlyKg = useMemo(() => {
    const now = new Date();
    return activities
      .filter((a) => { const d = new Date(a.timestamp); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth(); })
      .reduce((s, a) => s + a.co2Kg, 0);
  }, [activities]);

  const carbonScore = useMemo(() => calculateScore(weeklyKg, monthlyKg), [weeklyKg, monthlyKg]);
  const { current: streakDays } = useMemo(() => calculateStreak(activities.map((a) => a.timestamp)), [activities]);

  const recommendations = useMemo(
    () => profile ? generateRecommendations(profile, activities.slice(0, 20), weeklyKg) : [],
    [profile, activities, weeklyKg]
  );

  const byCategory = useMemo(() => sumByCategory(activities.slice(0, 50)), [activities]);
  const recentActivities = activities.slice(0, 8);
  const unlockedBadges = badges.filter((b) => b.unlocked);
  const hasActivities = activities.length > 0;

  const prevWeeklyKg = useMemo(() => getPreviousWeekKg(activities), [activities]);
  const insight = useMemo(
    () => generateInsightCard(activities, profile, weeklyKg, prevWeeklyKg),
    [activities, profile, weeklyKg, prevWeeklyKg]
  );

  const chartData = daily7.map((d) => ({
    name: formatDayLabel(d.date),
    kg: Math.round(d.co2Kg * 10) / 10,
  }));

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            {profile ? `Hey, ${profile.name}! 👋` : "Dashboard"}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {hasActivities
              ? `${activities.length} activities logged · ${streakDays > 0 ? `${streakDays}-day streak 🔥` : "Start your streak!"}`
              : "Log your first activity with AI chat"}
          </p>
        </div>
        {!hasActivities && (
          <button onClick={onGoToChat}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900">
            🤖 Open AI Chat
          </button>
        )}
      </div>

      {/* AI Insight Card */}
      {hasActivities && (
        <div className="glass-card p-5 border-l-4" style={{ borderLeftColor: insight.isTrending === 'up' ? '#10b981' : insight.isTrending === 'down' ? '#f59e0b' : '#3b82f6' }}>
          <div className="flex items-start gap-3">
            <div className="text-2xl flex-shrink-0" aria-hidden="true">
              {insight.isTrending === 'up' ? '📉' : insight.isTrending === 'down' ? '📈' : '🔍'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">AI Insight</span>
                {insight.isTrending === 'up' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400">↓ Improving</span>
                )}
                {insight.isTrending === 'down' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-400">↑ Increasing</span>
                )}
              </div>
              <p className="text-sm font-semibold text-slate-200 mb-1">{insight.headline}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{insight.detail}</p>
              {insight.potentialSavingKgPerWeek > 0 && (
                <p className="text-xs text-emerald-400 mt-2 font-medium">
                  💡 Potential saving: ~{formatCo2(insight.potentialSavingKgPerWeek)}/week
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Score + Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-6 flex flex-col items-center justify-center">
          <ScoreRing score={carbonScore.score} level={carbonScore.level} label={carbonScore.label} />
          <p className="text-xs text-slate-600 mt-3 text-center">
            Better than {carbonScore.percentileBetter}% of global avg
          </p>
        </div>
        <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard emoji="📅" label="This Week" value={formatCo2(weeklyKg)}
            sub={`Global avg: ${formatCo2(GLOBAL_BENCHMARKS.globalAvgWeeklyKg)}`} />
          <StatCard emoji="📆" label="This Month" value={formatCo2(monthlyKg)}
            sub={`India avg: ${formatCo2(GLOBAL_BENCHMARKS.indiaAvgWeeklyKg * 4.33)}/mo`} />
          <StatCard emoji="🔥" label="Streak" value={`${streakDays} days`}
            sub={streakDays > 0 ? "Keep logging!" : "Log today!"} color="#f59e0b" />
          <StatCard emoji="🚗" label="Transport" value={formatCo2(byCategory.transport ?? 0)} />
          <StatCard emoji="🍽️" label="Food" value={formatCo2(byCategory.food ?? 0)} />
          <StatCard emoji="⚡" label="Energy" value={formatCo2(byCategory.energy ?? 0)} color="#3b82f6" />
        </div>
      </div>

      {/* Chart */}
      <div className="glass-card p-5">
        <h2 className="font-semibold text-sm text-slate-300 mb-4 flex items-center gap-2">
          <span>📈</span> Emissions — Last 7 Days
        </h2>
        <div className="h-44" role="img" aria-label="7-day CO₂ emissions area chart">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="kg" stroke="#10b981" strokeWidth={2}
                fill="url(#emeraldGrad)" dot={{ fill: "#10b981", r: 3 }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recommendations + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recommendations */}
        <div className="glass-card p-5">
          <h2 className="font-semibold text-sm text-slate-300 mb-4 flex items-center gap-2">
            <span>💡</span> AI Recommendations
          </h2>
          {recommendations.length === 0 ? (
            <div className="text-center py-6 text-slate-600 space-y-2">
              <p className="text-3xl">💡</p>
              <p className="text-sm">Log activities to get personalized tips</p>
              <button onClick={onGoToChat} className="mt-2 text-emerald-500 hover:text-emerald-400 text-xs underline">
                Open AI Chat →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendations.slice(0, 3).map((rec) => (
                <div key={rec.id} className="p-3 rounded-xl border border-slate-700/50 hover:border-emerald-900/50 bg-slate-800/30 transition-colors">
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className="text-sm">{getCategoryEmoji(rec.category)}</span>
                        <span className="text-xs font-semibold text-slate-200">{rec.title}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          rec.difficulty === "easy" ? "bg-emerald-950/80 text-emerald-400" :
                          rec.difficulty === "medium" ? "bg-amber-950/80 text-amber-400" :
                          "bg-red-950/80 text-red-400"}`}>{rec.difficulty}</span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{rec.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-emerald-400 font-bold text-xs">-{formatCo2(rec.estimatedCo2SavedKgPerWeek)}</p>
                      <p className="text-xs text-slate-600">/week</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="glass-card p-5">
          <h2 className="font-semibold text-sm text-slate-300 mb-4 flex items-center gap-2">
            <span>📋</span> Recent Activities
          </h2>
          {recentActivities.length === 0 ? (
            <div className="text-center py-8 text-slate-600 space-y-2">
              <p className="text-4xl">🌿</p>
              <p className="text-sm">No activities yet</p>
              <button onClick={onGoToChat}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-emerald-900/50 text-emerald-400 hover:bg-emerald-950/50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500">
                Tell the AI about your day →
              </button>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-64 space-y-0.5">
              {recentActivities.map((activity) => {
                const label = getActivityLabel(activity);
                const emoji = getCategoryEmoji(activity.activityType);
                return (
                  <div key={activity.id} className="flex items-center gap-3 py-2.5 border-b border-slate-800/60 last:border-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 text-sm">{emoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{label}</p>
                      <p className="text-xs text-slate-600 truncate">
                        {activity.aiSummary ? activity.aiSummary.slice(0, 55) + "…" : formatDate(activity.timestamp)}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold flex-shrink-0 ${activity.co2Kg > 3 ? "text-amber-400" : "text-emerald-400"}`}>
                      {formatCo2(activity.co2Kg)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Manual Logging Panel */}
      <ManualLogPanel />

      {/* Badges */}
      {unlockedBadges.length > 0 && (
        <div className="glass-card p-5">
          <h2 className="font-semibold text-sm text-slate-300 mb-3 flex items-center gap-2"><span>🏆</span> Achievements</h2>
          <div className="flex flex-wrap gap-2">
            {unlockedBadges.map((badge) => (
              <div key={badge.id} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-emerald-900/50 bg-emerald-950/30" title={badge.description}>
                <span className="text-lg">{badge.icon}</span>
                <span className="text-xs font-medium text-emerald-300">{badge.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}


    </div>
  );
}

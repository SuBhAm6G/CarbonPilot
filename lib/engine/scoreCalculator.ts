// ============================================================
// CarbonPilot — Score Calculator
// Converts weekly CO2 kg into a 0-100 sustainability score
// ============================================================

import type { CarbonScore, ScoreLevel } from "@/lib/types";
import { SCORE_THRESHOLDS, GLOBAL_BENCHMARKS } from "./emissionFactors";

export function calculateScore(weeklyKg: number, monthlyKg: number): CarbonScore {
  let score: number;
  let level: ScoreLevel;
  let label: string;

  if (weeklyKg < SCORE_THRESHOLDS.champion) {
    // 0-20 kg → score 90-100
    score = Math.round(90 + (1 - weeklyKg / SCORE_THRESHOLDS.champion) * 10);
    level = "champion";
    label = "Carbon Champion";
  } else if (weeklyKg < SCORE_THRESHOLDS.green) {
    // 20-40 kg → score 70-90
    const range = SCORE_THRESHOLDS.green - SCORE_THRESHOLDS.champion;
    const offset = weeklyKg - SCORE_THRESHOLDS.champion;
    score = Math.round(90 - (offset / range) * 20);
    level = "green";
    label = "Living Green";
  } else if (weeklyKg < SCORE_THRESHOLDS.average) {
    // 40-75 kg → score 45-70
    const range = SCORE_THRESHOLDS.average - SCORE_THRESHOLDS.green;
    const offset = weeklyKg - SCORE_THRESHOLDS.green;
    score = Math.round(70 - (offset / range) * 25);
    level = "average";
    label = "Near Average";
  } else if (weeklyKg < SCORE_THRESHOLDS.high) {
    // 75-120 kg → score 20-45
    const range = SCORE_THRESHOLDS.high - SCORE_THRESHOLDS.average;
    const offset = weeklyKg - SCORE_THRESHOLDS.average;
    score = Math.round(45 - (offset / range) * 25);
    level = "high";
    label = "High Emissions";
  } else {
    // ≥ 120 kg → score 0-20
    score = Math.max(0, Math.round(20 - (weeklyKg - SCORE_THRESHOLDS.high) / 10));
    level = "critical";
    label = "Critical Zone";
  }

  score = Math.max(0, Math.min(100, score));

  // Percentage better: what % of global average we are below
  const globalAvg = GLOBAL_BENCHMARKS.globalAvgWeeklyKg;
  const percentileBetter =
    weeklyKg >= globalAvg
      ? 0
      : Math.round(((globalAvg - weeklyKg) / globalAvg) * 100);

  return {
    score,
    level,
    label,
    weeklyKg,
    monthlyKg,
    globalAvgWeeklyKg: GLOBAL_BENCHMARKS.globalAvgWeeklyKg,
    percentileBetter,
  };
}

export function getScoreColor(level: ScoreLevel): string {
  switch (level) {
    case "champion":
      return "#10b981"; // emerald-500
    case "green":
      return "#22c55e"; // green-500
    case "average":
      return "#f59e0b"; // amber-500
    case "high":
      return "#f97316"; // orange-500
    case "critical":
      return "#ef4444"; // red-500
  }
}

export function getScoreGradient(level: ScoreLevel): string {
  switch (level) {
    case "champion":
      return "from-emerald-400 to-teal-500";
    case "green":
      return "from-green-400 to-emerald-500";
    case "average":
      return "from-yellow-400 to-amber-500";
    case "high":
      return "from-orange-400 to-red-500";
    case "critical":
      return "from-red-500 to-rose-600";
  }
}

export function calculateStreak(activityDates: string[]): {
  current: number;
  longest: number;
} {
  if (activityDates.length === 0) return { current: 0, longest: 0 };

  const uniqueDates = [...new Set(activityDates.map((d) => d.slice(0, 10)))].sort();
  const today = new Date().toISOString().slice(0, 10);

  let current = 0;
  let longest = 0;
  let streak = 0;
  let lastDate: string | null = null;

  for (const date of uniqueDates) {
    if (!lastDate) {
      streak = 1;
    } else {
      const diff =
        (new Date(date).getTime() - new Date(lastDate).getTime()) /
        (1000 * 60 * 60 * 24);
      if (diff === 1) {
        streak++;
      } else {
        streak = 1;
      }
    }
    longest = Math.max(longest, streak);
    lastDate = date;
  }

  // Current streak: check if last date is today or yesterday
  if (lastDate) {
    const diff =
      (new Date(today).getTime() - new Date(lastDate).getTime()) /
      (1000 * 60 * 60 * 24);
    current = diff <= 1 ? streak : 0;
  }

  return { current, longest };
}

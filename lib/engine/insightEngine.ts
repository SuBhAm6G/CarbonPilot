// ============================================================
// CarbonPilot — AI Insight Engine
// Generates context-aware, data-driven insight cards from
// the user's actual activity history and profile
// ============================================================

import type { ActivityLog, UserProfile, ActivityType } from "@/lib/types";
import { sumByCategory } from "./carbonCalculator";

export interface InsightCard {
  /** The headline sentence — short and punchy */
  headline: string;
  /** Supporting detail with an actionable number */
  detail: string;
  /** The dominant emission category driving the insight */
  dominantCategory: ActivityType | null;
  /** Percentage that dominant category represents of total */
  dominantPercent: number;
  /** Estimated weekly saving if the top recommendation is followed */
  potentialSavingKgPerWeek: number;
  /** Whether the user is performing better than last week */
  isTrending: "up" | "down" | "neutral";
}

/**
 * Generates a personalized, data-driven insight card.
 * Uses actual activity data — never generic copy.
 */
export function generateInsightCard(
  activities: ActivityLog[],
  profile: UserProfile | null,
  weeklyKg: number,
  previousWeeklyKg?: number | null
): InsightCard {
  // Determine week-over-week trend
  let isTrending: InsightCard["isTrending"] = "neutral";
  if (previousWeeklyKg != null && previousWeeklyKg > 0) {
    if (weeklyKg < previousWeeklyKg * 0.95) isTrending = "up";
    else if (weeklyKg > previousWeeklyKg * 1.05) isTrending = "down";
  }

  // Get this week's activities only
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekActivities = activities.filter(
    (a) => new Date(a.timestamp) >= weekStart
  );

  if (weeklyKg === 0 || weekActivities.length === 0) {
    return {
      headline: "Start logging to get personalized insights",
      detail: "Tell the AI about your day — your commute, meals, or energy use.",
      dominantCategory: null,
      dominantPercent: 0,
      potentialSavingKgPerWeek: 0,
      isTrending: "neutral",
    };
  }

  const byCategory = sumByCategory(weekActivities);

  // Find the dominant emission category
  type CategoryEntry = [string, number];
  const sorted = (Object.entries(byCategory) as CategoryEntry[]).sort(
    (a, b) => b[1] - a[1]
  );
  const [topCategory, topKg] = sorted[0] ?? ["other", 0];
  const dominantPercent = weeklyKg > 0 ? Math.round((topKg / weeklyKg) * 100) : 0;

  // Generate context-aware headline and detail based on dominant category
  let headline = "";
  let detail = "";
  let potentialSavingKgPerWeek = 0;

  const dominantCategoryLabel =
    topCategory === "transport"
      ? "🚗 Transport"
      : topCategory === "food"
      ? "🍽️ Food"
      : topCategory === "energy"
      ? "⚡ Energy"
      : topCategory === "shopping"
      ? "🛍️ Shopping"
      : "📋 Other";

  if (topCategory === "transport") {
    potentialSavingKgPerWeek = topKg * 0.7; // ~70% saving by switching to metro
    headline = `${dominantCategoryLabel} generated ${dominantPercent}% of your emissions this week`;
    if (profile?.primaryTransport === "car_petrol" || profile?.primaryTransport === "car_diesel") {
      detail = `Switching to metro or train for just 2 commute days per week could save ~${potentialSavingKgPerWeek.toFixed(1)} kg CO₂ — that's ${Math.round(potentialSavingKgPerWeek * 52 / 22)} fewer trees needed to offset annually.`;
    } else {
      detail = `Your transport choices this week total ${topKg.toFixed(1)} kg CO₂. Combining trips or cycling short distances can reduce this further.`;
    }
  } else if (topCategory === "food") {
    potentialSavingKgPerWeek = topKg * 0.45; // ~45% saving by switching to plant-based 2 days
    headline = `${dominantCategoryLabel} generated ${dominantPercent}% of your emissions this week`;
    const hasMeat = weekActivities.some(
      (a) =>
        a.activityType === "food" &&
        ["mutton", "lamb", "chicken", "pork", "fish"].includes(
          (a.details as { mealType: string }).mealType
        )
    );
    if (hasMeat) {
      detail = `Adding 2 plant-based days per week could save ~${potentialSavingKgPerWeek.toFixed(1)} kg CO₂ per week — without a drastic lifestyle change.`;
    } else {
      detail = `Great food choices this week! Vegetarian and vegan meals are the lowest-carbon diet options available.`;
    }
  } else if (topCategory === "energy") {
    potentialSavingKgPerWeek = topKg * 0.65;
    headline = `${dominantCategoryLabel} generated ${dominantPercent}% of your emissions this week`;
    detail = `Switching to a renewable electricity plan or reducing AC usage could cut your energy footprint by up to ${Math.round(potentialSavingKgPerWeek * 10) / 10} kg CO₂/week.`;
  } else {
    headline = `Your total this week is ${weeklyKg.toFixed(1)} kg CO₂`;
    detail = "Keep logging activities for more detailed, personalized insights.";
  }

  return {
    headline,
    detail,
    dominantCategory: topCategory as ActivityType,
    dominantPercent,
    potentialSavingKgPerWeek: Math.round(potentialSavingKgPerWeek * 10) / 10,
    isTrending,
  };
}

/**
 * Computes the previous week's total for trend analysis.
 */
export function getPreviousWeekKg(activities: ActivityLog[]): number | null {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);

  const prevWeekActivities = activities.filter((a) => {
    const d = new Date(a.timestamp);
    return d >= prevWeekStart && d < weekStart;
  });

  if (prevWeekActivities.length === 0) return null;
  return prevWeekActivities.reduce((sum, a) => sum + a.co2Kg, 0);
}

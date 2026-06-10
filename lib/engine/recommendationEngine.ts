// ============================================================
// CarbonPilot — Recommendation Engine
// Generates personalized, actionable CO2-saving recommendations
// ============================================================

import type {
  ActivityLog,
  Recommendation,
  UserProfile,
  Badge,
  BadgeId,
  WeeklyChallenge,
} from "@/lib/types";
import { TRANSPORT_FACTORS, FOOD_FACTORS, GLOBAL_BENCHMARKS } from "./emissionFactors";
import { sumByCategory } from "./carbonCalculator";

// ---- Recommendation Generation ----

export function generateRecommendations(
  profile: UserProfile,
  recentActivities: ActivityLog[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  weeklyKg: number
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const byCategory = sumByCategory(recentActivities);

  // Transport recommendations
  const transportKg = byCategory.transport ?? 0;
  if (transportKg > 10) {
    if (
      profile.primaryTransport === "car_petrol" ||
      profile.primaryTransport === "car_diesel"
    ) {
      recommendations.push({
        id: "rec_metro",
        category: "transport",
        title: "Switch to Metro / Train",
        description:
          "Taking the metro instead of your car for your daily commute can dramatically cut emissions. Trains emit ~78% less CO₂ than petrol cars per km.",
        estimatedCo2SavedKgPerWeek:
          (TRANSPORT_FACTORS.car_petrol - TRANSPORT_FACTORS.train) * 10 * 5, // assume 10km, 5 days
        difficulty: "easy",
        actionLabel: "Plan My Commute",
      });

      recommendations.push({
        id: "rec_carpool",
        category: "transport",
        title: "Carpool 3 Days This Week",
        description:
          "Sharing your ride with just one colleague halves your transport emissions. Easy win with zero lifestyle change.",
        estimatedCo2SavedKgPerWeek: TRANSPORT_FACTORS.car_petrol * 10 * 3 * 0.5,
        difficulty: "easy",
        actionLabel: "Find a Carpool Partner",
      });
    }

    if (profile.primaryTransport !== "cycling" && profile.primaryTransport !== "walking") {
      recommendations.push({
        id: "rec_cycling",
        category: "transport",
        title: "Cycle Short Trips (< 5 km)",
        description:
          "For trips under 5 km, cycling is zero-emission and often faster in city traffic. Bonus: free exercise!",
        estimatedCo2SavedKgPerWeek: TRANSPORT_FACTORS.car_petrol * 4 * 3,
        difficulty: "medium",
        actionLabel: "Map Bike-Friendly Routes",
      });
    }

    if (profile.primaryTransport !== "car_electric") {
      recommendations.push({
        id: "rec_ev",
        category: "transport",
        title: "Switch to an Electric Vehicle",
        description:
          "EVs emit ~72% less CO₂ than petrol cars over their lifetime. With India's improving grid, the benefit grows every year.",
        estimatedCo2SavedKgPerWeek:
          (TRANSPORT_FACTORS.car_petrol - TRANSPORT_FACTORS.car_electric) * 10 * 5,
        difficulty: "hard",
        actionLabel: "Explore EV Options",
      });
    }
  }

  // Food recommendations
  const foodKg = byCategory.food ?? 0;
  if (foodKg > 5 || profile.dietType === "heavy_meat" || profile.dietType === "omnivore") {
    recommendations.push({
      id: "rec_meatfree",
      category: "food",
      title: "Try 2 Meat-Free Days",
      description:
        "Replacing mutton with a plant-based meal just twice a week saves over 13 kg CO₂ — equivalent to driving 70 km!",
      estimatedCo2SavedKgPerWeek: (FOOD_FACTORS.mutton - FOOD_FACTORS.vegetarian) * 2,
      difficulty: "easy",
      actionLabel: "Browse Plant-Based Recipes",
    });

    if (profile.dietType === "heavy_meat") {
      recommendations.push({
        id: "rec_chicken_swap",
        category: "food",
        title: "Swap mutton for Chicken",
        description:
          "Chicken has 5x fewer emissions than mutton. A simple swap at dinner makes a measurable difference every week.",
        estimatedCo2SavedKgPerWeek: (FOOD_FACTORS.mutton - FOOD_FACTORS.chicken) * 3,
        difficulty: "easy",
        actionLabel: "Learn More",
      });
    }
  }

  // Energy recommendations
  if (
    profile.energySource === "coal_grid" ||
    profile.energySource === "average_grid"
  ) {
    recommendations.push({
      id: "rec_renewable",
      category: "energy",
      title: "Switch to Green Electricity Plan",
      description:
        "Many providers now offer renewable energy plans. Switching can reduce your home energy emissions by up to 90%.",
      estimatedCo2SavedKgPerWeek:
        (profile.monthlyElectricityKwh / 4) * 0.65, // 65% saving vs average grid
      difficulty: "medium",
      actionLabel: "Find Green Plans",
    });

    recommendations.push({
      id: "rec_led",
      category: "energy",
      title: "Replace Bulbs with LEDs",
      description:
        "LED bulbs use 75% less energy than incandescent. A 10-bulb home can save ~15 kWh/month = 10.6 kg CO₂.",
      estimatedCo2SavedKgPerWeek: 2.5,
      difficulty: "easy",
      actionLabel: "Calculate Savings",
    });
  }

  // Sort by CO2 savings (highest impact first), then by difficulty
  return recommendations
    .sort((a, b) => b.estimatedCo2SavedKgPerWeek - a.estimatedCo2SavedKgPerWeek)
    .slice(0, 5);
}

// ---- Badge System ----

export const ALL_BADGES: Badge[] = [
  {
    id: "first_log",
    name: "First Steps",
    description: "Logged your first activity",
    icon: "🌱",
    unlocked: false,
  },
  {
    id: "week_streak",
    name: "Week Warrior",
    description: "Logged activities 7 days in a row",
    icon: "🔥",
    unlocked: false,
  },
  {
    id: "month_streak",
    name: "Month Master",
    description: "Logged activities 30 days in a row",
    icon: "🏆",
    unlocked: false,
  },
  {
    id: "green_transport",
    name: "Green Commuter",
    description: "Used sustainable transport 5 times",
    icon: "🚲",
    unlocked: false,
  },
  {
    id: "plant_based",
    name: "Plant Powered",
    description: "Logged 10 vegetarian or vegan meals",
    icon: "🥗",
    unlocked: false,
  },
  {
    id: "carbon_reducer",
    name: "Carbon Cutter",
    description: "Reduced weekly emissions by 20% vs previous week",
    icon: "✂️",
    unlocked: false,
  },
  {
    id: "challenge_complete",
    name: "Challenge Accepted",
    description: "Completed a weekly challenge",
    icon: "⚡",
    unlocked: false,
  },
  {
    id: "below_average",
    name: "Below Average (In a Good Way!)",
    description: "Weekly emissions below global average",
    icon: "🌍",
    unlocked: false,
  },
  {
    id: "carbon_champion",
    name: "Carbon Champion",
    description: "Achieved a sustainability score of 90+",
    icon: "🥇",
    unlocked: false,
  },
];

export function checkBadges(
  activities: ActivityLog[],
  currentStreak: number,
  weeklyKg: number,
  previousWeeklyKg: number | null,
  currentBadges: Badge[]
): Badge[] {
  const updatedBadges = currentBadges.map((b) => ({ ...b }));

  const unlock = (id: BadgeId) => {
    const badge = updatedBadges.find((b) => b.id === id);
    if (badge && !badge.unlocked) {
      badge.unlocked = true;
      badge.unlockedAt = new Date().toISOString();
    }
  };

  // First log
  if (activities.length >= 1) unlock("first_log");

  // Streak badges
  if (currentStreak >= 7) unlock("week_streak");
  if (currentStreak >= 30) unlock("month_streak");

  // Green transport
  const greenTransportCount = activities.filter(
    (a) =>
      a.activityType === "transport" &&
      (a.details as { mode: string }).mode &&
      ["cycling", "walking", "train", "bus"].includes(
        (a.details as { mode: string }).mode
      )
  ).length;
  if (greenTransportCount >= 5) unlock("green_transport");

  // Plant-based meals
  const plantMealCount = activities.filter(
    (a) =>
      a.activityType === "food" &&
      ["vegetarian", "vegan"].includes(
        (a.details as { mealType: string }).mealType
      )
  ).length;
  if (plantMealCount >= 10) unlock("plant_based");

  // Carbon reducer
  if (
    previousWeeklyKg !== null &&
    previousWeeklyKg > 0 &&
    weeklyKg < previousWeeklyKg * 0.8
  ) {
    unlock("carbon_reducer");
  }

  // Below global average
  if (weeklyKg < GLOBAL_BENCHMARKS.globalAvgWeeklyKg) unlock("below_average");

  return updatedBadges;
}

// ---- Weekly Challenge Generation ----

export function generateWeeklyChallenge(): WeeklyChallenge {
  const challenges = [
    {
      id: "challenge_metro",
      title: "Metro Week",
      description: "Use public transport instead of your car every weekday",
      targetCo2ReductionKg: 15,
    },
    {
      id: "challenge_veggie",
      title: "Vegetarian Week",
      description: "Eat only vegetarian meals for 7 days",
      targetCo2ReductionKg: 20,
    },
    {
      id: "challenge_walk",
      title: "Walk It Out",
      description: "Walk or cycle for all trips under 3 km this week",
      targetCo2ReductionKg: 5,
    },
    {
      id: "challenge_energy",
      title: "Energy Saver",
      description: "Reduce electricity usage by 20% compared to your average",
      targetCo2ReductionKg: 8,
    },
  ];

  // Pick based on week number for determinism
  const weekNum = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const challenge = challenges[weekNum % challenges.length];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - startDate.getDay()); // Monday

  return {
    ...challenge,
    daysCompleted: 0,
    totalDays: 7,
    completed: false,
    startDate: startDate.toISOString().slice(0, 10),
  };
}

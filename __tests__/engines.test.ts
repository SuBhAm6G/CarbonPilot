import { describe, it, expect } from "vitest";
import { calculateScore, getScoreColor, calculateStreak } from "../lib/engine/scoreCalculator";
import {
  generateRecommendations,
  checkBadges,
  generateWeeklyChallenge,
  ALL_BADGES,
} from "../lib/engine/recommendationEngine";
import { runSimulator, getAllScenarios } from "../lib/engine/whatIfCalculator";
import { generateCarbonTwin } from "../lib/engine/carbonTwin";
import { generateInsightCard, getPreviousWeekKg } from "../lib/engine/insightEngine";
import type { UserProfile, ActivityLog, FoodActivity, TransportActivity } from "../lib/types";

// ---- Shared test fixtures ----

const mockProfile: UserProfile = {
  name: "Test User",
  primaryTransport: "car_petrol",
  dietType: "omnivore",
  householdSize: 2,
  energySource: "average_grid",
  sustainabilityGoal: "overall_reduction",
  monthlyElectricityKwh: 150,
  createdAt: new Date().toISOString(),
};

const weeklyActivities: ActivityLog[] = [
  {
    id: "a1",
    timestamp: new Date().toISOString(),
    activityType: "transport",
    details: { type: "transport", mode: "car_petrol", distanceKm: 15 },
    co2Kg: 2.88,
  },
  {
    id: "a2",
    timestamp: new Date().toISOString(),
    activityType: "food",
    details: { type: "food", mealType: "chicken", servings: 1 },
    co2Kg: 1.26,
  },
  {
    id: "a3",
    timestamp: new Date().toISOString(),
    activityType: "energy",
    details: { type: "energy", energyType: "electricity", amount: 5 },
    co2Kg: 3.58,
  },
];

// ============================================================
// Score Calculator Tests
// ============================================================

describe("calculateScore", () => {
  it("returns champion level for very low weekly emissions", () => {
    const result = calculateScore(5, 20);
    expect(result.level).toBe("champion");
    expect(result.score).toBeGreaterThanOrEqual(90);
  });

  it("returns green level for emissions below India average", () => {
    const result = calculateScore(25, 100);
    expect(result.level).toBe("green");
    expect(result.score).toBeGreaterThan(70);
    expect(result.score).toBeLessThanOrEqual(90);
  });

  it("returns average level for moderate emissions", () => {
    const result = calculateScore(40, 160);
    expect(result.level).toBe("average");
  });

  it("returns high level for above-average emissions", () => {
    const result = calculateScore(70, 280);
    expect(result.level).toBe("high");
  });

  it("returns critical level for very high emissions", () => {
    const result = calculateScore(120, 480);
    expect(result.level).toBe("critical");
    expect(result.score).toBeLessThanOrEqual(20);
  });

  it("score is always between 0 and 100", () => {
    [0, 5, 15, 30, 50, 100, 200, 500].forEach((kg) => {
      const result = calculateScore(kg, kg * 4);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  it("percentileBetter is 0 when above global average", () => {
    const result = calculateScore(200, 800);
    expect(result.percentileBetter).toBe(0);
  });

  it("percentileBetter > 0 when below global average", () => {
    const result = calculateScore(20, 80);
    expect(result.percentileBetter).toBeGreaterThan(0);
  });
});

describe("getScoreColor", () => {
  it("returns distinct colors for each level", () => {
    const champion = getScoreColor("champion");
    const critical = getScoreColor("critical");
    expect(champion).not.toBe(critical);
  });

  it("returns a valid hex color string for every level", () => {
    const levels = ["champion", "green", "average", "high", "critical"] as const;
    levels.forEach((level) => {
      const color = getScoreColor(level);
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
});

describe("calculateStreak", () => {
  it("returns 0 for empty activity list", () => {
    expect(calculateStreak([]).current).toBe(0);
  });

  it("returns streak of 1 for today only", () => {
    const today = new Date().toISOString();
    expect(calculateStreak([today]).current).toBe(1);
  });

  it("correctly counts a multi-day streak", () => {
    const dates: string[] = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString());
    }
    const result = calculateStreak(dates);
    expect(result.current).toBe(5);
    expect(result.longest).toBeGreaterThanOrEqual(5);
  });

  it("breaks streak for non-consecutive days", () => {
    const today = new Date().toISOString();
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
    const result = calculateStreak([today, threeDaysAgo]);
    expect(result.current).toBe(1); // only today counts
  });
});

// ============================================================
// Recommendation Engine Tests
// ============================================================

describe("generateRecommendations", () => {
  it("returns recommendations when user has a car and transport emissions", () => {
    const recs = generateRecommendations(mockProfile, weeklyActivities, 7.72);
    expect(recs.length).toBeGreaterThan(0);
  });

  it("returns max 5 recommendations", () => {
    const recs = generateRecommendations(mockProfile, weeklyActivities, 20);
    expect(recs.length).toBeLessThanOrEqual(5);
  });

  it("does not recommend transport switch for zero-emission transport profiles", () => {
    const veganProfile: UserProfile = { ...mockProfile, dietType: "vegan", primaryTransport: "cycling" };
    const recs = generateRecommendations(veganProfile, [], 0);
    // No transport or food recs for zero-emission profile
    expect(recs.some((r) => r.category === "transport")).toBe(false);
    expect(recs.some((r) => r.category === "food")).toBe(false);
  });

  it("sorts by co2 savings descending", () => {
    const recs = generateRecommendations(mockProfile, weeklyActivities, 10);
    for (let i = 1; i < recs.length; i++) {
      expect(recs[i - 1].estimatedCo2SavedKgPerWeek).toBeGreaterThanOrEqual(
        recs[i].estimatedCo2SavedKgPerWeek
      );
    }
  });

  it("recommends renewable energy for coal grid users", () => {
    const coalProfile: UserProfile = { ...mockProfile, energySource: "coal_grid" };
    const recs = generateRecommendations(coalProfile, weeklyActivities, 15);
    expect(recs.some((r) => r.id === "rec_renewable")).toBe(true);
  });

  it("does not recommend metro switch if already using train", () => {
    const trainProfile: UserProfile = { ...mockProfile, primaryTransport: "train" };
    const recs = generateRecommendations(trainProfile, [], 5);
    expect(recs.some((r) => r.id === "rec_metro")).toBe(false);
  });
});

describe("checkBadges", () => {
  it("unlocks first_log badge after first activity", () => {
    const updated = checkBadges(weeklyActivities, 1, 7, null, ALL_BADGES);
    const badge = updated.find((b) => b.id === "first_log");
    expect(badge?.unlocked).toBe(true);
  });

  it("does not unlock week_streak without 7-day streak", () => {
    const updated = checkBadges(weeklyActivities, 3, 7, null, ALL_BADGES);
    const badge = updated.find((b) => b.id === "week_streak");
    expect(badge?.unlocked).toBe(false);
  });

  it("unlocks below_average badge when weekly < global average", () => {
    const updated = checkBadges(weeklyActivities, 1, 10, null, ALL_BADGES);
    const badge = updated.find((b) => b.id === "below_average");
    expect(badge?.unlocked).toBe(true);
  });
});

describe("generateWeeklyChallenge", () => {
  it("returns a challenge with valid structure", () => {
    const challenge = generateWeeklyChallenge();
    expect(challenge).toHaveProperty("id");
    expect(challenge).toHaveProperty("title");
    expect(challenge).toHaveProperty("totalDays", 7);
    expect(challenge).toHaveProperty("daysCompleted", 0);
    expect(challenge).toHaveProperty("completed", false);
    expect(challenge.targetCo2ReductionKg).toBeGreaterThan(0);
  });
});

// ============================================================
// What-If Simulator Tests
// ============================================================

describe("runSimulator", () => {
  it("metro switch produces equal or lower projected emissions", () => {
    const result = runSimulator("switch_to_metro", mockProfile, weeklyActivities);
    expect(result.projectedWeeklyCo2Kg).toBeLessThanOrEqual(result.currentWeeklyCo2Kg);
  });

  it("vegetarian switch reduces food emissions", () => {
    const result = runSimulator("become_vegetarian", mockProfile, weeklyActivities);
    expect(result.weeklySavingsKg).toBeGreaterThanOrEqual(0);
  });

  it("renewable energy switch reduces emissions for grid users", () => {
    const result = runSimulator("renewable_energy", mockProfile, weeklyActivities);
    expect(result.projectedWeeklyCo2Kg).toBeLessThanOrEqual(result.currentWeeklyCo2Kg);
  });

  it("all scenarios return valid result structure", () => {
    const scenarios = getAllScenarios();
    scenarios.forEach(({ key }) => {
      const result = runSimulator(key, mockProfile, weeklyActivities);
      expect(result.currentWeeklyCo2Kg).toBeGreaterThanOrEqual(0);
      expect(result.projectedWeeklyCo2Kg).toBeGreaterThanOrEqual(0);
      expect(result.yearlySavingsKg).toBeDefined();
      expect(result.treeEquivalent).toBeGreaterThanOrEqual(0);
    });
  });

  it("projected emissions are never negative", () => {
    const result = runSimulator("become_vegan", mockProfile, weeklyActivities);
    expect(result.projectedWeeklyCo2Kg).toBeGreaterThanOrEqual(0);
  });

  it("cycling switch only affects short trips ≤10km", () => {
    const longTrip: ActivityLog = {
      id: "long",
      timestamp: new Date().toISOString(),
      activityType: "transport",
      details: { type: "transport", mode: "car_petrol", distanceKm: 50 },
      co2Kg: 9.6,
    };
    const shortTrip: ActivityLog = {
      id: "short",
      timestamp: new Date().toISOString(),
      activityType: "transport",
      details: { type: "transport", mode: "car_petrol", distanceKm: 5 },
      co2Kg: 0.96,
    };
    const longResult = runSimulator("switch_to_cycling", mockProfile, [longTrip]);
    const shortResult = runSimulator("switch_to_cycling", mockProfile, [shortTrip]);
    // Long trip (50km) should NOT be switched (>10km), short trip (5km) should be
    expect(longResult.weeklySavingsKg).toBe(0);
    expect(shortResult.weeklySavingsKg).toBeGreaterThan(0);
  });
});

// ============================================================
// Carbon Twin Tests
// ============================================================

describe("generateCarbonTwin", () => {
  it("generates a valid carbon twin for a vegan cyclist", () => {
    const veganProfile: UserProfile = {
      ...mockProfile,
      dietType: "vegan",
      primaryTransport: "cycling",
    };
    const twin = generateCarbonTwin(veganProfile);
    expect(twin.annualKg).toBeGreaterThan(0);
    expect(twin.transportAnnualKg).toBe(0); // cycling = 0 emissions
    expect(twin.foodAnnualKg).toBeGreaterThan(0);
    expect(twin.treesNeeded).toBeGreaterThan(0);
  });

  it("car user has higher annual emissions than cyclist", () => {
    const carProfile: UserProfile = { ...mockProfile, primaryTransport: "car_petrol" };
    const cycleProfile: UserProfile = { ...mockProfile, primaryTransport: "cycling" };
    const carTwin = generateCarbonTwin(carProfile);
    const cycleTwin = generateCarbonTwin(cycleProfile);
    expect(carTwin.annualKg).toBeGreaterThan(cycleTwin.annualKg);
  });

  it("returns correct comparison count", () => {
    const twin = generateCarbonTwin(mockProfile);
    expect(twin.comparisons).toHaveLength(3);
  });

  it("comparisons have valid isGood flags", () => {
    const twin = generateCarbonTwin(mockProfile);
    twin.comparisons.forEach((comp) => {
      if (comp.userKg <= comp.benchmarkKg) {
        expect(comp.isGood).toBe(true);
      } else {
        expect(comp.isGood).toBe(false);
      }
    });
  });

  it("heavy meat user has higher food emissions than vegan", () => {
    const meatProfile: UserProfile = { ...mockProfile, dietType: "heavy_meat" };
    const veganProfile: UserProfile = { ...mockProfile, dietType: "vegan" };
    const meatTwin = generateCarbonTwin(meatProfile);
    const veganTwin = generateCarbonTwin(veganProfile);
    expect(meatTwin.foodAnnualKg).toBeGreaterThan(veganTwin.foodAnnualKg);
  });
});

// ============================================================
// Insight Engine Tests
// ============================================================

describe("generateInsightCard", () => {
  it("returns start logging message when no activities", () => {
    const insight = generateInsightCard([], null, 0);
    expect(insight.dominantCategory).toBeNull();
    expect(insight.headline).toContain("Start logging");
  });

  it("identifies transport as dominant category correctly", () => {
    const transportHeavy: ActivityLog[] = [
      {
        id: "t1",
        timestamp: new Date().toISOString(),
        activityType: "transport",
        details: { type: "transport", mode: "car_petrol", distanceKm: 100 },
        co2Kg: 19.2,
      },
      {
        id: "f1",
        timestamp: new Date().toISOString(),
        activityType: "food",
        details: { type: "food", mealType: "vegetarian", servings: 1 },
        co2Kg: 0.45,
      },
    ];
    const insight = generateInsightCard(transportHeavy, mockProfile, 19.65);
    expect(insight.dominantCategory).toBe("transport");
    expect(insight.dominantPercent).toBeGreaterThan(90);
  });

  it("detects improving trend", () => {
    const insight = generateInsightCard(weeklyActivities, mockProfile, 5, 10);
    expect(insight.isTrending).toBe("up");
  });

  it("detects declining trend", () => {
    const insight = generateInsightCard(weeklyActivities, mockProfile, 15, 10);
    expect(insight.isTrending).toBe("down");
  });

  it("potential saving is always non-negative", () => {
    const insight = generateInsightCard(weeklyActivities, mockProfile, 7.72);
    expect(insight.potentialSavingKgPerWeek).toBeGreaterThanOrEqual(0);
  });
});

describe("getPreviousWeekKg", () => {
  it("returns null when no previous week activities", () => {
    const result = getPreviousWeekKg(weeklyActivities); // all from this week
    expect(result).toBeNull();
  });

  it("returns summed kg for previous week activities", () => {
    const lastWeekDate = new Date();
    lastWeekDate.setDate(lastWeekDate.getDate() - 8); // 8 days ago = last week
    const lastWeekActivity: ActivityLog = {
      id: "lw1",
      timestamp: lastWeekDate.toISOString(),
      activityType: "transport",
      details: { type: "transport", mode: "car_petrol", distanceKm: 10 },
      co2Kg: 1.92,
    };
    const result = getPreviousWeekKg([...weeklyActivities, lastWeekActivity]);
    expect(result).toBeCloseTo(1.92);
  });
});

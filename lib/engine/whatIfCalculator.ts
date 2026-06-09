// ============================================================
// CarbonPilot — What-If Simulator
// Projects emissions savings for alternative lifestyle choices
// ============================================================

import type {
  ActivityLog,
  SimulatorResult,
  UserProfile,
} from "@/lib/types";
import {
  TRANSPORT_FACTORS,
  FOOD_FACTORS,
  GLOBAL_BENCHMARKS,
  ENERGY_FACTORS_BY_SOURCE,
} from "./emissionFactors";
import { sumActivities } from "./carbonCalculator";

export type SimulatorScenarioKey =
  | "switch_to_metro"
  | "switch_to_cycling"
  | "switch_to_ev"
  | "become_vegetarian"
  | "become_vegan"
  | "reduce_mutton"
  | "work_from_home_2days"
  | "renewable_energy"
  | "reduce_flights";

interface ScenarioDefinition {
  label: string;
  description: string;
  compute: (
    profile: UserProfile,
    currentWeekly: number,
    activities: ActivityLog[]
  ) => number; // returns projected weekly kg
}

const SCENARIOS: Record<SimulatorScenarioKey, ScenarioDefinition> = {
  switch_to_metro: {
    label: "Switch to Metro/Train",
    description:
      "Replace all car commutes with metro or train transport",
    compute: (profile, currentWeekly, activities) => {
      let saving = 0;
      for (const a of activities) {
        if (a.details.type === "transport") {
          const d = a.details;
          if (["car_petrol", "car_diesel", "motorcycle"].includes(d.mode)) {
            const currentFactor = TRANSPORT_FACTORS[d.mode as keyof typeof TRANSPORT_FACTORS] ?? 0.12;
            const newFactor = TRANSPORT_FACTORS.train;
            saving += (currentFactor - newFactor) * d.distanceKm;
          }
        }
      }
      return Math.max(0, currentWeekly - saving);
    },
  },

  switch_to_cycling: {
    label: "Cycle All Short Trips",
    description: "Cycle instead of driving for any trip under 10 km",
    compute: (profile, currentWeekly, activities) => {
      let saving = 0;
      for (const a of activities) {
        if (a.details.type === "transport") {
          const d = a.details;
          if (
            ["car_petrol", "car_diesel", "motorcycle"].includes(d.mode) &&
            d.distanceKm <= 10
          ) {
            const factor = TRANSPORT_FACTORS[d.mode as keyof typeof TRANSPORT_FACTORS] ?? 0.12;
            saving += factor * d.distanceKm;
          }
        }
      }
      return Math.max(0, currentWeekly - saving);
    },
  },

  switch_to_ev: {
    label: "Switch to Electric Vehicle",
    description: "Replace petrol/diesel car with an EV",
    compute: (profile, currentWeekly, activities) => {
      let saving = 0;
      for (const a of activities) {
        if (a.details.type === "transport") {
          const d = a.details;
          if (["car_petrol", "car_diesel"].includes(d.mode)) {
            const currentFactor = TRANSPORT_FACTORS[d.mode as keyof typeof TRANSPORT_FACTORS] ?? 0.192;
            const saving_ = (currentFactor - TRANSPORT_FACTORS.car_electric) * d.distanceKm;
            saving += saving_;
          }
        }
      }
      return Math.max(0, currentWeekly - saving);
    },
  },

  become_vegetarian: {
    label: "Go Vegetarian",
    description: "Replace all meat meals with vegetarian options",
    compute: (profile, currentWeekly, activities) => {
      let saving = 0;
      for (const a of activities) {
        if (a.details.type === "food") {
          const d = a.details;
          if (["mutton", "lamb", "pork", "chicken", "fish"].includes(d.mealType)) {
            const currentFactor = FOOD_FACTORS[d.mealType as keyof typeof FOOD_FACTORS] ?? FOOD_FACTORS.chicken;
            saving += (currentFactor - FOOD_FACTORS.vegetarian) * d.servings;
          }
        }
      }
      return Math.max(0, currentWeekly - saving);
    },
  },

  become_vegan: {
    label: "Go Vegan",
    description: "Replace all animal products with vegan options",
    compute: (profile, currentWeekly, activities) => {
      let saving = 0;
      for (const a of activities) {
        if (a.details.type === "food") {
          const d = a.details;
          if (["mutton", "lamb", "pork", "chicken", "fish", "dairy", "vegetarian"].includes(d.mealType)) {
            const currentFactor = FOOD_FACTORS[d.mealType as keyof typeof FOOD_FACTORS] ?? FOOD_FACTORS.vegetarian;
            saving += (currentFactor - FOOD_FACTORS.vegan) * d.servings;
          }
        }
      }
      return Math.max(0, currentWeekly - saving);
    },
  },

  reduce_mutton: {
    label: "Cut Mutton by 50%",
    description: "Halve your mutton consumption and replace with chicken",
    compute: (profile, currentWeekly, activities) => {
      let saving = 0;
      for (const a of activities) {
        if (a.details.type === "food") {
          const d = a.details;
          // Match both "mutton" and "lamb" — same food, both returned by AI
          if (d.mealType === "mutton" || d.mealType === "lamb") {
            const factor = FOOD_FACTORS[d.mealType as keyof typeof FOOD_FACTORS] ?? FOOD_FACTORS.lamb;
            saving += (factor - FOOD_FACTORS.chicken) * d.servings * 0.5;
          }
        }
      }
      return Math.max(0, currentWeekly - saving);
    },
  },

  work_from_home_2days: {
    label: "Work From Home 2 Days",
    description: "Remove 2 commute days per week",
    compute: (profile, currentWeekly, activities) => {
      const commuteDays = 5;
      const wfhDays = 2;
      let saving = 0;
      for (const a of activities) {
        if (a.details.type === "transport") {
          const d = a.details;
          if (["car_petrol", "car_diesel", "car_electric", "motorcycle"].includes(d.mode)) {
            const factor = TRANSPORT_FACTORS[d.mode as keyof typeof TRANSPORT_FACTORS] ?? 0.12;
            const dailyEmissions = (factor * d.distanceKm) / commuteDays;
            saving += dailyEmissions * wfhDays;
          }
        }
      }
      return Math.max(0, currentWeekly - saving);
    },
  },

  renewable_energy: {
    label: "Switch to Renewable Energy",
    description: "Switch home electricity to a renewable energy plan",
    compute: (profile, currentWeekly, activities) => {
      const monthlyKwh = profile.monthlyElectricityKwh;
      const weeklyKwh = monthlyKwh / 4.33;
      const currentFactor = ENERGY_FACTORS_BY_SOURCE[profile.energySource];
      const renewableFactor = ENERGY_FACTORS_BY_SOURCE.renewable_grid;
      const saving = (currentFactor - renewableFactor) * weeklyKwh;
      return Math.max(0, currentWeekly - saving);
    },
  },

  reduce_flights: {
    label: "Eliminate Short-Haul Flights",
    description: "Replace short flights with train travel where possible",
    compute: (profile, currentWeekly, activities) => {
      // Assume flat 10% reduction since we don't track flights in weekly
      return currentWeekly * 0.9;
    },
  },
};

export function runSimulator(
  scenario: SimulatorScenarioKey,
  profile: UserProfile,
  weeklyActivities: ActivityLog[]
): SimulatorResult {
  const scenarioDef = SCENARIOS[scenario];
  const currentWeeklyKg = sumActivities(weeklyActivities);
  const projectedWeeklyKg = scenarioDef.compute(profile, currentWeeklyKg, weeklyActivities);

  const weeklySavingsKg = currentWeeklyKg - projectedWeeklyKg;
  const monthlySavingsKg = weeklySavingsKg * 4.33;
  const yearlySavingsKg = weeklySavingsKg * 52;
  const treeEquivalent = Math.round(yearlySavingsKg / GLOBAL_BENCHMARKS.co2PerTreePerYear);

  return {
    scenario,
    scenarioLabel: scenarioDef.label,
    currentWeeklyCo2Kg: currentWeeklyKg,
    projectedWeeklyCo2Kg: projectedWeeklyKg,
    weeklySavingsKg,
    monthlySavingsKg,
    yearlySavingsKg,
    description: scenarioDef.description,
    treeEquivalent,
  };
}

export function getAllScenarios(): { key: SimulatorScenarioKey; label: string; description: string }[] {
  return Object.entries(SCENARIOS).map(([key, def]) => ({
    key: key as SimulatorScenarioKey,
    label: def.label,
    description: def.description,
  }));
}

// ============================================================
// CarbonPilot — Carbon Calculator Engine
// Pure deterministic functions — NO side effects, fully testable
// ============================================================

import type {
  ActivityLog,
  ActivityDetails,
  ActivityType,
  TransportActivity,
  FoodActivity,
  EnergyActivity,
  ShoppingActivity,
  OtherActivity,
} from "@/lib/types";
import {
  TRANSPORT_FACTORS,
  FOOD_FACTORS,
  ENERGY_FACTORS,
  SHOPPING_FACTORS,
  ENERGY_FACTORS_BY_SOURCE,
} from "./emissionFactors";
import type { EnergySource } from "@/lib/types";

// ---- Core Calculation Functions ----

export function calculateTransportEmissions(activity: TransportActivity): number {
  const factor = TRANSPORT_FACTORS[activity.mode] ?? 0.12;
  const base = factor * activity.distanceKm;
  // If carpooling, divide by number of passengers
  const passengers = activity.passengers ?? 1;
  return base / Math.max(1, passengers);
}

export function calculateFoodEmissions(activity: FoodActivity): number {
  const factor = FOOD_FACTORS[activity.mealType] ?? FOOD_FACTORS.vegetarian;
  return factor * activity.servings;
}

export function calculateEnergyEmissions(activity: EnergyActivity): number {
  let factor: number;
  switch (activity.energyType) {
    case "electricity":
      // Default to average grid if not otherwise specified
      factor = ENERGY_FACTORS.electricity_average_grid;
      break;
    case "gas":
      factor = ENERGY_FACTORS.natural_gas;
      break;
    case "heating_oil":
      factor = ENERGY_FACTORS.heating_oil;
      break;
    default:
      factor = ENERGY_FACTORS.electricity_average_grid;
  }
  return factor * activity.amount;
}

export function calculateShoppingEmissions(activity: ShoppingActivity): number {
  const factor = SHOPPING_FACTORS[activity.category] ?? SHOPPING_FACTORS.other;
  return factor * activity.amountUSD;
}

export function calculateActivityEmissions(details: ActivityDetails): number {
  switch (details.type) {
    case "transport":
      return calculateTransportEmissions(details);
    case "food":
      return calculateFoodEmissions(details);
    case "energy":
      return calculateEnergyEmissions(details);
    case "shopping":
      return calculateShoppingEmissions(details);
    case "other":
      return details.co2Kg;
    default:
      return 0;
  }
}

// ---- Aggregation Functions ----

export function sumActivities(activities: ActivityLog[]): number {
  return activities.reduce((sum, a) => sum + a.co2Kg, 0);
}

export function sumByCategory(
  activities: ActivityLog[]
): Partial<Record<ActivityType, number>> {
  const result: Partial<Record<ActivityType, number>> = {};
  for (const activity of activities) {
    const cat = activity.activityType as ActivityType;
    result[cat] = (result[cat] ?? 0) + activity.co2Kg;
  }
  return result;
}

export function groupByDate(activities: ActivityLog[]): Record<string, ActivityLog[]> {
  const result: Record<string, ActivityLog[]> = {};
  for (const activity of activities) {
    const date = activity.timestamp.slice(0, 10); // YYYY-MM-DD
    if (!result[date]) result[date] = [];
    result[date].push(activity);
  }
  return result;
}

export function getWeekActivities(
  activities: ActivityLog[],
  weekStart: Date
): ActivityLog[] {
  const start = new Date(weekStart);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  return activities.filter((a) => {
    const d = new Date(a.timestamp);
    return d >= start && d < end;
  });
}

export function getMonthActivities(
  activities: ActivityLog[],
  year: number,
  month: number
): ActivityLog[] {
  return activities.filter((a) => {
    const d = new Date(a.timestamp);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

export function getLast7DaysStats(
  activities: ActivityLog[]
): { date: string; co2Kg: number }[] {
  const result: { date: string; co2Kg: number }[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayActivities = activities.filter(
      (a) => a.timestamp.slice(0, 10) === dateStr
    );
    result.push({
      date: dateStr,
      co2Kg: sumActivities(dayActivities),
    });
  }
  return result;
}

export function getLast4WeeksStats(
  activities: ActivityLog[]
): { week: string; co2Kg: number }[] {
  const result: { week: string; co2Kg: number }[] = [];
  const today = new Date();

  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() - i * 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weekActivities = activities.filter((a) => {
      const d = new Date(a.timestamp);
      return d >= weekStart && d < weekEnd;
    });

    const weekLabel = weekStart.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    result.push({
      week: weekLabel,
      co2Kg: sumActivities(weekActivities),
    });
  }
  return result;
}

// ---- Baseline calculation (monthly from profile) ----

export function estimateMonthlyBaselineKg(
  energySource: EnergySource,
  monthlyElectricityKwh: number,
  householdSize: number
): number {
  const factor = ENERGY_FACTORS_BY_SOURCE[energySource];
  return (factor * monthlyElectricityKwh) / householdSize;
}

// ---- ID Generation ----

export function generateActivityId(): string {
  return `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

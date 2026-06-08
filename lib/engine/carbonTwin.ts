// ============================================================
// CarbonPilot — Carbon Twin Calculator
// Generates a user's "Carbon Twin" profile on onboarding
// ============================================================

import type { UserProfile } from "@/lib/types";
import {
  TRANSPORT_FACTORS,
  FOOD_FACTORS,
  ENERGY_FACTORS_BY_SOURCE,
  CARBON_TWIN_BENCHMARKS,
  GLOBAL_BENCHMARKS,
} from "./emissionFactors";

export interface CarbonTwinProfile {
  annualKg: number;
  annualTons: number;

  // Comparisons (positive = user emits MORE than benchmark)
  vsIndiaAvgPercent: number;
  vsGlobalAvgPercent: number;
  vsParisTargetPercent: number;

  // Category breakdown (annual kg)
  transportAnnualKg: number;
  foodAnnualKg: number;
  energyAnnualKg: number;

  // Narrative
  twinDescription: string;
  comparisons: CarbonTwinComparison[];

  // Trees needed to offset
  treesNeeded: number;
}

export interface CarbonTwinComparison {
  label: string;
  benchmarkKg: number;
  userKg: number;
  differencePercent: number; // positive = user is higher
  isGood: boolean;           // true if user is BELOW benchmark
  emoji: string;
}

/**
 * Estimate annual transport emissions from profile
 * Assumes average Indian commute: 15 km/day, 240 working days + 100 leisure days
 */
function estimateTransportAnnualKg(profile: UserProfile): number {
  const factor = TRANSPORT_FACTORS[profile.primaryTransport];
  const commuteKmPerDay = 15; // Average Indian urban commute (one-way 7.5 km × 2)
  const workingDays = 240;
  const leisureDays = 52; // Weekend leisure ~10 km average
  const workKg = factor * commuteKmPerDay * workingDays;
  const leisureKg = factor * 10 * leisureDays;
  return workKg + leisureKg;
}

/**
 * Estimate annual food emissions from profile
 * 3 meals/day × 365 days
 */
function estimateFoodAnnualKg(profile: UserProfile): number {
  const mealsPerDay = 3;
  const daysPerYear = 365;

  switch (profile.dietType) {
    case "vegan":
      return FOOD_FACTORS.vegan * mealsPerDay * daysPerYear;
    case "vegetarian":
      return FOOD_FACTORS.vegetarian * mealsPerDay * daysPerYear;
    case "pescatarian":
      // Mix: 50% veg, 40% fish, 10% chicken
      return (
        (FOOD_FACTORS.vegetarian * 0.5 +
          FOOD_FACTORS.fish * 0.4 +
          FOOD_FACTORS.chicken * 0.1) *
        mealsPerDay *
        daysPerYear
      );
    case "omnivore":
      // India omnivore: 50% veg, 30% chicken, 15% fish, 5% red meat
      return (
        (FOOD_FACTORS.vegetarian * 0.5 +
          FOOD_FACTORS.chicken * 0.3 +
          FOOD_FACTORS.fish * 0.15 +
          FOOD_FACTORS.lamb * 0.05) *
        mealsPerDay *
        daysPerYear
      );
    case "heavy_meat":
      // 20% veg, 30% chicken, 30% lamb, 20% beef
      return (
        (FOOD_FACTORS.vegetarian * 0.2 +
          FOOD_FACTORS.chicken * 0.3 +
          FOOD_FACTORS.lamb * 0.3 +
          FOOD_FACTORS.beef * 0.2) *
        mealsPerDay *
        daysPerYear
      );
    default:
      return FOOD_FACTORS.vegetarian * mealsPerDay * daysPerYear;
  }
}

/**
 * Estimate annual energy emissions from profile
 */
function estimateEnergyAnnualKg(profile: UserProfile): number {
  const factor = ENERGY_FACTORS_BY_SOURCE[profile.energySource];
  const annualKwh = profile.monthlyElectricityKwh * 12;
  const perPersonKwh = annualKwh / Math.max(1, profile.householdSize);
  return factor * perPersonKwh;
}

export function generateCarbonTwin(profile: UserProfile): CarbonTwinProfile {
  const transportAnnualKg = estimateTransportAnnualKg(profile);
  const foodAnnualKg = estimateFoodAnnualKg(profile);
  const energyAnnualKg = estimateEnergyAnnualKg(profile);

  // Add ~200 kg for misc (shopping, services) — India average
  const miscAnnualKg = 200;

  const annualKg = transportAnnualKg + foodAnnualKg + energyAnnualKg + miscAnnualKg;
  const annualTons = annualKg / 1000;

  const vsIndiaAvg =
    ((annualKg - CARBON_TWIN_BENCHMARKS.india_average) /
      CARBON_TWIN_BENCHMARKS.india_average) *
    100;
  const vsGlobalAvg =
    ((annualKg - CARBON_TWIN_BENCHMARKS.global_average) /
      CARBON_TWIN_BENCHMARKS.global_average) *
    100;
  const vsParisTarget =
    ((annualKg - CARBON_TWIN_BENCHMARKS.paris_target) /
      CARBON_TWIN_BENCHMARKS.paris_target) *
    100;

  const comparisons: CarbonTwinComparison[] = [
    {
      label: "Average Indian",
      benchmarkKg: CARBON_TWIN_BENCHMARKS.india_average,
      userKg: annualKg,
      differencePercent: Math.round(Math.abs(vsIndiaAvg)),
      isGood: annualKg <= CARBON_TWIN_BENCHMARKS.india_average,
      emoji: annualKg <= CARBON_TWIN_BENCHMARKS.india_average ? "🟢" : "🔴",
    },
    {
      label: "Global Average",
      benchmarkKg: CARBON_TWIN_BENCHMARKS.global_average,
      userKg: annualKg,
      differencePercent: Math.round(Math.abs(vsGlobalAvg)),
      isGood: annualKg <= CARBON_TWIN_BENCHMARKS.global_average,
      emoji: annualKg <= CARBON_TWIN_BENCHMARKS.global_average ? "🟢" : "🔴",
    },
    {
      label: "Paris 2030 Target",
      benchmarkKg: CARBON_TWIN_BENCHMARKS.paris_target,
      userKg: annualKg,
      differencePercent: Math.round(Math.abs(vsParisTarget)),
      isGood: annualKg <= CARBON_TWIN_BENCHMARKS.paris_target,
      emoji: annualKg <= CARBON_TWIN_BENCHMARKS.paris_target ? "🟢" : "🔴",
    },
  ];

  // Generate narrative description
  let twinDescription: string;
  if (annualKg < CARBON_TWIN_BENCHMARKS.india_average) {
    twinDescription = `You're already living below the Indian average — you're ahead of most people. With a few tweaks, you could hit the Paris climate target.`;
  } else if (annualKg < CARBON_TWIN_BENCHMARKS.paris_target * 1.5) {
    twinDescription = `You're close to the Paris climate target. A few sustainable swaps could get you there within months.`;
  } else if (annualKg < CARBON_TWIN_BENCHMARKS.global_average) {
    twinDescription = `You're below the global average but above India's benchmark. Your biggest opportunity is in ${
      transportAnnualKg > foodAnnualKg ? "transport" : "food"
    }.`;
  } else {
    twinDescription = `Your footprint is above average, but that's why you're here. CarbonPilot will help you cut it significantly.`;
  }

  const treesNeeded = Math.round(annualKg / GLOBAL_BENCHMARKS.co2PerTreePerYear);

  return {
    annualKg: Math.round(annualKg),
    annualTons: Math.round(annualTons * 10) / 10,
    vsIndiaAvgPercent: Math.round(vsIndiaAvg),
    vsGlobalAvgPercent: Math.round(vsGlobalAvg),
    vsParisTargetPercent: Math.round(vsParisTarget),
    transportAnnualKg: Math.round(transportAnnualKg),
    foodAnnualKg: Math.round(foodAnnualKg),
    energyAnnualKg: Math.round(energyAnnualKg),
    twinDescription,
    comparisons,
    treesNeeded,
  };
}

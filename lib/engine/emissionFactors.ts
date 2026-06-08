// ============================================================
// CarbonPilot — Emission Factors (India-First)
//
// ASSUMPTIONS & SOURCES:
// Transport:
//   - Car (petrol/diesel): India-specific avg fuel consumption ~12 km/L petrol,
//     petrol 2.31 kg CO₂/L → 0.192 kg CO₂/km (IPCC AR6 + CMIE)
//   - Two-wheeler: ~50 km/L, 0.046 kg CO₂/km (MoPNG 2023)
//   - City bus (DTC/BEST): 0.082 kg CO₂/km/pax (CPCB 2022)
//   - Metro/Suburban rail: 0.031 kg CO₂/km/pax (DMRC Annual Report 2023)
//   - Auto-rickshaw (CNG): 0.082 kg CO₂/km (CPCB)
//   - E-rickshaw: 0.017 kg CO₂/km (based on India grid)
//
// Energy:
//   - India grid: 0.716 kg CO₂/kWh (CEA Grid Emission Factor 2023-24)
//   - Renewable (rooftop solar): 0.022 kg CO₂/kWh (lifecycle, MNRE)
//   - PNG (piped natural gas): 2.0 kg CO₂/m³ (MoPNG)
//   - LPG cylinder (14.2 kg): 2.983 kg CO₂/kg LPG → ~42.3 kg CO₂/cylinder (BEE)
//
// Food:
//   - Indian-context portions (300g serving)
//   - Beef rarely consumed; goat/lamb more common → using lamb factors
//   - Our World in Data + Indian Food Council estimates
//
// Global Benchmarks:
//   - India per capita: 1.9 t CO₂e/year (IEA 2023)
//   - Global avg: 4.8 t CO₂e/year (IEA 2023)
//   - Paris-aligned target: 2.0 t CO₂e/year by 2030
//   - India NDC target: 45% reduction in emissions intensity by 2030
// ============================================================

import type { TransportMode, EnergySource } from "@/lib/types";

// ---- Transport (kg CO₂e per km) ----
export const TRANSPORT_FACTORS: Record<TransportMode, number> = {
  car_petrol: 0.192,      // India avg petrol car — MoPNG/IPCC
  car_diesel: 0.171,      // India avg diesel car — DEFRA fallback
  car_electric: 0.040,    // EV on India grid (CEA 2023-24: 0.716 kWh/km avg)
  motorcycle: 0.046,      // Indian two-wheeler ~50km/L — MoPNG 2023
  bus: 0.082,             // City bus (DTC/BEST/KSRTC) — CPCB 2022
  train: 0.031,           // Metro + suburban rail — DMRC 2023
  cycling: 0.0,           // Zero direct emissions
  walking: 0.0,           // Zero direct emissions
  mixed: 0.110,           // Mixed — conservative urban India estimate
};

export const TRANSPORT_LABELS: Record<TransportMode, string> = {
  car_petrol: "Petrol Car",
  car_diesel: "Diesel Car",
  car_electric: "Electric Car",
  motorcycle: "Bike / Scooter",
  bus: "Bus / DTC / BEST",
  train: "Metro / Train",
  cycling: "Cycling",
  walking: "Walking",
  mixed: "Mixed Transport",
};

// ---- Food (kg CO₂e per serving, ~300g Indian portion) ----
export const FOOD_FACTORS = {
  beef: 6.61,          // Rarely consumed in India; used for tracking — OWiD
  lamb: 5.84,          // Mutton (common in India) — OWiD / Indian Food Council
  pork: 1.63,          // Pork — OWiD
  chicken: 1.26,       // Chicken (most common meat in India) — OWiD
  fish: 0.75,          // Freshwater fish (India-prevalent) — OWiD
  dairy: 0.80,         // Milk/paneer/curd (India avg lower methane intensity) — FAO 2023
  vegetarian: 0.45,    // Dal, sabzi, roti — India vegetarian meal — OWiD
  vegan: 0.30,         // Plant-based Indian meal — OWiD
} as const;

export type FoodType = keyof typeof FOOD_FACTORS;

// ---- Energy ----
export const ENERGY_FACTORS = {
  electricity_coal_grid: 0.820,    // Coal-heavy state grids (e.g., Jharkhand, Chhattisgarh) — CEA 2023
  electricity_average_grid: 0.716, // All-India grid emission factor — CEA 2023-24 (updated)
  electricity_renewable: 0.022,    // Rooftop solar lifecycle — MNRE/IEA
  electricity_solar_home: 0.022,   // Same as renewable (rooftop solar)
  natural_gas: 2.0,                // PNG (piped natural gas) — MoPNG 2023 (per m³)
  lpg_per_kg: 2.983,               // LPG — BEE India (per kg; 14.2kg cylinder = 42.3 kg CO₂)
  heating_oil: 2.670,              // Not common in India; DEFRA fallback
} as const;

export const ENERGY_FACTORS_BY_SOURCE: Record<EnergySource, number> = {
  coal_grid: ENERGY_FACTORS.electricity_coal_grid,
  average_grid: ENERGY_FACTORS.electricity_average_grid,
  renewable_grid: ENERGY_FACTORS.electricity_renewable,
  solar_home: ENERGY_FACTORS.electricity_solar_home,
};

// ---- Shopping (kg CO₂e per USD spent) ----
export const SHOPPING_FACTORS = {
  clothing: 0.025,
  electronics: 0.030,
  furniture: 0.015,
  groceries: 0.003,
  other: 0.010,
} as const;

// ---- Global & India Benchmarks ----
export const GLOBAL_BENCHMARKS = {
  // Annual per capita (kg CO₂e)
  globalAvgPerCapita: 4_800,      // IEA 2023 world average
  indiaAvgPerCapita: 1_900,       // IEA 2023 India average
  parisTargetPerCapita: 2_000,    // Paris Agreement 2030 compatible
  indiaNDCIntensityReduction: 0.45, // India's NDC: 45% emissions intensity reduction

  // Weekly (derived from annual / 52)
  globalAvgWeeklyKg: 92.3,        // 4800 / 52
  indiaAvgWeeklyKg: 36.5,         // 1900 / 52
  parisTargetWeeklyKg: 38.5,      // 2000 / 52

  // Trees
  co2PerTreePerYear: 22,           // kg CO₂ absorbed per mature tree/year — EPA
};

// ---- Carbon Twin Benchmarks (annual kg CO₂e) ----
export const CARBON_TWIN_BENCHMARKS = {
  india_average: 1_900,
  global_average: 4_800,
  paris_target: 2_000,
  india_high_income: 4_200,      // India top quintile — CEEW 2023
  india_low_income: 750,         // India bottom quintile — CEEW 2023
  zero_carbon: 0,
};

// ---- Scoring Thresholds (weekly kg CO₂e) ----
// Calibrated to India context (India avg = 36.5 kg/week)
export const SCORE_THRESHOLDS = {
  champion: 15,   // < 15 kg/week → Score 90-100 (below India low-income)
  green: 30,      // < 30 kg/week → Score 70-90 (below India average)
  average: 55,    // < 55 kg/week → Score 45-70 (around India average)
  high: 90,       // < 90 kg/week → Score 20-45 (above India avg)
  // ≥ 90 kg/week → Score 0-20 (critical — above global average)
} as const;

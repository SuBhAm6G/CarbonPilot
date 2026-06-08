import { describe, it, expect } from "vitest";
import {
  calculateTransportEmissions,
  calculateFoodEmissions,
  calculateEnergyEmissions,
  calculateShoppingEmissions,
  calculateActivityEmissions,
  sumActivities,
  getLast7DaysStats,
} from "../lib/engine/carbonCalculator";
import type { TransportActivity, FoodActivity, EnergyActivity, ShoppingActivity, ActivityLog } from "../lib/types";

describe("calculateTransportEmissions", () => {
  it("calculates petrol car emissions correctly", () => {
    const activity: TransportActivity = { type: "transport", mode: "car_petrol", distanceKm: 10 };
    const result = calculateTransportEmissions(activity);
    expect(result).toBeCloseTo(1.92); // 0.192 * 10
  });

  it("returns 0 for cycling", () => {
    const activity: TransportActivity = { type: "transport", mode: "cycling", distanceKm: 15 };
    expect(calculateTransportEmissions(activity)).toBe(0);
  });

  it("returns 0 for walking", () => {
    const activity: TransportActivity = { type: "transport", mode: "walking", distanceKm: 2 };
    expect(calculateTransportEmissions(activity)).toBe(0);
  });

  it("halves emissions with 2 passengers (carpooling)", () => {
    const solo: TransportActivity = { type: "transport", mode: "car_petrol", distanceKm: 20 };
    const shared: TransportActivity = { type: "transport", mode: "car_petrol", distanceKm: 20, passengers: 2 };
    expect(calculateTransportEmissions(shared)).toBeCloseTo(calculateTransportEmissions(solo) / 2);
  });

  it("train emits less than petrol car for same distance", () => {
    const car: TransportActivity = { type: "transport", mode: "car_petrol", distanceKm: 50 };
    const train: TransportActivity = { type: "transport", mode: "train", distanceKm: 50 };
    expect(calculateTransportEmissions(train)).toBeLessThan(calculateTransportEmissions(car));
  });

  it("electric car emits less than petrol car", () => {
    const petrol: TransportActivity = { type: "transport", mode: "car_petrol", distanceKm: 100 };
    const electric: TransportActivity = { type: "transport", mode: "car_electric", distanceKm: 100 };
    expect(calculateTransportEmissions(electric)).toBeLessThan(calculateTransportEmissions(petrol));
  });

  it("metro emissions are within expected range", () => {
    const activity: TransportActivity = { type: "transport", mode: "train", distanceKm: 10 };
    const result = calculateTransportEmissions(activity);
    expect(result).toBeCloseTo(0.31); // 0.031 * 10
  });
});

describe("calculateFoodEmissions", () => {
  it("mutton is more carbon intensive than chicken", () => {
    const mutton: FoodActivity = { type: "food", mealType: "mutton", servings: 1 };
    const chicken: FoodActivity = { type: "food", mealType: "chicken", servings: 1 };
    expect(calculateFoodEmissions(mutton)).toBeGreaterThan(calculateFoodEmissions(chicken));
  });

  it("vegan is less than vegetarian", () => {
    const veg: FoodActivity = { type: "food", mealType: "vegetarian", servings: 1 };
    const vegan: FoodActivity = { type: "food", mealType: "vegan", servings: 1 };
    expect(calculateFoodEmissions(vegan)).toBeLessThan(calculateFoodEmissions(veg));
  });

  it("scales linearly with servings", () => {
    const one: FoodActivity = { type: "food", mealType: "chicken", servings: 1 };
    const three: FoodActivity = { type: "food", mealType: "chicken", servings: 3 };
    expect(calculateFoodEmissions(three)).toBeCloseTo(calculateFoodEmissions(one) * 3);
  });

  it("mutton meal is approximately 6.61 kg CO2", () => {
    const mutton: FoodActivity = { type: "food", mealType: "mutton", servings: 1 };
    expect(calculateFoodEmissions(mutton)).toBeCloseTo(6.61);
  });

  it("vegetarian meal is approximately 0.45 kg CO2", () => {
    const veg: FoodActivity = { type: "food", mealType: "vegetarian", servings: 1 };
    expect(calculateFoodEmissions(veg)).toBeCloseTo(0.45);
  });
});

describe("calculateEnergyEmissions", () => {
  it("calculates electricity emissions correctly (India grid)", () => {
    const activity: EnergyActivity = { type: "energy", energyType: "electricity", amount: 10 };
    const result = calculateEnergyEmissions(activity);
    expect(result).toBeCloseTo(7.16); // 0.716 * 10
  });

  it("gas emissions are higher per unit than electricity", () => {
    const gas: EnergyActivity = { type: "energy", energyType: "gas", amount: 1 };
    const elec: EnergyActivity = { type: "energy", energyType: "electricity", amount: 1 };
    expect(calculateEnergyEmissions(gas)).toBeGreaterThan(calculateEnergyEmissions(elec));
  });
});

describe("calculateShoppingEmissions", () => {
  it("electronics have higher factor than groceries", () => {
    const electronics: ShoppingActivity = { type: "shopping", category: "electronics", amountUSD: 100 };
    const groceries: ShoppingActivity = { type: "shopping", category: "groceries", amountUSD: 100 };
    expect(calculateShoppingEmissions(electronics)).toBeGreaterThan(calculateShoppingEmissions(groceries));
  });
});

describe("calculateActivityEmissions (dispatch)", () => {
  it("dispatches transport correctly", () => {
    const details: TransportActivity = { type: "transport", mode: "car_petrol", distanceKm: 10 };
    expect(calculateActivityEmissions(details)).toBeCloseTo(1.92);
  });

  it("calculates total emissions correctly with mutton", () => {
    const details: FoodActivity = { type: "food", mealType: "mutton", servings: 1 };
    expect(calculateActivityEmissions(details)).toBeCloseTo(6.61);
  });
});

describe("sumActivities", () => {
  it("sums co2Kg across all activities", () => {
    const activities: ActivityLog[] = [
      { id: "1", timestamp: new Date().toISOString(), activityType: "transport", details: { type: "transport", mode: "car_petrol", distanceKm: 10 }, co2Kg: 1.92 },
      { id: "2", timestamp: new Date().toISOString(), activityType: "food", details: { type: "food", mealType: "mutton", servings: 1 }, co2Kg: 6.61 },
    ];
    expect(sumActivities(activities)).toBeCloseTo(8.53);
  });

  it("returns 0 for empty array", () => {
    expect(sumActivities([])).toBe(0);
  });
});

describe("getLast7DaysStats", () => {
  it("returns exactly 7 entries", () => {
    const result = getLast7DaysStats([]);
    expect(result).toHaveLength(7);
  });

  it("all entries have co2Kg of 0 when no activities", () => {
    const result = getLast7DaysStats([]);
    expect(result.every((d) => d.co2Kg === 0)).toBe(true);
  });

  it("includes today's activities", () => {
    const todayActivity: ActivityLog = {
      id: "t1",
      timestamp: new Date().toISOString(),
      activityType: "transport",
      details: { type: "transport", mode: "car_petrol", distanceKm: 10 },
      co2Kg: 1.92,
    };
    const result = getLast7DaysStats([todayActivity]);
    const todayEntry = result[result.length - 1];
    expect(todayEntry.co2Kg).toBeCloseTo(1.92);
  });
});

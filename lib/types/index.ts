// ============================================================
// CarbonPilot — Shared TypeScript Types
// ============================================================

// ----- User Profile -----

export type TransportMode =
  | "car_petrol"
  | "car_diesel"
  | "car_electric"
  | "motorcycle"
  | "bus"
  | "train"
  | "cycling"
  | "walking"
  | "mixed";

export type DietType =
  | "vegan"
  | "vegetarian"
  | "pescatarian"
  | "omnivore"
  | "heavy_meat";

export type EnergySource =
  | "coal_grid"
  | "average_grid"
  | "renewable_grid"
  | "solar_home";

export type SustainabilityGoal =
  | "reduce_transport"
  | "reduce_food"
  | "reduce_energy"
  | "overall_reduction"
  | "carbon_neutral";

export interface UserProfile {
  name: string;
  primaryTransport: TransportMode;
  dietType: DietType;
  householdSize: number;
  energySource: EnergySource;
  sustainabilityGoal: SustainabilityGoal;
  monthlyElectricityKwh: number;
  createdAt: string; // ISO date string
}

// ----- Activity Logging -----

export type ActivityType = "transport" | "food" | "energy" | "shopping" | "other";

export interface TransportActivity {
  type: "transport";
  mode: TransportMode;
  distanceKm: number;
  passengers?: number; // for carpooling
}

export interface FoodActivity {
  type: "food";
  mealType: "beef" | "lamb" | "pork" | "chicken" | "fish" | "vegetarian" | "vegan" | "dairy";
  servings: number;
}

export interface EnergyActivity {
  type: "energy";
  energyType: "electricity" | "gas" | "heating_oil";
  amount: number; // kWh or m3
}

export interface ShoppingActivity {
  type: "shopping";
  category: "clothing" | "electronics" | "furniture" | "groceries" | "other";
  amountUSD: number;
}

export interface OtherActivity {
  type: "other";
  description: string;
  co2Kg: number;
}

export type ActivityDetails =
  | TransportActivity
  | FoodActivity
  | EnergyActivity
  | ShoppingActivity
  | OtherActivity;

export interface ActivityLog {
  id: string;
  timestamp: string; // ISO date string
  activityType: ActivityType;
  details: ActivityDetails;
  co2Kg: number; // calculated by engine
  aiSummary?: string; // human-readable from AI
}

// ----- Carbon Stats -----

export interface DailyStats {
  date: string; // YYYY-MM-DD
  totalCo2Kg: number;
  activities: ActivityLog[];
}

export interface WeeklyStats {
  weekStart: string; // YYYY-MM-DD (Monday)
  totalCo2Kg: number;
  byCategory: Record<ActivityType, number>;
  days: DailyStats[];
}

export interface MonthlyStats {
  month: string; // YYYY-MM
  totalCo2Kg: number;
  byCategory: Record<ActivityType, number>;
  avgDailyKg: number;
}

// ----- Score & Gamification -----

export type ScoreLevel = "champion" | "green" | "average" | "high" | "critical";

export interface CarbonScore {
  score: number; // 0-100, higher = greener
  level: ScoreLevel;
  label: string;
  weeklyKg: number;
  monthlyKg: number;
  globalAvgWeeklyKg: number; // ~175 kg/week
  percentileBetter: number; // % of people with higher emissions
}

export interface Streak {
  currentDays: number;
  longestDays: number;
  lastActivityDate: string;
}

export type BadgeId =
  | "first_log"
  | "week_streak"
  | "month_streak"
  | "green_transport"
  | "plant_based"
  | "carbon_reducer"
  | "challenge_complete"
  | "below_average"
  | "carbon_champion";

export interface Badge {
  id: BadgeId;
  name: string;
  description: string;
  icon: string; // emoji
  unlockedAt?: string; // ISO date
  unlocked: boolean;
}

// ----- Recommendations -----

export interface Recommendation {
  id: string;
  category: ActivityType;
  title: string;
  description: string;
  estimatedCo2SavedKgPerWeek: number;
  difficulty: "easy" | "medium" | "hard";
  actionLabel: string;
}

// ----- What-If Simulator -----

export type SimulatorScenario =
  | "switch_to_metro"
  | "switch_to_cycling"
  | "switch_to_ev"
  | "become_vegetarian"
  | "become_vegan"
  | "reduce_beef"
  | "work_from_home_2days"
  | "renewable_energy"
  | "reduce_flights";

export interface SimulatorInput {
  scenario: SimulatorScenario;
  currentProfile: UserProfile;
  currentWeeklyActivities: ActivityLog[];
}

export interface SimulatorResult {
  scenario: SimulatorScenario;
  scenarioLabel: string;
  currentWeeklyCo2Kg: number;
  projectedWeeklyCo2Kg: number;
  weeklySavingsKg: number;
  monthlySavingsKg: number;
  yearlySavingsKg: number;
  description: string;
  treeEquivalent: number; // trees planted equivalent per year
}

// ----- AI Chat -----

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  activityLogged?: ActivityLog; // if AI extracted an activity
}

// ----- AI Tool Call (server-side parsing) -----

export interface LogActivityToolCall {
  activityType: ActivityType;
  details: ActivityDetails;
  userMessage: string; // AI's response text to show user
}

// ----- Challenges -----

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  targetCo2ReductionKg: number;
  daysCompleted: number;
  totalDays: number;
  completed: boolean;
  startDate: string;
}

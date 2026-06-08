// ============================================================
// CarbonPilot — Zustand Store
// Persisted state management with localStorage
// ============================================================

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UserProfile, ActivityLog, Badge, WeeklyChallenge } from "@/lib/types";
import type { ActivityDetails } from "@/lib/types";
import type { CarbonTwinProfile } from "@/lib/engine/carbonTwin";
import { generateActivityId, calculateActivityEmissions } from "@/lib/engine/carbonCalculator";
import { ALL_BADGES, checkBadges, generateWeeklyChallenge } from "@/lib/engine/recommendationEngine";
import { calculateStreak } from "@/lib/engine/scoreCalculator";
import { generateCarbonTwin } from "@/lib/engine/carbonTwin";

interface CarbonState {
  profile: UserProfile | null;
  isOnboarded: boolean;
  carbonTwin: CarbonTwinProfile | null;

  activities: ActivityLog[];

  badges: Badge[];
  weeklyChallenge: WeeklyChallenge | null;

  completeOnboarding: (profile: UserProfile) => void;
  logActivity: (details: ActivityDetails, aiSummary?: string) => ActivityLog;
  removeActivity: (id: string) => void;
  resetProfile: () => void;
}

type DemoActivityTemplate = {
  details: ActivityDetails;
  aiSummary: string;
};

const DEMO_ACTIVITY_TEMPLATES: DemoActivityTemplate[] = [
  { details: { type: "transport", mode: "car_petrol", distanceKm: 14 }, aiSummary: "Demo: petrol car commute across town." },
  { details: { type: "food", mealType: "chicken", servings: 1 }, aiSummary: "Demo: chicken meal logged." },
  { details: { type: "energy", energyType: "electricity", amount: 6 }, aiSummary: "Demo: evening electricity use." },
  { details: { type: "transport", mode: "train", distanceKm: 18 }, aiSummary: "Demo: metro ride for errands." },
  { details: { type: "food", mealType: "vegetarian", servings: 1 }, aiSummary: "Demo: vegetarian lunch." },
  { details: { type: "shopping", category: "groceries", amountUSD: 35 }, aiSummary: "Demo: grocery shopping." },
  { details: { type: "transport", mode: "motorcycle", distanceKm: 9 }, aiSummary: "Demo: short scooter trip." },
  { details: { type: "energy", energyType: "electricity", amount: 7 }, aiSummary: "Demo: AC and appliance use." },
  { details: { type: "food", mealType: "dairy", servings: 1 }, aiSummary: "Demo: dairy snack." },
  { details: { type: "transport", mode: "bus", distanceKm: 12 }, aiSummary: "Demo: city bus ride." },
  { details: { type: "shopping", category: "clothing", amountUSD: 60 }, aiSummary: "Demo: clothing purchase." },
  { details: { type: "food", mealType: "fish", servings: 1 }, aiSummary: "Demo: fish meal." },
  { details: { type: "transport", mode: "car_diesel", distanceKm: 16 }, aiSummary: "Demo: diesel cab ride." },
  { details: { type: "energy", energyType: "electricity", amount: 5 }, aiSummary: "Demo: household electricity." },
  { details: { type: "food", mealType: "vegan", servings: 1 }, aiSummary: "Demo: plant-based meal." },
  { details: { type: "transport", mode: "car_petrol", distanceKm: 10 }, aiSummary: "Demo: petrol car trip." },
  { details: { type: "shopping", category: "electronics", amountUSD: 80 }, aiSummary: "Demo: small electronics purchase." },
  { details: { type: "food", mealType: "lamb", servings: 1 }, aiSummary: "Demo: mutton meal." },
  { details: { type: "transport", mode: "train", distanceKm: 22 }, aiSummary: "Demo: longer metro ride." },
  { details: { type: "energy", energyType: "electricity", amount: 8 }, aiSummary: "Demo: high electricity day." },
  { details: { type: "food", mealType: "vegetarian", servings: 1 }, aiSummary: "Demo: home-cooked vegetarian dinner." },
  { details: { type: "transport", mode: "mixed", distanceKm: 13 }, aiSummary: "Demo: mixed commute." },
  { details: { type: "shopping", category: "other", amountUSD: 45 }, aiSummary: "Demo: miscellaneous purchase." },
  { details: { type: "energy", energyType: "electricity", amount: 4 }, aiSummary: "Demo: light electricity use." },
  { details: { type: "transport", mode: "cycling", distanceKm: 5 }, aiSummary: "Demo: zero-emission cycling trip." },
];

function createDemoActivities(now = new Date()): ActivityLog[] {
  const daysInCurrentWeek = now.getDay() + 1;

  return DEMO_ACTIVITY_TEMPLATES.map((template, index) => {
    const timestamp = new Date(now);
    timestamp.setDate(now.getDate() - (index % daysInCurrentWeek));
    timestamp.setHours(20 - (index % 10), (index * 7) % 60, 0, 0);

    return {
      id: `demo_${timestamp.getTime()}_${index}`,
      timestamp: timestamp.toISOString(),
      activityType: template.details.type,
      details: template.details,
      co2Kg: calculateActivityEmissions(template.details),
      aiSummary: template.aiSummary,
    };
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function getWeeklyKg(activities: ActivityLog[]): number {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  return activities
    .filter((activity) => new Date(activity.timestamp) >= weekStart)
    .reduce((total, activity) => total + activity.co2Kg, 0);
}

function getBadgesForActivities(activities: ActivityLog[], badges: Badge[]): Badge[] {
  const allDates = activities.map((activity) => activity.timestamp);
  const { current: currentStreak } = calculateStreak(allDates);
  return checkBadges(activities, currentStreak, getWeeklyKg(activities), null, badges);
}

function needsDemoActivities(state: Partial<CarbonState>): boolean {
  const activities = state.activities ?? [];
  return (
    state.isOnboarded === true &&
    activities.length < DEMO_ACTIVITY_TEMPLATES.length &&
    !activities.some((activity) => activity.id.startsWith("demo_"))
  );
}

export const useCarbonStore = create<CarbonState>()(
  persist(
    (set) => ({
      profile: null,
      isOnboarded: false,
      carbonTwin: null,
      activities: [],
      badges: ALL_BADGES,
      weeklyChallenge: null,

      completeOnboarding: (profile: UserProfile) => {
        const carbonTwin = generateCarbonTwin(profile);
        const activities = createDemoActivities();
        set({
          profile,
          isOnboarded: true,
          carbonTwin,
          activities,
          badges: getBadgesForActivities(activities, ALL_BADGES),
          weeklyChallenge: generateWeeklyChallenge(),
        });
      },

      logActivity: (details: ActivityDetails, aiSummary?: string): ActivityLog => {
        const co2Kg = calculateActivityEmissions(details);
        const activity: ActivityLog = {
          id: generateActivityId(),
          timestamp: new Date().toISOString(),
          activityType: details.type,
          details,
          co2Kg,
          aiSummary,
        };

        const returnedActivity = activity;

        set((state) => {
          const newActivities = [activity, ...state.activities];
          const allDates = newActivities.map((a) => a.timestamp);
          const { current: currentStreak } = calculateStreak(allDates);

          const now = new Date();
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          weekStart.setHours(0, 0, 0, 0);
          const weekActivities = newActivities.filter((a) => new Date(a.timestamp) >= weekStart);
          const weeklyKg = weekActivities.reduce((s, a) => s + a.co2Kg, 0);

          const prevWeekStart = new Date(weekStart);
          prevWeekStart.setDate(prevWeekStart.getDate() - 7);
          const prevWeekActivities = newActivities.filter((a) => {
            const d = new Date(a.timestamp);
            return d >= prevWeekStart && d < weekStart;
          });
          const prevWeeklyKg = prevWeekActivities.length > 0
            ? prevWeekActivities.reduce((s, a) => s + a.co2Kg, 0)
            : null;

          const updatedBadges = checkBadges(
            newActivities, currentStreak, weeklyKg, prevWeeklyKg, state.badges
          );

          return { activities: newActivities, badges: updatedBadges };
        });

        return returnedActivity;
      },

      removeActivity: (id: string) => {
        set((state) => ({ activities: state.activities.filter((a) => a.id !== id) }));
      },

      resetProfile: () => {
        set({
          profile: null, isOnboarded: false, carbonTwin: null,
          activities: [], badges: ALL_BADGES, weeklyChallenge: null,
        });
      },
    }),
    {
      name: "carbonpilot-storage",
      version: 1,
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : ({} as Storage)
      ),
      migrate: (persistedState) => {
        const state = persistedState as Partial<CarbonState>;
        if (needsDemoActivities(state)) {
          const activities = [...createDemoActivities(), ...(state.activities ?? [])];
          return {
            ...state,
            activities,
            badges: getBadgesForActivities(activities, state.badges ?? ALL_BADGES),
          };
        }

        return state;
      },
    }
  )
);

export const selectProfile = (s: CarbonState) => s.profile;
export const selectActivities = (s: CarbonState) => s.activities;
export const selectIsOnboarded = (s: CarbonState) => s.isOnboarded;
export const selectCarbonTwin = (s: CarbonState) => s.carbonTwin;

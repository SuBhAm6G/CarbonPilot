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
        set({
          profile,
          isOnboarded: true,
          carbonTwin,
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

        let returnedActivity = activity;

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
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : ({} as Storage)
      ),
    }
  )
);

export const selectProfile = (s: CarbonState) => s.profile;
export const selectActivities = (s: CarbonState) => s.activities;
export const selectIsOnboarded = (s: CarbonState) => s.isOnboarded;
export const selectCarbonTwin = (s: CarbonState) => s.carbonTwin;

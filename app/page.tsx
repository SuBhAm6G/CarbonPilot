"use client";

import { useEffect, useState } from "react";
import { useCarbonStore } from "@/lib/store/carbonStore";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import AppShell from "@/components/layout/AppShell";

export default function Home() {
  const isOnboarded = useCarbonStore((s) => s.isOnboarded);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center animate-pulse">
            <span className="text-2xl">🌿</span>
          </div>
          <p className="text-muted-foreground text-sm">Loading CarbonPilot...</p>
        </div>
      </div>
    );
  }

  if (!isOnboarded) {
    return <OnboardingWizard />;
  }

  return <AppShell />;
}

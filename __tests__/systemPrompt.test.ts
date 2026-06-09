import { describe, it, expect } from "vitest";
import { buildSystemPrompt } from "../lib/ai/systemPrompt";
import type { UserProfile } from "../lib/types";

describe("buildSystemPrompt", () => {
  const mockProfile: UserProfile = {
    name: "Arjun",
    primaryTransport: "car_petrol",
    dietType: "omnivore",
    householdSize: 4,
    energySource: "average_grid",
    sustainabilityGoal: "reduce_transport",
    monthlyElectricityKwh: 200,
    createdAt: new Date().toISOString(),
  };

  it("includes general system instructions without profile", () => {
    const prompt = buildSystemPrompt(null);
    expect(prompt).toContain("You are CarbonPilot");
    expect(prompt).toContain("ALWAYS respond with a valid JSON object");
    expect(prompt).not.toContain("Arjun");
  });

  it("injects user profile context when provided", () => {
    const prompt = buildSystemPrompt(mockProfile);
    expect(prompt).toContain("- Name: Arjun");
    expect(prompt).toContain("- Primary transport: Petrol Car");
    expect(prompt).toContain("- Diet: omnivore");
    expect(prompt).toContain("- Sustainability goal: reduce transport");
  });

  it("provides personalized transport insights", () => {
    const profile = { ...mockProfile, primaryTransport: "car_petrol" as const };
    const prompt = buildSystemPrompt(profile);
    expect(prompt).toContain("Petrol Car");
  });
});

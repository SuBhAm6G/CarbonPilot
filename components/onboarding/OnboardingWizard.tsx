"use client";

import { useState } from "react";
import { useCarbonStore } from "@/lib/store/carbonStore";
import type { UserProfile, TransportMode, DietType, EnergySource, SustainabilityGoal } from "@/lib/types";

const STEPS = ["Welcome", "Transport", "Diet", "Household", "Energy", "Goal"];

const TRANSPORT_OPTIONS: { value: TransportMode; label: string; emoji: string; desc: string }[] = [
  { value: "car_petrol", label: "Petrol Car", emoji: "🚗", desc: "Daily driver" },
  { value: "car_diesel", label: "Diesel Car", emoji: "🚙", desc: "SUV / diesel" },
  { value: "car_electric", label: "Electric Car", emoji: "⚡", desc: "Zero-emission" },
  { value: "motorcycle", label: "Bike / Scooter", emoji: "🏍️", desc: "Two-wheeler" },
  { value: "bus", label: "Bus / DTC", emoji: "🚌", desc: "City bus" },
  { value: "train", label: "Metro / Train", emoji: "🚇", desc: "Rail commute" },
  { value: "cycling", label: "Cycling", emoji: "🚲", desc: "Pedal power" },
  { value: "walking", label: "Walking", emoji: "🚶", desc: "Car-free" },
];

const DIET_OPTIONS: { value: DietType; label: string; emoji: string; desc: string }[] = [
  { value: "vegan", label: "Vegan", emoji: "🌱", desc: "No animal products" },
  { value: "vegetarian", label: "Vegetarian", emoji: "🥗", desc: "No meat" },
  { value: "pescatarian", label: "Pescatarian", emoji: "🐟", desc: "Fish + veg" },
  { value: "omnivore", label: "Omnivore", emoji: "🍗", desc: "Balanced diet" },
  { value: "heavy_meat", label: "Meat Lover", emoji: "🥩", desc: "Daily meat" },
];

const ENERGY_OPTIONS: { value: EnergySource; label: string; emoji: string; desc: string }[] = [
  { value: "solar_home", label: "Rooftop Solar", emoji: "☀️", desc: "Self-generated" },
  { value: "renewable_grid", label: "Green Plan", emoji: "💚", desc: "Renewable grid" },
  { value: "average_grid", label: "Standard Grid", emoji: "🔌", desc: "India average" },
  { value: "coal_grid", label: "Coal-heavy", emoji: "⚫", desc: "High emissions" },
];

const GOAL_OPTIONS: { value: SustainabilityGoal; label: string; emoji: string; desc: string }[] = [
  { value: "reduce_transport", label: "Greener Commute", emoji: "🚆", desc: "Cut travel emissions" },
  { value: "reduce_food", label: "Sustainable Diet", emoji: "🥦", desc: "Eat for the planet" },
  { value: "reduce_energy", label: "Energy Savings", emoji: "💡", desc: "Use less power" },
  { value: "overall_reduction", label: "Overall Reduction", emoji: "📉", desc: "Cut footprint 20%" },
  { value: "carbon_neutral", label: "Carbon Neutral", emoji: "🌍", desc: "Net zero goal" },
];

interface FormData {
  name: string;
  primaryTransport: TransportMode;
  dietType: DietType;
  householdSize: number;
  energySource: EnergySource;
  sustainabilityGoal: SustainabilityGoal;
  monthlyElectricityKwh: number;
}

const DEFAULT_FORM: FormData = {
  name: "",
  primaryTransport: "car_petrol",
  dietType: "omnivore",
  householdSize: 3,
  energySource: "average_grid",
  sustainabilityGoal: "overall_reduction",
  monthlyElectricityKwh: 150,
};

function OptionCard({ selected, onClick, emoji, label, desc }: {
  selected: boolean; onClick: () => void; emoji: string; label: string; desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-2 p-4 rounded-xl text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
        selected
          ? "border-2 border-emerald-500 bg-emerald-950/60 shadow-lg"
          : "border border-slate-700 hover:border-slate-600 bg-slate-800/50 hover:bg-slate-800/80"
      }`}
      aria-pressed={selected}
    >
      {selected && (
        <span className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </span>
      )}
      <span className="text-2xl">{emoji}</span>
      <div>
        <p className={`text-sm font-semibold ${selected ? "text-emerald-400" : "text-slate-200"}`}>{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
      </div>
    </button>
  );
}

export default function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const completeOnboarding = useCarbonStore((s) => s.completeOnboarding);

  const isLastStep = step === STEPS.length - 1;
  const progress = (step / (STEPS.length - 1)) * 100;

  function handleNext() {
    if (isLastStep) {
      completeOnboarding({ ...form, createdAt: new Date().toISOString() } as UserProfile);
    } else {
      setStep((s) => s + 1);
    }
  }

  const canProceed = step === 0 ? form.name.trim().length > 0 : true;

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "hsl(222, 47%, 6%)" }}>
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)" }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(20,184,166,0.06) 0%, transparent 70%)" }} />
      </div>

      <div className="w-full max-w-lg relative">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(16,185,129,0.15)" }}>
            <span className="text-xl">🌿</span>
          </div>
          <span className="text-xl font-bold gradient-text">CarbonPilot</span>
        </div>

        {/* Progress */}
        {step > 0 && (
          <div className="mb-6">
            <div className="flex justify-between text-xs text-slate-500 mb-2">
              <span>Step {step} of {STEPS.length - 1}</span>
              <span>{STEPS[step]}</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Card */}
        <div className="glass-card p-6 md:p-8">
          {step === 0 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-slate-100">Welcome to CarbonPilot</h1>
                <p className="text-slate-400">Your AI copilot for a greener lifestyle. Create your carbon profile in under 2 minutes.</p>
              </div>
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-slate-300">Your name</label>
                <input
                  id="name" type="text" placeholder="e.g. Arjun"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && canProceed && handleNext()}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-100 placeholder:text-slate-600 transition-all"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-3 gap-3 pt-2">
                {["🤖 AI-Powered", "📊 Real Insights", "🇮🇳 India-Focused"].map((item) => (
                  <div key={item} className="text-center p-3 rounded-lg bg-slate-800/50 text-xs text-slate-500">{item}</div>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-100">Primary Transport</h2>
                <p className="text-sm text-slate-400 mt-1">How do you usually get around?</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {TRANSPORT_OPTIONS.map((opt) => (
                  <OptionCard key={opt.value} selected={form.primaryTransport === opt.value}
                    onClick={() => setForm((f) => ({ ...f, primaryTransport: opt.value }))} {...opt} />
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-100">Your Diet</h2>
                <p className="text-sm text-slate-400 mt-1">Food accounts for ~25% of global emissions</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {DIET_OPTIONS.map((opt) => (
                  <OptionCard key={opt.value} selected={form.dietType === opt.value}
                    onClick={() => setForm((f) => ({ ...f, dietType: opt.value }))} {...opt} />
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-100">Household</h2>
                <p className="text-sm text-slate-400 mt-1">We share energy costs across household members</p>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-3 block">
                    Household size: <span className="text-emerald-400 font-bold">{form.householdSize} {form.householdSize === 1 ? "person" : "people"}</span>
                  </label>
                  <input type="range" min={1} max={10} value={form.householdSize}
                    onChange={(e) => setForm((f) => ({ ...f, householdSize: Number(e.target.value) }))}
                    className="w-full accent-emerald-500" aria-label="Household size" />
                  <div className="flex justify-between text-xs text-slate-500 mt-1"><span>1</span><span>5</span><span>10</span></div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-3 block">
                    Monthly electricity: <span className="text-emerald-400 font-bold">{form.monthlyElectricityKwh} kWh</span>
                  </label>
                  <input type="range" min={50} max={1000} step={25} value={form.monthlyElectricityKwh}
                    onChange={(e) => setForm((f) => ({ ...f, monthlyElectricityKwh: Number(e.target.value) }))}
                    className="w-full accent-emerald-500" aria-label="Monthly electricity in kWh" />
                  <div className="flex justify-between text-xs text-slate-500 mt-1"><span>50 kWh</span><span>500</span><span>1000 kWh</span></div>
                </div>
                <p className="text-xs text-slate-500 bg-slate-800/50 px-3 py-2 rounded-lg">
                  💡 Avg Indian household uses 100–200 kWh/month (BEE 2023)
                </p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-100">Energy Source</h2>
                <p className="text-sm text-slate-400 mt-1">What powers your home?</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {ENERGY_OPTIONS.map((opt) => (
                  <OptionCard key={opt.value} selected={form.energySource === opt.value}
                    onClick={() => setForm((f) => ({ ...f, energySource: opt.value }))} {...opt} />
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-100">Your Goal</h2>
                <p className="text-sm text-slate-400 mt-1">What's your primary sustainability focus?</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {GOAL_OPTIONS.map((opt) => (
                  <OptionCard key={opt.value} selected={form.sustainabilityGoal === opt.value}
                    onClick={() => setForm((f) => ({ ...f, sustainabilityGoal: opt.value }))} {...opt} />
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-700/50">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="px-4 py-2 text-sm text-slate-500 hover:text-slate-300 disabled:opacity-0 disabled:pointer-events-none transition-colors focus:outline-none"
            >
              ← Back
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 text-sm"
            >
              {isLastStep ? "✨ Create My Profile" : "Continue →"}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-4">
          Your data is stored locally on your device. Never sent anywhere.
        </p>
      </div>
    </div>
  );
}

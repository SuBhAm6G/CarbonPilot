"use client";

import { useState } from "react";
import { useCarbonStore } from "@/lib/store/carbonStore";
import type { ActivityType, TransportMode, ActivityDetails } from "@/lib/types";

const CATEGORIES = [
  { id: "transport" as ActivityType, label: "Transport", emoji: "🚗" },
  { id: "food" as ActivityType, label: "Food", emoji: "🍽️" },
  { id: "energy" as ActivityType, label: "Energy", emoji: "⚡" },
  { id: "shopping" as ActivityType, label: "Shopping", emoji: "🛍️" },
];

const TRANSPORT_OPTIONS: { id: TransportMode; label: string; emoji: string }[] = [
  { id: "car_petrol", label: "Petrol Car", emoji: "🚗" },
  { id: "car_diesel", label: "Diesel Car", emoji: "🚙" },
  { id: "car_electric", label: "EV", emoji: "⚡" },
  { id: "motorcycle", label: "Bike", emoji: "🏍️" },
  { id: "bus", label: "Bus", emoji: "🚌" },
  { id: "train", label: "Train", emoji: "🚇" },
  { id: "cycling", label: "Cycle", emoji: "🚲" },
  { id: "walking", label: "Walk", emoji: "🚶" },
];

const FOOD_OPTIONS = [
  { id: "mutton", label: "Mutton", emoji: "🥩" },
  { id: "chicken", label: "Chicken", emoji: "🍗" },
  { id: "fish", label: "Fish", emoji: "🐟" },
  { id: "vegetarian", label: "Vegetarian", emoji: "🥗" },
  { id: "vegan", label: "Vegan", emoji: "🌱" },
  { id: "dairy", label: "Dairy", emoji: "🥛" },
];

const ENERGY_OPTIONS = [
  { id: "electricity", label: "Electricity", emoji: "🔌" },
  { id: "gas", label: "Gas", emoji: "🔥" },
  { id: "heating_oil", label: "Heating Oil", emoji: "🛢️" },
];

const SHOPPING_OPTIONS = [
  { id: "clothing", label: "Clothing", emoji: "👕" },
  { id: "electronics", label: "Electronics", emoji: "📱" },
  { id: "furniture", label: "Furniture", emoji: "🛋️" },
  { id: "groceries", label: "Groceries", emoji: "🛒" },
  { id: "other", label: "Other", emoji: "📦" },
];

export default function ManualLogPanel() {
  const [category, setCategory] = useState<ActivityType | null>(null);
  const [subType, setSubType] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  
  const logActivity = useCarbonStore((s) => s.logActivity);

  const handleLog = () => {
    if (!category || !subType || amount <= 0) return;
    
    let details: ActivityDetails;
    let summary = "";

    switch (category) {
      case "transport":
        details = { type: "transport", mode: subType as TransportMode, distanceKm: amount };
        summary = `Manually logged: ${amount} km by ${TRANSPORT_OPTIONS.find(o => o.id === subType)?.label}`;
        break;
      case "food":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        details = { type: "food", mealType: subType as any, servings: amount };
        summary = `Manually logged: ${amount} serving(s) of ${FOOD_OPTIONS.find(o => o.id === subType)?.label}`;
        break;
      case "energy":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        details = { type: "energy", energyType: subType as any, amount: amount };
        summary = `Manually logged: ${amount} unit(s) of ${ENERGY_OPTIONS.find(o => o.id === subType)?.label}`;
        break;
      case "shopping":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        details = { type: "shopping", category: subType as any, amountUSD: amount };
        summary = `Manually logged: $${amount} spent on ${SHOPPING_OPTIONS.find(o => o.id === subType)?.label}`;
        break;
      default:
        return;
    }
    
    logActivity(details, summary);
    
    // Reset state
    setCategory(null);
    setSubType("");
    setAmount(0);
  };

  const renderSubOptions = () => {
    if (!category) return null;
    let options: { id: string; label: string; emoji: string }[] = [];
    let unitLabel = "";
    
    if (category === "transport") { options = TRANSPORT_OPTIONS; unitLabel = "Distance (km)"; }
    if (category === "food") { options = FOOD_OPTIONS; unitLabel = "Servings"; }
    if (category === "energy") { options = ENERGY_OPTIONS; unitLabel = "Units (kWh / m³)"; }
    if (category === "shopping") { options = SHOPPING_OPTIONS; unitLabel = "Amount (USD)"; }

    return (
      <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-4">
        <div>
          <label className="text-xs font-semibold text-slate-400 mb-2 block">Select Type</label>
          <div className="flex gap-2 flex-wrap">
            {options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSubType(opt.id)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  subType === opt.id
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                    : "bg-slate-800/50 text-slate-300 border border-slate-700/50 hover:bg-slate-700/50"
                }`}
              >
                {opt.emoji} {opt.label}
              </button>
            ))}
          </div>
        </div>

        {subType && (
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-2 block">{unitLabel}</label>
            <div className="flex gap-3">
              <input
                type="number"
                min="0"
                step="0.1"
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                placeholder={`Enter ${unitLabel.toLowerCase()}`}
              />
              <button
                onClick={handleLog}
                disabled={amount <= 0}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-sm whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                Log It
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="glass-card p-5 border-l-4 border-l-emerald-500">
      <h2 className="font-semibold text-sm text-slate-300 mb-4 flex items-center gap-2">
        <span>✏️</span> Quick Manual Log
      </h2>
      
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setCategory(cat.id === category ? null : cat.id);
              setSubType("");
              setAmount(0);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              category === cat.id
                ? "bg-slate-700 text-white shadow-md border border-slate-600"
                : "bg-slate-800/60 text-slate-400 hover:bg-slate-800 border border-transparent hover:border-slate-700"
            }`}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {renderSubOptions()}
    </div>
  );
}

// ============================================================
// CarbonPilot — Utility Formatters
// ============================================================

export function formatCo2(kg: number): string {
  if (kg < 1) return `${Math.round(kg * 1000)} g CO₂`;
  if (kg < 1000) return `${kg.toFixed(1)} kg CO₂`;
  return `${(kg / 1000).toFixed(1)} t CO₂`;
}

export function formatKg(kg: number, decimals = 1): string {
  return `${kg.toFixed(decimals)} kg`;
}

export function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateShort(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateStr === today.toISOString().slice(0, 10)) return "Today";
  if (dateStr === yesterday.toISOString().slice(0, 10)) return "Yesterday";

  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${Math.round(value)}%`;
}

export function getCategoryEmoji(category: string): string {
  switch (category) {
    case "transport": return "🚗";
    case "food": return "🍽️";
    case "energy": return "⚡";
    case "shopping": return "🛍️";
    default: return "📋";
  }
}

export function getCategoryLabel(category: string): string {
  switch (category) {
    case "transport": return "Transport";
    case "food": return "Food";
    case "energy": return "Energy";
    case "shopping": return "Shopping";
    default: return "Other";
  }
}

export function getActivityLabel(activity: { activityType: string; details: Record<string, unknown> }): string {
  const { activityType, details } = activity;
  switch (activityType) {
    case "transport": {
      const mode = details.mode as string;
      const km = details.distanceKm as number;
      const labels: Record<string, string> = {
        car_petrol: "Petrol Car",
        car_diesel: "Diesel Car",
        car_electric: "Electric Car",
        motorcycle: "Bike/Scooter",
        bus: "Bus",
        train: "Metro/Train",
        cycling: "Cycling",
        walking: "Walking",
        mixed: "Mixed",
      };
      return `${labels[mode] ?? mode} · ${km} km`;
    }
    case "food": {
      const meal = details.mealType as string;
      const labels: Record<string, string> = {
        beef: "Beef", lamb: "Mutton/Lamb", pork: "Pork",
        chicken: "Chicken", fish: "Fish", dairy: "Dairy",
        vegetarian: "Vegetarian", vegan: "Vegan",
      };
      return `${labels[meal] ?? meal} meal`;
    }
    case "energy": {
      const type = details.energyType as string;
      const amount = details.amount as number;
      return `${type === "electricity" ? "Electricity" : type === "gas" ? "Gas" : "Heating"} · ${amount} ${type === "gas" ? "m³" : "kWh"}`;
    }
    case "shopping": {
      const cat = details.category as string;
      return `Shopping · ${cat}`;
    }
    default:
      return (details.description as string) ?? "Activity";
  }
}

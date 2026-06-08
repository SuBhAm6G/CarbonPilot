"use client";

import { useCarbonStore } from "@/lib/store/carbonStore";
import type { CarbonTwinProfile } from "@/lib/engine/carbonTwin";

function ComparisonRow({ label, userKg, benchmarkKg, isGood }: {
  label: string; userKg: number; benchmarkKg: number; isGood: boolean;
}) {
  const diff = Math.round(Math.abs(((userKg - benchmarkKg) / benchmarkKg) * 100));
  const maxKg = Math.max(userKg, benchmarkKg);
  const userWidth = Math.min(100, (userKg / maxKg) * 100);
  const benchWidth = Math.min(100, (benchmarkKg / maxKg) * 100);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">{label}</span>
        <span className={`text-sm font-bold ${isGood ? "text-emerald-400" : "text-rose-400"}`}>
          {isGood ? `✓ ${diff}% below` : `▲ ${diff}% above`}
        </span>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 w-8">You</span>
          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-1000 ${isGood ? "bg-emerald-500" : "bg-rose-500"}`}
              style={{ width: `${userWidth}%` }} />
          </div>
          <span className="text-xs font-medium text-slate-300 w-14 text-right">{(userKg / 1000).toFixed(1)}t</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 w-8">Avg</span>
          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-slate-600 transition-all duration-1000"
              style={{ width: `${benchWidth}%` }} />
          </div>
          <span className="text-xs font-medium text-slate-500 w-14 text-right">{(benchmarkKg / 1000).toFixed(1)}t</span>
        </div>
      </div>
    </div>
  );
}

function DonutChart({ twin }: { twin: CarbonTwinProfile }) {
  const total = Math.max(1, twin.transportAnnualKg + twin.foodAnnualKg + twin.energyAnnualKg);
  const r = 48;
  const circ = 2 * Math.PI * r;
  const tPct = (twin.transportAnnualKg / total) * circ;
  const fPct = (twin.foodAnnualKg / total) * circ;
  const ePct = (twin.energyAnnualKg / total) * circ;

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 120 120" className="w-28 h-28 flex-shrink-0" role="img" aria-label="Annual carbon breakdown">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#1e293b" strokeWidth="16" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="#10b981" strokeWidth="16"
          strokeDasharray={`${tPct} ${circ - tPct}`} strokeDashoffset={circ * 0.25} />
        <circle cx="60" cy="60" r={r} fill="none" stroke="#f59e0b" strokeWidth="16"
          strokeDasharray={`${fPct} ${circ - fPct}`} strokeDashoffset={circ * 0.25 - tPct} />
        <circle cx="60" cy="60" r={r} fill="none" stroke="#3b82f6" strokeWidth="16"
          strokeDasharray={`${ePct} ${circ - ePct}`} strokeDashoffset={circ * 0.25 - tPct - fPct} />
        <text x="60" y="56" textAnchor="middle" fill="#e2e8f0" fontSize="14" fontWeight="700">{twin.annualTons}t</text>
        <text x="60" y="70" textAnchor="middle" fill="#64748b" fontSize="8">CO₂/year</text>
      </svg>
      <div className="space-y-2.5 text-sm flex-1">
        {[
          { color: "#10b981", label: "Transport", kg: twin.transportAnnualKg },
          { color: "#f59e0b", label: "Food", kg: twin.foodAnnualKg },
          { color: "#3b82f6", label: "Energy", kg: twin.energyAnnualKg },
        ].map(({ color, label, kg }) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <span className="text-slate-400">{label}</span>
            <span className="font-semibold text-slate-200 ml-auto">{(kg / 1000).toFixed(1)}t</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CarbonTwinCard() {
  const twin = useCarbonStore((s) => s.carbonTwin);
  const profile = useCarbonStore((s) => s.profile);

  if (!twin || !profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Complete onboarding to see your Carbon Twin.</p>
      </div>
    );
  }

  const isGood = twin.vsIndiaAvgPercent <= 0;

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Hero Card */}
      <div className={`glass-card p-6 md:p-8 relative overflow-hidden ${isGood ? "glow-emerald" : ""}`}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-15"
            style={{ background: isGood ? "radial-gradient(circle, #10b981 0%, transparent 70%)" : "radial-gradient(circle, #f59e0b 0%, transparent 70%)" }} />
        </div>
        <div className="relative space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-widest">🧬 Your Carbon Twin</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl md:text-5xl font-extrabold" style={{ color: isGood ? "#10b981" : "#f59e0b" }}>
                  {twin.annualTons}
                </span>
                <span className="text-lg text-slate-400 font-medium">t CO₂e / year</span>
              </div>
            </div>
            <div className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
              isGood ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/50" :
              "bg-amber-950/60 text-amber-400 border-amber-800/50"}`}>
              {isGood ? "🌟 Eco Leader" : "📈 Room to Grow"}
            </div>
          </div>

          <p className="text-sm text-slate-400 leading-relaxed">{twin.twinDescription}</p>

          {/* Comparisons */}
          <div className="space-y-4 pt-2">
            {twin.comparisons.map((comp) => (
              <ComparisonRow key={comp.label}
                label={comp.label}
                userKg={comp.userKg}
                benchmarkKg={comp.benchmarkKg}
                isGood={comp.isGood}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="glass-card p-6">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-5">Estimated Annual Breakdown</h2>
        <DonutChart twin={twin} />
        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          {[
            { label: "Transport", value: twin.transportAnnualKg, color: "#10b981", bg: "rgba(16,185,129,0.1)" },
            { label: "Food", value: twin.foodAnnualKg, color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
            { label: "Energy", value: twin.energyAnnualKg, color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className="p-3 rounded-xl text-xs" style={{ background: bg }}>
              <p className="text-slate-500">{label}</p>
              <p className="font-bold mt-0.5" style={{ color }}>{(value / 1000).toFixed(1)}t</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tree offset */}
      <div className="glass-card p-5 flex items-center gap-4">
        <div className="text-4xl">🌳</div>
        <div>
          <p className="font-semibold text-slate-200">{twin.treesNeeded} trees/year to offset</p>
          <p className="text-xs text-slate-500">Each mature tree absorbs ~22 kg CO₂/year (EPA)</p>
        </div>
      </div>

      <p className="text-xs text-slate-600 text-center">
        Based on your profile. Sources: IEA 2023, CEA 2023-24, CEEW, Our World in Data, DMRC.
      </p>
    </div>
  );
}

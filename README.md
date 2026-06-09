# CarbonPilot 🌿
### *Your AI Copilot for a Greener Lifestyle*

> An AI-powered sustainability coach that helps individuals understand, track, and reduce their personal carbon footprint through natural conversation and personalized insights.

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Gemini AI](https://img.shields.io/badge/Gemini-2.5--Flash-teal)](https://ai.google.dev/)
[![Tests](https://img.shields.io/badge/Tests-64%20passing-brightgreen)](#testing)

---

## The Problem

Most people want to live more sustainably but have no idea where to start.
- Carbon calculators are complex spreadsheets nobody fills out
- Generic advice ("fly less, eat less meat") doesn't account for *your* lifestyle
- There's no feedback loop to see if your choices are actually improving

**CarbonPilot solves this** by letting you simply *talk* to an AI about your day.

---

## Chosen Vertical: Climate Tech — Personal Carbon Tracking

CarbonPilot targets individual lifestyle emissions, which account for **72% of global greenhouse gas emissions** through consumption choices in transport, food, and energy.

---

## How It Works

```
User talks to AI → AI parses intent → Deterministic engine calculates CO₂ → Dashboard updates
```

### User Flow

1. **Onboarding** — User shares their lifestyle profile (transport, diet, energy source)
2. **Carbon Twin** — Instant visual comparison against India average, global average, and Paris 2030 target
3. **AI Chat** — User describes their day naturally; AI extracts activities and logs them
4. **Live Dashboard** — Real-time score, 7-day emissions chart, category breakdown
5. **AI Insight Card** — Context-aware analysis ("Transport generated 62% of your emissions this week")
6. **What-If Simulator** — Explore "What if I switched to metro?" with live CO₂ projections
7. **Recommendations** — Ranked by impact, personalized to user's actual emission sources

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          FRONTEND (Next.js)                      │
│                                                                   │
│  ┌──────────┐  ┌──────────────┐  ┌────────────┐  ┌──────────┐  │
│  │  AI Chat  │  │  Dashboard   │  │Carbon Twin │  │Simulator │  │
│  │(ChatPanel)│  │(Insight Card)│  │  (Card)    │  │  Panel   │  │
│  └────┬─────┘  └──────────────┘  └────────────┘  └──────────┘  │
│       │                  ↑                                        │
│       │          Zustand Store (persisted to localStorage)        │
│       │                  ↑                                        │
│  ┌────▼──────────────────────────────────────────────────────┐   │
│  │                 Deterministic Engine Layer                  │   │
│  │  carbonCalculator.ts │ insightEngine.ts │ carbonTwin.ts    │   │
│  │  recommendationEngine.ts │ whatIfCalculator.ts             │   │
│  └────────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │ /api/chat (Edge Function)
┌────────────────────────▼────────────────────────────────────────┐
│               AI LAYER (Vercel Edge + Gemini 2.5 Flash)          │
│                                                                   │
│  buildSystemPrompt(profile) → Personalized system prompt         │
│  Zod validation of request payload                               │
│  streamText() → Structured JSON response                         │
└─────────────────────────────────────────────────────────────────┘
```

### Why a Hybrid Architecture?

| Concern | Solution |
|---|---|
| **Accuracy** | Carbon math is deterministic (India CEA/DEFRA factors), never left to AI to fabricate |
| **Personalization** | User profile is injected into the system prompt — every AI response is context-aware |
| **Privacy** | All data in localStorage; no server-side storage |
| **Reliability** | Structured JSON output with Zod validation; fallback to "other" if AI can't parse |

---

## Features

| Feature | Description |
|---|---|
| 🤖 **AI Chat Assistant** | Natural language activity logging powered by Gemini 2.5 Flash |
| 🔍 **AI Insight Card** | Context-aware weekly analysis ("Transport is your biggest emission source") |
| 🧬 **Carbon Twin** | Visual comparison vs India average, global average, Paris 2030 target |
| 📊 **Live Dashboard** | Real-time score ring, 7-day chart, category breakdown |
| ⚡ **What-If Simulator** | 9 lifestyle scenarios with precise CO₂ projections |
| 💡 **Ranked Recommendations** | Impact-sorted suggestions personalized to your emission sources |
| 🏆 **Badges & Streaks** | Behavior reinforcement without being gamified to the point of distraction |
| 🌳 **Tree Equivalents** | Emissions framed as trees needed to offset, for intuitive understanding |

---

## AI + Rule Engine Explained

### Intent Extraction (AI)
Gemini 2.5 Flash receives a personalized system prompt that includes the user's transport mode, diet type, and sustainability goals. It converts natural language like "I drove my car 12km and had chicken biryani" into a structured JSON payload:

```json
{
  "activity_type": "transport",
  "details": { "type": "transport", "mode": "car_petrol", "distanceKm": 12 },
  "user_message": "Logged your 12 km drive! ..."
}
```

### Carbon Calculation (Deterministic Engine)
The application **never** trusts AI for numbers. After the AI extracts the activity type, `carbonCalculator.ts` computes the exact CO₂ using verified Indian emission factors:

```
Car petrol: 0.192 kg CO₂/km  (MoPNG/IPCC AR6)
Metro/Train: 0.031 kg CO₂/km (DMRC Annual Report 2023)
India grid:  0.716 kg CO₂/kWh (CEA Grid Factor 2023-24)
```

### Personalization
The `buildSystemPrompt()` function generates a tailored system prompt for each user, so the AI says things like:
> *"Since you usually drive a petrol car, today's metro ride saved you 2.6 kg CO₂!"*

---

## Accessibility

CarbonPilot is built with accessibility as a first-class concern:

- ♿ **Semantic HTML** — Proper heading hierarchy (`h1`, `h2`) throughout
- 🔍 **ARIA labels** — Chat log has `role="log" aria-live="polite"`, charts have `aria-label`, SVGs are `aria-hidden`
- ⌨️ **Keyboard navigation** — All interactive elements are keyboard-accessible with visible focus rings
- 🎨 **Colour contrast** — Dark theme tested for WCAG AA contrast ratios
- 📋 **Form accessibility** — All inputs have associated `aria-label` attributes
- 🚫 **Disabled states** — Submit buttons use both `disabled` and `aria-label` for screen readers

---

## Security

| Measure | Implementation |
|---|---|
| **No exposed API keys** | Keys stored in Vercel environment variables; never committed to git |
| **Server-side AI** | Frontend never calls Gemini directly; all AI calls go through secure Edge API route |
| **Zod payload validation** | All incoming JSON is strictly validated and sanitized before processing |
| **Message limit** | API rejects payloads with >50 messages to prevent abuse |
| **HTTPS by default** | Vercel auto-provisions TLS certificates |
| **Secret scanning** | `.gitignore` excludes `.env*` files; no credentials in git history |

---

## Testing

```bash
npm run test       # Run all tests
npm run test:ui    # Visual test runner (Vitest UI)
```

**64 tests across 2 test files:**

| File | Coverage Area | Tests |
|---|---|---|
| `carbonCalculator.test.ts` | Core emissions math, aggregation, date filters | 22 |
| `engines.test.ts` | Score calculator, recommendations, simulator, carbon twin, insight engine | 42 |

**Key test scenarios:**
- Score correctly maps weekly kg to champion/green/average/high/critical levels
- Score is always bounded 0–100 regardless of input
- Metro simulator only affects car/motorcycle trips, not cycling
- Cycling simulator only affects trips ≤10 km
- Insight engine correctly identifies dominant emission category
- Carbon twin correctly ranks diet emissions (heavy meat > omnivore > vegan)

---

## Assumptions

| Category | Assumption | Source |
|---|---|---|
| Transport | Petrol car: 0.192 kg CO₂/km (India avg fuel economy ~12 km/L) | MoPNG/IPCC AR6 |
| Transport | Metro/Suburban rail: 0.031 kg CO₂/km/passenger | DMRC Annual Report 2023 |
| Transport | City bus (DTC/BEST): 0.082 kg CO₂/km/passenger | CPCB 2022 |
| Energy | India national grid: 0.716 kg CO₂/kWh | CEA Grid Factor 2023-24 |
| Food | Serving size: 300g (Indian standard portion) | Our World in Data |
| Food | Mutton: 6.61 kg CO₂/serving | OWiD/Indian Food Council |
| Benchmarks | India per capita: 1.9 t CO₂e/year | IEA 2023 |
| Benchmarks | Paris-aligned target: 2.0 t CO₂e/year by 2030 | Paris Agreement |
| Scope | Activities logged by user only (Scope 1 & 2 personal emissions) | — |
| Persistence | localStorage (single-device; suitable for hackathon scope) | — |

---

## Folder Structure

```
CarbonPilot/
├── app/
│   ├── api/chat/route.ts     # Secure Edge API route (Gemini + Zod validation)
│   ├── layout.tsx            # Root layout with metadata
│   └── page.tsx              # App shell with tab navigation
├── components/
│   ├── chat/ChatPanel.tsx    # AI chat interface
│   ├── dashboard/Dashboard.tsx # Dashboard with AI Insight Card
│   ├── twin/CarbonTwinCard.tsx # Carbon Twin profile
│   ├── simulator/            # What-If Simulator
│   └── onboarding/           # Multi-step onboarding
├── lib/
│   ├── ai/systemPrompt.ts    # Personalized system prompt builder
│   ├── engine/
│   │   ├── emissionFactors.ts    # India-first emission factors (sourced)
│   │   ├── carbonCalculator.ts   # Pure calculation functions
│   │   ├── carbonTwin.ts         # Carbon Twin profile generator
│   │   ├── insightEngine.ts      # Context-aware AI insight cards
│   │   ├── recommendationEngine.ts # Personalized recommendations
│   │   ├── scoreCalculator.ts    # 0-100 sustainability score
│   │   └── whatIfCalculator.ts   # Lifestyle scenario simulator
│   ├── store/carbonStore.ts  # Zustand store with localStorage persistence
│   ├── types/index.ts        # All TypeScript types
│   └── utils/formatters.ts   # Display utilities
└── __tests__/
    ├── carbonCalculator.test.ts  # Core math tests
    └── engines.test.ts           # Engine coverage tests
```

---

## Setup & Running Locally

```bash
# 1. Clone
git clone https://github.com/SuBhAm6G/CarbonPilot.git
cd CarbonPilot

# 2. Install dependencies
npm install

# 3. Set environment variable
cp .env.local.example .env.local
# Edit .env.local and add your Gemini API key:
# GOOGLE_GENERATIVE_AI_API_KEY=your_key_here

# 4. Run development server
npm run dev
# Open http://localhost:3000

# 5. Run tests
npm run test
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| AI | Gemini 2.5 Flash via Vercel AI SDK v6 |
| State Management | Zustand with localStorage persistence |
| Validation | Zod (API payloads) |
| Charts | Recharts |
| Animations | Framer Motion |
| UI Components | Radix UI primitives |
| Testing | Vitest |
| Deployment | Vercel |

---

*Built for the Google Promptwars Virtual · India-first emission factors · All carbon math verified against IEA, CEA, DMRC, and Our World in Data sources.*


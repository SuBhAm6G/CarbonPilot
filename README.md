# CarbonPilot 🌍

> "Your AI Copilot for a Greener Lifestyle"

CarbonPilot is an AI-powered sustainability coach designed to help individuals understand, track, and reduce their carbon footprint through simple actions and personalized insights. 

---

## 🎯 Chosen Vertical
**Climate Tech / Sustainable Living**
This project addresses the challenge of making carbon footprint tracking accessible and actionable for everyday users by integrating seamless AI conversational interfaces with accurate environmental metrics.

---

## 🧠 Approach and Logic
We adopted a **Hybrid AI Architecture** to combine the best of both worlds:
- **AI Intent Parsing (Google Gemini):** We use an LLM exclusively for natural language understanding. When a user says, "I drove 15km to work today in my petrol car," the AI extracts the structured intent (`activity: driving, distance: 15km, type: petrol`).
- **Deterministic Rule Engine (TypeScript):** To prevent AI hallucinations in mathematics and metrics, all carbon calculations are strictly handled by a deterministic rule engine using scientifically backed emission factors.

This ensures **100% mathematical accuracy** in carbon tracking while providing a **frictionless, conversational UX** that doesn't feel like filling out endless forms.

---

## ⚙️ How the Solution Works
1. **Interactive Onboarding:** Users go through a quick, engaging wizard to establish their baseline profile (transport, diet, household energy).
2. **AI Chat Assistant:** Instead of manual data entry, users simply tell the assistant what they did today. The AI logs the activity automatically.
3. **Real-time Dashboard:** Users can visualize their carbon score, view weekly emission trends, and track their activity history.
4. **Carbon Twin:** A personalized profile card that compares the user's emissions to the national average and sustainable targets, providing instant perspective.
5. **What-If Simulator:** A tool that allows users to test hypothetical scenarios (e.g., "What if I switch to the metro twice a week?") to see the exact CO₂e savings before committing to a lifestyle change.

---

## 📋 Assumptions Made (Data & Engineering)
For the scope of this hackathon, the following assumptions and design decisions were made:

- **Emission Factors:** Calculations rely on standardized emission factors sourced from UK DEFRA (2023), IEA global averages, and Our World in Data. 
- **Storage:** Data persistence is handled via browser `localStorage` (using Zustand). This ensures privacy and removes the need for a complex backend database for the hackathon demo, though it limits cross-device syncing.
- **Dietary Estimates:** Diet-based emissions use broad categorizations (e.g., Vegan, Vegetarian, Average Meat, High Meat) rather than precise ingredient-level tracking to reduce user friction.
- **Transport Averages:** Car emissions assume standard fuel efficiency averages for petrol/diesel vehicles. 

---

## 🛠️ Tech Stack
- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS, shadcn/ui
- **State Management:** Zustand
- **AI Integration:** Vercel AI SDK, Google Gemini 2.5 Flash
- **Charts:** Recharts

## 🚀 Getting Started Locally
1. Clone the repository.
2. Run `npm install`
3. Create a `.env.local` file and add your Gemini API key: `GOOGLE_GENERATIVE_AI_API_KEY=your_key_here`
4. Run `npm run dev` and open `http://localhost:3000`

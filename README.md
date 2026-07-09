# Stratify — Startup Economy Operating System

Stratify is a unified, narrative-driven ecosystem operating system designed for founders, VCs, angel investors, and startup institutions. It maps startup execution data, strategic memories, milestones, and real-time market signals onto one single, interactive graph.

---

## 🌟 Core Features

- **Premium UI Overhaul:** Complete redesign based on a clean off-white canvas (`#FAF9F6`), sharp headings (`Outfit` font family), structural rounded cards, and chartreuse (`#C8E64A`) interactive highlights.
- **Dynamic AI Journeys:** Browse real-world startups (like YC-backed companies and Indian Unicorns) in the **Explore** section, open their showcase profiles, and dynamically generate comprehensive, journalistic journey timelines using Gemini.
- **Seasoned VC/Founder Tone:** The multi-agent critique loop (Auditor, Strategist, Coach) is fine-tuned to audit strategic roadmaps with a blunt, pragmatic, veteran founder perspective.
- **Toast Notifications System:** Native browser `alert()` popups have been fully replaced with a clean, customizable `Toast` system configured with screen-reader accessibility rules (`role="status"`, `aria-live="polite"`).
- **Algorithmic Grading Moat:** Startup show cards are ranked using a mathematical scoring formula (10-99 scale) based on traction metrics, stage weight, details completeness, and dynamic event/milestone logs.
- **Supabase Realtime Feed & Bounty Station:** Integrated instant subscription channels to sync posts, milestones, and active bounty micro-sprints live across ecosystem workspaces.
- **Ecosystem Information Hub:** Custom router paths added for `/about`, `/privacy`, and `/terms`, including the founding leadership profile.

---

## 🚀 Quick Start

### 1. Installation
Install core project dependencies:
```bash
npm install
```

### 2. Configuration
Copy the sample environment file:
```bash
cp .env.example .env
```
Fill in the configuration parameters inside `.env`:
- Set `GEMINI_API_KEY` to enable the live multi-agent intelligence workspaces.
- Set `TAVILY_API_KEY` to retrieve real-time search/news citations in analysis briefs.
- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to enable account authorization and Realtime channels.

### 3. Database Seeding
Seed the database with real-world startup profiles (Indian Unicorns + recent YC batches):
```bash
node scripts/seed_startups.js
```

### 4. Running the Workspace
Launch the local Express backend and Vite frontend concurrently:
```bash
npm run dev
```
Open `http://localhost:5173` to enter the operating system.

---

## 🛠 Tech Stack

- **Frontend:** React + Vite, Tailwind CSS, Lucide icons, Canvas Confetti.
- **Backend:** Node.js, Express, PostgreSQL / JSON File Store, Scrypt cryptography.
- **AI Engine:** Google Gemini SDK (`gemini-1.5-flash`), Tavily Web Search API.
- **Realtime / Auth:** Supabase Auth Client, Supabase Realtime Channel Postgres subscriptions.

---

## 🐳 Docker Deployment

To spin up a production-ready Nginx reverse proxy, Node server, and clean frontend assets:
```bash
docker-compose up --build
```

---

## 🧪 Quality and Testing

Run the full integration test suite covering token validation, auth state management, ReAct search providers, graph score updates, and critic revisions:
```bash
npm test
```
*Current Status: 55/55 Tests Passing*

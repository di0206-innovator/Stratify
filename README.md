# Stratify — Startup Ecosystem Operating System

Stratify is a unified, narrative-driven ecosystem operating system and intelligence engine designed for startup founders, venture capitalists, angel investors, and accelerators. It aggregates startup execution metrics, cap table models, founder memory hypotheses, and real-time market signals into an interactive graph.

---

## 🌟 Core Modules & Architecture

### 1. Multi-Agent Strategic Intelligence Engine
- **Autonomous Multi-Agent Synthesis:** Orchestrates specialized agents (Founder Context, ReAct Research, Market Analyst, Founder Strategist, Execution Coach, and QA Critic) to compile comprehensive briefs.
- **Report Archetypes:**
  - `Strategic Brief & GTM Positioning`
  - `VC Due Diligence Memo`
  - `Competitor Landscape Audit`
  - `Idea & Market Validation Report`
- **Real-Time Grounding:** Integrates live web search, Wikipedia, and SEC data via Tavily and Google Gemini (`gemini-2.5-flash`), with structured fallback synthesis.

### 2. Startup Graph & Ecosystem Network
- **Interactive Graph Visualization:** Explore ventures across sectors (Fintech, AI, Climate, Consumer, Enterprise) with dynamic relationship mapping.
- **Algorithmic Moat & Scoring Engine:** Objective venture grading (10–99 scale) combining team velocity, market traction, stage maturity, and validation milestones.
- **Dynamic Startup Profiles:** Live showcase cards with venture problem/solution breakdown, dynamic diligence briefs, and historical milestone logs.

### 3. Founder Execution Suite
- **Runway Planner:** Interactive financial model simulating monthly burn rate, revenue inflection, headcount planning, and cash-out runways.
- **Cap Table & Equity Simulator:** Pre-money and post-money dilution modeling across SAFE notes, priced Seed/Series rounds, and option pool expansions.
- **Founder Memory:** Hypothesis tracker and decision journal recording strategic bets, validation outcomes, and pivots.
- **Micro-Bounty Board:** Collaborative ecosystem task marketplace for fast technical and operational sprints.
- **Milestone Timeline:** Chronological company progress ledger tracking product releases, customer wins, and fundraising rounds.

### 4. Real-Time Ecosystem Signals Wire
- **Streaming Live Wire:** Live market pulse notifications broadcast across startup sectors.
- **Sector Intelligence Sweep:** Background sweep monitoring macro trends, regulatory changes, and venture financing activity.

### 5. Role-Based Workspaces & Governance
- **Tailored Dashboards:** Dedicated dashboards for Founders, Venture Capitalists, Angels, and Institutional Partners.
- **Production Auth & Security:** Dual-mode authentication supporting Supabase Auth and stateless Scrypt password hashing with strict Row-Level Security (RLS) policies.

---

## 🛠 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti |
| **Backend** | Node.js, Express, PostgreSQL / Supabase, Redis, Scrypt Security |
| **AI & Search** | Google Gemini (`gemini-2.5-flash`), Tavily Web Search API |
| **Database & Realtime** | Supabase PostgreSQL, Supabase Realtime Channels, In-Memory/File Stores |
| **Testing & CI** | Node.js Native Test Runner, Playwright E2E, GitHub Actions |

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/di0206-innovator/Stratify.git
cd Stratify
npm install
```

### 2. Configure Environment Variables
Copy the template configuration:
```bash
cp .env.example .env
```
Key configuration parameters in `.env`:
```ini
# AI Engine
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
TAVILY_API_KEY=your_tavily_api_key_here

# Supabase (Optional for full cloud sync; local file-store fallback is enabled by default)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Server & Client Ports
PORT=3000
NODE_ENV=development
```

### 3. Database Migration (Optional)
If connecting to Supabase or PostgreSQL:
- Run [`supabase-migration.sql`](supabase-migration.sql) in your Supabase SQL Editor.
- Or apply local migrations with `node lib/db/migrate.js`.

### 4. Seed Ecosystem Data
Populate the Startup Graph with initial venture profiles and milestones:
```bash
node scripts/seed_startups.js
```

### 5. Run Development Environment
Start both the backend server and Vite frontend concurrently:
```bash
npm run dev
```
- **Frontend:** `http://localhost:5173`
- **Backend API:** `http://localhost:3000` (or `http://localhost:3010` in standalone backend mode)

---

## 🧪 Testing & Verification

Run the full integration test suite:
```bash
npm test
```
*Status: 61 / 61 tests passing across auth security, graph scoring, ReAct search, concurrency locks, and multi-agent synthesis.*

Run production build validation:
```bash
npm run build
```

Run end-to-end browser tests:
```bash
npx playwright test
```

---

## 🐳 Docker Deployment

To launch a containerized production environment with Nginx reverse proxy and Node.js cluster:
```bash
docker-compose up --build
```

---

## 📄 License

MIT License. Designed and engineered for high-growth ventures.

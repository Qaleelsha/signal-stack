# Signal Stack — AI Investment Research Agent

> Takes a company name, runs five specialist AI lenses in parallel, and delivers a clear **Invest / Watch / Pass** verdict with full reasoning.

**Live Demo:** https://signalstackai.vercel.app

---

## Overview

Signal Stack is a multi-node AI research pipeline built with LangGraph.js. You type a company name and the agent fans out across five specialist nodes simultaneously — each examining a different dimension of the company. Once all four research nodes finish, a Verdict Engine aggregates the signals into a weighted decision.

The frontend streams every step live via SSE, so you watch each node light up in real time rather than waiting for one big response at the end.

| Node | What it does |
|---|---|
| 📰 News Sentinel | Scans recent news and scores market sentiment |
| 📊 Financials Analyst | Evaluates revenue growth, margins, and valuation |
| 🏰 Moat Evaluator | Assesses competitive advantages and market position |
| ⚠️ Risk Scanner | Identifies red flags across regulatory, competitive, and operational dimensions |
| ⚖️ Verdict Engine | Aggregates all four signals into a weighted Invest / Watch / Pass decision |

---

## How to Run

### Prerequisites
- Node.js 18+
- Free Gemini API key from [aistudio.google.com](https://aistudio.google.com)

### 1. Clone and install

```bash
git clone https://github.com/Qaleelsha/signal-stack.git
cd signal-stack

cd backend && npm install --legacy-peer-deps
cd ../frontend && npm install
```

### 2. Environment variables

Create `backend/.env`:

GEMINI_API_KEY=your_key_here

FRONTEND_URL=http://localhost:3000

PORT=3001

Create `frontend/.env.local`:

NEXT_PUBLIC_API_URL=http://localhost:3001

### 3. Run

```bash
# Terminal 1
cd backend && node server.js

# Terminal 2
cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## How It Works
User types company name

│

▼

Next.js Frontend

│

│  GET /api/research?company=X  (SSE stream)

▼

Express Backend

│

▼

LangGraph StateGraph

│

┌────┴─────────────────────┐

│    parallel fan-out      │

▼    ▼    ▼    ▼           │

news  fin  moat  risks       │

│    │    │    │           │

└────┴────┴────┘           │

│               │

▼               │

verdict ──────────┘

│

│  SSE events stream back per node

▼

Frontend updates live
**Why LangGraph?** A plain LangChain chain runs nodes sequentially. LangGraph's StateGraph lets me define edges from `__start__` to all four research nodes simultaneously — they fan out in parallel and the Verdict node fires only after all four complete. This cuts total latency roughly 4x compared to sequential execution.

**Why SSE?** Server-Sent Events are one-directional and stateless — exactly what a streaming pipeline needs. No WebSocket overhead, works natively in the browser with `EventSource`, and survives Vercel's edge network without any extra configuration.

**Weighted scoring:**

Composite = Financials × 0.35 + Moat × 0.30 + News × 0.20 + Risk × 0.15
INVEST → composite ≥ 65 and no dimension below 30

WATCH  → composite 45–64 or mixed signals

PASS   → composite < 45 or any critical dimension

Financials and Moat carry more weight because they reflect durable fundamentals rather than short-term noise.

---

## Key Decisions & Trade-offs

| Decision | What I chose | Why | What I left out |
|---|---|---|---|
| LLM | Gemini 2.5 Flash | Free tier, fast, 1M context window | GPT-4o (paid), Claude (better reasoning) |
| Orchestration | LangGraph.js StateGraph | Stateful parallel fan-out | Simple LangChain chain (sequential only) |
| Streaming | SSE over Express | Lightweight, browser-native, stateless | WebSocket (overkill for one-way stream) |
| Data source | LLM training knowledge | No API key friction | Yahoo Finance, NewsAPI, SEC EDGAR (more accurate) |
| Database | None | Keeps scope focused for assignment | PostgreSQL for persisting research history |

**Biggest trade-off:** Using the LLM's training knowledge rather than live APIs means data can be slightly stale for fast-moving companies. The fix with more time would be grounding each node with a web search tool — LangChain's Tavily integration or the Gemini grounding API would solve this cleanly.

---

## Example Runs

### Nvidia — INVEST ✅ (Composite: 90)
Nvidia is a dominant leader in the AI hardware market, driven by insatiable demand for its GPUs and the robust CUDA ecosystem. Its exceptional financial performance and wide competitive moat position it for continued growth, despite a high valuation and competitive risks.

| Signal | Score |
|---|---|
| News | 95 |
| Financials | 98 |
| Moat | 95 |
| Risk | 55 |

**Key driver:** Data Center Revenue Growth

---

### Tesla — WATCH 👁 (Composite: 59)
Tesla is navigating significant operational challenges including declining revenue, price cuts, and intense competition. Despite its strong brand and proprietary technology, the high valuation and decelerating growth necessitate a cautious approach.

| Signal | Score |
|---|---|
| News | 30 |
| Financials | 72 |
| Moat | 75 |
| Risk | 35 |

**Key driver:** Core EV demand and profitability

---

### SpaceX — INVEST ✅ (Composite: 82)
SpaceX presents a compelling long-term investment opportunity driven by unparalleled innovation in reusable rocket technology and the rapid expansion of Starlink. Its wide competitive moat and strong financials outweigh the inherent risks of capital-intensive operations.

| Signal | Score |
|---|---|
| News | 93 |
| Financials | 90 |
| Moat | 90 |
| Risk | 30 |

**Key driver:** Successful Starship development and deployment

---

## What I Would Improve With More Time

1. **Live data grounding** — attach Tavily or Gemini's grounding API to each node so financials and news pull from current sources, not training data
2. **Token streaming** — stream individual LLM tokens inside each node card so you watch the reasoning form word by word
3. **Research history** — PostgreSQL to persist past sessions and compare verdicts over time
4. **Export to PDF** — one-click download of the full research report
5. **Competitor comparison** — run two companies through the pipeline and get a side-by-side matrix
6. **Rate limit handling** — queue requests gracefully when hitting Gemini's free tier limits

---

## Project Structure
signal-stack/

├── backend/

│   ├── graph/

│   │   ├── agent.js              # LangGraph StateGraph — wires nodes + SSE callbacks

│   │   └── nodes/

│   │       ├── newsNode.js       # News sentiment scoring

│   │       ├── financialsNode.js # Financial health analysis

│   │       ├── moatNode.js       # Competitive moat evaluation

│   │       ├── riskNode.js       # Risk flag scanning

│   │       └── verdictNode.js    # Weighted verdict aggregation

│   ├── server.js                 # Express + SSE streaming endpoint

│   └── package.json

├── frontend/

│   ├── pages/

│   │   └── index.js              # Main UI — search, pipeline cards, verdict

│   └── package.json

└── README.md

## Tech Stack

- **Frontend:** Next.js · Tailwind CSS · EventSource (SSE)
- **Backend:** Node.js · Express
- **AI Orchestration:** LangGraph.js StateGraph (parallel fan-out)
- **LLM:** Google Gemini 2.5 Flash via @langchain/google-genai
- **Deployment:** Vercel (frontend) · Render (backend)
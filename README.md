# Signal Stack — AI Investment Research Agent

> Takes a company name, runs five specialist AI lenses in parallel, and delivers a clear **Invest / Watch / Pass** verdict with full reasoning in under 60 seconds.

**Live Demo:** [signalstackai.vercel.app](https://signalstackai.vercel.app)  
**GitHub:** [github.com/Qaleelsha/signal-stack](https://github.com/Qaleelsha/signal-stack)  
**Built by:** Qaleel Sha Backer

---

## Overview

Signal Stack is a multi-node AI research pipeline built with LangGraph.js and Gemini 2.5 Flash. You type a company name and the agent fans out across five specialist nodes simultaneously — each examining a different dimension of the company. Once all four research nodes finish, a Verdict Engine aggregates the signals into a weighted investment decision.

The frontend streams every step live via Server-Sent Events, so you watch each node light up in real time rather than waiting for one big response at the end.

| Node | What it does |
|---|---|
| 📰 News Sentinel | Scans recent news and scores market sentiment (0–100) |
| 📊 Financials Analyst | Evaluates revenue growth, margins, and valuation |
| 🏰 Moat Evaluator | Assesses competitive advantages and market position |
| ⚠️ Risk Scanner | Identifies red flags — regulatory, competitive, operational |
| ⚖️ Verdict Engine | Aggregates all four signals into a weighted Invest / Watch / Pass |

---

## How to Run

### Prerequisites

- Node.js 18+
- Free Gemini API key from [aistudio.google.com](https://aistudio.google.com)

### 1. Clone and install

```bash
git clone https://github.com/Qaleelsha/signal-stack.git
cd signal-stack

# Install backend
cd backend && npm install --legacy-peer-deps

# Install frontend
cd ../frontend && npm install
```

### 2. Environment variables

Create `backend/.env`:

```
GEMINI_API_KEY=your_key_here
FRONTEND_URL=http://localhost:3000
PORT=3001
```

Create `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Run locally

Open two terminals:

```bash
# Terminal 1 — backend
cd backend && node server.js

# Terminal 2 — frontend
cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## How It Works — Architecture

```
User types company name
         │
         ▼
   Next.js Frontend
         │
         │  GET /api/research?company=Nvidia   (SSE stream)
         ▼
   Express Backend
         │
         ▼
   LangGraph StateGraph
         │
         ├──────────────────────────────────┐
         │         parallel fan-out         │
         ▼         ▼         ▼         ▼   │
      [news]  [financials] [moat]  [risks]  │
         │         │         │         │   │
         └────────┬┘         └────┬────┘   │
                  │               │         │
                  └───────┬───────┘         │
                          ▼                 │
                      [verdict] ───────────┘
                          │
                          │  SSE events per node → frontend updates live
                          ▼
                    Final verdict card
```

**Why LangGraph over a plain LangChain chain?**  
A plain chain runs nodes sequentially — 4 nodes × ~5 seconds each = 20 seconds total. LangGraph's StateGraph lets me define edges from `__start__` to all four research nodes simultaneously. They fan out in parallel and the Verdict node fires only after all four complete. Total time stays at ~5–7 seconds regardless of node count.

**Why SSE over WebSockets?**  
The data flow here is strictly one-directional — server pushes updates, client only listens. SSE is purpose-built for this. No handshake overhead, works natively in the browser with `EventSource`, stateless, and survives Vercel's edge network without configuration. WebSockets would be overkill.

**Weighted scoring logic:**

```
Composite = (Financials × 0.35) + (Moat × 0.30) + (News × 0.20) + (Risk × 0.15)

INVEST → composite ≥ 65 and no single dimension below 30
WATCH  → composite 45–64, or mixed signals across dimensions
PASS   → composite < 45, or any dimension critically low
```

Financials and Moat carry the most weight because they reflect durable fundamentals. News carries less because sentiment is noisy and short-lived.

---

## Key Decisions & Trade-offs

| Decision | What I chose | Why | What I left out |
|---|---|---|---|
| **LLM** | Gemini 2.5 Flash | Free tier, 1500 req/day, 1M context, fast | GPT-4o (paid), Claude Opus (better reasoning but $$$) |
| **Orchestration** | LangGraph.js StateGraph | Stateful parallel fan-out, native JS | Simple LangChain chain (sequential only) |
| **Streaming** | SSE over Express | Lightweight, browser-native, stateless | WebSocket (overkill for one-way stream) |
| **Data source** | LLM training knowledge | Zero API friction, works for any company | Yahoo Finance, NewsAPI, SEC EDGAR (live + accurate) |
| **Database** | None | Keeps scope tight for this assignment | PostgreSQL for persisting and comparing past sessions |
| **Auth** | None | Out of scope | Auth.js + user sessions |

**Biggest trade-off:** Using the LLM's training knowledge instead of live APIs means financial data can be slightly stale for fast-moving companies. The production fix would be grounding each node with a web search tool — LangChain's Tavily integration or Gemini's native grounding API would solve this in one line per node.

---

## Example Runs

### Nvidia — INVEST ✅ (Composite: 90, Confidence: 90%)

*Nvidia is a dominant leader in the AI hardware market, driven by insatiable demand for its GPUs and the robust CUDA ecosystem. Its exceptional financial performance and wide competitive moat position it for continued growth, despite a high valuation and competitive risks.*

| Signal | Score |
|---|---|
| 📰 News | 95 |
| 📊 Financials | 98 |
| 🏰 Moat | 95 |
| ⚠️ Risk | 55 |

- **Bull case:** Unparalleled dominance in AI GPUs and CUDA ecosystem creates an insurmountable developer lock-in, making Nvidia the primary beneficiary of the global AI revolution.
- **Bear case:** Extreme valuation prices in significant future growth — highly susceptible to competition from custom ASICs and geopolitical export controls.
- **Key driver:** Data Center Revenue Growth

---

### Tesla — WATCH 👁 (Composite: 59, Confidence: 65%)

*Tesla is navigating significant operational challenges including declining revenue, price cuts, and intense competition. Despite its strong brand and proprietary technology, the high valuation and decelerating growth necessitate a cautious approach.*

| Signal | Score |
|---|---|
| 📰 News | 30 |
| 📊 Financials | 72 |
| 🏰 Moat | 75 |
| ⚠️ Risk | 35 |

- **Bull case:** FSD technology and robotaxi aspirations could unlock new revenue streams and maintain Tesla's technological edge long-term.
- **Bear case:** Severe competitive pressures, declining margins from price cuts, and high CEO key-person risk weigh heavily on near-term outlook.
- **Key driver:** Core EV demand and profitability

---

### SpaceX — INVEST ✅ (Composite: 82, Confidence: 85%)

*SpaceX presents a compelling long-term investment opportunity driven by unparalleled innovation in reusable rocket technology and the rapid expansion of Starlink.*

| Signal | Score |
|---|---|
| 📰 News | 93 |
| 📊 Financials | 90 |
| 🏰 Moat | 90 |
| ⚠️ Risk | 30 |

- **Bull case:** Successful Starship flight tests and Starlink's exponential subscriber growth confirm technological leadership and a path to dominant multi-market revenue.
- **Bear case:** Capital-intensive operations, regulatory complexity, and private company illiquidity present meaningful risks for investors.
- **Key driver:** Successful Starship development and deployment

---

## What I Would Improve With More Time

1. **Live data grounding** — attach Tavily or Gemini's grounding API to each node so financials and news pull from live sources, not training data
2. **Token-level streaming** — stream individual LLM tokens inside each node card so you watch the reasoning form word by word
3. **Research history** — PostgreSQL + Drizzle ORM to persist past sessions and compare verdicts over time
4. **PDF export** — one-click download of the full research report
5. **Competitor comparison mode** — run two companies through the pipeline simultaneously and get a side-by-side matrix
6. **Rate limit handling** — graceful queue with retry logic for Gemini's free tier (15 RPM)
7. **Confidence intervals** — run each node 3x and surface variance, since LLMs have inherent stochasticity

---

## Project Structure

```
signal-stack/
│
├── backend/
│   ├── graph/
│   │   ├── agent.js               # LangGraph StateGraph — wires all nodes, SSE callbacks
│   │   └── nodes/
│   │       ├── newsNode.js        # News sentiment scoring
│   │       ├── financialsNode.js  # Financial health analysis
│   │       ├── moatNode.js        # Competitive moat evaluation
│   │       ├── riskNode.js        # Risk flag scanning
│   │       └── verdictNode.js     # Weighted verdict aggregation
│   ├── server.js                  # Express server + SSE /api/research endpoint
│   └── package.json
│
├── frontend/
│   ├── pages/
│   │   └── index.js               # Full UI — search, live pipeline cards, verdict card
│   ├── styles/
│   │   └── globals.css
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (Pages Router), Tailwind CSS, EventSource (SSE) |
| Backend | Node.js, Express |
| AI Orchestration | LangGraph.js StateGraph (parallel fan-out pattern) |
| LLM | Google Gemini 2.5 Flash via @langchain/google-genai |
| Deployment | Vercel (frontend) · Render (backend) |

---

## Bonus — LLM Chat Session

This project was built in a live conversation with Claude (Anthropic), using it as a thought partner for every architectural decision — from choosing LangGraph over a plain chain, to the SSE streaming approach, to the weighted scoring formula. The full conversation transcript is included in the zip submission as `llm-chat-transcript.pdf`.

Key decisions made in conversation:
- **LangGraph fan-out pattern** — discussed why parallel nodes beat sequential chains for latency
- **SSE vs WebSocket** — reasoned through statefulness, directionality, and Vercel compatibility  
- **Gemini 2.5 Flash** — evaluated free tier limits (1500 req/day) vs GPT-4o cost
- **Weighted scoring** — iterated on the 35/30/20/15 weighting logic with reasoning
- **Node naming conflict** — debugged LangGraph v1.4 constraint where node names can't match state channel names

---

*© Qaleel Sha Backer · Not financial advice*
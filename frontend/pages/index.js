import { useState, useRef } from "react";
import Head from "next/head";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const STAGES = ["news", "financials", "moat", "risks", "verdict"];

const META = {
  news:       { label: "News Sentinel",      icon: "📰", color: "#38BDF8" },
  financials: { label: "Financials Analyst", icon: "📊", color: "#34D399" },
  moat:       { label: "Moat Evaluator",     icon: "🏰", color: "#A78BFA" },
  risks:      { label: "Risk Scanner",       icon: "⚠️",  color: "#FB923C" },
  verdict:    { label: "Verdict Engine",     icon: "⚖️",  color: "#F59E0B" },
};

const EXAMPLES = ["Nvidia", "Tesla", "Zomato", "Stripe", "Apple", "Reliance Industries"];

const VERDICT_STYLE = {
  INVEST: { color: "#34D399", bg: "rgba(52,211,153,0.1)",  emoji: "✅" },
  WATCH:  { color: "#F59E0B", bg: "rgba(245,158,11,0.1)",  emoji: "👁" },
  PASS:   { color: "#F87171", bg: "rgba(248,113,113,0.1)", emoji: "❌" },
};

function ScoreBar({ score, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
      <div style={{ flex: 1, height: 5, background: "#1E293B", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 3, transition: "width 1s ease" }} />
      </div>
      <span style={{ fontSize: 11, color: "#64748B", fontFamily: "monospace", width: 24 }}>{score}</span>
    </div>
  );
}

function StageCard({ stage, status, result }) {
  const m = META[stage];
  const running = status === "running";
  const done = status === "done";

  return (
    <div style={{
      background: "#0F172A",
      border: `1px solid ${running ? m.color : done ? "#1E293B" : "#1E293B"}`,
      borderRadius: 12,
      padding: 16,
      opacity: status === "pending" ? 0.4 : 1,
      transition: "border-color 0.3s, opacity 0.3s"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 18 }}>{m.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#CBD5E1" }}>{m.label}</div>
          <div style={{ fontSize: 11, fontFamily: "monospace", color: running ? m.color : done ? "#34D399" : "#475569" }}>
            {running ? "Analysing…" : done ? "Done" : status === "error" ? "Error" : "Queued"}
          </div>
        </div>
        {done && result?.score !== undefined && (
          <span style={{ fontSize: 22, fontWeight: 700, color: m.color, fontFamily: "monospace" }}>
            {result.score}<span style={{ fontSize: 12, color: "#475569" }}>/100</span>
          </span>
        )}
        {running && (
          <div style={{
            width: 16, height: 16, borderRadius: "50%",
            border: "2px solid #1E293B", borderTopColor: m.color,
            animation: "spin 0.7s linear infinite"
          }} />
        )}
      </div>

      {done && result && (
        <div style={{ marginTop: 12 }}>
          {result.summary && (
            <p style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.6, marginBottom: 8 }}>{result.summary}</p>
          )}
          {result.highlights?.length > 0 && (
            <ul style={{ fontSize: 11, color: "#64748B", paddingLeft: 14, marginBottom: 8 }}>
              {result.highlights.slice(0, 3).map((h, i) => (
                <li key={i} style={{ marginBottom: 3, lineHeight: 1.5 }}>{h}</li>
              ))}
            </ul>
          )}
          {result.score !== undefined && <ScoreBar score={result.score} color={m.color} />}
        </div>
      )}
    </div>
  );
}

function VerdictCard({ verdict }) {
  const cfg = VERDICT_STYLE[verdict.decision] || VERDICT_STYLE.WATCH;
  const { scores } = verdict;

  return (
    <div style={{ background: "#0F172A", border: "1px solid #1E293B", borderRadius: 16, padding: 28, marginBottom: 24 }}>
      <div style={{ background: cfg.bg, border: `1px solid ${cfg.color}`, borderRadius: 12, padding: "18px 24px", marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ fontSize: 32 }}>{cfg.emoji}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: cfg.color, letterSpacing: "-0.02em" }}>{verdict.decision}</div>
          <div style={{ fontSize: 12, color: "#94A3B8", fontFamily: "monospace" }}>Confidence: {verdict.confidence}%</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: cfg.color, fontFamily: "monospace", lineHeight: 1 }}>{scores?.composite ?? "—"}</div>
          <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Composite Score</div>
        </div>
      </div>

      <p style={{ fontSize: 15, fontWeight: 600, color: "#E2E8F0", marginBottom: 10 }}>{verdict.summary}</p>
      <p style={{ fontSize: 14, color: "#94A3B8", lineHeight: 1.7, marginBottom: 20 }}>{verdict.thesis}</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div style={{ background: "rgba(52,211,153,0.07)", borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#34D399", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Bull Case</div>
          <p style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.55 }}>{verdict.bullCase}</p>
        </div>
        <div style={{ background: "rgba(248,113,113,0.07)", borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#F87171", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Bear Case</div>
          <p style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.55 }}>{verdict.bearCase}</p>
        </div>
      </div>

      <div style={{ borderTop: "1px solid #1E293B", paddingTop: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: "#475569", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Key Decision Driver</div>
        <div style={{ fontSize: 14, color: "#CBD5E1", fontWeight: 500 }}>{verdict.keyMetric}</div>
      </div>

      {scores && (
        <div style={{ borderTop: "1px solid #1E293B", paddingTop: 20 }}>
          <div style={{ fontSize: 12, color: "#475569", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Signal Breakdown</div>
          {[
            { key: "news",       label: "News" },
            { key: "financials", label: "Financials" },
            { key: "moat",       label: "Moat" },
            { key: "risks",      label: "Risk" },
          ].map(({ key, label }) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: "#64748B", width: 80 }}>{label}</span>
              <div style={{ flex: 1 }}>
                <ScoreBar score={scores[key]} color={META[key].color} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [company, setCompany] = useState("");
  const [stages, setStages] = useState({});
  const [verdict, setVerdict] = useState(null);
  const [phase, setPhase] = useState("idle");
  const [errMsg, setErrMsg] = useState("");
  const esRef = useRef(null);

  function reset() {
    setStages({});
    setVerdict(null);
    setErrMsg("");
  }

  function start(name) {
    if (!name.trim()) return;
    if (esRef.current) esRef.current.close();

    reset();
    setCompany(name.trim());
    setPhase("running");

    const pending = {};
    STAGES.forEach(s => { pending[s] = { status: "pending" }; });
    setStages(pending);

    const es = new EventSource(`${API}/api/research?company=${encodeURIComponent(name.trim())}`);
    esRef.current = es;

    es.addEventListener("stage_start", e => {
      const { stage } = JSON.parse(e.data);
      setStages(prev => ({ ...prev, [stage]: { status: "running" } }));
    });

    es.addEventListener("stage_done", e => {
      const { stage, result } = JSON.parse(e.data);
      setStages(prev => ({ ...prev, [stage]: { status: "done", result } }));
      if (stage === "verdict") setVerdict(result);
    });

    es.addEventListener("stage_error", e => {
      const { stage } = JSON.parse(e.data);
      setStages(prev => ({ ...prev, [stage]: { status: "error" } }));
    });

    es.addEventListener("complete", () => {
      setPhase("done");
      es.close();
    });

    es.addEventListener("error", e => {
      try {
        const d = JSON.parse(e.data);
        setErrMsg(d.message);
      } catch {
        setErrMsg("Lost connection to backend. Is the server running?");
      }
      setPhase("error");
      es.close();
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    start(query);
  }

  const running = phase === "running";

  return (
    <>
      <Head>
        <title>Signal Stack — AI Investment Research</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px 80px", fontFamily: "Inter, sans-serif", color: "#E2E8F0" }}>

        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "28px 0 24px", borderBottom: "1px solid #1E293B", marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22, color: "#38BDF8" }}>◈</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#F1F5F9", letterSpacing: "-0.02em" }}>Signal Stack</span>
          </div>
          <span style={{ fontSize: 12, color: "#64748B", fontFamily: "monospace" }}>AI Investment Research Agent</span>
        </header>

        {phase === "idle" && (
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h1 style={{ fontSize: "clamp(28px, 5vw, 46px)", fontWeight: 700, color: "#F1F5F9", letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: 16 }}>
              Research any company.<br />Get a clear verdict.
            </h1>
            <p style={{ fontSize: 16, color: "#94A3B8", maxWidth: 520, margin: "0 auto", lineHeight: 1.65 }}>
              Five specialist AI lenses run in parallel and synthesise into an Invest / Watch / Pass decision with full reasoning.
            </p>
          </div>
        )}

        <div style={{ marginBottom: 40 }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10 }}>
            <input
              type="text"
              placeholder="Enter a company name (e.g. Nvidia, Zomato, Tesla…)"
              value={query}
              onChange={e => setQuery(e.target.value)}
              disabled={running}
              style={{
                flex: 1, background: "#0F172A", border: "1px solid #1E293B",
                borderRadius: 10, padding: "14px 18px", fontSize: 15,
                color: "#F1F5F9", outline: "none", fontFamily: "Inter, sans-serif",
                opacity: running ? 0.5 : 1
              }}
            />
            <button
              type="submit"
              disabled={running || !query.trim()}
              style={{
                background: "#38BDF8", color: "#080C14", border: "none",
                borderRadius: 10, padding: "14px 24px", fontSize: 15,
                fontWeight: 600, cursor: running ? "not-allowed" : "pointer",
                opacity: running || !query.trim() ? 0.5 : 1,
                fontFamily: "Inter, sans-serif", whiteSpace: "nowrap"
              }}
            >
              {running ? "Researching…" : "Research →"}
            </button>
          </form>

          {phase === "idle" && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
              {EXAMPLES.map(ex => (
                <button key={ex} onClick={() => { setQuery(ex); start(ex); }} style={{
                  background: "transparent", border: "1px solid #1E293B", borderRadius: 20,
                  padding: "6px 14px", fontSize: 13, color: "#94A3B8", cursor: "pointer",
                  fontFamily: "Inter, sans-serif"
                }}>
                  {ex}
                </button>
              ))}
            </div>
          )}
        </div>

        {phase === "error" && (
          <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 10, padding: "16px 20px", color: "#FCA5A5", marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
            ⚠️ {errMsg}
            <button onClick={() => setPhase("idle")} style={{ marginLeft: "auto", background: "transparent", border: "1px solid #F87171", color: "#F87171", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
              Try again
            </button>
          </div>
        )}

        {(phase === "running" || phase === "done") && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 13, color: "#64748B", fontFamily: "monospace", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              Researching: <strong style={{ color: "#94A3B8" }}>{company}</strong>
              {running && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#38BDF8", display: "inline-block", animation: "pulse 1.2s ease-in-out infinite" }} />}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {STAGES.map(s => (
                <StageCard key={s} stage={s} status={stages[s]?.status || "pending"} result={stages[s]?.result} />
              ))}
            </div>
          </div>
        )}

        {verdict && phase === "done" && (
          <>
            <VerdictCard verdict={verdict} />
            <div style={{ display: "flex", justifyContent: "center" }}>
              <button onClick={() => { setPhase("idle"); setQuery(""); }} style={{
                background: "transparent", border: "1px solid #1E293B", borderRadius: 8,
                padding: "10px 20px", fontSize: 14, color: "#64748B", cursor: "pointer",
                fontFamily: "Inter, sans-serif"
              }}>
                ← Research another company
              </button>
            </div>
          </>
        )}

        <footer style={{ textAlign: "center", fontSize: 12, color: "#334155", paddingTop: 40, fontFamily: "monospace" }}>
          Built with LangGraph.js + Gemini 2.5 Flash · Not financial advice
        </footer>
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080C14; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }
      `}</style>
    </>
  );
}
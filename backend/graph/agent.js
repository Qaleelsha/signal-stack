import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { StateGraph, END } from "@langchain/langgraph";
import { fetchCompanyNews } from "./nodes/newsNode.js";
import { analyzeFinancials } from "./nodes/financialsNode.js";
import { evaluateMoat } from "./nodes/moatNode.js";
import { scanRisks } from "./nodes/riskNode.js";
import { renderVerdict } from "./nodes/verdictNode.js";

let onProgress = null;

function emit(stage, status, data = {}) {
  if (onProgress) onProgress({ stage, status, data });
}

function getLLM() {
  return new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.3,
    maxOutputTokens: 1500,
  });
}

const channels = {
  company: { value: (_, next) => next },
  news: { value: (_, next) => next, default: () => null },
  financials: { value: (_, next) => next, default: () => null },
  moat: { value: (_, next) => next, default: () => null },
  risks: { value: (_, next) => next, default: () => null },
  verdict: { value: (_, next) => next, default: () => null },
};

async function newsNode(state) {
  emit("news", "running");
  try {
    const result = await fetchCompanyNews(state.company, getLLM());
    emit("news", "done", result);
    return { news: result };
  } catch (e) {
    emit("news", "error", { message: e.message });
    return { news: { score: 50, summary: "Unavailable", highlights: [] } };
  }
}

async function financialsNode(state) {
  emit("financials", "running");
  try {
    const result = await analyzeFinancials(state.company, getLLM());
    emit("financials", "done", result);
    return { financials: result };
  } catch (e) {
    emit("financials", "error", { message: e.message });
    return { financials: { score: 50, summary: "Unavailable", highlights: [] } };
  }
}

async function moatNode(state) {
  emit("moat", "running");
  try {
    const result = await evaluateMoat(state.company, getLLM());
    emit("moat", "done", result);
    return { moat: result };
  } catch (e) {
    emit("moat", "error", { message: e.message });
    return { moat: { score: 50, summary: "Unavailable", highlights: [] } };
  }
}

async function risksNode(state) {
  emit("risks", "running");
  try {
    const result = await scanRisks(state.company, getLLM());
    emit("risks", "done", result);
    return { risks: result };
  } catch (e) {
    emit("risks", "error", { message: e.message });
    return { risks: { score: 50, summary: "Unavailable", highlights: [] } };
  }
}

async function verdictNode(state) {
  emit("verdict", "running");
  try {
    const result = await renderVerdict(
      state.company,
      state.news,
      state.financials,
      state.moat,
      state.risks,
      getLLM()
    );
    emit("verdict", "done", result);
    return { verdict: result };
  } catch (e) {
    emit("verdict", "error", { message: e.message });
    return { verdict: { decision: "PASS", confidence: 0, reasoning: "Analysis failed" } };
  }
}

function buildGraph() {
  const graph = new StateGraph({ channels });

  graph.addNode("fetchNews", newsNode);
  graph.addNode("fetchFinancials", financialsNode);
  graph.addNode("fetchMoat", moatNode);
  graph.addNode("fetchRisks", risksNode);
  graph.addNode("fetchVerdict", verdictNode);

  graph.addEdge("__start__", "fetchNews");
  graph.addEdge("__start__", "fetchFinancials");
  graph.addEdge("__start__", "fetchMoat");
  graph.addEdge("__start__", "fetchRisks");

  graph.addEdge("fetchNews", "fetchVerdict");
  graph.addEdge("fetchFinancials", "fetchVerdict");
  graph.addEdge("fetchMoat", "fetchVerdict");
  graph.addEdge("fetchRisks", "fetchVerdict");

  graph.addEdge("fetchVerdict", END);

  return graph.compile();
}

const graph = buildGraph();

export async function runResearch(company, progressFn) {
  onProgress = progressFn;
  const result = await graph.invoke({ company });
  onProgress = null;
  return result;
}
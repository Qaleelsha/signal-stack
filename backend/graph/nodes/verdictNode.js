import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export async function renderVerdict(company, news, financials, moat, risks, llm) {
  const composite = Math.round(
    (financials?.score ?? 50) * 0.35 +
    (moat?.score ?? 50) * 0.30 +
    (news?.score ?? 50) * 0.20 +
    (risks?.score ?? 50) * 0.15
  );

  const res = await llm.invoke([
    new SystemMessage("You are a senior investment analyst. Return ONLY valid JSON, no markdown, no explanation."),
    new HumanMessage(`Make a final investment decision for: "${company}"

Research summary:
- News sentiment score: ${news?.score}/100 — ${news?.summary}
- Financials score: ${financials?.score}/100 (${financials?.grade}) — ${financials?.summary}
- Moat score: ${moat?.score}/100 (${moat?.moatWidth} moat) — ${moat?.summary}
- Risk score: ${risks?.score}/100 (${risks?.riskLevel} risk) — ${risks?.summary}
- Weighted composite: ${composite}/100

Decision rules:
- INVEST if composite >= 65 and no dimension below 30
- WATCH if composite 45-64 or mixed signals
- PASS if composite < 45 or any dimension critically low

Return this exact JSON:
{
  "decision": "<INVEST|WATCH|PASS>",
  "confidence": <0-100>,
  "compositeScore": ${composite},
  "thesis": "<3-4 sentence investment thesis>",
  "bullCase": "<strongest argument for investing>",
  "bearCase": "<strongest argument against>",
  "keyMetric": "<single most important factor>",
  "timeHorizon": "<Short-term (0-1yr)|Medium-term (1-3yr)|Long-term (3yr+)>",
  "summary": "<one crisp headline sentence>"
}`)
  ]);

  const text = res.content.replace(/\`\`\`json|\`\`\`/g, "").trim();
  const parsed = JSON.parse(text);

  return {
    ...parsed,
    scores: {
      news: news?.score ?? 50,
      financials: financials?.score ?? 50,
      moat: moat?.score ?? 50,
      risks: risks?.score ?? 50,
      composite,
    }
  };
}
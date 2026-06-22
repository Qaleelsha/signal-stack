import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export async function fetchCompanyNews(company, llm) {
  const res = await llm.invoke([
    new SystemMessage("You are a financial news analyst. Return ONLY valid JSON, no markdown, no explanation."),
    new HumanMessage(`Analyze recent news and market sentiment for: "${company}"

Return this exact JSON:
{
  "score": <0-100, 0=very bearish, 100=very bullish>,
  "sentiment": "<Bullish|Neutral|Bearish>",
  "summary": "<2-3 sentence summary>",
  "highlights": ["<news item 1>", "<news item 2>", "<news item 3>"],
  "trend": "<Improving|Stable|Declining>"
}`)
  ]);

  const text = res.content.replace(/\`\`\`json|\`\`\`/g, "").trim();
  return JSON.parse(text);
}
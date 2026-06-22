import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export async function analyzeFinancials(company, llm) {
  const res = await llm.invoke([
    new SystemMessage("You are a financial analyst. Return ONLY valid JSON, no markdown, no explanation."),
    new HumanMessage(`Analyze the financial health of: "${company}"

Return this exact JSON:
{
  "score": <0-100, 0=very weak, 100=excellent>,
  "grade": "<A|B|C|D|F>",
  "summary": "<2-3 sentence summary>",
  "highlights": ["<metric 1>", "<metric 2>", "<metric 3>"],
  "revenueGrowth": "<Strong|Moderate|Weak|Negative>",
  "profitability": "<Profitable|Break-even|Loss-making>",
  "valuationView": "<Undervalued|Fair|Overvalued|Unclear>"
}`)
  ]);

  const text = res.content.replace(/\`\`\`json|\`\`\`/g, "").trim();
  return JSON.parse(text);
}
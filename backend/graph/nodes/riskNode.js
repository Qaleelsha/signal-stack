import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export async function scanRisks(company, llm) {
  const res = await llm.invoke([
    new SystemMessage("You are a risk analyst at an investment fund. Return ONLY valid JSON, no markdown, no explanation."),
    new HumanMessage(`Assess investment risks for: "${company}"

Return this exact JSON:
{
  "score": <0-100, 0=extremely risky, 100=very low risk>,
  "riskLevel": "<High|Moderate|Low>",
  "summary": "<2-3 sentence summary>",
  "highlights": ["<risk 1>", "<risk 2>", "<risk 3>"],
  "topRiskCategory": "<Regulatory|Competitive|Macro|Operational|Financial|Leadership>",
  "redFlags": ["<flag if any>"]
}`)
  ]);

  const text = res.content.replace(/\`\`\`json|\`\`\`/g, "").trim();
  return JSON.parse(text);
}
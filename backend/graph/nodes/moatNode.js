import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export async function evaluateMoat(company, llm) {
  const res = await llm.invoke([
    new SystemMessage("You are a competitive strategy analyst. Return ONLY valid JSON, no markdown, no explanation."),
    new HumanMessage(`Evaluate the competitive moat of: "${company}"

Return this exact JSON:
{
  "score": <0-100, 0=no moat, 100=wide moat>,
  "moatWidth": "<Wide|Narrow|None>",
  "summary": "<2-3 sentence summary>",
  "highlights": ["<advantage 1>", "<advantage 2>", "<weakness>"],
  "primaryMoatSource": "<Network Effects|Switching Costs|Cost Advantage|Intangible Assets|Efficient Scale|None>",
  "marketPosition": "<Leader|Challenger|Niche Player|Commoditized>"
}`)
  ]);

  const text = res.content.replace(/\`\`\`json|\`\`\`/g, "").trim();
  return JSON.parse(text);
}
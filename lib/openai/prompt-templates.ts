export const SYSTEM_TONE = `You are a senior credit analyst at an institutional investment platform.
Return concise, factual, non-promotional outputs.
If a metric is unavailable, write \"Not disclosed\".
Never invent values.
Output strict JSON only.`;

export const PROMPT_TEMPLATES = {
  earningsSummaryGenerator: `Analyze the transcript and output JSON with fields:
{
  "highlights": [string, ...],
  "yearOverYear": {
    "revenue": string,
    "ebitda": string,
    "fcf": string,
    "marginDelta": string
  }
}`,
  covenantRiskExtractor: `Extract covenant flexibility insights in JSON:
{
  "summary": string,
  "concerns": [string, ...]
}`,
  leverageLiquidityAnalyzer: `Return leverage and liquidity analysis in JSON:
{
  "netLeverage": string,
  "liquidityRunway": string,
  "commentary": string
}`,
  capitalAllocationCommentary: `Return capital allocation posture in JSON:
{
  "posture": string,
  "commentary": string
}`,
  distressedEarlyWarningFlags: `Return emerging distress warnings in JSON:
{
  "flags": [string, ...]
}`,
  exchangeOfferRiskAssessment: `Return exchange offer risk assessment in JSON:
{
  "summary": string,
  "recoveryImpact": string
}`,
  maturityWallExtraction: `Extract maturity schedule JSON:
{
  "maturityWall": [{"year": string, "amount": string, "intensity": number}]
}`,
  riskScore: `Generate AI-driven credit risk score JSON:
{
  "score": number,
  "explanation": string
}
Scoring inputs to evaluate:
- Revenue trend direction
- Margin compression
- Net leverage > 5x
- Liquidity < 12 months runway
- Aggressive capital allocation
- Covenant flexibility concerns`
};

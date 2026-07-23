import { CreditInputs } from '@/lib/analytics/types';
import { openai } from './client';

const EXTRACTION_SYSTEM = `You are a senior distressed-credit analyst.
Extract a structured credit profile from the provided earnings transcript / filing text.
Return STRICT JSON matching the requested schema only. Never invent precise figures:
if a value is not disclosed, use a conservative sector-typical estimate and keep it plausible.
Numbers are in USD millions unless noted. Prices are cents on the dollar (0-100).`;

const EXTRACTION_INSTRUCTIONS = `Return JSON with this exact shape:
{
  "issuer": string,
  "sector": string,
  "ebitdaMM": number,
  "liquidityMM": number,
  "annualFcfMM": number,
  "revenueGrowthPct": number,
  "cashInterestMM": number,
  "evMultipleBase": number,
  "evMultipleBear": number,
  "evMultipleBull": number,
  "benchmarkYieldPct": number,
  "capitalStructure": [
    { "name": string, "type": "first-lien"|"second-lien"|"unsecured"|"subordinated",
      "amountMM": number, "couponPct": number, "maturityYears": number,
      "priceCents": number, "isTarget": boolean }
  ],
  "docFlags": {
    "unrestrictedSubCapacity": boolean,
    "lacksSacredRightsProtection": boolean,
    "largeRatioDebtCapacity": boolean,
    "weakLienProtection": boolean,
    "looseRestrictedPayments": boolean,
    "nonGuarantorLeakage": boolean,
    "aggressiveSponsor": boolean
  }
}
Rules:
- Mark exactly one tranche isTarget:true (the most interesting distressed instrument).
- evMultipleBear < evMultipleBase < evMultipleBull.
- benchmarkYieldPct ~ current UST/SOFR level (~4.2 unless stated).
- docFlags reflect creditor-protection weakness inferred from covenant/LME commentary.`;

/**
 * Best-effort AI extraction of Alpha Engine inputs from unstructured text.
 * Returns null if no API key is configured or parsing fails — the caller then
 * falls back to a supplied structured payload or the sample credit.
 */
export async function extractCreditInputs(text: string): Promise<CreditInputs | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        { role: 'system', content: EXTRACTION_SYSTEM },
        { role: 'user', content: `${EXTRACTION_INSTRUCTIONS}\n\nText:\n${text}` }
      ],
      response_format: { type: 'json_object' }
    });
    const raw = completion.choices[0]?.message.content ?? '{}';
    const parsed = JSON.parse(raw) as CreditInputs;
    if (!parsed.capitalStructure?.length) return null;
    // Ensure a target is set.
    if (!parsed.capitalStructure.some((t) => t.isTarget)) {
      parsed.capitalStructure[parsed.capitalStructure.length - 1].isTarget = true;
    }
    return parsed;
  } catch {
    return null;
  }
}

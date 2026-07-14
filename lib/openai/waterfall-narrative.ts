import { WaterfallResult } from '@/lib/types';
import { openai } from './client';

const NARRATIVE_TONE = `You are a senior distressed-debt analyst.
Given a computed recovery waterfall and relative-value metrics, write a tight,
institutional-grade read for a high-yield portfolio manager.
Be factual and reference the numbers provided. Do not invent figures.
Return strict JSON: {"narrative": string}. Keep it under 140 words.`;

/**
 * Best-effort qualitative overlay on top of the deterministic waterfall.
 * Returns null (never throws) when OpenAI is unavailable so the numeric
 * engine always renders.
 */
export async function generateWaterfallNarrative(
  result: WaterfallResult
): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  const facts = {
    company: result.companyName,
    enterpriseValue: result.enterpriseValue,
    totalClaims: result.totalClaims,
    valueCoverage: result.valueCoverage,
    fulcrumTranche: result.fulcrumTranche,
    equityValue: result.equityValue,
    tranches: result.recoveries.map((r) => ({
      name: r.name,
      recoveryPct: r.recoveryPct,
      isFulcrum: r.isFulcrum,
      spreadBps: r.relativeValue?.spreadBps ?? null,
      impliedAnnualDefaultProb: r.relativeValue?.impliedAnnualDefaultProb ?? null,
      riskAdjustedYtm: r.relativeValue?.riskAdjustedYtm ?? null
    }))
  };

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        { role: 'system', content: NARRATIVE_TONE },
        { role: 'user', content: `Waterfall data:\n${JSON.stringify(facts, null, 2)}` }
      ],
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0]?.message.content ?? '{}';
    const parsed = JSON.parse(content) as { narrative?: string };
    return parsed.narrative ?? null;
  } catch {
    return null;
  }
}

import { AnalysisOutput } from '@/lib/types';
import { openai } from './client';
import { PROMPT_TEMPLATES, SYSTEM_TONE } from './prompt-templates';

async function runJsonPrompt(template: string, transcript: string) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.2,
    messages: [
      { role: 'system', content: SYSTEM_TONE },
      { role: 'user', content: `${template}\n\nTranscript:\n${transcript}` }
    ],
    response_format: { type: 'json_object' }
  });

  const content = completion.choices[0]?.message.content ?? '{}';
  return JSON.parse(content);
}

export async function analyzeTranscript(transcript: string): Promise<AnalysisOutput> {
  const [
    earningsSummary,
    covenantFlexibility,
    leverageLiquidity,
    capitalAllocation,
    distressedFlags,
    exchangeOfferModeling,
    maturityWall,
    riskScore
  ] = await Promise.all([
    runJsonPrompt(PROMPT_TEMPLATES.earningsSummaryGenerator, transcript),
    runJsonPrompt(PROMPT_TEMPLATES.covenantRiskExtractor, transcript),
    runJsonPrompt(PROMPT_TEMPLATES.leverageLiquidityAnalyzer, transcript),
    runJsonPrompt(PROMPT_TEMPLATES.capitalAllocationCommentary, transcript),
    runJsonPrompt(PROMPT_TEMPLATES.distressedEarlyWarningFlags, transcript),
    runJsonPrompt(PROMPT_TEMPLATES.exchangeOfferRiskAssessment, transcript),
    runJsonPrompt(PROMPT_TEMPLATES.maturityWallExtraction, transcript),
    runJsonPrompt(PROMPT_TEMPLATES.riskScore, transcript)
  ]);

  return {
    earningsSummary,
    covenantFlexibility,
    leverageLiquidity,
    capitalAllocation,
    distressedFlags,
    exchangeOfferModeling,
    maturityWall: maturityWall.maturityWall ?? [],
    riskScore
  } as AnalysisOutput;
}

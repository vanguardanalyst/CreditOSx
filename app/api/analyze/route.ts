import { NextRequest, NextResponse } from 'next/server';
import { analyzeTranscript } from '@/lib/openai/analyze-transcript';
import { fetchSupabaseTable, getSessionFromCookie } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const session = await getSessionFromCookie();

  if (!session?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json()) as { transcriptText?: string };
  const transcriptText = body.transcriptText?.trim();

  if (!transcriptText) {
    return NextResponse.json({ error: 'Transcript text is required.' }, { status: 400 });
  }

  const userRes = await fetchSupabaseTable('users', `select=subscription_status&id=eq.${session.id}`);
  const users = (await userRes.json()) as Array<{ subscription_status: string }>;
  const status = users?.[0]?.subscription_status ?? 'free';

  if (status === 'free') {
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);

    const countRes = await fetchSupabaseTable(
      'transcripts',
      `select=id&user_id=eq.${session.id}&upload_date=gte.${monthStart.toISOString()}`
    );
    const prior = (await countRes.json()) as Array<{ id: string }>;

    if (prior.length >= 3) {
      return NextResponse.json({ error: 'Free-tier upload limit reached.' }, { status: 403 });
    }
  }

  const analysis = await analyzeTranscript(transcriptText);

  const insertTranscript = await fetchSupabaseTable('transcripts', 'select=id', 'POST', {
    user_id: session.id,
    raw_text: transcriptText,
    upload_date: new Date().toISOString()
  });
  const transcriptRows = (await insertTranscript.json()) as Array<{ id: string }>;

  if (transcriptRows?.[0]?.id) {
    await fetchSupabaseTable('analyses', '', 'POST', {
      transcript_id: transcriptRows[0].id,
      summary_json: analysis.earningsSummary,
      risk_score: analysis.riskScore.score,
      leverage_metrics: analysis.leverageLiquidity,
      liquidity_metrics: analysis.leverageLiquidity,
      maturity_data: analysis.maturityWall
    });
  }

  return NextResponse.json(analysis);
}

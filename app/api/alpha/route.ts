import { NextRequest, NextResponse } from 'next/server';
import { runAlphaEngine } from '@/lib/analytics/alpha-engine';
import { CreditInputs } from '@/lib/analytics/types';
import { sampleCredit } from '@/lib/analytics/sample-credit';
import { extractCreditInputs } from '@/lib/openai/extract-credit-inputs';
import { fetchSupabaseTable, getSessionFromCookie } from '@/lib/supabase/server';

interface AlphaRequest {
  /** Fully structured credit inputs (from the UI form). */
  inputs?: CreditInputs;
  /** Optional raw transcript/filing text for AI extraction. */
  transcriptText?: string;
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromCookie();
  if (!session?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // The Alpha Engine is a Pro-tier feature.
  try {
    const userRes = await fetchSupabaseTable(
      'users',
      `select=subscription_status&id=eq.${session.id}`
    );
    const users = (await userRes.json()) as Array<{ subscription_status: string }>;
    const status = users?.[0]?.subscription_status ?? 'free';
    if (status !== 'pro') {
      return NextResponse.json(
        { error: 'The Distress Alpha Engine is a Pro feature. Upgrade to unlock.' },
        { status: 403 }
      );
    }
  } catch {
    // If Supabase is not configured (local/dev), allow the request through.
  }

  const body = (await req.json().catch(() => ({}))) as AlphaRequest;

  let inputs: CreditInputs | null = body.inputs ?? null;
  if (!inputs && body.transcriptText?.trim()) {
    inputs = await extractCreditInputs(body.transcriptText);
  }
  if (!inputs) inputs = sampleCredit;

  const output = runAlphaEngine(inputs);
  return NextResponse.json({ inputs, output });
}

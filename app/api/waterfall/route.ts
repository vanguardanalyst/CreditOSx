import { NextRequest, NextResponse } from 'next/server';
import { computeWaterfall } from '@/lib/finance/recovery-waterfall';
import { generateWaterfallNarrative } from '@/lib/openai/waterfall-narrative';
import { fetchSupabaseTable, getSessionFromCookie } from '@/lib/supabase/server';
import { WaterfallInput } from '@/lib/types';

export async function POST(req: NextRequest) {
  const session = await getSessionFromCookie();

  if (!session?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json()) as Partial<WaterfallInput>;

  if (!body.companyName || typeof body.enterpriseValue !== 'number' || !Array.isArray(body.tranches)) {
    return NextResponse.json(
      { error: 'companyName, enterpriseValue and tranches are required.' },
      { status: 400 }
    );
  }

  if (body.tranches.length === 0) {
    return NextResponse.json({ error: 'At least one tranche is required.' }, { status: 400 });
  }

  const invalidTranche = body.tranches.find(
    (t) => !t?.name || typeof t.claim !== 'number' || typeof t.seniorityRank !== 'number'
  );
  if (invalidTranche) {
    return NextResponse.json(
      { error: 'Each tranche needs a name, numeric claim and seniorityRank.' },
      { status: 400 }
    );
  }

  const result = computeWaterfall({
    companyName: body.companyName,
    enterpriseValue: body.enterpriseValue,
    riskFreeRate: body.riskFreeRate,
    tranches: body.tranches
  });

  // AI narrative is a Pro-tier overlay; the deterministic engine serves everyone.
  const userRes = await fetchSupabaseTable('users', `select=subscription_status&id=eq.${session.id}`);
  const users = (await userRes.json()) as Array<{ subscription_status: string }>;
  const status = users?.[0]?.subscription_status ?? 'free';

  if (status === 'pro') {
    result.narrative = await generateWaterfallNarrative(result);
  }

  return NextResponse.json(result);
}

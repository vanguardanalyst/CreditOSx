import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';

export async function POST() {
  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!priceId || !appUrl) {
    return NextResponse.json({ error: 'Stripe not configured.' }, { status: 500 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/settings?upgraded=1`,
    cancel_url: `${appUrl}/settings?canceled=1`
  });

  return NextResponse.redirect(session.url || `${appUrl}/settings`);
}

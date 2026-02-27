import Link from 'next/link';

export default function SettingsPage({ searchParams }: { searchParams: { upgrade?: string } }) {
  const showUpgrade = searchParams.upgrade === '1';

  return (
    <section className="space-y-4 py-4">
      <h1 className="text-2xl font-semibold">Settings & Subscription</h1>
      {showUpgrade && <p className="text-sm text-amber-300">Pro tier required for this page. Upgrade to continue.</p>}
      <div className="panel rounded-xl p-4 text-sm text-slate-300">
        <p>Free tier: 3 transcript uploads/month, basic summary only.</p>
        <p className="mt-2">Pro tier: $299/month, unlimited uploads, risk score, maturity wall, covenant extraction, portfolio.</p>
        <form action="/api/stripe/checkout" method="post" className="mt-4">
          <button type="submit" className="rounded-md bg-mutedBlue px-4 py-2 text-sm font-medium text-white">
            Upgrade to Pro
          </button>
        </form>
        <p className="mt-3 text-xs text-slate-500">
          Billing managed via Stripe. Webhook updates subscription status in Supabase users table.
        </p>
        <Link href="/dashboard" className="mt-4 inline-block text-xs text-mutedBlue">
          Return to dashboard
        </Link>
      </div>
    </section>
  );
}

import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-8">
      <div className="panel rounded-2xl p-12">
        <p className="text-sm uppercase tracking-[0.25em] text-mutedBlue">CreditOS</p>
        <h1 className="mt-3 text-4xl font-semibold">AI-Powered Credit Intelligence</h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          Structured earnings analysis, covenant flexibility diagnostics, and risk scoring built for high-yield,
          private credit, distressed, and event-driven investors.
        </p>
        <div className="mt-8 flex gap-4">
          <Link className="rounded-md bg-mutedBlue px-5 py-3 text-sm font-medium text-white" href="/login">
            Sign in
          </Link>
          <Link className="rounded-md border border-slate-700 px-5 py-3 text-sm font-medium" href="/dashboard">
            View product
          </Link>
        </div>
      </div>
    </main>
  );
}

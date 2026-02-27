export default function PortfolioPage() {
  return (
    <section className="space-y-4 py-4">
      <h1 className="text-2xl font-semibold">Portfolio Tracker</h1>
      <div className="panel rounded-xl p-4">
        <p className="text-sm text-slate-300">Track bonds, cost basis, and AI-updated risk signals across your credit book.</p>
        <ul className="mt-4 space-y-2 text-sm text-slate-400">
          <li>• Asteria 7.75% 2027 | Cost 92.5 | Risk 72</li>
          <li>• Falcon Industrials TLB 2028 | Cost 95.8 | Risk 49</li>
        </ul>
      </div>
    </section>
  );
}

export default function AlertsPage() {
  return (
    <section className="space-y-4 py-4">
      <h1 className="text-2xl font-semibold">Risk Alerts</h1>
      <div className="panel rounded-xl p-4 text-sm text-slate-300">
        <p>High-priority alerts are generated when leverage worsens, liquidity runway compresses, or covenant terms tighten.</p>
        <ul className="mt-4 space-y-3 text-slate-400">
          <li>• Asteria Networks: Net leverage increased above 5.5x and buybacks continued.</li>
          <li>• Northline Medical: Margin compression flagged for third consecutive quarter.</li>
        </ul>
      </div>
    </section>
  );
}

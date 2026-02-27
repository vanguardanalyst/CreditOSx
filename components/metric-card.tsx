export function MetricCard({ title, value, delta }: { title: string; value: string; delta: string }) {
  return (
    <article className="panel rounded-xl p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{title}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{delta}</p>
    </article>
  );
}

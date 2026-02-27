import { MaturityDataPoint } from '@/lib/types';

export function MaturityTimeline({ items }: { items: MaturityDataPoint[] }) {
  return (
    <article className="panel rounded-xl p-4">
      <h3 className="text-sm font-medium">Maturity Wall</h3>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.year}>
            <div className="mb-1 flex justify-between text-xs text-slate-300">
              <span>{item.year}</span>
              <span>{item.amount}</span>
            </div>
            <div className="h-2 rounded bg-slate-800">
              <div className="h-2 rounded bg-mutedBlue" style={{ width: `${item.intensity}%` }} />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

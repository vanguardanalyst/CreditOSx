import { TrancheAnalysis } from '@/lib/analytics/types';

function bar(cents: number) {
  return Math.max(2, Math.min(100, cents));
}

export function WaterfallChart({ tranches }: { tranches: TrancheAnalysis[] }) {
  return (
    <article className="panel rounded-xl p-4">
      <h3 className="text-sm font-medium">Recovery Waterfall — Capital Structure</h3>
      <p className="mt-1 text-xs text-slate-400">
        Recovery by tranche across EV scenarios. Price marker shows where the market trades today.
      </p>
      <div className="mt-4 space-y-4">
        {tranches.map((t) => (
          <div key={t.name} className={t.isTarget ? 'rounded-lg bg-slate-800/40 p-2 ring-1 ring-mutedBlue/40' : 'p-2'}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-200">
                {t.isTarget && <span className="mr-1 text-mutedBlue">◆</span>}
                {t.name}
              </span>
              <span className="tabular-nums text-slate-400">
                {t.leverageThrough}x thru · trades {t.priceCents}c
              </span>
            </div>
            <div className="relative h-5 w-full overflow-hidden rounded bg-slate-900">
              {/* Bear recovery */}
              <div
                className="absolute inset-y-0 left-0 bg-signal-high/40"
                style={{ width: `${bar(t.recoveryBaseCents)}%` }}
                title={`Base recovery ${t.recoveryBaseCents}c`}
              />
              <div
                className="absolute inset-y-0 left-0 bg-signal-high/70"
                style={{ width: `${bar(t.recoveryBearCents)}%` }}
                title={`Bear recovery ${t.recoveryBearCents}c`}
              />
              {/* Current price marker */}
              <div
                className="absolute inset-y-0 w-[2px] bg-white"
                style={{ left: `${bar(t.priceCents)}%` }}
                title={`Market price ${t.priceCents}c`}
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-slate-500 tabular-nums">
              <span>Bear {t.recoveryBearCents}c</span>
              <span>Base {t.recoveryBaseCents}c</span>
              <span>Bull {t.recoveryBullCents}c</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-4 text-[10px] text-slate-500">
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-3 bg-signal-high/70" /> Bear recovery</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-3 bg-signal-high/40" /> Base recovery</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-[2px] bg-white" /> Market price</span>
      </div>
    </article>
  );
}

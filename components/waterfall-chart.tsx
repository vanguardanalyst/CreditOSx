import { TrancheRecovery } from '@/lib/types';

function recoveryColor(pct: number): string {
  if (pct >= 100) return 'bg-signal-low';
  if (pct > 0) return 'bg-signal-medium';
  return 'bg-signal-high';
}

export function WaterfallChart({ recoveries }: { recoveries: TrancheRecovery[] }) {
  return (
    <div className="space-y-3">
      {recoveries.map((tranche) => (
        <div key={tranche.name}>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 font-medium">
              {tranche.name}
              {tranche.isFulcrum && (
                <span className="rounded bg-mutedBlue/30 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-mutedBlue">
                  Fulcrum
                </span>
              )}
            </span>
            <span className="tabular-nums text-slate-300">{tranche.recoveryPct.toFixed(1)}%</span>
          </div>
          <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full ${recoveryColor(tranche.recoveryPct)}`}
              style={{ width: `${Math.min(tranche.recoveryPct, 100)}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-xs text-slate-500">
            <span>Claim ${tranche.claim.toLocaleString()}mm</span>
            <span>Recovered ${tranche.recoveryAmount.toLocaleString()}mm</span>
          </div>
        </div>
      ))}
    </div>
  );
}

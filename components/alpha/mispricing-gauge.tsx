import { AlphaEngineOutput } from '@/lib/analytics/types';

export function MispricingGauge({ output }: { output: AlphaEngineOutput }) {
  const { defaultRisk, mispricing } = output;
  const implied = defaultRisk.impliedPct;
  const fundamental = defaultRisk.fundamentalPct;
  const max = Math.max(implied, fundamental, 5) * 1.15;

  const edgeColor =
    mispricing.verdict === 'CHEAP' ? 'text-signal-low' :
    mispricing.verdict === 'RICH' ? 'text-signal-high' : 'text-signal-medium';

  return (
    <article className="panel rounded-xl p-4">
      <h3 className="text-sm font-medium">Mispricing — Implied vs Fundamental Default</h3>
      <p className="mt-1 text-xs text-slate-400">
        Cumulative default probability to maturity ({defaultRisk.horizonYears}y horizon).
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <div className="mb-1 flex justify-between text-xs text-slate-300">
            <span>Market-implied (from spread)</span>
            <span className="tabular-nums">{implied}%</span>
          </div>
          <div className="h-2.5 rounded bg-slate-800">
            <div className="h-2.5 rounded bg-mutedBlue" style={{ width: `${(implied / max) * 100}%` }} />
          </div>
        </div>
        <div>
          <div className="mb-1 flex justify-between text-xs text-slate-300">
            <span>Fundamental (model)</span>
            <span className="tabular-nums">{fundamental}%</span>
          </div>
          <div className="h-2.5 rounded bg-slate-800">
            <div className="h-2.5 rounded bg-signal-medium" style={{ width: `${(fundamental / max) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-800 pt-3 text-center">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Fair value</p>
          <p className="text-lg font-semibold tabular-nums">{mispricing.fairValueCents}c</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Edge</p>
          <p className={`text-lg font-semibold tabular-nums ${edgeColor}`}>
            {mispricing.edgePoints >= 0 ? '+' : ''}{mispricing.edgePoints} pts
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Verdict</p>
          <p className={`text-lg font-semibold ${edgeColor}`}>{mispricing.verdict}</p>
        </div>
      </div>
    </article>
  );
}

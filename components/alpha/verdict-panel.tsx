import { AlphaEngineOutput } from '@/lib/analytics/types';

const VERDICT_STYLES: Record<string, string> = {
  'STRONG BUY': 'text-signal-low border-signal-low/40 bg-signal-low/10',
  BUY: 'text-signal-low border-signal-low/30 bg-signal-low/5',
  HOLD: 'text-signal-medium border-signal-medium/30 bg-signal-medium/10',
  REDUCE: 'text-signal-high border-signal-high/30 bg-signal-high/5',
  'AVOID / SHORT': 'text-signal-high border-signal-high/40 bg-signal-high/10'
};

export function VerdictPanel({ output }: { output: AlphaEngineOutput }) {
  const { signal, mispricing } = output;
  const style = VERDICT_STYLES[signal.verdict] ?? 'text-slate-200 border-slate-700';

  return (
    <article className={`rounded-xl border p-5 ${style}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] opacity-70">Alpha Signal</p>
          <p className="mt-1 text-3xl font-semibold">{signal.verdict}</p>
          <p className="mt-1 text-xs opacity-80">
            {signal.conviction} conviction · {mispricing.verdict} vs fair value
          </p>
        </div>
        <div className="text-right">
          <p className="text-5xl font-bold tabular-nums">{signal.alphaScore}</p>
          <p className="text-[10px] uppercase tracking-wide opacity-70">Alpha score / 100</p>
        </div>
      </div>
      <ul className="mt-4 space-y-2 border-t border-current/15 pt-4 text-sm text-slate-200">
        {signal.thesis.map((line, i) => (
          <li key={i} className="flex gap-2">
            <span className="opacity-50">›</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

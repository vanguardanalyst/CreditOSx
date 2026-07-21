import { AlphaEngineOutput } from '@/lib/analytics/types';

const BAND_COLOR: Record<string, string> = {
  LOW: 'bg-signal-low text-signal-low',
  MODERATE: 'bg-signal-medium text-signal-medium',
  HIGH: 'bg-signal-high text-signal-high',
  SEVERE: 'bg-signal-high text-signal-high'
};

export function LmeMeter({ output }: { output: AlphaEngineOutput }) {
  const { lmeVulnerability } = output;
  const color = BAND_COLOR[lmeVulnerability.band] ?? 'bg-slate-600 text-slate-300';
  const [barColor, textColor] = color.split(' ');

  return (
    <article className="panel rounded-xl p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">LME Priming Vulnerability</h3>
        <span className={`text-xs font-semibold uppercase tracking-wide ${textColor}`}>
          {lmeVulnerability.band}
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-400">
        Exposure to uptier / drop-down value leakage (Serta · J.Crew · At Home playbook).
      </p>

      <div className="mt-4 flex items-end gap-3">
        <p className="text-3xl font-bold tabular-nums">{lmeVulnerability.score}</p>
        <p className="pb-1 text-xs text-slate-500">/ 100 — higher = more exposed</p>
      </div>
      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
        <div className={`h-2.5 ${barColor}`} style={{ width: `${lmeVulnerability.score}%` }} />
      </div>

      {lmeVulnerability.drivers.length > 0 ? (
        <ul className="mt-4 space-y-2 text-xs text-slate-300">
          {lmeVulnerability.drivers.map((d, i) => (
            <li key={i} className="flex gap-2">
              <span className={textColor}>▲</span>
              <span>{d}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-xs text-slate-400">No material documentation weaknesses flagged.</p>
      )}
    </article>
  );
}

export function RiskScoreGauge({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-signal.high' : score >= 40 ? 'bg-signal.medium' : 'bg-signal.low';

  return (
    <article className="panel rounded-xl p-4">
      <h3 className="text-sm font-medium">AI Credit Risk Score</h3>
      <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <p className="mt-3 text-3xl font-semibold">{score}</p>
      <p className="text-xs text-slate-400">0 = strongest, 100 = highest downside risk.</p>
    </article>
  );
}

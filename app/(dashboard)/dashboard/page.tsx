import { MetricCard } from '@/components/metric-card';
import { MaturityTimeline } from '@/components/maturity-timeline';
import { RiskScoreGauge } from '@/components/risk-score-gauge';

const maturityData = [
  { year: '2026', amount: '$450M', intensity: 35 },
  { year: '2027', amount: '$900M', intensity: 70 },
  { year: '2028', amount: '$1.1B', intensity: 85 }
];

const recentUploads = [
  { company: 'Asteria Networks', date: '2025-08-11', signal: 'Elevated leverage; margin pressure' },
  { company: 'Rutherford Packaging', date: '2025-08-09', signal: 'Stable liquidity; covenant headroom narrowing' }
];

export default function DashboardPage() {
  return (
    <section className="space-y-6 py-4">
      <header>
        <h1 className="text-2xl font-semibold">Credit Intelligence Dashboard</h1>
        <p className="text-sm text-slate-400">Live view of transcript-driven risk diagnostics.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-5">
        <MetricCard title="Revenue" value="-6.0% Y/Y" delta="Trend: decelerating" />
        <MetricCard title="EBITDA" value="-15.0% Y/Y" delta="Margin -210 bps" />
        <MetricCard title="FCF" value="$74M" delta="vs $132M prior-year" />
        <MetricCard title="Net Leverage" value="5.6x" delta="Above 5.0x threshold" />
        <MetricCard title="Liquidity" value="$1.1B" delta="<12 month runway watch" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <article className="panel rounded-xl p-4">
            <h2 className="text-sm font-medium">Recent Uploads</h2>
            <div className="mt-3 divide-y divide-slate-800">
              {recentUploads.map((upload) => (
                <div className="py-3" key={upload.company}>
                  <p className="font-medium">{upload.company}</p>
                  <p className="text-xs text-slate-400">{upload.date}</p>
                  <p className="mt-1 text-sm text-slate-300">{upload.signal}</p>
                </div>
              ))}
            </div>
          </article>
          <MaturityTimeline items={maturityData} />
        </div>
        <RiskScoreGauge score={72} />
      </div>
    </section>
  );
}

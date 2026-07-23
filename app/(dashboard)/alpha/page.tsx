'use client';

import { useMemo, useState } from 'react';
import { runAlphaEngine } from '@/lib/analytics/alpha-engine';
import { sampleCredit } from '@/lib/analytics/sample-credit';
import { CreditInputs, DocFlags } from '@/lib/analytics/types';
import { VerdictPanel } from '@/components/alpha/verdict-panel';
import { WaterfallChart } from '@/components/alpha/waterfall-chart';
import { MispricingGauge } from '@/components/alpha/mispricing-gauge';
import { LmeMeter } from '@/components/alpha/lme-meter';
import { MetricCard } from '@/components/metric-card';

const DOC_FLAG_LABELS: Record<keyof DocFlags, string> = {
  unrestrictedSubCapacity: 'Unrestricted-sub drop-down capacity',
  lacksSacredRightsProtection: 'No sacred-rights / uptier protection',
  largeRatioDebtCapacity: 'Large ratio / incremental baskets',
  weakLienProtection: 'Weak anti-layering protection',
  looseRestrictedPayments: 'Loose restricted-payment baskets',
  nonGuarantorLeakage: 'Non-guarantor EBITDA leakage',
  aggressiveSponsor: 'Aggressive LME-active sponsor'
};

function clone(c: CreditInputs): CreditInputs {
  return JSON.parse(JSON.stringify(c));
}

export default function AlphaEnginePage() {
  const [inputs, setInputs] = useState<CreditInputs>(() => clone(sampleCredit));
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  // The engine is pure & deterministic — recompute live on every input change.
  const output = useMemo(() => runAlphaEngine(inputs), [inputs]);

  const targetIdx = Math.max(0, inputs.capitalStructure.findIndex((t) => t.isTarget));

  const patch = (fn: (draft: CreditInputs) => void) => {
    setInputs((prev) => {
      const draft = clone(prev);
      fn(draft);
      return draft;
    });
  };

  const runFromTranscript = async () => {
    if (!transcript.trim()) return;
    setLoading(true);
    setNote(null);
    try {
      const res = await fetch('/api/alpha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcriptText: transcript })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setNote(body.error ?? 'Extraction unavailable — showing manual inputs.');
      } else {
        const data = (await res.json()) as { inputs: CreditInputs };
        if (data.inputs) {
          setInputs(data.inputs);
          setNote('Inputs extracted from transcript. Review and adjust the drivers below.');
        }
      }
    } catch {
      setNote('Extraction request failed — engine still runs on manual inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6 py-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-mutedBlue">Distress Alpha Engine</p>
          <h1 className="text-2xl font-semibold">{inputs.issuer}</h1>
          <p className="text-sm text-slate-400">
            {inputs.sector} · Analyzing {inputs.capitalStructure[targetIdx]?.name}
          </p>
        </div>
        <div className="text-right text-xs text-slate-500">
          Cross-capital-structure recovery, mispricing & LME risk — recomputed live.
        </div>
      </header>

      {/* Signal + key risk visuals */}
      <VerdictPanel output={output} />

      <div className="grid gap-4 md:grid-cols-5">
        <MetricCard title="Net Leverage" value={`${output.metrics.netLeverage}x`} delta={`Gross ${output.metrics.grossLeverage}x`} />
        <MetricCard title="Coverage" value={`${output.metrics.interestCoverage}x`} delta="EBITDA / cash interest" />
        <MetricCard title="Target YTM" value={`${output.target.ytmPct}%`} delta={`${output.target.spreadBps}bps OAS`} />
        <MetricCard title="Exp. Return" value={`${output.expectedReturn.annualizedPct}%/yr`} delta={`${output.expectedReturn.riskReward}:1 reward/risk`} />
        <MetricCard title="Downside" value={`${output.expectedReturn.lgdPoints} pts`} delta="to bear recovery" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <WaterfallChart tranches={output.waterfall} />
          <MispricingGauge output={output} />
        </div>
        <div className="space-y-4">
          <LmeMeter output={output} />
          <ScenarioTable output={output} />
        </div>
      </div>

      {/* Interactive driver controls */}
      <div className="grid gap-4 lg:grid-cols-3">
        <article className="panel rounded-xl p-4 lg:col-span-2">
          <h3 className="text-sm font-medium">Scenario Controls</h3>
          <p className="mt-1 text-xs text-slate-400">Stress the key drivers — the signal recomputes instantly.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Slider
              label="Target price (cents)"
              value={inputs.capitalStructure[targetIdx]?.priceCents ?? 0}
              min={5} max={110} step={1}
              onChange={(v) => patch((d) => { d.capitalStructure[targetIdx].priceCents = v; })}
            />
            <Slider
              label="EBITDA ($MM)"
              value={inputs.ebitdaMM}
              min={50} max={2000} step={10}
              onChange={(v) => patch((d) => { d.ebitdaMM = v; })}
            />
            <Slider
              label="Base EV multiple (x)"
              value={inputs.evMultipleBase}
              min={2} max={12} step={0.25}
              onChange={(v) => patch((d) => { d.evMultipleBase = v; })}
            />
            <Slider
              label="Bear EV multiple (x)"
              value={inputs.evMultipleBear}
              min={1.5} max={10} step={0.25}
              onChange={(v) => patch((d) => { d.evMultipleBear = v; })}
            />
            <Slider
              label="Revenue growth (% Y/Y)"
              value={inputs.revenueGrowthPct}
              min={-40} max={40} step={1}
              onChange={(v) => patch((d) => { d.revenueGrowthPct = v; })}
            />
            <Slider
              label="Annual FCF ($MM)"
              value={inputs.annualFcfMM}
              min={-500} max={500} step={5}
              onChange={(v) => patch((d) => { d.annualFcfMM = v; })}
            />
          </div>
        </article>

        <article className="panel rounded-xl p-4">
          <h3 className="text-sm font-medium">Documentation Flags</h3>
          <p className="mt-1 text-xs text-slate-400">Toggle covenant weaknesses that drive priming risk.</p>
          <div className="mt-3 space-y-2">
            {(Object.keys(DOC_FLAG_LABELS) as Array<keyof DocFlags>).map((key) => (
              <label key={key} className="flex cursor-pointer items-center justify-between gap-2 text-xs text-slate-300">
                <span>{DOC_FLAG_LABELS[key]}</span>
                <input
                  type="checkbox"
                  checked={inputs.docFlags[key]}
                  onChange={(e) => patch((d) => { d.docFlags[key] = e.target.checked; })}
                  className="h-4 w-4 accent-mutedBlue"
                />
              </label>
            ))}
          </div>
        </article>
      </div>

      {/* AI extraction from transcript */}
      <article className="panel rounded-xl p-4">
        <h3 className="text-sm font-medium">Seed from Transcript / Filing (AI extraction)</h3>
        <p className="mt-1 text-xs text-slate-400">
          Paste earnings-call or filing text to auto-populate the capital structure and drivers, then refine.
        </p>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Paste transcript text…"
          className="mt-3 h-32 w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm"
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={runFromTranscript}
            disabled={loading}
            className="rounded-md bg-mutedBlue px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? 'Extracting…' : 'Extract Inputs'}
          </button>
          <button
            onClick={() => { setInputs(clone(sampleCredit)); setNote('Reset to sample credit.'); }}
            className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-300"
          >
            Reset to Sample
          </button>
          {note && <span className="text-xs text-slate-400">{note}</span>}
        </div>
      </article>
    </section>
  );
}

function ScenarioTable({ output }: { output: ReturnType<typeof runAlphaEngine> }) {
  return (
    <article className="panel rounded-xl p-4">
      <h3 className="text-sm font-medium">EV Scenarios → Target Recovery</h3>
      <table className="mt-3 w-full text-xs">
        <thead>
          <tr className="text-left text-slate-500">
            <th className="pb-2 font-normal">Scenario</th>
            <th className="pb-2 text-right font-normal">EV ($MM)</th>
            <th className="pb-2 text-right font-normal">Mult.</th>
            <th className="pb-2 text-right font-normal">Recovery</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {output.scenarios.map((s) => (
            <tr key={s.label} className="text-slate-300">
              <td className="py-2">{s.label}</td>
              <td className="py-2 text-right tabular-nums">{s.evMM.toLocaleString()}</td>
              <td className="py-2 text-right tabular-nums">{s.evMultiple}x</td>
              <td className="py-2 text-right font-medium tabular-nums">{s.targetRecoveryCents}c</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-[11px] text-slate-500">
        Expected loss contribution {output.expectedReturn.expectedLossPct}%/yr · carry {output.expectedReturn.carryPct}% · pull-to-par {output.expectedReturn.pullToParPct}%.
      </p>
    </article>
  );
}

function Slider({
  label, value, min, max, step, onChange
}: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-slate-300">
        <span>{label}</span>
        <span className="tabular-nums text-slate-400">{value}</span>
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-mutedBlue"
      />
    </div>
  );
}

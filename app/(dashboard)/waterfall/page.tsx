'use client';

import { useState } from 'react';
import { WaterfallChart } from '@/components/waterfall-chart';
import { MetricCard } from '@/components/metric-card';
import { sampleCapitalStructure } from '@/lib/sample-capital-structure';
import { CapitalStructureTranche, WaterfallResult } from '@/lib/types';

type EditableTranche = {
  name: string;
  seniorityRank: string;
  claim: string;
  coupon: string;
  price: string;
  yearsToMaturity: string;
};

function toEditable(t: CapitalStructureTranche): EditableTranche {
  return {
    name: t.name,
    seniorityRank: String(t.seniorityRank),
    claim: String(t.claim),
    coupon: t.coupon !== undefined ? String(t.coupon) : '',
    price: t.price !== undefined ? String(t.price) : '',
    yearsToMaturity: t.yearsToMaturity !== undefined ? String(t.yearsToMaturity) : ''
  };
}

const numOrUndef = (v: string) => (v.trim() === '' ? undefined : Number(v));

export default function WaterfallPage() {
  const [company, setCompany] = useState(sampleCapitalStructure.companyName);
  const [enterpriseValue, setEnterpriseValue] = useState(String(sampleCapitalStructure.enterpriseValue));
  const [riskFreeRate, setRiskFreeRate] = useState(String(sampleCapitalStructure.riskFreeRate ?? 4.3));
  const [tranches, setTranches] = useState<EditableTranche[]>(
    sampleCapitalStructure.tranches.map(toEditable)
  );
  const [result, setResult] = useState<WaterfallResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateTranche = (index: number, field: keyof EditableTranche, value: string) => {
    setTranches((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  };

  const addTranche = () =>
    setTranches((prev) => [
      ...prev,
      { name: '', seniorityRank: String(prev.length + 1), claim: '', coupon: '', price: '', yearsToMaturity: '' }
    ]);

  const removeTranche = (index: number) =>
    setTranches((prev) => prev.filter((_, i) => i !== index));

  const runModel = async () => {
    setLoading(true);
    setError(null);

    const payload = {
      companyName: company,
      enterpriseValue: Number(enterpriseValue),
      riskFreeRate: Number(riskFreeRate),
      tranches: tranches
        .filter((t) => t.name.trim() !== '')
        .map((t) => ({
          name: t.name,
          seniorityRank: Number(t.seniorityRank),
          claim: Number(t.claim),
          coupon: numOrUndef(t.coupon),
          price: numOrUndef(t.price),
          yearsToMaturity: numOrUndef(t.yearsToMaturity)
        }))
    };

    const response = await fetch('/api/waterfall', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? 'Model run failed. Check inputs and subscription controls.');
      setLoading(false);
      return;
    }

    setResult((await response.json()) as WaterfallResult);
    setLoading(false);
  };

  return (
    <section className="space-y-6 py-4">
      <header>
        <h1 className="text-2xl font-semibold">Recovery Waterfall &amp; Relative Value</h1>
        <p className="text-sm text-slate-400">
          Model recovery across the capital structure in a default scenario, then test whether each
          tranche&apos;s spread compensates for its modeled loss-given-default.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <label className="panel rounded-xl p-3 text-sm">
          <span className="text-xs uppercase tracking-wide text-slate-400">Issuer</span>
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-800 bg-slate-950 px-2 py-1.5"
          />
        </label>
        <label className="panel rounded-xl p-3 text-sm">
          <span className="text-xs uppercase tracking-wide text-slate-400">Distressed Enterprise Value ($mm)</span>
          <input
            type="number"
            value={enterpriseValue}
            onChange={(e) => setEnterpriseValue(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-800 bg-slate-950 px-2 py-1.5 tabular-nums"
          />
        </label>
        <label className="panel rounded-xl p-3 text-sm">
          <span className="text-xs uppercase tracking-wide text-slate-400">Benchmark Risk-Free Yield (%)</span>
          <input
            type="number"
            value={riskFreeRate}
            onChange={(e) => setRiskFreeRate(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-800 bg-slate-950 px-2 py-1.5 tabular-nums"
          />
        </label>
      </div>

      <div className="panel overflow-x-auto rounded-xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium">Capital Structure</h2>
          <button onClick={addTranche} className="text-xs text-mutedBlue hover:text-white">
            + Add tranche
          </button>
        </div>
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="pb-2 pr-2">Tranche</th>
              <th className="pb-2 pr-2">Rank</th>
              <th className="pb-2 pr-2">Claim ($mm)</th>
              <th className="pb-2 pr-2">Coupon (%)</th>
              <th className="pb-2 pr-2">Price</th>
              <th className="pb-2 pr-2">Yrs</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {tranches.map((t, i) => (
              <tr key={i} className="border-t border-slate-800">
                <td className="py-1.5 pr-2">
                  <input
                    value={t.name}
                    onChange={(e) => updateTranche(i, 'name', e.target.value)}
                    className="w-40 rounded-md border border-slate-800 bg-slate-950 px-2 py-1"
                  />
                </td>
                {(['seniorityRank', 'claim', 'coupon', 'price', 'yearsToMaturity'] as const).map((field) => (
                  <td key={field} className="py-1.5 pr-2">
                    <input
                      type="number"
                      value={t[field]}
                      onChange={(e) => updateTranche(i, field, e.target.value)}
                      className="w-20 rounded-md border border-slate-800 bg-slate-950 px-2 py-1 tabular-nums"
                    />
                  </td>
                ))}
                <td className="py-1.5">
                  <button
                    onClick={() => removeTranche(i)}
                    className="text-xs text-slate-500 hover:text-signal-high"
                    aria-label={`Remove ${t.name || 'tranche'}`}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={runModel}
        disabled={loading}
        className="rounded-md bg-mutedBlue px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {loading ? 'Modeling…' : 'Run Waterfall Model'}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}

      {result && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard
              title="Value Coverage"
              value={`${(result.valueCoverage * 100).toFixed(0)}%`}
              delta={`EV $${result.enterpriseValue.toLocaleString()}mm vs claims $${result.totalClaims.toLocaleString()}mm`}
            />
            <MetricCard
              title="Fulcrum Security"
              value={result.fulcrumTranche ?? 'None'}
              delta={result.fulcrumTranche ? 'Value breaks here' : 'Fully covered or fully impaired'}
            />
            <MetricCard
              title="Total Claims"
              value={`$${result.totalClaims.toLocaleString()}mm`}
              delta="Aggregate debt at par"
            />
            <MetricCard
              title="Residual to Equity"
              value={`$${result.equityValue.toLocaleString()}mm`}
              delta={result.equityValue > 0 ? 'Equity in the money' : 'Equity impaired'}
            />
          </div>

          <div className="panel rounded-xl p-4">
            <h2 className="mb-4 text-sm font-medium">Recovery by Tranche</h2>
            <WaterfallChart recoveries={result.recoveries} />
          </div>

          <div className="panel overflow-x-auto rounded-xl p-4">
            <h2 className="mb-3 text-sm font-medium">Relative Value — Is the Spread Enough?</h2>
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-2 pr-3">Tranche</th>
                  <th className="pb-2 pr-3">YTM</th>
                  <th className="pb-2 pr-3">Spread</th>
                  <th className="pb-2 pr-3">Modeled Recovery</th>
                  <th className="pb-2 pr-3">Implied Ann. PD</th>
                  <th className="pb-2 pr-3">Cum. PD</th>
                  <th className="pb-2 pr-3">Exp. Loss</th>
                  <th className="pb-2">Risk-Adj. YTM</th>
                </tr>
              </thead>
              <tbody>
                {result.recoveries.map((r) => (
                  <tr key={r.name} className="border-t border-slate-800">
                    <td className="py-2 pr-3 font-medium">{r.name}</td>
                    {r.relativeValue ? (
                      <>
                        <td className="py-2 pr-3 tabular-nums">{r.relativeValue.ytm.toFixed(2)}%</td>
                        <td className="py-2 pr-3 tabular-nums">{r.relativeValue.spreadBps} bps</td>
                        <td className="py-2 pr-3 tabular-nums">{r.recoveryPct.toFixed(1)}%</td>
                        <td className="py-2 pr-3 tabular-nums">
                          {(r.relativeValue.impliedAnnualDefaultProb * 100).toFixed(1)}%
                        </td>
                        <td className="py-2 pr-3 tabular-nums">
                          {(r.relativeValue.cumulativeDefaultProb * 100).toFixed(1)}%
                        </td>
                        <td className="py-2 pr-3 tabular-nums">{r.relativeValue.expectedAnnualLoss.toFixed(2)}%</td>
                        <td className="py-2 tabular-nums">{r.relativeValue.riskAdjustedYtm.toFixed(2)}%</td>
                      </>
                    ) : (
                      <td colSpan={7} className="py-2 text-xs text-slate-500">
                        Add coupon, price and maturity to enable relative value.
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-slate-500">
              Implied default probability uses the credit triangle (spread ≈ PD × LGD) with LGD from each
              tranche&apos;s modeled recovery. Risk-adjusted YTM is yield net of expected annual credit loss.
            </p>
          </div>

          {result.narrative && (
            <div className="panel rounded-xl p-4">
              <h2 className="mb-2 text-sm font-medium">AI Analyst Read</h2>
              <p className="text-sm leading-relaxed text-slate-300">{result.narrative}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

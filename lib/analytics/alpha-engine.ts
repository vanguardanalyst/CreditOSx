import {
  AlphaEngineOutput,
  CreditInputs,
  DocFlags,
  Scenario,
  Tranche,
  TrancheAnalysis
} from './types';

// ---------------------------------------------------------------------------
// Distress Alpha Engine
//
// A deterministic, dependency-free model. Given a capital structure, issuer
// fundamentals, market prices and documentation flags it computes:
//   1. A recovery waterfall across the cap stack (base / bear / bull EV).
//   2. Market-implied vs. fundamental default probability -> mispricing edge.
//   3. Probability-weighted expected return and risk/reward.
//   4. An LME (liability-management) priming-vulnerability score.
//   5. A composite alpha score, verdict and auto-generated thesis.
//
// The math is intentionally transparent so an analyst can defend every number.
// ---------------------------------------------------------------------------

const SENIORITY: Record<Tranche['type'], number> = {
  'first-lien': 1,
  'second-lien': 2,
  unsecured: 3,
  subordinated: 4
};

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

function round(x: number, dp = 1): number {
  const f = 10 ** dp;
  return Math.round(x * f) / f;
}

function logistic(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

/** Distribute enterprise value top-down through the cap stack by seniority. */
function waterfallRecovery(sorted: Tranche[], evMM: number): number[] {
  let remaining = evMM;
  return sorted.map((t) => {
    const claim = t.amountMM;
    const allocated = Math.max(0, Math.min(claim, remaining));
    remaining -= allocated;
    // Recovery capped at par (100c); excess EV flows to equity, not to creditors.
    return claim > 0 ? clamp((allocated / claim) * 100, 0, 100) : 0;
  });
}

/** Approximate yield to maturity from price, coupon and tenor (cents on 100 face). */
function approxYtm(priceCents: number, couponPct: number, years: number): number {
  const t = Math.max(0.25, years);
  // Standard current-yield + amortized pull-to-par approximation.
  const annualPullToPar = (100 - priceCents) / t;
  const avgPrice = (priceCents + 100) / 2;
  return ((couponPct + annualPullToPar) / avgPrice) * 100;
}

function lmeScore(flags: DocFlags): { score: number; drivers: string[] } {
  // Weights reflect real-world value destruction observed in recent LMEs.
  const items: Array<[keyof DocFlags, number, string]> = [
    ['unrestrictedSubCapacity', 26, 'Unrestricted-sub / investment capacity enables collateral drop-down (J.Crew trapdoor).'],
    ['lacksSacredRightsProtection', 26, 'Majority amendments can uptier non-pro-rata — priming risk (Serta / Boardriders).'],
    ['largeRatioDebtCapacity', 16, 'Sizable ratio & incremental baskets can layer in super-priority debt.'],
    ['weakLienProtection', 12, 'No anti-layering / weak lien-subordination protection.'],
    ['looseRestrictedPayments', 8, 'Loose builder / RP baskets permit value leakage to equity.'],
    ['nonGuarantorLeakage', 8, 'Material EBITDA sits at non-guarantor entities outside the collateral net.'],
    ['aggressiveSponsor', 4, 'Aggressive sponsor with a coercive-LME track record.']
  ];
  let score = 0;
  const drivers: string[] = [];
  for (const [key, weight, text] of items) {
    if (flags[key]) {
      score += weight;
      drivers.push(text);
    }
  }
  return { score: clamp(score, 0, 100), drivers };
}

export function runAlphaEngine(inputs: CreditInputs, asOf = 'live'): AlphaEngineOutput {
  const stack = [...inputs.capitalStructure].sort(
    (a, b) => SENIORITY[a.type] - SENIORITY[b.type]
  );

  // --- Core leverage & coverage ---------------------------------------------
  const totalDebtMM = stack.reduce((s, t) => s + t.amountMM, 0);
  const netDebtMM = Math.max(0, totalDebtMM - inputs.liquidityMM);
  const cashInterestMM =
    inputs.cashInterestMM ??
    stack.reduce((s, t) => s + (t.amountMM * t.couponPct) / 100, 0);

  const ebitdaSafe = inputs.ebitdaMM > 0 ? inputs.ebitdaMM : 1e-6;
  const grossLeverage = clamp(totalDebtMM / ebitdaSafe, 0, 99);
  const netLeverage = clamp(netDebtMM / ebitdaSafe, 0, 99);
  const interestCoverage = clamp(inputs.ebitdaMM / Math.max(1e-6, cashInterestMM), 0, 99);
  const fcfToDebtPct = (inputs.annualFcfMM / Math.max(1e-6, totalDebtMM)) * 100;
  // Runway: how long liquidity covers a cash burn; if FCF positive, treat as ample.
  const annualBurn = inputs.annualFcfMM < 0 ? -inputs.annualFcfMM : 0;
  const liquidityRunwayMonths =
    annualBurn > 0 ? clamp((inputs.liquidityMM / annualBurn) * 12, 0, 120) : 120;

  // --- Recovery waterfall ---------------------------------------------------
  const evBaseMM = inputs.evMultipleBase * inputs.ebitdaMM;
  const evBearMM = inputs.evMultipleBear * inputs.ebitdaMM;
  const evBullMM = inputs.evMultipleBull * inputs.ebitdaMM;

  const recBase = waterfallRecovery(stack, evBaseMM);
  const recBear = waterfallRecovery(stack, evBearMM);
  const recBull = waterfallRecovery(stack, evBullMM);

  let cumulative = 0;
  const waterfall: TrancheAnalysis[] = stack.map((t, i) => {
    cumulative += t.amountMM;
    const leverageThrough = clamp(cumulative / ebitdaSafe, 0, 99);
    return {
      name: t.name,
      type: t.type,
      amountMM: t.amountMM,
      priceCents: t.priceCents,
      isTarget: Boolean(t.isTarget),
      leverageThrough: round(leverageThrough, 2),
      recoveryBaseCents: round(recBase[i], 0),
      recoveryBearCents: round(recBear[i], 0),
      recoveryBullCents: round(recBull[i], 0),
      downsidePoints: round(recBear[i] - t.priceCents, 0)
    };
  });

  // --- Target instrument ----------------------------------------------------
  const targetIdx = Math.max(0, stack.findIndex((t) => t.isTarget));
  const target = stack[targetIdx] ?? stack[stack.length - 1];
  const targetRecBase = recBase[targetIdx] ?? 0;
  const targetRecBear = recBear[targetIdx] ?? 0;

  const ytmPct = approxYtm(target.priceCents, target.couponPct, target.maturityYears);
  const spreadBps = Math.max(0, (ytmPct - inputs.benchmarkYieldPct) * 100);
  const horizonYears = Math.max(1, target.maturityYears);

  const scenarios: Scenario[] = [
    { label: 'Bear (liquidation)', evMM: round(evBearMM, 0), evMultiple: inputs.evMultipleBear, targetRecoveryCents: round(targetRecBear, 0) },
    { label: 'Base', evMM: round(evBaseMM, 0), evMultiple: inputs.evMultipleBase, targetRecoveryCents: round(targetRecBase, 0) },
    { label: 'Bull', evMM: round(evBullMM, 0), evMultiple: inputs.evMultipleBull, targetRecoveryCents: round(recBull[targetIdx] ?? 0, 0) }
  ];

  // --- Market-implied default probability (credit triangle) -----------------
  // hazard lambda ~= spread / (1 - recovery); use bear-case recovery as LGD anchor.
  const recForImplied = clamp(targetRecBear / 100, 0.05, 0.95);
  const lambdaImplied = spreadBps / 10000 / Math.max(0.05, 1 - recForImplied);
  const impliedCum = 1 - Math.exp(-lambdaImplied * horizonYears);

  // --- Fundamental default probability (calibrated logistic hazard) ---------
  // z rises with distress. Coefficients calibrated so a healthy BB ~1-2%/yr and a
  // stressed CCC ~15-30%/yr annualized default.
  const z =
    -4.1 +
    0.62 * Math.max(0, netLeverage - 3) + // leverage above 3x bites
    0.9 * Math.max(0, 1.8 - interestCoverage) + // coverage below ~1.8x
    0.05 * Math.max(0, 18 - liquidityRunwayMonths) + // runway under 18 months
    0.04 * Math.max(0, -fcfToDebtPct) + // negative FCF/debt
    0.05 * Math.max(0, -inputs.revenueGrowthPct); // revenue decline
  const lambdaFundamental = clamp(logistic(z), 0.002, 0.6);
  const fundamentalCum = 1 - Math.exp(-lambdaFundamental * horizonYears);

  // --- Mispricing -----------------------------------------------------------
  // Fair value = prob-weighted terminal (survive -> par, default -> recovery)
  // discounted back at the benchmark, plus carry.
  const survive = 1 - fundamentalCum;
  const terminal = survive * 100 + fundamentalCum * targetRecBear;
  const carryCents = target.couponPct * horizonYears * (1 - 0.5 * fundamentalCum);
  const discount = 1 / (1 + inputs.benchmarkYieldPct / 100) ** horizonYears;
  const fairValueCents = clamp((terminal + carryCents) * discount, 0, 130);
  const edgePoints = fairValueCents - target.priceCents;
  const ratio = impliedCum / Math.max(1e-4, fundamentalCum);
  const priceVerdict = edgePoints > 4 ? 'CHEAP' : edgePoints < -4 ? 'RICH' : 'FAIR';

  // --- Expected return ------------------------------------------------------
  const carryPct = (target.couponPct / target.priceCents) * 100 * (1 - 0.5 * fundamentalCum);
  const expTerminal = survive * 100 + fundamentalCum * targetRecBear;
  const pullToParPct = ((expTerminal - target.priceCents) / target.priceCents) * 100 / horizonYears;
  const annualizedPct = carryPct + pullToParPct;
  const lgdPoints = target.priceCents - targetRecBear; // points lost if it breaks to bear recovery
  const expectedLossPct = (-(fundamentalCum * Math.max(0, lgdPoints)) / target.priceCents) * 100 / horizonYears;
  const downsideRisk = Math.max(1, fundamentalCum * Math.max(0, lgdPoints));
  const riskReward = (annualizedPct * target.priceCents) / 100 / downsideRisk;

  // --- LME vulnerability ----------------------------------------------------
  const { score: lmeRaw, drivers } = lmeScore(inputs.docFlags);
  const lmeBand =
    lmeRaw >= 70 ? 'SEVERE' : lmeRaw >= 45 ? 'HIGH' : lmeRaw >= 20 ? 'MODERATE' : 'LOW';

  // --- Composite alpha score ------------------------------------------------
  // Blend value (cheapness), expected return, downside cushion, and penalize
  // fundamental default risk and LME exposure.
  const valuePts = clamp(50 + edgePoints * 2.2, 0, 100); // 50 = fairly priced
  const returnPts = clamp(annualizedPct * 3.2, 0, 100);
  const cushionPts = clamp(targetRecBear - target.priceCents + 55, 0, 100); // bear recovery vs price
  const riskPenalty = clamp(fundamentalCum * 100, 0, 100);
  const lmePenalty = lmeRaw;

  const alphaScore = clamp(
    0.32 * valuePts +
      0.28 * returnPts +
      0.2 * cushionPts +
      0.1 * (100 - riskPenalty) +
      0.1 * (100 - lmePenalty),
    0,
    100
  );

  const verdict =
    alphaScore >= 74 ? 'STRONG BUY' :
    alphaScore >= 60 ? 'BUY' :
    alphaScore >= 45 ? 'HOLD' :
    alphaScore >= 32 ? 'REDUCE' : 'AVOID / SHORT';

  const conviction: 'High' | 'Medium' | 'Low' =
    Math.abs(edgePoints) > 10 && lmeRaw < 45 ? 'High' :
    Math.abs(edgePoints) > 5 ? 'Medium' : 'Low';

  // --- Thesis narrative -----------------------------------------------------
  const thesis: string[] = [];
  thesis.push(
    `${target.name} at ${round(target.priceCents, 0)}c yields ~${round(ytmPct)}% (${Math.round(spreadBps)}bps OAS) vs a model fair value of ${round(fairValueCents, 0)}c — ${edgePoints >= 0 ? '+' : ''}${round(edgePoints, 0)} pts of ${priceVerdict === 'CHEAP' ? 'upside' : priceVerdict === 'RICH' ? 'downside' : 'edge'}.`
  );
  thesis.push(
    `Market prices a ${round(impliedCum * 100)}% cumulative default probability vs the model's ${round(fundamentalCum * 100)}% — the Street is ${ratio > 1.15 ? 'over-discounting' : ratio < 0.85 ? 'complacent on' : 'roughly fair on'} this credit.`
  );
  thesis.push(
    `Bear-case (${inputs.evMultipleBear}x) recovery on the target is ${round(targetRecBear, 0)}c, implying ${lgdPoints > 0 ? `${round(lgdPoints, 0)} pts of downside` : 'a covered basis'} if it breaks. Attachment leverage through the tranche is ${round((waterfall[targetIdx]?.leverageThrough ?? netLeverage), 1)}x.`
  );
  if (lmeRaw >= 45) {
    thesis.push(
      `⚠ LME priming vulnerability is ${lmeBand} (${Math.round(lmeRaw)}/100): ${drivers[0] ?? 'weak creditor protections'} Size positions assuming a coercive exchange is on the table.`
    );
  } else if (lmeRaw >= 20) {
    thesis.push(`Documentation offers moderate protection (LME score ${Math.round(lmeRaw)}/100); watch incremental-debt and unrestricted-sub capacity.`);
  } else {
    thesis.push(`Documentation is comparatively tight (LME score ${Math.round(lmeRaw)}/100) — low risk of being primed out of the money.`);
  }
  thesis.push(
    `Base-case expected return ~${round(annualizedPct)}%/yr with a ${round(riskReward, 2)}:1 reward-to-downside ratio. Net leverage ${round(netLeverage, 1)}x, coverage ${round(interestCoverage, 1)}x, runway ${liquidityRunwayMonths >= 120 ? '10y+' : `${Math.round(liquidityRunwayMonths)}mo`}.`
  );

  return {
    issuer: inputs.issuer,
    sector: inputs.sector,
    asOf,
    metrics: {
      totalDebtMM: round(totalDebtMM, 0),
      netDebtMM: round(netDebtMM, 0),
      grossLeverage: round(grossLeverage, 2),
      netLeverage: round(netLeverage, 2),
      interestCoverage: round(interestCoverage, 2),
      fcfToDebtPct: round(fcfToDebtPct, 1),
      liquidityRunwayMonths: Math.round(liquidityRunwayMonths)
    },
    waterfall,
    scenarios,
    target: {
      name: target.name,
      priceCents: target.priceCents,
      couponPct: target.couponPct,
      maturityYears: target.maturityYears,
      ytmPct: round(ytmPct),
      spreadBps: Math.round(spreadBps)
    },
    defaultRisk: {
      impliedPct: round(impliedCum * 100),
      fundamentalPct: round(fundamentalCum * 100),
      fundamentalAnnualPct: round(lambdaFundamental * 100),
      horizonYears: round(horizonYears, 1)
    },
    mispricing: {
      ratio: round(ratio, 2),
      fairValueCents: round(fairValueCents, 0),
      edgePoints: round(edgePoints, 0),
      verdict: priceVerdict
    },
    expectedReturn: {
      annualizedPct: round(annualizedPct),
      carryPct: round(carryPct),
      pullToParPct: round(pullToParPct),
      expectedLossPct: round(expectedLossPct),
      riskReward: round(riskReward, 2),
      lgdPoints: round(lgdPoints, 0)
    },
    lmeVulnerability: {
      score: Math.round(lmeRaw),
      band: lmeBand,
      drivers
    },
    signal: {
      alphaScore: Math.round(alphaScore),
      verdict,
      conviction,
      thesis
    }
  };
}

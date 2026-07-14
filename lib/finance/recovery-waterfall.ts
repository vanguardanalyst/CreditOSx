import {
  CapitalStructureTranche,
  TrancheRecovery,
  TrancheRelativeValue,
  WaterfallInput,
  WaterfallResult
} from '@/lib/types';

const DEFAULT_RISK_FREE = 4.3;

/**
 * Approximate yield to maturity for a bullet bond quoted per 100 of face.
 * Uses the standard analyst shortcut:
 *   YTM ≈ (coupon + (100 - price) / years) / ((100 + price) / 2)
 * Good enough for relative-value screening without an IRR solver.
 */
function approximateYtm(price: number, coupon: number, years: number): number {
  if (price <= 0 || years <= 0) return coupon;
  const annualizedPull = (100 - price) / years;
  const averagePrice = (100 + price) / 2;
  return ((coupon + annualizedPull) / averagePrice) * 100;
}

/**
 * Relative value for a single tranche, tying its modeled recovery back to the
 * spread the market is paying. Built on the "credit triangle": spread ≈ PD × LGD.
 */
function computeRelativeValue(
  tranche: CapitalStructureTranche,
  recoveryFraction: number,
  riskFreeRate: number
): TrancheRelativeValue | null {
  const { coupon, price, yearsToMaturity } = tranche;
  if (coupon === undefined || price === undefined || yearsToMaturity === undefined) {
    return null;
  }

  const ytm = approximateYtm(price, coupon, yearsToMaturity);
  const spreadBps = Math.round((ytm - riskFreeRate) * 100);
  const spreadDecimal = Math.max(spreadBps, 0) / 10000;

  // Loss given default from the modeled recovery. Floor LGD so a ~full-recovery
  // tranche does not produce a meaningless (near-infinite) implied default rate.
  const lgd = clamp(1 - recoveryFraction, 0.05, 1);

  const impliedAnnualDefaultProb = clamp(spreadDecimal / lgd, 0, 1);
  const years = Math.max(yearsToMaturity, 0.01);
  const cumulativeDefaultProb = 1 - Math.pow(1 - impliedAnnualDefaultProb, years);
  const expectedAnnualLoss = impliedAnnualDefaultProb * lgd * 100;
  const riskAdjustedYtm = ytm - expectedAnnualLoss;
  const breakevenAnnualDefaultRate = clamp(spreadDecimal / lgd, 0, 1);

  return {
    ytm: round(ytm, 2),
    spreadBps,
    lgd: round(lgd, 4),
    impliedAnnualDefaultProb: round(impliedAnnualDefaultProb, 4),
    cumulativeDefaultProb: round(cumulativeDefaultProb, 4),
    expectedAnnualLoss: round(expectedAnnualLoss, 2),
    riskAdjustedYtm: round(riskAdjustedYtm, 2),
    breakevenAnnualDefaultRate: round(breakevenAnnualDefaultRate, 4)
  };
}

/**
 * Absolute-priority recovery waterfall. Distributable enterprise value cascades
 * down the capital structure by seniority; tranches sharing a rank recover
 * pari passu (pro-rata) when value is insufficient to cover the group in full.
 * Whatever survives the debt stack flows to equity.
 */
export function computeWaterfall(input: WaterfallInput): WaterfallResult {
  const riskFreeRate = input.riskFreeRate ?? DEFAULT_RISK_FREE;
  const sorted = [...input.tranches].sort((a, b) => a.seniorityRank - b.seniorityRank);

  const totalClaims = sorted.reduce((sum, t) => sum + t.claim, 0);
  let remaining = Math.max(input.enterpriseValue, 0);
  let cumulativeClaim = 0;

  // Bucket tranches into pari-passu groups keyed by seniority rank.
  const groups = new Map<number, CapitalStructureTranche[]>();
  for (const tranche of sorted) {
    const bucket = groups.get(tranche.seniorityRank) ?? [];
    bucket.push(tranche);
    groups.set(tranche.seniorityRank, bucket);
  }

  const recoveries: TrancheRecovery[] = [];

  for (const rank of [...groups.keys()].sort((a, b) => a - b)) {
    const bucket = groups.get(rank)!;
    const groupClaim = bucket.reduce((sum, t) => sum + t.claim, 0);
    const available = Math.min(remaining, groupClaim);
    remaining -= available;

    for (const tranche of bucket) {
      // Pro-rata share within the pari-passu group.
      const share = groupClaim > 0 ? (available * tranche.claim) / groupClaim : 0;
      const recoveryPct = tranche.claim > 0 ? (share / tranche.claim) * 100 : 0;
      cumulativeClaim += tranche.claim;

      recoveries.push({
        name: tranche.name,
        seniorityRank: tranche.seniorityRank,
        claim: tranche.claim,
        recoveryAmount: round(share, 2),
        recoveryPct: round(recoveryPct, 2),
        cumulativeClaim: round(cumulativeClaim, 2),
        isFulcrum: recoveryPct > 0 && recoveryPct < 100,
        relativeValue: computeRelativeValue(tranche, share / Math.max(tranche.claim, 1e-9), riskFreeRate)
      });
    }
  }

  const fulcrum = recoveries.find((r) => r.isFulcrum) ?? null;

  return {
    companyName: input.companyName,
    enterpriseValue: input.enterpriseValue,
    totalClaims: round(totalClaims, 2),
    valueCoverage: totalClaims > 0 ? round(input.enterpriseValue / totalClaims, 4) : 0,
    fulcrumTranche: fulcrum?.name ?? null,
    equityValue: round(remaining, 2),
    recoveries,
    narrative: null
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

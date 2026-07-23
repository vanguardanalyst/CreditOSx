// Distress Alpha Engine — type definitions.
// A deterministic, dependency-free credit model for high-yield / distressed investors.

export type TrancheType = 'first-lien' | 'second-lien' | 'unsecured' | 'subordinated';

export interface Tranche {
  /** Instrument label, e.g. "1L Term Loan B" or "6.5% Sr Notes '28". */
  name: string;
  type: TrancheType;
  /** Face amount outstanding, in $ millions. */
  amountMM: number;
  /** Coupon, percent (e.g. 6.5). */
  couponPct: number;
  /** Years to maturity. */
  maturityYears: number;
  /** Current market price, cents on the dollar (e.g. 78 = 78c). */
  priceCents: number;
  /** True for the tranche the investor is analyzing / holds. */
  isTarget?: boolean;
}

export interface CreditInputs {
  issuer: string;
  sector: string;
  /** LTM EBITDA, $MM. */
  ebitdaMM: number;
  /** Balance-sheet cash & available liquidity (revolver undrawn + cash), $MM. */
  liquidityMM: number;
  /** Annual free cash flow (after interest + capex), $MM. Can be negative. */
  annualFcfMM: number;
  /** Revenue growth, percent Y/Y (can be negative). */
  revenueGrowthPct: number;
  /** Cash interest expense per year, $MM. If omitted it is derived from coupons. */
  cashInterestMM?: number;
  /** Enterprise value as a multiple of EBITDA in the base case (e.g. 6.0x). */
  evMultipleBase: number;
  /** Downside / liquidation stress multiple (e.g. 4.0x). */
  evMultipleBear: number;
  /** Upside multiple (e.g. 7.5x). */
  evMultipleBull: number;
  /** Risk-free / benchmark yield, percent, for spread math (e.g. 4.2). */
  benchmarkYieldPct: number;
  capitalStructure: Tranche[];
  /** Documentation / covenant vulnerability flags (creditor-protection lens). */
  docFlags: DocFlags;
}

/**
 * Liability-management (LME) doc flags. These drive the priming-vulnerability
 * score — the frontier edge for HY credit post Serta / J.Crew / At Home / Envision.
 * All are scored from the *creditor* perspective: true = weaker protection / more
 * exposed to getting primed or having value leak away.
 */
export interface DocFlags {
  /** Unrestricted-subsidiary / investment capacity to move collateral out (J.Crew drop-down). */
  unrestrictedSubCapacity: boolean;
  /** Amendments allow non-pro-rata uptiering without all-lender consent (Serta uptier). */
  lacksSacredRightsProtection: boolean;
  /** Large ratio/incremental debt baskets that can prime existing lenders. */
  largeRatioDebtCapacity: boolean;
  /** No anti-layering / weak lien-subordination protection. */
  weakLienProtection: boolean;
  /** Loose builder / restricted-payment baskets enabling value leakage. */
  looseRestrictedPayments: boolean;
  /** Material EBITDA / collateral sits at non-guarantor entities. */
  nonGuarantorLeakage: boolean;
  /** Aggressive PE sponsor with LME track record. */
  aggressiveSponsor: boolean;
}

// ---- Outputs ----

export interface TrancheAnalysis {
  name: string;
  type: TrancheType;
  amountMM: number;
  priceCents: number;
  isTarget: boolean;
  /** Cumulative debt through this tranche / EBITDA (attachment leverage). */
  leverageThrough: number;
  /** Recovery in the base EV case, cents on the dollar (0-100). */
  recoveryBaseCents: number;
  recoveryBearCents: number;
  recoveryBullCents: number;
  /** Downside to recovery from current price, points (negative = loss). */
  downsidePoints: number;
}

export interface Scenario {
  label: string;
  evMM: number;
  evMultiple: number;
  /** Recovery on the target tranche, cents. */
  targetRecoveryCents: number;
}

export interface AlphaEngineOutput {
  issuer: string;
  sector: string;
  asOf: string;

  metrics: {
    totalDebtMM: number;
    netDebtMM: number;
    grossLeverage: number;
    netLeverage: number;
    interestCoverage: number;
    fcfToDebtPct: number;
    liquidityRunwayMonths: number;
  };

  waterfall: TrancheAnalysis[];
  scenarios: Scenario[];

  target: {
    name: string;
    priceCents: number;
    couponPct: number;
    maturityYears: number;
    /** Approx yield-to-maturity, percent. */
    ytmPct: number;
    /** Credit spread over benchmark, bps. */
    spreadBps: number;
  };

  defaultRisk: {
    /** Market-implied cumulative default probability to horizon, percent. */
    impliedPct: number;
    /** Fundamental (model) cumulative default probability to horizon, percent. */
    fundamentalPct: number;
    /** Annualized fundamental hazard, percent. */
    fundamentalAnnualPct: number;
    horizonYears: number;
  };

  mispricing: {
    /** implied / fundamental. >1 = market too bearish (cheap). <1 = complacent (rich). */
    ratio: number;
    /** Model fair price, cents. */
    fairValueCents: number;
    /** fairValue - price, points. Positive = undervalued. */
    edgePoints: number;
    verdict: 'CHEAP' | 'FAIR' | 'RICH';
  };

  expectedReturn: {
    /** Annualized total expected return, percent. */
    annualizedPct: number;
    carryPct: number;
    pullToParPct: number;
    /** Expected loss contribution, percent (negative). */
    expectedLossPct: number;
    /** Return / downside risk ratio (Sharpe-like). */
    riskReward: number;
    /** Loss given default from current price, points. */
    lgdPoints: number;
  };

  lmeVulnerability: {
    /** 0-100, higher = more exposed to priming / value leakage. */
    score: number;
    band: 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';
    drivers: string[];
  };

  signal: {
    /** Composite conviction 0-100. */
    alphaScore: number;
    verdict: 'STRONG BUY' | 'BUY' | 'HOLD' | 'REDUCE' | 'AVOID / SHORT';
    conviction: 'High' | 'Medium' | 'Low';
    thesis: string[];
  };
}

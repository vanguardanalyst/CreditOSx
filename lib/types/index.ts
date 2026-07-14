export type SubscriptionStatus = 'free' | 'pro';

export interface MaturityDataPoint {
  year: string;
  amount: string;
  intensity: number;
}

export interface CapitalStructureTranche {
  /** Human label, e.g. "1st Lien Term Loan" */
  name: string;
  /** 1 = most senior. Tranches sharing a rank are treated as pari passu. */
  seniorityRank: number;
  /** Face / claim amount in $mm. */
  claim: number;
  /** Annual coupon, points per 100 of face (optional — enables relative value). */
  coupon?: number;
  /** Current market price per 100 of face (optional — enables relative value). */
  price?: number;
  /** Years to maturity (optional — enables relative value). */
  yearsToMaturity?: number;
}

export interface WaterfallInput {
  companyName: string;
  /** Distributable enterprise value in a default/restructuring scenario ($mm). */
  enterpriseValue: number;
  /** Benchmark risk-free yield in %, used for spread math (default 4.3). */
  riskFreeRate?: number;
  tranches: CapitalStructureTranche[];
}

export interface TrancheRelativeValue {
  /** Approximate yield to maturity, %. */
  ytm: number;
  /** Spread to the benchmark, basis points. */
  spreadBps: number;
  /** Loss given default implied by the modeled recovery, 0-1. */
  lgd: number;
  /** Annual default probability the spread implies given the modeled LGD, 0-1. */
  impliedAnnualDefaultProb: number;
  /** Cumulative default probability to maturity, 0-1. */
  cumulativeDefaultProb: number;
  /** Expected annualized credit loss, %. */
  expectedAnnualLoss: number;
  /** YTM net of expected annual loss — the return you actually keep, %. */
  riskAdjustedYtm: number;
  /** Annual default rate that fully erases the spread cushion, 0-1. */
  breakevenAnnualDefaultRate: number;
}

export interface TrancheRecovery {
  name: string;
  seniorityRank: number;
  claim: number;
  /** Value allocated to this tranche in the waterfall ($mm). */
  recoveryAmount: number;
  /** Recovery as a percent of claim, 0-100. */
  recoveryPct: number;
  /** This claim plus all more-senior claims ($mm). */
  cumulativeClaim: number;
  /** True for the tranche where value breaks (partial recovery). */
  isFulcrum: boolean;
  /** Present only when coupon, price and maturity are supplied. */
  relativeValue: TrancheRelativeValue | null;
}

export interface WaterfallResult {
  companyName: string;
  enterpriseValue: number;
  totalClaims: number;
  /** Coverage of total claims by enterprise value, e.g. 0.78 = 78%. */
  valueCoverage: number;
  fulcrumTranche: string | null;
  /** Residual value flowing to equity ($mm). */
  equityValue: number;
  recoveries: TrancheRecovery[];
  /** Optional AI qualitative overlay; null when unavailable. */
  narrative: string | null;
}

export interface AnalysisOutput {
  earningsSummary: {
    highlights: string[];
    yearOverYear: {
      revenue: string;
      ebitda: string;
      fcf: string;
      marginDelta: string;
    };
  };
  leverageLiquidity: {
    netLeverage: string;
    liquidityRunway: string;
    commentary: string;
  };
  covenantFlexibility: {
    summary: string;
    concerns: string[];
  };
  exchangeOfferModeling: {
    summary: string;
    recoveryImpact: string;
  };
  capitalAllocation: {
    posture: string;
    commentary: string;
  };
  distressedFlags: {
    flags: string[];
  };
  maturityWall: MaturityDataPoint[];
  riskScore: {
    score: number;
    explanation: string;
  };
}

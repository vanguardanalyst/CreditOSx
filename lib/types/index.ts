export type SubscriptionStatus = 'free' | 'pro';

export interface MaturityDataPoint {
  year: string;
  amount: string;
  intensity: number;
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

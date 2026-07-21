import { CreditInputs } from './types';

// A realistic single-B / stressed situation used to seed the Alpha Engine UI.
export const sampleCredit: CreditInputs = {
  issuer: 'Asteria Networks',
  sector: 'Telecom / Fiber',
  ebitdaMM: 640,
  liquidityMM: 410,
  annualFcfMM: -85,
  revenueGrowthPct: -6,
  cashInterestMM: 295,
  evMultipleBase: 6.0,
  evMultipleBear: 4.25,
  evMultipleBull: 7.5,
  benchmarkYieldPct: 4.2,
  capitalStructure: [
    { name: '1L Term Loan B (SOFR+375)', type: 'first-lien', amountMM: 1850, couponPct: 8.6, maturityYears: 3.2, priceCents: 92 },
    { name: '1L Sr Secured Notes 7.25% ’29', type: 'first-lien', amountMM: 700, couponPct: 7.25, maturityYears: 3.4, priceCents: 88 },
    { name: '2L Notes 9.5% ’30', type: 'second-lien', amountMM: 900, couponPct: 9.5, maturityYears: 4.1, priceCents: 71, isTarget: true },
    { name: 'Sr Unsecured 6.5% ’28', type: 'unsecured', amountMM: 750, couponPct: 6.5, maturityYears: 2.5, priceCents: 54 }
  ],
  docFlags: {
    unrestrictedSubCapacity: true,
    lacksSacredRightsProtection: true,
    largeRatioDebtCapacity: true,
    weakLienProtection: false,
    looseRestrictedPayments: true,
    nonGuarantorLeakage: false,
    aggressiveSponsor: true
  }
};

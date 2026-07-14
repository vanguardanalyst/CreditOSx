import { WaterfallInput } from '@/lib/types';

/**
 * Illustrative stressed capital structure for a mid-cap high-yield issuer.
 * Enterprise value is set below total claims so the waterfall demonstrates a
 * fulcrum tranche and impaired subordinated recovery.
 */
export const sampleCapitalStructure: WaterfallInput = {
  companyName: 'Asteria Networks',
  enterpriseValue: 1850,
  riskFreeRate: 4.3,
  tranches: [
    { name: 'Revolver (1st Lien)', seniorityRank: 1, claim: 250, coupon: 8.5, price: 99.5, yearsToMaturity: 3 },
    { name: '1st Lien Term Loan B', seniorityRank: 1, claim: 900, coupon: 9.25, price: 97.0, yearsToMaturity: 4 },
    { name: '2nd Lien Notes', seniorityRank: 2, claim: 600, coupon: 11.0, price: 78.0, yearsToMaturity: 5 },
    { name: 'Senior Unsecured Notes', seniorityRank: 3, claim: 750, coupon: 7.75, price: 41.0, yearsToMaturity: 3 },
    { name: 'Subordinated Notes', seniorityRank: 4, claim: 300, coupon: 6.5, price: 18.0, yearsToMaturity: 6 }
  ]
};

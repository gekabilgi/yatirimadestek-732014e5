
export interface IncentiveCalculatorInputs {
  incentiveType: 'Technology Initiative' | 'Local Development Initiative' | 'Strategic Initiative';
  province: string;
  numberOfEmployees: number;
  landCost: number;
  constructionCost: number;
  importedMachineryCost: number;
  domesticMachineryCost: number;
  otherExpenses: number;
  bankInterestRate: number;
  supportPreference: 'Interest/Profit Share Support' | 'Machinery Support';
  loanAmount: number;
  loanTermMonths: number;
  sectorCategory: 'Target Sector' | 'Other Sector' | 'Both';
}

export interface IncentiveCalculatorResults {
  totalFixedInvestment: number;
  sgkEmployerPremiumSupport: number;
  sgkEmployeePremiumSupport: number;
  machinerySupportAmount: number;
  interestProfitShareSupportAmount: number;
  taxReductionInvestmentContribution: number;
  vatCustomsExemption: string;
  isEligible: boolean;
  validationErrors: string[];
  warningMessages?: string[];
}

export interface AdminParameters {
  minimumFixedInvestmentAmount: number;
  bankInterestRate: number;
}

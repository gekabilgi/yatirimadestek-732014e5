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
  taxReductionSupport: 'Yes' | 'No';
}

export interface PaymentPlanDetail {
  taksitNo: number;
  taksitTutari: number;
  anaparaOdemesi: number;
  faizTutari: number;
  bsmv: number;
  kkdf: number;
  kalanAnapara: number;
}

export interface IncentiveCalculatorResults {
  totalFixedInvestment: number;
  sgkEmployerPremiumSupport: number;
  sgkEmployeePremiumSupport: number;
  machinerySupportAmount: number;
  interestProfitShareSupportAmount: number;
  totalInterestAmount: number;
  taxReductionInvestmentContribution: number;
  vatCustomsExemption: string;
  isEligible: boolean;
  validationErrors: string[];
  warningMessages?: string[];
  paymentPlan?: PaymentPlanDetail[];
}

export interface AdminParameters {
  minimumFixedInvestmentAmount: number;
  bankInterestRate: number;
}

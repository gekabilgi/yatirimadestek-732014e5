export interface AdminSetting {
  id: string;
  setting_key: string;
  setting_value: number;
  description?: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface IncentiveCalculationSettings {
  sgk_employer_premium_rate: number;
  sgk_employee_premium_rate: number;
}

export interface AdminParameters {
  minimumFixedInvestmentAmount: number;
  bankInterestRate: number;
  sgkEmployerPremiumRate: number;
  sgkEmployeePremiumRate: number;
}
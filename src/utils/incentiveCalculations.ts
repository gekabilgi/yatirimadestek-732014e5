
import { IncentiveCalculatorInputs, IncentiveCalculatorResults } from '@/types/incentiveCalculator';

const SGK_EMPLOYER_PREMIUM_RATE = 4355.92;
const SGK_EMPLOYEE_PREMIUM_RATE = 3640.77;
const REGION_6_PROVINCES = ['Ağrı', 'Ardahan', 'Batman', 'Bingöl', 'Bitlis', 'Diyarbakır', 'Elazığ', 'Erzincan', 'Erzurum', 'Hakkari', 'Iğdır', 'Kars', 'Mardin', 'Muş', 'Siirt', 'Şırnak', 'Tunceli', 'Van'];

export const calculateIncentives = (inputs: IncentiveCalculatorInputs): IncentiveCalculatorResults => {
  const validationErrors: string[] = [];
  
  // Calculate total fixed investment
  const totalFixedInvestment = inputs.landCost + inputs.constructionCost + 
    inputs.importedMachineryCost + inputs.domesticMachineryCost + inputs.otherExpenses;

  // Validation: Check minimum investment requirement
  if (totalFixedInvestment < inputs.minimumFixedInvestment) {
    validationErrors.push(
      `Toplam sabit yatırım tutarı minimum ${inputs.minimumFixedInvestment.toLocaleString('tr-TR')} TL olmalıdır. Mevcut tutar: ${totalFixedInvestment.toLocaleString('tr-TR')} TL`
    );
  }

  if (inputs.numberOfEmployees <= 0) {
    validationErrors.push('Çalışan sayısı 0\'dan büyük olmalıdır.');
  }

  if (validationErrors.length > 0) {
    return {
      totalFixedInvestment,
      sgkEmployerPremiumSupport: 0,
      sgkEmployeePremiumSupport: 0,
      machinerySupportAmount: 0,
      interestProfitShareSupportAmount: 0,
      taxReductionInvestmentContribution: 0,
      vatCustomsExemption: 'MEVCUT',
      isEligible: false,
      validationErrors
    };
  }

  // Determine if province is in Region 6
  const isRegion6 = REGION_6_PROVINCES.includes(inputs.province);

  // Calculate SGK Employer Premium Support
  const sgkEmployerPremiumSupport = isRegion6
    ? 144 * SGK_EMPLOYER_PREMIUM_RATE * inputs.numberOfEmployees
    : 96 * (SGK_EMPLOYER_PREMIUM_RATE / 2) * inputs.numberOfEmployees;

  // Calculate SGK Employee Premium Support (only for Region 6)
  const sgkEmployeePremiumSupport = isRegion6
    ? 120 * SGK_EMPLOYEE_PREMIUM_RATE * inputs.numberOfEmployees
    : 0;

  // Calculate Machinery Support
  const totalMachineryCost = inputs.importedMachineryCost + inputs.domesticMachineryCost;
  const machinerySupportCalculated = totalMachineryCost * 0.25;
  const machinerySupportLimit = totalFixedInvestment * 0.15;
  const machinerySupportAmount = inputs.supportPreference === 'Machinery Support' 
    ? Math.min(machinerySupportCalculated, machinerySupportLimit)
    : 0;

  // Calculate Interest/Profit Share Support
  let interestProfitShareSupportAmount = 0;
  if (inputs.supportPreference === 'Interest/Profit Share Support') {
    let supportRate = 0;
    let maxReductionCap = 0;
    
    if (inputs.incentiveType === 'Technology Initiative' || inputs.incentiveType === 'Local Development Initiative') {
      supportRate = inputs.bankInterestRate * 0.40;
      maxReductionCap = 0.20; // 20% maximum reduction
    } else if (inputs.incentiveType === 'Strategic Initiative') {
      supportRate = inputs.bankInterestRate * 0.30;
      maxReductionCap = 0.15; // 15% maximum reduction
    }

    // Apply cap
    const effectiveRate = Math.min(supportRate, inputs.bankInterestRate * maxReductionCap);
    
    // Calculate monetary amount (assuming annual calculation)
    interestProfitShareSupportAmount = Math.min(
      totalFixedInvestment * (effectiveRate / 100),
      240000000 // 240 million TL limit
    );
  }

  // Calculate Investment Contribution
  const supportAmount = inputs.supportPreference === 'Machinery Support' 
    ? machinerySupportAmount 
    : interestProfitShareSupportAmount;
  
  const taxReductionInvestmentContribution = (totalFixedInvestment - supportAmount) * 0.50;

  return {
    totalFixedInvestment,
    sgkEmployerPremiumSupport,
    sgkEmployeePremiumSupport,
    machinerySupportAmount,
    interestProfitShareSupportAmount,
    taxReductionInvestmentContribution,
    vatCustomsExemption: 'MEVCUT',
    isEligible: true,
    validationErrors: []
  };
};

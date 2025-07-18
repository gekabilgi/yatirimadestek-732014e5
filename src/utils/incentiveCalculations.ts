
import { IncentiveCalculatorInputs, IncentiveCalculatorResults } from '@/types/incentiveCalculator';

const SGK_EMPLOYER_PREMIUM_RATE = 4355.92;
const SGK_EMPLOYEE_PREMIUM_RATE = 3640.77;
const REGION_6_PROVINCES = ['Ağrı', 'Ardahan', 'Batman', 'Bingöl', 'Bitlis', 'Diyarbakır', 'Elazığ', 'Erzincan', 'Erzurum', 'Hakkari', 'Iğdır', 'Kars', 'Mardin', 'Muş', 'Siirt', 'Şırnak', 'Tunceli', 'Van'];

// Province region mapping
const getProvinceRegion = (province: string): number => {
  const regionMap: { [key: string]: number } = {
    'İstanbul': 1, 'Ankara': 1, 'İzmir': 1, 'Kocaeli': 1, 'Bursa': 1, 'Eskişehir': 1, 'Antalya': 1,
    'Adana': 2, 'Denizli': 2, 'Gaziantep': 2, 'Hatay': 2, 'İçel (Mersin)': 2, 'Kayseri': 2, 'Konya': 2, 'Manisa': 2, 'Muğla': 2, 'Sakarya': 2, 'Samsun': 2, 'Tekirdağ': 2, 'Trabzon': 2,
    'Afyonkarahisar': 3, 'Amasya': 3, 'Artvin': 3, 'Aydın': 3, 'Balıkesir': 3, 'Bartın': 3, 'Bolu': 3, 'Burdur': 3, 'Çanakkale': 3, 'Çankırı': 3, 'Çorum': 3, 'Düzce': 3, 'Edirne': 3, 'Giresun': 3, 'Gümüşhane': 3, 'Isparta': 3, 'Karabük': 3, 'Karaman': 3, 'Kastamonu': 3, 'Kırklareli': 3, 'Kütahya': 3, 'Nevşehir': 3, 'Ordu': 3, 'Rize': 3, 'Sinop': 3, 'Tokat': 3, 'Uşak': 3, 'Yalova': 3, 'Zonguldak': 3,
    'Aksaray': 4, 'Bayburt': 4, 'Bilecik': 4, 'Erzincan': 4, 'Erzurum': 4, 'Kars': 4, 'Kırıkkale': 4, 'Kırşehir': 4, 'Niğde': 4, 'Sivas': 4, 'Yozgat': 4,
    'Adıyaman': 5, 'Kahramanmaraş': 5, 'Malatya': 5, 'Osmaniye': 5, 'Şanlıurfa': 5, 'Van': 5,
    'Ağrı': 6, 'Ardahan': 6, 'Batman': 6, 'Bingöl': 6, 'Bitlis': 6, 'Diyarbakır': 6, 'Elazığ': 6, 'Hakkari': 6, 'Iğdır': 6, 'Mardin': 6, 'Muş': 6, 'Siirt': 6, 'Şırnak': 6, 'Tunceli': 6
  };
  return regionMap[province] || 1;
};

export const calculateIncentives = (inputs: IncentiveCalculatorInputs): IncentiveCalculatorResults => {
  const validationErrors: string[] = [];
  const warningMessages: string[] = [];
  
  // Calculate total fixed investment
  const totalFixedInvestment = inputs.landCost + inputs.constructionCost + 
    inputs.importedMachineryCost + inputs.domesticMachineryCost + inputs.otherExpenses;

  // Validation: Check minimum investment requirement (6,000,000 TL)
  if (totalFixedInvestment < 6000000) {
    validationErrors.push(
      `Toplam sabit yatırım tutarı minimum 500,000 TL olmalıdır. Mevcut tutar: ${totalFixedInvestment.toLocaleString('tr-TR')} TL`
    );
  }

  if (inputs.numberOfEmployees <= 0) {
    validationErrors.push('Çalışan sayısı 0\'dan büyük olmalıdır.');
  }

  if (inputs.supportPreference === 'Interest/Profit Share Support' && inputs.loanAmount <= 0) {
    validationErrors.push('Faiz/Kar Payı Desteği için kredi tutarı 0\'dan büyük olmalıdır.');
  }

  if (inputs.supportPreference === 'Interest/Profit Share Support' && inputs.loanTermMonths <= 0) {
    validationErrors.push('Faiz/Kar Payı Desteği için kredi vadesi 0\'dan büyük olmalıdır.');
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
      validationErrors,
      warningMessages
    };
  }

  // Determine if province is in Region 6
  const isRegion6 = REGION_6_PROVINCES.includes(inputs.province);
  const provinceRegion = getProvinceRegion(inputs.province);

  // Calculate SGK Employer Premium Support
  const sgkEmployerPremiumSupport = isRegion6
    ? 144 * SGK_EMPLOYER_PREMIUM_RATE * inputs.numberOfEmployees
    : 96 * (SGK_EMPLOYER_PREMIUM_RATE / 2) * inputs.numberOfEmployees;

  // Calculate SGK Employee Premium Support (only for Region 6)
  const sgkEmployeePremiumSupport = isRegion6
    ? 120 * SGK_EMPLOYEE_PREMIUM_RATE * inputs.numberOfEmployees
    : 0;

  // Calculate Machinery Support with new logic based on tax reduction preference
  const totalMachineryCost = inputs.importedMachineryCost + inputs.domesticMachineryCost;
  let machinerySupportCalculated = 0;
  let machinerySupportLimit = 0;
  
  
  // Apply caps based on incentive type and tax reduction preference
  let monetaryCap = 0;
  let investmentCapPercentage = 0;
  let cappedMachinerySupport = 0;
  
  if (inputs.incentiveType === 'Technology Initiative' || inputs.incentiveType === 'Local Development Initiative') {
    if (inputs.taxReductionSupport === 'No') {
      monetaryCap = 300000000; // 300 million TL (increased from 240M)
      investmentCapPercentage = 0.20; // 25% of total fixed investment (increased from 20%)
      machinerySupportCalculated = totalMachineryCost * 0.30;
      machinerySupportLimit = totalFixedInvestment * 0.20;
      cappedMachinerySupport = Math.min(machinerySupportCalculated, machinerySupportLimit);
    } else {
      monetaryCap = 240000000; // 240 million TL
      investmentCapPercentage = 0.15; // 20% of total fixed investment
      machinerySupportCalculated = totalMachineryCost * 0.25;
      machinerySupportLimit = totalFixedInvestment * 0.15;
      cappedMachinerySupport = Math.min(machinerySupportCalculated, machinerySupportLimit);
    }
  } else if (inputs.incentiveType === 'Strategic Initiative') {
    if (inputs.taxReductionSupport === 'No') {
      monetaryCap = 240000000; // 240 million TL (increased from 180M)
      investmentCapPercentage = 0.20; // 20% of total fixed investment (increased from 15%)
      machinerySupportCalculated = totalMachineryCost * 0.30;
      machinerySupportLimit = totalFixedInvestment * 0.20;
      cappedMachinerySupport = Math.min(machinerySupportCalculated, machinerySupportLimit);
    } else {
      monetaryCap = 180000000; // 180 million TL
      investmentCapPercentage = 0.15; // 15% of total fixed investment
      machinerySupportCalculated = totalMachineryCost * 0.25;
      machinerySupportLimit = totalFixedInvestment * 0.15;
      cappedMachinerySupport = Math.min(machinerySupportCalculated, machinerySupportLimit);
    }
  }
  
  // Apply the investment cap percentage
  const investmentCap = totalFixedInvestment * investmentCapPercentage;
  cappedMachinerySupport = Math.min(cappedMachinerySupport, investmentCap, monetaryCap);
  
  const machinerySupportAmount = inputs.supportPreference === 'Machinery Support' 
    ? cappedMachinerySupport 
    : 0;

  // Calculate Interest/Profit Share Support with updated logic based on tax reduction preference
  let interestProfitShareSupportAmount = 0;
  if (inputs.supportPreference === 'Interest/Profit Share Support') {
    // Calculate support rate based on incentive type and tax reduction preference
    let supportRate = 0;
    let maxReductionCap = 0;
    let monetaryCap = 0;
    let investmentCapPercentage = 0;
    
    if (inputs.incentiveType === 'Technology Initiative' || inputs.incentiveType === 'Local Development Initiative') {
      if (inputs.taxReductionSupport === 'No') {
        supportRate = Math.min(inputs.bankInterestRate * 0.40, 25); // Cap at 25% (increased from 20%)
        maxReductionCap = 25; // 25% maximum (increased from 20%)
        monetaryCap = 300000000; // 300 million TL (increased from 240M)
        investmentCapPercentage = 0.25; // 25% of total fixed investment (increased from 20%)
      } else {
        supportRate = Math.min(inputs.bankInterestRate * 0.40, 20); // Cap at 20%
        maxReductionCap = 20; // 20% maximum
        monetaryCap = 240000000; // 240 million TL
        investmentCapPercentage = 0.20; // 20% of total fixed investment
      }
    } else if (inputs.incentiveType === 'Strategic Initiative') {
      if (inputs.taxReductionSupport === 'No') {
        supportRate = Math.min(inputs.bankInterestRate * 0.30, 20); // Cap at 20% (increased from 15%)
        maxReductionCap = 20; // 20% maximum (increased from 15%)
        monetaryCap = 240000000; // 240 million TL (increased from 180M)
        investmentCapPercentage = 0.20; // 20% of total fixed investment (increased from 15%)
      } else {
        supportRate = Math.min(inputs.bankInterestRate * 0.30, 15); // Cap at 15%
        maxReductionCap = 15; // 15% maximum
        monetaryCap = 180000000; // 180 million TL
        investmentCapPercentage = 0.15; // 15% of total fixed investment
      }
    }

    // Calculate total interest amount using loan formula
    const monthlyRate = (inputs.bankInterestRate / 100) / 12;
    const loanTermMonths = inputs.loanTermMonths;
    
    // Monthly payment calculation: PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
    const monthlyPayment = inputs.loanAmount * 
      (monthlyRate * Math.pow(1 + monthlyRate, loanTermMonths)) / 
      (Math.pow(1 + monthlyRate, loanTermMonths) - 1);
    
    // Total interest = (Monthly Payment * Term) - Loan Amount
    const totalInterest = (monthlyPayment * loanTermMonths) - inputs.loanAmount;
    
    // Preliminary support amount
    const preliminarySupportAmount = totalInterest * (supportRate / 100);
    
    // Apply caps
    const investmentCap = totalFixedInvestment * investmentCapPercentage;
    interestProfitShareSupportAmount = Math.min(
      Math.min(preliminarySupportAmount, monetaryCap),
      investmentCap
    );
  }

  // Calculate Investment Contribution based on tax reduction preference
  const supportAmount = inputs.supportPreference === 'Machinery Support' 
    ? machinerySupportAmount 
    : interestProfitShareSupportAmount;
  
  let taxReductionInvestmentContribution: number;
  
  if (inputs.taxReductionSupport === 'No') {
    taxReductionInvestmentContribution = 0;
  } else if (inputs.incentiveType === 'Strategic Initiative') {
    taxReductionInvestmentContribution = (totalFixedInvestment - supportAmount) * 0.40;
  } else {
    taxReductionInvestmentContribution = (totalFixedInvestment - supportAmount) * 0.50;
  }

  return {
    totalFixedInvestment,
    sgkEmployerPremiumSupport,
    sgkEmployeePremiumSupport,
    machinerySupportAmount,
    interestProfitShareSupportAmount,
    taxReductionInvestmentContribution,
    vatCustomsExemption: 'MEVCUT',
    isEligible: true,
    validationErrors: [],
    warningMessages
  };
};

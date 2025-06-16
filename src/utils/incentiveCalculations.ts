
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
    'Adıyaman': 5, 'Çankırı': 5, 'Kahramanmaraş': 5, 'Malatya': 5, 'Osmaniye': 5, 'Şanlıurfa': 5, 'Van': 5,
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

  // Validation: Check minimum investment requirement (500,000 TL)
  if (totalFixedInvestment < 500000) {
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

  // Calculate Machinery Support with new logic
  const totalMachineryCost = inputs.importedMachineryCost + inputs.domesticMachineryCost;
  const machinerySupportCalculated = totalMachineryCost * 0.25;
  const machinerySupportLimit = totalFixedInvestment * 0.15;
  let cappedMachinerySupport = Math.min(machinerySupportCalculated, machinerySupportLimit);
  
  // Apply caps based on incentive type
  let monetaryCap = 0;
  let investmentCapPercentage = 0;
  
  if (inputs.incentiveType === 'Technology Initiative' || inputs.incentiveType === 'Local Development Initiative') {
    monetaryCap = 240000000; // 240 million TL
    investmentCapPercentage = 0.20; // 20% of total fixed investment
  } else if (inputs.incentiveType === 'Strategic Initiative') {
    monetaryCap = 180000000; // 180 million TL
    investmentCapPercentage = 0.15; // 15% of total fixed investment
  }
  
  // Apply the investment cap percentage
  const investmentCap = totalFixedInvestment * investmentCapPercentage;
  cappedMachinerySupport = Math.min(cappedMachinerySupport, investmentCap, monetaryCap);
  
  const machinerySupportAmount = inputs.supportPreference === 'Machinery Support' 
    ? cappedMachinerySupport 
    : 0;

  // Calculate Interest/Profit Share Support with new business rule
  let interestProfitShareSupportAmount = 0;
  if (inputs.supportPreference === 'Interest/Profit Share Support') {
    // Check sector and region restrictions
    const isTargetSector = inputs.sectorCategory === 'Target Sector' || inputs.sectorCategory === 'Both';
    const isRegionRestricted = [1, 2, 3].includes(provinceRegion);
    
    if (isTargetSector && isRegionRestricted) {
      interestProfitShareSupportAmount = 0;
      warningMessages.push('Hedef sektörler için Faiz/Kar Payı Desteği 1., 2. ve 3. bölgelerde uygulanmamaktadır.');
    } else {
      // Calculate support rate based on incentive type
      let supportRate = 0;
      let maxReductionCap = 0;
      let monetaryCap = 0;
      let investmentCapPercentage = 0;
      
      if (inputs.incentiveType === 'Technology Initiative' || inputs.incentiveType === 'Local Development Initiative') {
        supportRate = Math.min(inputs.bankInterestRate * 0.40, 20); // Cap at 20%
        maxReductionCap = 20; // 20% maximum
        monetaryCap = 240000000; // 240 million TL
        investmentCapPercentage = 0.20; // 20% of total fixed investment
      } else if (inputs.incentiveType === 'Strategic Initiative') {
        supportRate = Math.min(inputs.bankInterestRate * 0.30, 15); // Cap at 15%
        maxReductionCap = 15; // 15% maximum
        monetaryCap = 180000000; // 180 million TL
        investmentCapPercentage = 0.15; // 15% of total fixed investment
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
  }

  // Calculate Investment Contribution with different rates based on incentive type
  const supportAmount = inputs.supportPreference === 'Machinery Support' 
    ? machinerySupportAmount 
    : interestProfitShareSupportAmount;
  
  let taxReductionInvestmentContribution: number;
  if (inputs.incentiveType === 'Strategic Initiative') {
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

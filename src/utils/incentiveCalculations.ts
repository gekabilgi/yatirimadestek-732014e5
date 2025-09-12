
import { IncentiveCalculatorInputs, IncentiveCalculatorResults, PaymentPlanDetail } from '@/types/incentiveCalculator';

// Use the PaymentPlanDetail type from the main types file
type OdemeDetayi = PaymentPlanDetail;

// Banking constants for Turkish loan calculations
const BSMV_ORANI = 0.05; // Banka ve Sigorta Muameleleri Vergisi oranı (%5)
const KKDF_ORANI = 0.00; // Kaynak Kullanımını Destekleme Fonu oranı (%0)
const YILDAKI_AY_SAYISI = 12; // Bir yıldaki ay sayısı

const SGK_EMPLOYER_PREMIUM_RATE = 4355.92;
const SGK_EMPLOYEE_PREMIUM_RATE = 3640.77;
const REGION_6_PROVINCES = ['Ağrı', 'Ardahan', 'Batman', 'Bingöl', 'Bitlis', 'Diyarbakır', 'Elazığ', 'Erzincan', 'Erzurum', 'Hakkari', 'Iğdır', 'Kars', 'Mardin', 'Muş', 'Siirt', 'Şırnak', 'Tunceli', 'Van'];

/**
 * Detailed Turkish loan payment plan calculator
 * @param anapara Total loan amount
 * @param yillikFaizOrani Annual interest rate (as decimal, e.g., 0.45 for 45%)
 * @param vadeAy Total term in months
 * @param options Optional tax rates for BSMV and KKDF
 * @returns Array of monthly payment details
 */
const aylikKrediPlaniHesapla = (
  anapara: number,
  yillikFaizOrani: number,
  vadeAy: number,
  options?: { bsmvOrani?: number; kkdfOrani?: number }
): OdemeDetayi[] => {
  const bsmvOrani = options?.bsmvOrani ?? BSMV_ORANI;
  const kkdfOrani = options?.kkdfOrani ?? KKDF_ORANI;
  const aylikFaizOrani = yillikFaizOrani / YILDAKI_AY_SAYISI;
  const taksitSayisi = vadeAy;

  if (aylikFaizOrani === 0) {
    // Zero interest rate - simple division
    const taksitTutari = anapara / taksitSayisi;
    const plan: OdemeDetayi[] = [];
    for (let i = 1; i <= taksitSayisi; i++) {
      plan.push({
        taksitNo: i,
        taksitTutari: taksitTutari,
        anaparaOdemesi: taksitTutari,
        faizTutari: 0,
        bsmv: 0,
        kkdf: 0,
        kalanAnapara: anapara - (i * taksitTutari)
      });
    }
    return plan;
  }

  // Annuity formula for monthly payment calculation
  const r = aylikFaizOrani;
  const n = taksitSayisi;
  const taksitTutari = anapara * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

  const odemePlani: OdemeDetayi[] = [];
  let kalanAnapara = anapara;

  for (let i = 1; i <= taksitSayisi; i++) {
    const faizTutari = kalanAnapara * aylikFaizOrani;
    const bsmv = faizTutari * bsmvOrani;
    const kkdf = faizTutari * kkdfOrani;

    let anaparaOdemesi: number;
    let guncelTaksitTutari = taksitTutari;

    if (i === taksitSayisi) {
      // Final payment - pay remaining principal to handle rounding differences
      anaparaOdemesi = kalanAnapara;
      guncelTaksitTutari = anaparaOdemesi + faizTutari + bsmv + kkdf;
      kalanAnapara = 0;
    } else {
      anaparaOdemesi = taksitTutari - faizTutari - bsmv - kkdf;
      kalanAnapara -= anaparaOdemesi;
    }

    odemePlani.push({
      taksitNo: i,
      taksitTutari: guncelTaksitTutari,
      anaparaOdemesi: anaparaOdemesi,
      faizTutari: faizTutari,
      bsmv: bsmv,
      kkdf: kkdf,
      kalanAnapara: Math.max(0, kalanAnapara), // Ensure non-negative
    });
  }

  return odemePlani;
};

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

export const calculateIncentives = async (inputs: IncentiveCalculatorInputs): Promise<IncentiveCalculatorResults> => {
  const validationErrors: string[] = [];
  const warningMessages: string[] = [];
  
  // Fetch current SGK premium rates from admin settings
  const { adminSettingsService } = await import('@/services/adminSettingsService');
  const settings = await adminSettingsService.getIncentiveCalculationSettings();
  
  // Calculate total fixed investment
  const totalFixedInvestment = inputs.landCost + inputs.constructionCost + 
    inputs.importedMachineryCost + inputs.domesticMachineryCost + inputs.otherExpenses;

  // Validation: Check minimum investment requirement (6,000,000 TL)
  if (totalFixedInvestment < 6000000) {
    validationErrors.push(
      `Toplam sabit yatırım tutarı minimum 6.000.000 TL olmalıdır. Mevcut tutar: ${totalFixedInvestment.toLocaleString('tr-TR')} TL`
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

  // Calculate VAT and Customs Duty exemptions
  const machineryCostForExemptions = inputs.importedMachineryCost + inputs.domesticMachineryCost;
  const vatExemptionAmount = machineryCostForExemptions * (settings.vat_rate / 100);
  const customsExemptionAmount = inputs.importedMachineryCost * (settings.customs_duty_rate / 100);

  if (validationErrors.length > 0) {
    return {
      totalFixedInvestment,
      sgkEmployerPremiumSupport: 0,
      sgkEmployeePremiumSupport: 0,
      machinerySupportAmount: 0,
      interestProfitShareSupportAmount: 0,
      totalInterestAmount: 0,
      taxReductionInvestmentContribution: 0,
      vatCustomsExemption: 'MEVCUT',
      vatExemptionAmount,
      customsExemptionAmount,
      isEligible: false,
      validationErrors,
      warningMessages
    };
  }

  // Determine if province is in Region 6
  const isRegion6 = REGION_6_PROVINCES.includes(inputs.province);
  const provinceRegion = getProvinceRegion(inputs.province);

  // Get appropriate SGK rates based on investment type
  const sgkEmployerRate = inputs.investmentType === 'İmalat' 
    ? settings.sgk_employer_premium_rate_manufacturing 
    : settings.sgk_employer_premium_rate_other;
    
  const sgkEmployeeRate = inputs.investmentType === 'İmalat' 
    ? settings.sgk_employee_premium_rate_manufacturing 
    : settings.sgk_employee_premium_rate_other;

  // Calculate SGK Employer Premium Support
  const sgkEmployerPremiumSupport = isRegion6
    ? 144 * sgkEmployerRate * inputs.numberOfEmployees
    : 96 * (sgkEmployerRate / 2) * inputs.numberOfEmployees;

  // Calculate SGK Employee Premium Support (only for Region 6)
  const sgkEmployeePremiumSupport = isRegion6
    ? 120 * sgkEmployeeRate * inputs.numberOfEmployees
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
  let totalInterestAmount = 0;
  let preliminarySupportAmount =0;
  
  if (inputs.supportPreference === 'Interest/Profit Share Support') {
    // Calculate support rate based on incentive type and tax reduction preference
    let supportRate = 0;
    let maxReductionCap = 0;
    let monetaryCap = 0;
    let investmentCapPercentage = 0;
    
    if (inputs.incentiveType === 'Technology Initiative' || inputs.incentiveType === 'Local Development Initiative') {
      if (inputs.taxReductionSupport === 'No') {
        supportRate = Math.min(inputs.bankInterestRate * 0.40, 20); // Cap at 20%
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
        supportRate = Math.min(inputs.bankInterestRate * 0.30, 15); // Cap at 15%
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

    // Calculate detailed payment plan using Turkish banking methodology
    const yillikFaizOrani = inputs.bankInterestRate / 100; // Convert percentage to decimal
    const paymentPlan = aylikKrediPlaniHesapla(
      inputs.loanAmount,
      yillikFaizOrani,
      inputs.loanTermMonths
    );
    console.log( "yillik FaizOrani: ", yillikFaizOrani)
    // Calculate total interest including BSMV and KKDF
    totalInterestAmount = paymentPlan.reduce((total, payment) => 
      total + payment.faizTutari, 0
    );

    console.log("Faiz Tutarı: ", totalInterestAmount)
    // Preliminary support amount based on detailed interest calculation
    if (supportRate < 20){
      preliminarySupportAmount = totalInterestAmount * 0.4;
    } else {
      preliminarySupportAmount = totalInterestAmount * (0.2 / yillikFaizOrani);
    }
    

    console.log("%40 Faiz İnidirimi Tutarı: ", preliminarySupportAmount)
    
    // Apply caps
    const investmentCap = totalFixedInvestment * investmentCapPercentage;
    interestProfitShareSupportAmount = Math.min(
      Math.min(preliminarySupportAmount, monetaryCap),
      investmentCap
    );
  }
 console.log("Faiz Desteği Tutarı (TL): ", interestProfitShareSupportAmount)
    
  // Calculate Investment Contribution based on tax reduction preference
  const supportAmount = inputs.supportPreference === 'Machinery Support' 
    ? machinerySupportAmount 
    : interestProfitShareSupportAmount;
  
  let taxReductionInvestmentContribution: number;
  
  if (inputs.taxReductionSupport === 'No') {
    taxReductionInvestmentContribution = 0;
  } else if (inputs.incentiveType === 'Strategic Initiative') {
    taxReductionInvestmentContribution = (totalFixedInvestment - supportAmount - inputs.landCost) * 0.40;
  } else {
    taxReductionInvestmentContribution = (totalFixedInvestment - supportAmount - inputs.landCost) * 0.50;
  }

  return {
    totalFixedInvestment,
    sgkEmployerPremiumSupport,
    sgkEmployeePremiumSupport,
    machinerySupportAmount,
    interestProfitShareSupportAmount,
    totalInterestAmount,
    taxReductionInvestmentContribution,
    vatCustomsExemption: 'MEVCUT',
    vatExemptionAmount,
    customsExemptionAmount,
    isEligible: true,
    validationErrors: [],
    warningMessages,
    paymentPlan: inputs.supportPreference === 'Interest/Profit Share Support' ? 
      aylikKrediPlaniHesapla(
        inputs.loanAmount,
        inputs.bankInterestRate / 100,
        inputs.loanTermMonths
      ) : undefined
  };
};

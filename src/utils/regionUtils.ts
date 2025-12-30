/**
 * Utility functions for region-based logic
 */

// Region 6 provinces list
const REGION_6_PROVINCES = [
  "Adıyaman",
  "Ağrı", 
  "Ardahan",
  "Batman",
  "Bingöl",
  "Bitlis",
  "Diyarbakır",
  "Gümüşhane",
  "Hakkari",
  "Iğdır",
  "Kars",
  "Mardin",
  "Muş",
  "Siirt",
  "Şanlıurfa",
  "Şırnak",
  "Van"
];

// Cazibe Merkezleri İlleri (Ek-1) - 9903 sayılı Karar
export const CAZIBE_MERKEZLERI_PROVINCES = [
  'Adıyaman', 'Ağrı', 'Ardahan', 'Batman', 'Bayburt', 'Bingöl', 
  'Bitlis', 'Diyarbakır', 'Elazığ', 'Erzincan', 'Erzurum', 
  'Gümüşhane', 'Hakkari', 'Iğdır', 'Kars', 'Malatya', 'Mardin',
  'Muş', 'Siirt', 'Şanlıurfa', 'Şırnak', 'Tunceli', 'Van'
];

// Deprem Bölgesi İlçeleri (Ek-2) - 9903 sayılı Karar
export const EARTHQUAKE_AFFECTED_DISTRICTS: Record<string, string[]> = {
  'Kahramanmaraş': ['Afşin', 'Andırın', 'Çağlayancerit', 'Dulkadiroğlu', 
                   'Ekinözü', 'Elbistan', 'Göksun', 'Nurhak', 
                   'Onikişubat', 'Pazarcık', 'Türkoğlu'],
  'Hatay': ['Altınözü', 'Antakya', 'Arsuz', 'Belen', 'Defne', 
            'Dörtyol', 'Erzin', 'Hassa', 'İskenderun', 'Kırıkhan', 
            'Kumlu', 'Payas', 'Reyhanlı', 'Samandağ', 'Yayladağı'],
  'Adıyaman': ['Besni', 'Çelikhan', 'Gerger', 'Gölbaşı', 'Kahta', 
               'Merkez', 'Samsat', 'Sincik', 'Tut'],
  'Gaziantep': ['Araban', 'İslahiye', 'Karkamış', 'Nizip', 'Nurdağı', 
                'Oğuzeli', 'Şahinbey', 'Şehitkamil', 'Yavuzeli'],
  'Malatya': ['Akçadağ', 'Arapgir', 'Arguvan', 'Battalgazi', 'Darende', 
              'Doğanşehir', 'Doğanyol', 'Hekimhan', 'Kale', 'Kuluncak', 
              'Pütürge', 'Yazıhan', 'Yeşilyurt'],
  'Diyarbakır': ['Bağlar', 'Bismil', 'Çermik', 'Çınar', 'Çüngüş', 
                 'Dicle', 'Eğil', 'Ergani', 'Hani', 'Hazro', 
                 'Kayapınar', 'Kocaköy', 'Kulp', 'Lice', 'Silvan', 
                 'Sur', 'Yenişehir'],
  'Adana': ['Aladağ', 'Ceyhan', 'Feke', 'İmamoğlu', 'Karaisalı', 
            'Karataş', 'Kozan', 'Pozantı', 'Saimbeyli', 'Sarıçam', 
            'Seyhan', 'Tufanbeyli', 'Yumurtalık', 'Yüreğir', 'Çukurova'],
  'Osmaniye': ['Bahçe', 'Düziçi', 'Hasanbeyli', 'Kadirli', 'Merkez', 
               'Sumbas', 'Toprakkale'],
  'Kilis': ['Elbeyli', 'Merkez', 'Musabeyli', 'Polateli'],
  'Şanlıurfa': ['Akçakale', 'Birecik', 'Bozova', 'Ceylanpınar', 
                'Eyyübiye', 'Halfeti', 'Haliliye', 'Harran', 
                'Hilvan', 'Karaköprü', 'Siverek', 'Suruç', 'Viranşehir'],
  'Elazığ': ['Ağın', 'Alacakaya', 'Arıcak', 'Baskil', 'Karakoçan', 
             'Keban', 'Kovancılar', 'Maden', 'Merkez', 'Palu', 
             'Sivrice']
};

/**
 * Check if a province is in Region 6
 */
export const isRegion6Province = (province: string): boolean => {
  return REGION_6_PROVINCES.includes(province);
};

/**
 * Check if a province is in Cazibe Merkezleri list
 */
export const isCazibeMerkeziProvince = (province: string): boolean => {
  return CAZIBE_MERKEZLERI_PROVINCES.includes(province);
};

/**
 * Check if a district is in earthquake affected areas
 */
export const isEarthquakeAffectedDistrict = (province: string, district: string): boolean => {
  const affectedDistricts = EARTHQUAKE_AFFECTED_DISTRICTS[province];
  if (!affectedDistricts) return false;
  return affectedDistricts.some(d => 
    d.toLowerCase() === district.toLowerCase() || 
    district.toLowerCase().includes(d.toLowerCase()) ||
    d.toLowerCase().includes(district.toLowerCase())
  );
};

/**
 * Check if NACE code is manufacturing sector (10-32) or waste treatment (38.2)
 */
export const isManufacturingNaceCode = (naceCode: string): boolean => {
  if (!naceCode) return false;
  const normalized = naceCode.replace(/\./g, '');
  const mainCode = parseInt(normalized.substring(0, 2));
  return (mainCode >= 10 && mainCode <= 32) || naceCode.startsWith('38.2');
};

/**
 * Special program eligibility result
 */
export interface SpecialProgramEligibility {
  isEligible: boolean;
  programType: 'earthquake_zone' | 'cazibe_merkezleri' | null;
  description?: string;
  originalRegion?: number;
  appliedRegion?: number;
}

/**
 * Check eligibility for special incentive programs (Cazibe Merkezleri / Deprem Bölgesi)
 */
export const checkSpecialProgramEligibility = (
  province: string,
  district: string,
  osbStatus: "İÇİ" | "DIŞI" | null,
  naceCode: string,
  originalRegion: number
): SpecialProgramEligibility => {
  // Manufacturing sector check is required
  if (!isManufacturingNaceCode(naceCode)) {
    return { isEligible: false, programType: null };
  }

  // If already in Region 6, no additional benefit
  if (originalRegion === 6) {
    return { isEligible: false, programType: null };
  }

  // Earthquake zone district check
  if (isEarthquakeAffectedDistrict(province, district)) {
    return {
      isEligible: true,
      programType: 'earthquake_zone',
      description: `Deprem Bölgesi Teşviki: ${province}/${district} ilçesi depremden etkilenen bölgede yer aldığından imalat yatırımlarında 6. Bölge destekleri uygulanır.`,
      originalRegion,
      appliedRegion: 6
    };
  }

  // Cazibe Merkezi province + OSB check
  if (isCazibeMerkeziProvince(province) && osbStatus === "İÇİ") {
    return {
      isEligible: true,
      programType: 'cazibe_merkezleri',
      description: `Cazibe Merkezleri Programı: ${province} ili Cazibe Merkezleri kapsamında olup OSB içindeki imalat yatırımlarında 6. Bölge destekleri uygulanır.`,
      originalRegion,
      appliedRegion: 6
    };
  }

  return { isEligible: false, programType: null };
};

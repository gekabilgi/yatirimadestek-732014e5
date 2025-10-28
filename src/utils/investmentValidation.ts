
/**
 * Utility functions for investment validation and special cases
 */

export interface SectorData {
  nace_kodu: string;
  sektor: string;
}

/**
 * Check if the investment is mining-related in Istanbul
 */
export const isIstanbulMiningInvestment = (
  province: string,
  naceCode: string
): boolean => {
  if (province !== "İstanbul") return false;
  
  const miningPrefixes = ["05", "06", "07", "08", "09"];
  return miningPrefixes.some(prefix => naceCode.startsWith(prefix));
};

/**
 * Check if the investment is GES/RES (solar/wind energy)
 */
export const isResGesInvestment = (sector: SectorData): boolean => {
  const { nace_kodu, sektor } = sector;
  
  // Check NACE code
  const isCorrectNaceCode = nace_kodu === "35.12" || nace_kodu === "35.12.00";
  if (!isCorrectNaceCode) return false;
  
  // Check keywords in sector description (case-insensitive)
  const keywords = ["güneş", "ges", "res", "rüzgar"];
  const sectorLower = sektor.toLowerCase();
  
  return keywords.some(keyword => sectorLower.includes(keyword));
};

/**
 * Check if the investment is a target investment in Istanbul
 * Target investments in Istanbul are not eligible for tax reduction support
 */
export const isIstanbulTargetInvestment = (
  province: string,
  isTargetInvestment: boolean
): boolean => {
  return province === "İstanbul" && isTargetInvestment === true;
};

/**
 * Get modified support values for GES/RES investments
 */
export const getGesResOverrideValues = () => ({
  interestSupport: "Uygulanmaz (GES ve RES yatırımlarında)",
  interestSupportCap: "Uygulanmaz (GES ve RES yatırımlarında)"
});


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
  "Hakkâri",
  "Iğdır",
  "Kars",
  "Mardin",
  "Muş",
  "Siirt",
  "Şanlıurfa",
  "Şırnak",
  "Van"
];

/**
 * Check if a province is in Region 6
 */
export const isRegion6Province = (province: string): boolean => {
  return REGION_6_PROVINCES.includes(province);
};

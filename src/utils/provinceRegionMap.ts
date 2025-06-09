// This file is now deprecated as we're using the province_region_map table from Supabase
// Keeping for backward compatibility, but the application now fetches data from the database

export const PROVINCE_REGION_MAP: Record<string, number> = {};

export const getProvinceRegion = (province: string): number => {
  // This function is deprecated - use the database query instead
  console.warn('getProvinceRegion is deprecated. Use database queries instead.');
  return 1;
};

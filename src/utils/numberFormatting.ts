/**
 * Utility functions for smart number formatting in Turkish locale
 */

export const formatLargeNumber = (value: number): string => {
  if (value >= 1000000) {
    return (value / 1000000).toLocaleString('tr-TR', { 
      maximumFractionDigits: 1 
    }) + 'M';
  }
  if (value >= 1000) {
    return (value / 1000).toLocaleString('tr-TR', { 
      maximumFractionDigits: 1 
    }) + 'K';
  }
  return value.toLocaleString('tr-TR');
};

export const formatCurrencyCompact = (value: number): string => {
  if (value >= 1000000) {
    return (value / 1000000).toLocaleString('tr-TR', { 
      maximumFractionDigits: 1 
    }) + 'M TL';
  }
  if (value >= 1000) {
    return (value / 1000).toLocaleString('tr-TR', { 
      maximumFractionDigits: 1 
    }) + 'K TL';
  }
  return value.toLocaleString('tr-TR') + ' TL';
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
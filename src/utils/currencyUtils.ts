/**
 * Format a number to Turkish currency display format (10.000.000,00)
 */
export const formatCurrencyInput = (value: number | string): string => {
  if (value === '' || value === null || value === undefined) return '';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '';
  
  // Format with Turkish locale (dots for thousands, comma for decimals)
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
};

/**
 * Parse a formatted Turkish currency string back to a number
 */
export const parseCurrencyInput = (value: string): number => {
  if (!value || value.trim() === '') return 0;
  
  // Remove thousands separators (dots) and replace decimal separator (comma) with dot
  const cleanValue = value
    .replace(/\./g, '') // Remove dots (thousands separators)
    .replace(',', '.'); // Replace comma with dot for decimal
  
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Calculate cursor position after formatting
 */
export const calculateCursorPosition = (
  originalValue: string,
  formattedValue: string,
  originalPosition: number
): number => {
  // Count the number of separators before the cursor in the original value
  const beforeCursor = originalValue.substring(0, originalPosition);
  const separatorsBeforeCursor = (beforeCursor.match(/[.,]/g) || []).length;
  
  // Count digits before cursor position
  const digitsBeforeCursor = beforeCursor.replace(/[^0-9]/g, '').length;
  
  // Find the position in the formatted string that corresponds to the same number of digits
  let digitCount = 0;
  let newPosition = 0;
  
  for (let i = 0; i < formattedValue.length; i++) {
    const char = formattedValue[i];
    if (/[0-9]/.test(char)) {
      digitCount++;
      if (digitCount >= digitsBeforeCursor) {
        newPosition = i + 1;
        break;
      }
    } else {
      if (digitCount < digitsBeforeCursor) {
        newPosition = i + 1;
      }
    }
  }
  
  return Math.min(newPosition, formattedValue.length);
};

/**
 * Validate if input contains only valid currency characters
 */
export const isValidCurrencyInput = (value: string): boolean => {
  // Allow digits, dots, and commas
  return /^[0-9.,]*$/.test(value);
};
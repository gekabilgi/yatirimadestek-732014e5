/**
 * Format a number to Turkish currency display format (10.000.000) - integer only
 */
export const formatCurrencyInput = (value: number | string): string => {
  if (value === '' || value === null || value === undefined) return '';
  
  const numValue = typeof value === 'string' ? parseInt(value.replace(/\D/g, '')) : Math.floor(value);
  if (isNaN(numValue) || numValue === 0) return '';
  
  // Format with Turkish locale (dots for thousands, no decimals)
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numValue);
};

/**
 * Parse a formatted Turkish currency string back to a number (integer only)
 */
export const parseCurrencyInput = (value: string): number => {
  if (!value || value.trim() === '') return 0;
  
  // Remove all non-digit characters
  const cleanValue = value.replace(/\D/g, '');
  
  const parsed = parseInt(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Calculate cursor position after formatting (simplified for integer-only)
 */
export const calculateCursorPosition = (
  originalValue: string,
  formattedValue: string,
  originalPosition: number
): number => {
  // Count digits before cursor position in original value
  const beforeCursor = originalValue.substring(0, originalPosition);
  const digitsBeforeCursor = beforeCursor.replace(/\D/g, '').length;
  
  // Find position in formatted string that corresponds to the same number of digits
  let digitCount = 0;
  let newPosition = formattedValue.length; // Default to end
  
  for (let i = 0; i < formattedValue.length; i++) {
    const char = formattedValue[i];
    if (/[0-9]/.test(char)) {
      digitCount++;
      if (digitCount === digitsBeforeCursor) {
        newPosition = i + 1;
        break;
      }
    }
  }
  
  return Math.min(newPosition, formattedValue.length);
};

/**
 * Validate if input contains only valid currency characters (digits and dots only)
 */
export const isValidCurrencyInput = (value: string): boolean => {
  // Allow only digits and dots (thousand separators)
  return /^[0-9.]*$/.test(value);
};
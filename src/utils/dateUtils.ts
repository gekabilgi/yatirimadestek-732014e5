/**
 * Check if a program is open based on its application deadline.
 * Compares only date parts (ignores time) to ensure programs with 
 * deadline on the current day are considered "open" throughout the day.
 */
export const isProgramOpen = (applicationDeadline: string | null | undefined): boolean => {
  if (!applicationDeadline) return true;
  
  // Compare only date parts (YYYY-MM-DD format)
  const today = new Date().toISOString().split('T')[0];
  const deadline = applicationDeadline.split('T')[0];
  
  return today <= deadline;
};

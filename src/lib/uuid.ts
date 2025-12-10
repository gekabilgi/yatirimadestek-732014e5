/**
 * Generate a UUID v4 with fallback for non-secure contexts (HTTP)
 * crypto.randomUUID() requires HTTPS, so we provide a fallback for HTTP environments
 */
export function generateUUID(): string {
  // Try crypto.randomUUID first (works in HTTPS/secure contexts)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // Fall through to manual implementation
    }
  }
  
  // Fallback: Manual UUID v4 generation for HTTP environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

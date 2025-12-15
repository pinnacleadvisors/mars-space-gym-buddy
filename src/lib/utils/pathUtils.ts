/**
 * Check if we're running in a Capacitor native app
 */
const isCapacitorApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  // Check for Capacitor platform indicators
  return (
    window.Capacitor !== undefined ||
    (window as any).Capacitor !== undefined ||
    document.querySelector('meta[name="viewport"][content*="viewport-fit"]') !== null ||
    // Check for native app user agent patterns
    /capacitor/i.test(navigator.userAgent) ||
    // Check if running in file:// protocol (common in Capacitor)
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'ionic:' ||
    window.location.protocol === 'file:'
  );
};

/**
 * Get the base path for routing (only in production on GitHub Pages)
 * Returns empty string for Capacitor native apps and development
 * @returns The base path string or empty string
 */
export const getBasePath = (): string => {
  // Always return empty string for Capacitor native apps
  if (isCapacitorApp()) {
    return '';
  }
  
  // Check if we're on GitHub Pages
  if (typeof window !== 'undefined' && window.location.hostname === 'pinnacleadvisors.github.io') {
    return '/mars-space-gym-buddy';
  }
  
  // In development, always return empty string
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.includes('localhost'))) {
    return '';
  }
  
  // For other environments, return empty string (can be extended later)
  return '';
};

/**
 * Get the full URL with base path for redirects
 * @param path - The route path (e.g., '/dashboard', '/login')
 * @returns The full URL with base path if in production
 */
export const getFullPath = (path: string): string => {
  const basePath = getBasePath();
  // Remove leading slash from path if basePath exists to avoid double slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${basePath}${cleanPath}`;
};

/**
 * Get the full URL with origin for redirects (for Supabase emailRedirectTo, etc.)
 * @param path - The route path (e.g., '/dashboard', '/login')
 * @returns The full URL with origin and base path
 */
export const getFullRedirectUrl = (path: string): string => {
  if (typeof window === 'undefined') {
    return path;
  }
  const basePath = getBasePath();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${window.location.origin}${basePath}${cleanPath}`;
};


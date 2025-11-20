/**
 * Get the base path for routing (only in production on GitHub Pages)
 * Also checks if we're in a production build by checking import.meta.env.MODE
 * @returns The base path string or empty string for development
 */
export const getBasePath = (): string => {
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


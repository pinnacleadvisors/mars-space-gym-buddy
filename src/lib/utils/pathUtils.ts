/**
 * Get the base path for routing (only in production on GitHub Pages)
 * @returns The base path string or empty string for development
 */
export const getBasePath = (): string => {
  if (typeof window !== 'undefined' && window.location.hostname === 'pinnacleadvisors.github.io') {
    return '/mars-space-gym-buddy';
  }
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


/**
 * Simple client-side rate limiting utility
 * Note: This is a basic implementation. For production, use server-side rate limiting.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Checks if an action is rate limited
 * @param key - Unique identifier for the rate limit (e.g., user ID, IP, action type)
 * @param maxRequests - Maximum number of requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns true if rate limited, false otherwise
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 5,
  windowMs: number = 60000 // 1 minute default
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // Create new entry or reset expired entry
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return false;
  }

  if (entry.count >= maxRequests) {
    return true; // Rate limited
  }

  // Increment count
  entry.count++;
  return false;
}

/**
 * Gets the remaining time until rate limit resets (in milliseconds)
 * @param key - Unique identifier for the rate limit
 * @returns Remaining time in milliseconds, or 0 if not rate limited
 */
export function getRateLimitResetTime(key: string): number {
  const entry = rateLimitStore.get(key);
  if (!entry) return 0;

  const now = Date.now();
  if (now > entry.resetTime) return 0;

  return entry.resetTime - now;
}

/**
 * Clears rate limit for a specific key
 * @param key - Unique identifier for the rate limit
 */
export function clearRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Clears all rate limits (useful for testing)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Gets the current count for a rate limit key
 * @param key - Unique identifier for the rate limit
 * @returns Current count or 0 if no entry exists
 */
export function getRateLimitCount(key: string): number {
  const entry = rateLimitStore.get(key);
  if (!entry) return 0;

  const now = Date.now();
  if (now > entry.resetTime) return 0;

  return entry.count;
}


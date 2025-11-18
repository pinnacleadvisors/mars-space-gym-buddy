/**
 * Account lockout utility for tracking failed login attempts
 * Uses localStorage for client-side tracking (for production, use server-side)
 */

interface LockoutEntry {
  attempts: number;
  lockedUntil: number | null;
  lastAttempt: number;
}

const LOCKOUT_THRESHOLD = 5; // Lock after 5 failed attempts
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
const ATTEMPT_WINDOW = 15 * 60 * 1000; // Reset attempts after 15 minutes of no activity

const STORAGE_KEY_PREFIX = 'login_attempts_';

/**
 * Get storage key for an email
 */
function getStorageKey(email: string): string {
  return `${STORAGE_KEY_PREFIX}${email.toLowerCase()}`;
}

/**
 * Get lockout entry for an email
 */
function getLockoutEntry(email: string): LockoutEntry | null {
  try {
    const key = getStorageKey(email);
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    
    const entry: LockoutEntry = JSON.parse(stored);
    
    // Check if lockout has expired
    if (entry.lockedUntil && Date.now() > entry.lockedUntil) {
      clearLockout(email);
      return null;
    }
    
    // Check if attempt window has expired (reset attempts)
    if (Date.now() - entry.lastAttempt > ATTEMPT_WINDOW) {
      clearLockout(email);
      return null;
    }
    
    return entry;
  } catch (error) {
    console.error('Error reading lockout entry:', error);
    return null;
  }
}

/**
 * Record a failed login attempt
 */
export function recordFailedAttempt(email: string): {
  isLocked: boolean;
  remainingAttempts: number;
  lockedUntil: number | null;
} {
  const entry = getLockoutEntry(email) || {
    attempts: 0,
    lockedUntil: null,
    lastAttempt: 0,
  };

  entry.attempts += 1;
  entry.lastAttempt = Date.now();

  // Check if we should lock the account
  if (entry.attempts >= LOCKOUT_THRESHOLD) {
    entry.lockedUntil = Date.now() + LOCKOUT_DURATION;
  }

  // Save to localStorage
  try {
    const key = getStorageKey(email);
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    console.error('Error saving lockout entry:', error);
  }

  return {
    isLocked: entry.lockedUntil !== null && Date.now() < entry.lockedUntil,
    remainingAttempts: Math.max(0, LOCKOUT_THRESHOLD - entry.attempts),
    lockedUntil: entry.lockedUntil,
  };
}

/**
 * Clear lockout for an email (on successful login)
 */
export function clearLockout(email: string): void {
  try {
    const key = getStorageKey(email);
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing lockout:', error);
  }
}

/**
 * Check if an account is currently locked
 */
export function isAccountLocked(email: string): {
  isLocked: boolean;
  lockedUntil: number | null;
  remainingTime: number | null;
} {
  const entry = getLockoutEntry(email);
  
  if (!entry || !entry.lockedUntil) {
    return {
      isLocked: false,
      lockedUntil: null,
      remainingTime: null,
    };
  }

  const now = Date.now();
  const isLocked = now < entry.lockedUntil;
  const remainingTime = isLocked ? entry.lockedUntil - now : null;

  return {
    isLocked,
    lockedUntil: entry.lockedUntil,
    remainingTime,
  };
}

/**
 * Get remaining attempts before lockout
 */
export function getRemainingAttempts(email: string): number {
  const entry = getLockoutEntry(email);
  if (!entry) return LOCKOUT_THRESHOLD;
  
  if (entry.lockedUntil && Date.now() < entry.lockedUntil) {
    return 0; // Account is locked
  }
  
  return Math.max(0, LOCKOUT_THRESHOLD - entry.attempts);
}

/**
 * Format remaining lockout time as human-readable string
 */
export function formatLockoutTime(remainingTime: number): string {
  const minutes = Math.floor(remainingTime / 60000);
  const seconds = Math.floor((remainingTime % 60000) / 1000);
  
  if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} and ${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
  return `${seconds} second${seconds !== 1 ? 's' : ''}`;
}


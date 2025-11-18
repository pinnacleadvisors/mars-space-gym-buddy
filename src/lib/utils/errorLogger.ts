/**
 * Error logging utility
 * Centralizes error logging for the application
 */

export interface ErrorContext {
  [key: string]: any;
}

/**
 * Logs an error with context information
 * In production, this could send errors to an error tracking service (e.g., Sentry, LogRocket)
 */
export const logError = (error: Error | unknown, context?: ErrorContext): void => {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  
  const errorLog = {
    message: errorObj.message,
    stack: errorObj.stack,
    name: errorObj.name,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    context: context || {},
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error logged:', errorLog);
  }

  // In production, you would send this to an error tracking service
  // Example: Sentry.captureException(error, { extra: context });
  
  // For now, we'll store errors in localStorage for debugging
  // (Remove this in production or limit the number of stored errors)
  try {
    const storedErrors = JSON.parse(localStorage.getItem('error_logs') || '[]');
    storedErrors.push(errorLog);
    
    // Keep only last 10 errors
    const recentErrors = storedErrors.slice(-10);
    localStorage.setItem('error_logs', JSON.stringify(recentErrors));
  } catch (e) {
    // Ignore localStorage errors
    console.warn('Failed to store error log:', e);
  }
};

/**
 * Logs a warning
 */
export const logWarning = (message: string, context?: ErrorContext): void => {
  if (process.env.NODE_ENV === 'development') {
    console.warn('Warning:', message, context);
  }
};

/**
 * Logs an info message
 */
export const logInfo = (message: string, context?: ErrorContext): void => {
  if (process.env.NODE_ENV === 'development') {
    console.info('Info:', message, context);
  }
};

/**
 * Gets recent error logs (for debugging/admin purposes)
 */
export const getRecentErrors = (): any[] => {
  try {
    return JSON.parse(localStorage.getItem('error_logs') || '[]');
  } catch {
    return [];
  }
};

/**
 * Clears error logs
 */
export const clearErrorLogs = (): void => {
  try {
    localStorage.removeItem('error_logs');
  } catch {
    // Ignore localStorage errors
  }
};


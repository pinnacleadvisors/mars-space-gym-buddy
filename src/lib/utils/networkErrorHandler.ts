import { logError } from './errorLogger';
import { ErrorType, AppError } from './errorHandler';

/**
 * Checks if the error is a network error
 */
export const isNetworkError = (error: any): boolean => {
  if (!error) return false;

  // Check for common network error indicators
  return (
    error.message?.includes('network') ||
    error.message?.includes('fetch') ||
    error.message?.includes('Failed to fetch') ||
    error.message?.includes('NetworkError') ||
    error.message?.includes('Network request failed') ||
    error.code === 'ECONNABORTED' ||
    error.code === 'ETIMEDOUT' ||
    error.name === 'NetworkError' ||
    (error.status === 0 && error.message?.includes('fetch'))
  );
};

/**
 * Handles network errors with retry logic
 */
export const handleNetworkError = async (
  error: any,
  retryFn?: () => Promise<any>,
  maxRetries: number = 3
): Promise<AppError> => {
  if (!isNetworkError(error)) {
    return {
      type: ErrorType.UNKNOWN,
      message: error?.message || 'An error occurred',
      userMessage: 'An unexpected error occurred. Please try again.',
      retryable: false,
    };
  }

  logError(error, {
    errorType: 'NETWORK',
    retryable: true,
  });

  // Attempt retry if retry function provided
  if (retryFn && maxRetries > 0) {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
      return await retryFn();
    } catch (retryError) {
      if (maxRetries > 1) {
        return handleNetworkError(retryError, retryFn, maxRetries - 1);
      }
    }
  }

  return {
    type: ErrorType.NETWORK,
    message: error.message || 'Network error occurred',
    userMessage: 'Network error. Please check your internet connection and try again.',
    retryable: true,
    originalError: error,
  };
};

/**
 * Checks if the device is online
 */
export const isOnline = (): boolean => {
  return navigator.onLine;
};

/**
 * Sets up online/offline event listeners
 */
export const setupNetworkListeners = (
  onOnline?: () => void,
  onOffline?: () => void
): (() => void) => {
  const handleOnline = () => {
    if (onOnline) onOnline();
  };

  const handleOffline = () => {
    if (onOffline) onOffline();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};


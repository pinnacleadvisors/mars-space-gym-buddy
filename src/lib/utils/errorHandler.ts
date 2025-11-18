import { supabase } from '@/integrations/supabase/client';
import { logError } from './errorLogger';
import { isSessionError, handleSessionError } from './sessionUtils';

/**
 * Error types for better error categorization
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  SUPABASE = 'SUPABASE',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Standardized error interface
 */
export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: any;
  code?: string;
  statusCode?: number;
  userMessage?: string;
  retryable?: boolean;
}

/**
 * Determines the error type from an error object
 */
export const getErrorType = (error: any): ErrorType => {
  if (!error) return ErrorType.UNKNOWN;

  // Network errors
  if (
    error.message?.includes('network') ||
    error.message?.includes('fetch') ||
    error.message?.includes('Failed to fetch') ||
    error.code === 'ECONNABORTED' ||
    error.code === 'ETIMEDOUT'
  ) {
    return ErrorType.NETWORK;
  }

  // Supabase errors
  if (error.code || error.hint || error.details) {
    return ErrorType.SUPABASE;
  }

  // Authentication errors
  if (isSessionError(error) || error.status === 401) {
    return ErrorType.AUTHENTICATION;
  }

  // Authorization errors
  if (error.status === 403 || error.message?.includes('permission') || error.message?.includes('forbidden')) {
    return ErrorType.AUTHORIZATION;
  }

  // Validation errors
  if (error.name === 'ZodError' || error.message?.includes('validation')) {
    return ErrorType.VALIDATION;
  }

  return ErrorType.UNKNOWN;
};

/**
 * Converts various error types to a standardized AppError
 */
export const normalizeError = (error: any): AppError => {
  const type = getErrorType(error);
  
  let message = 'An unexpected error occurred';
  let userMessage = 'Something went wrong. Please try again.';
  let code: string | undefined;
  let statusCode: number | undefined;
  let retryable = false;

  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  } else if (error?.message) {
    message = error.message;
  }

  // Handle Supabase errors
  if (type === ErrorType.SUPABASE) {
    code = error.code;
    message = error.message || message;
    
    // Map Supabase error codes to user-friendly messages
    switch (error.code) {
      case 'PGRST116':
        userMessage = 'No data found.';
        break;
      case '23505':
        userMessage = 'This record already exists.';
        break;
      case '23503':
        userMessage = 'Cannot delete this record because it is in use.';
        break;
      case '42501':
        userMessage = 'You do not have permission to perform this action.';
        break;
      default:
        userMessage = error.message || 'A database error occurred.';
    }
  }

  // Handle network errors
  if (type === ErrorType.NETWORK) {
    userMessage = 'Network error. Please check your internet connection and try again.';
    retryable = true;
  }

  // Handle authentication errors
  if (type === ErrorType.AUTHENTICATION) {
    userMessage = 'Your session has expired. Please log in again.';
    retryable = false;
  }

  // Handle authorization errors
  if (type === ErrorType.AUTHORIZATION) {
    userMessage = 'You do not have permission to perform this action.';
    retryable = false;
  }

  // Handle validation errors
  if (type === ErrorType.VALIDATION) {
    if (error.issues && Array.isArray(error.issues)) {
      // Zod validation errors
      const firstIssue = error.issues[0];
      userMessage = firstIssue.message || 'Please check your input and try again.';
    } else {
      userMessage = error.message || 'Please check your input and try again.';
    }
    retryable = false;
  }

  // Extract status code if available
  if (error.status || error.statusCode) {
    statusCode = error.status || error.statusCode;
  }

  return {
    type,
    message,
    originalError: error,
    code,
    statusCode,
    userMessage,
    retryable,
  };
};

/**
 * Handles an error with logging and optional session handling
 */
export const handleError = async (
  error: any,
  context?: { [key: string]: any }
): Promise<AppError> => {
  const appError = normalizeError(error);

  // Handle session errors automatically
  if (appError.type === ErrorType.AUTHENTICATION) {
    const sessionHandled = await handleSessionError(error);
    if (sessionHandled) {
      // Session was refreshed, error might be resolved
      return {
        ...appError,
        userMessage: 'Session refreshed. Please try again.',
        retryable: true,
      };
    }
  }

  // Log the error
  logError(error, {
    errorType: appError.type,
    errorCode: appError.code,
    statusCode: appError.statusCode,
    ...context,
  });

  return appError;
};

/**
 * Wraps an async function with error handling
 */
export const withErrorHandling = async <T>(
  fn: () => Promise<T>,
  context?: { [key: string]: any }
): Promise<{ data: T | null; error: AppError | null }> => {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (error) {
    const appError = await handleError(error, context);
    return { data: null, error: appError };
  }
};

/**
 * Gets a user-friendly error message from an error
 */
export const getUserFriendlyMessage = (error: any): string => {
  const appError = normalizeError(error);
  return appError.userMessage || 'An unexpected error occurred. Please try again.';
};

/**
 * Checks if an error is retryable
 */
export const isRetryableError = (error: any): boolean => {
  const appError = normalizeError(error);
  return appError.retryable ?? false;
};


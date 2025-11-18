import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { handleError, getUserFriendlyMessage, AppError, ErrorType } from '@/lib/utils/errorHandler';
import { useNavigate } from 'react-router-dom';

/**
 * Hook for handling errors consistently across the application
 * Provides error handling with toast notifications and optional navigation
 */
export const useErrorHandler = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  /**
   * Handles an error and shows a toast notification
   */
  const handleErrorWithToast = useCallback(
    async (
      error: any,
      options?: {
        showToast?: boolean;
        toastTitle?: string;
        redirectTo?: string;
        context?: { [key: string]: any };
      }
    ) => {
      const {
        showToast = true,
        toastTitle,
        redirectTo,
        context,
      } = options || {};

      const appError = await handleError(error, context);

      if (showToast) {
        toast({
          variant: 'destructive',
          title: toastTitle || 'Error',
          description: appError.userMessage || getUserFriendlyMessage(error),
        });
      }

      // Handle specific error types
      if (appError.type === ErrorType.AUTHENTICATION && !redirectTo) {
        // Redirect to login if not already there
        if (window.location.pathname !== '/login') {
          navigate('/login', { replace: true });
        }
      } else if (redirectTo) {
        navigate(redirectTo, { replace: true });
      }

      return appError;
    },
    [toast, navigate]
  );

  /**
   * Wraps an async function with error handling and toast notifications
   */
  const withErrorHandling = useCallback(
    async <T>(
      fn: () => Promise<T>,
      options?: {
        showToast?: boolean;
        toastTitle?: string;
        successMessage?: string;
        successTitle?: string;
        redirectTo?: string;
        context?: { [key: string]: any };
      }
    ): Promise<{ data: T | null; error: AppError | null; success: boolean }> => {
      try {
        const data = await fn();
        
        // Show success message if provided
        if (options?.successMessage && options?.showToast !== false) {
          toast({
            title: options.successTitle || 'Success',
            description: options.successMessage,
          });
        }

        // Redirect if specified
        if (options?.redirectTo) {
          navigate(options.redirectTo, { replace: true });
        }

        return { data, error: null, success: true };
      } catch (error) {
        const appError = await handleErrorWithToast(error, {
          showToast: options?.showToast,
          toastTitle: options?.toastTitle,
          redirectTo: options?.redirectTo,
          context: options?.context,
        });

        return { data: null, error: appError, success: false };
      }
    },
    [handleErrorWithToast, toast, navigate]
  );

  return {
    handleError: handleErrorWithToast,
    withErrorHandling,
    getUserFriendlyMessage,
  };
};


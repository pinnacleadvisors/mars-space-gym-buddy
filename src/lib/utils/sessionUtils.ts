import { supabase } from '@/integrations/supabase/client';

/**
 * Checks if an error is related to an expired or invalid session
 */
export const isSessionError = (error: any): boolean => {
  if (!error) return false;
  
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code?.toLowerCase() || '';
  
  return (
    errorMessage.includes('expired') ||
    errorMessage.includes('invalid token') ||
    errorMessage.includes('jwt expired') ||
    errorMessage.includes('session') ||
    errorCode === 'invalid_token' ||
    errorCode === 'token_expired' ||
    error?.status === 401
  );
};

/**
 * Handles expired session errors by attempting to refresh or sign out
 */
export const handleSessionError = async (error: any): Promise<boolean> => {
  if (!isSessionError(error)) {
    return false;
  }

  try {
    // Try to refresh the session
    const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError || !session) {
      // Refresh failed, session is truly expired
      await supabase.auth.signOut();
      return false;
    }

    // Session refreshed successfully
    return true;
  } catch (err) {
    // Refresh failed, sign out
    await supabase.auth.signOut();
    return false;
  }
};

/**
 * Wraps a Supabase query to handle session errors automatically
 */
export const withSessionHandling = async <T>(
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> => {
  try {
    const result = await queryFn();
    
    if (result.error && isSessionError(result.error)) {
      const refreshed = await handleSessionError(result.error);
      if (refreshed) {
        // Retry the query after refresh
        return await queryFn();
      }
      // Session expired, return error
      return { data: null, error: { message: 'Session expired. Please log in again.' } };
    }
    
    return result;
  } catch (error: any) {
    if (isSessionError(error)) {
      await handleSessionError(error);
      return { data: null, error: { message: 'Session expired. Please log in again.' } };
    }
    return { data: null, error };
  }
};


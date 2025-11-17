import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Session timeout warning thresholds (in minutes before expiration)
 */
const SESSION_WARNING_THRESHOLDS = {
  CRITICAL: 5, // Show critical warning 5 minutes before expiration
  WARNING: 15, // Show warning 15 minutes before expiration
};

/**
 * Custom hook for session management
 * Handles session expiration warnings, refresh, and expired session handling
 */
export const useSessionManager = () => {
  const { toast } = useToast();
  const warningShownRef = useRef<Set<number>>(new Set());
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Gets session expiration time in milliseconds
   */
  const getSessionExpiration = useCallback(async (): Promise<number | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.expires_at) return null;
      
      // expires_at is in seconds, convert to milliseconds
      return session.expires_at * 1000;
    } catch (error) {
      console.error('Error getting session expiration:', error);
      return null;
    }
  }, []);

  /**
   * Calculates minutes until session expiration
   */
  const getMinutesUntilExpiration = useCallback(async (): Promise<number | null> => {
    const expirationTime = await getSessionExpiration();
    if (!expirationTime) return null;

    const now = Date.now();
    const minutesUntilExpiration = Math.floor((expirationTime - now) / (1000 * 60));
    return minutesUntilExpiration;
  }, [getSessionExpiration]);

  /**
   * Checks if session is expired
   */
  const isSessionExpired = useCallback(async (): Promise<boolean> => {
    const minutesUntilExpiration = await getMinutesUntilExpiration();
    if (minutesUntilExpiration === null) return true;
    return minutesUntilExpiration <= 0;
  }, [getMinutesUntilExpiration]);

  /**
   * Refreshes the session
   */
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        return false;
      }

      if (session) {
        // Reset warning flags after successful refresh
        warningShownRef.current.clear();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error refreshing session:', error);
      return false;
    }
  }, []);

  /**
   * Shows session timeout warning
   */
  const showSessionWarning = useCallback((minutesLeft: number, isCritical: boolean) => {
    const threshold = isCritical ? SESSION_WARNING_THRESHOLDS.CRITICAL : SESSION_WARNING_THRESHOLDS.WARNING;
    
    // Only show warning once per threshold
    if (warningShownRef.current.has(threshold)) {
      return;
    }

    warningShownRef.current.add(threshold);

    toast({
      variant: isCritical ? 'destructive' : 'default',
      title: isCritical ? 'Session Expiring Soon' : 'Session Timeout Warning',
      description: isCritical
        ? `Your session will expire in ${minutesLeft} minutes. Please save your work.`
        : `Your session will expire in ${minutesLeft} minutes.`,
      duration: isCritical ? 10000 : 5000,
    });
  }, [toast]);

  /**
   * Handles expired session
   */
  const handleExpiredSession = useCallback(async () => {
    try {
      // Clear any existing warnings
      warningShownRef.current.clear();

      // Show expired session message
      toast({
        variant: 'destructive',
        title: 'Session Expired',
        description: 'Your session has expired. Please log in again.',
        duration: 5000,
      });

      // Sign out the user
      await supabase.auth.signOut();

      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (error) {
      console.error('Error handling expired session:', error);
    }
  }, [toast]);

  /**
   * Monitors session expiration and shows warnings
   */
  const monitorSession = useCallback(async () => {
    try {
      // Check if there's an active session first
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // No active session, clear warnings and stop monitoring
        warningShownRef.current.clear();
        return;
      }

      const minutesUntilExpiration = await getMinutesUntilExpiration();
      
      if (minutesUntilExpiration === null) {
        // No valid expiration time
        return;
      }

      if (minutesUntilExpiration <= 0) {
        // Session expired
        await handleExpiredSession();
        return;
      }

      // Show warnings at thresholds
      if (minutesUntilExpiration <= SESSION_WARNING_THRESHOLDS.CRITICAL) {
        showSessionWarning(minutesUntilExpiration, true);
      } else if (minutesUntilExpiration <= SESSION_WARNING_THRESHOLDS.WARNING) {
        showSessionWarning(minutesUntilExpiration, false);
      }
    } catch (error) {
      console.error('Error monitoring session:', error);
    }
  }, [getMinutesUntilExpiration, handleExpiredSession, showSessionWarning]);

  /**
   * Sets up session monitoring
   */
  useEffect(() => {
    // Check session immediately
    monitorSession();

    // Set up interval to check session every minute
    checkIntervalRef.current = setInterval(() => {
      monitorSession();
    }, 60000); // Check every minute

    // Also listen for auth state changes to reset warnings
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Reset warnings when session is refreshed or user signs in
        warningShownRef.current.clear();
      } else if (event === 'SIGNED_OUT') {
        // Clear warnings on sign out
        warningShownRef.current.clear();
      }
    });

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      subscription.unsubscribe();
    };
  }, [monitorSession]);

  return {
    refreshSession,
    isSessionExpired,
    getMinutesUntilExpiration,
  };
};


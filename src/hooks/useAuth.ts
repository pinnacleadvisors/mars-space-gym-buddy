import { useState, useEffect, useCallback } from 'react';
import { User } from '@/types/user';
import { supabase } from '@/integrations/supabase/client';
import { getFullRedirectUrl } from '@/lib/utils/pathUtils';

/**
 * Custom hook for authentication management
 * Handles user authentication, profile fetching, and session management
 */
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Fetches user data from Supabase auth and profiles table
   * Combines auth user, profile, role, and membership data into User type
   */
  const fetchUserData = useCallback(async (authUser: any): Promise<User | null> => {
    if (!authUser) return null;

    try {
      // Fetch profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
      }

      // Fetch user role
      const { data: roles, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authUser.id)
        .limit(1);

      if (roleError) {
        console.error('Error fetching roles:', roleError);
      }

      // Get primary role (default to 'member')
      const role = roles && roles.length > 0 ? roles[0].role : 'member';

      // Fetch membership status
      const { data: membership, error: membershipError } = await supabase
        .from('user_memberships')
        .select('status, start_date, end_date')
        .eq('user_id', authUser.id)
        .eq('status', 'active')
        .eq('payment_status', 'paid')
        .gt('end_date', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (membershipError) {
        console.error('Error fetching membership:', membershipError);
      }

      // Map to User type
      const userData: User = {
        id: authUser.id,
        email: authUser.email || '',
        full_name: profile?.full_name || authUser.user_metadata?.full_name || '',
        phone: profile?.phone || undefined,
        role: role as 'member' | 'admin' | 'staff',
        membership_status: membership ? 'active' : 'inactive',
        membership_start_date: membership?.start_date || undefined,
        membership_end_date: membership?.end_date || undefined,
        created_at: profile?.created_at || authUser.created_at || new Date().toISOString(),
        updated_at: profile?.updated_at || new Date().toISOString(),
        email_verified: authUser.email_confirmed_at !== null && authUser.email_confirmed_at !== undefined,
      };

      return userData;
    } catch (error) {
      console.error('Error in fetchUserData:', error);
      return null;
    }
  }, []);

  /**
   * Initializes user data on mount and sets up auth state listener
   * Uses getUser() instead of getSession() to verify the session with the server
   * This prevents accessing protected routes after sign out via cached session data
   */
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // IMPORTANT: Use getUser() instead of getSession()
        // getSession() returns cached data from localStorage and can be stale/invalid
        // getUser() makes a network request to verify the token with the server
        // This ensures proper logout handling and prevents unauthorized access
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          // AuthSessionMissingError is expected when not logged in
          if (authError.name !== 'AuthSessionMissingError') {
            console.error('Error getting user:', authError);
          }
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        // If we have a valid user from the server, fetch their data
        if (authUser && mounted) {
          const userData = await fetchUserData(authUser);
          if (userData) {
            setUser(userData);
          } else {
            // Fallback to auth user data if fetchUserData fails
            const fallbackUser: User = {
              id: authUser.id,
              email: authUser.email || '',
              full_name: authUser.user_metadata?.full_name || '',
              phone: undefined,
              role: 'member',
              membership_status: 'inactive',
              membership_start_date: undefined,
              membership_end_date: undefined,
              created_at: authUser.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
              email_verified: authUser.email_confirmed_at !== null && authUser.email_confirmed_at !== undefined,
            };
            setUser(fallbackUser);
          }
        } else if (mounted) {
          // No valid user from server
          setUser(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_OUT' || !session?.user) {
          setUser(null);
          setLoading(false);
          return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          console.log('Auth state change:', event, session?.user?.id);
          setLoading(true);
          
          // Create fallback user immediately so ProtectedRoute doesn't redirect
          // This ensures login works even if fetchUserData hangs or fails
          if (session?.user) {
            const fallbackUser: User = {
              id: session.user.id,
              email: session.user.email || '',
              full_name: session.user.user_metadata?.full_name || '',
              phone: undefined,
              role: 'member',
              membership_status: 'inactive',
              membership_start_date: undefined,
              membership_end_date: undefined,
              created_at: session.user.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
              email_verified: session.user.email_confirmed_at !== null && session.user.email_confirmed_at !== undefined,
            };
            console.log('Setting fallback user immediately:', fallbackUser.id);
            setUser(fallbackUser);
          }
          
          // Try to fetch full user data in the background (with timeout)
          try {
            const fetchWithTimeout = Promise.race([
              fetchUserData(session.user),
              new Promise<null>((resolve) => 
                setTimeout(() => {
                  console.warn('fetchUserData timeout after 3 seconds, using fallback user');
                  resolve(null);
                }, 3000)
              ),
            ]);
            
            const userData = await fetchWithTimeout;
            
            // Update with full user data if available
            if (userData) {
              console.log('User data fetched successfully, updating:', userData.id);
            setUser(userData);
            } else {
              console.log('Using fallback user (fetchUserData returned null or timed out)');
            }
          } catch (error) {
            console.error('Error updating user data:', error);
            // Fallback user already set above, so we can continue
          } finally {
            setLoading(false);
            console.log('Auth state update complete, loading set to false');
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  /**
   * Login with email and password
   */
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        const userData = await fetchUserData(data.user);
        setUser(userData);
      }

      return { error: null };
    } catch (error: any) {
      console.error('Login error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout current user
   */
  const logout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }

    setUser(null);
      return { error: null };
    } catch (error: any) {
      console.error('Logout error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Register new user
   */
  const register = async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: getFullRedirectUrl('/auth/callback'),
        },
      });

      if (error) {
        throw error;
      }

      // Note: User data will be set automatically via auth state change listener
      // after email verification
      return { data, error: null };
    } catch (error: any) {
      console.error('Registration error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get current user (refresh from server)
   */
  const getUser = async (): Promise<User | null> => {
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      
      if (error || !authUser) {
        setUser(null);
        return null;
      }

      const userData = await fetchUserData(authUser);
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Error getting user:', error);
      setUser(null);
      return null;
    }
  };

  /**
   * Refresh the current session
   * Useful for manually refreshing before expiration
   */
  const refreshSession = async (): Promise<{ success: boolean; error?: any }> => {
    try {
      setLoading(true);
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        // If refresh fails, session might be expired
        if (error.message?.includes('expired') || error.message?.includes('invalid')) {
          setUser(null);
        }
        return { success: false, error };
      }

      if (session?.user) {
        const userData = await fetchUserData(session.user);
        setUser(userData);
        return { success: true };
      }

      return { success: false, error: new Error('No session after refresh') };
    } catch (error: any) {
      console.error('Error refreshing session:', error);
      setUser(null);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    login,
    logout,
    register,
    getUser,
    refreshSession,
  };
};

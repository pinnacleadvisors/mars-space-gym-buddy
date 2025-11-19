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
   * Also handles session refresh on app load
   */
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session and refresh if needed
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          if (mounted) {
            setUser(null);
    setLoading(false);
          }
          return;
        }

        // Check if session exists and is valid
        if (session) {
          // Check if session is expired
          const now = Date.now() / 1000; // Convert to seconds
          if (session.expires_at && session.expires_at < now) {
            // Session expired, try to refresh
            console.log('Session expired, attempting refresh...');
            const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError || !refreshedSession) {
              console.error('Error refreshing expired session:', refreshError);
              if (mounted) {
                setUser(null);
                setLoading(false);
              }
              return;
            }

            // Use refreshed session
            if (refreshedSession.user && mounted) {
              const userData = await fetchUserData(refreshedSession.user);
              if (userData) {
                setUser(userData);
              } else {
                // Fallback to auth user data if fetchUserData fails
                const fallbackUser: User = {
                  id: refreshedSession.user.id,
                  email: refreshedSession.user.email || '',
                  full_name: refreshedSession.user.user_metadata?.full_name || '',
                  phone: undefined,
                  role: 'member',
                  membership_status: 'inactive',
                  membership_start_date: undefined,
                  membership_end_date: undefined,
                  created_at: refreshedSession.user.created_at || new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  email_verified: refreshedSession.user.email_confirmed_at !== null && refreshedSession.user.email_confirmed_at !== undefined,
                };
                setUser(fallbackUser);
              }
            }
          } else if (session.user && mounted) {
            // Session is valid, fetch user data
            const userData = await fetchUserData(session.user);
            if (userData) {
              setUser(userData);
            } else {
              // Fallback to auth user data if fetchUserData fails
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
              setUser(fallbackUser);
            }
          }
        } else if (mounted) {
          // No session
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
          setLoading(true);
          try {
            const userData = await fetchUserData(session.user);
            // Always set user data, even if fetchUserData returns null (creates user from auth user)
            // This prevents infinite loops when queries fail
            if (userData) {
              setUser(userData);
            } else if (session.user) {
              // If fetchUserData returns null, create a minimal user from auth user
              // This allows login to complete even if profile/role queries fail
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
              setUser(fallbackUser);
            }
          } catch (error) {
            console.error('Error updating user data:', error);
            // Even on error, create a fallback user to prevent redirect loops
            if (session.user) {
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
              setUser(fallbackUser);
            } else {
              setUser(null);
            }
          } finally {
            setLoading(false);
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
          emailRedirectTo: getFullRedirectUrl('/dashboard'),
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

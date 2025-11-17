import { useState, useEffect, useCallback } from 'react';
import { User } from '@/types/user';
import { supabase } from '@/integrations/supabase/client';

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
      };

      return userData;
    } catch (error) {
      console.error('Error in fetchUserData:', error);
      return null;
    }
  }, []);

  /**
   * Initializes user data on mount and sets up auth state listener
   */
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        if (session?.user && mounted) {
          const userData = await fetchUserData(session.user);
          setUser(userData);
        } else if (mounted) {
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
            setUser(userData);
          } catch (error) {
            console.error('Error updating user data:', error);
            setUser(null);
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
          emailRedirectTo: `${window.location.origin}/dashboard`,
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

  return {
    user,
    loading,
    login,
    logout,
    register,
    getUser,
  };
};

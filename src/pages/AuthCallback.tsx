import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

/**
 * Auth Callback Page
 * Handles email verification and OAuth callbacks (Google, etc.) from Supabase.
 * Processes the access token from the URL hash and redirects to dashboard.
 * 
 * For OAuth users (Google Sign In):
 * - Creates profile and assigns 'member' role if they don't exist
 * - Uses user metadata from OAuth provider (full_name, avatar_url, etc.)
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Verifying your account...');

  /**
   * Ensures profile and role exist for OAuth users
   * This is necessary because OAuth users don't go through the normal registration flow
   * and may not trigger the database trigger that creates profile/role
   */
  const ensureProfileAndRole = async (userId: string, userMetadata: any) => {
    try {
      setStatus('Setting up your profile...');
      
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      // Create profile if it doesn't exist
      if (!existingProfile) {
        const fullName = userMetadata?.full_name || 
                        userMetadata?.name || 
                        `${userMetadata?.given_name || ''} ${userMetadata?.family_name || ''}`.trim() ||
                        '';
        const avatarUrl = userMetadata?.avatar_url || userMetadata?.picture || null;
        
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            full_name: fullName,
            avatar_url: avatarUrl,
          });

        if (profileError && profileError.code !== '23505') { // Ignore duplicate key errors
          console.error('Error creating profile for OAuth user:', profileError);
        } else {
          console.log('Profile created for OAuth user:', userId);
        }
      }

      // Check if role exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', 'member')
        .single();

      // Create role if it doesn't exist
      if (!existingRole) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: 'member',
          });

        if (roleError && roleError.code !== '23505') { // Ignore duplicate key errors
          console.error('Error creating role for OAuth user:', roleError);
        } else {
          console.log('Member role assigned to OAuth user:', userId);
        }
      }
    } catch (error) {
      console.error('Error ensuring profile and role for OAuth user:', error);
      // Don't throw - this is a fallback mechanism
    }
  };

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setStatus('Verifying your account...');
        
        // First, check if there's already an existing session
        // (Supabase client may have already processed tokens from the hash)
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        
        if (existingSession) {
          console.log('AuthCallback: Existing session found for user:', existingSession.user?.id);
          
          // Ensure profile and role exist for OAuth users
          if (existingSession.user) {
            await ensureProfileAndRole(existingSession.user.id, existingSession.user.user_metadata);
          }
          
          // Clear the hash from the URL for cleaner appearance
          if (window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname);
          }
          
          // Redirect to dashboard
          navigate('/dashboard', { replace: true });
          return;
        }

        // Get the hash from the URL (contains access_token, refresh_token, etc.)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type'); // 'signup', 'recovery', 'magiclink', etc.

        console.log('AuthCallback: Processing tokens, type:', type);

        // If we have tokens in the hash, explicitly set the session
        if (accessToken && refreshToken) {
          setStatus('Establishing your session...');
          console.log('AuthCallback: Setting session with tokens');
          
          // Explicitly set the session using the tokens from the URL
          const { data, error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (setSessionError) {
            console.error('Session set error:', setSessionError);
            
            // Check if this is an invalid/expired verification link (for signup type)
            const errorMessage = setSessionError.message?.toLowerCase() || '';
            const isInvalidLink = errorMessage.includes('invalid') || 
                                 errorMessage.includes('expired') ||
                                 errorMessage.includes('token');
            
            if (type === 'signup' && isInvalidLink) {
              // Redirect to verify-email page with error state
              console.log('AuthCallback: Invalid/expired verification link, redirecting to verify-email');
              navigate('/verify-email?error=invalid_link', { replace: true });
              return;
            }
            
            setError(setSessionError.message);
            return;
          }

          if (data.session) {
            console.log('Auth callback successful, session established for user:', data.session.user?.id);
            
            // Ensure profile and role exist for OAuth users
            if (data.session.user) {
              await ensureProfileAndRole(data.session.user.id, data.session.user.user_metadata);
            }
            
            // Clear the hash from the URL for cleaner appearance
            window.history.replaceState(null, '', window.location.pathname);
            
            // Redirect based on callback type
            if (type === 'recovery') {
              navigate('/reset-password', { replace: true });
            } else {
              navigate('/dashboard', { replace: true });
            }
            return;
          }
        }

        // Check if there's an error in the URL hash (e.g., error_description)
        const errorDescription = hashParams.get('error_description');
        const errorCode = hashParams.get('error');
        
        // If we have an error and it's related to signup verification, redirect to verify-email
        if ((errorDescription || errorCode) && type === 'signup') {
          const errorMsg = (errorDescription || errorCode || '').toLowerCase();
          if (errorMsg.includes('invalid') || errorMsg.includes('expired') || errorMsg.includes('token')) {
            console.log('AuthCallback: Invalid/expired verification link in URL, redirecting to verify-email');
            navigate('/verify-email?error=invalid_link', { replace: true });
            return;
          }
        }

        // No session and no tokens - redirect to login
        console.log('AuthCallback: No session and no tokens, redirecting to login');
        navigate('/login', { replace: true });
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message || 'An error occurred during authentication');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
        <div className="text-center space-y-4">
          <div className="text-destructive text-lg font-semibold">
            Authentication Error
          </div>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="text-secondary hover:underline"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">{status}</p>
      </div>
    </div>
  );
};

export default AuthCallback;


import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

/**
 * Auth Callback Page
 * Handles email verification and OAuth callbacks from Supabase.
 * Processes the access token from the URL hash and redirects to dashboard.
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash from the URL (contains access_token, refresh_token, etc.)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type'); // 'signup', 'recovery', 'magiclink', etc.

        console.log('AuthCallback: Processing tokens, type:', type);

        // If we have tokens in the hash, explicitly set the session
        if (accessToken && refreshToken) {
          console.log('AuthCallback: Setting session with tokens');
          
          // Explicitly set the session using the tokens from the URL
          const { data, error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (setSessionError) {
            console.error('Session set error:', setSessionError);
            setError(setSessionError.message);
            return;
          }

          if (data.session) {
            console.log('Auth callback successful, session established for user:', data.session.user?.id);
            
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

        // If no tokens in hash, check if there's an existing session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('AuthCallback: Existing session found, redirecting to dashboard');
          navigate('/dashboard', { replace: true });
        } else {
          console.log('AuthCallback: No session, redirecting to login');
          // No session and no tokens - redirect to login
          navigate('/login', { replace: true });
        }
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
        <p className="text-muted-foreground">Verifying your account...</p>
      </div>
    </div>
  );
};

export default AuthCallback;


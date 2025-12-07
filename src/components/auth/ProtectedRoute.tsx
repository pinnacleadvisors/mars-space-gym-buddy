import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import EmailVerificationRequired from '@/pages/EmailVerificationRequired';

interface ProtectedRouteProps {
  children: ReactNode;
  requireEmailVerification?: boolean;
}

/**
 * ProtectedRoute component
 * Wraps routes that require authentication
 * Redirects to login if user is not authenticated
 * Shows email verification page if email is not verified (when required)
 */
export const ProtectedRoute = ({ 
  children, 
  requireEmailVerification = true 
}: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  // Give auth state time to update after login (max 2 seconds)
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Special case for /verify-email route: allow access if signup data exists in sessionStorage
  // This handles the case where user just signed up but doesn't have an active session yet
  if (location.pathname === '/verify-email') {
    const pendingSignup = sessionStorage.getItem('pendingSignup');
    if (!user && pendingSignup) {
      // Allow access to verify-email page with pending signup data
      return <>{children}</>;
    }
  }

  // Redirect to login if not authenticated
  // Save the attempted location to redirect back after login
  if (!user) {
    console.log('ProtectedRoute: No user found, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check email verification if required
  if (requireEmailVerification && !user.email_verified) {
    return <EmailVerificationRequired />;
  }

  return <>{children}</>;
};


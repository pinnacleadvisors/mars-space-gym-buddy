import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Loader2 } from 'lucide-react';
import AdminLogin from '@/pages/AdminLogin';

interface AdminRouteProps {
  children: ReactNode;
}

/**
 * AdminRoute component
 * Wraps routes that require admin privileges
 * Shows AdminLogin if user is not authenticated or not admin
 * Redirects to home if user is authenticated but not admin
 */
export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAdmin, isLoading } = useAdminAuth();
  const location = useLocation();

  // Show loading state while checking admin status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show admin login if not authenticated or not admin
  if (!isAdmin) {
    // If user is on an admin route but not admin, show login page
    // This allows them to log in as admin
    return <AdminLogin />;
  }

  return <>{children}</>;
};


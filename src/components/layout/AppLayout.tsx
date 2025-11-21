import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useSessionManager } from "@/hooks/useSessionManager";
import { NavigationLoadingIndicator } from "@/hooks/useNavigationLoading";
import { useAuth } from "@/hooks/useAuth";

interface AppLayoutProps {
  children: ReactNode;
}

// List of public routes that shouldn't show navigation
const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password'];

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const { user } = useAuth();
  const isPublicRoute = publicRoutes.includes(location.pathname);
  const showNavigation = !isPublicRoute && user;

  // Initialize session management (hooks must be called unconditionally)
  // The hook internally checks if user is authenticated
  useSessionManager();

  // If it's a public route, render children without navigation
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // If user is not authenticated but on a protected route, still show layout
  // (ProtectedRoute will handle redirect)
  return (
    <SidebarProvider>
      {showNavigation && <NavigationLoadingIndicator />}
      <div className="relative flex min-h-screen w-full">
        {showNavigation && (
        <div className="hidden md:block">
          <AppSidebar />
        </div>
        )}
        <div className="flex flex-1 flex-col">
          {showNavigation && <TopBar />}
          <main className={showNavigation ? "flex-1 pb-20 md:pb-4" : "flex-1"}>{children}</main>
          {showNavigation && <BottomNav />}
        </div>
      </div>
    </SidebarProvider>
  );
}

import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AdminRoute } from "./components/auth/AdminRoute";
import { ErrorBoundary } from "./components/error/ErrorBoundary";
import { getBasePath } from "./lib/utils/pathUtils";
import { RouteSuspense } from "./components/loading/RouteSuspense";
import { PageSkeleton } from "./components/loading/PageSkeleton";

// Public routes - keep as regular imports for faster initial load
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";

// Protected routes - lazy load for code splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Classes = lazy(() => import("./pages/Classes"));
const ClassDetail = lazy(() => import("./pages/ClassDetail"));
const Bookings = lazy(() => import("./pages/Bookings"));
const EntryExit = lazy(() => import("./pages/EntryExit"));
const ManageMemberships = lazy(() => import("./pages/ManageMemberships"));
const Profile = lazy(() => import("./pages/Profile"));
const Rewards = lazy(() => import("./pages/Rewards"));
const Settings = lazy(() => import("./pages/Settings"));
const EmailVerificationRequired = lazy(() => import("./pages/EmailVerificationRequired"));

// Admin routes - lazy load for code splitting
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const AdminManageClasses = lazy(() => import("./pages/AdminManageClasses"));
const AdminManageMemberships = lazy(() => import("./pages/AdminManageMemberships"));
const AdminUserMemberships = lazy(() => import("./pages/AdminUserMemberships"));
const AdminManageDeals = lazy(() => import("./pages/AdminManageDeals"));
const AdminRewardClaim = lazy(() => import("./pages/AdminRewardClaim"));

// Configure React Query client with optimal settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

/**
 * Handles GitHub Pages SPA redirect
 * When a 404 occurs on GitHub Pages, the 404.html stores the original path
 * in sessionStorage and redirects to the root. This component reads that
 * stored path and navigates to it.
 * 
 * The hash (containing auth tokens) is preserved in the URL by 404.html,
 * so Supabase client will detect and process the tokens automatically.
 */
const GitHubPagesRedirectHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const redirectPath = sessionStorage.getItem('redirectPath');
    if (redirectPath && location.pathname === '/') {
      sessionStorage.removeItem('redirectPath');
      
      // Navigate to the stored path using React Router
      // The hash with auth tokens is already in the URL (preserved by 404.html)
      // Supabase client will detect and process them automatically
      navigate(redirectPath, { replace: true });
    }
  }, [navigate, location.pathname]);

  return null;
};

const App = () => {
  const basePath = getBasePath() || undefined;
  
  return (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
          <BrowserRouter basename={basePath}>
          <GitHubPagesRedirectHandler />
          <AppLayout>
            <Routes>
            {/* Public Routes - No lazy loading for faster initial load */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            
            {/* Email Verification Route - Requires Auth but not email verification */}
            <Route
              path="/verify-email"
              element={
                <ProtectedRoute requireEmailVerification={false}>
                  <RouteSuspense>
                    <EmailVerificationRequired />
                  </RouteSuspense>
                </ProtectedRoute>
              }
            />
            
            {/* Protected Routes - Require Authentication */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <RouteSuspense>
                    <Dashboard />
                  </RouteSuspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/classes"
              element={
                <ProtectedRoute>
                  <RouteSuspense>
                    <Classes />
                  </RouteSuspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/classes/:classId"
              element={
                <ProtectedRoute>
                  <RouteSuspense>
                    <ClassDetail />
                  </RouteSuspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings"
              element={
                <ProtectedRoute>
                  <RouteSuspense>
                    <Bookings />
                  </RouteSuspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/managememberships"
              element={
                <ProtectedRoute>
                  <RouteSuspense>
                    <ManageMemberships />
                  </RouteSuspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <RouteSuspense>
                    <Profile />
                  </RouteSuspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/qr/entry-exit"
              element={
                <ProtectedRoute>
                  <RouteSuspense>
                    <EntryExit />
                  </RouteSuspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/rewards"
              element={
                <ProtectedRoute>
                  <RouteSuspense>
                    <Rewards />
                  </RouteSuspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <RouteSuspense>
                    <Settings />
                  </RouteSuspense>
                </ProtectedRoute>
              }
            />
            
            {/* Admin Routes - Require Admin Privileges */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <RouteSuspense>
                    <AdminDashboard />
                  </RouteSuspense>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <RouteSuspense>
                    <AdminUsers />
                  </RouteSuspense>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <AdminRoute>
                  <RouteSuspense>
                    <AdminAnalytics />
                  </RouteSuspense>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/manageclasses"
              element={
                <AdminRoute>
                  <RouteSuspense>
                    <AdminManageClasses />
                  </RouteSuspense>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/memberships"
              element={
                <AdminRoute>
                  <RouteSuspense>
                    <AdminManageMemberships />
                  </RouteSuspense>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/usermemberships"
              element={
                <AdminRoute>
                  <RouteSuspense>
                    <AdminUserMemberships />
                  </RouteSuspense>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/reward-claim"
              element={
                <AdminRoute>
                  <RouteSuspense>
                    <AdminRewardClaim />
                  </RouteSuspense>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/managedeals"
              element={
                <AdminRoute>
                  <RouteSuspense>
                    <AdminManageDeals />
                  </RouteSuspense>
                </AdminRoute>
              }
            />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);
};

export default App;

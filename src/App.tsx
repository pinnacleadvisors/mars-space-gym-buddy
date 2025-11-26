import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AdminRoute } from "./components/auth/AdminRoute";
import { ErrorBoundary } from "./components/error/ErrorBoundary";
import { getBasePath } from "./lib/utils/pathUtils";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Classes from "./pages/Classes";
import Bookings from "./pages/Bookings";
import EntryExit from "./pages/EntryExit";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminManageClasses from "./pages/AdminManageClasses";
import AdminManageMemberships from "./pages/AdminManageMemberships";
import AdminUserMemberships from "./pages/AdminUserMemberships";
import AdminManageDeals from "./pages/AdminManageDeals";
import ManageMemberships from "./pages/ManageMemberships";
import Profile from "./pages/Profile";
import Rewards from "./pages/Rewards";
import Settings from "./pages/Settings";
import AdminRewardClaim from "./pages/AdminRewardClaim";
import EmailVerificationRequired from "./pages/EmailVerificationRequired";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const basePath = getBasePath() || undefined;
  
  return (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
          <BrowserRouter basename={basePath}>
          <AppLayout>
            <Routes>
            {/* Public Routes */}
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
                  <EmailVerificationRequired />
                </ProtectedRoute>
              }
            />
            
            {/* Protected Routes - Require Authentication */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/classes"
              element={
                <ProtectedRoute>
                  <Classes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings"
              element={
                <ProtectedRoute>
                  <Bookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/managememberships"
              element={
                <ProtectedRoute>
                  <ManageMemberships />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/qr/entry-exit"
              element={
                <ProtectedRoute>
                  <EntryExit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rewards"
              element={
                <ProtectedRoute>
                  <Rewards />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            
            {/* Admin Routes - Require Admin Privileges */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <AdminUsers />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <AdminRoute>
                  <AdminAnalytics />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/manageclasses"
              element={
                <AdminRoute>
                  <AdminManageClasses />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/memberships"
              element={
                <AdminRoute>
                  <AdminManageMemberships />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/usermemberships"
              element={
                <AdminRoute>
                  <AdminUserMemberships />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/reward-claim"
              element={
                <AdminRoute>
                  <AdminRewardClaim />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/managedeals"
              element={
                <AdminRoute>
                  <AdminManageDeals />
                </AdminRoute>
              }
            />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);
};

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AdminRoute } from "./components/auth/AdminRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Classes from "./pages/Classes";
import Bookings from "./pages/Bookings";
import QREntry from "./pages/QREntry";
import QRExitPage from "./pages/QRExitPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminManageClasses from "./pages/AdminManageClasses";
import AdminManageMemberships from "./pages/AdminManageMemberships";
import AdminUserMemberships from "./pages/AdminUserMemberships";
import ManageMemberships from "./pages/ManageMemberships";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
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
              path="/qr/entry"
              element={
                <ProtectedRoute>
                  <QREntry />
                </ProtectedRoute>
              }
            />
            <Route
              path="/qr/exit"
              element={
                <ProtectedRoute>
                  <QRExitPage />
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
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getFullRedirectUrl } from "@/lib/utils/pathUtils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const EmailVerificationRequired = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isResending, setIsResending] = useState(false);
  const [showInvalidLinkDialog, setShowInvalidLinkDialog] = useState(false);
  
  // Get email from user or from sessionStorage (for pending signups)
  const getEmail = () => {
    if (user?.email) return user.email;
    
    // Check sessionStorage for pending signup
    const pendingSignup = sessionStorage.getItem('pendingSignup');
    if (pendingSignup) {
      try {
        const signupData = JSON.parse(pendingSignup);
        return signupData.email;
      } catch (error) {
        console.error('Error parsing pending signup data:', error);
      }
    }
    
    return null;
  };

  const email = getEmail();

  // Check for invalid link error in URL params
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'invalid_link') {
      setShowInvalidLinkDialog(true);
      // Remove error param from URL
      searchParams.delete('error');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Monitor email verification status and redirect when verified
  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) return;

    // If user is verified, clean up sessionStorage and redirect to dashboard
    if (user?.email_verified) {
      sessionStorage.removeItem('pendingSignup');
      navigate("/dashboard", { replace: true });
    }
  }, [user?.email_verified, loading, navigate]);

  // Listen for storage changes (Supabase stores auth in localStorage)
  // This detects when verification happens in another tab
  useEffect(() => {
    const handleStorageChange = async (e: StorageEvent) => {
      // Check if Supabase auth storage changed
      if (e.key && e.key.startsWith('sb-') && e.newValue) {
        console.log('Storage change detected, checking auth state...');
        // Refresh auth state by getting the current session
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.email_confirmed_at) {
            // User is now verified, redirect to dashboard
            sessionStorage.removeItem('pendingSignup');
            navigate("/dashboard", { replace: true });
          }
        } catch (error) {
          console.error('Error checking session after storage change:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [navigate]);

  // Poll for verification status as a fallback (check every 2 seconds)
  useEffect(() => {
    if (loading || user?.email_verified) return;

    const checkVerification = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email_confirmed_at) {
          // User is now verified, redirect to dashboard
          sessionStorage.removeItem('pendingSignup');
          navigate("/dashboard", { replace: true });
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
      }
    };

    // Check immediately, then every 2 seconds
    checkVerification();
    const interval = setInterval(checkVerification, 2000);

    return () => clearInterval(interval);
  }, [loading, user?.email_verified, navigate]);

  const handleResendVerification = async () => {
    const emailToUse = email;
    if (!emailToUse) return;

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: emailToUse,
        options: {
          emailRedirectTo: getFullRedirectUrl('/auth/callback'),
        },
      });

      if (error) throw error;

      toast({
        title: "Verification email sent",
        description: "Please check your email for the verification link.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to send verification email",
        description: error.message,
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <>
      <AlertDialog open={showInvalidLinkDialog} onOpenChange={setShowInvalidLinkDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <AlertDialogTitle>Invalid Verification Link</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              The verification link you clicked is invalid or has expired. This can happen if:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>You've already verified your email</li>
                <li>The link has expired (links are valid for a limited time)</li>
                <li>You clicked an old verification link</li>
              </ul>
              <p className="mt-3 font-medium">Please use the latest verification email we sent, or request a new one below.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowInvalidLinkDialog(false)}>
              Got it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
        <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-accent rounded-full">
              <Mail className="w-8 h-8 text-accent-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Waiting for Verification</CardTitle>
          <CardDescription>
            Please check your email and click the verification link to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              We've sent a verification email to:
            </p>
            <p className="font-medium">{email || 'your email'}</p>
            <p className="text-sm text-muted-foreground">
              Click the verification link in your email to access the dashboard.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              This page will automatically redirect once your email is verified.
            </p>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleResendVerification}
              disabled={isResending}
              className="w-full"
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Resend Verification Email
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                // Clean up sessionStorage before signing out
                sessionStorage.removeItem('pendingSignup');
                await supabase.auth.signOut();
                navigate("/login");
              }}
              className="w-full"
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
};

export default EmailVerificationRequired;


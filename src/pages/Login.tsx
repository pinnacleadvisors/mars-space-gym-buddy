import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Dumbbell, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toastMessages, showInfoToast } from "@/lib/utils/toastHelpers";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { sanitizeEmail } from "@/lib/utils/sanitize";
import { 
  recordFailedAttempt, 
  clearLockout, 
  isAccountLocked, 
  formatLockoutTime,
  getRemainingAttempts 
} from "@/lib/utils/accountLockout";
import { getFullRedirectUrl } from "@/lib/utils/pathUtils";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [lockoutInfo, setLockoutInfo] = useState<{
    isLocked: boolean;
    lockedUntil: number | null;
    remainingTime: number | null;
  } | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur", // Validate on blur for better UX
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Check lockout status when email changes
  const email = form.watch("email");
  useEffect(() => {
    if (email) {
      const sanitizedEmail = sanitizeEmail(email);
      const lockout = isAccountLocked(sanitizedEmail);
      const attempts = getRemainingAttempts(sanitizedEmail);
      setLockoutInfo(lockout);
      setRemainingAttempts(attempts);
    } else {
      setLockoutInfo(null);
      setRemainingAttempts(null);
    }
  }, [email]);

  const handleSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      // Sanitize email
      const sanitizedEmail = sanitizeEmail(data.email);

      // Check if account is locked
      const lockout = isAccountLocked(sanitizedEmail);
      if (lockout.isLocked && lockout.remainingTime) {
        const timeRemaining = formatLockoutTime(lockout.remainingTime);
        toast({
          variant: "destructive",
          title: "Account Locked",
          description: `Too many failed login attempts. Please try again in ${timeRemaining}.`,
        });
        setLockoutInfo(lockout);
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password: data.password,
      });

      if (error) {
        // Record failed attempt
        const lockoutResult = recordFailedAttempt(sanitizedEmail);
        const attempts = getRemainingAttempts(sanitizedEmail);
        setRemainingAttempts(attempts);
        setLockoutInfo({
          isLocked: lockoutResult.isLocked,
          lockedUntil: lockoutResult.lockedUntil,
          remainingTime: lockoutResult.lockedUntil 
            ? lockoutResult.lockedUntil - Date.now() 
            : null,
        });

        // Check if account is now locked
        if (lockoutResult.isLocked && lockoutResult.lockedUntil) {
          const timeRemaining = formatLockoutTime(lockoutResult.lockedUntil - Date.now());
          toast(toastMessages.accountLocked(timeRemaining));
          throw error;
        }

        // Show remaining attempts if not locked
        if (attempts > 0) {
          toast({
            variant: "destructive",
            title: "Login failed",
            description: `${error.message}. ${attempts} attempt${attempts !== 1 ? 's' : ''} remaining before account lockout.`,
          });
        } else {
          toast({
            variant: "destructive",
            title: "Login failed",
            description: error.message,
          });
        }
        throw error;
      }

      // Clear lockout on successful login
      clearLockout(sanitizedEmail);
      setLockoutInfo(null);
      setRemainingAttempts(null);

      // Check if email is verified
      const { data: { user } } = await supabase.auth.getUser();
      if (user && !user.email_confirmed_at) {
        toast(toastMessages.emailVerificationRequired());
      }

      toast(toastMessages.loginSuccess());
      
      // Small delay to allow auth state to propagate before navigation
      // This prevents race conditions with useAuth hook's onAuthStateChange listener
      setTimeout(() => {
        navigate("/dashboard");
      }, 100);
    } catch (error: any) {
      // Error already handled above
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'apple') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: getFullRedirectUrl('/dashboard'),
      },
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: error.message,
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-secondary rounded-full">
              <Dumbbell className="w-8 h-8 text-secondary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>Sign in to access your gym account</CardDescription>
        </CardHeader>
        <CardContent>
          {lockoutInfo?.isLocked && lockoutInfo.remainingTime && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Account locked due to too many failed login attempts. 
                Please try again in {formatLockoutTime(lockoutInfo.remainingTime)}.
              </AlertDescription>
            </Alert>
          )}
          {remainingAttempts !== null && remainingAttempts > 0 && remainingAttempts < 5 && !lockoutInfo?.isLocked && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining before account lockout.
              </AlertDescription>
            </Alert>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                      <button
                        type="button"
                        onClick={() => navigate("/forgot-password")}
                        className="text-xs text-secondary hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full bg-secondary hover:bg-secondary/90" 
                disabled={isLoading || (lockoutInfo?.isLocked ?? false) || Object.keys(form.formState.errors).length > 0}
              >
                {isLoading ? "Signing in..." : lockoutInfo?.isLocked ? "Account Locked" : "Sign In"}
              </Button>
            </form>
          </Form>

          <div className="relative my-6">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
              or continue with
            </span>
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => handleOAuthLogin('google')}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => handleOAuthLogin('apple')}
            >
              <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              Sign in with Apple
            </Button>
          </div>
          
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <button
              onClick={() => navigate("/register")}
              className="text-secondary hover:underline font-medium"
            >
              Sign up
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;

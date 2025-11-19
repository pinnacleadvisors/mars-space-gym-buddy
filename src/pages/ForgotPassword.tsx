import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Dumbbell, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { getFullRedirectUrl } from "@/lib/utils/pathUtils";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getFullRedirectUrl('/reset-password'),
      });

      if (error) throw error;

      setEmailSent(true);
      toast({
        title: "Reset code sent",
        description: "Check your email for the password reset code.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to send reset code",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
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
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          <CardDescription>
            {emailSent 
              ? "Check your email for the reset code" 
              : "Enter your email to receive a reset code"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!emailSent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="your@email.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Reset Code"}
              </Button>
              <Button 
                type="button"
                variant="ghost" 
                className="w-full" 
                onClick={() => navigate("/login")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </form>
          ) : (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                A password reset code has been sent to <strong>{email}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                Click the link in the email or enter the code on the reset password page.
              </p>
              <Button 
                onClick={() => navigate("/reset-password")}
                className="w-full bg-secondary hover:bg-secondary/90"
              >
                Go to Reset Password
              </Button>
              <Button 
                variant="ghost" 
                className="w-full" 
                onClick={() => navigate("/login")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;

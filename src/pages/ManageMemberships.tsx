import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UserMembership {
  id: string;
  membership_id: string;
  start_date: string;
  end_date: string;
  status: string;
  payment_status: string;
}

interface Membership {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  access_level: string;
}

export default function ManageMemberships() {
  const [loading, setLoading] = useState(true);
  const [userMembership, setUserMembership] = useState<UserMembership | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    checkSubscriptionStatus();
  }, []);

  // Check subscription status on page load and after payment
  const checkSubscriptionStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error("Error checking subscription:", error);
      } else if (data?.has_subscription) {
        // Refresh data to show updated membership
        await fetchData();
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  // Check for successful payment on return from Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      toast({
        title: "Payment Successful!",
        description: "Your membership has been activated.",
      });
      
      // Check and update subscription status
      checkSubscriptionStatus();
      
      // Clean URL
      window.history.replaceState({}, "", "/managememberships");
    } else if (params.get("canceled") === "true") {
      toast({
        variant: "destructive",
        title: "Payment Cancelled",
        description: "Your payment was cancelled. No charges were made.",
      });
      
      // Clean URL
      window.history.replaceState({}, "", "/managememberships");
    }
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // Fetch the £150 monthly membership
      const { data: membershipData, error: membershipError } = await supabase
        .from("memberships")
        .select("*")
        .eq("price", 150)
        .single();

      if (membershipError) throw membershipError;
      setMembership(membershipData);

      // Fetch user's current membership for THIS specific membership
      // First get the membership, then check if user has it
      if (membershipData) {
        const { data: userMembershipData, error: userMembershipError } = await supabase
          .from("user_memberships")
          .select("*")
          .eq("user_id", user.id)
          .eq("membership_id", membershipData.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (userMembershipError) throw userMembershipError;
        setUserMembership(userMembershipData);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading membership data",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setActionLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Create Stripe checkout session
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Redirect to Stripe checkout in the same window
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Payment Setup Failed",
        description: error.message,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!userMembership) return;
    setActionLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Cancel subscription via Stripe
      let responseData: any = null;
      let responseError: any = null;
      let rawResponseText: string | null = null;
      
      try {
        const response = await supabase.functions.invoke("cancel-subscription", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        
        responseData = response.data;
        responseError = response.error;
      } catch (err: any) {
        console.error("Cancel subscription exception:", err);
        responseError = err;
        
        // Try to read the raw response if available
        if (err.context instanceof Response) {
          try {
            const clonedResponse = err.context.clone();
            rawResponseText = await clonedResponse.text();
            console.log("Raw error response text:", rawResponseText);
          } catch (readError) {
            console.error("Could not read error response:", readError);
          }
        }
      }

      // Log full response for debugging
      console.log("Cancel subscription response:", {
        data: responseData,
        error: responseError,
        hasData: !!responseData,
        hasError: !!responseError
      });

      if (responseError) {
        console.error("Cancel subscription error:", responseError);
        console.error("Error details:", {
          message: responseError.message,
          context: responseError.context,
          status: responseError.status,
          statusText: responseError.statusText,
          fullError: JSON.stringify(responseError, Object.getOwnPropertyNames(responseError))
        });
        
        // Try to extract error message from various possible locations
        let errorMessage = "Failed to cancel membership";
        
        // Use raw response text if we already read it
        if (rawResponseText) {
          try {
            const errorBody = JSON.parse(rawResponseText);
            errorMessage = errorBody.error || 
                         errorBody.errorDetails?.error || 
                         errorBody.message || 
                         errorMessage;
            console.log("Parsed error body from raw text:", errorBody);
          } catch {
            errorMessage = rawResponseText || errorMessage;
          }
        }
        // Check if error.context is a Response object and read its body
        else if (responseError.context instanceof Response) {
          try {
            // Clone the response so we can read it multiple times
            const clonedResponse = responseError.context.clone();
            const responseText = await clonedResponse.text();
            console.log("Response body text:", responseText);
            
            if (responseText) {
              try {
                const errorBody = JSON.parse(responseText);
                errorMessage = errorBody.error || 
                             errorBody.errorDetails?.error || 
                             errorBody.message || 
                             errorMessage;
                console.log("Parsed error body:", errorBody);
              } catch {
                // If parsing fails, use the text directly
                errorMessage = responseText || errorMessage;
              }
            }
          } catch (bodyError) {
            console.error("Error reading response body:", bodyError);
          }
        }
        
        // Check if error has a context with body (Edge Function error response)
        if (responseError.context?.body && typeof responseError.context.body !== 'object') {
          try {
            const errorBody = typeof responseError.context.body === 'string' 
              ? JSON.parse(responseError.context.body) 
              : responseError.context.body;
            errorMessage = errorBody.error || errorBody.errorDetails?.error || errorBody.message || errorMessage;
          } catch {
            // If parsing fails, use the string directly
            errorMessage = responseError.context.body || errorMessage;
          }
        }
        
        // Check error.context.msg
        if (responseError.context?.msg && !errorMessage.includes("Failed to cancel")) {
          errorMessage = responseError.context.msg;
        }
        
        // Check error.message (but ignore generic messages)
        if (responseError.message && 
            responseError.message !== "Edge Function returned a non-2xx status code" &&
            responseError.message !== "Unknown error") {
          errorMessage = responseError.message;
        }
        
        // Check data.error (sometimes error is in data even when error object exists)
        if (responseData?.error) {
          errorMessage = responseData.error || responseData.errorDetails?.error || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      // Check if response contains an error (even if no error object)
      if (responseData?.error) {
        console.error("Cancel subscription response error:", responseData);
        throw new Error(responseData.error || responseData.message || "Failed to cancel membership");
      }

      toast({
        title: "Membership Cancelled",
        description: responseData?.message || "Your membership has been cancelled successfully.",
      });

      await fetchData();
    } catch (error: any) {
      console.error("Error cancelling membership:", error);
      const errorMessage = error?.message || 
                          error?.error || 
                          "An unexpected error occurred. Please try again or contact support.";
      
      toast({
        variant: "destructive",
        title: "Cancellation failed",
        description: errorMessage,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRenew = async () => {
    setActionLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Create new Stripe checkout session for renewal
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Redirect to Stripe checkout in the same window
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Renewal failed",
        description: error.message,
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Check if user has an active membership (for badge display)
  const isActive = userMembership?.status === "active" && new Date(userMembership.end_date) > new Date();
  
  // Check if user has an active membership for THIS specific membership (for button logic)
  const hasActiveMembership = userMembership?.status === "active" && 
                              new Date(userMembership.end_date) > new Date() &&
                              userMembership.membership_id === membership?.id;
  const isExpired = userMembership && new Date(userMembership.end_date) <= new Date();
  const isCancelled = userMembership?.status === "cancelled";

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Manage Membership</h1>

      {/* Current Membership Status */}
      {userMembership && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Current Membership</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant={isActive ? "default" : "secondary"}>
                {isActive ? "Active" : isExpired ? "Expired" : isCancelled ? "Cancelled" : userMembership.status}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Start Date:</span>
              <span>{new Date(userMembership.start_date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">End Date:</span>
              <span>{new Date(userMembership.end_date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Payment Status:</span>
              <Badge variant={userMembership.payment_status === "paid" ? "default" : "destructive"}>
                {userMembership.payment_status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Membership Plan */}
      {membership && (
        <Card>
          <CardHeader>
            <CardTitle>{membership.name}</CardTitle>
            <CardDescription>
              £{membership.price} per month • {membership.access_level}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Duration: {membership.duration_days} days
            </p>

            <div className="flex gap-3 flex-wrap">
              {/* Only show "Start Membership" if user doesn't have this specific membership active */}
              {!hasActiveMembership && (
                <Button onClick={handleRegister} disabled={actionLoading}>
                  {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Start Membership
                </Button>
              )}

              {/* Show renew and cancel options if user has active membership for this specific membership */}
              {hasActiveMembership && (
                <>
                  <Button onClick={handleRenew} disabled={actionLoading}>
                    {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Start Membership
                  </Button>
                  <Button onClick={handleCancel} variant="destructive" disabled={actionLoading}>
                    {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Cancel Membership
                  </Button>
                </>
              )}

              {/* Show reactivate option if user has this membership but it's expired or cancelled */}
              {userMembership && 
               userMembership.membership_id === membership?.id && 
               (isExpired || isCancelled) && 
               !hasActiveMembership && (
                <Button onClick={handleRenew} disabled={actionLoading}>
                  {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Reactivate Membership
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

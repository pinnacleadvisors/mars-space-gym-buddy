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
  payment_method: string | null;
  stripe_subscription_id: string | null;
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
  const [availableMemberships, setAvailableMemberships] = useState<Membership[]>([]);
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isCancellationRequested, setIsCancellationRequested] = useState(false);
  const [remainingDays, setRemainingDays] = useState<number | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    checkSubscriptionStatus();
  }, []);

  useEffect(() => {
    if (userMembership) {
      checkCancellationStatus();
    }
  }, [userMembership]);

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

  // Check if membership is cancelled but still has remaining days
  const checkCancellationStatus = async () => {
    if (!userMembership) {
      setIsCancellationRequested(false);
      setRemainingDays(null);
      return;
    }

    try {
      const endDate = new Date(userMembership.end_date);
      const today = new Date();
      const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Calculate remaining days if end_date is in the future
      if (endDate > today && daysRemaining > 0) {
        setRemainingDays(daysRemaining);
        
        // Check localStorage to see if cancellation was requested
        const cancellationKey = `membership_cancelled_${userMembership.id}`;
        const cancellationData = localStorage.getItem(cancellationKey);
        
        if (cancellationData) {
          try {
            const { cancelledAt, endDate: storedEndDate } = JSON.parse(cancellationData);
            console.log("Found cancellation data:", { storedEndDate, currentEndDate: userMembership.end_date, daysRemaining });
            // Verify the end date matches (membership hasn't changed)
            if (storedEndDate === userMembership.end_date) {
              setIsCancellationRequested(true);
              console.log("Setting cancellation requested to true");
            } else {
              // End date changed, clear old cancellation data
              console.log("End date mismatch, clearing cancellation data");
              localStorage.removeItem(cancellationKey);
              setIsCancellationRequested(false);
            }
          } catch (parseError) {
            console.error("Error parsing cancellation data:", parseError);
            localStorage.removeItem(cancellationKey);
            setIsCancellationRequested(false);
          }
        } else {
          console.log("No cancellation data found in localStorage");
          setIsCancellationRequested(false);
        }
      } else {
        setRemainingDays(null);
        setIsCancellationRequested(false);
        // Clear cancellation data if membership has expired
        const cancellationKey = `membership_cancelled_${userMembership.id}`;
        localStorage.removeItem(cancellationKey);
        return;
      }
    } catch (error) {
      console.error("Error checking cancellation status:", error);
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

      // First, fetch user's current membership (any membership)
      const { data: userMembershipData, error: userMembershipError } = await supabase
        .from("user_memberships")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (userMembershipError) throw userMembershipError;
      setUserMembership(userMembershipData);

      // Always fetch all available memberships for the change plan feature
      const { data: allMemberships, error: membershipsError } = await supabase
        .from("memberships")
        .select("*")
        .order("created_at", { ascending: false });

      if (membershipsError) throw membershipsError;
      setAvailableMemberships(allMemberships || []);

      // If user has a membership, fetch the membership details
      if (userMembershipData) {
        const { data: membershipData, error: membershipError } = await supabase
          .from("memberships")
          .select("*")
          .eq("id", userMembershipData.membership_id)
          .single();

        if (membershipError) throw membershipError;
        setMembership(membershipData);
      } else {
        // Set the first membership as the default one to display (most recently created)
        if (allMemberships && allMemberships.length > 0) {
          setMembership(allMemberships[0]);
        }
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

  const handleRegister = async (selectedMembershipId?: string) => {
    setActionLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Determine which membership to use
      const membershipToUse = selectedMembershipId 
        ? availableMemberships.find(m => m.id === selectedMembershipId) || membership
        : membership;

      if (!membershipToUse) {
        throw new Error("No membership selected");
      }

      // Create Stripe checkout session with membership_id
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: membershipToUse ? { membership_id: membershipToUse.id } : undefined,
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
        description: responseData?.message || "Your membership has been cancelled successfully. Benefits will continue until the end date.",
      });

      // Store cancellation status in localStorage FIRST, before fetchData updates state
      if (userMembership) {
        const cancellationKey = `membership_cancelled_${userMembership.id}`;
        const cancellationData = {
          cancelledAt: new Date().toISOString(),
          endDate: userMembership.end_date
        };
        localStorage.setItem(cancellationKey, JSON.stringify(cancellationData));
        console.log("✅ Cancellation saved to localStorage:", { key: cancellationKey, data: cancellationData });
      }

      // Refresh data to get updated membership
      await fetchData();
      
      // Explicitly call checkCancellationStatus after fetchData to ensure state is updated
      // The useEffect will also call it, but this ensures it happens immediately
      setTimeout(() => {
        checkCancellationStatus();
      }, 100);
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
      // Pass the current membership_id if available
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: membership ? { membership_id: membership.id } : undefined,
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Membership</h1>
        {/* Change Plan Toggle - Only show when user has a membership */}
        {userMembership && (
          <Button
            variant={showChangePlan ? "default" : "outline"}
            onClick={() => setShowChangePlan(!showChangePlan)}
          >
            {showChangePlan ? "Hide Plans" : "Change Plan"}
          </Button>
        )}
      </div>

      {/* Current Membership Status */}
      {userMembership && !showChangePlan && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Current Membership</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {membership && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Plan Name:</span>
                <span className="font-medium">{membership.name}</span>
              </div>
            )}
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
            {/* Cancellation message */}
            {isCancellationRequested && remainingDays !== null && remainingDays > 0 && (
              <div className="pt-3 border-t">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Membership plan has been cancelled</strong> but you have <strong>{remainingDays} {remainingDays === 1 ? 'day' : 'days'}</strong> remaining. Your benefits will continue until {new Date(userMembership.end_date).toLocaleDateString()}.
                  </p>
                </div>
              </div>
            )}
            {/* Cancel button for all active memberships */}
            {isActive && !isCancellationRequested && (
              <div className="pt-3 border-t">
                <Button 
                  onClick={handleCancel} 
                  variant="destructive" 
                  disabled={actionLoading}
                  className="w-full"
                >
                  {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Cancel Membership
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Available Membership Plans - Show when user has no membership OR when change plan is toggled */}
      {(!userMembership || showChangePlan) && availableMemberships.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            {showChangePlan ? "Change Your Plan" : "Available Membership Plans"}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableMemberships.map((plan) => {
              const isCurrentPlan = userMembership?.membership_id === plan.id;
              return (
                <Card 
                  key={plan.id} 
                  className={`flex flex-col ${isCurrentPlan ? "ring-2 ring-primary" : ""}`}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{plan.name}</CardTitle>
                        <CardDescription>
                          {plan.price ? `£${plan.price}` : "Free"} {plan.price ? "per month" : ""} • {plan.access_level || "Standard"}
                        </CardDescription>
                      </div>
                      {isCurrentPlan && (
                        <Badge variant="default">Current</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <p className="text-muted-foreground text-sm">
                        Duration: {plan.duration_days} days
                      </p>
                    </div>
                    <Button 
                      onClick={() => handleRegister(plan.id)} 
                      disabled={actionLoading || isCurrentPlan}
                      className="w-full"
                      variant={isCurrentPlan ? "secondary" : "default"}
                    >
                      {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isCurrentPlan ? "Current Plan" : showChangePlan ? "Switch to This Plan" : "Start Membership"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Current Membership Plan - Show only for Stripe memberships when user has a membership and change plan is not toggled */}
      {userMembership && membership && !showChangePlan && 
       (userMembership.payment_method === "stripe" || userMembership.stripe_subscription_id) && (
        <Card>
          <CardHeader>
            <CardTitle>{membership.name}</CardTitle>
            <CardDescription>
              {membership.price ? `£${membership.price}` : "Free"} {membership.price ? "per month" : ""} • {membership.access_level || "Standard"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Duration: {membership.duration_days} days
            </p>

            <div className="flex gap-3 flex-wrap">
              {/* Show renew and cancel options if user has active membership for this specific membership */}
              {hasActiveMembership && (
                <>
                  <Button onClick={handleRenew} disabled={actionLoading}>
                    {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Start Membership
                  </Button>
                  {/* Only show cancel button for Stripe memberships */}
                  {(userMembership?.payment_method === "stripe" || userMembership?.stripe_subscription_id) && (
                    <Button onClick={handleCancel} variant="destructive" disabled={actionLoading}>
                      {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Cancel Membership
                    </Button>
                  )}
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

      {/* No memberships available */}
      {!userMembership && availableMemberships.length === 0 && !loading && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              No membership plans are currently available. Please contact support.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
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
  cancelled_at: string | null;
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
  const [couponCode, setCouponCode] = useState("");
  const [couponValidating, setCouponValidating] = useState(false);
  const [couponValid, setCouponValid] = useState<boolean | null>(null);
  const [couponDetails, setCouponDetails] = useState<{type: string; value: number; description: string | null} | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const fetchingRef = useRef(false);

  useEffect(() => {
    fetchData();
    checkSubscriptionStatus();
  }, []);

  // Set up real-time subscription for membership updates
  useEffect(() => {
    let mounted = true;
    const channels: ReturnType<typeof supabase.channel>[] = [];
    let fetchTimeout: ReturnType<typeof setTimeout> | null = null;

    const setupSubscription = async () => {
      try {
        // First, ensure we have a valid session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Error getting session for subscription:", sessionError);
          return;
        }
        
        if (!session) {
          console.log("No session available, cannot set up subscription");
          return;
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        // Check for errors or missing user
        if (userError) {
          console.error("Error getting user for subscription:", userError);
          return;
        }
        
        // Validate user and user.id before setting up subscription
        if (!user || !user.id || user.id.trim() === '' || !mounted) {
          console.log("Cannot set up subscription: user or user.id is missing or empty");
          return;
        }

        // Validate UUID format (basic check)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const trimmedUserId = user.id.trim();
        if (!uuidRegex.test(trimmedUserId)) {
          console.error("Invalid user ID format for subscription:", trimmedUserId);
          return;
        }

        // Set up real-time subscription to listen for changes to user_memberships
        const channel = supabase
          .channel(`user-memberships-changes-${trimmedUserId}`)
          .on(
            'postgres_changes',
            {
              event: '*', // Listen for INSERT, UPDATE, DELETE
              schema: 'public',
              table: 'user_memberships',
              filter: `user_id=eq.${trimmedUserId}`, // Use trimmed and validated UUID
            },
            (payload) => {
              console.log('Membership change detected:', payload);
              // Debounce fetchData to avoid race conditions with database commits
              // Add a small delay to ensure the database transaction is committed
              if (fetchTimeout) {
                clearTimeout(fetchTimeout);
              }
              fetchTimeout = setTimeout(() => {
                if (mounted) {
                  fetchData();
                }
              }, 500); // 500ms delay to ensure database commit is complete
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log("Real-time subscription active for user:", trimmedUserId);
            } else if (status === 'CHANNEL_ERROR') {
              console.error("Real-time subscription error for user:", trimmedUserId);
            }
          });
        
        channels.push(channel);
        console.log("Real-time subscription set up successfully for user:", trimmedUserId);
      } catch (error) {
        console.error("Error setting up subscription:", error);
      }
    };

    // Wait for session to be established before setting up subscription
    const checkAndSetup = async () => {
      // Wait a bit for auth to initialize
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Check if session exists, if not wait a bit more
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts && mounted) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await setupSubscription();
          return;
        }
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      if (mounted && attempts >= maxAttempts) {
        console.warn("Could not establish session for real-time subscription after multiple attempts");
      }
    };

    checkAndSetup();

    return () => {
      mounted = false;
      if (fetchTimeout) {
        clearTimeout(fetchTimeout);
      }
      // Clean up all channels
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
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
        
        // Check if membership was reactivated (cancelled_at is null in database)
        // If cancelled_at is null, the membership was reactivated by admin, so clear localStorage
        if (!userMembership.cancelled_at) {
          // Membership was reactivated - clear localStorage cancellation data
          const cancellationKey = `membership_cancelled_${userMembership.id}`;
          localStorage.removeItem(cancellationKey);
          setIsCancellationRequested(false);
          console.log("Membership reactivated - cleared cancellation data");
          return;
        }
        
        // If cancelled_at exists in database, show cancellation message
        // This is the source of truth - database state overrides localStorage
        if (userMembership.cancelled_at) {
          setIsCancellationRequested(true);
          console.log("Cancellation exists in database - showing cancellation message");
          
          // Also update localStorage for consistency (in case user cancels via Stripe and we want to track it)
          const cancellationKey = `membership_cancelled_${userMembership.id}`;
          const cancellationData = {
            cancelledAt: userMembership.cancelled_at,
            endDate: userMembership.end_date
          };
          localStorage.setItem(cancellationKey, JSON.stringify(cancellationData));
          return;
        }
        
        // Fallback: Check localStorage for legacy cancellation data (for Stripe memberships)
        // This handles cases where cancellation was done before cancelled_at was added
        const cancellationKey = `membership_cancelled_${userMembership.id}`;
        const cancellationData = localStorage.getItem(cancellationKey);
        
        if (cancellationData) {
          try {
            const { cancelledAt, endDate: storedEndDate } = JSON.parse(cancellationData);
            console.log("Found cancellation data in localStorage:", { storedEndDate, currentEndDate: userMembership.end_date, daysRemaining });
            // Verify the end date matches (membership hasn't changed)
            if (storedEndDate === userMembership.end_date) {
              setIsCancellationRequested(true);
              console.log("Setting cancellation requested to true from localStorage");
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
          console.log("No cancellation data found");
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
    // Prevent concurrent fetches
    if (fetchingRef.current) {
      console.log("Fetch already in progress, skipping...");
      return;
    }

    fetchingRef.current = true;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // First, fetch user's current membership (any membership)
      // Explicitly select cancelled_at to ensure it's included
      const { data: userMembershipData, error: userMembershipError } = await supabase
        .from("user_memberships")
        .select("*, cancelled_at")
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
      fetchingRef.current = false;
    }
  };

  const validateCoupon = async (code: string) => {
    if (!code || code.trim() === "") {
      setCouponValid(null);
      setCouponDetails(null);
      return;
    }

    setCouponValidating(true);
    try {
      const { data, error } = await supabase.rpc("is_coupon_valid", {
        _code: code.toUpperCase().trim(),
      });

      if (error) throw error;

      if (data) {
        // Fetch coupon details
        const { data: couponData, error: couponError } = await supabase
          .from("coupon_codes")
          .select("type, value, description")
          .eq("code", code.toUpperCase().trim())
          .single();

        if (couponError) throw couponError;

        setCouponValid(true);
        setCouponDetails(couponData);
      } else {
        setCouponValid(false);
        setCouponDetails(null);
      }
    } catch (error: any) {
      setCouponValid(false);
      setCouponDetails(null);
      console.error("Error validating coupon:", error);
    } finally {
      setCouponValidating(false);
    }
  };

  useEffect(() => {
    if (couponCode.trim() === "") {
      setCouponValid(null);
      setCouponDetails(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      validateCoupon(couponCode);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [couponCode]);

  const handleRegister = async (selectedMembershipId?: string) => {
    setActionLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Validate coupon if provided
      if (couponCode && couponCode.trim() !== "") {
        const { data: isValid } = await supabase.rpc("is_coupon_valid", {
          _code: couponCode.toUpperCase().trim(),
        });

        if (!isValid) {
          throw new Error("Invalid coupon code. Please check and try again.");
        }
      }

      // Determine which membership to use
      const membershipToUse = selectedMembershipId 
        ? availableMemberships.find(m => m.id === selectedMembershipId) || membership
        : membership;

      if (!membershipToUse) {
        throw new Error("No membership selected");
      }

      // Create Stripe checkout session with membership_id and coupon_code
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          membership_id: membershipToUse.id,
          coupon_code: couponCode && couponCode.trim() !== "" ? couponCode.toUpperCase().trim() : null,
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
        description: responseData?.message || "Your membership has been cancelled successfully. Benefits will continue until the end date.",
      });

      // Only set optimistic state for non-Stripe memberships (Stripe won't have cancelled_at)
      const isStripeMembership = userMembership?.payment_method === "stripe" || 
                                  userMembership?.stripe_subscription_id !== null;
      
      if (userMembership && !isStripeMembership) {
        // Store cancellation status in localStorage FIRST, before fetchData updates state
        const cancellationKey = `membership_cancelled_${userMembership.id}`;
        const cancellationData = {
          cancelledAt: new Date().toISOString(),
          endDate: userMembership.end_date
        };
        localStorage.setItem(cancellationKey, JSON.stringify(cancellationData));
        console.log("✅ Cancellation saved to localStorage:", { key: cancellationKey, data: cancellationData });
        
        // Optimistically update the cancellation state immediately for non-Stripe memberships
        // This ensures the UI reflects the cancellation right away, even before database fetch
        const endDate = new Date(userMembership.end_date);
        const today = new Date();
        const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (endDate > today && daysRemaining > 0) {
          setIsCancellationRequested(true);
          setRemainingDays(daysRemaining);
        }
      }

      // Capture membership ID before async operations to avoid stale state
      const membershipId = userMembership?.id;
      
      // Wait for the database transaction to commit before fetching
      // Use a longer delay to ensure the database update is fully committed
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Refresh data to get updated membership with cancelled_at from database
      await fetchData();
      
      // Wait a bit more for state to update, then verify cancellation status
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Explicitly verify and update cancellation status after fetchData
      // This ensures the state is correct even if the useEffect didn't trigger properly
      if (membershipId) {
        // Re-fetch the membership to ensure we have the latest data with cancelled_at
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: updatedMembership } = await supabase
            .from("user_memberships")
            .select("*, cancelled_at")
            .eq("user_id", user.id)
            .eq("id", membershipId)
            .single();
          
          if (updatedMembership) {
            setUserMembership(updatedMembership);
            
            // Directly update cancellation state based on the fetched data
            // This ensures the UI updates immediately without waiting for useEffect
            const endDate = new Date(updatedMembership.end_date);
            const today = new Date();
            const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            if (endDate > today && daysRemaining > 0) {
              setRemainingDays(daysRemaining);
              
              // For non-Stripe memberships, check cancelled_at
              const isStripe = updatedMembership.payment_method === "stripe" || 
                              updatedMembership.stripe_subscription_id !== null;
              
              if (!isStripe && updatedMembership.cancelled_at) {
                setIsCancellationRequested(true);
                console.log("✅ Cancellation state updated from database:", {
                  cancelled_at: updatedMembership.cancelled_at,
                  daysRemaining
                });
              } else if (!isStripe) {
                // If cancelled_at is not set, check localStorage as fallback
                const cancellationKey = `membership_cancelled_${membershipId}`;
                const cancellationData = localStorage.getItem(cancellationKey);
                if (cancellationData) {
                  setIsCancellationRequested(true);
                }
              }
            }
          }
        }
      }
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

      // Validate coupon if provided
      if (couponCode && couponCode.trim() !== "") {
        const { data: isValid } = await supabase.rpc("is_coupon_valid", {
          _code: couponCode.toUpperCase().trim(),
        });

        if (!isValid) {
          throw new Error("Invalid coupon code. Please check and try again.");
        }
      }

      // Create new Stripe checkout session for renewal
      // Pass the current membership_id and coupon_code if available
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          membership_id: membership?.id,
          coupon_code: couponCode && couponCode.trim() !== "" ? couponCode.toUpperCase().trim() : null,
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
          
          {/* Coupon Code Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Have a Coupon Code?</CardTitle>
              <CardDescription>
                Enter your discount or referral code below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="coupon-code">Coupon Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="coupon-code"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1"
                    disabled={actionLoading}
                  />
                  {couponValidating && (
                    <Loader2 className="h-4 w-4 animate-spin self-center" />
                  )}
                  {couponValid === true && !couponValidating && (
                    <CheckCircle2 className="h-5 w-5 text-green-500 self-center" />
                  )}
                  {couponValid === false && !couponValidating && (
                    <XCircle className="h-5 w-5 text-red-500 self-center" />
                  )}
                </div>
                {couponValid === true && couponDetails && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    ✓ Valid coupon: {couponDetails.type === "percentage" 
                      ? `${couponDetails.value}% off` 
                      : `£${couponDetails.value.toFixed(2)} off`}
                    {couponDetails.description && ` - ${couponDetails.description}`}
                  </p>
                )}
                {couponValid === false && couponCode.trim() !== "" && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Invalid or expired coupon code
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

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
        <>
          {/* Coupon Code Input for Renewal */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Have a Coupon Code?</CardTitle>
              <CardDescription>
                Enter your discount or referral code below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="coupon-code-renewal">Coupon Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="coupon-code-renewal"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1"
                    disabled={actionLoading}
                  />
                  {couponValidating && (
                    <Loader2 className="h-4 w-4 animate-spin self-center" />
                  )}
                  {couponValid === true && !couponValidating && (
                    <CheckCircle2 className="h-5 w-5 text-green-500 self-center" />
                  )}
                  {couponValid === false && !couponValidating && (
                    <XCircle className="h-5 w-5 text-red-500 self-center" />
                  )}
                </div>
                {couponValid === true && couponDetails && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    ✓ Valid coupon: {couponDetails.type === "percentage" 
                      ? `${couponDetails.value}% off` 
                      : `£${couponDetails.value.toFixed(2)} off`}
                    {couponDetails.description && ` - ${couponDetails.description}`}
                  </p>
                )}
                {couponValid === false && couponCode.trim() !== "" && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Invalid or expired coupon code
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

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
        </>
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

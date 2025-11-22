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
      const { data, error } = await supabase.functions.invoke("cancel-subscription", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Membership Cancelled",
        description: data?.message || "Your membership will be cancelled at the end of the billing period.",
      });

      await fetchData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Cancellation failed",
        description: error.message,
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

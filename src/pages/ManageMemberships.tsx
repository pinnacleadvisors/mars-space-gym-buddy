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

      // Fetch user's current membership
      const { data: userMembershipData, error: userMembershipError } = await supabase
        .from("user_memberships")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (userMembershipError) throw userMembershipError;
      setUserMembership(userMembershipData);
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
    if (!membership) return;
    setActionLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + membership.duration_days);

      const { error } = await supabase.from("user_memberships").insert({
        user_id: user.id,
        membership_id: membership.id,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: "active",
        payment_status: "paid",
      });

      if (error) throw error;

      toast({
        title: "Membership Registered",
        description: "Your membership has been activated successfully.",
      });

      await fetchData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration failed",
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
      const { error } = await supabase
        .from("user_memberships")
        .update({ status: "cancelled" })
        .eq("id", userMembership.id);

      if (error) throw error;

      toast({
        title: "Membership Cancelled",
        description: "Your membership has been cancelled.",
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
    if (!userMembership || !membership) return;
    setActionLoading(true);

    try {
      const currentEndDate = new Date(userMembership.end_date);
      const now = new Date();
      const newEndDate = currentEndDate > now ? new Date(currentEndDate) : new Date(now);
      newEndDate.setDate(newEndDate.getDate() + membership.duration_days);

      const { error } = await supabase
        .from("user_memberships")
        .update({
          end_date: newEndDate.toISOString(),
          status: "active",
        })
        .eq("id", userMembership.id);

      if (error) throw error;

      toast({
        title: "Membership Renewed",
        description: `Your membership has been extended until ${newEndDate.toLocaleDateString()}.`,
      });

      await fetchData();
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

  const isActive = userMembership?.status === "active" && new Date(userMembership.end_date) > new Date();
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
              {!userMembership && (
                <Button onClick={handleRegister} disabled={actionLoading}>
                  {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Register Membership
                </Button>
              )}

              {userMembership && isActive && (
                <>
                  <Button onClick={handleRenew} disabled={actionLoading}>
                    {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Renew Membership
                  </Button>
                  <Button onClick={handleCancel} variant="destructive" disabled={actionLoading}>
                    {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Cancel Membership
                  </Button>
                </>
              )}

              {userMembership && (isExpired || isCancelled) && (
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

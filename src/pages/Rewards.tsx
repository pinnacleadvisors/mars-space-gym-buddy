"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { Progress } from "@/components/ui/progress";
import { QRCodeDisplay } from "@/components/qr/QRCodeDisplay";
import { Trophy, Clock, Dumbbell, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CheckIn {
  id: string;
  check_in_time: string;
  check_out_time: string | null;
}

interface ClassBooking {
  id: string;
  status: string;
}

const HOURS_TARGET = 15;
const CLASSES_TARGET = 15;

const Rewards = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [totalHours, setTotalHours] = useState<number>(0);
  const [totalClasses, setTotalClasses] = useState<number>(0);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [bookings, setBookings] = useState<ClassBooking[]>([]);
  const [lastClaimTime, setLastClaimTime] = useState<string | null>(null);

  const fetchRewardsData = async () => {
    try {
      setLoading(true);

      if (!user) {
        // User not loaded yet or not authenticated - return early without error
        setLoading(false);
        return;
      }

      // Get the most recent reward claim
      const { data: lastClaim, error: claimError } = await supabase
        .from("reward_claims")
        .select("claimed_at")
        .eq("user_id", user.id)
        .order("claimed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (claimError) throw claimError;
      setLastClaimTime(lastClaim?.claimed_at || null);

      // Fetch check-ins AFTER the last claim (or all if no claim)
      const checkInQuery = supabase
        .from("check_ins")
        .select("id, check_in_time, check_out_time")
        .eq("user_id", user.id)
        .order("check_in_time", { ascending: false });

      if (lastClaim?.claimed_at) {
        checkInQuery.gt("check_in_time", lastClaim.claimed_at);
      }

      const { data: checkInData, error: checkInError } = await checkInQuery;

      if (checkInError) throw checkInError;
      setCheckIns(checkInData || []);

      // Calculate total hours from check-ins AFTER last claim
      let hours = 0;
      (checkInData || []).forEach((checkIn) => {
        if (checkIn.check_out_time) {
          const checkInTime = new Date(checkIn.check_in_time).getTime();
          const checkOutTime = new Date(checkIn.check_out_time).getTime();
          const durationMs = checkOutTime - checkInTime;
          const durationHours = durationMs / (1000 * 60 * 60); // Convert to hours
          hours += durationHours;
        }
      });
      setTotalHours(Math.round(hours * 10) / 10); // Round to 1 decimal place

      // Fetch class bookings AFTER the last claim (or all if no claim)
      const bookingQuery = supabase
        .from("class_bookings")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("status", "attended");

      if (lastClaim?.claimed_at) {
        bookingQuery.gt("created_at", lastClaim.claimed_at);
      }

      const { data: bookingData, error: bookingError } = await bookingQuery;

      if (bookingError) throw bookingError;
      setBookings(bookingData || []);
      setTotalClasses(bookingData?.length || 0);
    } catch (error: any) {
      console.error("Rewards load error:", error);
      toast({
        variant: "destructive",
        title: "Error loading rewards",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch data when auth is loaded and user is available
    if (!authLoading && user) {
      fetchRewardsData();
    } else if (!authLoading && !user) {
      // Auth loaded but no user - set loading to false
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const hoursProgress = Math.min((totalHours / HOURS_TARGET) * 100, 100);
  const classesProgress = Math.min((totalClasses / CLASSES_TARGET) * 100, 100);
  const bothGoalsReached = totalHours >= HOURS_TARGET && totalClasses >= CLASSES_TARGET;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading rewards..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <Trophy className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Rewards</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Progress</CardTitle>
            <CardDescription>Track your gym hours and classes to unlock rewards</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Hours in Gym Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="font-medium">Hours in Gym</span>
                </div>
                <span className="text-lg font-semibold">
                  {totalHours.toFixed(1)}/{HOURS_TARGET}
                </span>
              </div>
              <Progress value={hoursProgress} className="h-3" />
              <p className="text-sm text-muted-foreground">
                {totalHours >= HOURS_TARGET
                  ? "✓ Goal reached!"
                  : `${(HOURS_TARGET - totalHours).toFixed(1)} hours remaining`}
              </p>
            </div>

            {/* Classes Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-secondary" />
                  <span className="font-medium">Classes</span>
                </div>
                <span className="text-lg font-semibold">
                  {totalClasses}/{CLASSES_TARGET}
                </span>
              </div>
              <Progress value={classesProgress} className="h-3" />
              <p className="text-sm text-muted-foreground">
                {totalClasses >= CLASSES_TARGET
                  ? "✓ Goal reached!"
                  : `${CLASSES_TARGET - totalClasses} classes remaining`}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Reward QR Code - Only show when both goals are reached */}
        {bothGoalsReached && user && (
          <Card className="mb-6 border-primary">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-primary" />
                <CardTitle>Congratulations! 🎉</CardTitle>
              </div>
              <CardDescription>
                You've reached both goals! Scan this QR code to claim your reward.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RewardQRCode userId={user.id} />
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Track your gym hours by checking in and out properly</p>
            <p>• Attend classes to count towards your class goal</p>
            <p>• Reach {HOURS_TARGET} hours and {CLASSES_TARGET} classes to unlock your reward</p>
            <p>• Your reward QR code refreshes every 5 minutes for security</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

/**
 * Reward QR Code Component with 5-minute auto-refresh
 * QR codes are unique because they include:
 * - userId (unique per user)
 * - timestamp (unique per generation)
 * - sessionId (changes every 5 minutes)
 */
const RewardQRCode = ({ userId }: { userId: string }) => {
  const [sessionId, setSessionId] = useState<string>(
    `reward-${Math.floor(Date.now() / (5 * 60 * 1000))}`
  );

  useEffect(() => {
    // Update sessionId every 5 minutes to trigger QR code regeneration
    const interval = setInterval(() => {
      const newSessionId = `reward-${Math.floor(Date.now() / (5 * 60 * 1000))}`;
      setSessionId(newSessionId);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <QRCodeDisplay
      userId={userId}
      action="reward"
      sessionId={sessionId}
      title="Reward QR Code"
      description="This code refreshes every 5 minutes for security"
      size={250}
      showDownload={true}
      showRefresh={true}
    />
  );
};

export default Rewards;


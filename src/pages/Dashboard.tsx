"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Dumbbell, TrendingUp, Users, QrCode, LogIn, Clock, AlertCircle, CheckCircle2, XCircle, ArrowRight, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { QRCodeDisplay } from "@/components/qr/QRCodeDisplay";
import { format, isToday, isThisWeek, differenceInHours, differenceInMinutes } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { Progress } from "@/components/ui/progress";

interface CheckIn {
  id: string;
  check_in_time: string;
  check_out_time: string | null;
  location: string | null;
}

interface ClassBooking {
  id: string;
  status: string;
  class_sessions?: {
    id: string;
    name: string;
    instructor: string;
    start_time: string;
    end_time: string;
    capacity: number;
  };
}

interface Membership {
  id: string;
  status: string;
  start_date: string;
  end_date: string;
  payment_status: string;
  memberships?: {
    name: string;
    price: number;
  };
}

const Dashboard = () => {
  const [bookings, setBookings] = useState<ClassBooking[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasActiveCheckIn, setHasActiveCheckIn] = useState<boolean>(false);
  const [totalHours, setTotalHours] = useState<number>(0);
  const [totalClasses, setTotalClasses] = useState<number>(0);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const HOURS_TARGET = 15;
  const CLASSES_TARGET = 15;

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 1️⃣ Get the logged-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("User not found. Please log in again.");

      // 2️⃣ Fetch recent check-ins
      const { data: checkInData, error: checkInError } = await supabase
        .from("check_ins")
        .select("*")
        .eq("user_id", user.id)
        .order("check_in_time", { ascending: false })
        .limit(20);

      if (checkInError) throw checkInError;
      setCheckIns(checkInData || []);

      // Check for active check-in
      const activeCheckIn = checkInData?.find(ci => !ci.check_out_time);
      setHasActiveCheckIn(!!activeCheckIn);

      // 3️⃣ Fetch class bookings with related class_sessions
      const { data: bookingData, error: bookingError } = await supabase
        .from("class_bookings")
        .select("*, class_sessions(id, name, instructor, start_time, end_time, capacity)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (bookingError) throw bookingError;
      setBookings(bookingData || []);

      // 4️⃣ Fetch membership status
      const { data: membershipData, error: membershipError } = await supabase
        .from("user_memberships")
        .select("*, memberships(name, price)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (membershipError) throw membershipError;
      setMembership(membershipData || null);
    } catch (error: any) {
      console.error("Dashboard load error:", error);
      toast({
        variant: "destructive",
        title: "Error loading dashboard",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculate statistics
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const visitsThisMonth = checkIns.filter(
    (ci) => new Date(ci.check_in_time) >= startOfMonth && new Date(ci.check_in_time) <= endOfMonth
  ).length;

  const classesAttendedThisMonth = bookings.filter(
    (b) =>
      b.status === "attended" &&
      b.class_sessions &&
      new Date(b.class_sessions.start_time) >= startOfMonth &&
      new Date(b.class_sessions.start_time) <= endOfMonth
  ).length;

  const totalVisits = checkIns.length;
  const activeBookings = bookings.filter((b) => b.status === "booked").length;
  const classesAttended = bookings.filter((b) => b.status === "attended").length;

  // Calculate rewards progress
  useEffect(() => {
    // Calculate total hours from check-ins
    let hours = 0;
    checkIns.forEach((checkIn) => {
      if (checkIn.check_out_time) {
        const checkInTime = new Date(checkIn.check_in_time).getTime();
        const checkOutTime = new Date(checkIn.check_out_time).getTime();
        const durationMs = checkOutTime - checkInTime;
        const durationHours = durationMs / (1000 * 60 * 60); // Convert to hours
        hours += durationHours;
      }
    });
    setTotalHours(Math.round(hours * 10) / 10); // Round to 1 decimal place

    // Calculate total classes attended
    const attendedCount = bookings.filter((b) => b.status === "attended").length;
    setTotalClasses(attendedCount);
  }, [checkIns, bookings]);

  // Upcoming classes (next 3)
  const upcomingClasses = bookings
    .filter(
      (b) =>
        b.class_sessions &&
        new Date(b.class_sessions.start_time) > now &&
        b.status === "booked"
    )
    .sort((a, b) => 
      new Date(a.class_sessions?.start_time || 0).getTime() - 
      new Date(b.class_sessions?.start_time || 0).getTime()
    )
    .slice(0, 3);

  // Recent activity (check-ins and class attendance)
  const recentActivity = [
    ...checkIns.slice(0, 5).map(ci => ({
      type: 'check-in' as const,
      id: ci.id,
      time: ci.check_in_time,
      title: `Checked in at ${ci.location || "Main Gym"}`,
      description: format(new Date(ci.check_in_time), "MMM d, yyyy 'at' h:mm a"),
      completed: !!ci.check_out_time,
    })),
    ...bookings
      .filter(b => b.status === "attended" && b.class_sessions)
      .slice(0, 5)
      .map(b => ({
        type: 'class' as const,
        id: b.id,
        time: b.class_sessions!.start_time,
        title: `Attended ${b.class_sessions!.name}`,
        description: format(new Date(b.class_sessions!.start_time), "MMM d, yyyy 'at' h:mm a"),
        completed: true,
      })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 5);

  // Membership status
  const membershipStatus = membership
    ? membership.status === "active" && 
      membership.payment_status === "paid" &&
      new Date(membership.end_date) > now
      ? "active"
      : membership.status === "expired" || new Date(membership.end_date) < now
      ? "expired"
      : "inactive"
    : "none";

  const membershipDaysRemaining = membership && membershipStatus === "active"
    ? Math.ceil((new Date(membership.end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Member Dashboard</h1>
          <Button onClick={() => fetchDashboardData()} variant="outline" size="sm">
            Refresh
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Button
            onClick={() => navigate("/qr/entry-exit")}
            className="h-auto p-4 flex flex-col items-center justify-center gap-2 bg-secondary hover:bg-secondary/90"
          >
            <QrCode className="w-6 h-6" />
            <span className="font-medium">Check In/Out</span>
            {hasActiveCheckIn && (
              <Badge variant="destructive" className="text-xs">Active Check-In</Badge>
            )}
          </Button>
          <Button
            onClick={() => navigate("/classes")}
            className="h-auto p-4 flex flex-col items-center justify-center gap-2 bg-accent hover:bg-accent/90"
          >
            <Calendar className="w-6 h-6" />
            <span className="font-medium">Book a Class</span>
          </Button>
          <Button
            onClick={() => navigate("/bookings")}
            className="h-auto p-4 flex flex-col items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Dumbbell className="w-6 h-6" />
            <span className="font-medium">My Bookings</span>
            {activeBookings > 0 && (
              <Badge variant="secondary" className="text-xs">{activeBookings} active</Badge>
            )}
          </Button>
        </div>

        {/* Stats Summary */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Visits This Month"
            value={String(visitsThisMonth)}
            icon={<TrendingUp className="w-5 h-5 text-success" />}
            trend={`${totalVisits} total visits`}
          />
          <StatCard
            title="Classes This Month"
            value={String(classesAttendedThisMonth)}
            icon={<Dumbbell className="w-5 h-5 text-accent" />}
            trend={`${classesAttended} total attended`}
          />
          <StatCard
            title="Active Bookings"
            value={String(activeBookings)}
            icon={<Calendar className="w-5 h-5 text-secondary" />}
            trend={`${upcomingClasses.length} upcoming`}
          />
          <MembershipStatusCard
            status={membershipStatus}
            membership={membership}
            daysRemaining={membershipDaysRemaining}
          />
        </div>

        {/* Rewards Widget */}
        <Card className="mb-8 cursor-pointer hover:bg-accent/5 transition-colors" onClick={() => navigate("/rewards")}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Rewards Progress
              </CardTitle>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <CardDescription>Click to view full rewards page</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Hours in Gym Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Hours in Gym</span>
                </div>
                <span className="text-sm font-semibold">
                  {totalHours.toFixed(1)}/{HOURS_TARGET}
                </span>
              </div>
              <Progress value={Math.min((totalHours / HOURS_TARGET) * 100, 100)} className="h-2" />
            </div>

            {/* Classes Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-secondary" />
                  <span className="text-sm font-medium">Classes</span>
                </div>
                <span className="text-sm font-semibold">
                  {totalClasses}/{CLASSES_TARGET}
                </span>
              </div>
              <Progress value={Math.min((totalClasses / CLASSES_TARGET) * 100, 100)} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Membership Status Widget */}
        {membership && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Membership Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{membership.memberships?.name || "Membership"}</span>
                    <Badge
                      variant={
                        membershipStatus === "active"
                          ? "default"
                          : membershipStatus === "expired"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {membershipStatus === "active" ? (
                        <><CheckCircle2 className="w-3 h-3 mr-1" /> Active</>
                      ) : membershipStatus === "expired" ? (
                        <><XCircle className="w-3 h-3 mr-1" /> Expired</>
                      ) : (
                        <><AlertCircle className="w-3 h-3 mr-1" /> Inactive</>
                      )}
                    </Badge>
                  </div>
                  {membershipStatus === "active" && (
                    <p className="text-sm text-muted-foreground">
                      Expires on {format(new Date(membership.end_date), "MMM d, yyyy")} ({membershipDaysRemaining} days remaining)
                    </p>
                  )}
                  {membershipStatus === "expired" && (
                    <p className="text-sm text-muted-foreground">
                      Expired on {format(new Date(membership.end_date), "MMM d, yyyy")}
                    </p>
                  )}
                </div>
                {membershipStatus !== "active" && (
                  <Button onClick={() => navigate("/managememberships")} variant="outline">
                    Renew Membership
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Class Reminders */}
        {upcomingClasses.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Upcoming Classes
              </CardTitle>
              <CardDescription>Your next scheduled classes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingClasses.map((booking) => {
                  const startTime = new Date(booking.class_sessions?.start_time || "");
                  const hoursUntil = differenceInHours(startTime, now);
                  const minutesUntil = differenceInMinutes(startTime, now);
                  const isSoon = hoursUntil < 24;
                  const isTodayDate = isToday(startTime);
                  const isThisWeekDate = isThisWeek(startTime);

                  return (
                    <div
                      key={booking.id}
                      className={`p-4 rounded-lg border ${
                        isSoon ? "bg-accent/10 border-accent" : "bg-muted/30"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{booking.class_sessions?.name}</h3>
                            {isSoon && (
                              <Badge variant={isTodayDate ? "destructive" : "default"} className="text-xs">
                                {isTodayDate ? "Today" : isThisWeekDate ? "This Week" : "Soon"}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {booking.class_sessions?.instructor && `with ${booking.class_sessions.instructor} • `}
                            {format(startTime, "MMM d, yyyy 'at' h:mm a")}
                          </p>
                          {isSoon && (
                            <p className="text-xs text-muted-foreground">
                              {hoursUntil > 0
                                ? `${hoursUntil} hour${hoursUntil > 1 ? "s" : ""} until class`
                                : `${minutesUntil} minute${minutesUntil > 1 ? "s" : ""} until class`}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate("/bookings")}
                        >
                          View <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* QR Code Display */}
        {user && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                Your Check-In QR Code
              </CardTitle>
              <CardDescription>Show this QR code at the gym entrance for quick check-in</CardDescription>
            </CardHeader>
            <CardContent>
              <QRCodeDisplay
                userId={user.id}
                action={hasActiveCheckIn ? "exit" : "entry"}
                size={200}
                className="max-w-sm mx-auto"
                showDownload={true}
                showRefresh={true}
              />
            </CardContent>
          </Card>
        )}

        {/* Recent Activity Feed */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your recent check-ins and class attendance</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <ul className="space-y-3">
                  {recentActivity.map((activity) => (
                    <li
                      key={`${activity.type}-${activity.id}`}
                      className="p-3 rounded-lg bg-muted/30 flex items-start gap-3"
                    >
                      <div className={`p-2 rounded-full ${
                        activity.completed ? "bg-success/20" : "bg-primary/20"
                      }`}>
                        {activity.type === "check-in" ? (
                          <LogIn className={`w-4 h-4 ${activity.completed ? "text-success" : "text-primary"}`} />
                        ) : (
                          <Dumbbell className={`w-4 h-4 ${activity.completed ? "text-success" : "text-primary"}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.description}</p>
                      </div>
                      {activity.completed && (
                        <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center py-8">No recent activity</p>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Classes Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Class Schedule</CardTitle>
              <CardDescription>Manage your class bookings</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingClasses.length > 0 ? (
                <div className="space-y-3">
                  {upcomingClasses.map((booking) => (
                    <div
                      key={booking.id}
                      className="p-3 rounded-lg bg-muted/30 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {booking.class_sessions?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(
                            new Date(booking.class_sessions?.start_time || ""),
                            "MMM d, h:mm a"
                          )}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Booked
                      </Badge>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => navigate("/bookings")}
                  >
                    View All Bookings
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No upcoming classes</p>
                  <Button onClick={() => navigate("/classes")} variant="outline">
                    Browse Classes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({
  title,
  value,
  icon,
  trend,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: string;
}) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{title}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <p className="text-xs text-muted-foreground">{trend}</p>
    </CardContent>
  </Card>
);

const MembershipStatusCard = ({
  status,
  membership,
  daysRemaining,
}: {
  status: string;
  membership: Membership | null;
  daysRemaining: number;
}) => {
  const getStatusInfo = () => {
    switch (status) {
      case "active":
        return {
          value: "Active",
          icon: <CheckCircle2 className="w-5 h-5 text-success" />,
          trend: `${daysRemaining} days remaining`,
        };
      case "expired":
        return {
          value: "Expired",
          icon: <XCircle className="w-5 h-5 text-destructive" />,
          trend: "Renew required",
        };
      default:
        return {
          value: "None",
          icon: <AlertCircle className="w-5 h-5 text-muted-foreground" />,
          trend: "No membership",
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Membership</span>
          {statusInfo.icon}
        </div>
        <div className="text-2xl font-bold mb-1">{statusInfo.value}</div>
        <p className="text-xs text-muted-foreground">{statusInfo.trend}</p>
      </CardContent>
    </Card>
  );
};

export default Dashboard;

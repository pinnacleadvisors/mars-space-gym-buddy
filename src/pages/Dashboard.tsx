"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Dumbbell, TrendingUp, Users } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

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
    name: string;
    start_time: string;
    end_time: string;
  };
}

const Dashboard = () => {
  const [bookings, setBookings] = useState<ClassBooking[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);

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
        .limit(10);

      if (checkInError) throw checkInError;
      setCheckIns(checkInData || []);

      // 3️⃣ Fetch class bookings with related class_sessions
      const { data: bookingData, error: bookingError } = await supabase
        .from("class_bookings")
        .select("*, class_sessions(name, start_time, end_time)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (bookingError) throw bookingError;
      setBookings(bookingData || []);
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
  }, []);

  // Derived data
  const totalVisits = checkIns.length;
  const activeBookings = bookings.filter((b) => b.status === "booked").length;
  const classesAttended = bookings.filter((b) => b.status === "attended").length;

  const upcomingClasses = bookings
    .filter(
      (b) =>
        b.class_sessions &&
        new Date(b.class_sessions.start_time) > new Date() &&
        b.status === "booked"
    )
    .slice(0, 3);

  const recentActivity = checkIns.slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-8">Member Dashboard</h1>

        {/* Stats Summary */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Active Bookings"
            value={String(activeBookings)}
            icon={<Calendar className="w-5 h-5 text-secondary" />}
            trend={`${activeBookings} upcoming`}
          />
          <StatCard
            title="Classes Attended"
            value={String(classesAttended)}
            icon={<Dumbbell className="w-5 h-5 text-accent" />}
            trend="This month"
          />
          <StatCard
            title="Total Visits"
            value={String(totalVisits)}
            icon={<TrendingUp className="w-5 h-5 text-success" />}
            trend={`${totalVisits} total check-ins`}
          />
          <StatCard
            title="Membership"
            value="Active"
            icon={<Users className="w-5 h-5 text-primary" />}
            trend="Premium Plan"
          />
        </div>

        {/* Upcoming Classes & Activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Classes</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingClasses.length > 0 ? (
                <ul className="space-y-3">
                  {upcomingClasses.map((booking) => (
                    <li
                      key={booking.id}
                      className="p-3 rounded-lg bg-muted/30 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium">
                          {booking.class_sessions?.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(
                            booking.class_sessions?.start_time || ""
                          ).toLocaleString()}
                        </p>
                      </div>
                      <span className="text-xs bg-primary text-white px-2 py-1 rounded-full">
                        Booked
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No upcoming bookings</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <ul className="space-y-3">
                  {recentActivity.map((check) => (
                    <li
                      key={check.id}
                      className="p-3 rounded-lg bg-muted/30 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium">
                          Checked in at {check.location || "Main Gym"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(check.check_in_time).toLocaleString()}
                        </p>
                      </div>
                      <span className="text-xs bg-success text-white px-2 py-1 rounded-full">
                        ✓
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No recent activity</p>
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

export default Dashboard;

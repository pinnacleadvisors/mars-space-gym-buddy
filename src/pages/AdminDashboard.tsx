import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, TrendingUp, DollarSign, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/hooks/useAnalytics";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";

const AdminDashboard = () => {
  // Auth check is handled by AdminRoute wrapper
  const { data, memberGrowth, revenueData, loading, refresh } = useAnalytics();
  const [recentCheckIns, setRecentCheckIns] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(0);
  const [loadingActivity, setLoadingActivity] = useState(true);

  // Fetch recent activity
  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        setLoadingActivity(true);

        // Fetch recent check-ins
        const { data: checkIns, error: checkInsError } = await supabase
          .from("check_ins")
          .select("*, profiles(full_name)")
          .order("check_in_time", { ascending: false })
          .limit(5);

        if (checkInsError) throw checkInsError;

        // Fetch recent bookings
        const { data: bookings, error: bookingsError } = await supabase
          .from("class_bookings")
          .select("*, class_sessions(name, start_time), profiles(full_name)")
          .order("created_at", { ascending: false })
          .limit(5);

        if (bookingsError) throw bookingsError;

        setRecentCheckIns(checkIns || []);
        setRecentBookings(bookings || []);
      } catch (error) {
        console.error("Error fetching recent activity:", error);
      } finally {
        setLoadingActivity(false);
      }
    };

    fetchRecentActivity();
  }, []);

  // Calculate monthly revenue
  useEffect(() => {
    if (revenueData && revenueData.length > 0) {
      const currentMonth = format(new Date(), "yyyy-MM");
      const currentMonthRevenue = revenueData.find(r => r.period === currentMonth);
      setMonthlyRevenue(currentMonthRevenue?.revenue || 0);
    }
  }, [revenueData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button onClick={refresh} variant="outline" size="sm" disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AdminStatCard
            title="Total Members"
            value={data?.total_members?.toString() || "0"}
            icon={<Users className="w-5 h-5 text-primary" />}
            trend={memberGrowth ? `${memberGrowth.growthThisMonth} new this month` : "Loading..."}
          />
          <AdminStatCard
            title="Active Bookings"
            value={data?.total_bookings?.toString() || "0"}
            icon={<Calendar className="w-5 h-5 text-secondary" />}
            trend="Active bookings"
          />
          <AdminStatCard
            title="Monthly Revenue"
            value={`$${monthlyRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<DollarSign className="w-5 h-5 text-success" />}
            trend={format(new Date(), "MMMM yyyy")}
          />
          <AdminStatCard
            title="Visits Today"
            value={data?.total_visits_today?.toString() || "0"}
            icon={<TrendingUp className="w-5 h-5 text-accent" />}
            trend="Check-ins today"
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingActivity ? (
                <p className="text-muted-foreground">Loading activity...</p>
              ) : recentCheckIns.length === 0 && recentBookings.length === 0 ? (
                <p className="text-muted-foreground">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {recentCheckIns.map((checkIn) => (
                    <div key={checkIn.id} className="flex items-center justify-between p-2 rounded-lg bg-muted">
                      <div>
                        <p className="text-sm font-medium">
                          {(checkIn.profiles as any)?.full_name || "User"} checked in
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(checkIn.check_in_time), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))}
                  {recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-2 rounded-lg bg-muted">
                      <div>
                        <p className="text-sm font-medium">
                          {(booking.profiles as any)?.full_name || "User"} booked {(booking.class_sessions as any)?.name || "a class"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(booking.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Popular Classes</CardTitle>
            </CardHeader>
            <CardContent>
              {!data?.popular_classes || data.popular_classes.length === 0 ? (
                <p className="text-muted-foreground">No class data available</p>
              ) : (
                <div className="space-y-2">
                  {data.popular_classes.slice(0, 5).map((cls, index) => (
                    <div key={cls.class_id} className="flex items-center justify-between p-2 rounded-lg bg-muted">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                        <span className="text-sm font-medium">{cls.class_name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {cls.total_bookings} bookings
                        </span>
                        <span className="text-sm font-semibold">
                          {cls.attendance_rate}% attendance
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const AdminStatCard = ({ title, value, icon, trend }: { 
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

export default AdminDashboard;

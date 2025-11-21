import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartSkeletons } from "@/components/loading/ChartSkeleton";
import { TrendingUp, Users, Calendar as CalendarIcon, RefreshCw, Download, Loader2 } from "lucide-react";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { useAnalytics, DateRange } from "@/hooks/useAnalytics";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const AdminAnalytics = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [dateRangePreset, setDateRangePreset] = useState<string>("30");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const { data, revenueData, memberGrowth, loading, error, refresh } = useAnalytics(
    dateRange ? { dateRange } : undefined
  );

  // Initialize date range on mount
  useEffect(() => {
    if (!dateRange) {
      const end = new Date();
      const start = subDays(end, 30);
      setStartDate(start);
      setEndDate(end);
      setDateRange({ startDate: start, endDate: end });
    }
  }, []); // Only run on mount

  // Handle date range preset changes
  const handlePresetChange = (preset: string) => {
    setDateRangePreset(preset);
    const end = new Date();
    let start = new Date();

    switch (preset) {
      case "7":
        start = subDays(end, 7);
        break;
      case "30":
        start = subDays(end, 30);
        break;
      case "90":
        start = subDays(end, 90);
        break;
      case "month":
        start = startOfMonth(end);
        break;
      case "custom":
        // Don't set date range, let user pick
        setDateRange(undefined);
        return;
      default:
        start = subDays(end, 30);
    }

    setStartDate(start);
    setEndDate(end);
    setDateRange({ startDate: start, endDate: end });
  };

  // Handle custom date range
  const handleCustomDateRange = () => {
    if (startDate && endDate) {
      setDateRange({ startDate, endDate });
      setDateRangePreset("custom");
    }
  };

  // Calculate attendance rate
  const attendanceRate = useMemo(() => {
    if (!data || !data.popular_classes || data.popular_classes.length === 0) return 0;
    const totalAttendance = data.popular_classes.reduce((sum, cls) => sum + cls.attendance_rate, 0);
    return Math.round((totalAttendance / data.popular_classes.length) * 10) / 10;
  }, [data]);

  // Prepare visit trends data for chart
  const visitTrendsData = useMemo(() => {
    if (!data?.visit_trends) return [];
    return data.visit_trends.map(trend => ({
      date: format(new Date(trend.date), "MMM d"),
      visits: trend.visit_count,
      unique: trend.unique_visitors,
    }));
  }, [data]);

  // Prepare class popularity data for chart (top 10)
  const classPopularityData = useMemo(() => {
    if (!data?.popular_classes) return [];
    return data.popular_classes.slice(0, 10).map(cls => ({
      name: cls.class_name.length > 20 ? cls.class_name.substring(0, 20) + "..." : cls.class_name,
      bookings: cls.total_bookings,
      attendance: cls.attendance_rate,
    }));
  }, [data]);

  // Prepare revenue data for chart
  const revenueChartData = useMemo(() => {
    if (!revenueData || revenueData.length === 0) return [];
    return revenueData.map(rev => ({
      period: format(new Date(rev.period + "-01"), "MMM yyyy"),
      revenue: rev.revenue,
      newMembers: rev.new_members,
    }));
  }, [revenueData]);

  // Export to CSV
  const exportToCSV = () => {
    if (!data) return;

    const csvRows: string[] = [];

    // Visit trends
    csvRows.push("Visit Trends");
    csvRows.push("Date,Visit Count,Unique Visitors");
    data.visit_trends.forEach(trend => {
      csvRows.push(`${trend.date},${trend.visit_count},${trend.unique_visitors}`);
    });

    csvRows.push("\nClass Popularity");
    csvRows.push("Class Name,Total Bookings,Attendance Rate");
    data.popular_classes.forEach(cls => {
      csvRows.push(`${cls.class_name},${cls.total_bookings},${cls.attendance_rate}`);
    });

    csvRows.push("\nRevenue Data");
    csvRows.push("Period,Revenue,New Members,Renewals");
    revenueData.forEach(rev => {
      csvRows.push(`${rev.period},${rev.revenue},${rev.new_members},${rev.renewals}`);
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Export to PDF (simplified - opens print dialog)
  const exportToPDF = () => {
    window.print();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto">
          <Card className="border-destructive">
            <CardContent className="p-6">
              <p className="text-destructive">Error loading analytics: {error}</p>
              <Button onClick={refresh} className="mt-4">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Analytics & Reports</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={refresh}
              disabled={loading}
              size="sm"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={exportToCSV}
              disabled={loading || !data}
              size="sm"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={exportToPDF}
              disabled={loading || !data}
              size="sm"
            >
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Date Range Picker */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Date Range:</span>
                <Select value={dateRangePreset} onValueChange={handlePresetChange}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="month">This month</SelectItem>
                    <SelectItem value="custom">Custom range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {dateRangePreset === "custom" && (
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[200px] justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[200px] justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "End date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <Button
                    onClick={handleCustomDateRange}
                    disabled={!startDate || !endDate}
                    size="sm"
                  >
                    Apply
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <>
            {/* Metric Cards Skeletons */}
            <div className="grid lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-5 w-5 rounded" />
                    </div>
                    <Skeleton className="h-10 w-20 mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
            {/* Charts Skeletons */}
            <ChartSkeletons count={4} />
          </>
        ) : (
          <>
            {/* Metric Cards */}
            <div className="grid lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="Total Members"
                value={data?.total_members?.toString() || "0"}
                description={`${data?.active_members || 0} active members`}
                icon={<Users className="w-5 h-5 text-primary" />}
                loading={false}
              />
              <MetricCard
                title="Member Growth"
                value={memberGrowth ? `${memberGrowth.growthPercentage >= 0 ? '+' : ''}${memberGrowth.growthPercentage.toFixed(1)}%` : "0%"}
                description={`${memberGrowth?.growthThisMonth || 0} new this month`}
                icon={<TrendingUp className="w-5 h-5 text-success" />}
                loading={false}
              />
              <MetricCard
                title="Class Attendance"
                value={`${attendanceRate}%`}
                description="Average rate"
                icon={<CalendarIcon className="w-5 h-5 text-secondary" />}
                loading={false}
              />
              <MetricCard
                title="Visits Today"
                value={data?.total_visits_today?.toString() || "0"}
                description="Total check-ins today"
                icon={<TrendingUp className="w-5 h-5 text-accent" />}
                loading={false}
              />
            </div>

            {/* Charts Grid */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {/* Visit Trends Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Visit Trends</CardTitle>
                  <CardDescription>Daily gym visits over time</CardDescription>
                </CardHeader>
                <CardContent>
                  {visitTrendsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={visitTrendsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="visits"
                          stroke="#8884d8"
                          fill="#8884d8"
                          fillOpacity={0.6}
                          name="Total Visits"
                        />
                        <Area
                          type="monotone"
                          dataKey="unique"
                          stroke="#82ca9d"
                          fill="#82ca9d"
                          fillOpacity={0.6}
                          name="Unique Visitors"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      No visit data available for the selected period
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Class Popularity Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Class Popularity</CardTitle>
                  <CardDescription>Most booked classes</CardDescription>
                </CardHeader>
                <CardContent>
                  {classPopularityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={classPopularityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="bookings" fill="#8884d8" name="Total Bookings" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      No class booking data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Revenue Chart */}
            {revenueChartData.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Revenue Trends</CardTitle>
                  <CardDescription>Monthly revenue breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#8884d8"
                        strokeWidth={2}
                        name="Revenue"
                      />
                      <Line
                        type="monotone"
                        dataKey="newMembers"
                        stroke="#82ca9d"
                        strokeWidth={2}
                        name="New Members"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Additional Stats */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Membership Breakdown</CardTitle>
                  <CardDescription>Current membership status</CardDescription>
                </CardHeader>
                <CardContent>
                  {data?.membership_breakdown ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Active", value: data.membership_breakdown.active },
                            { name: "Inactive", value: data.membership_breakdown.inactive },
                            { name: "Cancelled", value: data.membership_breakdown.suspended },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            { name: "Active", value: data.membership_breakdown.active },
                            { name: "Inactive", value: data.membership_breakdown.inactive },
                            { name: "Cancelled", value: data.membership_breakdown.suspended },
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      No membership data available
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Classes by Attendance</CardTitle>
                  <CardDescription>Classes with highest attendance rates</CardDescription>
                </CardHeader>
                <CardContent>
                  {data?.popular_classes && data.popular_classes.length > 0 ? (
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
                  ) : (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      No class data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const MetricCard = ({
  title,
  value,
  description,
  icon,
  loading,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  loading?: boolean;
}) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{title}</span>
        {icon}
      </div>
      {loading ? (
        <div className="h-10 w-20 bg-muted animate-pulse rounded" />
      ) : (
        <>
          <div className="text-3xl font-bold mb-1">{value}</div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </>
      )}
    </CardContent>
  </Card>
);

export default AdminAnalytics;

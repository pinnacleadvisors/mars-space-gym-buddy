import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, TrendingUp, DollarSign } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminLogin from "./AdminLogin";

const AdminDashboard = () => {
  const { isAdmin, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return <AdminLogin />;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AdminStatCard
            title="Total Members"
            value="342"
            icon={<Users className="w-5 h-5 text-primary" />}
            trend="+12 this month"
          />
          <AdminStatCard
            title="Active Bookings"
            value="89"
            icon={<Calendar className="w-5 h-5 text-secondary" />}
            trend="Today"
          />
          <AdminStatCard
            title="Monthly Revenue"
            value="$24,500"
            icon={<DollarSign className="w-5 h-5 text-success" />}
            trend="+8% vs last month"
          />
          <AdminStatCard
            title="Visit Rate"
            value="76%"
            icon={<TrendingUp className="w-5 h-5 text-accent" />}
            trend="This week"
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Activity feed will appear here</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Popular Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Class analytics will appear here</p>
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

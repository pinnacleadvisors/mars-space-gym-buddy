import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Dumbbell, TrendingUp, Users } from "lucide-react";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-8">Member Dashboard</h1>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Active Bookings"
            value="3"
            icon={<Calendar className="w-5 h-5 text-secondary" />}
            trend="+2 this week"
          />
          <StatCard
            title="Classes Attended"
            value="24"
            icon={<Dumbbell className="w-5 h-5 text-accent" />}
            trend="This month"
          />
          <StatCard
            title="Total Visits"
            value="47"
            icon={<TrendingUp className="w-5 h-5 text-success" />}
            trend="+8 this month"
          />
          <StatCard
            title="Membership"
            value="Active"
            icon={<Users className="w-5 h-5 text-primary" />}
            trend="Premium Plan"
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No upcoming bookings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No recent activity</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, trend }: { 
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

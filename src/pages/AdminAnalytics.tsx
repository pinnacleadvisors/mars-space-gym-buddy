import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, Users, Calendar } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const AdminAnalytics = () => {
  const { isAdmin, isLoading } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate('/admin');
    }
  }, [isAdmin, isLoading, navigate]);

  if (isLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-8">Analytics & Reports</h1>
        
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="Member Growth"
            value="+15%"
            description="vs last month"
            icon={<TrendingUp className="w-5 h-5 text-success" />}
          />
          <MetricCard
            title="Class Attendance"
            value="82%"
            description="Average rate"
            icon={<Calendar className="w-5 h-5 text-secondary" />}
          />
          <MetricCard
            title="Active Users"
            value="267"
            description="This week"
            icon={<Users className="w-5 h-5 text-primary" />}
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Visit Trends</CardTitle>
              <CardDescription>Daily gym visits over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Chart placeholder</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Class Popularity</CardTitle>
              <CardDescription>Most booked classes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Chart placeholder</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, description, icon }: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{title}</span>
        {icon}
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

export default AdminAnalytics;

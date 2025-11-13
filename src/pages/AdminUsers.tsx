import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const AdminUsers = () => {
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
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Manage Users</h1>
          <Button className="bg-secondary hover:bg-secondary/90">Add New User</Button>
        </div>
        
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search users..." className="pl-10" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <UserRow
                name="John Smith"
                email="john@example.com"
                status="active"
                memberSince="Jan 2025"
              />
              <UserRow
                name="Sarah Johnson"
                email="sarah@example.com"
                status="active"
                memberSince="Dec 2024"
              />
              <UserRow
                name="Mike Chen"
                email="mike@example.com"
                status="inactive"
                memberSince="Nov 2024"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const UserRow = ({ name, email, status, memberSince }: {
  name: string;
  email: string;
  status: string;
  memberSince: string;
}) => (
  <div className="flex items-center justify-between p-4 border rounded-lg">
    <div className="flex-1">
      <h3 className="font-semibold">{name}</h3>
      <p className="text-sm text-muted-foreground">{email}</p>
    </div>
    <div className="flex items-center gap-4">
      <div className="text-sm text-muted-foreground">Member since {memberSince}</div>
      <Badge variant={status === 'active' ? 'default' : 'secondary'}>
        {status}
      </Badge>
      <Button variant="outline" size="sm">Edit</Button>
    </div>
  </div>
);

export default AdminUsers;

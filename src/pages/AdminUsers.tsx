"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  UserX, 
  UserCheck, 
  Shield, 
  User, 
  Mail, 
  Calendar,
  CheckSquare,
  Square,
  Trash2,
  Clock,
  Activity
} from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { showErrorToast, showSuccessToast } from "@/lib/utils/toastHelpers";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string | null;
  avatar_url: string | null;
}

interface UserRole {
  user_id: string;
  role: 'admin' | 'staff' | 'member';
}

interface UserWithRole extends UserProfile {
  role: 'admin' | 'staff' | 'member';
  membership_status?: 'active' | 'expired' | 'none';
  last_activity?: string;
  total_visits?: number;
  total_bookings?: number;
}

const AdminUsers = () => {
  const { isAdmin, isLoading: authLoading } = useAdminAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [newRole, setNewRole] = useState<'admin' | 'staff' | 'member'>('member');
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [viewingUserActivity, setViewingUserActivity] = useState<UserWithRole | null>(null);
  const [userActivity, setUserActivity] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/admin');
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Note: We can't access auth.users directly from the frontend
      // Email will be shown if available in profile metadata, otherwise we'll skip it

      // Fetch membership status for each user
      const { data: memberships, error: membershipsError } = await supabase
        .from("user_memberships")
        .select("user_id, status, end_date")
        .order("created_at", { ascending: false });

      if (membershipsError) throw membershipsError;

      // Fetch activity data
      const { data: checkIns, error: checkInsError } = await supabase
        .from("check_ins")
        .select("user_id, check_in_time")
        .order("check_in_time", { ascending: false });

      if (checkInsError) throw checkInsError;

      const { data: bookings, error: bookingsError } = await supabase
        .from("class_bookings")
        .select("user_id, created_at")
        .order("created_at", { ascending: false });

      if (bookingsError) throw bookingsError;

      // Combine data
      const usersWithData: UserWithRole[] = profiles.map((profile) => {
        const role = roles.find((r) => r.user_id === profile.id)?.role || 'member';
        const userMembership = memberships?.find((m) => m.user_id === profile.id);
        const lastCheckIn = checkIns?.filter((c) => c.user_id === profile.id)[0];
        const lastBooking = bookings?.filter((b) => b.user_id === profile.id)[0];
        
        const lastActivity = lastCheckIn || lastBooking
          ? new Date(
              lastCheckIn && lastBooking
                ? new Date(lastCheckIn.check_in_time) > new Date(lastBooking.created_at)
                  ? lastCheckIn.check_in_time
                  : lastBooking.created_at
                : lastCheckIn?.check_in_time || lastBooking?.created_at || ""
            ).toISOString()
          : undefined;

        let membershipStatus: 'active' | 'expired' | 'none' = 'none';
        if (userMembership) {
          if (userMembership.status === 'active' && new Date(userMembership.end_date) > new Date()) {
            membershipStatus = 'active';
          } else {
            membershipStatus = 'expired';
          }
        }

        return {
          ...profile,
          role,
          membership_status: membershipStatus,
          last_activity: lastActivity,
          total_visits: checkIns?.filter((c) => c.user_id === profile.id).length || 0,
          total_bookings: bookings?.filter((b) => b.user_id === profile.id).length || 0,
        };
      });

      setUsers(usersWithData);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      showErrorToast({
        title: "Error loading users",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        searchQuery === "" ||
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus = statusFilter === "all" || user.membership_status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map((u) => u.id)));
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'staff' | 'member') => {
    try {
      // Check if user already has a role
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from("user_roles")
          .update({ role: newRole })
          .eq("user_id", userId);

        if (error) throw error;
      } else {
        // Create new role
        const { error } = await supabase
          .from("user_roles")
          .insert([{ user_id: userId, role: newRole }]);

        if (error) throw error;
      }

      showSuccessToast(`User role updated to ${newRole}`);
      await fetchUsers();
      setEditDialogOpen(false);
      setEditingUser(null);
    } catch (error: any) {
      console.error("Error updating role:", error);
      showErrorToast({
        title: "Error updating role",
        description: error.message,
      });
    }
  };

  const handleBulkRoleChange = async (newRole: 'admin' | 'staff' | 'member') => {
    try {
      const updates = Array.from(selectedUsers).map(async (userId) => {
        const { data: existingRole } = await supabase
          .from("user_roles")
          .select("id")
          .eq("user_id", userId)
          .single();

        if (existingRole) {
          return supabase
            .from("user_roles")
            .update({ role: newRole })
            .eq("user_id", userId);
        } else {
          return supabase
            .from("user_roles")
            .insert([{ user_id: userId, role: newRole }]);
        }
      });

      await Promise.all(updates);
      showSuccessToast(`Updated ${selectedUsers.size} user(s) to ${newRole}`);
      setSelectedUsers(new Set());
      await fetchUsers();
    } catch (error: any) {
      console.error("Error bulk updating roles:", error);
      showErrorToast({
        title: "Error updating roles",
        description: error.message,
      });
    }
  };

  const handleSuspendUser = async (userId: string) => {
    try {
      // Note: This is a placeholder. In a real app, you'd need a suspension mechanism
      // This could be implemented via a status field in profiles or user_roles
      showErrorToast({
        title: "Not implemented",
        description: "User suspension feature requires additional database fields.",
      });
    } catch (error: any) {
      console.error("Error suspending user:", error);
      showErrorToast({
        title: "Error suspending user",
        description: error.message,
      });
    }
  };

  const handleViewActivity = async (user: UserWithRole) => {
    setViewingUserActivity(user);
    setActivityDialogOpen(true);

    try {
      // Fetch user activity
      const [checkInsRes, bookingsRes] = await Promise.all([
        supabase
          .from("check_ins")
          .select("check_in_time, check_out_time, location")
          .eq("user_id", user.id)
          .order("check_in_time", { ascending: false })
          .limit(20),
        supabase
          .from("class_bookings")
          .select("*, class_sessions(name, start_time)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      if (checkInsRes.error) throw checkInsRes.error;
      if (bookingsRes.error) throw bookingsRes.error;

      const activities = [
        ...(checkInsRes.data || []).map((ci) => ({
          type: 'check-in' as const,
          date: ci.check_in_time,
          description: `Checked in at ${ci.location || 'Main Gym'}`,
        })),
        ...(bookingsRes.data || []).map((b) => ({
          type: 'booking' as const,
          date: b.created_at,
          description: `Booked ${b.class_sessions?.name || 'Class'}`,
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setUserActivity(activities);
    } catch (error: any) {
      console.error("Error fetching activity:", error);
      showErrorToast({
        title: "Error loading activity",
        description: error.message,
      });
    }
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading users..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage users, roles, and permissions
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card className="md:col-span-2">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, ID, or phone..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active Membership</SelectItem>
                  <SelectItem value="expired">Expired Membership</SelectItem>
                  <SelectItem value="none">No Membership</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.size > 0 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">
                    {selectedUsers.size} user(s) selected
                  </span>
                  <div className="flex gap-2">
                    <Select
                      value=""
                      onValueChange={(value) => {
                        if (value) {
                          handleBulkRoleChange(value as 'admin' | 'staff' | 'member');
                        }
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Change role..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Set as Admin</SelectItem>
                        <SelectItem value="staff">Set as Staff</SelectItem>
                        <SelectItem value="member">Set as Member</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedUsers(new Set())}
                >
                  Clear Selection
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Users ({filteredUsers.length})</CardTitle>
                <CardDescription>
                  {selectedUsers.size > 0 && `${selectedUsers.size} selected`}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedUsers.size === filteredUsers.length ? (
                  <>
                    <CheckSquare className="w-4 h-4 mr-2" />
                    Deselect All
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4 mr-2" />
                    Select All
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Membership</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead>Stats</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedUsers.has(user.id)}
                            onCheckedChange={() => handleSelectUser(user.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {user.full_name || "No name"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ID: {user.id.slice(0, 8)}...
                            </div>
                            {user.phone && (
                              <div className="text-xs text-muted-foreground">
                                {user.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.role === "admin"
                                ? "destructive"
                                : user.role === "staff"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {user.role === "admin" && <Shield className="w-3 h-3 mr-1" />}
                            {user.role === "staff" && <User className="w-3 h-3 mr-1" />}
                            {user.role === "member" && <User className="w-3 h-3 mr-1" />}
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.membership_status === "active"
                                ? "default"
                                : user.membership_status === "expired"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {user.membership_status || "none"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.last_activity ? (
                            <div className="text-sm">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {format(new Date(user.last_activity), "MMM d, yyyy")}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">No activity</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-1">
                              <Activity className="w-3 h-3 text-muted-foreground" />
                              <span>{user.total_visits || 0} visits</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              <span>{user.total_bookings || 0} bookings</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => handleViewActivity(user)}
                              >
                                <Activity className="w-4 h-4 mr-2" />
                                View Activity
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingUser(user);
                                  setNewRole(user.role);
                                  setEditDialogOpen(true);
                                }}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Role
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => navigate(`/profile?id=${user.id}`)}
                              >
                                <User className="w-4 h-4 mr-2" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleSuspendUser(user.id)}
                                className="text-destructive"
                              >
                                <UserX className="w-4 h-4 mr-2" />
                                Suspend User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Role Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User Role</DialogTitle>
              <DialogDescription>
                Change the role for {editingUser?.full_name || `User ${editingUser?.id.slice(0, 8)}`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Role</label>
                <Select
                  value={newRole}
                  onValueChange={(value) => setNewRole(value as 'admin' | 'staff' | 'member')}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => editingUser && handleRoleChange(editingUser.id, newRole)}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Activity Dialog */}
        <Dialog open={activityDialogOpen} onOpenChange={setActivityDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Activity History - {viewingUserActivity?.full_name || `User ${viewingUserActivity?.id.slice(0, 8)}`}
              </DialogTitle>
              <DialogDescription>
                Recent check-ins and bookings
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {userActivity.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No activity found
                </p>
              ) : (
                <div className="space-y-2">
                  {userActivity.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30"
                    >
                      <div className={`p-2 rounded-full ${
                        activity.type === 'check-in' ? 'bg-success/20' : 'bg-primary/20'
                      }`}>
                        {activity.type === 'check-in' ? (
                          <UserCheck className="w-4 h-4 text-success" />
                        ) : (
                          <Calendar className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(activity.date), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setActivityDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminUsers;

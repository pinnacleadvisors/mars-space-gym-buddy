"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  BarChart3,
  UserPlus
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addDays, differenceInDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { showErrorToast, showSuccessToast } from "@/lib/utils/toastHelpers";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Membership form validation schema
const membershipSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  price: z.string().refine((val) => {
    if (!val) return true; // Optional
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0;
  }, "Price must be a valid number"),
  duration_days: z.string().refine((val) => {
    if (!val) return true; // Optional
    const num = parseInt(val);
    return !isNaN(num) && num > 0;
  }, "Duration must be a positive number"),
  access_level: z.string().optional(),
});

type MembershipFormData = z.infer<typeof membershipSchema>;

interface Membership {
  id: string;
  name: string;
  price: number | null;
  duration_days: number | null;
  access_level: string | null;
  created_at: string;
}

interface MembershipStats {
  total_memberships: number;
  active_memberships: number;
  expired_memberships: number;
  total_revenue: number;
  renewals_due_soon: number;
}

interface RenewalReminder {
  user_id: string;
  user_name: string;
  membership_name: string;
  end_date: string;
  days_remaining: number;
}

const AdminManageMemberships = () => {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [membershipToDelete, setMembershipToDelete] = useState<Membership | null>(null);
  const [editingMembership, setEditingMembership] = useState<Membership | null>(null);
  const [stats, setStats] = useState<MembershipStats | null>(null);
  const [renewalReminders, setRenewalReminders] = useState<RenewalReminder[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<MembershipFormData>({
    resolver: zodResolver(membershipSchema),
    defaultValues: {
      name: "",
      price: "",
      duration_days: "",
      access_level: "",
    },
  });

  useEffect(() => {
    fetchMemberships();
    fetchStatistics();
    fetchRenewalReminders();
  }, []);

  const fetchMemberships = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("memberships")
        .select("*")
        .order("name");

      if (error) throw error;
      setMemberships(data || []);
    } catch (error: any) {
      showErrorToast({
        title: "Error loading memberships",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      // Fetch all user memberships
      const { data: userMemberships, error } = await supabase
        .from("user_memberships")
        .select("status, payment_status, memberships(price)");

      if (error) throw error;

      const now = new Date();
      let totalRevenue = 0;
      let activeCount = 0;
      let expiredCount = 0;

      userMemberships?.forEach((um) => {
        if (um.status === "active" && um.payment_status === "paid") {
          activeCount++;
          if (um.memberships?.price) {
            totalRevenue += parseFloat(um.memberships.price.toString());
          }
        } else if (um.status === "expired") {
          expiredCount++;
        }
      });

      setStats({
        total_memberships: userMemberships?.length || 0,
        active_memberships: activeCount,
        expired_memberships: expiredCount,
        total_revenue: totalRevenue,
        renewals_due_soon: renewalReminders.length,
      });
    } catch (error: any) {
      console.error("Error fetching statistics:", error);
    }
  };

  const fetchRenewalReminders = async () => {
    try {
      const now = new Date();
      const thirtyDaysFromNow = addDays(now, 30);

      // Fetch memberships expiring in the next 30 days
      const { data, error } = await supabase
        .from("user_memberships")
        .select("*, profiles(full_name), memberships(name)")
        .eq("status", "active")
        .eq("payment_status", "paid")
        .gte("end_date", now.toISOString())
        .lte("end_date", thirtyDaysFromNow.toISOString())
        .order("end_date", { ascending: true });

      if (error) throw error;

      const reminders: RenewalReminder[] = (data || []).map((um: any) => ({
        user_id: um.user_id,
        user_name: um.profiles?.full_name || "Unknown",
        membership_name: um.memberships?.name || "Unknown",
        end_date: um.end_date,
        days_remaining: differenceInDays(new Date(um.end_date), now),
      }));

      setRenewalReminders(reminders);
      
      // Update stats with renewal count
      if (stats) {
        setStats({ ...stats, renewals_due_soon: reminders.length });
      }
    } catch (error: any) {
      console.error("Error fetching renewal reminders:", error);
    }
  };

  const resetForm = () => {
    form.reset({
      name: "",
      price: "",
      duration_days: "",
      access_level: "",
    });
    setEditingMembership(null);
  };

  const handleSubmit = async (data: MembershipFormData) => {
    try {
      const membershipData = {
        name: data.name,
        price: data.price ? parseFloat(data.price) : null,
        duration_days: data.duration_days ? parseInt(data.duration_days) : null,
        access_level: data.access_level || null,
      };

      if (editingMembership) {
        const { error } = await supabase
          .from("memberships")
          .update(membershipData)
          .eq("id", editingMembership.id);

        if (error) throw error;

        showSuccessToast("Membership updated successfully");
      } else {
        const { error } = await supabase
          .from("memberships")
          .insert([membershipData]);

        if (error) throw error;

        showSuccessToast("Membership created successfully");
      }

      setDialogOpen(false);
      resetForm();
      await fetchMemberships();
      await fetchStatistics();
    } catch (error: any) {
      showErrorToast({
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleEdit = (membership: Membership) => {
    setEditingMembership(membership);
    form.reset({
      name: membership.name,
      price: membership.price?.toString() || "",
      duration_days: membership.duration_days?.toString() || "",
      access_level: membership.access_level || "",
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (membership: Membership) => {
    setMembershipToDelete(membership);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!membershipToDelete) return;

    try {
      // Check if membership is in use
      const { data: userMemberships, error: checkError } = await supabase
        .from("user_memberships")
        .select("id")
        .eq("membership_id", membershipToDelete.id)
        .limit(1);

      if (checkError) throw checkError;

      if (userMemberships && userMemberships.length > 0) {
        showErrorToast({
          title: "Cannot delete",
          description: "This membership is assigned to users. Please remove all assignments first.",
        });
        setDeleteDialogOpen(false);
        return;
      }

      const { error } = await supabase
        .from("memberships")
        .delete()
        .eq("id", membershipToDelete.id);

      if (error) throw error;

      showSuccessToast("Membership deleted successfully");
      setDeleteDialogOpen(false);
      setMembershipToDelete(null);
      await fetchMemberships();
      await fetchStatistics();
    } catch (error: any) {
      showErrorToast({
        title: "Error",
        description: error.message,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading memberships..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Membership Management</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage membership plans
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/admin/usermemberships")}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Assign to Users
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingMembership ? "Edit Membership" : "Add New Membership"}
                </DialogTitle>
                <DialogDescription>
                  {editingMembership
                    ? "Update membership plan details"
                    : "Create a new membership plan"}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Gold Membership"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (£)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="e.g., 49.99"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Monthly or one-time price
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="duration_days"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (Days)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 30"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Number of days the membership is valid
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="access_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Access Level</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Full Access"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Description of access level
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingMembership ? "Update" : "Create"} Membership
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Membership
          </Button>
        </div>
      </div>

      <Tabs defaultValue="plans" className="space-y-6">
        <TabsList>
          <TabsTrigger value="plans">Membership Plans</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="renewals">Renewal Reminders</TabsTrigger>
        </TabsList>

        {/* Membership Plans Tab */}
        <TabsContent value="plans">
          <Card>
            <CardHeader>
              <CardTitle>Membership Plans</CardTitle>
              <CardDescription>
                Manage all available membership plans
              </CardDescription>
            </CardHeader>
            <CardContent>
              {memberships.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No memberships found</p>
                  <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Membership
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Access Level</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {memberships.map((membership) => (
                        <TableRow key={membership.id}>
                          <TableCell className="font-medium">
                            {membership.name}
                          </TableCell>
                          <TableCell>
                            {membership.price ? `£${membership.price.toFixed(2)}` : "-"}
                          </TableCell>
                          <TableCell>
                            {membership.duration_days
                              ? `${membership.duration_days} days`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {membership.access_level || "-"}
                          </TableCell>
                          <TableCell>
                            {format(new Date(membership.created_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(membership)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(membership)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Total Memberships</span>
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="text-2xl font-bold">
                  {stats?.total_memberships || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  All user memberships
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Active</span>
                  <CheckCircle2 className="w-5 h-5 text-success" />
                </div>
                <div className="text-2xl font-bold">
                  {stats?.active_memberships || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Currently active
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Expired</span>
                  <XCircle className="w-5 h-5 text-destructive" />
                </div>
                <div className="text-2xl font-bold">
                  {stats?.expired_memberships || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  No longer active
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Total Revenue</span>
                  <TrendingUp className="w-5 h-5 text-accent" />
                </div>
                <div className="text-2xl font-bold">
                  £{stats?.total_revenue.toFixed(2) || "0.00"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  From paid memberships
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Membership Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                  <div>
                    <p className="font-medium">Membership Plans Available</p>
                    <p className="text-sm text-muted-foreground">
                      {memberships.length} plan{memberships.length !== 1 ? "s" : ""} configured
                    </p>
                  </div>
                  <Badge variant="secondary">{memberships.length}</Badge>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                  <div>
                    <p className="font-medium">Renewals Due Soon</p>
                    <p className="text-sm text-muted-foreground">
                      Memberships expiring in next 30 days
                    </p>
                  </div>
                  <Badge variant={renewalReminders.length > 0 ? "destructive" : "secondary"}>
                    {renewalReminders.length}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Renewal Reminders Tab */}
        <TabsContent value="renewals">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Renewal Reminders
              </CardTitle>
              <CardDescription>
                Memberships expiring in the next 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renewalReminders.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-success mb-4" />
                  <p className="text-muted-foreground">
                    No renewals due in the next 30 days
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {renewalReminders.map((reminder) => (
                    <div
                      key={`${reminder.user_id}-${reminder.end_date}`}
                      className={`p-4 rounded-lg border flex items-start justify-between ${
                        reminder.days_remaining <= 7
                          ? "bg-destructive/10 border-destructive"
                          : reminder.days_remaining <= 14
                          ? "bg-orange-500/10 border-orange-500"
                          : "bg-muted/30"
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{reminder.user_name}</h3>
                          <Badge
                            variant={
                              reminder.days_remaining <= 7
                                ? "destructive"
                                : reminder.days_remaining <= 14
                                ? "default"
                                : "secondary"
                            }
                          >
                            {reminder.days_remaining <= 7 ? (
                              <AlertCircle className="w-3 h-3 mr-1" />
                            ) : (
                              <Clock className="w-3 h-3 mr-1" />
                            )}
                            {reminder.days_remaining} day{reminder.days_remaining !== 1 ? "s" : ""} remaining
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {reminder.membership_name} • Expires {format(new Date(reminder.end_date), "MMM d, yyyy")}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/usermemberships?user=${reminder.user_id}`)}
                      >
                        Manage
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Membership</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{membershipToDelete?.name}"? This action cannot be undone.
              {membershipToDelete && (
                <div className="mt-2 p-2 bg-destructive/10 rounded text-destructive text-sm">
                  Note: This membership cannot be deleted if it's assigned to any users.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminManageMemberships;

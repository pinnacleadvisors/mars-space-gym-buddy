import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Edit, Trash2 } from "lucide-react";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format, addMonths } from "date-fns";

interface UserMembership {
  id: string;
  user_id: string;
  membership_id: string;
  start_date: string;
  end_date: string;
  status: string;
  payment_status: string;
  payment_method: string | null;
  cancelled_at: string | null;
  profiles?: {
    full_name: string | null;
  };
  memberships?: {
    name: string;
  };
}

interface User {
  id: string;
  full_name: string | null;
}

interface Membership {
  id: string;
  name: string;
  duration_days: number | null;
}

const AdminUserMemberships = () => {
  const [userMemberships, setUserMemberships] = useState<UserMembership[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUserMembership, setEditingUserMembership] = useState<UserMembership | null>(null);
  const { toast } = useToast();
  const [showCancelledOnly, setShowCancelledOnly] = useState(false);

  const [formData, setFormData] = useState({
    user_id: "",
    membership_id: "",
    start_date: "",
    end_date: "",
    status: "active",
    payment_status: "paid",
    payment_method: "other",
  });

  useEffect(() => {
    fetchData();
  }, [showCancelledOnly]);

  // Set up real-time subscription for membership updates
  useEffect(() => {
    let mounted = true;
    const channels: ReturnType<typeof supabase.channel>[] = [];

    const setupSubscription = async () => {
      // Set up real-time subscription to listen for changes to user_memberships
      const channel = supabase
        .channel('admin-user-memberships-changes')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen for INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'user_memberships',
          },
          (payload) => {
            console.log('User membership change detected in admin view:', payload);
            // Refresh data when changes occur
            if (mounted) {
              fetchData();
            }
          }
        )
        .subscribe();
      
      channels.push(channel);
    };

    setupSubscription();

    return () => {
      mounted = false;
      // Clean up all channels
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, []);

  const fetchData = async () => {
    try {
      // Explicitly include cancelled_at in the select to ensure it's fetched
      let query = supabase
        .from("user_memberships")
        .select("*, cancelled_at, profiles(full_name), memberships(name)")
        .order("created_at", { ascending: false });
      
      // Filter to show only cancelled non-Stripe memberships if toggle is on
      if (showCancelledOnly) {
        query = query
          .not("cancelled_at", "is", null)
          .neq("payment_method", "stripe")
          .is("stripe_subscription_id", null);
      }
      
      const [userMembershipsRes, usersRes, membershipsRes] = await Promise.all([
        query,
        supabase.from("profiles").select("id, full_name"),
        supabase.from("memberships").select("id, name, duration_days"),
      ]);

      if (userMembershipsRes.error) throw userMembershipsRes.error;
      if (usersRes.error) throw usersRes.error;
      if (membershipsRes.error) throw membershipsRes.error;

      setUserMemberships(userMembershipsRes.data || []);
      setUsers(usersRes.data || []);
      setMemberships(membershipsRes.data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      user_id: "",
      membership_id: "",
      start_date: "",
      end_date: "",
      status: "active",
      payment_status: "paid",
      payment_method: "other",
    });
    setEditingUserMembership(null);
  };

  const calculateEndDate = (startDate: string) => {
    if (!startDate) return "";
    
    // For monthly recurring memberships, add 1 month to start date
    // This handles months with different lengths correctly
    // e.g., Feb 1 → Mar 1, Jan 31 → Feb 28/29 or Mar 1
    const start = new Date(startDate);
    const end = addMonths(start, 1);
    return end.toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ensure end_date is calculated if not already set
    const calculatedEndDate = formData.end_date || calculateEndDate(formData.start_date);
    
    if (!calculatedEndDate) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a start date",
      });
      return;
    }

    try {
      // Check for existing active membership when creating new one
      if (!editingUserMembership) {
        const { data: existingMemberships, error: checkError } = await supabase
          .from("user_memberships")
          .select("id, status, end_date")
          .eq("user_id", formData.user_id)
          .eq("status", "active"); // Only check for active memberships

        if (checkError) throw checkError;

        if (existingMemberships && existingMemberships.length > 0) {
          // Check if any active membership hasn't expired yet
          const activeNonExpired = existingMemberships.some((membership) => {
            const endDate = new Date(membership.end_date);
            return endDate > new Date();
          });

          if (activeNonExpired) {
            toast({
              variant: "destructive",
              title: "Error",
              description: "This user already has an active membership. Please edit the existing membership or wait until it expires before creating a new one.",
            });
            return;
          }
        }
      }

      const userMembershipData: any = {
        user_id: formData.user_id,
        membership_id: formData.membership_id,
        start_date: formData.start_date,
        end_date: calculatedEndDate,
        status: formData.status,
        payment_status: formData.payment_status,
        payment_method: formData.payment_method,
      };

      // Clear cancelled_at when status is changed to "active"
      if (formData.status === "active") {
        userMembershipData.cancelled_at = null;
      }

      if (editingUserMembership) {
        const { error } = await supabase
          .from("user_memberships")
          .update(userMembershipData)
          .eq("id", editingUserMembership.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "User membership updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("user_memberships")
          .insert([userMembershipData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "User membership created successfully",
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleEdit = (userMembership: UserMembership) => {
    setEditingUserMembership(userMembership);
    const startDate = userMembership.start_date.split('T')[0];
    setFormData({
      user_id: userMembership.user_id,
      membership_id: userMembership.membership_id,
      start_date: startDate,
      // Auto-calculate end date based on start date (1 month after)
      end_date: calculateEndDate(startDate),
      status: userMembership.status,
      payment_status: userMembership.payment_status,
      payment_method: userMembership.payment_method || "other",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user membership?")) return;

    try {
      const { error } = await supabase
        .from("user_memberships")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User membership deleted successfully",
      });

      fetchData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User Memberships</h1>
        <div className="flex gap-2">
          <Button
            variant={showCancelledOnly ? "default" : "outline"}
            onClick={() => setShowCancelledOnly(!showCancelledOnly)}
          >
            {showCancelledOnly ? "Show All" : "Cancelled List (Non-Stripe)"}
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Assign Membership
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingUserMembership ? "Edit User Membership" : "Assign Membership"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="user_id">User *</Label>
                <Select
                  value={formData.user_id}
                  onValueChange={(value) => setFormData({ ...formData, user_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name || "Unnamed User"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="membership_id">Membership *</Label>
                <Select
                  value={formData.membership_id}
                  onValueChange={(value) => {
                    const newFormData = { ...formData, membership_id: value };
                    // Auto-calculate end date if start date is set
                    if (formData.start_date) {
                      newFormData.end_date = calculateEndDate(formData.start_date);
                    }
                    setFormData(newFormData);
                  }}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select membership" />
                  </SelectTrigger>
                  <SelectContent>
                    {memberships.map((membership) => (
                      <SelectItem key={membership.id} value={membership.id}>
                        {membership.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => {
                    const newFormData = { ...formData, start_date: e.target.value };
                    // Auto-calculate end date (1 month after start date for monthly recurring)
                    if (e.target.value) {
                      newFormData.end_date = calculateEndDate(e.target.value);
                    } else {
                      newFormData.end_date = "";
                    }
                    setFormData(newFormData);
                  }}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  End date will be automatically set to 1 month after start date
                </p>
              </div>
              <div>
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="payment_status">Payment Status *</Label>
                <Select
                  value={formData.payment_status}
                  onValueChange={(value) => setFormData({ ...formData, payment_status: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="payment_method">Payment Method *</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="direct_debit">Direct Debit</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                {editingUserMembership ? "Update" : "Assign"} Membership
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {showCancelledOnly ? "Cancelled User Memberships" : "Active User Memberships"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Membership</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Cancelled At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userMemberships.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    {showCancelledOnly ? "No cancelled memberships found" : "No user memberships found"}
                  </TableCell>
                </TableRow>
              ) : (
                userMemberships.map((um) => (
                  <TableRow 
                    key={um.id}
                  >
                    <TableCell className="font-medium">
                      {um.profiles?.full_name || "Unknown User"}
                    </TableCell>
                    <TableCell>{um.memberships?.name || "Unknown"}</TableCell>
                    <TableCell>{format(new Date(um.start_date), "MMM dd, yyyy")}</TableCell>
                    <TableCell>{format(new Date(um.end_date), "MMM dd, yyyy")}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        um.status === 'active' ? 'bg-green-100 text-green-800' :
                        um.status === 'expired' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {um.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        um.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                        um.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {um.payment_status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {um.payment_method ? (
                        <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800 capitalize">
                          {um.payment_method.replace('_', ' ')}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {um.cancelled_at ? (
                        <div className="flex flex-col">
                          <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                            {format(new Date(um.cancelled_at), "MMM dd, yyyy")}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(um.cancelled_at), "HH:mm")}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(um)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(um.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUserMemberships;

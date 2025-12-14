import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Edit, Trash2, Search, Download, Filter } from "lucide-react";
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
import * as XLSX from "xlsx";

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
    email?: string | null;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired">("all");
  const [userEmails, setUserEmails] = useState<Record<string, string>>({});

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
    fetchUserEmails();
  }, [showCancelledOnly]);

  const fetchUserEmails = async () => {
    try {
      // Fetch user emails via RPC function
      // Note: This requires the get_user_emails() database function to be created
      // See supabase/migrations/ADD_GET_USER_EMAILS_FUNCTION.sql
      const { data, error } = await supabase.rpc('get_user_emails');
      
      if (!error && data) {
        const emailMap: Record<string, string> = {};
        data.forEach((item: { id: string; email: string }) => {
          emailMap[item.id] = item.email;
        });
        setUserEmails(emailMap);
      } else {
        // If function doesn't exist or fails, email column will show "N/A"
        console.warn('Could not fetch user emails. Run ADD_GET_USER_EMAILS_FUNCTION.sql migration to enable email column.');
      }
    } catch (error) {
      console.error('Error fetching user emails:', error);
    }
  };

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

      // Update status based on end_date before setting state
      const now = new Date();
      const updatedMemberships: UserMembership[] = [];
      const membershipsToUpdate: string[] = [];

      for (const um of userMembershipsRes.data || []) {
        const endDate = new Date(um.end_date);
        // If end_date is before current date and status is active, mark for update
        if (endDate < now && um.status === 'active') {
          updatedMemberships.push({ ...um, status: 'expired' });
          membershipsToUpdate.push(um.id);
        } else {
          updatedMemberships.push(um);
        }
      }

      // Batch update expired memberships in the database
      if (membershipsToUpdate.length > 0) {
        const { error: updateError } = await supabase
          .from("user_memberships")
          .update({ status: 'expired' })
          .in('id', membershipsToUpdate);
        
        if (updateError) {
          console.error('Error updating expired memberships:', updateError);
        }
      }

      setUserMemberships(updatedMemberships);
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

  // Compute status based on end_date
  const getComputedStatus = (membership: UserMembership): string => {
    const endDate = new Date(membership.end_date);
    const now = new Date();
    if (endDate < now && membership.status === 'active') {
      return 'expired';
    }
    return membership.status;
  };

  // Filter and search logic
  const filteredMemberships = useMemo(() => {
    return userMemberships.filter((um) => {
      // Status filter
      const computedStatus = getComputedStatus(um);
      if (statusFilter !== "all" && computedStatus !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const userName = um.profiles?.full_name?.toLowerCase() || "";
        const membershipName = um.memberships?.name?.toLowerCase() || "";
        const email = userEmails[um.user_id]?.toLowerCase() || "";
        
        return (
          userName.includes(searchLower) ||
          membershipName.includes(searchLower) ||
          email.includes(searchLower)
        );
      }

      return true;
    });
  }, [userMemberships, statusFilter, searchQuery, userEmails]);

  // Export to Excel
  const handleExportToExcel = () => {
    const exportData = filteredMemberships.map((um) => {
      const computedStatus = getComputedStatus(um);
      return {
        User: um.profiles?.full_name || "Unknown User",
        Email: userEmails[um.user_id] || "N/A",
        Membership: um.memberships?.name || "Unknown",
        "Start Date": format(new Date(um.start_date), "yyyy-MM-dd"),
        "End Date": format(new Date(um.end_date), "yyyy-MM-dd"),
        Status: computedStatus,
        "Payment Status": um.payment_status,
        "Payment Method": um.payment_method ? um.payment_method.replace('_', ' ') : "N/A",
        "Cancelled At": um.cancelled_at ? format(new Date(um.cancelled_at), "yyyy-MM-dd HH:mm") : "N/A",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "User Memberships");
    
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `user-memberships-${format(new Date(), "yyyy-MM-dd")}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "User memberships exported to Excel successfully",
    });
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
          <div className="flex justify-between items-center">
            <CardTitle>
              {showCancelledOnly ? "Cancelled User Memberships" : "User Memberships"}
            </CardTitle>
            <Button onClick={handleExportToExcel} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export to Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or membership..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={(value: "all" | "active" | "expired") => setStatusFilter(value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
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
              {filteredMemberships.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground">
                    {showCancelledOnly ? "No cancelled memberships found" : "No user memberships found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredMemberships.map((um) => {
                  const computedStatus = getComputedStatus(um);
                  return (
                  <TableRow 
                    key={um.id}
                  >
                    <TableCell className="font-medium">
                      {um.profiles?.full_name || "Unknown User"}
                    </TableCell>
                    <TableCell>
                      {userEmails[um.user_id] || "N/A"}
                    </TableCell>
                    <TableCell>{um.memberships?.name || "Unknown"}</TableCell>
                    <TableCell>{format(new Date(um.start_date), "MMM dd, yyyy")}</TableCell>
                    <TableCell>{format(new Date(um.end_date), "MMM dd, yyyy")}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        computedStatus === 'active' ? 'bg-green-100 text-green-800' :
                        computedStatus === 'expired' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {computedStatus}
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
                );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUserMemberships;

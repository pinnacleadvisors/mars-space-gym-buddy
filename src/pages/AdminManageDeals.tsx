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
  Percent, 
  PoundSterling,
  TrendingUp, 
  Clock, 
  CheckCircle2,
  XCircle,
  BarChart3,
  Users,
  Calendar,
  Award
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
  DialogTrigger,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { couponSchema, type CouponFormData } from "@/lib/validations/coupon";
import { format } from "date-fns";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { showSuccessToast, showErrorToast } from "@/lib/utils/toastHelpers";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface Coupon {
  id: string;
  code: string;
  type: "percentage" | "money_off";
  value: number;
  description: string | null;
  is_active: boolean;
  usage_limit: number | null;
  valid_from: string;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

interface CouponUsage {
  id: string;
  coupon_id: string;
  user_id: string;
  used_at: string;
  order_id: string | null;
  profiles: {
    full_name: string | null;
  } | null;
  coupon_codes: {
    code: string;
    type: "percentage" | "money_off";
    value: number;
  } | null;
}

interface CouponStats {
  total_coupons: number;
  active_coupons: number;
  inactive_coupons: number;
  total_uses: number;
  unique_users: number;
}

interface CouponWithUsage extends Coupon {
  usage_count: number;
}

interface PopularCoupon {
  coupon_id: string;
  code: string;
  type: "percentage" | "money_off";
  value: number;
  usage_count: number;
}

const AdminManageDeals = () => {
  const [coupons, setCoupons] = useState<CouponWithUsage[]>([]);
  const [couponUsage, setCouponUsage] = useState<CouponUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [usageLoading, setUsageLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [stats, setStats] = useState<CouponStats | null>(null);
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);
  const [popularCoupons, setPopularCoupons] = useState<PopularCoupon[]>([]);
  const { toast } = useToast();

  const form = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: "",
      type: "percentage",
      value: 0,
      description: "",
      is_active: true,
      usage_limit: null,
      valid_from: new Date(),
      valid_until: null,
    },
  });

  useEffect(() => {
    fetchCoupons();
    fetchStatistics();
    fetchPopularCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("coupon_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch usage counts for all coupons
      const couponsWithUsage: CouponWithUsage[] = await Promise.all(
        (data || []).map(async (coupon) => {
          const usageCount = await getUsageCount(coupon.id);
          return {
            ...coupon,
            usage_count: usageCount,
          };
        })
      );

      setCoupons(couponsWithUsage);
    } catch (error: any) {
      showErrorToast({
        title: "Error loading coupons",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCouponUsage = async (couponId?: string | null) => {
    try {
      setUsageLoading(true);
      let query = supabase
        .from("coupon_usage")
        .select(`
          *,
          profiles(full_name),
          coupon_codes(code, type, value)
        `)
        .order("used_at", { ascending: false });

      if (couponId) {
        query = query.eq("coupon_id", couponId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCouponUsage(data || []);
    } catch (error: any) {
      showErrorToast({
        title: "Error loading usage",
        description: error.message,
      });
    } finally {
      setUsageLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCouponId) {
      fetchCouponUsage(selectedCouponId);
    } else {
      fetchCouponUsage(); // Fetch all usage
    }
  }, [selectedCouponId]);

  const fetchStatistics = async () => {
    try {
      // Fetch all coupons
      const { data: allCoupons, error: couponsError } = await supabase
        .from("coupon_codes")
        .select("id, is_active");

      if (couponsError) throw couponsError;

      // Fetch all usage
      const { data: allUsage, error: usageError } = await supabase
        .from("coupon_usage")
        .select("user_id");

      if (usageError) throw usageError;

      const activeCoupons = allCoupons?.filter(c => c.is_active).length || 0;
      const inactiveCoupons = allCoupons?.filter(c => !c.is_active).length || 0;
      const uniqueUsers = new Set(allUsage?.map(u => u.user_id) || []).size;

      setStats({
        total_coupons: allCoupons?.length || 0,
        active_coupons: activeCoupons,
        inactive_coupons: inactiveCoupons,
        total_uses: allUsage?.length || 0,
        unique_users: uniqueUsers,
      });
    } catch (error: any) {
      console.error("Error fetching statistics:", error);
    }
  };

  const fetchPopularCoupons = async () => {
    try {
      // Get usage counts grouped by coupon_id
      const { data: usageData, error: usageError } = await supabase
        .from("coupon_usage")
        .select("coupon_id");

      if (usageError) throw usageError;

      // Count usage per coupon
      const usageCounts = new Map<string, number>();
      usageData?.forEach((usage) => {
        usageCounts.set(usage.coupon_id, (usageCounts.get(usage.coupon_id) || 0) + 1);
      });

      // Get top 3 coupon IDs by usage count
      const sortedCouponIds = Array.from(usageCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([couponId]) => couponId);

      if (sortedCouponIds.length === 0) {
        setPopularCoupons([]);
        return;
      }

      // Fetch coupon details for top 3
      const { data: couponData, error: couponError } = await supabase
        .from("coupon_codes")
        .select("id, code, type, value")
        .in("id", sortedCouponIds);

      if (couponError) throw couponError;

      // Map to PopularCoupon format maintaining order
      const popular: PopularCoupon[] = sortedCouponIds
        .map((couponId) => {
          const coupon = couponData?.find((c) => c.id === couponId);
          if (!coupon) return null;
          return {
            coupon_id: couponId,
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            usage_count: usageCounts.get(couponId) || 0,
          };
        })
        .filter((c): c is PopularCoupon => c !== null);

      setPopularCoupons(popular);
    } catch (error: any) {
      console.error("Error fetching popular coupons:", error);
    }
  };

  const resetForm = () => {
    form.reset({
      code: "",
      type: "percentage",
      value: 0,
      description: "",
      is_active: true,
      usage_limit: null,
      valid_from: new Date(),
      valid_until: null,
    });
    setEditingCoupon(null);
  };

  const handleSubmit = async (data: CouponFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showErrorToast({
          title: "Error",
          description: "You must be logged in to create coupons",
        });
        return;
      }

      const couponData = {
        code: data.code.toUpperCase(),
        type: data.type,
        value: data.value,
        description: data.description || null,
        is_active: data.is_active,
        usage_limit: data.usage_limit || null,
        valid_from: data.valid_from.toISOString(),
        valid_until: data.valid_until ? data.valid_until.toISOString() : null,
        created_by: user.id,
      };

      if (editingCoupon) {
        const { error } = await supabase
          .from("coupon_codes")
          .update(couponData)
          .eq("id", editingCoupon.id);

        if (error) throw error;

        showSuccessToast("Coupon updated successfully");
      } else {
        const { error } = await supabase
          .from("coupon_codes")
          .insert([couponData]);

        if (error) throw error;

        showSuccessToast("Coupon created successfully");
      }

      setDialogOpen(false);
      resetForm();
      await fetchCoupons();
      await fetchStatistics();
      await fetchPopularCoupons();
    } catch (error: any) {
      showErrorToast({
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    form.reset({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      description: coupon.description || "",
      is_active: coupon.is_active,
      usage_limit: coupon.usage_limit,
      valid_from: new Date(coupon.valid_from),
      valid_until: coupon.valid_until ? new Date(coupon.valid_until) : null,
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (coupon: Coupon) => {
    setCouponToDelete(coupon);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!couponToDelete) return;

    try {
      const { error } = await supabase
        .from("coupon_codes")
        .delete()
        .eq("id", couponToDelete.id);

      if (error) throw error;

      showSuccessToast("Coupon deleted successfully");
      setDeleteDialogOpen(false);
      const deletedId = couponToDelete.id;
      setCouponToDelete(null);
      if (selectedCouponId === deletedId) {
        setSelectedCouponId(null);
      }
      await fetchCoupons();
      await fetchStatistics();
      await fetchPopularCoupons();
    } catch (error: any) {
      showErrorToast({
        title: "Error",
        description: error.message,
      });
    }
  };

  const getUsageCount = async (couponId: string): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from("coupon_usage")
        .select("*", { count: "exact", head: true })
        .eq("coupon_id", couponId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error("Error fetching usage count:", error);
      return 0;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading coupons..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Deals & Referrals</h1>
          <p className="text-muted-foreground mt-1">
            Manage discount and referral coupon codes
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCoupon ? "Edit Coupon" : "Add New Coupon"}
              </DialogTitle>
              <DialogDescription>
                {editingCoupon
                  ? "Update coupon code details"
                  : "Create a new discount or referral coupon code"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Coupon Code *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., WELCOME15"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                        </FormControl>
                        <FormDescription>
                          Uppercase letters, numbers, hyphens, and underscores only
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage Off</SelectItem>
                            <SelectItem value="money_off">Money Off</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {form.watch("type") === "percentage" ? "Percentage (%)" : "Amount (£)"} *
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step={form.watch("type") === "percentage" ? "1" : "0.01"}
                          placeholder={form.watch("type") === "percentage" ? "e.g., 15" : "e.g., 15.00"}
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        {form.watch("type") === "percentage"
                          ? "Enter a value between 0 and 100"
                          : "Enter the discount amount in pounds"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., Welcome discount for new members"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional description of the coupon
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="valid_from"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valid From *</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            {...field}
                            value={field.value ? format(new Date(field.value), "yyyy-MM-dd'T'HH:mm") : ""}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="valid_until"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valid Until</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            {...field}
                            value={field.value ? format(new Date(field.value), "yyyy-MM-dd'T'HH:mm") : ""}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormDescription>
                          Leave empty for no expiration
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="usage_limit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Usage Limit</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Unlimited"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum number of times this coupon can be used (leave empty for unlimited)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-col justify-end">
                        <div className="flex items-center space-x-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>Active</FormLabel>
                        </div>
                        <FormDescription>
                          Inactive coupons cannot be used
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingCoupon ? "Update" : "Create"} Coupon
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="coupons" className="space-y-6">
        <TabsList>
          <TabsTrigger value="coupons">Coupon Codes</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="usage">Usage History</TabsTrigger>
        </TabsList>

        {/* Coupon Codes Tab */}
        <TabsContent value="coupons">
          <Card>
            <CardHeader>
              <CardTitle>Coupon Codes</CardTitle>
              <CardDescription>
                Manage all discount and referral coupon codes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {coupons.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No coupons found</p>
                  <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Coupon
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Usage</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Valid From</TableHead>
                        <TableHead>Valid Until</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coupons.map((coupon) => {
                        const isExpired = coupon.valid_until && new Date(coupon.valid_until) < new Date();
                        const isNotStarted = new Date(coupon.valid_from) > new Date();
                        const isAtLimit = coupon.usage_limit && coupon.usage_count >= coupon.usage_limit;
                        
                        return (
                          <TableRow 
                            key={coupon.id}
                            className={selectedCouponId === coupon.id ? "bg-muted/50" : ""}
                            onClick={() => {
                              setSelectedCouponId(selectedCouponId === coupon.id ? null : coupon.id);
                            }}
                          >
                            <TableCell className="font-mono font-medium">
                              {coupon.code}
                            </TableCell>
                            <TableCell>
                              <Badge variant={coupon.type === "percentage" ? "default" : "secondary"}>
                                {coupon.type === "percentage" ? (
                                  <Percent className="w-3 h-3 mr-1" />
                                ) : (
                                  <PoundSterling className="w-3 h-3 mr-1" />
                                )}
                                {coupon.type === "percentage" ? `${coupon.value}%` : `£${coupon.value.toFixed(2)}`}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {coupon.type === "percentage" 
                                ? `${coupon.value}% off`
                                : `£${coupon.value.toFixed(2)} off`}
                            </TableCell>
                            <TableCell>
                              {coupon.usage_count} / {coupon.usage_limit || "∞"}
                            </TableCell>
                            <TableCell>
                              {!coupon.is_active ? (
                                <Badge variant="destructive">Inactive</Badge>
                              ) : isExpired ? (
                                <Badge variant="destructive">Expired</Badge>
                              ) : isNotStarted ? (
                                <Badge variant="secondary">Not Started</Badge>
                              ) : isAtLimit ? (
                                <Badge variant="destructive">Limit Reached</Badge>
                              ) : (
                                <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {format(new Date(coupon.valid_from), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell>
                              {coupon.valid_until 
                                ? format(new Date(coupon.valid_until), "MMM d, yyyy")
                                : "No expiration"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(coupon);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteClick(coupon);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Total Coupons</span>
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div className="text-2xl font-bold">
                  {stats?.total_coupons || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  All coupon codes
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
                  {stats?.active_coupons || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Currently active
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Inactive</span>
                  <XCircle className="w-5 h-5 text-destructive" />
                </div>
                <div className="text-2xl font-bold">
                  {stats?.inactive_coupons || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Disabled coupons
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Total Uses</span>
                  <TrendingUp className="w-5 h-5 text-accent" />
                </div>
                <div className="text-2xl font-bold">
                  {stats?.total_uses || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  All time uses
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Unique Users</span>
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="text-2xl font-bold">
                  {stats?.unique_users || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Users who used coupons
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Most Popular Coupon Codes Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Most Popular Coupon Codes
              </CardTitle>
              <CardDescription>
                Top 3 most used coupon codes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {popularCoupons.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No coupon usage data available yet
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {popularCoupons.map((coupon, index) => (
                    <div
                      key={coupon.coupon_id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-mono font-semibold text-lg">
                            {coupon.code}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={coupon.type === "percentage" ? "default" : "secondary"}>
                              {coupon.type === "percentage" ? (
                                <Percent className="w-3 h-3 mr-1" />
                              ) : (
                                <PoundSterling className="w-3 h-3 mr-1" />
                              )}
                              {coupon.type === "percentage" 
                                ? `${coupon.value}% off`
                                : `£${coupon.value.toFixed(2)} off`}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {coupon.usage_count}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {coupon.usage_count === 1 ? "use" : "uses"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage History Tab */}
        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Usage History
              </CardTitle>
              <CardDescription>
                {selectedCouponId 
                  ? `Usage history for selected coupon`
                  : "View all coupon usage across all codes (click a coupon row to filter)"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usageLoading ? (
                <LoadingSpinner size="md" text="Loading usage history..." />
              ) : couponUsage.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {selectedCouponId 
                      ? "No usage found for this coupon"
                      : "No coupon usage found. Click a coupon row above to view its usage history."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Coupon Code</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead>Used At</TableHead>
                        <TableHead>Order ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {couponUsage.map((usage) => (
                        <TableRow key={usage.id}>
                          <TableCell className="font-mono font-medium">
                            {usage.coupon_codes?.code || "N/A"}
                          </TableCell>
                          <TableCell>
                            {usage.profiles?.full_name || "Unknown User"}
                          </TableCell>
                          <TableCell>
                            {usage.coupon_codes?.type === "percentage"
                              ? `${usage.coupon_codes.value}% off`
                              : `£${usage.coupon_codes?.value.toFixed(2)} off`}
                          </TableCell>
                          <TableCell>
                            {format(new Date(usage.used_at), "MMM d, yyyy 'at' h:mm a")}
                          </TableCell>
                          <TableCell>
                            {usage.order_id || "-"}
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
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Coupon</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete coupon "{couponToDelete?.code}"? This action cannot be undone.
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

export default AdminManageDeals;


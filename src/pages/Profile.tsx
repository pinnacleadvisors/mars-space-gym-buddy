"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Users, 
  CreditCard, 
  BookOpen,
  Upload,
  Save,
  Edit,
  X,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { showErrorToast, showSuccessToast } from "@/lib/utils/toastHelpers";
import { sanitizeString, sanitizeEmail } from "@/lib/utils/sanitize";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Profile update schema
const profileSchema = z.object({
  full_name: z.string().min(1, "Full name is required").max(100, "Name is too long"),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  date_of_birth: z.string().optional().or(z.literal("")),
  emergency_contact: z.string().optional().or(z.literal("")),
  emergency_contact_phone: z.string().optional().or(z.literal("")),
  health_notes: z.string().optional().or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface Membership {
  id: string;
  status: string;
  start_date: string;
  end_date: string;
  payment_status: string;
  created_at: string;
  memberships?: {
    name: string;
    price: number;
  };
}

interface Booking {
  id: string;
  status: string;
  created_at: string;
  class_sessions?: {
    id: string;
    name: string;
    instructor: string;
    start_time: string;
    end_time: string;
  };
}

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: "",
      phone: "",
      address: "",
      date_of_birth: "",
      emergency_contact: "",
      emergency_contact_phone: "",
      health_notes: "",
    },
  });

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        navigate("/login");
        return;
      }

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Set form values
      if (profileData) {
        form.reset({
          full_name: profileData.full_name || "",
          phone: profileData.phone || "",
          address: profileData.address || "",
          date_of_birth: profileData.date_of_birth || "",
          emergency_contact: profileData.emergency_contact || "",
          emergency_contact_phone: profileData.emergency_contact_phone || "",
          health_notes: profileData.health_notes || "",
        });
      }

      // Fetch membership history
      const { data: membershipData, error: membershipError } = await supabase
        .from("user_memberships")
        .select("*, memberships(name, price)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (membershipError) throw membershipError;
      setMemberships(membershipData || []);

      // Fetch booking history
      const { data: bookingData, error: bookingError } = await supabase
        .from("class_bookings")
        .select("*, class_sessions(id, name, instructor, start_time, end_time)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (bookingError) throw bookingError;
      setBookings(bookingData || []);
    } catch (error: any) {
      console.error("Error fetching profile data:", error);
      showErrorToast({
        title: "Error loading profile",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: ProfileFormData) => {
    try {
      setSaving(true);
      
      if (!user) return;

      // Sanitize inputs
      const sanitizedData = {
        full_name: sanitizeString(data.full_name),
        phone: data.phone ? sanitizeString(data.phone) : null,
        address: data.address ? sanitizeString(data.address) : null,
        date_of_birth: data.date_of_birth || null,
        emergency_contact: data.emergency_contact ? sanitizeString(data.emergency_contact) : null,
        emergency_contact_phone: data.emergency_contact_phone ? sanitizeString(data.emergency_contact_phone) : null,
        health_notes: data.health_notes ? sanitizeString(data.health_notes) : null,
      };

      const { error } = await supabase
        .from("profiles")
        .update(sanitizedData)
        .eq("id", user.id);

      if (error) throw error;

      showSuccessToast("Profile updated successfully!");
      setIsEditing(false);
      await fetchProfileData();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      showErrorToast({
        title: "Error updating profile",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file || !user) return;

      // Validate file type
      if (!file.type.startsWith("image/")) {
        showErrorToast({
          title: "Invalid file type",
          description: "Please upload an image file.",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showErrorToast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB.",
        });
        return;
      }

      setUploading(true);

      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      showSuccessToast("Profile picture updated successfully!");
      await fetchProfileData();
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      showErrorToast({
        title: "Error uploading picture",
        description: error.message,
      });
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = "";
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">My Profile</h1>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="memberships">Membership History</TabsTrigger>
            <TabsTrigger value="bookings">Booking History</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Manage your personal information</CardDescription>
                  </div>
                  {!isEditing && (
                    <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-6">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={profile?.avatar_url} alt={profile?.full_name || "User"} />
                    <AvatarFallback className="text-2xl">
                      {getInitials(profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Label htmlFor="avatar-upload" className="cursor-pointer">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        disabled={uploading}
                      >
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          {uploading ? "Uploading..." : "Upload Photo"}
                        </span>
                      </Button>
                    </Label>
                    <Input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={uploading}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      JPG, PNG or GIF. Max size 5MB
                    </p>
                  </div>
                </div>

                {/* Profile Form */}
                {isEditing ? (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="full_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input type="tel" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="date_of_birth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date of Birth</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={2} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="emergency_contact"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Emergency Contact Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="emergency_contact_phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Emergency Contact Phone</FormLabel>
                              <FormControl>
                                <Input type="tel" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="health_notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Health Notes</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={4} placeholder="Any health conditions or notes..." />
                            </FormControl>
                            <FormDescription>
                              This information is kept confidential and only used for your safety.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-2">
                        <Button type="submit" disabled={saving}>
                          <Save className="w-4 h-4 mr-2" />
                          {saving ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false);
                            form.reset();
                          }}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">Email</Label>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <p className="font-medium">{user?.email}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">Full Name</Label>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <p className="font-medium">{profile?.full_name || "Not set"}</p>
                        </div>
                      </div>
                      {profile?.phone && (
                        <div className="space-y-1">
                          <Label className="text-muted-foreground">Phone</Label>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <p className="font-medium">{profile.phone}</p>
                          </div>
                        </div>
                      )}
                      {profile?.date_of_birth && (
                        <div className="space-y-1">
                          <Label className="text-muted-foreground">Date of Birth</Label>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <p className="font-medium">
                              {format(new Date(profile.date_of_birth), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                      )}
                      {profile?.address && (
                        <div className="space-y-1 md:col-span-2">
                          <Label className="text-muted-foreground">Address</Label>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <p className="font-medium">{profile.address}</p>
                          </div>
                        </div>
                      )}
                      {profile?.emergency_contact && (
                        <div className="space-y-1">
                          <Label className="text-muted-foreground">Emergency Contact</Label>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <p className="font-medium">{profile.emergency_contact}</p>
                            {profile.emergency_contact_phone && (
                              <span className="text-sm text-muted-foreground">
                                ({profile.emergency_contact_phone})
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      {profile?.health_notes && (
                        <div className="space-y-1 md:col-span-2">
                          <Label className="text-muted-foreground">Health Notes</Label>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {profile.health_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Membership History Tab */}
          <TabsContent value="memberships">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Membership History
                </CardTitle>
                <CardDescription>View your membership subscription history</CardDescription>
              </CardHeader>
              <CardContent>
                {memberships.length > 0 ? (
                  <div className="space-y-4">
                    {memberships.map((membership) => {
                      const isActive = 
                        membership.status === "active" &&
                        membership.payment_status === "paid" &&
                        new Date(membership.end_date) > new Date();
                      const isExpired = new Date(membership.end_date) < new Date();

                      return (
                        <div
                          key={membership.id}
                          className="p-4 rounded-lg border bg-muted/30 flex items-start justify-between"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium">
                                {membership.memberships?.name || "Membership"}
                              </h3>
                              <Badge
                                variant={
                                  isActive
                                    ? "default"
                                    : isExpired
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {isActive ? (
                                  <><CheckCircle2 className="w-3 h-3 mr-1" /> Active</>
                                ) : isExpired ? (
                                  <><XCircle className="w-3 h-3 mr-1" /> Expired</>
                                ) : (
                                  <><Clock className="w-3 h-3 mr-1" /> {membership.status}</>
                                )}
                              </Badge>
                            </div>
                            <div className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                              <p>
                                <span className="font-medium">Start:</span>{" "}
                                {format(new Date(membership.start_date), "MMM d, yyyy")}
                              </p>
                              <p>
                                <span className="font-medium">End:</span>{" "}
                                {format(new Date(membership.end_date), "MMM d, yyyy")}
                              </p>
                              <p>
                                <span className="font-medium">Price:</span> £
                                {membership.memberships?.price?.toFixed(2) || "N/A"}
                              </p>
                              <p>
                                <span className="font-medium">Payment:</span> {membership.payment_status}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No membership history</p>
                    <Button onClick={() => navigate("/managememberships")} variant="outline">
                      View Membership Plans
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Booking History Tab */}
          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Booking History
                </CardTitle>
                <CardDescription>View your class booking history</CardDescription>
              </CardHeader>
              <CardContent>
                {bookings.length > 0 ? (
                  <div className="space-y-3">
                    {bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="p-4 rounded-lg border bg-muted/30 flex items-start justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">
                              {booking.class_sessions?.name || "Class"}
                            </h3>
                            <Badge
                              variant={
                                booking.status === "attended"
                                  ? "default"
                                  : booking.status === "cancelled"
                                  ? "destructive"
                                  : booking.status === "booked"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {booking.status}
                            </Badge>
                          </div>
                          {booking.class_sessions && (
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>
                                <span className="font-medium">Instructor:</span>{" "}
                                {booking.class_sessions.instructor}
                              </p>
                              <p>
                                <span className="font-medium">Date:</span>{" "}
                                {format(
                                  new Date(booking.class_sessions.start_time),
                                  "MMM d, yyyy 'at' h:mm a"
                                )}
                              </p>
                              <p>
                                <span className="font-medium">Booked:</span>{" "}
                                {format(new Date(booking.created_at), "MMM d, yyyy")}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No booking history</p>
                    <Button onClick={() => navigate("/classes")} variant="outline">
                      Browse Classes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;


"use client";

import { useState, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useClasses, useCreateClass, useUpdateClass, useDeleteClass, type Class } from "@/hooks/queries/useClasses";
import { useSessions, useSessionCapacities, useCreateSessions, useUpdateSession, useDeleteSession, useUpdateSessionCapacity, type ClassSession, type SessionCapacity } from "@/hooks/queries/useSessions";
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, type ClassCategory } from "@/hooks/queries/useCategories";
import { useInstructors, type Instructor } from "@/hooks/queries/useInstructors";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2, 
  CalendarIcon, 
  Repeat, 
  Users, 
  UserPlus,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Edit,
  Search,
  Filter
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, addDays, addWeeks, addMonths, startOfWeek, nextDay, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { showErrorToast, showSuccessToast } from "@/lib/utils/toastHelpers";
import { AdminCalendarView } from "@/components/calendar/AdminCalendarView";
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
import { categorySchema, type CategoryFormData } from "@/lib/validations/class";
import { uploadCategoryImage, uploadClassImage, deleteImage } from "@/lib/utils/imageUpload";
import { Upload, X, Image as ImageIcon } from "lucide-react";

// Form validation schemas
const classSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string().optional(),
  instructor: z.string().min(1, "Instructor is required").max(100, "Instructor name is too long"),
  schedule: z.string().optional(),
  duration: z.number().min(1, "Duration must be at least 1 minute").max(480, "Duration cannot exceed 8 hours"),
  capacity: z.number().min(1, "Capacity must be at least 1").max(1000, "Capacity cannot exceed 1000"),
  category: z.string().optional(),
  category_id: z.string().uuid("Invalid category ID").optional().nullable(),
  image_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  is_active: z.boolean(),
});

const sessionSchema = z.object({
  startDate: z.date({ required_error: "Start date is required" }),
  startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  capacity: z.number().min(1, "Capacity must be at least 1").max(1000, "Capacity cannot exceed 1000"),
  recurring: z.boolean(),
  recurringType: z.enum(["daily", "weekly", "monthly"]),
  recurringCount: z.number().min(1, "Must create at least 1 session").max(52, "Cannot create more than 52 sessions"),
});

type ClassFormData = z.infer<typeof classSchema>;
type SessionFormData = z.infer<typeof sessionSchema>;

const AdminManageClasses = () => {
  const { toast } = useToast();
  
  // React Query hooks for data fetching
  const { data: classes = [], isLoading: loading } = useClasses();
  const { data: sessions = [], isLoading: sessionsLoading } = useSessions(100);
  const { data: instructors = [] } = useInstructors();
  const { data: classCategories = [], isLoading: categoriesLoading } = useCategories();
  
  // Get session IDs for capacity query
  const sessionIds = useMemo(() => sessions.map(s => s.id), [sessions]);
  const { data: sessionCapacitiesMap = new Map<string, SessionCapacity>() } = useSessionCapacities(sessionIds);
  
  // Mutations
  const createClassMutation = useCreateClass();
  const updateClassMutation = useUpdateClass();
  const deleteClassMutation = useDeleteClass();
  const createSessionsMutation = useCreateSessions();
  const updateSessionMutation = useUpdateSession();
  const deleteSessionMutation = useDeleteSession();
  const updateSessionCapacityMutation = useUpdateSessionCapacity();
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();
  
  // UI state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [sessionEditDialogOpen, setSessionEditDialogOpen] = useState(false);
  const [capacityDialogOpen, setCapacityDialogOpen] = useState(false);
  const [instructorDialogOpen, setInstructorDialogOpen] = useState(false);
  const [classSelectDialogOpen, setClassSelectDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [editingSession, setEditingSession] = useState<ClassSession | null>(null);
  const [selectedClassForSession, setSelectedClassForSession] = useState<Class | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [instructorFilter, setInstructorFilter] = useState<string>("all");
  const [sessionInstructorFilter, setSessionInstructorFilter] = useState<string>("all");
  const [sessionClassFilter, setSessionClassFilter] = useState<string>("all");
  const [sessionCategoryFilter, setSessionCategoryFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"classes" | "sessions" | "instructors" | "calendar" | "categories">("classes");
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ClassCategory | null>(null);
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null);
  const [categoryImagePreview, setCategoryImagePreview] = useState<string | null>(null);
  const [uploadingCategoryImage, setUploadingCategoryImage] = useState(false);
  const [classImageFile, setClassImageFile] = useState<File | null>(null);
  const [classImagePreview, setClassImagePreview] = useState<string | null>(null);
  const [uploadingClassImage, setUploadingClassImage] = useState(false);

  const classForm = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      name: "",
      description: "",
      instructor: "",
      schedule: "",
      duration: 60,
      capacity: 20,
      category: "",
      image_url: "",
      is_active: true,
    },
  });

  const sessionForm = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      startDate: new Date(),
      startTime: "09:00",
      endTime: "10:00",
      capacity: 20,
      recurring: false,
      recurringType: "weekly",
      recurringCount: 1,
    },
  });

  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      image_url: "",
      is_active: true,
      display_order: 0,
    },
  });

  // Session capacities are now fetched via RPC function in useSessionCapacities hook

  const handleCategoryImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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

    setCategoryImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setCategoryImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCategorySubmit = async (data: CategoryFormData) => {
    try {
      let imageUrl = data.image_url || "";

      // Upload new image if provided (only for editing existing categories)
      if (categoryImageFile && editingCategory) {
        setUploadingCategoryImage(true);
        imageUrl = await uploadCategoryImage(categoryImageFile, editingCategory.id);
      }
      // For new categories, we'll upload the image after creation with the real ID

      if (editingCategory) {
        // Delete old image if new one is uploaded
        if (categoryImageFile && editingCategory.image_url) {
          await deleteImage(editingCategory.image_url, "category-images");
        }

        await updateCategoryMutation.mutateAsync({
          id: editingCategory.id,
          ...data,
          image_url: imageUrl || null,
        });
      } else {
        // Create new category first (without image if we have a file to upload)
        const newCategory = await createCategoryMutation.mutateAsync({
          ...data,
          image_url: categoryImageFile ? null : (imageUrl || null), // Only set image_url if no file to upload
        });

        // If we have an image file, upload it with the real category ID and update
        if (categoryImageFile && newCategory && newCategory.id) {
          setUploadingCategoryImage(true);
          try {
            const realImageUrl = await uploadCategoryImage(categoryImageFile, newCategory.id);
            await updateCategoryMutation.mutateAsync({
              id: newCategory.id,
              image_url: realImageUrl,
            });
          } finally {
            setUploadingCategoryImage(false);
          }
        }
      }

      setCategoryDialogOpen(false);
      categoryForm.reset();
      setEditingCategory(null);
      setCategoryImageFile(null);
      setCategoryImagePreview(null);
    } catch (error: any) {
      // Error handling is done in mutation hooks
    } finally {
      setUploadingCategoryImage(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    // Check if category is used by any classes
    const { data: classesUsingCategory, error: checkError } = await supabase
      .from("classes")
      .select("id, name")
      .eq("category_id", id)
      .limit(1);

    if (checkError) {
      showErrorToast({
        title: "Error",
        description: checkError.message,
      });
      return;
    }

    if (classesUsingCategory && classesUsingCategory.length > 0) {
      showErrorToast({
        title: "Cannot delete category",
        description: `This category is used by ${classesUsingCategory.length} class(es). Please remove the category from all classes first.`,
      });
      return;
    }

    if (!confirm("Are you sure you want to delete this category? This action cannot be undone.")) return;

    try {
      // Get category to delete image
      const category = classCategories.find((c) => c.id === id);
      if (category?.image_url) {
        await deleteImage(category.image_url, "category-images");
      }

      await deleteCategoryMutation.mutateAsync(id);
    } catch (error: any) {
      // Error handling is done in mutation hook
    }
  };

  const handleEditCategory = (category: ClassCategory) => {
    setEditingCategory(category);
    categoryForm.reset({
      name: category.name,
      description: category.description || "",
      image_url: category.image_url || "",
      is_active: category.is_active,
      display_order: category.display_order,
    });
    setCategoryImagePreview(category.image_url || null);
    setCategoryImageFile(null);
    setCategoryDialogOpen(true);
  };

  const filteredClasses = useMemo(() => {
    return classes.filter((classItem) => {
      const matchesSearch =
        debouncedSearchQuery === "" ||
        classItem.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        classItem.instructor.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        classItem.category?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());

      const matchesCategory = categoryFilter === "all" || classItem.category === categoryFilter;
      const matchesInstructor = instructorFilter === "all" || classItem.instructor === instructorFilter;

      return matchesSearch && matchesCategory && matchesInstructor;
    });
  }, [classes, debouncedSearchQuery, categoryFilter, instructorFilter]);

  const categoryNames = useMemo(() => {
    const cats = new Set<string>();
    classes.forEach((c) => {
      if (c.category) cats.add(c.category);
    });
    return Array.from(cats).sort();
  }, [classes]);

  // Filter sessions for calendar and sessions tab
  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const matchesInstructor = sessionInstructorFilter === "all" || session.instructor === sessionInstructorFilter;
      const matchesClass = sessionClassFilter === "all" || session.classes?.name === sessionClassFilter;
      const matchesCategory = sessionCategoryFilter === "all" || (session.classes as any)?.category === sessionCategoryFilter || (session.classes as any)?.category_id === sessionCategoryFilter;
      return matchesInstructor && matchesClass && matchesCategory;
    });
  }, [sessions, sessionInstructorFilter, sessionClassFilter, sessionCategoryFilter]);

  // Get unique session instructors
  const sessionInstructors = useMemo(() => {
    const unique = Array.from(new Set(sessions.map(s => s.instructor).filter(Boolean)));
    return unique.sort();
  }, [sessions]);

  // Get unique session class names
  const sessionClassNames = useMemo(() => {
    const unique = Array.from(new Set(sessions.map(s => s.classes?.name).filter(Boolean)));
    return unique.sort();
  }, [sessions]);

  // Get unique session categories
  const sessionCategories = useMemo(() => {
    const unique = Array.from(new Set(sessions.map(s => (s.classes as any)?.category || (s.classes as any)?.category_id).filter(Boolean)));
    return unique.sort();
  }, [sessions]);

  const handleClassSubmit = async (data: ClassFormData) => {
    try {
      let imageUrl = data.image_url || "";

      // Upload new image if provided
      if (classImageFile && editingClass) {
        setUploadingClassImage(true);
        imageUrl = await uploadClassImage(classImageFile, editingClass.id);
      } else if (classImageFile && !editingClass) {
        // For new classes, we need to create the class first to get an ID
        // So we'll handle this after creation
        const tempId = `temp-${Date.now()}`;
        setUploadingClassImage(true);
        imageUrl = await uploadClassImage(classImageFile, tempId);
      }

      if (editingClass) {
        // Delete old image if new one is uploaded
        if (classImageFile && editingClass.image_url) {
          await deleteImage(editingClass.image_url, "class-images");
        }

        await updateClassMutation.mutateAsync({
          id: editingClass.id,
          ...data,
          image_url: imageUrl || null,
        });
      } else {
        // Create new class
        const newClass = await createClassMutation.mutateAsync({
          ...data,
          image_url: imageUrl || null,
        });

        // If we uploaded with temp ID, re-upload with real ID
        if (classImageFile && newClass && newClass.id) {
          const realImageUrl = await uploadClassImage(classImageFile, newClass.id);
          await updateClassMutation.mutateAsync({
            id: newClass.id,
            image_url: realImageUrl,
          });
        }
      }

      setDialogOpen(false);
      classForm.reset();
      setEditingClass(null);
      setClassImageFile(null);
      setClassImagePreview(null);
    } catch (error: any) {
      // Error handling is done in mutation hooks
    } finally {
      setUploadingClassImage(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this class? This will not delete associated sessions.")) return;

    try {
      await deleteClassMutation.mutateAsync(id);
    } catch (error: any) {
      // Error handling is done in mutation hook
    }
  };

  const handleEdit = (classItem: Class) => {
    setEditingClass(classItem);
    classForm.reset({
      name: classItem.name,
      description: classItem.description || "",
      instructor: classItem.instructor,
      schedule: classItem.schedule,
      duration: classItem.duration,
      capacity: classItem.capacity,
      category: classItem.category || "",
      category_id: classItem.category_id || null,
      image_url: classItem.image_url || "",
      is_active: classItem.is_active,
    });
    setClassImagePreview(classItem.image_url || null);
    setClassImageFile(null);
    setDialogOpen(true);
  };

  const handleCreateSession = (classItem: Class) => {
    setSelectedClassForSession(classItem);
    const duration = classItem.duration || 60;
    const startDate = new Date();
    startDate.setHours(9, 0, 0);
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + duration);
    
    sessionForm.reset({
      startDate,
      startTime: "09:00",
      endTime: format(endDate, "HH:mm"),
      capacity: classItem.capacity,
      recurring: false,
      recurringType: "weekly",
      recurringCount: 1,
    });
    setSessionDialogOpen(true);
  };

  const handleAddSessionClick = () => {
    if (classes.length === 0) {
      showErrorToast({
        title: "No Classes Available",
        description: "Please create a class first before adding sessions.",
      });
      return;
    }
    
    if (classes.length === 1) {
      // If only one class, directly open session creation dialog
      handleCreateSession(classes[0]);
    } else {
      // If multiple classes, show a dialog to select one
      setClassSelectDialogOpen(true);
    }
  };

  const handleClassSelectForSession = (classId: string) => {
    const selectedClass = classes.find(c => c.id === classId);
    if (selectedClass) {
      setClassSelectDialogOpen(false);
      handleCreateSession(selectedClass);
    }
  };

  const handleSessionSubmit = async (data: SessionFormData) => {
    if (!selectedClassForSession) return;

    try {
      const sessionsToCreate = [];

      if (data.recurring) {
        let currentDate = new Date(data.startDate);
        const startTimeParts = data.startTime.split(":");
        const endTimeParts = data.endTime.split(":");

        for (let i = 0; i < data.recurringCount; i++) {
          const sessionStart = new Date(currentDate);
          sessionStart.setHours(parseInt(startTimeParts[0]), parseInt(startTimeParts[1]), 0);

          const sessionEnd = new Date(currentDate);
          sessionEnd.setHours(parseInt(endTimeParts[0]), parseInt(endTimeParts[1]), 0);

          sessionsToCreate.push({
            class_id: selectedClassForSession.id,
            name: selectedClassForSession.name,
            instructor: selectedClassForSession.instructor,
            start_time: sessionStart.toISOString(),
            end_time: sessionEnd.toISOString(),
            capacity: data.capacity,
          });

          if (data.recurringType === "daily") {
            currentDate = addDays(currentDate, 1);
          } else if (data.recurringType === "weekly") {
            currentDate = addWeeks(currentDate, 1);
          } else if (data.recurringType === "monthly") {
            currentDate = addMonths(currentDate, 1);
          }
        }
      } else {
        const startTimeParts = data.startTime.split(":");
        const endTimeParts = data.endTime.split(":");

        const sessionStart = new Date(data.startDate);
        sessionStart.setHours(parseInt(startTimeParts[0]), parseInt(startTimeParts[1]), 0);

        const sessionEnd = new Date(data.startDate);
        sessionEnd.setHours(parseInt(endTimeParts[0]), parseInt(endTimeParts[1]), 0);

        sessionsToCreate.push({
          class_id: selectedClassForSession.id,
          name: selectedClassForSession.name,
          instructor: selectedClassForSession.instructor,
          start_time: sessionStart.toISOString(),
          end_time: sessionEnd.toISOString(),
          capacity: data.capacity,
        });
      }

      await createSessionsMutation.mutateAsync(sessionsToCreate);

      setSessionDialogOpen(false);
      setSelectedClassForSession(null);
      sessionForm.reset();
    } catch (error: any) {
      // Error handling is done in mutation hook
    }
  };

  const handleUpdateSessionCapacity = async (sessionId: string, newCapacity: number) => {
    try {
      await updateSessionCapacityMutation.mutateAsync({ id: sessionId, capacity: newCapacity });
      setCapacityDialogOpen(false);
      setEditingSession(null);
    } catch (error: any) {
      // Error handling is done in mutation hook
    }
  };

  const handleAddSessionFromCalendar = async (sessionData: Omit<ClassSession, "id" | "created_at">) => {
    try {
      await createSessionsMutation.mutateAsync([sessionData]);
    } catch (error: any) {
      // Error handling is done in mutation hook
      throw error;
    }
  };

  const handleEditSessionFromCalendar = async (sessionId: string, sessionData: Partial<ClassSession>) => {
    try {
      await updateSessionMutation.mutateAsync({ id: sessionId, ...sessionData });
    } catch (error: any) {
      // Error handling is done in mutation hook
      throw error;
    }
  };

  const handleDeleteSessionFromCalendar = async (sessionId: string) => {
    try {
      await deleteSessionMutation.mutateAsync(sessionId);
    } catch (error: any) {
      // Error handling is done in mutation hook
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading classes..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Class Management</h1>
          <p className="text-muted-foreground">Manage classes, sessions, and instructors</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            classForm.reset();
            setEditingClass(null);
            setClassImageFile(null);
            setClassImagePreview(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              classForm.reset();
              setEditingClass(null);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Class
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingClass ? "Edit Class" : "Add New Class"}</DialogTitle>
              <DialogDescription>
                {editingClass ? "Update class details" : "Create a new gym class"}
              </DialogDescription>
            </DialogHeader>
            <Form {...classForm}>
              <form onSubmit={classForm.handleSubmit(handleClassSubmit)} className="space-y-4">
                <FormField
                  control={classForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class Name *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={classForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={classForm.control}
                    name="instructor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instructor *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Instructor name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={classForm.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          value={field.value || "none"}
                          onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {classCategories
                              .filter((cat) => cat.is_active)
                              .map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Or use the legacy category field below
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={classForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category (Legacy - Text Field)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Cardio, Strength (optional if using category dropdown above)" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={classForm.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (minutes) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            min="1"
                            max="480"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={classForm.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacity *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            min="1"
                            max="1000"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Class Image</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

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

                          setClassImageFile(file);

                          // Create preview
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setClassImagePreview(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }}
                        className="cursor-pointer"
                      />
                    </div>
                    {classImagePreview && (
                      <div className="relative">
                        <img
                          src={classImagePreview}
                          alt="Preview"
                          className="w-20 h-20 object-cover rounded-md border"
                          decoding="async"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                          onClick={() => {
                            setClassImageFile(null);
                            setClassImagePreview(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {editingClass && editingClass.image_url && !classImagePreview && (
                    <div className="relative inline-block">
                      <img
                        src={editingClass.image_url}
                        alt="Current"
                        className="w-20 h-20 object-cover rounded-md border"
                      />
                    </div>
                  )}
                  <FormField
                    control={classForm.control}
                    name="image_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL (Alternative)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://example.com/image.jpg (or upload above)" />
                        </FormControl>
                        <FormDescription>
                          Upload an image file above, or paste an image URL here
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={classForm.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel>Active (visible to members)</FormLabel>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      classForm.reset();
                      setEditingClass(null);
                      setClassImageFile(null);
                      setClassImagePreview(null);
                    }}
                    disabled={uploadingClassImage}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={uploadingClassImage}>
                    {uploadingClassImage ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : editingClass ? (
                      "Update Class"
                    ) : (
                      "Create Class"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="instructors">Instructors</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        {/* Classes Tab */}
        <TabsContent value="classes" className="space-y-4">
          {/* Search and Filters */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search classes..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categoryNames.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <Select value={instructorFilter} onValueChange={setInstructorFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Instructor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Instructors</SelectItem>
                    {instructors.map((inst) => (
                      <SelectItem key={inst.name} value={inst.name}>
                        {inst.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Classes ({filteredClasses.length})</CardTitle>
              <CardDescription>Manage your gym's class schedule and create sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredClasses.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No classes found</p>
                  <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Class
                  </Button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredClasses.map((classItem) => (
                    <Card key={classItem.id} className="overflow-hidden">
                      {classItem.image_url && (
                        <div className="h-32 w-full overflow-hidden">
                          <img
                            src={classItem.image_url}
                            alt={classItem.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                      )}
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{classItem.name}</h3>
                            {classItem.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {classItem.description}
                              </p>
                            )}
                          </div>
                          <Badge variant={classItem.is_active ? "default" : "secondary"}>
                            {classItem.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center justify-between">
                            <span>Instructor:</span>
                            <span className="font-medium text-foreground">{classItem.instructor}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Category:</span>
                            <span className="font-medium text-foreground">{classItem.category || "-"}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Duration:</span>
                            <span className="font-medium text-foreground">{classItem.duration} min</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Capacity:</span>
                            <span className="font-medium text-foreground">{classItem.capacity}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(classItem)}
                            className="flex-1"
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCreateSession(classItem)}
                            title="Create Session"
                          >
                            <CalendarIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(classItem.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-4">
          {/* Filters */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <Select value={sessionInstructorFilter} onValueChange={setSessionInstructorFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Instructors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Instructors</SelectItem>
                    {sessionInstructors.map((instructor) => (
                      <SelectItem key={instructor} value={instructor}>
                        {instructor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <Select value={sessionClassFilter} onValueChange={setSessionClassFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {sessionClassNames.map((className) => (
                      <SelectItem key={className} value={className}>
                        {className}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <Select value={sessionCategoryFilter} onValueChange={setSessionCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {sessionCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSessionInstructorFilter("all");
                    setSessionClassFilter("all");
                    setSessionCategoryFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Class Sessions ({filteredSessions.length})</CardTitle>
                  <CardDescription>View and manage class session capacity</CardDescription>
                </div>
                <Button onClick={handleAddSessionClick}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Session
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {sessionsLoading ? (
                <LoadingSpinner size="md" text="Loading sessions..." />
              ) : filteredSessions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No sessions found. Create sessions from classes.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Class Name</TableHead>
                        <TableHead>Instructor</TableHead>
                        <TableHead>Start Time</TableHead>
                        <TableHead>Capacity</TableHead>
                        <TableHead>Booked</TableHead>
                        <TableHead>Available</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSessions.map((session) => {
                        const capacity = sessionCapacitiesMap.get(session.id);
                        return (
                          <TableRow key={session.id}>
                            <TableCell className="font-medium">{session.name}</TableCell>
                            <TableCell>{session.instructor || "-"}</TableCell>
                            <TableCell>{format(parseISO(session.start_time), "MMM d, yyyy 'at' h:mm a")}</TableCell>
                            <TableCell>{session.capacity || 0}</TableCell>
                            <TableCell>
                              <Badge variant={capacity && capacity.booked >= (capacity.capacity * 0.9) ? "destructive" : "secondary"}>
                                {capacity?.booked || 0}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={capacity && capacity.available <= 5 ? "default" : "outline"}>
                                {capacity?.available || 0}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => {
                                    setEditingSession(session);
                                    setCapacityDialogOpen(true);
                                  }}
                                  title="Edit Capacity"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => {
                                    setEditingSession(session);
                                    setSessionEditDialogOpen(true);
                                  }}
                                  title="Edit Session"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={async () => {
                                    if (confirm(`Are you sure you want to delete the session "${session.name}"? This action cannot be undone.`)) {
                                      try {
                                        await handleDeleteSessionFromCalendar(session.id);
                                      } catch (error) {
                                        // Error already handled in handler
                                      }
                                    }
                                  }}
                                  title="Delete Session"
                                >
                                  <Trash2 className="w-4 h-4" />
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

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-4">
          {/* Filters */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <Select value={sessionInstructorFilter} onValueChange={setSessionInstructorFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Instructors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Instructors</SelectItem>
                    {sessionInstructors.map((instructor) => (
                      <SelectItem key={instructor} value={instructor}>
                        {instructor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <Select value={sessionClassFilter} onValueChange={setSessionClassFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {sessionClassNames.map((className) => (
                      <SelectItem key={className} value={className}>
                        {className}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <Select value={sessionCategoryFilter} onValueChange={setSessionCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {sessionCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSessionInstructorFilter("all");
                    setSessionClassFilter("all");
                    setSessionCategoryFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Session Calendar</CardTitle>
              <CardDescription>View and manage class sessions in calendar format</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminCalendarView
                sessions={filteredSessions}
                classes={classes}
                onAddSession={handleAddSessionFromCalendar}
                onEditSession={handleEditSessionFromCalendar}
                onDeleteSession={handleDeleteSessionFromCalendar}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Instructors Tab */}
        <TabsContent value="instructors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Instructors</CardTitle>
              <CardDescription>View instructor statistics and assignments</CardDescription>
            </CardHeader>
            <CardContent>
              {instructors.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No instructors found. Add instructors when creating classes.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {instructors.map((instructor) => (
                    <Card key={instructor.name}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-lg">{instructor.name}</h3>
                          <UserPlus className="w-5 h-5 text-primary" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Classes</span>
                            <Badge variant="secondary">{instructor.class_count}</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Sessions</span>
                            <Badge variant="secondary">{instructor.session_count}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Category Management</h2>
              <p className="text-muted-foreground">Manage class categories with images and descriptions</p>
            </div>
            <Dialog
              open={categoryDialogOpen}
              onOpenChange={(open) => {
                setCategoryDialogOpen(open);
                if (!open) {
                  categoryForm.reset();
                  setEditingCategory(null);
                  setCategoryImageFile(null);
                  setCategoryImagePreview(null);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    categoryForm.reset();
                    setEditingCategory(null);
                    setCategoryImageFile(null);
                    setCategoryImagePreview(null);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
                  <DialogDescription>
                    {editingCategory ? "Update category details" : "Create a new class category"}
                  </DialogDescription>
                </DialogHeader>
                <Form {...categoryForm}>
                  <form onSubmit={categoryForm.handleSubmit(handleCategorySubmit)} className="space-y-4">
                    <FormField
                      control={categoryForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category Name *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Combat, Cycle, Mind & Body" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={categoryForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} placeholder="Describe this category..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={categoryForm.control}
                      name="display_order"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Order</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              min="0"
                            />
                          </FormControl>
                          <FormDescription>
                            Lower numbers appear first in the category filter
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-2">
                      <Label>Category Image</Label>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleCategoryImageChange}
                            className="cursor-pointer"
                          />
                        </div>
                        {categoryImagePreview && (
                          <div className="relative">
                            <img
                              src={categoryImagePreview}
                              alt="Preview"
                              className="w-20 h-20 object-cover rounded-md border"
                              decoding="async"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                              onClick={() => {
                                setCategoryImageFile(null);
                                setCategoryImagePreview(null);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      {editingCategory && editingCategory.image_url && !categoryImagePreview && (
                        <div className="relative inline-block">
                          <img
                            src={editingCategory.image_url}
                            alt="Current"
                            className="w-20 h-20 object-cover rounded-md border"
                          />
                        </div>
                      )}
                    </div>
                    <FormField
                      control={categoryForm.control}
                      name="is_active"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel>Active (visible to members)</FormLabel>
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setCategoryDialogOpen(false);
                          categoryForm.reset();
                          setEditingCategory(null);
                          setCategoryImageFile(null);
                          setCategoryImagePreview(null);
                        }}
                        disabled={uploadingCategoryImage}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={uploadingCategoryImage}>
                        {uploadingCategoryImage ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : editingCategory ? (
                          "Update Category"
                        ) : (
                          "Create Category"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
              <CardHeader>
              <CardTitle>All Categories ({classCategories.length})</CardTitle>
              <CardDescription>Manage class categories and their display settings</CardDescription>
            </CardHeader>
            <CardContent>
              {categoriesLoading ? (
                <LoadingSpinner size="md" text="Loading categories..." />
              ) : classCategories.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No categories found</p>
                  <Button onClick={() => setCategoryDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Category
                  </Button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classCategories.map((category) => {
                    const classesUsingCategory = classes.filter((c: any) => c.category_id === category.id).length;
                    return (
                      <Card key={category.id} className="overflow-hidden">
                        {category.image_url && (
                          <div className="h-32 w-full overflow-hidden">
                            <img
                              src={category.image_url}
                              alt={category.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          </div>
                        )}
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{category.name}</h3>
                              {category.description && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {category.description}
                                </p>
                              )}
                            </div>
                            <Badge variant={category.is_active ? "default" : "secondary"}>
                              {category.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                            <span>Order: {category.display_order}</span>
                            <span>{classesUsingCategory} class(es)</span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleEditCategory(category)}
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteCategory(category.id)}
                              disabled={classesUsingCategory > 0}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Session Dialog */}
      <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Class Session{sessionForm.watch("recurring") ? "s" : ""}</DialogTitle>
            <DialogDescription>
              {selectedClassForSession && (
                <>Create session{sessionForm.watch("recurring") ? "s" : ""} for <strong>{selectedClassForSession.name}</strong></>
              )}
            </DialogDescription>
          </DialogHeader>
          <Form {...sessionForm}>
            <form onSubmit={sessionForm.handleSubmit(handleSessionSubmit)} className="space-y-4">
              <FormField
                control={sessionForm.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={sessionForm.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time *</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={sessionForm.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time *</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={sessionForm.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        min="1"
                        max="1000"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={sessionForm.control}
                name="recurring"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="flex items-center gap-2">
                      <Repeat className="w-4 h-4" />
                      Create recurring sessions
                    </FormLabel>
                  </FormItem>
                )}
              />
              {sessionForm.watch("recurring") && (
                <div className="space-y-4 pl-6 border-l-2">
                  <FormField
                    control={sessionForm.control}
                    name="recurringType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Repeat Every</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="daily">Day</SelectItem>
                            <SelectItem value="weekly">Week</SelectItem>
                            <SelectItem value="monthly">Month</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setSessionDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Session{sessionForm.watch("recurring") ? "s" : ""}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Session Dialog */}
      <Dialog open={sessionEditDialogOpen} onOpenChange={(open) => {
        setSessionEditDialogOpen(open);
        if (!open) {
          setEditingSession(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Session</DialogTitle>
            <DialogDescription>
              Update session details
            </DialogDescription>
          </DialogHeader>
          {editingSession && (
            <div className="space-y-4 py-4">
              <div>
                <Label>Session Name</Label>
                <Input
                  id="edit-session-name"
                  defaultValue={editingSession.name}
                  onChange={(e) => {
                    if (editingSession) {
                      setEditingSession({ ...editingSession, name: e.target.value });
                    }
                  }}
                />
              </div>
              <div>
                <Label>Instructor</Label>
                <Input
                  id="edit-session-instructor"
                  defaultValue={editingSession.instructor || ""}
                  onChange={(e) => {
                    if (editingSession) {
                      setEditingSession({ ...editingSession, instructor: e.target.value });
                    }
                  }}
                />
              </div>
              <div>
                <Label>Link to Class Template (Optional)</Label>
                <Select
                  value={editingSession.class_id || "none"}
                  onValueChange={(value) => {
                    if (editingSession) {
                      setEditingSession({ ...editingSession, class_id: value === "none" ? null : value });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !editingSession.start_time && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editingSession.start_time ? format(parseISO(editingSession.start_time), "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editingSession.start_time ? parseISO(editingSession.start_time) : undefined}
                      onSelect={(date) => {
                        if (date && editingSession) {
                          const currentStart = parseISO(editingSession.start_time);
                          const newStart = new Date(date);
                          newStart.setHours(currentStart.getHours(), currentStart.getMinutes(), 0, 0);
                          const duration = parseISO(editingSession.end_time).getTime() - currentStart.getTime();
                          const newEnd = new Date(newStart.getTime() + duration);
                          setEditingSession({
                            ...editingSession,
                            start_time: newStart.toISOString(),
                            end_time: newEnd.toISOString(),
                          });
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    defaultValue={editingSession.start_time ? format(parseISO(editingSession.start_time), "HH:mm") : ""}
                    onChange={(e) => {
                      if (editingSession && e.target.value) {
                        const [hours, minutes] = e.target.value.split(":").map(Number);
                        const startDate = parseISO(editingSession.start_time);
                        startDate.setHours(hours, minutes, 0, 0);
                        const duration = parseISO(editingSession.end_time).getTime() - parseISO(editingSession.start_time).getTime();
                        const newEnd = new Date(startDate.getTime() + duration);
                        setEditingSession({
                          ...editingSession,
                          start_time: startDate.toISOString(),
                          end_time: newEnd.toISOString(),
                        });
                      }
                    }}
                  />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    defaultValue={editingSession.end_time ? format(parseISO(editingSession.end_time), "HH:mm") : ""}
                    onChange={(e) => {
                      if (editingSession && e.target.value) {
                        const [hours, minutes] = e.target.value.split(":").map(Number);
                        const endDate = parseISO(editingSession.end_time);
                        endDate.setHours(hours, minutes, 0, 0);
                        setEditingSession({
                          ...editingSession,
                          end_time: endDate.toISOString(),
                        });
                      }
                    }}
                  />
                </div>
              </div>
              <div>
                <Label>Capacity</Label>
                <Input
                  type="number"
                  min="1"
                  defaultValue={editingSession.capacity || 20}
                  onChange={(e) => {
                    if (editingSession) {
                      setEditingSession({ ...editingSession, capacity: parseInt(e.target.value) || 20 });
                    }
                  }}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSessionEditDialogOpen(false);
                setEditingSession(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (editingSession) {
                  try {
                    await handleEditSessionFromCalendar(editingSession.id, {
                      name: editingSession.name,
                      instructor: editingSession.instructor,
                      start_time: editingSession.start_time,
                      end_time: editingSession.end_time,
                      capacity: editingSession.capacity,
                      class_id: editingSession.class_id,
                    });
                    setSessionEditDialogOpen(false);
                    setEditingSession(null);
                  } catch (error) {
                    // Error already handled
                  }
                }
              }}
            >
              Update Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Capacity Dialog */}
      <Dialog open={capacityDialogOpen} onOpenChange={setCapacityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Session Capacity</DialogTitle>
            <DialogDescription>
              {editingSession && `Update capacity for ${editingSession.name}`}
            </DialogDescription>
          </DialogHeader>
          {editingSession && (
            <div className="space-y-4">
              <div>
                <Label>Current Capacity</Label>
                <Input type="number" value={editingSession.capacity || 0} readOnly />
              </div>
              <div>
                <Label>New Capacity</Label>
                <Input
                  type="number"
                  id="new-capacity"
                  min="1"
                  max="1000"
                  defaultValue={editingSession.capacity || 0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const input = e.target as HTMLInputElement;
                      handleUpdateSessionCapacity(editingSession.id, parseInt(input.value) || 0);
                    }
                  }}
                />
              </div>
              {sessionCapacitiesMap.has(editingSession.id) && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Current Status</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Booked:</span>
                      <span className="font-medium">{sessionCapacitiesMap.get(editingSession.id)?.booked || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Available:</span>
                      <span className="font-medium">{sessionCapacitiesMap.get(editingSession.id)?.available || 0}</span>
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setCapacityDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    const input = document.getElementById("new-capacity") as HTMLInputElement;
                    if (input) {
                      handleUpdateSessionCapacity(editingSession.id, parseInt(input.value) || 0);
                    }
                  }}
                >
                  Update Capacity
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Class Selection Dialog for Add Session */}
      <Dialog open={classSelectDialogOpen} onOpenChange={setClassSelectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select a Class</DialogTitle>
            <DialogDescription>
              Choose which class you want to create a session for
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {classes.filter(c => c.is_active).length > 0 ? (
              classes
                .filter(c => c.is_active)
                .map((classItem) => (
                  <Button
                    key={classItem.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleClassSelectForSession(classItem.id)}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{classItem.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {classItem.instructor} • {classItem.duration} min
                      </span>
                    </div>
                  </Button>
                ))
            ) : (
              classes.map((classItem) => (
                <Button
                  key={classItem.id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleClassSelectForSession(classItem.id)}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{classItem.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {classItem.instructor} • {classItem.duration} min
                    </span>
                  </div>
                </Button>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClassSelectDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminManageClasses;

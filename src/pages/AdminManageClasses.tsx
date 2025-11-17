import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Loader2, CalendarIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Class {
  id: string;
  name: string;
  description: string | null;
  instructor: string;
  schedule: string;
  duration: number;
  capacity: number;
  category: string | null;
  image_url: string | null;
  is_active: boolean;
}

const AdminManageClasses = () => {
  // Auth check is handled by AdminRoute wrapper
  const { toast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [scheduleDate, setScheduleDate] = useState<Date>();
  const [scheduleTime, setScheduleTime] = useState<string>("09:00");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    instructor: "",
    schedule: "",
    duration: 60,
    capacity: 20,
    category: "",
    image_url: "",
    is_active: true,
  });

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClasses(data || []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Combine date and time into schedule string
    const scheduleValue = scheduleDate && scheduleTime
      ? `${format(scheduleDate, "yyyy-MM-dd")} ${scheduleTime}`
      : formData.schedule;

    const submitData = {
      ...formData,
      schedule: scheduleValue,
    };

    try {
      if (editingClass) {
        const { error } = await supabase
          .from("classes")
          .update(submitData)
          .eq("id", editingClass.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Class updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("classes")
          .insert([submitData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Class created successfully",
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchClasses();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this class?")) return;

    try {
      const { error } = await supabase
        .from("classes")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Class deleted successfully",
      });
      fetchClasses();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleEdit = (classItem: Class) => {
    setEditingClass(classItem);
    
    // Parse existing schedule if it's in datetime format
    try {
      const [datePart, timePart] = classItem.schedule.split(' ');
      if (datePart && timePart) {
        setScheduleDate(new Date(datePart));
        setScheduleTime(timePart);
      }
    } catch (e) {
      // If parsing fails, leave date/time empty
      setScheduleDate(undefined);
      setScheduleTime("09:00");
    }
    
    setFormData({
      name: classItem.name,
      description: classItem.description || "",
      instructor: classItem.instructor,
      schedule: classItem.schedule,
      duration: classItem.duration,
      capacity: classItem.capacity,
      category: classItem.category || "",
      image_url: classItem.image_url || "",
      is_active: classItem.is_active,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingClass(null);
    setScheduleDate(undefined);
    setScheduleTime("09:00");
    setFormData({
      name: "",
      description: "",
      instructor: "",
      schedule: "",
      duration: 60,
      capacity: 20,
      category: "",
      image_url: "",
      is_active: true,
    });
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  if (authLoading || loading || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manage Classes</h1>
          <p className="text-muted-foreground">Add, edit, and manage gym classes</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Class Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instructor">Instructor *</Label>
                  <Input
                    id="instructor"
                    value={formData.instructor}
                    onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Cardio, Strength"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Schedule *</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="schedule-date">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !scheduleDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {scheduleDate ? format(scheduleDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={scheduleDate}
                          onSelect={setScheduleDate}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schedule-time">Time</Label>
                    <Input
                      id="schedule-time"
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    required
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity *</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    required
                    min="1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active (visible to members)</Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingClass ? "Update" : "Create"} Class
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Classes</CardTitle>
          <CardDescription>Manage your gym's class schedule</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No classes found. Create your first class!
                  </TableCell>
                </TableRow>
              ) : (
                classes.map((classItem) => (
                  <TableRow key={classItem.id}>
                    <TableCell className="font-medium">{classItem.name}</TableCell>
                    <TableCell>{classItem.instructor}</TableCell>
                    <TableCell>{classItem.schedule}</TableCell>
                    <TableCell>{classItem.duration} min</TableCell>
                    <TableCell>{classItem.capacity}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          classItem.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {classItem.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(classItem)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDelete(classItem.id)}
                        >
                          <Trash2 className="w-4 h-4" />
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

export default AdminManageClasses;

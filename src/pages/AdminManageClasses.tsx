import { useState, useEffect } from "react";
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
import { Plus, Pencil, Trash2, Loader2, CalendarIcon, Repeat } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, addDays, addWeeks, addMonths, startOfWeek, nextDay } from "date-fns";
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
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [selectedClassForSession, setSelectedClassForSession] = useState<Class | null>(null);
  const [scheduleDate, setScheduleDate] = useState<Date>();
  const [scheduleTime, setScheduleTime] = useState<string>("09:00");
  const [sessionFormData, setSessionFormData] = useState({
    startDate: undefined as Date | undefined,
    startTime: "09:00",
    endTime: "10:00",
    capacity: 20,
    recurring: false,
    recurringType: "weekly" as "daily" | "weekly" | "monthly",
    recurringCount: 4,
  });
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

  const handleCreateSession = (classItem: Class) => {
    setSelectedClassForSession(classItem);
    // Calculate end time based on duration
    const startHour = 9;
    const startMinute = 0;
    const duration = classItem.duration || 60;
    const endDate = new Date();
    endDate.setHours(startHour, startMinute + duration, 0);
    const endTime = format(endDate, "HH:mm");
    
    setSessionFormData({
      startDate: new Date(),
      startTime: "09:00",
      endTime: endTime,
      capacity: classItem.capacity,
      recurring: false,
      recurringType: "weekly",
      recurringCount: 4,
    });
    setSessionDialogOpen(true);
  };

  const handleCreateSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassForSession || !sessionFormData.startDate) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a start date",
      });
      return;
    }

    try {
      const sessionsToCreate = [];
      
      if (sessionFormData.recurring) {
        // Create recurring sessions
        let currentDate = new Date(sessionFormData.startDate);
        const startTimeParts = sessionFormData.startTime.split(":");
        const endTimeParts = sessionFormData.endTime.split(":");
        
        for (let i = 0; i < sessionFormData.recurringCount; i++) {
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
            capacity: sessionFormData.capacity,
          });

          // Calculate next date based on recurring type
          if (sessionFormData.recurringType === "daily") {
            currentDate = addDays(currentDate, 1);
          } else if (sessionFormData.recurringType === "weekly") {
            currentDate = addWeeks(currentDate, 1);
          } else if (sessionFormData.recurringType === "monthly") {
            currentDate = addMonths(currentDate, 1);
          }
        }
      } else {
        // Create single session
        const startTimeParts = sessionFormData.startTime.split(":");
        const endTimeParts = sessionFormData.endTime.split(":");
        
        const sessionStart = new Date(sessionFormData.startDate);
        sessionStart.setHours(parseInt(startTimeParts[0]), parseInt(startTimeParts[1]), 0);
        
        const sessionEnd = new Date(sessionFormData.startDate);
        sessionEnd.setHours(parseInt(endTimeParts[0]), parseInt(endTimeParts[1]), 0);
        
        sessionsToCreate.push({
          class_id: selectedClassForSession.id,
          name: selectedClassForSession.name,
          instructor: selectedClassForSession.instructor,
          start_time: sessionStart.toISOString(),
          end_time: sessionEnd.toISOString(),
          capacity: sessionFormData.capacity,
        });
      }

      const { error } = await supabase
        .from("class_sessions")
        .insert(sessionsToCreate);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Created ${sessionsToCreate.length} session(s) successfully`,
      });

      setSessionDialogOpen(false);
      setSelectedClassForSession(null);
      resetSessionForm();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create session(s)",
      });
    }
  };

  const resetSessionForm = () => {
    setSessionFormData({
      startDate: undefined,
      startTime: "09:00",
      endTime: "10:00",
      capacity: 20,
      recurring: false,
      recurringType: "weekly",
      recurringCount: 4,
    });
  };

  if (loading) {
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
          <CardDescription>Manage your gym's class schedule and create sessions</CardDescription>
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
                          title="Edit class"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleCreateSession(classItem)}
                          title="Create session"
                        >
                          <CalendarIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDelete(classItem.id)}
                          title="Delete class"
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

      {/* Create Session Dialog */}
      <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Class Session{sessionFormData.recurring ? "s" : ""}</DialogTitle>
            <DialogDescription>
              {selectedClassForSession && (
                <>Create session{sessionFormData.recurring ? "s" : ""} for <strong>{selectedClassForSession.name}</strong></>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSessionSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !sessionFormData.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {sessionFormData.startDate ? (
                      format(sessionFormData.startDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={sessionFormData.startDate}
                    onSelect={(date) => setSessionFormData({ ...sessionFormData, startDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time">Start Time *</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={sessionFormData.startTime}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, startTime: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time">End Time *</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={sessionFormData.endTime}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, endTime: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity *</Label>
              <Input
                id="capacity"
                type="number"
                value={sessionFormData.capacity}
                onChange={(e) => setSessionFormData({ ...sessionFormData, capacity: parseInt(e.target.value) })}
                required
                min="1"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="recurring"
                checked={sessionFormData.recurring}
                onCheckedChange={(checked) => setSessionFormData({ ...sessionFormData, recurring: checked })}
              />
              <Label htmlFor="recurring" className="flex items-center gap-2">
                <Repeat className="w-4 h-4" />
                Create recurring sessions
              </Label>
            </div>

            {sessionFormData.recurring && (
              <div className="space-y-4 pl-6 border-l-2">
                <div className="space-y-2">
                  <Label htmlFor="recurring-type">Repeat Every</Label>
                  <Select
                    value={sessionFormData.recurringType}
                    onValueChange={(value: "daily" | "weekly" | "monthly") =>
                      setSessionFormData({ ...sessionFormData, recurringType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Day</SelectItem>
                      <SelectItem value="weekly">Week</SelectItem>
                      <SelectItem value="monthly">Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recurring-count">Number of Sessions *</Label>
                  <Input
                    id="recurring-count"
                    type="number"
                    value={sessionFormData.recurringCount}
                    onChange={(e) =>
                      setSessionFormData({ ...sessionFormData, recurringCount: parseInt(e.target.value) })
                    }
                    required
                    min="1"
                    max="52"
                  />
                  <p className="text-xs text-muted-foreground">
                    Will create {sessionFormData.recurringCount} session(s) starting from the selected date
                  </p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSessionDialogOpen(false);
                  resetSessionForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                Create Session{sessionFormData.recurring ? "s" : ""}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminManageClasses;

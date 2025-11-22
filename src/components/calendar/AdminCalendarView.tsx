"use client";

import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";

interface Session {
  id: string;
  name: string;
  instructor: string | null;
  start_time: string;
  end_time: string;
  capacity: number | null;
  class_id: string | null;
  classes?: {
    name: string;
    category: string | null;
  };
}

interface Class {
  id: string;
  name: string;
  category: string | null;
}

interface AdminCalendarViewProps {
  sessions: Session[];
  classes: Class[];
  onAddSession?: (session: Omit<Session, "id" | "created_at">) => Promise<void>;
  onEditSession?: (sessionId: string, session: Partial<Session>) => Promise<void>;
  onDeleteSession?: (sessionId: string) => Promise<void>;
  selectedDate?: Date | null;
  onDateClick?: (date: Date) => void;
}

export const AdminCalendarView = ({
  sessions,
  classes,
  onAddSession,
  onEditSession,
  onDeleteSession,
  selectedDate,
  onDateClick,
}: AdminCalendarViewProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "day">("month");
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [newSession, setNewSession] = useState({
    name: "",
    instructor: "",
    startDate: new Date(),
    startTime: "09:00",
    endTime: "10:00",
    capacity: 20,
    class_id: "",
  });

  // Group sessions by date
  const sessionsByDate = useMemo(() => {
    const grouped = new Map<string, Session[]>();
    sessions.forEach((session) => {
      const dateKey = format(parseISO(session.start_time), "yyyy-MM-dd");
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(session);
    });
    return grouped;
  }, [sessions]);

  // Get sessions for a specific date
  const getSessionsForDate = (date: Date): Session[] => {
    const dateKey = format(date, "yyyy-MM-dd");
    return sessionsByDate.get(dateKey) || [];
  };

  // Calendar grid generation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDay(date);
    setViewMode("day");
    onDateClick?.(date);
  };

  const handleAddSession = () => {
    setEditingSession(null);
    setNewSession({
      name: "",
      instructor: "",
      startDate: selectedDay || new Date(),
      startTime: "09:00",
      endTime: "10:00",
      capacity: 20,
      class_id: "none",
    });
    setShowAddDialog(true);
    setShowEditDialog(false);
  };

  const handleEditSession = (session: Session) => {
    setEditingSession(session);
    const startTime = parseISO(session.start_time);
    setNewSession({
      name: session.name,
      instructor: session.instructor || "",
      startDate: startTime,
      startTime: format(startTime, "HH:mm"),
      endTime: format(parseISO(session.end_time), "HH:mm"),
      capacity: session.capacity || 20,
      class_id: session.class_id || "none",
    });
    setShowEditDialog(true);
    setShowAddDialog(false);
  };

  const handleDeleteSession = (session: Session) => {
    setEditingSession(session);
    setShowDeleteDialog(true);
    setShowAddDialog(false);
    setShowEditDialog(false);
  };

  const handleSaveSession = async () => {
    if (!newSession.name || !newSession.startDate) return;

    try {
      const startDateTime = new Date(newSession.startDate);
      const [startHours, startMinutes] = newSession.startTime.split(":").map(Number);
      startDateTime.setHours(startHours, startMinutes, 0, 0);

      const endDateTime = new Date(newSession.startDate);
      const [endHours, endMinutes] = newSession.endTime.split(":").map(Number);
      endDateTime.setHours(endHours, endMinutes, 0, 0);

      const sessionData = {
        name: newSession.name,
        instructor: newSession.instructor || null,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        capacity: newSession.capacity,
        class_id: (newSession.class_id && newSession.class_id !== "none") ? newSession.class_id : null,
      };

      if (editingSession) {
        await onEditSession?.(editingSession.id, sessionData);
      } else {
        await onAddSession?.(sessionData);
      }

      setShowAddDialog(false);
      setShowEditDialog(false);
      setEditingSession(null);
    } catch (error) {
      // Error already handled in parent component
      console.error("Error saving session:", error);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      if (editingSession) {
        await onDeleteSession?.(editingSession.id);
      }
      setShowDeleteDialog(false);
      setEditingSession(null);
    } catch (error) {
      // Error already handled in parent component
      console.error("Error deleting session:", error);
    }
  };

  // Render dialogs - must be available in both month and day views
  const renderDialogs = () => (
    <>
      {/* Add/Edit Session Dialog */}
      <Dialog open={showAddDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowAddDialog(false);
          setShowEditDialog(false);
          setEditingSession(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSession ? "Edit Session" : "Add New Session"}</DialogTitle>
            <DialogDescription>
              {editingSession ? "Update the session details" : "Create a new class session"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Class Name</Label>
              <Input
                value={newSession.name}
                onChange={(e) => setNewSession({ ...newSession, name: e.target.value })}
                placeholder="Enter class name"
              />
            </div>
            <div>
              <Label>Instructor</Label>
              <Input
                value={newSession.instructor}
                onChange={(e) => setNewSession({ ...newSession, instructor: e.target.value })}
                placeholder="Enter instructor name"
              />
            </div>
            <div>
              <Label>Link to Class Template (Optional)</Label>
              <Select value={newSession.class_id || "none"} onValueChange={(value) => setNewSession({ ...newSession, class_id: value === "none" ? "" : value })}>
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
                      !newSession.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newSession.startDate ? format(newSession.startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newSession.startDate}
                    onSelect={(date) => date && setNewSession({ ...newSession, startDate: date })}
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
                  value={newSession.startTime}
                  onChange={(e) => setNewSession({ ...newSession, startTime: e.target.value })}
                />
              </div>
              <div>
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={newSession.endTime}
                  onChange={(e) => setNewSession({ ...newSession, endTime: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Capacity</Label>
              <Input
                type="number"
                min="1"
                value={newSession.capacity}
                onChange={(e) => setNewSession({ ...newSession, capacity: parseInt(e.target.value) || 20 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setShowEditDialog(false);
                setEditingSession(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveSession}>
              {editingSession ? "Update" : "Create"} Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this session? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {editingSession && (
            <div className="py-4">
              <p className="text-sm">
                <strong>Session:</strong> {editingSession.name}
              </p>
              <p className="text-sm">
                <strong>Date:</strong> {format(parseISO(editingSession.start_time), "PPP")}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  // Day view
  if (viewMode === "day" && selectedDay) {
    const daySessions = getSessionsForDate(selectedDay);
    return (
      <>
        <DayView
          date={selectedDay}
          sessions={daySessions}
          classes={classes}
          onBack={() => setViewMode("month")}
          onDateChange={(date) => {
            setSelectedDay(date);
            setCurrentMonth(startOfMonth(date));
          }}
          onAddSession={handleAddSession}
          onEditSession={handleEditSession}
          onDeleteSession={handleDeleteSession}
        />
        {renderDialogs()}
      </>
    );
  }

  // Month view
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">
              {format(currentMonth, "MMMM yyyy")}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePreviousMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentMonth(new Date())}
              >
                Today
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid with week separators */}
            <div className="space-y-0">
              {Array.from({ length: Math.ceil(calendarDays.length / 7) }, (_, weekIndex) => {
                const weekStart = weekIndex * 7;
                const weekDays = calendarDays.slice(weekStart, weekStart + 7);
                
                return (
                  <div key={weekIndex}>
                    <div className="grid grid-cols-7">
                      {weekDays.map((day, dayIndex) => {
                        const daySessions = getSessionsForDate(day);
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        const isToday = isSameDay(day, new Date());
                        const isSelected = selectedDay && isSameDay(day, selectedDay);

                        return (
                          <div
                            key={dayIndex}
                            className={cn(
                              "min-h-[100px] p-2 cursor-pointer transition-colors",
                              !isCurrentMonth && "opacity-40",
                              isToday && "bg-primary/5",
                              isSelected && "bg-primary/10",
                              "hover:bg-accent"
                            )}
                            onClick={() => handleDateClick(day)}
                          >
                            <div
                              className={cn(
                                "text-sm font-semibold mb-1",
                                isToday && "text-primary",
                                isSelected && "text-primary"
                              )}
                            >
                              {format(day, "d")}
                            </div>
                            <div className="space-y-1">
                              {daySessions.slice(0, 3).map((session) => (
                                <Badge
                                  key={session.id}
                                  variant="secondary"
                                  className="w-full text-xs truncate"
                                >
                                  {session.name}
                                </Badge>
                              ))}
                              {daySessions.length > 3 && (
                                <div className="text-xs text-muted-foreground">
                                  +{daySessions.length - 3} more
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {weekIndex < Math.ceil(calendarDays.length / 7) - 1 && (
                      <div className="border-t border-border my-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
      {renderDialogs()}
    </>
  );
};

interface DayViewProps {
  date: Date;
  sessions: Session[];
  classes: Class[];
  onBack: () => void;
  onDateChange: (date: Date) => void;
  onAddSession: () => void;
  onEditSession: (session: Session) => void;
  onDeleteSession: (session: Session) => void;
}

const DayView = ({
  date,
  sessions,
  classes,
  onBack,
  onDateChange,
  onAddSession,
  onEditSession,
  onDeleteSession,
}: DayViewProps) => {
  const weekStart = startOfWeek(date);
  const weekDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(date) });

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      return parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime();
    });
  }, [sessions]);

  const sessionsByHour = useMemo(() => {
    const grouped = new Map<number, Session[]>();
    sortedSessions.forEach((session) => {
      const hour = parseISO(session.start_time).getHours();
      if (!grouped.has(hour)) {
        grouped.set(hour, []);
      }
      grouped.get(hour)!.push(session);
    });
    return grouped;
  }, [sortedSessions]);

  const timelineHours = Array.from({ length: 17 }, (_, i) => i + 6);

  const handlePreviousDay = () => {
    const prevDay = new Date(date);
    prevDay.setDate(prevDay.getDate() - 1);
    onDateChange(prevDay);
  };

  const handleNextDay = () => {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    onDateChange(nextDay);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={onBack}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-2xl font-bold">
              {format(date, "EEEE, MMMM d, yyyy")}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePreviousDay}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextDay}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => onDateChange(new Date())}>
              Today
            </Button>
            <Button onClick={onAddSession}>
              <Plus className="h-4 w-4 mr-2" />
              Add Session
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Week strip */}
          <div className="flex gap-2">
            {weekDays.map((day) => {
              const isSelected = isSameDay(day, date);
              const isToday = isSameDay(day, new Date());
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => onDateChange(day)}
                  className={cn(
                    "flex-1 p-3 rounded-lg border transition-colors text-center",
                    isSelected && "bg-primary text-primary-foreground border-primary",
                    !isSelected && "hover:bg-accent",
                    isToday && !isSelected && "border-primary"
                  )}
                >
                  <div className="text-xs text-muted-foreground mb-1">
                    {format(day, "EEE")}
                  </div>
                  <div className="text-lg font-semibold">
                    {format(day, "d")}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Day timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Schedule</h3>
            {sortedSessions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No sessions scheduled for this day</p>
                <Button className="mt-4" onClick={onAddSession}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Session
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {timelineHours.map((hour) => {
                  const hourSessions = sessionsByHour.get(hour) || [];
                  if (hourSessions.length === 0) return null;

                  return (
                    <div key={hour} className="flex gap-4">
                      <div className="w-16 text-sm text-muted-foreground pt-2">
                        {format(new Date().setHours(hour, 0, 0, 0), "h:mm a")}
                      </div>
                      <div className="flex-1 space-y-2">
                        {hourSessions.map((session) => {
                          const startTime = parseISO(session.start_time);
                          const endTime = parseISO(session.end_time);
                          const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

                          return (
                            <div
                              key={session.id}
                              className="p-4 rounded-lg border bg-card hover:shadow-md transition-colors"
                            >
                              <div className="flex items-start justify-between" onClick={(e) => e.stopPropagation()}>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold">{session.name}</h4>
                                    {session.classes?.category && (
                                      <Badge variant="outline" className="text-xs">
                                        {session.classes.category}
                                      </Badge>
                                    )}
                                  </div>
                                  {session.instructor && (
                                    <p className="text-sm text-muted-foreground mb-1">
                                      with {session.instructor}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>
                                      {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
                                    </span>
                                    <span>{duration} min</span>
                                    <span>Capacity: {session.capacity || "N/A"}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onEditSession(session);
                                    }}fi
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteSession(session);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};


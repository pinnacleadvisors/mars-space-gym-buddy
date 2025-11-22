"use client";

import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, parseISO, getDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Session {
  id: string;
  name: string;
  instructor: string | null;
  start_time: string;
  end_time: string;
  capacity: number | null;
  category?: string | null;
  bookedCount?: number;
  availableSpots?: number;
  isBooked?: boolean;
}

interface ClassCalendarViewProps {
  sessions: Session[];
  onDateClick?: (date: Date) => void;
  onSessionClick?: (session: Session) => void;
  selectedDate?: Date | null;
  viewMode?: "month" | "day";
  onViewModeChange?: (mode: "month" | "day") => void;
}

export const ClassCalendarView = ({
  sessions,
  onDateClick,
  onSessionClick,
  selectedDate,
  viewMode = "month",
  onViewModeChange,
}: ClassCalendarViewProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

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
    onDateClick?.(date);
    if (onViewModeChange) {
      onViewModeChange("day");
    }
  };

  if (viewMode === "day" && selectedDate) {
    return (
      <DayView
        date={selectedDate}
        sessions={getSessionsForDate(selectedDate)}
        onSessionClick={onSessionClick}
        onBack={() => {
          if (onViewModeChange) {
            onViewModeChange("month");
          }
        }}
        onDateChange={(date) => {
          setCurrentMonth(startOfMonth(date));
          onDateClick?.(date);
        }}
      />
    );
  }

  return (
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

          {/* Horizontal separator */}
          <div className="border-t border-border" />

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
                      const isSelected = selectedDate && isSameDay(day, selectedDate);

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
                                className="w-full text-xs truncate cursor-pointer hover:bg-primary hover:text-primary-foreground"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSessionClick?.(session);
                                }}
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
  );
};

interface DayViewProps {
  date: Date;
  sessions: Session[];
  onSessionClick?: (session: Session) => void;
  onBack: () => void;
  onDateChange: (date: Date) => void;
}

const DayView = ({ date, sessions, onSessionClick, onBack, onDateChange }: DayViewProps) => {
  // Generate week dates for the week strip
  const weekStart = startOfWeek(date);
  const weekDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(date) });

  // Sort sessions by start time
  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      return parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime();
    });
  }, [sessions]);

  // Group sessions by hour for timeline
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

  // Generate timeline hours (6 AM to 10 PM)
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
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No classes scheduled for this day</p>
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
                              onClick={() => onSessionClick?.(session)}
                              className={cn(
                                "p-4 rounded-lg border cursor-pointer transition-colors",
                                "hover:shadow-md hover:border-primary",
                                session.isBooked && "bg-primary/5 border-primary/20"
                              )}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold">{session.name}</h4>
                                    {session.category && (
                                      <Badge variant="outline" className="text-xs">
                                        {session.category}
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
                                    {session.availableSpots !== undefined && (
                                      <span>
                                        {session.availableSpots} spots available
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {session.isBooked && (
                                  <Badge variant="default" className="ml-2">
                                    Booked
                                  </Badge>
                                )}
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


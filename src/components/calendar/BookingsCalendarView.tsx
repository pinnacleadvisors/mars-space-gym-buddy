"use client";

import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { BookingWithDetails } from "@/hooks/useBookings";

interface BookingsCalendarViewProps {
  bookings: BookingWithDetails[];
  onDateClick?: (date: Date) => void;
  onBookingClick?: (booking: BookingWithDetails) => void;
  selectedDate?: Date | null;
  viewMode?: "month" | "day";
  onViewModeChange?: (mode: "month" | "day") => void;
}

export const BookingsCalendarView = ({
  bookings,
  onDateClick,
  onBookingClick,
  selectedDate,
  viewMode = "month",
  onViewModeChange,
}: BookingsCalendarViewProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Filter bookings that have valid class_sessions
  const validBookings = useMemo(() => {
    return bookings.filter((booking) => booking.class_sessions !== null);
  }, [bookings]);

  // Group bookings by date
  const bookingsByDate = useMemo(() => {
    const grouped = new Map<string, BookingWithDetails[]>();
    validBookings.forEach((booking) => {
      if (booking.class_sessions?.start_time) {
        const dateKey = format(parseISO(booking.class_sessions.start_time), "yyyy-MM-dd");
        if (!grouped.has(dateKey)) {
          grouped.set(dateKey, []);
        }
        grouped.get(dateKey)!.push(booking);
      }
    });
    return grouped;
  }, [validBookings]);

  // Get bookings for a specific date
  const getBookingsForDate = (date: Date): BookingWithDetails[] => {
    const dateKey = format(date, "yyyy-MM-dd");
    return bookingsByDate.get(dateKey) || [];
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
        bookings={getBookingsForDate(selectedDate)}
        onBookingClick={onBookingClick}
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
                      const dayBookings = getBookingsForDate(day);
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
                            {dayBookings.slice(0, 3).map((booking) => {
                              if (!booking.class_sessions) return null;
                              return (
                                <Badge
                                  key={booking.id}
                                  variant={booking.status === "cancelled" ? "secondary" : "default"}
                                  className={cn(
                                    "w-full text-xs truncate cursor-pointer",
                                    booking.status === "cancelled" 
                                      ? "opacity-50 line-through" 
                                      : "hover:bg-primary hover:text-primary-foreground"
                                  )}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onBookingClick?.(booking);
                                  }}
                                >
                                  {booking.class_sessions.name}
                                </Badge>
                              );
                            })}
                            {dayBookings.length > 3 && (
                              <div className="text-xs text-muted-foreground">
                                +{dayBookings.length - 3} more
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
  bookings: BookingWithDetails[];
  onBookingClick?: (booking: BookingWithDetails) => void;
  onBack: () => void;
  onDateChange: (date: Date) => void;
}

const DayView = ({ date, bookings, onBookingClick, onBack, onDateChange }: DayViewProps) => {
  // Generate week dates for the week strip
  const weekStart = startOfWeek(date);
  const weekDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(date) });

  // Sort bookings by start time
  const sortedBookings = useMemo(() => {
    return [...bookings]
      .filter((booking) => booking.class_sessions !== null)
      .sort((a, b) => {
        const timeA = a.class_sessions?.start_time ? parseISO(a.class_sessions.start_time).getTime() : 0;
        const timeB = b.class_sessions?.start_time ? parseISO(b.class_sessions.start_time).getTime() : 0;
        return timeA - timeB;
      });
  }, [bookings]);

  // Group bookings by hour for timeline
  const bookingsByHour = useMemo(() => {
    const grouped = new Map<number, BookingWithDetails[]>();
    sortedBookings.forEach((booking) => {
      if (booking.class_sessions?.start_time) {
        const hour = parseISO(booking.class_sessions.start_time).getHours();
        if (!grouped.has(hour)) {
          grouped.set(hour, []);
        }
        grouped.get(hour)!.push(booking);
      }
    });
    return grouped;
  }, [sortedBookings]);

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

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "booked":
      case "confirmed":
        return <Badge variant="default">Booked</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Cancelled</Badge>;
      case "attended":
        return <Badge variant="outline">Attended</Badge>;
      case "no_show":
        return <Badge variant="destructive">No Show</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
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
            <h3 className="text-lg font-semibold">My Bookings</h3>
            {sortedBookings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No bookings scheduled for this day</p>
              </div>
            ) : (
              <div className="space-y-2">
                {timelineHours.map((hour) => {
                  const hourBookings = bookingsByHour.get(hour) || [];
                  if (hourBookings.length === 0) return null;

                  return (
                    <div key={hour} className="flex gap-4">
                      <div className="w-16 text-sm text-muted-foreground pt-2">
                        {format(new Date().setHours(hour, 0, 0, 0), "h:mm a")}
                      </div>
                      <div className="flex-1 space-y-2">
                        {hourBookings.map((booking) => {
                          if (!booking.class_sessions) return null;
                          const startTime = parseISO(booking.class_sessions.start_time);
                          const endTime = parseISO(booking.class_sessions.end_time);
                          const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

                          return (
                            <div
                              key={booking.id}
                              onClick={() => onBookingClick?.(booking)}
                              className={cn(
                                "p-4 rounded-lg border cursor-pointer transition-colors",
                                "hover:shadow-md hover:border-primary",
                                booking.status === "cancelled" && "opacity-50",
                                booking.status === "booked" && "bg-primary/5 border-primary/20"
                              )}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold">{booking.class_sessions.name}</h4>
                                    {getStatusBadge(booking.status)}
                                  </div>
                                  {booking.class_sessions.instructor && (
                                    <p className="text-sm text-muted-foreground mb-1">
                                      with {booking.class_sessions.instructor}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>
                                      {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
                                    </span>
                                    <span>{duration} min</span>
                                    {booking.class_sessions.capacity && (
                                      <span>Capacity: {booking.class_sessions.capacity}</span>
                                    )}
                                  </div>
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


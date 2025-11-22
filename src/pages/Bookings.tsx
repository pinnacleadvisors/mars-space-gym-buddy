import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Calendar as CalendarIcon, Clock, Users, MapPin, Loader2, X, CalendarDays, List } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { toastMessages, showErrorToast } from "@/lib/utils/toastHelpers";
import { useBookings, BookingWithDetails } from "@/hooks/useBookings";
import { format, parseISO, isAfter, isBefore, startOfToday, isSameDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingCardSkeletons } from "@/components/loading/BookingCardSkeleton";
import { BookingsCalendarView } from "@/components/calendar/BookingsCalendarView";

const Bookings = () => {
  const [viewMode, setViewMode] = useState<"list" | "calendar">("calendar");
  const [calendarViewMode, setCalendarViewMode] = useState<"month" | "day">("month");
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { toast } = useToast();
  const { bookings, loading, cancelBooking, refreshBookings } = useBookings();

  // Separate upcoming and past bookings
  const { upcomingBookings, pastBookings } = useMemo(() => {
    const now = new Date();
    const upcoming: BookingWithDetails[] = [];
    const past: BookingWithDetails[] = [];

    bookings.forEach((booking) => {
      if (booking.class_sessions?.start_time) {
        const startTime = parseISO(booking.class_sessions.start_time);
        if (isAfter(startTime, now) || isSameDay(startTime, now)) {
          upcoming.push(booking);
        } else {
          past.push(booking);
        }
      } else {
        // If no start_time, consider it past
        past.push(booking);
      }
    });

    // Sort upcoming by start time (earliest first)
    upcoming.sort((a, b) => {
      const timeA = a.class_sessions?.start_time ? parseISO(a.class_sessions.start_time).getTime() : 0;
      const timeB = b.class_sessions?.start_time ? parseISO(b.class_sessions.start_time).getTime() : 0;
      return timeA - timeB;
    });

    // Sort past by start time (most recent first)
    past.sort((a, b) => {
      const timeA = a.class_sessions?.start_time ? parseISO(a.class_sessions.start_time).getTime() : 0;
      const timeB = b.class_sessions?.start_time ? parseISO(b.class_sessions.start_time).getTime() : 0;
      return timeB - timeA;
    });

    return { upcomingBookings: upcoming, pastBookings: past };
  }, [bookings]);

  const handleBookingClick = (booking: BookingWithDetails) => {
    setSelectedBooking(booking);
    setShowDetailsDialog(true);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleViewDetails = (booking: BookingWithDetails) => {
    setSelectedBooking(booking);
    setShowDetailsDialog(true);
  };

  const handleCancelClick = (booking: BookingWithDetails) => {
    setSelectedBooking(booking);
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedBooking) return;

    setCancelLoading(true);
    try {
      const result = await cancelBooking(selectedBooking.id);

      if (result.success) {
        toast(toastMessages.bookingCancelled());
        setShowCancelDialog(false);
        setSelectedBooking(null);
        await refreshBookings();
      } else {
        toast(toastMessages.cancellationFailed(result.error));
      }
    } catch (error: any) {
      showErrorToast({
        title: "Error",
        description: error.message || "An error occurred while cancelling the booking.",
      });
    } finally {
      setCancelLoading(false);
    }
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

  const canCancel = (booking: BookingWithDetails): boolean => {
    if (booking.status === "cancelled") return false;
    if (!booking.class_sessions?.start_time) return false;
    
    const startTime = parseISO(booking.class_sessions.start_time);
    const now = new Date();
    const hoursUntilClass = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    // Can cancel if more than 24 hours away and not in the past
    return hoursUntilClass >= 24 && isAfter(startTime, now);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto max-w-7xl">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="flex gap-4 mb-6">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
          <BookingCardSkeletons count={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">My Bookings</h1>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4 mr-2" />
              List
            </Button>
            <Button
              variant={viewMode === "calendar" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("calendar")}
            >
              <CalendarDays className="w-4 h-4 mr-2" />
              Calendar
            </Button>
          </div>
        </div>

        {viewMode === "list" ? (
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList>
              <TabsTrigger value="upcoming">
                Upcoming ({upcomingBookings.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Past ({pastBookings.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="mt-6">
              {upcomingBookings.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground">
                      You don't have any upcoming bookings. Book a class to get started!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {upcomingBookings.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      onViewDetails={handleViewDetails}
                      onCancel={handleCancelClick}
                      getStatusBadge={getStatusBadge}
                      canCancel={canCancel}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="past" className="mt-6">
              {pastBookings.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground">No past bookings.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {pastBookings.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      onViewDetails={handleViewDetails}
                      onCancel={handleCancelClick}
                      getStatusBadge={getStatusBadge}
                      canCancel={canCancel}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <BookingsCalendarView
            bookings={bookings}
            selectedDate={selectedDate}
            viewMode={calendarViewMode}
            onViewModeChange={setCalendarViewMode}
            onDateClick={handleDateClick}
            onBookingClick={handleBookingClick}
          />
        )}

        {/* Booking Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
              <DialogDescription>View full details of your booking</DialogDescription>
            </DialogHeader>
            {selectedBooking && selectedBooking.class_sessions && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Class Name</p>
                    <p className="text-base">{selectedBooking.class_sessions.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <div>{getStatusBadge(selectedBooking.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Instructor</p>
                    <p className="text-base">
                      {selectedBooking.class_sessions.instructor || "TBA"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Capacity</p>
                    <p className="text-base">
                      {selectedBooking.class_sessions.capacity || "N/A"} participants
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Start Time</p>
                    <p className="text-base">
                      {format(
                        parseISO(selectedBooking.class_sessions.start_time),
                        "MMM d, yyyy 'at' h:mm a"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">End Time</p>
                    <p className="text-base">
                      {format(
                        parseISO(selectedBooking.class_sessions.end_time),
                        "MMM d, yyyy 'at' h:mm a"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Duration</p>
                    <p className="text-base">
                      {Math.round(
                        (parseISO(selectedBooking.class_sessions.end_time).getTime() -
                          parseISO(selectedBooking.class_sessions.start_time).getTime()) /
                          60000
                      )}{" "}
                      minutes
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Booked On</p>
                    <p className="text-base">
                      {format(parseISO(selectedBooking.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Cancel Booking Confirmation Dialog */}
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel this booking? This action cannot be undone.
                {selectedBooking?.class_sessions?.start_time && (
                  <div className="mt-4 p-4 bg-muted rounded-md">
                    <p className="font-medium mb-2">
                      {selectedBooking.class_sessions.name}
                    </p>
                    <p className="text-sm">
                      {format(
                        parseISO(selectedBooking.class_sessions.start_time),
                        "MMM d, yyyy 'at' h:mm a"
                      )}
                    </p>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={cancelLoading}>Keep Booking</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmCancel}
                disabled={cancelLoading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {cancelLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  "Cancel Booking"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

interface BookingCardProps {
  booking: BookingWithDetails;
  onViewDetails: (booking: BookingWithDetails) => void;
  onCancel: (booking: BookingWithDetails) => void;
  getStatusBadge: (status: string) => JSX.Element;
  canCancel: (booking: BookingWithDetails) => boolean;
}

const BookingCard = ({
  booking,
  onViewDetails,
  onCancel,
  getStatusBadge,
  canCancel,
}: BookingCardProps) => {
  if (!booking.class_sessions) {
    return null;
  }

  const startTime = parseISO(booking.class_sessions.start_time);
  const endTime = parseISO(booking.class_sessions.end_time);
  const duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="mb-1">{booking.class_sessions.name}</CardTitle>
            <CardDescription>
              with {booking.class_sessions.instructor || "TBA"}
            </CardDescription>
          </div>
          {getStatusBadge(booking.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
            <span>{format(startTime, "MMM d, yyyy")}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>
              {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")} ({duration} min)
            </span>
          </div>
          {booking.class_sessions.capacity && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>Capacity: {booking.class_sessions.capacity}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onViewDetails(booking)} className="flex-1">
            View Details
          </Button>
          {canCancel(booking) && (
            <Button
              variant="outline"
              onClick={() => onCancel(booking)}
              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Bookings;

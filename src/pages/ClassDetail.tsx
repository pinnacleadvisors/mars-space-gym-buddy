import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Clock, Users, Loader2, CalendarDays, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toastMessages, showErrorToast } from "@/lib/utils/toastHelpers";
import { useBookings } from "@/hooks/useBookings";
import { format, parseISO, isBefore } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { ClassCalendarView } from "@/components/calendar/ClassCalendarView";

interface ClassType {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  category_id: string | null;
  category: string | null;
  class_categories?: {
    id: string;
    name: string;
    image_url: string | null;
  };
}

interface ClassSession {
  id: string;
  name: string;
  instructor: string | null;
  start_time: string;
  end_time: string;
  capacity: number | null;
  class_id: string | null;
}

interface ClassSessionWithAvailability extends ClassSession {
  bookedCount: number;
  availableSpots: number;
  isBooked: boolean;
  isPast: boolean;
}

const ClassDetail = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [classData, setClassData] = useState<ClassType | null>(null);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<ClassSessionWithAvailability | null>(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [calendarViewMode, setCalendarViewMode] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showFullTimetable, setShowFullTimetable] = useState(false);

  const { toast } = useToast();
  const { bookings, createBooking, refreshBookings } = useBookings();

  useEffect(() => {
    if (classId) {
      fetchClassData();
    }
  }, [classId]);

  const fetchClassData = async () => {
    if (!classId) return;

    try {
      setLoading(true);
      const now = new Date().toISOString();

      // Fetch class data
      const { data: classDataRes, error: classError } = await supabase
        .from("classes")
        .select(`
          id,
          name,
          description,
          image_url,
          category_id,
          category,
          class_categories (
            id,
            name,
            image_url
          )
        `)
        .eq("id", classId)
        .eq("is_active", true)
        .single();

      if (classError) throw classError;
      if (!classDataRes) {
        showErrorToast({
          title: "Class Not Found",
          description: "This class does not exist or is no longer available.",
        });
        navigate("/classes");
        return;
      }

      setClassData(classDataRes as ClassType);

      // Fetch upcoming sessions for this class
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("class_sessions")
        .select("*")
        .eq("class_id", classId)
        .gte("start_time", now)
        .order("start_time", { ascending: true });

      if (sessionsError) throw sessionsError;
      setSessions((sessionsData || []) as ClassSession[]);
    } catch (error: any) {
      showErrorToast({
        title: "Error",
        description: error.message || "Failed to fetch class data",
      });
      navigate("/classes");
    } finally {
      setLoading(false);
    }
  };

  // Calculate availability for each session
  const sessionsWithAvailability = useMemo((): ClassSessionWithAvailability[] => {
    return sessions.map((session) => {
      // Count bookings for this session
      const sessionBookings = bookings.filter(
        (b) => b.class_id === session.id && (b.status === "booked" || b.status === "confirmed")
      );
      const bookedCount = sessionBookings.length;
      const capacity = session.capacity || 0;
      const availableSpots = Math.max(0, capacity - bookedCount);

      // Check if user has booked this session
      const userBookings = bookings.filter(
        (b) => b.class_id === session.id && (b.status === "booked" || b.status === "confirmed")
      );
      const isBooked = userBookings.length > 0;

      // Check if session is in the past
      const isPast = isBefore(parseISO(session.start_time), new Date());

      return {
        ...session,
        bookedCount,
        availableSpots,
        isBooked,
        isPast,
      };
    });
  }, [sessions, bookings]);

  // Determine how many sessions to show initially
  const INITIAL_SESSIONS_TO_SHOW = 5;
  const displayedSessions = showFullTimetable
    ? sessionsWithAvailability
    : sessionsWithAvailability.slice(0, INITIAL_SESSIONS_TO_SHOW);
  const hasMoreSessions = sessionsWithAvailability.length > INITIAL_SESSIONS_TO_SHOW;

  const handleBookClick = (session: ClassSessionWithAvailability) => {
    if (session.isBooked) {
      toast(toastMessages.alreadyBooked());
      return;
    }

    if (session.availableSpots === 0) {
      toast(toastMessages.classFull());
      return;
    }

    if (session.isPast) {
      showErrorToast({
        title: "Cannot Book",
        description: "This class has already started.",
      });
      return;
    }

    setSelectedSession(session);
    setShowBookingDialog(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedSession) return;

    setBookingLoading(true);
    try {
      const result = await createBooking(selectedSession.id);

      if (result.success) {
        toast(toastMessages.bookingCreated(selectedSession.name));
        setShowBookingDialog(false);
        setSelectedSession(null);
        await refreshBookings();
      } else {
        toast(toastMessages.bookingFailed(result.error));
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An error occurred while booking.",
      });
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full" />
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Class not found.</p>
              <Button onClick={() => navigate("/classes")} className="mt-4">
                Back to Classes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const displayImage = classData.image_url || classData.class_categories?.image_url;
  const categoryName = classData.class_categories?.name || classData.category;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl p-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/classes")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Classes
        </Button>

        {/* Class Header */}
        <div className="mb-8">
          {displayImage && (
            <div className="relative w-full h-96 rounded-lg overflow-hidden bg-muted mb-6">
              <img
                src={displayImage}
                alt={classData.name}
                className="w-full h-full object-cover"
              />
              {categoryName && (
                <div className="absolute top-4 left-4">
                  <Badge variant="secondary" className="backdrop-blur-sm bg-secondary/90">
                    {categoryName}
                  </Badge>
                </div>
              )}
            </div>
          )}
          
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{classData.name}</h1>
              {classData.description && (
                <p className="text-lg text-muted-foreground max-w-3xl">
                  {classData.description}
                </p>
              )}
            </div>
            <Button
              variant={viewMode === "calendar" ? "default" : "outline"}
              onClick={() => setViewMode(viewMode === "calendar" ? "list" : "calendar")}
              className="shrink-0"
            >
              <CalendarDays className="w-4 h-4 mr-2" />
              {viewMode === "calendar" ? "See List" : "See Calendar"}
            </Button>
          </div>
        </div>

        {/* Upcoming Classes / Timetable Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">
              {viewMode === "calendar" ? "Class Schedule" : "Upcoming Classes"}
            </h2>
            {viewMode === "list" && hasMoreSessions && !showFullTimetable && (
              <Button
                variant="outline"
                onClick={() => setShowFullTimetable(true)}
              >
                View Full Timetable
              </Button>
            )}
          </div>

          {viewMode === "calendar" ? (
            <ClassCalendarView
              sessions={sessionsWithAvailability.map((s) => ({
                id: s.id,
                name: s.name,
                instructor: s.instructor,
                start_time: s.start_time,
                end_time: s.end_time,
                capacity: s.capacity,
                bookedCount: s.bookedCount,
                availableSpots: s.availableSpots,
                isBooked: s.isBooked,
              }))}
              onDateClick={(date) => {
                setSelectedDate(date);
              }}
              onSessionClick={(session) => {
                const fullSession = sessionsWithAvailability.find((s) => s.id === session.id);
                if (fullSession) {
                  handleBookClick(fullSession);
                }
              }}
              selectedDate={selectedDate}
              viewMode={calendarViewMode}
              onViewModeChange={setCalendarViewMode}
            />
          ) : (
            <>
              {sessionsWithAvailability.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground">
                      No upcoming classes scheduled for this class type. Check back soon!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {displayedSessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      onBookClick={handleBookClick}
                    />
                  ))}
                  {showFullTimetable && hasMoreSessions && (
                    <div className="text-center pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowFullTimetable(false)}
                      >
                        Show Less
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Booking Confirmation Dialog */}
        <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Booking</DialogTitle>
              <DialogDescription>
                Are you sure you want to book this class?
              </DialogDescription>
            </DialogHeader>
            {selectedSession && (
              <div className="space-y-2 py-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Class:</span>
                  <span className="text-sm">{selectedSession.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Instructor:</span>
                  <span className="text-sm">{selectedSession.instructor || "TBA"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Date & Time:</span>
                  <span className="text-sm">
                    {format(parseISO(selectedSession.start_time), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Duration:</span>
                  <span className="text-sm">
                    {Math.round(
                      (parseISO(selectedSession.end_time).getTime() -
                        parseISO(selectedSession.start_time).getTime()) /
                        60000
                    )}{" "}
                    minutes
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Available Spots:</span>
                  <span className="text-sm">
                    {selectedSession.availableSpots} of {selectedSession.capacity || 0}
                  </span>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowBookingDialog(false);
                  setSelectedSession(null);
                }}
                disabled={bookingLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleConfirmBooking} disabled={bookingLoading}>
                {bookingLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Booking...
                  </>
                ) : (
                  "Confirm Booking"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

interface SessionCardProps {
  session: ClassSessionWithAvailability;
  onBookClick: (session: ClassSessionWithAvailability) => void;
}

const SessionCard = ({ session, onBookClick }: SessionCardProps) => {
  const startTime = parseISO(session.start_time);
  const endTime = parseISO(session.end_time);
  const duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

  const isFullyBooked = session.availableSpots === 0;
  const isLowAvailability = session.availableSpots > 0 && session.availableSpots <= 3;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-xl">{session.name}</CardTitle>
              {isFullyBooked && <Badge variant="destructive">Full</Badge>}
              {isLowAvailability && !isFullyBooked && (
                <Badge variant="secondary">Few Spots Left</Badge>
              )}
              {session.isBooked && <Badge variant="default">Booked</Badge>}
            </div>

            {session.instructor && (
              <CardDescription className="text-base">
                with {session.instructor}
              </CardDescription>
            )}

            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{format(startTime, "MMM d, yyyy 'at' h:mm a")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{duration} minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>
                  {session.availableSpots} of {session.capacity || 0} spots available
                </span>
              </div>
            </div>
          </div>

          <Button
            onClick={() => onBookClick(session)}
            disabled={session.isBooked || isFullyBooked || session.isPast}
            variant={session.isBooked ? "secondary" : "default"}
            className="shrink-0"
          >
            {session.isBooked
              ? "Booked"
              : isFullyBooked
              ? "Full"
              : session.isPast
              ? "Past"
              : "Book this class"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClassDetail;


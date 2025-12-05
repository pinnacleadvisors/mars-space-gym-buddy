import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Clock, Users, Loader2, Search, Calendar, User, Filter, Grid3x3, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toastMessages, showErrorToast } from "@/lib/utils/toastHelpers";
import { useBookings } from "@/hooks/useBookings";
import { format, parseISO, isAfter, isBefore, startOfToday } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { ClassCardSkeletons } from "@/components/loading/ClassCardSkeleton";
import { ClassCalendarView } from "@/components/calendar/ClassCalendarView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Class {
  id: string;
  name: string;
  category: string | null;
  category_id: string | null;
  description: string | null;
  image_url: string | null;
}

interface ClassCategory {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
}

interface ClassSession {
  id: string;
  name: string;
  instructor: string | null;
  start_time: string;
  end_time: string;
  capacity: number | null;
  created_at: string;
  class_id: string | null;
  classes?: {
    name: string;
    category: string | null;
    category_id: string | null;
    description: string | null;
    image_url: string | null;
    class_categories?: {
      id: string;
      name: string;
      image_url: string | null;
    };
  };
}

interface ClassSessionWithAvailability extends ClassSession {
  bookedCount: number;
  availableSpots: number;
  isBooked: boolean;
  isPast: boolean;
  category?: string | null;
}

const Classes = () => {
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [categories, setCategories] = useState<ClassCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedInstructor, setSelectedInstructor] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("upcoming");
  const [selectedSession, setSelectedSession] = useState<ClassSessionWithAvailability | null>(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "calendar">("grid");
  const [calendarViewMode, setCalendarViewMode] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const { toast } = useToast();
  const { bookings, createBooking, refreshBookings } = useBookings();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const now = new Date().toISOString();
      
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("class_categories" as any)
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });

      if (categoriesError) throw categoriesError;
      setCategories((categoriesData || []) as ClassCategory[]);
      
      // Fetch upcoming class sessions with class data and category info
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("class_sessions")
        .select(`
          *,
          classes (
            name,
            category,
            category_id,
            description,
            image_url,
            class_categories (
              id,
              name,
              image_url
            )
          )
        `)
        .gte("start_time", now)
        .order("start_time", { ascending: true });

      if (sessionsError) throw sessionsError;
      setSessions((sessionsData || []) as ClassSession[]);

      // Fetch all classes for filter
      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select("id, name, category, category_id, description, image_url")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (classesError) throw classesError;
      setClasses((classesData || []) as Class[]);
    } catch (error: any) {
      showErrorToast({
        title: "Error",
        description: error.message || "Failed to fetch classes",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get unique instructors, categories, and class names for filters
  const instructors = useMemo(() => {
    const unique = Array.from(new Set(sessions.map(s => s.instructor).filter(Boolean)));
    return unique.sort();
  }, [sessions]);

  // Use categories from database, fallback to extracted categories from sessions
  const availableCategories = useMemo(() => {
    if (categories.length > 0) {
      return categories;
    }
    // Fallback: extract from sessions
    const unique = Array.from(
      new Set(
        sessions
          .map(s => (s.classes as any)?.category || (s.classes as any)?.category_id || null)
          .filter(Boolean)
      )
    );
    return unique.map((cat) => ({ id: cat, name: cat, description: null, image_url: null, is_active: true, display_order: 0 } as ClassCategory)).sort((a, b) => a.name.localeCompare(b.name));
  }, [categories, sessions]);

  const classNames = useMemo(() => {
    return classes.map(c => c.name).sort();
  }, [classes]);

  // Calculate availability for each session
  const sessionsWithAvailability = useMemo((): ClassSessionWithAvailability[] => {
    return sessions.map(session => {
      // Count bookings for this session
      const sessionBookings = bookings.filter(
        b => b.class_id === session.id && (b.status === 'booked' || b.status === 'confirmed')
      );
      const bookedCount = sessionBookings.length;
      const capacity = session.capacity || 0;
      const availableSpots = Math.max(0, capacity - bookedCount);
      
      // Check if user has booked this session
      const userBookings = bookings.filter(
        b => b.class_id === session.id && (b.status === 'booked' || b.status === 'confirmed')
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
        category: (session.classes as any)?.category || (session.classes as any)?.class_categories?.name || null,
      };
    });
  }, [sessions, bookings]);

  // Filter sessions based on search and filters
  const filteredSessions = useMemo(() => {
    let filtered = sessionsWithAvailability;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        session =>
          session.name.toLowerCase().includes(query) ||
          session.instructor?.toLowerCase().includes(query) ||
          session.classes?.name.toLowerCase().includes(query)
      );
    }

    // Class name filter
    if (selectedClass !== "all") {
      filtered = filtered.filter(session => session.classes?.name === selectedClass);
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(session => {
        const sessionCategoryId = (session.classes as any)?.category_id;
        const sessionCategoryName = (session.classes as any)?.category || session.category;
        return sessionCategoryId === selectedCategory || sessionCategoryName === selectedCategory;
      });
    }

    // Instructor filter
    if (selectedInstructor !== "all") {
      filtered = filtered.filter(session => session.instructor === selectedInstructor);
    }

    // Date filter
    if (dateFilter === "today") {
      const today = startOfToday();
      filtered = filtered.filter(session => {
        const sessionDate = parseISO(session.start_time);
        return sessionDate >= today && sessionDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
      });
    } else if (dateFilter === "this-week") {
      const today = startOfToday();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(session => {
        const sessionDate = parseISO(session.start_time);
        return sessionDate >= today && sessionDate < nextWeek;
      });
    } else if (dateFilter === "my-bookings") {
      filtered = filtered.filter(session => session.isBooked);
    }

    return filtered;
  }, [sessionsWithAvailability, searchQuery, selectedClass, selectedCategory, selectedInstructor, dateFilter]);

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
          <div className="flex gap-4 mb-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-40" />
          </div>
          <ClassCardSkeletons count={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/10 to-background py-12 px-6">
        <div className="container mx-auto max-w-7xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Award-winning classes led by the best instructors
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Move with purpose, train together, feel the energy.
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl p-6">
        {/* Category Filter Buttons */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
              className="rounded-full"
            >
              All
            </Button>
            {availableCategories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="rounded-full"
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Available Classes</h2>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid3x3 className="w-4 h-4 mr-2" />
              Grid
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

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Search */}
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search classes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Class Name Filter */}
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classNames.map((className) => (
                    <SelectItem key={className} value={className}>
                      {className}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Instructor Filter */}
              <Select value={selectedInstructor} onValueChange={setSelectedInstructor}>
                <SelectTrigger>
                  <SelectValue placeholder="All Instructors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Instructors</SelectItem>
                  {instructors.map((instructor) => (
                    <SelectItem key={instructor} value={instructor}>
                      {instructor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              {(searchQuery || selectedClass !== "all" || selectedCategory !== "all" || selectedInstructor !== "all" || dateFilter !== "upcoming") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedClass("all");
                    setSelectedCategory("all");
                    setSelectedInstructor("all");
                    setDateFilter("upcoming");
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {filteredSessions.length} of {sessions.length} classes
        </div>

        {/* View Mode Toggle */}
        {viewMode === "calendar" ? (
          <ClassCalendarView
            sessions={filteredSessions.map(s => ({
              id: s.id,
              name: s.name,
              instructor: s.instructor,
              start_time: s.start_time,
              end_time: s.end_time,
              capacity: s.capacity,
              category: s.category,
              bookedCount: s.bookedCount,
              availableSpots: s.availableSpots,
              isBooked: s.isBooked,
            }))}
            onDateClick={(date) => {
              setSelectedDate(date);
            }}
            onSessionClick={(session) => {
              const fullSession = filteredSessions.find(s => s.id === session.id);
              if (fullSession) {
                handleBookClick(fullSession);
              }
            }}
            selectedDate={selectedDate}
            viewMode={calendarViewMode}
            onViewModeChange={setCalendarViewMode}
          />
        ) : (
          /* Classes Grid */
          filteredSessions.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">
                  {searchQuery || selectedClass !== "all" || selectedCategory !== "all" || selectedInstructor !== "all" || dateFilter !== "upcoming"
                    ? "No classes match your filters. Try adjusting your search."
                    : "No classes available at the moment. Check back soon!"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSessions.map((session) => (
                <ClassCard
                  key={session.id}
                  session={session}
                  onBookClick={handleBookClick}
                />
              ))}
            </div>
          )
        )}

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

interface ClassCardProps {
  session: ClassSessionWithAvailability;
  onBookClick: (session: ClassSessionWithAvailability) => void;
}

const ClassCard = ({ session, onBookClick }: ClassCardProps) => {
  const startTime = parseISO(session.start_time);
  const endTime = parseISO(session.end_time);
  const duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

  const isFullyBooked = session.availableSpots === 0;
  const isLowAvailability = session.availableSpots > 0 && session.availableSpots <= 3;

  // Get image from class or category
  const classImage = (session.classes as any)?.image_url;
  const categoryImage = (session.classes as any)?.class_categories?.image_url;
  const displayImage = classImage || categoryImage;

  // Get description
  const description = (session.classes as any)?.description;

  return (
    <Card className="hover:shadow-lg transition-shadow overflow-hidden flex flex-col group">
      {displayImage && (
        <div className="relative h-48 w-full overflow-hidden bg-muted">
          <img
            src={displayImage}
            alt={session.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            {isFullyBooked && <Badge variant="destructive">Full</Badge>}
            {isLowAvailability && !isFullyBooked && (
              <Badge variant="secondary">Few Spots Left</Badge>
            )}
            {session.isBooked && <Badge variant="default">Booked</Badge>}
          </div>
        </div>
      )}
      <CardHeader className={displayImage ? "" : "pb-2"}>
        {!displayImage && (
          <div className="flex items-start justify-between mb-2">
            {isFullyBooked && <Badge variant="destructive">Full</Badge>}
            {isLowAvailability && !isFullyBooked && (
              <Badge variant="secondary">Few Spots Left</Badge>
            )}
            {session.isBooked && <Badge variant="default">Booked</Badge>}
          </div>
        )}
        <CardTitle className="text-xl">{session.name}</CardTitle>
        <CardDescription className="text-base">
          {session.instructor ? `with ${session.instructor}` : "Instructor TBA"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col">
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        )}
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
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
        <Button
          className="w-full mt-auto"
          onClick={() => onBookClick(session)}
          disabled={session.isBooked || isFullyBooked || session.isPast}
          variant={session.isBooked ? "secondary" : "default"}
          size="lg"
        >
          {session.isBooked
            ? "Already Booked"
            : isFullyBooked
            ? "Fully Booked"
            : session.isPast
            ? "Past Class"
            : "Book Class"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default Classes;

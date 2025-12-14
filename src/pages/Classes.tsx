import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, CalendarDays, Grid3x3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ClassCardSkeletons } from "@/components/loading/ClassCardSkeleton";
import { ClassCalendarView } from "@/components/calendar/ClassCalendarView";
import { ClassCard } from "@/components/class/ClassCard";
import { useDebounce } from "@/hooks/useDebounce";
import { useCategories } from "@/hooks/queries/useCategories";
import { useQuery } from "@tanstack/react-query";

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
  class_id: string | null;
}

const CLASSES_PER_PAGE = 12;

const Classes = () => {
  const navigate = useNavigate();
  
  // React Query hooks
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [visibleCount, setVisibleCount] = useState(CLASSES_PER_PAGE);
  const [viewMode, setViewMode] = useState<"grid" | "calendar">("grid");
  const [calendarViewMode, setCalendarViewMode] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Fetch active classes with category info
  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ["classes", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
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
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) throw error;
      return (data || []) as ClassType[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch upcoming sessions for calendar view
  const { data: allSessions = [] } = useQuery({
    queryKey: ["sessions", "upcoming"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("class_sessions")
        .select("*")
        .gte("start_time", now)
        .order("start_time", { ascending: true });

      if (error) throw error;
      return (data || []) as ClassSession[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const loading = classesLoading || categoriesLoading;

  // Filter classes based on search and category
  const filteredClasses = useMemo(() => {
    let filtered = classes;

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((classItem) => {
        return classItem.category_id === selectedCategory || 
               classItem.class_categories?.id === selectedCategory;
      });
    }

    // Search filter
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (classItem) =>
          classItem.name.toLowerCase().includes(query) ||
          classItem.description?.toLowerCase().includes(query) ||
          classItem.class_categories?.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [classes, selectedCategory, debouncedSearchQuery]);

  // Paginated classes
  const visibleClasses = useMemo(() => {
    return filteredClasses.slice(0, visibleCount);
  }, [filteredClasses, visibleCount]);

  const hasMore = visibleClasses.length < filteredClasses.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + CLASSES_PER_PAGE);
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setVisibleCount(CLASSES_PER_PAGE); // Reset pagination when filter changes
    // Scroll to top of class list
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClassClick = (classId: string) => {
    navigate(`/classes/${classId}`);
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
              onClick={() => {
                setSelectedCategory("all");
                setVisibleCount(CLASSES_PER_PAGE);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="rounded-full"
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryClick(category.id)}
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
              See Calendar
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search classes..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleCount(CLASSES_PER_PAGE);
              }}
              className="pl-10"
            />
          </div>
        </div>

        {/* View Mode Toggle */}
        {viewMode === "calendar" ? (
          <ClassCalendarView
            sessions={allSessions.map(s => ({
              id: s.id,
              name: s.name,
              instructor: s.instructor,
              start_time: s.start_time,
              end_time: s.end_time,
              capacity: s.capacity,
            }))}
            onDateClick={(date) => {
              setSelectedDate(date);
            }}
            onSessionClick={(session) => {
              // Navigate to class detail page if we have class_id
              const sessionData = allSessions.find(s => s.id === session.id);
              if (sessionData?.class_id) {
                navigate(`/classes/${sessionData.class_id}`);
              }
            }}
            selectedDate={selectedDate}
            viewMode={calendarViewMode}
            onViewModeChange={setCalendarViewMode}
          />
        ) : (
          <>
            {/* Results Count */}
            <div className="mb-4 text-sm text-muted-foreground">
              Showing {visibleClasses.length} of {filteredClasses.length} classes
            </div>

            {/* Classes Grid */}
            {filteredClasses.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">
                    {searchQuery || selectedCategory !== "all"
                      ? "No classes match your filters. Try adjusting your search."
                      : "No classes available at the moment. Check back soon!"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {visibleClasses.map((classItem) => {
                    const displayImage = classItem.image_url || classItem.class_categories?.image_url;
                    const categoryName = classItem.class_categories?.name || classItem.category;
                    
                    return (
                      <ClassCard
                        key={classItem.id}
                        id={classItem.id}
                        name={classItem.name}
                        description={classItem.description}
                        imageUrl={displayImage}
                        categoryName={categoryName}
                        onClick={() => handleClassClick(classItem.id)}
                      />
                    );
                  })}
                </div>

                {/* Load More Button */}
                {hasMore && (
                  <div className="flex justify-center mt-8">
                    <Button
                      onClick={handleLoadMore}
                      variant="outline"
                      size="lg"
                      className="min-w-[200px]"
                    >
                      Load More
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};


export default Classes;

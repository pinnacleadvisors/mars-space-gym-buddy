import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Instructor {
  name: string;
  class_count: number;
  session_count: number;
}

const QUERY_KEY = ["instructors"] as const;

/**
 * Hook to fetch all instructors with their class and session counts
 */
export const useInstructors = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      // Get unique instructors from classes
      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select("instructor");

      if (classesError) throw classesError;

      // Get unique instructors from sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("class_sessions")
        .select("instructor");

      if (sessionsError) throw sessionsError;

      // Combine and count
      const instructorMap = new Map<string, { class_count: number; session_count: number }>();

      classesData?.forEach((c) => {
        if (c.instructor) {
          const existing = instructorMap.get(c.instructor) || { class_count: 0, session_count: 0 };
          instructorMap.set(c.instructor, { ...existing, class_count: existing.class_count + 1 });
        }
      });

      sessionsData?.forEach((s) => {
        if (s.instructor) {
          const existing = instructorMap.get(s.instructor) || { class_count: 0, session_count: 0 };
          instructorMap.set(s.instructor, { ...existing, session_count: existing.session_count + 1 });
        }
      });

      const instructorList: Instructor[] = Array.from(instructorMap.entries()).map(([name, counts]) => ({
        name,
        ...counts,
      }));

      return instructorList.sort((a, b) => a.name.localeCompare(b.name));
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (instructors change infrequently)
  });
};


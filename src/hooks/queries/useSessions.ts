import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showErrorToast, showSuccessToast } from "@/lib/utils/toastHelpers";

export interface ClassSession {
  id: string;
  class_id: string | null;
  name: string;
  instructor: string | null;
  start_time: string;
  end_time: string;
  capacity: number | null;
  created_at: string;
  classes?: {
    name: string;
    category: string | null;
  };
}

export interface SessionCapacity {
  session_id: string;
  capacity: number;
  booked: number;
  available: number;
}

const QUERY_KEY = ["sessions"] as const;
const CAPACITY_QUERY_KEY = ["session-capacities"] as const;

/**
 * Hook to fetch class sessions
 */
export const useSessions = (limit: number = 100) => {
  return useQuery({
    queryKey: [...QUERY_KEY, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_sessions")
        .select("*, classes(name, category)")
        .order("start_time", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as ClassSession[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (sessions change more frequently)
  });
};

/**
 * Hook to fetch session capacities using the RPC function
 * This replaces the N+1 query pattern
 */
export const useSessionCapacities = (sessionIds: string[]) => {
  return useQuery({
    queryKey: [...CAPACITY_QUERY_KEY, sessionIds.sort().join(",")],
    queryFn: async () => {
      if (sessionIds.length === 0) return new Map<string, SessionCapacity>();

      const { data, error } = await supabase.rpc("get_session_capacities", {
        session_ids: sessionIds,
      });

      if (error) throw error;

      const capacityMap = new Map<string, SessionCapacity>();
      (data || []).forEach((item: SessionCapacity) => {
        capacityMap.set(item.session_id, item);
      });

      return capacityMap;
    },
    enabled: sessionIds.length > 0,
    staleTime: 1 * 60 * 1000, // 1 minute (capacities change frequently)
  });
};

/**
 * Hook to create class sessions
 */
export const useCreateSessions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessions: Omit<ClassSession, "id" | "created_at">[]) => {
      const { data, error } = await supabase
        .from("class_sessions")
        .insert(sessions)
        .select();

      if (error) throw error;
      return data as ClassSession[];
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CAPACITY_QUERY_KEY });
      showSuccessToast(`Created ${data.length} session(s) successfully`);
    },
    onError: (error: any) => {
      showErrorToast({
        title: "Error creating sessions",
        description: error.message || "Failed to create session(s)",
      });
    },
  });
};

/**
 * Hook to update a session
 */
export const useUpdateSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...sessionData }: Partial<ClassSession> & { id: string }) => {
      const { data, error } = await supabase
        .from("class_sessions")
        .update(sessionData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as ClassSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CAPACITY_QUERY_KEY });
      showSuccessToast("Session updated successfully");
    },
    onError: (error: any) => {
      showErrorToast({
        title: "Error updating session",
        description: error.message || "Failed to update session",
      });
    },
  });
};

/**
 * Hook to delete a session
 */
export const useDeleteSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("class_sessions").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CAPACITY_QUERY_KEY });
      showSuccessToast("Session deleted successfully");
    },
    onError: (error: any) => {
      showErrorToast({
        title: "Error deleting session",
        description: error.message || "Failed to delete session",
      });
    },
  });
};

/**
 * Hook to update session capacity
 */
export const useUpdateSessionCapacity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, capacity }: { id: string; capacity: number }) => {
      const { data, error } = await supabase
        .from("class_sessions")
        .update({ capacity })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as ClassSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CAPACITY_QUERY_KEY });
      showSuccessToast("Session capacity updated successfully");
    },
    onError: (error: any) => {
      showErrorToast({
        title: "Error updating capacity",
        description: error.message,
      });
    },
  });
};


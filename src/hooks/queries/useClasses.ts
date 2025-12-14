import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showErrorToast, showSuccessToast } from "@/lib/utils/toastHelpers";

export interface Class {
  id: string;
  name: string;
  description: string | null;
  instructor: string;
  schedule: string;
  duration: number;
  capacity: number;
  category: string | null;
  category_id: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at?: string;
}

const QUERY_KEY = ["classes"] as const;

/**
 * Hook to fetch all classes
 */
export const useClasses = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as Class[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to create a new class
 */
export const useCreateClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (classData: Partial<Class>) => {
      const { data, error } = await supabase
        .from("classes")
        .insert([classData])
        .select()
        .single();

      if (error) throw error;
      return data as Class;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      showSuccessToast("Class created successfully");
    },
    onError: (error: any) => {
      showErrorToast({
        title: "Error creating class",
        description: error.message,
      });
    },
  });
};

/**
 * Hook to update a class
 */
export const useUpdateClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...classData }: Partial<Class> & { id: string }) => {
      const { data, error } = await supabase
        .from("classes")
        .update(classData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Class;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      showSuccessToast("Class updated successfully");
    },
    onError: (error: any) => {
      showErrorToast({
        title: "Error updating class",
        description: error.message,
      });
    },
  });
};

/**
 * Hook to delete a class
 */
export const useDeleteClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("classes").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      showSuccessToast("Class deleted successfully");
    },
    onError: (error: any) => {
      showErrorToast({
        title: "Error deleting class",
        description: error.message,
      });
    },
  });
};


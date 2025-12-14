import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showErrorToast, showSuccessToast } from "@/lib/utils/toastHelpers";

export interface ClassCategory {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

const QUERY_KEY = ["categories"] as const;

/**
 * Hook to fetch all class categories
 */
export const useCategories = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_categories" as any)
        .select("*")
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      return (data || []) as ClassCategory[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (categories change infrequently)
  });
};

/**
 * Hook to create a category
 */
export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryData: Partial<ClassCategory>) => {
      const { data, error } = await supabase
        .from("class_categories" as any)
        .insert([categoryData])
        .select()
        .single();

      if (error) throw error;
      return data as ClassCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      showSuccessToast("Category created successfully");
    },
    onError: (error: any) => {
      showErrorToast({
        title: "Error creating category",
        description: error.message,
      });
    },
  });
};

/**
 * Hook to update a category
 */
export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...categoryData }: Partial<ClassCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from("class_categories" as any)
        .update(categoryData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as ClassCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      showSuccessToast("Category updated successfully");
    },
    onError: (error: any) => {
      showErrorToast({
        title: "Error updating category",
        description: error.message,
      });
    },
  });
};

/**
 * Hook to delete a category
 */
export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("class_categories" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      showSuccessToast("Category deleted successfully");
    },
    onError: (error: any) => {
      showErrorToast({
        title: "Error deleting category",
        description: error.message,
      });
    },
  });
};


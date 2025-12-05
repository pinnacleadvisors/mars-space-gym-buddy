import { supabase } from "@/integrations/supabase/client";
import { showErrorToast } from "./toastHelpers";

/**
 * Upload a class image to Supabase Storage
 * @param file - The image file to upload
 * @param classId - The ID of the class (used for file naming)
 * @returns Promise<string> - The public URL of the uploaded image
 */
export async function uploadClassImage(
  file: File,
  classId: string
): Promise<string> {
  try {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      throw new Error("Please upload an image file.");
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("Please upload an image smaller than 5MB.");
    }

    // Upload to Supabase Storage
    const fileExt = file.name.split(".").pop();
    const fileName = `${classId}-${Date.now()}.${fileExt}`;
    const filePath = `${classId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("class-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("class-images")
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error: any) {
    console.error("Error uploading class image:", error);
    throw error;
  }
}

/**
 * Upload a category image to Supabase Storage
 * @param file - The image file to upload
 * @param categoryId - The ID of the category (used for file naming)
 * @returns Promise<string> - The public URL of the uploaded image
 */
export async function uploadCategoryImage(
  file: File,
  categoryId: string
): Promise<string> {
  try {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      throw new Error("Please upload an image file.");
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("Please upload an image smaller than 5MB.");
    }

    // Upload to Supabase Storage
    const fileExt = file.name.split(".").pop();
    const fileName = `${categoryId}-${Date.now()}.${fileExt}`;
    const filePath = `${categoryId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("category-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("category-images")
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error: any) {
    console.error("Error uploading category image:", error);
    throw error;
  }
}

/**
 * Delete an image from Supabase Storage
 * @param url - The public URL of the image to delete
 * @param bucket - The storage bucket name ('class-images' or 'category-images')
 * @returns Promise<void>
 */
export async function deleteImage(
  url: string,
  bucket: "class-images" | "category-images"
): Promise<void> {
  try {
    // Extract file path from URL
    // URL format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
    const urlParts = url.split(`/${bucket}/`);
    if (urlParts.length !== 2) {
      console.warn("Invalid image URL format, skipping deletion:", url);
      return;
    }

    const filePath = urlParts[1];

    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) {
      // Don't throw error if file doesn't exist
      if (error.message.includes("not found")) {
        console.warn("Image file not found, skipping deletion:", filePath);
        return;
      }
      throw error;
    }
  } catch (error: any) {
    console.error("Error deleting image:", error);
    // Don't throw - deletion failure shouldn't block the main operation
  }
}

/**
 * Extract file path from a Supabase Storage public URL
 * @param url - The public URL
 * @param bucket - The storage bucket name
 * @returns The file path or null if URL is invalid
 */
export function extractFilePathFromUrl(
  url: string,
  bucket: "class-images" | "category-images"
): string | null {
  const urlParts = url.split(`/${bucket}/`);
  if (urlParts.length !== 2) {
    return null;
  }
  return urlParts[1];
}


import { z } from "zod";

/**
 * Class name validation schema
 */
export const classNameSchema = z
  .string()
  .min(1, "Class name is required")
  .max(100, "Class name must be less than 100 characters")
  .trim();

/**
 * Description validation schema
 */
export const descriptionSchema = z
  .string()
  .max(1000, "Description must be less than 1000 characters")
  .trim()
  .optional()
  .or(z.literal(""));

/**
 * Instructor name validation schema
 */
export const instructorSchema = z
  .string()
  .min(1, "Instructor name is required")
  .max(100, "Instructor name must be less than 100 characters")
  .regex(
    /^[a-zA-Z\s'-]+$/,
    "Instructor name can only contain letters, spaces, hyphens, and apostrophes"
  )
  .trim();

/**
 * Category validation schema
 */
export const categorySchema = z
  .string()
  .max(50, "Category must be less than 50 characters")
  .trim()
  .optional()
  .or(z.literal(""));

/**
 * Duration validation schema (in minutes)
 */
export const durationSchema = z
  .number()
  .int("Duration must be a whole number")
  .min(5, "Duration must be at least 5 minutes")
  .max(480, "Duration must be less than 8 hours (480 minutes)");

/**
 * Capacity validation schema
 */
export const capacitySchema = z
  .number()
  .int("Capacity must be a whole number")
  .min(1, "Capacity must be at least 1")
  .max(1000, "Capacity must be less than 1000")
  .optional()
  .nullable();

/**
 * Schedule validation schema
 */
export const scheduleSchema = z
  .string()
  .max(200, "Schedule must be less than 200 characters")
  .trim()
  .optional()
  .or(z.literal(""));

/**
 * Class creation/update validation schema
 */
export const classSchema = z.object({
  name: classNameSchema,
  description: descriptionSchema,
  instructor: instructorSchema,
  category: categorySchema,
  duration: durationSchema,
  capacity: capacitySchema,
  schedule: scheduleSchema,
  image_url: z
    .string()
    .url("Image URL must be a valid URL")
    .max(500, "Image URL must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  is_active: z.boolean().optional().default(true),
});

export type ClassFormData = z.infer<typeof classSchema>;

/**
 * Class session validation schema
 */
export const classSessionSchema = z.object({
  class_id: z.string().uuid("Invalid class ID").optional().nullable(),
  name: classNameSchema,
  instructor: instructorSchema,
  start_time: z.coerce.date({
    required_error: "Start time is required",
    invalid_type_error: "Invalid start time",
  }),
  end_time: z.coerce.date({
    required_error: "End time is required",
    invalid_type_error: "Invalid end time",
  }),
  capacity: capacitySchema,
}).refine((data) => data.end_time > data.start_time, {
  message: "End time must be after start time",
  path: ["end_time"],
});

export type ClassSessionFormData = z.infer<typeof classSessionSchema>;


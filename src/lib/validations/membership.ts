import { z } from "zod";

/**
 * Membership name validation schema
 */
export const membershipNameSchema = z
  .string()
  .min(1, "Membership name is required")
  .max(100, "Membership name must be less than 100 characters")
  .trim();

/**
 * Price validation schema
 */
export const priceSchema = z
  .number()
  .positive("Price must be greater than 0")
  .max(100000, "Price must be less than 100,000")
  .multipleOf(0.01, "Price must have at most 2 decimal places");

/**
 * Duration days validation schema
 */
export const durationDaysSchema = z
  .number()
  .int("Duration must be a whole number")
  .min(1, "Duration must be at least 1 day")
  .max(3650, "Duration must be less than 10 years (3650 days)");

/**
 * Access level validation schema
 */
export const accessLevelSchema = z
  .string()
  .min(1, "Access level is required")
  .max(50, "Access level must be less than 50 characters")
  .trim();

/**
 * Membership creation/update validation schema
 */
export const membershipSchema = z.object({
  name: membershipNameSchema,
  price: priceSchema,
  duration_days: durationDaysSchema,
  access_level: accessLevelSchema,
});

export type MembershipFormData = z.infer<typeof membershipSchema>;


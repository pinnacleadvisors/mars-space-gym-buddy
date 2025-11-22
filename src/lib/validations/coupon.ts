import { z } from "zod";

/**
 * Coupon code validation schema
 */
export const couponCodeSchema = z
  .string()
  .min(1, "Coupon code is required")
  .max(50, "Coupon code must be less than 50 characters")
  .regex(/^[A-Z0-9_-]+$/, "Coupon code can only contain uppercase letters, numbers, hyphens, and underscores")
  .transform((val) => val.toUpperCase().trim());

/**
 * Coupon type validation schema
 */
export const couponTypeSchema = z.enum(["percentage", "money_off"], {
  errorMap: () => ({ message: "Coupon type must be either 'percentage' or 'money_off'" }),
});

/**
 * Coupon value validation schema (percentage: 0-100, money_off: > 0)
 */
export const couponValueSchema = z
  .number()
  .positive("Value must be greater than 0")
  .max(100000, "Value must be less than 100,000");

/**
 * Coupon value conditional validation
 * - Percentage: 0-100
 * - Money off: > 0
 */
export const couponValueConditionalSchema = z
  .number()
  .positive("Value must be greater than 0")
  .refine(
    (val, ctx) => {
      const type = ctx.path[0] === "type" ? ctx.parent?.type : undefined;
      if (type === "percentage") {
        return val <= 100;
      }
      return true;
    },
    {
      message: "Percentage value must be between 0 and 100",
    }
  );

/**
 * Usage limit validation schema
 */
export const usageLimitSchema = z
  .number()
  .int("Usage limit must be a whole number")
  .min(1, "Usage limit must be at least 1")
  .max(1000000, "Usage limit must be less than 1,000,000")
  .nullable()
  .optional();

/**
 * Description validation schema
 */
export const couponDescriptionSchema = z
  .string()
  .max(500, "Description must be less than 500 characters")
  .trim()
  .optional()
  .nullable();

/**
 * Coupon creation/update validation schema
 */
export const couponSchema = z
  .object({
    code: couponCodeSchema,
    type: couponTypeSchema,
    value: z
      .number()
      .positive("Value must be greater than 0")
      .max(100000, "Value must be less than 100,000"),
    description: couponDescriptionSchema,
    is_active: z.boolean().default(true),
    usage_limit: usageLimitSchema,
    valid_from: z.date(),
    valid_until: z.date().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.type === "percentage" && data.value > 100) {
        return false;
      }
      return true;
    },
    {
      message: "Percentage value must be between 0 and 100",
      path: ["value"],
    }
  )
  .refine(
    (data) => {
      if (data.valid_until && data.valid_until < data.valid_from) {
        return false;
      }
      return true;
    },
    {
      message: "Valid until date must be after valid from date",
      path: ["valid_until"],
    }
  );

export type CouponFormData = z.infer<typeof couponSchema>;


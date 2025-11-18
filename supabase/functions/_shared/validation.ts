/**
 * Server-side validation utilities for Edge Functions
 */

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.toLowerCase().trim());
}

/**
 * Validates UUID format
 */
export function validateUUID(uuid: string): boolean {
  if (!uuid || typeof uuid !== "string") return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Sanitizes string input
 */
export function sanitizeString(input: string): string {
  if (typeof input !== "string") return "";
  // Remove null bytes and control characters
  return input.replace(/\0/g, "").replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "").trim();
}

/**
 * Validates and sanitizes request body
 */
export function validateRequestBody<T extends Record<string, any>>(
  body: any,
  schema: Record<keyof T, (value: any) => boolean>
): { valid: boolean; data?: T; error?: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Invalid request body" };
  }

  const sanitized: any = {};

  for (const [key, validator] of Object.entries(schema)) {
    const value = body[key];
    
    if (value === undefined || value === null) {
      return { valid: false, error: `Missing required field: ${key}` };
    }

    if (typeof value === "string") {
      const sanitizedValue = sanitizeString(value);
      if (!validator(sanitizedValue)) {
        return { valid: false, error: `Invalid value for field: ${key}` };
      }
      sanitized[key] = sanitizedValue;
    } else {
      if (!validator(value)) {
        return { valid: false, error: `Invalid value for field: ${key}` };
      }
      sanitized[key] = value;
    }
  }

  return { valid: true, data: sanitized as T };
}

/**
 * Rate limiting check (simple in-memory implementation)
 * For production, use Redis or similar
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return false;
  }

  if (entry.count >= maxRequests) {
    return true;
  }

  entry.count++;
  return false;
}

/**
 * Gets client IP from request
 */
export function getClientIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "unknown";
}


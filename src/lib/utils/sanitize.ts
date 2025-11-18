/**
 * Sanitization utilities for user inputs
 */

/**
 * Sanitizes a string by removing potentially dangerous characters
 * @param input - The string to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  // Remove null bytes
  let sanitized = input.replace(/\0/g, "");

  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Sanitizes HTML by escaping special characters
 * @param input - The string to escape
 * @returns Escaped string safe for HTML display
 */
export function escapeHtml(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };

  return input.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Sanitizes an email address
 * @param email - The email to sanitize
 * @returns Sanitized email
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== "string") {
    return "";
  }

  // Remove whitespace and convert to lowercase
  let sanitized = email.trim().toLowerCase();

  // Remove any characters that aren't valid in email addresses
  // This is a basic sanitization - Zod validation will do the actual validation
  sanitized = sanitized.replace(/[^\w@.-]/g, "");

  return sanitized;
}

/**
 * Sanitizes a URL
 * @param url - The URL to sanitize
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== "string") {
    return "";
  }

  let sanitized = url.trim();

  // Basic URL validation - must start with http:// or https://
  if (!sanitized.match(/^https?:\/\//i)) {
    return "";
  }

  // Remove null bytes and control characters
  sanitized = sanitized.replace(/\0/g, "");
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");

  return sanitized;
}

/**
 * Sanitizes a number input
 * @param input - The input to sanitize
 * @returns Sanitized number or NaN if invalid
 */
export function sanitizeNumber(input: string | number): number {
  if (typeof input === "number") {
    return isNaN(input) ? NaN : input;
  }

  if (typeof input !== "string") {
    return NaN;
  }

  // Remove any non-numeric characters except decimal point and minus sign
  const cleaned = input.replace(/[^\d.-]/g, "");

  const num = parseFloat(cleaned);
  return isNaN(num) ? NaN : num;
}

/**
 * Sanitizes an object by recursively sanitizing all string values
 * @param obj - The object to sanitize
 * @returns Sanitized object
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj };

  for (const key in sanitized) {
    if (typeof sanitized[key] === "string") {
      sanitized[key] = sanitizeString(sanitized[key]);
    } else if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key]);
    }
  }

  return sanitized;
}


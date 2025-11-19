import { toast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Info, AlertCircle } from "lucide-react";

/**
 * Toast helper functions for standardized toast usage across the app
 */

export interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number; // Override default duration (in milliseconds)
  action?: React.ReactNode;
}

/**
 * Shows a success toast notification
 */
export const showSuccessToast = (options: ToastOptions | string) => {
  if (typeof options === "string") {
    return toast({
      variant: "success",
      title: "Success",
      description: options,
    });
  }

  return toast({
    variant: "success",
    title: options.title || "Success",
    description: options.description,
    duration: options.duration,
    action: options.action,
  });
};

/**
 * Shows an error toast notification
 */
export const showErrorToast = (options: ToastOptions | string) => {
  if (typeof options === "string") {
    return toast({
      variant: "destructive",
      title: "Error",
      description: options,
    });
  }

  return toast({
    variant: "destructive",
    title: options.title || "Error",
    description: options.description,
    duration: options.duration,
    action: options.action,
  });
};

/**
 * Shows an info toast notification
 */
export const showInfoToast = (options: ToastOptions | string) => {
  if (typeof options === "string") {
    return toast({
      variant: "info",
      title: "Info",
      description: options,
    });
  }

  return toast({
    variant: "info",
    title: options.title || "Info",
    description: options.description,
    duration: options.duration,
    action: options.action,
  });
};

/**
 * Shows a default toast notification
 */
export const showToast = (options: ToastOptions | string) => {
  if (typeof options === "string") {
    return toast({
      variant: "default",
      title: options,
    });
  }

  return toast({
    variant: "default",
    title: options.title,
    description: options.description,
    duration: options.duration,
    action: options.action,
  });
};

/**
 * Standard toast messages for common actions
 */
export const toastMessages = {
  // Success messages
  bookingCreated: (className: string) => ({
    variant: "success" as const,
    title: "Booking Confirmed!",
    description: `You've successfully booked ${className}.`,
  }),
  bookingCancelled: () => ({
    variant: "success" as const,
    title: "Booking Cancelled",
    description: "Your booking has been cancelled successfully.",
  }),
  loginSuccess: () => ({
    variant: "success" as const,
    title: "Welcome back!",
    description: "You have successfully logged in.",
  }),
  registrationSuccess: () => ({
    variant: "success" as const,
    title: "Account Created",
    description: "Your account has been created successfully.",
  }),
  passwordReset: () => ({
    variant: "success" as const,
    title: "Password Updated!",
    description: "Your password has been successfully reset.",
  }),
  profileUpdated: () => ({
    variant: "success" as const,
    title: "Profile Updated",
    description: "Your profile has been updated successfully.",
  }),

  // Error messages
  bookingFailed: (error?: string) => ({
    variant: "destructive" as const,
    title: "Booking Failed",
    description: error || "Failed to book class. Please try again.",
  }),
  cancellationFailed: (error?: string) => ({
    variant: "destructive" as const,
    title: "Cancellation Failed",
    description: error || "Failed to cancel booking. Please try again.",
  }),
  loginFailed: (error?: string) => ({
    variant: "destructive" as const,
    title: "Login Failed",
    description: error || "Invalid email or password. Please try again.",
  }),
  networkError: () => ({
    variant: "destructive" as const,
    title: "Network Error",
    description: "Please check your internet connection and try again.",
  }),
  sessionExpired: () => ({
    variant: "destructive" as const,
    title: "Session Expired",
    description: "Your session has expired. Please log in again.",
  }),

  // Info messages
  emailVerificationRequired: () => ({
    variant: "info" as const,
    title: "Email Verification Required",
    description: "Please verify your email address to access all features.",
  }),
  accountLocked: (timeRemaining: string) => ({
    variant: "destructive" as const,
    title: "Account Locked",
    description: `Too many failed login attempts. Please try again in ${timeRemaining}.`,
  }),
  classFull: () => ({
    variant: "destructive" as const,
    title: "Class Full",
    description: "This class is fully booked. Please try another session.",
  }),
  alreadyBooked: () => ({
    variant: "default" as const,
    title: "Already Booked",
    description: "You already have a booking for this class.",
  }),
};


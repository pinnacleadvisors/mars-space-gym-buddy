import { Suspense, ReactNode } from "react";
import { PageSkeleton } from "./PageSkeleton";

interface RouteSuspenseProps {
  children: ReactNode;
}

/**
 * Suspense wrapper for lazy-loaded routes
 * Provides consistent loading state across the application
 */
export const RouteSuspense = ({ children }: RouteSuspenseProps) => {
  return <Suspense fallback={<PageSkeleton />}>{children}</Suspense>;
};


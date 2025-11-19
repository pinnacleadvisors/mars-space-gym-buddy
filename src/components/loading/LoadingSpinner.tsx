import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

/**
 * Reusable loading spinner component
 */
export const LoadingSpinner = ({ 
  size = "md", 
  className,
  text 
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
};

/**
 * Full page loading spinner
 */
export const PageLoadingSpinner = ({ text = "Loading..." }: { text?: string }) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
};

/**
 * Inline loading spinner
 */
export const InlineLoadingSpinner = ({ text }: { text?: string }) => {
  return <LoadingSpinner size="sm" text={text} />;
};


import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

export interface InputWithErrorProps extends React.ComponentProps<"input"> {
  error?: boolean;
  errorMessage?: string;
}

/**
 * Enhanced Input component with error state styling
 * Shows red border and error icon when error is true
 */
const InputWithError = React.forwardRef<HTMLInputElement, InputWithErrorProps>(
  ({ className, type, error, errorMessage, ...props }, ref) => {
    return (
      <div className="relative">
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-colors",
            error
              ? "border-destructive focus-visible:ring-destructive"
              : "border-input focus-visible:ring-ring",
            className,
          )}
          ref={ref}
          aria-invalid={error}
          aria-describedby={error && errorMessage ? "error-message" : undefined}
          {...props}
        />
        {error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <AlertCircle className="h-4 w-4 text-destructive" />
          </div>
        )}
      </div>
    );
  },
);
InputWithError.displayName = "InputWithError";

export { InputWithError };


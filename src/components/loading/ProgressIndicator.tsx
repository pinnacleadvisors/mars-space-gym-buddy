import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface ProgressIndicatorProps {
  progress?: number; // 0-100
  message?: string;
  title?: string;
  showSpinner?: boolean;
}

/**
 * Progress indicator for long-running operations
 */
export const ProgressIndicator = ({
  progress,
  message,
  title = "Processing...",
  showSpinner = true,
}: ProgressIndicatorProps) => {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {showSpinner && <Loader2 className="w-5 h-5 animate-spin" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {progress !== undefined && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground text-center">
              {progress}%
            </p>
          </div>
        )}
        {message && (
          <p className="text-sm text-muted-foreground text-center">
            {message}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Full page progress indicator
 */
export const PageProgressIndicator = (props: ProgressIndicatorProps) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <ProgressIndicator {...props} />
    </div>
  );
};


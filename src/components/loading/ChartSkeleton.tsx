import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * Skeleton loader for charts
 */
export const ChartSkeleton = () => {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32 mt-2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  );
};

/**
 * Multiple chart skeletons
 */
export const ChartSkeletons = ({ count = 2 }: { count?: number }) => {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <ChartSkeleton key={i} />
      ))}
    </div>
  );
};


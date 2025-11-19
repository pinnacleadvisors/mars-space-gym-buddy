import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * Skeleton loader for booking cards
 */
export const BookingCardSkeleton = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex gap-2 mt-4">
          <Skeleton className="h-9 w-20" />
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Multiple booking card skeletons
 */
export const BookingCardSkeletons = ({ count = 4 }: { count?: number }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <BookingCardSkeleton key={i} />
      ))}
    </div>
  );
};


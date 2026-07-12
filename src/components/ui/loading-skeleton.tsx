// src/components/ui/loading-skeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingSkeleton({ type = "default" }: { type?: "default" | "table" | "chart" }) {
  if (type === "table") {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (type === "chart") {
    return <Skeleton className="h-96 w-full rounded-3xl" />;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-3xl" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Skeleton key={i} className="h-96 w-full rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
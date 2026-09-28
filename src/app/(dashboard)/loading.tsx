import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardRouteLoading() {
  return (
    <div className="space-y-6 pb-16" aria-label="Loading content">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-3.5 w-full max-w-sm" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-24 rounded-xl bg-white" />)}
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.5fr_0.9fr]">
        <Skeleton className="h-72 rounded-xl bg-white" />
        <Skeleton className="h-72 rounded-xl bg-white" />
      </div>
    </div>
  );
}

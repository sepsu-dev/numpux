import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-[#f7f8f5] p-5 sm:p-8" aria-label="Loading page">
      <div className="mx-auto max-w-6xl space-y-7">
        <div className="space-y-3">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-28 rounded-xl bg-white" />)}
        </div>
        <div className="grid gap-5 lg:grid-cols-[1.5fr_0.9fr]">
          <Skeleton className="h-72 rounded-xl bg-white" />
          <Skeleton className="h-72 rounded-xl bg-white" />
        </div>
      </div>
    </main>
  );
}

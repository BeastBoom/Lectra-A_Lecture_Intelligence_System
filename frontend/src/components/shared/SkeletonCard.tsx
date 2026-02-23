import { cn } from "@/lib/utils";

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border p-5 space-y-3", className)}>
      <div className="h-4 w-2/3 rounded shimmer" />
      <div className="h-3 w-full rounded shimmer" />
      <div className="h-3 w-4/5 rounded shimmer" />
      <div className="flex gap-2 mt-2">
        <div className="h-6 w-16 rounded-full shimmer" />
        <div className="h-6 w-20 rounded-full shimmer" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
          <div className="h-10 w-10 rounded-lg shimmer shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/2 rounded shimmer" />
            <div className="h-2.5 w-3/4 rounded shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}

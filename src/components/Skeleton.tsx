import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

export function ReportCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="p-5 space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-card">
      <Skeleton className="h-3.5 w-28" />
      <Skeleton className="mt-3 h-8 w-16" />
      <Skeleton className="mt-2 h-3 w-20" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 6 }) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="border-b bg-muted/50 px-4 py-3">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-3 flex-1" />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 border-b px-4 py-3">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-6 space-y-3">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 lg:grid-cols-3">
        <CardSkeleton />
        <div className="lg:col-span-2 space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
}

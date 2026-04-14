"use client";

export function IncidentSkeleton() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-border)] mt-1.5" />
        <div className="flex-1">
          <div className="h-4 bg-[var(--color-border)] rounded w-3/4 mb-2" />
          <div className="h-3 bg-[var(--color-border)] rounded w-1/2 mb-3" />
          <div className="flex gap-4">
            <div className="h-3 bg-[var(--color-border)] rounded w-12" />
            <div className="h-3 bg-[var(--color-border)] rounded w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TimelineSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-3 py-2 px-3 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
          <div className="h-3 bg-[var(--color-border)] rounded w-14" />
          <div className="h-3 bg-[var(--color-border)] rounded w-16" />
          <div className="h-3 bg-[var(--color-border)] rounded flex-1" />
        </div>
      ))}
    </div>
  );
}

export function RemediationSkeleton() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 bg-[var(--color-border)] rounded w-2/3" />
        <div className="flex gap-2">
          <div className="h-5 bg-[var(--color-border)] rounded-full w-12" />
          <div className="h-5 bg-[var(--color-border)] rounded-full w-16" />
        </div>
      </div>
      <div className="h-3 bg-[var(--color-border)] rounded w-full mb-2" />
      <div className="h-3 bg-[var(--color-border)] rounded w-4/5 mb-4" />
      <div className="h-16 bg-[var(--color-bg)] rounded-lg" />
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-4 h-4 bg-[var(--color-border)] rounded" />
        <div className="h-3 bg-[var(--color-border)] rounded w-16" />
      </div>
      <div className="h-6 bg-[var(--color-border)] rounded w-12" />
    </div>
  );
}

/** Placeholder shown inside the app shell while a page loads, so navigation responds at once. */
export function PageSkeleton() {
  return (
    <div role="status" aria-live="polite" className="flex animate-pulse flex-col gap-6">
      <span className="sr-only">Loading…</span>
      <div className="flex flex-col gap-2">
        <div className="h-8 w-64 max-w-full rounded-control bg-surface-2" />
        <div className="h-4 w-96 max-w-full rounded-control bg-surface-2" />
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 rounded-card bg-surface-2" />
        ))}
      </div>
      <div className="h-5 w-48 rounded-control bg-surface-2" />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col overflow-hidden rounded-card border border-line">
            <div className="h-[150px] bg-surface-2" />
            <div className="flex flex-col gap-2 p-3">
              <div className="h-4 w-4/5 rounded bg-surface-2" />
              <div className="h-3 w-1/2 rounded bg-surface-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

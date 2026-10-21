export default function SearchLoading() {
  return (
    <div>
      <div className="border-b border-border bg-white px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1600px] flex-wrap gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-9 w-28 animate-pulse rounded-sm bg-[var(--mist)]"
            />
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex gap-6">
          <div className="h-4 w-28 animate-pulse rounded-sm bg-[var(--mist)]" />
          <div className="h-4 w-24 animate-pulse rounded-sm bg-[var(--mist)]" />
          <div className="h-4 w-20 animate-pulse rounded-sm bg-[var(--mist)]" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
          <div className="space-y-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/3] rounded-sm bg-[var(--mist)]" />
                <div className="mt-3 h-4 w-3/4 rounded-sm bg-[var(--mist)]" />
                <div className="mt-2 h-3 w-1/2 rounded-sm bg-[var(--mist)]" />
                <div className="mt-3 flex gap-4">
                  <div className="h-3 w-16 rounded-sm bg-[var(--mist)]" />
                  <div className="h-3 w-16 rounded-sm bg-[var(--mist)]" />
                  <div className="h-3 w-20 rounded-sm bg-[var(--mist)]" />
                </div>
              </div>
            ))}
          </div>
          <div className="hidden h-[calc(100vh-13rem)] animate-pulse rounded-sm bg-[var(--mist)] lg:block" />
        </div>
      </div>
    </div>
  );
}

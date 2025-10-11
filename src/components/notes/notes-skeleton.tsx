// src/components/notes/notes-skeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";

export function NotesSkeleton() {
  return (
    <div className="space-y-8">
      {/* Pinned section */}
      <section>
        <Skeleton className="mb-4 h-6 w-32" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <NoteCardSkeleton key={i} />
          ))}
        </div>
      </section>

      {/* Recent section */}
      <section>
        <Skeleton className="mb-4 h-6 w-32" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <NoteCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}

function NoteCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-2 flex items-start justify-between">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>
      <div className="mb-3 flex items-center gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="mb-3 flex gap-2">
        <Skeleton className="h-5 w-16 rounded-md" />
        <Skeleton className="h-5 w-20 rounded-md" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="mt-1 h-4 w-5/6" />
    </div>
  );
}

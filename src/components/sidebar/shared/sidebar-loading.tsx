import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shared loading skeleton for sidebar sections
 *
 * Shows animated loading placeholders while data is fetching.
 *
 * @param count - Number of skeleton items to show (default: 3)
 *
 * @example
 * {isLoading && <SidebarLoading count={5} />}
 */
interface SidebarLoadingProps {
  count?: number;
}

export function SidebarLoading({ count = 3 }: SidebarLoadingProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="px-2 py-1.5">
          <Skeleton className="h-12 w-full rounded-md" />
        </div>
      ))}
    </>
  );
}

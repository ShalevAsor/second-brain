/**
 * Shared empty state component for sidebar sections
 *
 * Used when a section has no items to display.
 *
 * @example
 * <SidebarEmptyState message="No folders yet" />
 */
interface SidebarEmptyStateProps {
  message: string;
}

export function SidebarEmptyState({ message }: SidebarEmptyStateProps) {
  return (
    <div className="px-2 py-4 text-sm text-center text-muted-foreground">
      {message}
    </div>
  );
}

"use client";

import { ChevronRight, ChevronDown, LucideIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface SidebarSectionProps {
  title: string;
  icon?: LucideIcon;
  count?: number;
  isOpen?: boolean;
  onToggle?: () => void;
  collapsible?: boolean;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Sidebar Section Component
 *
 * A collapsible section in the sidebar with optional icon, count, and actions.
 * State is managed externally (typically by useSidebarUIStore).
 *
 * Features:
 * - Collapsible with chevron indicator
 * - Optional icon and count badge
 * - Action buttons that don't trigger collapse
 * - Controlled state (isOpen/onToggle)
 * - Non-collapsible mode for static sections
 */
export function SidebarSection({
  title,
  icon: Icon,
  count,
  isOpen = true,
  onToggle,
  collapsible = true,
  actions,
  children,
  className,
}: SidebarSectionProps) {
  // Non-collapsible section (e.g., Quick Actions)
  if (!collapsible) {
    return (
      <SidebarGroup
        className={cn("group-data-[collapsible=icon]:hidden", className)}
      >
        <SidebarGroupLabel>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {Icon && <Icon className="h-4 w-4" />}
              <span>{title}</span>
              {count !== undefined && (
                <span className="text-xs text-muted-foreground">({count})</span>
              )}
            </div>
            {actions}
          </div>
        </SidebarGroupLabel>
        <SidebarGroupContent>{children}</SidebarGroupContent>
      </SidebarGroup>
    );
  }

  // Collapsible section
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <SidebarGroup
        className={cn("group-data-[collapsible=icon]:hidden", className)}
      >
        <SidebarGroupLabel asChild>
          {/* Wrapper div to hold both trigger and actions */}
          <div className="flex items-center justify-between w-full gap-2">
            <CollapsibleTrigger className="flex-1 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors cursor-pointer">
              <div className="flex items-center gap-2 py-1.5">
                {/* Chevron indicator */}
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}

                {/* Section icon */}
                {Icon && <Icon className="h-4 w-4" />}

                {/* Section title */}
                <span>{title}</span>

                {/* Item count badge */}
                {count !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    ({count})
                  </span>
                )}
              </div>
            </CollapsibleTrigger>

            {/* Action buttons - now OUTSIDE the CollapsibleTrigger */}
            {actions && <div className="flex items-center">{actions}</div>}
          </div>
        </SidebarGroupLabel>

        <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
          <SidebarGroupContent>{children}</SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

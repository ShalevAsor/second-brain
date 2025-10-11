"use client";

import * as React from "react";
import { User } from "@prisma/client";

import { SidebarHeaderLogo } from "./sidebar-header-logo";
import { NavUser } from "./user";
import { NavQuickActions } from "./quick-actions";
import { NavFolders } from "./folders";
import { NavTags } from "./tags";
import { NavFavorites } from "./favorites";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

/**
 * Props for AppSidebar
 *
 * Extends all props from the base Sidebar component,
 * plus adds a required `user` prop.
 *
 * This allows passing through Sidebar props like:
 * - collapsible: "icon" | "offcanvas" | "none"
 * - className: string
 * - side: "left" | "right"
 * - variant: "sidebar" | "floating" | "inset"
 *
 * While also requiring our custom `user` data.
 */
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: User;
}

/**
 * App Sidebar Component
 *
 * Main application sidebar containing navigation and organizational tools.
 *
 * Features:
 * - User profile footer
 * - Quick actions (Quick Capture, New Note, Search)
 * - Folders section with hierarchy
 * - Tags section
 * - Favorites section
 * - Collapsible with icon mode
 *
 * State Management:
 * - Section open/closed state: Zustand (useSidebarUIStore)
 * - Folder selection/expansion: Zustand (useFolderStore)
 * - Folder data: React Query (useFolders)
 * - Favorites data: React Query (useFavoriteNotes)
 */
export function AppSidebar({ user, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      {/* Header with logo and app name */}
      <SidebarHeader>
        <SidebarHeaderLogo />
      </SidebarHeader>

      {/* Main navigation content */}
      <SidebarContent>
        {/* Quick Actions: Quick Capture, New Note, Search */}
        <NavQuickActions />

        {/* Folders: Hierarchical folder structure */}
        <NavFolders />

        {/* Tags: Tag-based organization */}
        <NavTags />

        {/* Favorites: Starred notes */}
        <NavFavorites />
      </SidebarContent>

      {/* Footer with user profile */}
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>

      {/* Drag handle rail */}
      <SidebarRail />
    </Sidebar>
  );
}

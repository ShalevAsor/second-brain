"use client";

import { Home, Plus, Search, FileEdit } from "lucide-react";
import Link from "next/link";
import { useModalStore } from "@/stores/modalStore";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

/**
 * Quick Actions Navigation
 * Primary navigation items for quick access to main features
 */
export function NavQuickActions() {
  const { onOpen } = useModalStore();

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {/* Home */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/notes">
                <Home />
                <span>Home</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Quick Capture - PRIMARY */}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => onOpen("quickCapture")}
              className="bg-primary/10 hover:bg-primary/20 text-primary font-medium"
            >
              <Plus className="h-5 w-5" />
              <span>Quick Capture</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* New Note - SECONDARY */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/notes/new">
                <FileEdit />
                <span>New Note</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Search */}
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Search />
              <span>Search</span>
              <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

import Link from "next/link";
import { Brain } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

/**
 * Sidebar Header Logo Component
 *
 * Displays the app branding (logo + name) in the sidebar header.
 * Clicking navigates to the home page.
 *
 * Features:
 * - Brain icon with primary color background
 * - App name and tagline
 * - Clickable link to home
 * - Responsive to sidebar collapse state
 */
export function SidebarHeaderLogo() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" asChild>
          <Link href="/">
            {/* Logo icon */}
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Brain className="size-4" />
            </div>

            {/* App name and tagline */}
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">Second Brain</span>
              <span className="truncate text-xs">STEM Notes</span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

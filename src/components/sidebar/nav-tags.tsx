"use client";

import { Tag } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";

// Sample data - will be replaced with DB data later
const sampleTags = [
  { name: "python", count: 12 },
  { name: "recursion", count: 8 },
  { name: "midterm", count: 15 },
  { name: "important", count: 6 },
];

export function NavTags() {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Tags</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {sampleTags.map((tag) => (
            <SidebarMenuItem key={tag.name}>
              <SidebarMenuButton>
                <Tag className="size-4" />
                <span>#{tag.name}</span>
              </SidebarMenuButton>
              <SidebarMenuBadge>{tag.count}</SidebarMenuBadge>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

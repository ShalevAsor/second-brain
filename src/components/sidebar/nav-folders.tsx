"use client";

import { ChevronRight, Folder } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from "@/components/ui/sidebar";

// Sample data - will be replaced with DB data later
const sampleFolders = [
  {
    name: "CS 101",
    children: [{ name: "Algorithms" }, { name: "Data Structures" }],
  },
  {
    name: "Math 201",
    children: [{ name: "Calculus" }, { name: "Linear Algebra" }],
  },
  { name: "Physics 101" },
];

interface FolderItem {
  name: string;
  children?: FolderItem[];
}

export function NavFolders() {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Folders</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {sampleFolders.map((folder, index) => (
            <FolderTree key={index} item={folder} />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function FolderTree({ item }: { item: FolderItem }) {
  if (!item.children || item.children.length === 0) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton>
          <Folder className="size-4" />
          <span>{item.name}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <Collapsible
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
        defaultOpen={item.name === "CS 101"}
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton>
            <ChevronRight className="transition-transform size-4" />
            <Folder className="size-4" />
            <span>{item.name}</span>
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children.map((child, index) => (
              <FolderTree key={index} item={child} />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}

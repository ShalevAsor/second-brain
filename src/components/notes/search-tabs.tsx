// src/components/notes/search-tabs.tsx
"use client";

import { Search, Sparkles } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { NoteView } from "@/app/(main)/notes/page";

interface SearchTabsProps {
  view: NoteView;
}

export function SearchTabs({ view }: SearchTabsProps) {
  const [activeTab, setActiveTab] = useState("search");

  // Get placeholder text based on view
  const getPlaceholder = () => {
    if (view === "folder") return "Filter in this folder...";
    if (view === "tag") return "Filter in this tag...";
    if (view === "favorites") return "Filter favorites...";
    return "Search by keyword...";
  };

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="search">
              <Search className="mr-2 h-4 w-4" />
              Search
            </TabsTrigger>
            <TabsTrigger value="ai">
              <Sparkles className="mr-2 h-4 w-4" />
              AI Search
            </TabsTrigger>
          </TabsList>
          <span className="text-xs text-muted-foreground">
            Press <kbd className="rounded border px-1.5 py-0.5">⌘K</kbd> for
            global search
          </span>
        </div>
      </Tabs>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder={getPlaceholder()}
          className="pl-9"
          disabled // Placeholder - not functional yet
        />
      </div>

      {/* AI Search Hints (when AI tab is active) */}
      {activeTab === "ai" && (
        <div className="space-y-2 rounded-md bg-muted p-3">
          <p className="text-xs font-medium text-muted-foreground">
            💡 Try these AI queries:
          </p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>• `&quot;Python notes from last week&quat;</li>
            <li>• `&quot;Summary of all my C# notes`&quot;</li>
            <li>• `&quot;Find the Django tutorial I saved`&quot;</li>
          </ul>
          <p className="text-xs text-muted-foreground/75">
            (Coming soon - placeholder)
          </p>
        </div>
      )}
    </div>
  );
}

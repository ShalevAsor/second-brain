// src/components/modals/SearchModal.tsx (FIXED - Proper Scroll Containment)
"use client";

import { useState, useEffect, useRef } from "react";
import { useModalStore } from "@/stores/modalStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, X, Clock, Hash, Folder, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAllNotes } from "@/hooks/use-notes";
import { useTags } from "@/hooks/use-tags";
import { useFolders } from "@/hooks/use-folders";
import { filterNotes } from "@/lib/filter-utils";
import { NoteCard } from "@/components/notes/note-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";

const RECENT_SEARCHES_KEY = "second-brain-recent-searches";
const MAX_RECENT_SEARCHES = 5;

export function SearchModal() {
  const router = useRouter();
  const { type, isOpen, onClose } = useModalStore();
  const isModalOpen = isOpen && type === "search";

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"search" | "ai">("search");
  const inputRef = useRef<HTMLInputElement>(null);

  // Data hooks
  const { data: allNotes = [], isLoading: isLoadingNotes } = useAllNotes({
    enabled: isModalOpen,
  });
  const { data: tags = [] } = useTags({ enabled: isModalOpen });
  const { data: folders = [] } = useFolders({ enabled: isModalOpen });

  // Filter notes based on search
  const filteredNotes = filterNotes(allNotes, searchQuery);
  const hasResults = filteredNotes.length > 0;

  // Load recent searches from localStorage
  useEffect(() => {
    if (isModalOpen) {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        try {
          setRecentSearches(JSON.parse(stored));
        } catch {
          setRecentSearches([]);
        }
      }
      // Focus input when modal opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isModalOpen]);

  // Save search to recent searches
  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return;

    const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(
      0,
      MAX_RECENT_SEARCHES
    );

    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  // Handle search submission
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      saveRecentSearch(query);
    }
  };

  // Clear search
  const handleClear = () => {
    setSearchQuery("");
    inputRef.current?.focus();
  };

  // Handle note click
  const handleNoteClick = (noteId: string) => {
    router.push(`/notes/${noteId}`);
    onClose();
  };

  // Handle folder click
  const handleFolderClick = (folderId: string) => {
    router.push(`/notes?folder=${folderId}`);
    onClose();
  };

  // Handle tag click
  const handleTagClick = (tagId: string) => {
    router.push(`/notes?tag=${tagId}`);
    onClose();
  };

  // Get popular tags (top 5 by usage)
  const popularTags = tags
    .sort((a, b) => (b._count?.notes || 0) - (a._count?.notes || 0))
    .slice(0, 5);

  // Get folders with note counts
  const foldersWithCounts = folders
    .filter((f) => (f._count?.notes || 0) > 0)
    .slice(0, 5);

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      {/* ✅ Fixed height with proper overflow handling */}
      <DialogContent className="sm:max-w-2xl h-[600px] p-0 gap-0 flex flex-col overflow-hidden">
        {/* Header - Fixed at top */}
        <DialogHeader className="px-6 pt-6 pb-4 space-y-2 flex-shrink-0 border-b">
          <DialogTitle className="text-lg font-semibold">
            Search All Notes
          </DialogTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <kbd className="px-2 py-1 rounded bg-muted font-mono">⌘K</kbd>
            <span>to open</span>
            <span>•</span>
            <kbd className="px-2 py-1 rounded bg-muted font-mono">ESC</kbd>
            <span>to close</span>
          </div>
        </DialogHeader>

        {/* ✅ Tabs container - Takes remaining space */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "search" | "ai")}
          className="flex-1 flex flex-col overflow-hidden"
        >
          {/* Tabs List - Fixed */}
          <TabsList className="w-full justify-start rounded-none border-b px-6 flex-shrink-0">
            <TabsTrigger value="search" className="gap-2">
              <Search className="h-4 w-4" />
              Search
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <Sparkles className="h-4 w-4" />
              AI Search
            </TabsTrigger>
          </TabsList>

          {/* Regular Search Tab */}
          <TabsContent
            value="search"
            className="flex-1 mt-0 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col"
          >
            {/* ✅ Search Input - Fixed at top */}
            <div className="px-6 pt-4 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search across all your notes..."
                  className="pl-9 pr-9"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* ✅ Scrollable Content Area - Takes remaining space */}
            <div className="flex-1 overflow-hidden px-6 pb-6">
              {searchQuery ? (
                // Search Results
                isLoadingNotes ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Searching...</p>
                  </div>
                ) : hasResults ? (
                  <div className="h-full flex flex-col pt-4">
                    <p className="text-sm text-muted-foreground mb-3 flex-shrink-0">
                      Found {filteredNotes.length}{" "}
                      {filteredNotes.length === 1 ? "result" : "results"}
                    </p>
                    {/* ✅ ScrollArea with explicit height constraint */}
                    <ScrollArea className="h-[400px] -mx-6 px-6">
                      {filteredNotes.map((note) => (
                        <NoteCard key={note.id} note={note} />
                      ))}
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <p className="text-muted-foreground">
                        No notes found for &quot;{searchQuery}&quot;
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Try a different search term
                      </p>
                    </div>
                  </div>
                )
              ) : (
                // Empty State - Recent Searches, Tags, Folders
                <ScrollArea className="h-full pt-4">
                  <div className="space-y-6">
                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <h3 className="text-sm font-medium">
                            Recent Searches
                          </h3>
                        </div>
                        <div className="space-y-1">
                          {recentSearches.map((search, index) => (
                            <button
                              key={index}
                              onClick={() => handleSearch(search)}
                              className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
                            >
                              {search}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Popular Tags */}
                    {popularTags.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Hash className="h-4 w-4 text-muted-foreground" />
                          <h3 className="text-sm font-medium">Popular Tags</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {popularTags.map((tag) => (
                            <Badge
                              key={tag.id}
                              variant="secondary"
                              className="cursor-pointer hover:bg-secondary/80"
                              onClick={() => handleTagClick(tag.id)}
                            >
                              #{tag.name} ({tag._count?.notes || 0})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Access Folders */}
                    {foldersWithCounts.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Folder className="h-4 w-4 text-muted-foreground" />
                          <h3 className="text-sm font-medium">Quick Access</h3>
                        </div>
                        <div className="space-y-1">
                          {foldersWithCounts.map((folder) => (
                            <button
                              key={folder.id}
                              onClick={() => handleFolderClick(folder.id)}
                              className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
                            >
                              <span className="flex items-center gap-2">
                                <Folder className="h-4 w-4" />
                                {folder.name}
                              </span>
                              <span className="text-muted-foreground">
                                {folder._count?.notes || 0} notes
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </div>
          </TabsContent>

          {/* AI Search Tab */}
          <TabsContent
            value="ai"
            className="flex-1 mt-0 overflow-auto data-[state=active]:flex"
          >
            <div className="p-6 flex items-center justify-center w-full">
              <div className="text-center space-y-4 max-w-md">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    AI Search Coming Soon
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Ask natural language questions like &quot;Python notes from
                    last week&quot; or &quot;Summary of all my C# notes&quot;
                  </p>
                </div>
                <div className="space-y-2 text-left">
                  <p className="text-xs font-medium text-muted-foreground">
                    Try these AI queries:
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• &quot;Python notes from last week&quot;</li>
                    <li>• &quot;Summary of all my C# notes&quot;</li>
                    <li>
                      • &quot;Find the Django tutorial I saved yesterday&quot;
                    </li>
                    <li>• &quot;What did I learn about React hooks?&quot;</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

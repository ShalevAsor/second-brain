"use client";

import { Folder, ChevronRight } from "lucide-react";
import { useFolders } from "@/hooks/use-folders";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getFolderColorClass } from "@/components/common/color-picker";

interface SubfoldersSectionProps {
  parentFolderId: string;
}

/**
 * Subfolders Section Component
 *
 * Displays child folders of the current folder.
 * Used in /notes?folder=xyz view.
 */
export function SubfoldersSection({ parentFolderId }: SubfoldersSectionProps) {
  const { data: allFolders, isLoading } = useFolders();
  const router = useRouter();

  if (isLoading) return null;

  // Filter subfolders (children of current folder)
  const subfolders =
    allFolders?.filter((folder) => folder.parentId === parentFolderId) || [];

  // Don't render if no subfolders
  if (subfolders.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="mb-4 text-lg font-semibold">
        📂 Subfolders ({subfolders.length})
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {subfolders.map((folder) => {
          const noteCount = folder._count.notes;

          return (
            <button
              key={folder.id}
              onClick={() => router.push(`/notes?folder=${folder.id}`)}
              className={cn(
                "group flex items-center gap-3 rounded-lg border bg-card p-4 text-left transition-all",
                "hover:border-primary/50 hover:shadow-md"
              )}
            >
              {/* Folder Icon */}
              <div
                className={cn("shrink-0", getFolderColorClass(folder.color))}
              >
                <Folder className="h-5 w-5" />
              </div>

              {/* Folder Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{folder.name}</p>
                <p className="text-sm text-muted-foreground">
                  {noteCount} {noteCount === 1 ? "note" : "notes"}
                </p>
              </div>

              {/* Arrow Icon */}
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </button>
          );
        })}
      </div>
    </section>
  );
}

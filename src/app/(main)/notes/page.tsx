// import { Suspense } from "react";
// import { NotesContent } from "@/components/notes/notes-content";
// import { QuickCapture } from "@/components/notes/quick-capture";
// import { SearchTabs } from "@/components/notes/search-tabs";
// import { NotesSkeleton } from "@/components/notes/notes-skeleton";

// interface NotesPageProps {
//   searchParams: Promise<{
//     folder?: string;
//     tag?: string;
//     favorites?: string;
//   }>;
// }
// export type NoteView = "all" | "folder" | "tag" | "favorites";

// export default async function NotesPage({ searchParams }: NotesPageProps) {
//   const { folder, tag, favorites } = await searchParams;

//   // Determine current view
//   const view: NoteView = folder
//     ? "folder"
//     : tag
//     ? "tag"
//     : favorites === "true"
//     ? "favorites"
//     : "all";

//   return (
//     <div className="h-full overflow-y-auto">
//       <div className="mx-auto max-w-7xl space-y-6 p-6">
//         {/* Quick Capture - Only show in "all" view */}
//         {view === "all" && <QuickCapture />}

//         {/* Search Tabs - Show in all views */}
//         <SearchTabs view={view} />

//         {/* Notes Content with Loading State */}
//         <Suspense fallback={<NotesSkeleton />}>
//           <NotesContent view={view} folderId={folder} tagId={tag} />
//         </Suspense>
//       </div>
//     </div>
//   );
// }
// src/app/(main)/notes/page.tsx
import { Suspense } from "react";
import { NotesClient } from "@/components/notes/notes-client";
import { QuickCapture } from "@/components/notes/quick-capture";
import { SearchTabs } from "@/components/notes/search-tabs";
import { NotesSkeleton } from "@/components/notes/notes-skeleton";

interface NotesPageProps {
  searchParams: Promise<{
    folder?: string;
    tag?: string;
    favorites?: string;
  }>;
}

export type NoteView = "all" | "folder" | "tag" | "favorites";

export default async function NotesPage({ searchParams }: NotesPageProps) {
  const { folder, tag, favorites } = await searchParams;

  // Determine current view
  const view: NoteView = folder
    ? "folder"
    : tag
    ? "tag"
    : favorites === "true"
    ? "favorites"
    : "all";

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Quick Capture - Only show in "all" view */}
        {view === "all" && <QuickCapture />}

        {/* Search Tabs - Show in all views */}
        <SearchTabs view={view} />

        {/* Notes Content with Search - Client Component */}
        <Suspense fallback={<NotesSkeleton />}>
          <NotesClient view={view} folderId={folder} tagId={tag} />
        </Suspense>
      </div>
    </div>
  );
}

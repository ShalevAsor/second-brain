// import { Star } from "lucide-react";
// import Link from "next/link";
// import { formatDistanceToNow } from "date-fns";

// /**
//  * Single favorite note card for sidebar
//  *
//  * Displays:
//  * - Note title (truncated if long)
//  * - Folder location (if exists)
//  * - Last updated time
//  * - Star icon
//  *
//  * Clicking the card navigates to the note detail page.
//  */
// interface FavoriteNoteCardProps {
//   note: {
//     id: string;
//     title: string;
//     folder: { name: string; color: string } | null;
//     updatedAt: Date;
//   };
// }

// export function FavoriteNoteCard({ note }: FavoriteNoteCardProps) {
//   return (
//     <div className="px-2 py-1">
//       <Link
//         href={`/notes/${note.id}`}
//         className="block rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
//       >
//         <div className="flex items-start justify-between gap-2">
//           {/* Left side: Note info */}
//           <div className="flex-1 min-w-0">
//             {/* Note title */}
//             <div className="font-medium truncate">
//               {note.title || "Untitled"}
//             </div>

//             {/* Folder location (if note is in a folder) */}
//             {note.folder && (
//               <div className="text-xs text-muted-foreground mt-0.5">
//                 📁 {note.folder.name}
//               </div>
//             )}

//             {/* Last updated time */}
//             <div className="text-xs text-muted-foreground mt-0.5">
//               🕒{" "}
//               {formatDistanceToNow(new Date(note.updatedAt), {
//                 addSuffix: true,
//               })}
//             </div>
//           </div>

//           {/* Right side: Star icon */}
//           <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 flex-shrink-0 mt-0.5" />
//         </div>
//       </Link>
//     </div>
//   );
// }
import { Star } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { NoteWithRelations } from "@/types/noteTypes";

/**
 * Single favorite note card for sidebar
 *
 * Displays:
 * - Note title (truncated if long)
 * - Folder location (if exists)
 * - Last updated time
 * - Star icon
 *
 * Clicking the card navigates to the note detail page (hard navigation).
 */
interface FavoriteNoteCardProps {
  note: NoteWithRelations;
}

export function FavoriteNoteCard({ note }: FavoriteNoteCardProps) {
  return (
    <div className="px-2 py-1">
      <Link
        href={`/notes/${note.id}`}
        className="block rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        <div className="flex items-start justify-between gap-2">
          {/* Left side: Note info */}
          <div className="flex-1 min-w-0">
            {/* Note title */}
            <div className="font-medium truncate">
              {note.title || "Untitled"}
            </div>

            {/* Folder location (if note is in a folder) */}
            {note.folder && (
              <div className="text-xs text-muted-foreground mt-0.5">
                📁 {note.folder.name}
              </div>
            )}

            {/* Last updated time */}
            <div className="text-xs text-muted-foreground mt-0.5">
              🕒{" "}
              {formatDistanceToNow(new Date(note.updatedAt), {
                addSuffix: true,
              })}
            </div>
          </div>

          {/* Right side: Star icon */}
          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 flex-shrink-0 mt-0.5" />
        </div>
      </Link>
    </div>
  );
}

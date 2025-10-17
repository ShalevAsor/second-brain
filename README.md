# Second Brain

## Project Overview

**Second Brain** is an AI-powered note-taking app for STEM/CS students. It combines rich text editing, semantic search, and intelligent organization to help users capture, organize, and recall information effortlessly.

**Core Value Proposition:**

- Paste anything → AI organizes it automatically
- Natural language search that understands meaning
- Rich text editor with code blocks, LaTeX math, syntax highlighting

**Target Users:** CS students, bootcamp students, self-taught developers

---

## 🛠️ Tech Stack

### Frontend

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Rich Text:** Tiptap (with StarterKit, code blocks, LaTeX math)
- **Syntax Highlighting:** lowlight
- **State Management:**
  - React Query (TanStack Query) - server state
  - Zustand - client UI state
  - useReducer - complex local forms

### Backend

- **API:** Next.js Server Actions
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** Clerk
- **Validation:** Zod

### AI Services

- **Provider:** OpenAI
- **Models:**
  - `gpt-4o-mini` (content analysis, formatting)
  - `text-embedding-3-small` (semantic search)
- **Features:** Content analysis, formatting, semantic search with lazy embeddings

---

## 💾 Database Schema

```prisma
model User {
  id        String   @id @default(cuid())
  clerkId   String   @unique
  email     String   @unique
  firstName String?
  lastName  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  notes     Note[]
  folders   Folder[]
  tags      Tag[]

  @@map("users")
}

model Note {
  id                 String    @id @default(cuid())
  userId             String
  user               User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  title              String
  content            String    @db.Text
  folderId           String?
  folder             Folder?   @relation(fields: [folderId], references: [id], onDelete: SetNull)
  tags               NoteTag[]
  isAutoOrganized    Boolean   @default(false)
  isFavorite         Boolean   @default(false)

  // Semantic Search Fields
  embedding          Float[]                    // 1536-dimension vector
  embeddingUpdatedAt DateTime?                  // Last embedding generation
  contentUpdatedAt   DateTime  @default(now())  // Track content changes

  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  @@index([userId])
  @@index([folderId])
  @@index([userId, isFavorite])
  @@index([userId, contentUpdatedAt])
  @@map("notes")
}

model Folder {
  id        String      @id @default(cuid())
  userId    String
  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  isDefault Boolean     @default(false)  // Inbox folder flag
  name      String
  color     FolderColor @default(GRAY)
  parentId  String?
  parent    Folder?     @relation("FolderHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  children  Folder[]    @relation("FolderHierarchy")
  depth     Int         @default(0)      // 0 (root), 1 (subfolder), 2 (sub-subfolder) - MAX 3 LEVELS
  notes     Note[]
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  @@index([userId])
  @@index([parentId])
  @@index([userId, depth])
  @@map("folders")
}

model Tag {
  id        String    @id @default(cuid())
  name      String    // lowercase, hyphenated (e.g., "python", "hash-table")
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  notes     NoteTag[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@unique([userId, name])  // Prevent duplicates per user
  @@index([userId])
  @@map("tags")
}

model NoteTag {
  noteId String
  note   Note   @relation(fields: [noteId], references: [id], onDelete: Cascade)
  tagId  String
  tag    Tag    @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([noteId, tagId])
  @@index([noteId])
  @@index([tagId])
  @@map("note_tags")
}

enum FolderColor {
  GRAY    // Default/neutral
  RED     // Urgent/important
  GREEN   // In progress
  BLUE    // Reference/docs
  YELLOW  // Review/pending
  PURPLE  // Personal
}
```

### Key Schema Decisions

**Folder Hierarchy:**

- Max 3 levels (depth 0, 1, 2)
- Self-referential relationship with `parentId`
- Cascade delete ensures no orphaned folders
- `isDefault` flag for special "Inbox" folder

**Tags:**

- Many-to-many via `NoteTag` junction table
- User-scoped unique names (case-insensitive enforced in app)
- Always stored lowercase

**Semantic Search:**

- `embedding` stores 1536-dim vector directly in DB
- `embeddingUpdatedAt` tracks freshness
- `contentUpdatedAt` separate from `updatedAt` (only changes on title/content edits)
- Lazy evaluation: embeddings generated only when searching

---

## 🏗️ Architecture Patterns

### 1. State Management Strategy

```typescript
// SERVER STATE (React Query)
// - Notes, folders, tags from database
// - Automatic caching, refetching, optimistic updates
import { useNotes, useFolders, useTags } from "@/hooks";

// CLIENT UI STATE (Zustand)
// - Modal open/close states
// - Sidebar collapsed/expanded
// - Non-persisted UI preferences
import { useModalStore, useSidebarUIStore } from "@/stores";

// COMPLEX LOCAL STATE (useReducer)
// - Multi-field forms with complex logic
// - Note editor state (title, content, folder, tags, favorite)
// - Quick Capture modal (if converted - currently useState)
import { noteFormReducer } from "@/reducers/note-form-reducer";

// SIMPLE LOCAL STATE (useState)
// - Toggle states, single values
// - Simple forms
// - Loading indicators
const [isOpen, setIsOpen] = useState(false);
```

**Decision Tree:**

```
Is it from the database?
  YES → React Query
  NO ↓

Does it persist across page reloads?
  YES → Zustand (or localStorage)
  NO ↓

Is it complex with multiple interdependent fields?
  YES → useReducer
  NO → useState
```

### 2. Server Actions Pattern

**File:** `src/actions/*.ts`

```typescript
/**
 * Standard Server Action Template
 */
export async function actionName(
  input: InputType
): Promise<ActionResult<ReturnType>> {
  try {
    // 1. Authenticate
    const userId = await requireAuth();

    // 2. Validate input
    const validated = zodSchema.parse(input);

    // 3. Database operation
    const result = await prisma.model.operation({
      where: { userId },
      data: validated,
    });

    // 4. Revalidate cache (if needed)
    revalidatePath("/notes");

    // 5. Return typed success
    return createSuccessResult(result);
  } catch (error) {
    // 6. Handle errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return createErrorResult({ error: "Database error" });
    }
    return createErrorResult({ error: "Unknown error" });
  }
}
```

**ActionResult Pattern:**

```typescript
// Type-safe results (no throwing errors in components)
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// Usage in components
const result = await createNote(input);
if (!result.success) {
  toast.error(result.error);
  return;
}
// TypeScript knows result.data exists here
const note = result.data;
```

### 3. React Query Patterns

**File:** `src/hooks/use-notes.ts`

```typescript
// Query Keys (centralized)
export const NOTES_QUERY_KEY = ["notes"] as const;

// Query Hook
export function useAllNotes() {
  return useQuery({
    queryKey: NOTES_QUERY_KEY,
    queryFn: getAllNotes,
    staleTime: 1000 * 60, // 1 minute
  });
}

// Mutation Hook with Optimistic Updates
export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createNote,
    // Optimistic update
    onMutate: async (newNote) => {
      await queryClient.cancelQueries({ queryKey: NOTES_QUERY_KEY });
      const previous = queryClient.getQueryData(NOTES_QUERY_KEY);

      queryClient.setQueryData(NOTES_QUERY_KEY, (old) => {
        return [...(old || []), optimisticNote];
      });
      return { previous };
    },

    // Rollback on error
    onError: (err, variables, context) => {
      queryClient.setQueryData(NOTES_QUERY_KEY, context?.previous);
      toast.error("Failed to create note");
    },

    // Refetch on success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: FOLDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: TAGS_QUERY_KEY });
    },

    onSuccess: (data) => {
      toast.success("Note created!");
    },
  });
}
```

## 📁 Project Structure

```
src/
├── actions/              # Server actions (API layer)
│   ├── aiActions.ts      # AI features (analyze, format, search)
│   ├── noteActions.ts    # Note CRUD operations
│   ├── folderActions.ts  # Folder management
│   ├── tagActions.ts     # Tag operations
│   └── userActions.ts    # User/auth operations
│
├── app/                  # Next.js App Router
│   ├── (auth)/          # Auth pages (sign-in, sign-up)
│   ├── (main)/          # Main app layout
│   │   ├── layout.tsx   # Sidebar + header layout
│   │   └── notes/       # Notes routes
│   │       ├── page.tsx           # /notes (all notes)
│   │       ├── new/page.tsx       # /notes/new (create)
│   │       └── [id]/page.tsx      # /notes/:id (edit)
│   ├── api/webhooks/    # Clerk webhooks
│   └── globals.css      # Global styles
│
├── components/
│   ├── common/          # Reusable components
│   │   ├── auto-save-indicator.tsx
│   │   ├── color-picker.tsx
│   │   ├── confirm-action.tsx
│   │   ├── favorite-button.tsx
│   │   ├── folder-selector.tsx
│   │   └── tag-input.tsx
│   │
│   ├── editor/          # Note editor
│   │   └── note-editor.tsx        # Main editor (create + edit modes)
│   │
│   ├── layout/          # Layout components
│   │   └── page-header.tsx        # Page header with nav
│   │
│   ├── modals/          # Modal dialogs
│   │   ├── FolderModal.tsx        # Create/edit folders
│   │   ├── QuickCaptureModal.tsx  # AI-powered quick capture
│   │   └── SearchModal.tsx        # Cmd+K search
│   │
│   ├── notes/           # Notes list views
│   │   ├── note-card.tsx          # Individual note card
│   │   ├── notes-content.tsx      # Content switcher
│   │   ├── notes-header.tsx       # View header
│   │   ├── notes-empty-state.tsx  # Empty states
│   │   ├── search-filter.tsx      # Local search
│   │   └── ...
│   │
│   ├── sidebar/         # Sidebar navigation
│   │   ├── app-sidebar.tsx
│   │   ├── folders/     # Folder tree
│   │   ├── tags/        # Tag list
│   │   ├── favorites/   # Favorite notes
│   │   ├── quick-actions/
│   │   └── user/
│   │
│   ├── tiptap-*/        # Tiptap editor components
│   │   ├── tiptap-icons/
│   │   ├── tiptap-node/
│   │   ├── tiptap-ui/
│   │   └── tiptap-ui-primitive/
│   │
│   ├── providers/       # Context providers
│   │   ├── Providers.tsx
│   │   ├── ModalProvider.tsx
│   │   └── KeyboardShortcutProvider.tsx
│   │
│   └── ui/              # shadcn/ui components
│
├── hooks/               # React hooks
│   ├── use-notes.ts     # Note queries/mutations
│   ├── use-folders.ts   # Folder queries/mutations
│   ├── use-tags.ts      # Tag queries/mutations
│   ├── use-favorites.ts # Favorite operations
│   ├── use-semantic-search.ts  # AI search
│   ├── use-tiptap-editor.ts    # Editor setup
│   └── ...
│
├── lib/                 # Utilities & helpers
│   ├── actionHelpers.ts # ActionResult creators
│   ├── auth.ts          # Authentication utilities
│   ├── prisma.ts        # Prisma client singleton
│   ├── queryClient.ts   # React Query setup
│   ├── query-keys.ts    # Centralized query keys
│   ├── folderHelpers.ts # Folder path utilities
│   ├── filter-utils.ts  # Search filtering
│   └── utils.ts         # General utilities (cn, etc)
│
├── reducers/            # useReducer implementations
│   └── note-form-reducer.ts
│
├── schemas/             # Zod validation schemas
│   ├── noteSchemas.ts
│   ├── folderSchemas.ts
│   ├── tagSchemas.ts
│   └── searchSchemas.ts
│
├── services/            # External service integrations
│   └── ai/
│       ├── core/        # AI configuration
│       │   ├── config.ts
│       │   ├── types.ts
│       │   └── openai-client.ts
│       ├── prompts/     # AI prompts
│       │   ├── analysis-prompt.ts
│       │   └── formatting-prompt.ts
│       ├── utils/       # AI utilities
│       │   ├── embeddings.ts
│       │   ├── text-processor.ts
│       │   └── html-sanitizer.ts
│       ├── content-analyzer.ts
│       ├── content-formatter.ts
│       └── semantic-search.ts
│
├── stores/              # Zustand stores
│   ├── modalStore.ts    # Modal open/close states
│   ├── sidebarUIStore.ts
│   └── folderStore.ts
│
├── types/               # TypeScript types
│   ├── noteTypes.ts
│   ├── folderTypes.ts
│   ├── actionTypes.ts
│   └── modalTypes.ts
│
└── middleware.ts        # Clerk middleware
```

## Core Features

### 1. Rich Text Editor (Tiptap)

**Location:** `src/components/editor/note-editor.tsx`

**Capabilities:**

- **Text Formatting:** Bold, italic, underline, strikethrough, code, highlight
- **Headings:** H1-H6 with visual hierarchy
- **Lists:** Bullet, numbered, task lists
- **Code Blocks:** Syntax highlighting (30+ languages via lowlight)
- **Math Support:** Inline and block LaTeX equations
- **Links:** Add/edit/remove hyperlinks
- **Images:** Upload and embed (currently base64, needs cloud storage)
- **Blockquotes, Horizontal Rules, Text Alignment**

**Editor Modes:**

- **Create Mode:** `/notes/new` - No favorite/delete buttons, saves create note
- **Edit Mode:** `/notes/:id` - Full controls, auto-save every 2 seconds

### 2. Folder System

**Rules:**

- **Max depth:** 3 levels (0=root, 1=subfolder, 2=sub-subfolder)
- **Colors:** 6 options (GRAY, RED, GREEN, BLUE, YELLOW, PURPLE)
- **Hierarchy:** Self-referential with cascade delete
- **Validation:**
  - No circular references
  - No duplicate sibling names (case-insensitive)
  - Depth limit enforced

**Special Folder:**

- **Inbox:** Created automatically for new users (`isDefault: true`)
- Used for generic/unorganized content

**Operations:**

- Create (root or nested)
- Rename
- Change color
- Move (change parent)
- Delete (cascade to children + notes)

### 3. Tags System

**Implementation:** Many-to-many via `NoteTag` junction table

**Rules:**

- Always lowercase (enforced in app)
- Hyphenated for multi-word (e.g., "hash-table")
- User-scoped unique names
- Case-insensitive matching

### 4. Favorites System

**Implementation:** Boolean flag on `Note` model

**Features:**

- Star/unstar notes with optimistic updates
- Sidebar shows top 5 favorites (most recent)
- Dedicated favorites view (`/notes?favorites=true`)
- Pinned section in "All Notes" view

### 5. Quick Capture (AI-Powered)

**Flow:**

1. **Capture:** User pastes content (code, recipes, notes, etc.)
2. **Processing:** AI analyzes content (3-5 seconds)
3. **Review:** User reviews AI suggestions, can edit before saving

**AI Analysis:**

- Suggests title (max 60 chars)
- Suggests folder (prefers existing, creates if needed)
- Suggests 2-5 tags (reuses existing + adds new)
- Provides reasoning + confidence level

**Folder Logic:**

```
1. Check for semantic match in existing folders
   - Prefers most specific (e.g., "Algorithms/Sorting" over "Algorithms")
   - Case-insensitive, path-aware matching

2. If no match found:
   - Suggest NEW root-level folder name (e.g., "Recipes")
   - Never suggests nested paths (e.g., NOT "Cooking/Desserts")

3. If content is vague/generic:
   - Use "Inbox" if exists
   - Otherwise null (no folder)
```

**Tag Logic:**

```
1. Always reuse existing tags when relevant
2. Add new specific tags for discoverability
3. Balance: Broad existing tags + Specific new tags
4. Example:
   - Hash table code + existing "algorithms" tag
   - Result: ["algorithms", "hash-table", "data-structures"]
     (reused "algorithms", added "hash-table", "data-structures")
```

**Content Formatting:**

- Automatically formats content as rich HTML
- Preserves code blocks, headings, lists
- Max 10,000 characters for formatting
- Shows "Formatting..." → "Saving..." progress

**Key Files:**

- `components/modals/QuickCaptureModal.tsx`
- `actions/aiActions.ts` - `analyzeContentForOrganization()`
- `services/ai/content-analyzer.ts`
- `services/ai/prompts/analysis-prompt.ts`

### 6. Search System

**Two Search Types:**

#### A. Local Filter Search

- **Location:** In-page search bar on `/notes` views
- **Scope:** Filters current view only
- **Searches:** Title, content, tags, folder names
- **Speed:** Instant (client-side)
- **Keyboard:** `/` to focus
- **Use Case:** Quick refinement of current view

#### B. Global Semantic Search

- **Location:** Cmd+K modal (works anywhere)
- **Scope:** Searches ALL notes
- **Type:** AI-powered, meaning-based search
- **Speed:** 400-900ms (first search may be slower)
- **Features:**
  - Natural language queries
  - Understands context and meaning
  - Similarity scores (0-100%)
  - Lazy embedding generation

**Semantic Search Architecture:**

```
User Query: "how to sort an array efficiently"
    ↓
1. Check embedding freshness for all notes
   - Fresh embedding (content unchanged) → Use cached
   - Stale embedding (content changed) → Regenerate
   - No embedding → Generate new
    ↓
2. Generate embeddings for stale notes (parallel)
   - Batch process (10 at a time)
   - Prepared text: title + tags + stripped HTML content
    ↓
3. Generate query embedding
    ↓
4. Calculate cosine similarity (all notes vs query)
   - Returns score 0.0 - 1.0 (0% - 100%)
    ↓
5. Filter by threshold (default: 0.3 = 30%)
    ↓
6. Sort by similarity (highest first)
    ↓
7. Save new embeddings to DB (background, non-blocking)
    ↓
8. Return top results (max 20)
```

**Embedding Freshness Logic:**

```typescript
// Check if embedding needs regeneration
function checkEmbeddingFreshness(note: Note): {
  needsRegeneration: boolean;
  reason?: string;
} {
  // No embedding exists
  if (!note.embedding || note.embedding.length === 0) {
    return { needsRegeneration: true, reason: "no_embedding" };
  }

  // Embedding timestamp missing
  if (!note.embeddingUpdatedAt) {
    return { needsRegeneration: true, reason: "missing_timestamp" };
  }

  // Content updated after embedding was generated
  if (note.contentUpdatedAt > note.embeddingUpdatedAt) {
    return { needsRegeneration: true, reason: "content_updated" };
  }

  // Corrupted embedding (wrong dimensions)
  if (note.embedding.length !== 1536) {
    return { needsRegeneration: true, reason: "corrupted" };
  }

  // Fresh!
  return { needsRegeneration: false };
}
```

**Performance:**

- **First search on note:** 2-5 seconds (generates embedding)
- **Subsequent searches:** 300-500ms (uses cached embedding)
- **Cost:** ~$0.00001 per note embedding (very cheap!)

---

## 🤖 AI Integration

### OpenAI Setup

**Configuration:** `src/services/ai/core/config.ts`

```typescript
export const AI_CONFIG = {
  // Content Analysis (Quick Capture)
  MAX_CONTENT_LENGTH: 10000, // ~2.5k tokens

  // Content Formatting
  MAX_FORMATTING_LENGTH: 10000,

  // Models
  CHAT_MODEL: "gpt-4o-mini", // Analysis & formatting
  EMBEDDING_MODEL: "text-embedding-3-small",

  // Embeddings
  EMBEDDING_DIMENSIONS: 1536,
  EMBEDDING_MAX_LENGTH: 8000, // ~2k tokens

  // Search
  SIMILARITY_THRESHOLD: 0.3, // 30% minimum match
  MAX_SEARCH_RESULTS: 20,

  // API
  API_TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // Exponential backoff
};
```

### Feature 1: Content Analysis (Quick Capture)

**Purpose:** Analyze pasted content and suggest organization

**Input:** Raw text (code, recipes, notes, etc.)
**Output:** Title, folder, tags, reasoning, confidence

**Process:**

1. Truncate content if > 10,000 chars (with notice)
2. Fetch user's existing folders & tags (provides context to AI)
3. Build AI prompt with user's folder hierarchy and tag list
4. Call OpenAI with structured JSON output
5. Parse and normalize response (lowercase tags, truncate title)
6. Return suggestions to user

### Feature 2: Content Formatting

**Purpose:** Convert plain text to rich HTML for editor

**Input:** Plain text content
**Output:** Formatted HTML with headings, code blocks, lists

**Process:**

1. Check content length (max 10,000 chars)
2. Call OpenAI to structure content
3. Parse response and sanitize HTML
4. Return formatted content

**Used In:**

- Quick Capture (formats before saving)
- Shows "Formatting..." progress indicator

**Example:**

```
Input (plain text):
QuickSort Algorithm
Here's the code:
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    ...

Output (formatted HTML):
<h1>QuickSort Algorithm</h1>
<p>Here's the code:</p>
<pre><code class="language-python">
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    ...
</code></pre>
```

### Feature 3: Semantic Search

**Purpose:** Find notes by meaning, not just keywords

**Architecture: "Lazy Embeddings"**

```
Why lazy?
- Don't generate embeddings on note creation (saves API calls)
- Generate only when searching (on-demand)
- Cache embeddings in database for future searches
- Regenerate only when content changes

Benefits:
✅ Zero impact on note creation/editing speed
✅ First search: slow (2-3s), subsequent: fast (300ms)
✅ 90% cheaper after first search
✅ No background jobs needed
```

### Optimistic Updates Pattern

```typescript
export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFolder,

    // 1. Before mutation (optimistic update)
    onMutate: async (newFolder) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: FOLDERS_QUERY_KEY });

      // Snapshot current value
      const previous = queryClient.getQueryData(FOLDERS_QUERY_KEY);

      // Optimistically update cache
      const optimisticFolder = {
        ...newFolder,
        id: `temp-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      queryClient.setQueryData(FOLDERS_QUERY_KEY, (old: Folder[]) => [
        ...(old || []),
        optimisticFolder,
      ]);

      // Return context for rollback
      return { previous };
    },

    // 2. On error (rollback)
    onError: (err, variables, context) => {
      queryClient.setQueryData(FOLDERS_QUERY_KEY, context?.previous);
      toast.error("Failed to create folder");
    },

    // 3. After mutation (sync with server)
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: FOLDERS_QUERY_KEY });
    },

    // 4. On success (show feedback)
    onSuccess: () => {
      toast.success("Folder created!");
    },
  });
}
```

---

## 📊 Current State & Limitations

### ✅ What Works

- Rich text editing with code blocks, LaTeX, syntax highlighting
- Folder system (3-level hierarchy, colors, validation)
- Tag system (many-to-many, normalized)
- Favorites (star/unstar, sidebar display)
- Quick Capture (AI analysis, folder matching, tag suggestions)
- Local filter search (instant, in-page)
- Semantic AI search (lazy embeddings, meaning-based)
- Content formatting (plain text → rich HTML)
- Auto-save (2-second debounce)
- Optimistic updates (instant UI feedback)
- Soft navigation (query params, no reload)
- Authentication (Clerk)
- Type-safe API (Server Actions + Zod)

### ⚠️ Known Limitations

**Images:**

- Currently using base64 encoding (stored in DB)
- Problems: DB bloat, slow queries, no optimization
- **Needs:** Cloud storage (S3/R2/Vercel Blob)

**Performance:**

- Client-side search (good for <500 notes)
- No pagination (loads all notes at once)
- **Needs:** Server-side search, pagination for scale

**Files:**

- No PDF support
- No file attachments
- **Needs:** File upload system + cloud storage

**Mobile:**

- Responsive layout exists
- Not thoroughly tested on mobile devices
- **Needs:** Mobile testing, potential UX adjustments

**Polish:**

- Limited animations/transitions
- Basic loading states
- **Needs:** Better micro-interactions, loading skeletons

---

## Learning from This Codebase

### Architecture Decisions Explained

**Why React Query instead of SWR?**

- More powerful mutation hooks
- Better optimistic update patterns
- Built-in devtools
- Larger ecosystem

**Why Server Actions instead of API routes?**

- Type-safe by default (shared types)
- Less boilerplate (no need for fetch wrappers)
- Automatic request deduplication
- Better integration with Next.js cache

**Why Zustand instead of Context API?**

- Less boilerplate
- No provider hell
- Better performance (selective subscriptions)
- DevTools support

**Why useReducer for forms?**

- Predictable state updates
- Easier to test
- Single source of truth
- Scales better than multiple useState

**Why lazy embeddings?**

- Zero impact on note creation speed
- 90% cheaper (only generate when needed)
- No background jobs needed
- Simple implementation

**Why 3-level folder limit?**

- Prevents infinite nesting (performance)
- Keeps UI manageable
- Most users don't need deeper
- Easier to validate and display

**Why lowercase tags?**

- Prevents duplicates ("Python" vs "python")
- Consistent search/filtering
- Better user experience
- Industry standard (GitHub, Stack Overflow)

**Why soft navigation for views?**

- Instant content swap (no reload)
- Browser history works naturally
- Bookmarkable URLs
- Feels faster to users

## License

MIT License

## Links

- **Live Demo:** [secondbrain.com](https://www.talebyyou.com)
- **Portfolio:** [Your Portfolio Link]

---

**Built with ❤️ by Shalev Asor**

# Second Brain - Technical Documentation

> **Last Updated:** October 2025  
> **Status:** Production-ready MVP with AI features

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Database Schema](#database-schema)
4. [Architecture Patterns](#architecture-patterns)
5. [Project Structure](#project-structure)
6. [Core Features](#core-features)
7. [AI Integration](#ai-integration)
8. [Code Patterns & Conventions](#code-patterns--conventions)
9. [Navigation & Routing](#navigation--routing)
10. [Key Implementation Details](#key-implementation-details)

---

## 🎯 Project Overview

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

### DevOps

- **Deployment:** Vercel
- **Package Manager:** npm

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

### 4. useReducer Pattern (Complex Forms)

**When to Use:**

- Forms with 5+ interdependent fields
- Complex state transitions
- Need for undo/redo logic
- State updates based on previous state

**Example:** Note Editor Form

```typescript
// State type
type NoteFormState = {
  title: string;
  content: string;
  folderId: string | null;
  tags: SimpleTag[];
  isFavorite: boolean;
};

// Action types
type NoteFormAction =
  | { type: "SET_TITLE"; payload: string }
  | { type: "SET_CONTENT"; payload: string }
  | { type: "SET_FOLDER"; payload: string | null }
  | { type: "ADD_TAG"; payload: SimpleTag }
  | { type: "REMOVE_TAG"; payload: string }
  | { type: "TOGGLE_FAVORITE" }
  | { type: "LOAD_NOTE"; payload: NoteWithRelations }
  | { type: "RESET" };

// Reducer
function noteFormReducer(
  state: NoteFormState,
  action: NoteFormAction
): NoteFormState {
  switch (action.type) {
    case "SET_TITLE":
      return { ...state, title: action.payload };

    case "ADD_TAG":
      // Prevent duplicates
      const exists = state.tags.some(
        (t) => t.name.toLowerCase() === action.payload.name.toLowerCase()
      );
      if (exists) return state;
      return { ...state, tags: [...state.tags, action.payload] };

    case "LOAD_NOTE":
      // Transform DB structure to form state
      return {
        title: action.payload.title,
        content: action.payload.content,
        folderId: action.payload.folderId,
        tags: getNoteTags(action.payload),
        isFavorite: action.payload.isFavorite,
      };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

// Usage in component
const [formState, dispatch] = useReducer(noteFormReducer, initialState);

dispatch({ type: "SET_TITLE", payload: "New Title" });
dispatch({ type: "ADD_TAG", payload: { id: "1", name: "python" } });
```

**Benefits:**

- Single source of truth for form state
- Predictable state updates
- Easy to test
- Scales better than multiple useState calls

---

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

### Critical Files Reference

**Server Actions:**

- `actions/aiActions.ts` - AI features
- `actions/noteActions.ts` - Note CRUD

**React Query Hooks:**

- `hooks/use-notes.ts` - Notes data
- `hooks/use-semantic-search.ts` - AI search

**AI Services:**

- `services/ai/content-analyzer.ts` - Quick Capture analysis
- `services/ai/semantic-search.ts` - Embedding-based search

**Utilities:**

- `lib/folderHelpers.ts` - Folder path matching
- `lib/actionHelpers.ts` - ActionResult creators

---

## ✨ Core Features

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

**Auto-Save Logic:**

```typescript
// Debounced save (2 seconds)
useEffect(() => {
  if (!isDataLoaded || !createdNoteId) return;

  const timer = setTimeout(() => {
    if (formState.title && formState.content) {
      handleAutoSave();
    }
  }, 2000);

  return () => clearTimeout(timer);
}, [formState.title, formState.content, formState.folderId]);
```

**Key Components:**

- `note-editor.tsx` - Main editor wrapper
- `note-metadata.tsx` - Toolbar (folder, tags, actions)
- `use-tiptap-editor.ts` - Editor configuration hook

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

**Path Utilities:**

```typescript
// Build full path: "Algorithms/Sorting"
buildFolderPath(folder, allFolders);

// Find by path (case-insensitive)
findFolderByPath("algorithms/sorting", allFolders);

// Format for AI context
formatFoldersForAI(folders);
// Output:
// - Algorithms
//   ├─ Sorting
//   └─ Graphs
```

### 3. Tags System

**Implementation:** Many-to-many via `NoteTag` junction table

**Rules:**

- Always lowercase (enforced in app)
- Hyphenated for multi-word (e.g., "hash-table")
- User-scoped unique names
- Case-insensitive matching

**Usage:**

```typescript
// Add tags to note (handles duplicates, normalization)
await createNote({
  title: "...",
  tags: ["Python", "algorithms", "sorting"], // Normalized to lowercase
});

// Tags automatically created if don't exist
// Existing tags reused (by name match)
```

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

**Example Results:**

```
Query: "binary search"
Results:
1. Binary Search Implementation in JavaScript → 53.1%
2. Binary Search Algorithm Implementation → 46.0%
3. Binary Search Explanation and Code → 44.1%
4. Introduction to Hash Tables → 27.6%
5. ...

(Threshold: 30%, Results: 3)
```

### 7. Notes List Views

**Routes:**

- `/notes` - All notes (with pinned favorites section)
- `/notes?folder=xyz` - Folder view (soft navigation)
- `/notes?tag=xyz` - Tag view (soft navigation)
- `/notes?favorites=true` - Favorites view (soft navigation)

**Components:**

- `notes-header.tsx` - Dynamic title + [+ New] button
- `search-filter.tsx` - Local keyword search
- `search-tabs.tsx` - Regular/AI search tabs (placeholders)
- `notes-content.tsx` - Content switcher based on query params
- `note-card.tsx` - Individual note card (click to open)

**Features:**

- Pinned section (top 5 favorites in "all" view)
- Recent notes (sorted by updatedAt)
- Empty states (context-aware)
- Loading skeletons
- Click card → opens editor (`/notes/:id`)

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

**AI Prompt Strategy:**

```typescript
// System prompt defines behavior
const SYSTEM_PROMPT = `
You are an intelligent note organization assistant.

FOLDER RULES:
1. ALWAYS prefer existing folders over creating new
2. Prefer most specific match (e.g., "Algorithms/Sorting" over "Algorithms")
3. Create NEW folder ONLY at root level (never suggest nested paths)
4. Use "Inbox" for vague/generic content
5. NEVER use generic folders like "test", "misc", "temp"

TAG RULES:
1. Clear content: 2-5 tags
2. Vague content: 0-1 tags
3. ALWAYS reuse existing tags when relevant
4. Add NEW specific tags for discoverability
5. Lowercase, hyphenated format

Respond with JSON only.
`;

// User prompt includes context
const USER_PROMPT = `
USER'S EXISTING FOLDERS:
- Algorithms
  ├─ Sorting
  └─ Graphs
- Recipes
- Inbox

USER'S EXISTING TAGS:
python, algorithms, sorting, cooking, recipes

CONTENT TO ANALYZE:
<user's pasted content>
`;
```

**Example Response:**

```json
{
  "title": "Merge Sort Implementation in Python",
  "folderPath": "Algorithms/Sorting",
  "tags": ["python", "merge-sort", "sorting", "algorithms"],
  "reasoning": "Merge sort code. Found exact match in 'Algorithms/Sorting'.",
  "confidence": "high"
}
```

**Key Files:**

- `actions/aiActions.ts` - `analyzeContentForOrganization()`
- `services/ai/content-analyzer.ts` - AI call logic
- `services/ai/prompts/analysis-prompt.ts` - Prompt template
- `lib/folderHelpers.ts` - `findFolderByPath()` for matching

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

**Embedding Preparation:**

```typescript
// What gets embedded
function prepareTextForEmbedding(
  title: string,
  content: string,
  tags?: string[]
): string {
  // 1. Strip HTML from content (CRITICAL!)
  const plainContent = stripHtml(content);

  // 2. Combine: title + tags + content
  let combined: string;
  if (tags && tags.length > 0) {
    const tagText = tags.join(", ");
    combined = `${title}\n\nTags: ${tagText}\n\n${plainContent}`;
  } else {
    combined = `${title}\n\n${plainContent}`;
  }

  // 3. Truncate to 8000 chars (~2k tokens)
  return combined.substring(0, 8000);
}
```

**Search Flow:**

```typescript
// 1. User searches
semanticSearchNotes({ query: "how to sort arrays" });

// 2. Fetch all notes with embedding metadata
const notes = await prisma.note.findMany({
  where: { userId },
  select: {
    id,
    title,
    content,
    tags,
    embedding,
    embeddingUpdatedAt,
    contentUpdatedAt,
  },
});

// 3. Check freshness & regenerate stale embeddings
const staleNotes = notes.filter(
  (note) => !note.embedding || note.contentUpdatedAt > note.embeddingUpdatedAt
);

if (staleNotes.length > 0) {
  // Prepare texts
  const texts = staleNotes.map((note) =>
    prepareTextForEmbedding(note.title, note.content, note.tags)
  );

  // Generate embeddings (parallel, batch of 10)
  const embeddings = await generateBatchEmbeddings(texts);

  // Update notes with new embeddings
  staleNotes.forEach((note, i) => {
    note.embedding = embeddings[i];
    note.embeddingUpdatedAt = new Date();
  });
}

// 4. Generate query embedding
const queryEmbedding = await generateEmbedding(query);

// 5. Calculate similarities
const results = notes
  .map((note) => ({
    note,
    similarity: cosineSimilarity(queryEmbedding, note.embedding),
  }))
  .filter((r) => r.similarity >= 0.3) // Threshold: 30%
  .sort((a, b) => b.similarity - a.similarity)
  .slice(0, 20); // Top 20 results

// 6. Save new embeddings to DB (background)
// Fire-and-forget, non-blocking

return results;
```

**Similarity Calculation:**

```typescript
// Cosine similarity: measures angle between vectors
// Returns 0.0 (opposite) to 1.0 (identical)
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}
```

**Performance Metrics:**

```
First Search (all embeddings need generation):
- 29 notes × 2-3s = ~60-90s total (parallel batching helps)
- Cost: ~$0.0003 (very cheap!)

Subsequent Searches (all embeddings cached):
- Generate query embedding only: ~200ms
- Calculate similarities: ~5ms
- Total: ~200-300ms ⚡
- Cost: ~$0.00001
```

**Key Files:**

- `actions/aiActions.ts` - `semanticSearchNotes()`
- `services/ai/semantic-search.ts` - Search orchestration
- `services/ai/utils/embeddings.ts` - Embedding generation
- `hooks/use-semantic-search.ts` - React Query hook

---

## 📐 Code Patterns & Conventions

### 1. TypeScript Rules

```typescript
// ✅ STRICT MODE ENABLED
// - No 'any' types (enforced by ESLint)
// - Explicit return types for functions
// - Proper null checking

// ✅ Type imports
import type { Note, Folder } from "@prisma/client";

// ✅ Type definitions
type NoteWithRelations = Note & {
  folder: Folder | null;
  tags: Array<{ tag: Tag }>;
};

// ✅ Proper null handling
const folder = note.folder ?? null; // Not: note.folder || null

// ✅ Type guards
function isNote(obj: unknown): obj is Note {
  return (
    typeof obj === "object" && obj !== null && "id" in obj && "title" in obj
  );
}
```

### 2. Validation Pattern

```typescript
// ✅ Zod schemas (centralized in src/schemas/)
import { z } from "zod";

export const createNoteSchema = z.object({
  title: z.string().min(1, "Title required").max(200),
  content: z.string(),
  folderId: z.string().nullable(),
  tags: z.array(z.string()).default([]),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;

// ✅ Usage in server actions
const validated = createNoteSchema.parse(input);
// Or with error handling:
const result = createNoteSchema.safeParse(input);
if (!result.success) {
  return createErrorResult({ error: result.error.message });
}
```

### 3. Error Handling

```typescript
// ✅ ActionResult pattern (no throwing in components)
export async function createNote(input: CreateNoteInput) {
  try {
    const userId = await requireAuth();
    const validated = createNoteSchema.parse(input);

    const note = await prisma.note.create({
      data: { ...validated, userId },
    });

    revalidatePath("/notes");
    return createSuccessResult(note);
  } catch (error) {
    // Specific error handling
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return createErrorResult({ error: "Duplicate entry" });
      }
    }

    // Generic fallback
    console.error("Create note error:", error);
    return createErrorResult({ error: "Failed to create note" });
  }
}

// ✅ Component usage
const result = await createNote(input);
if (!result.success) {
  toast.error(result.error);
  return;
}
// TypeScript knows result.data exists here
const note = result.data;
```

### 4. React Query Patterns

```typescript
// ✅ Query keys (centralized in lib/query-keys.ts)
export const NOTES_QUERY_KEY = ["notes"] as const;
export const FOLDERS_QUERY_KEY = ["folders"] as const;
export const TAGS_QUERY_KEY = ["tags"] as const;

export const noteKeys = {
  all: () => NOTES_QUERY_KEY,
  byFolder: (folderId: string) => [...NOTES_QUERY_KEY, "folder", folderId],
  byTag: (tagId: string) => [...NOTES_QUERY_KEY, "tag", tagId],
  detail: (id: string) => [...NOTES_QUERY_KEY, "detail", id],
};

// ✅ Query hooks
export function useNotesByFolder(folderId: string | null) {
  return useQuery({
    queryKey: folderId ? noteKeys.byFolder(folderId) : noteKeys.all(),
    queryFn: () => (folderId ? getNotesByFolder(folderId) : getAllNotes()),
    staleTime: 60000, // 1 minute
  });
}

// ✅ Mutation with optimistic updates
export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNote,

    onMutate: async (noteId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: NOTES_QUERY_KEY });

      // Snapshot previous value
      const previous = queryClient.getQueryData(NOTES_QUERY_KEY);

      // Optimistically remove note
      queryClient.setQueryData(NOTES_QUERY_KEY, (old: Note[]) =>
        old.filter((note) => note.id !== noteId)
      );

      return { previous };
    },

    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(NOTES_QUERY_KEY, context?.previous);
      toast.error("Failed to delete note");
    },

    onSettled: () => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY });
    },
  });
}
```

### 5. Component Patterns

```typescript
// ✅ Props interface
interface NoteCardProps {
  note: NoteWithRelations;
  onClick?: () => void;
  className?: string;
}

// ✅ Component with proper typing
export function NoteCard({ note, onClick, className }: NoteCardProps) {
  // Logic here

  return (
    <div className={cn("note-card", className)} onClick={onClick}>
      {/* JSX */}
    </div>
  );
}

// ✅ Avoid prop drilling - use composition
// Bad:
<Parent user={user} theme={theme} onUpdate={onUpdate}>
  <Child user={user} theme={theme} onUpdate={onUpdate}>
    <GrandChild user={user} theme={theme} onUpdate={onUpdate} />
  </Child>
</Parent>

// Good:
<UserProvider value={user}>
  <ThemeProvider value={theme}>
    <Parent>
      <Child>
        <GrandChild />
      </Child>
    </Parent>
  </ThemeProvider>
</UserProvider>
```

### 6. Naming Conventions

```typescript
// ✅ Files
note-card.tsx           // kebab-case for components
use-notes.ts            // kebab-case for hooks
noteActions.ts          // camelCase for actions/utils
NoteCard.tsx            // PascalCase acceptable for UI components

// ✅ Functions
function createNote()   // camelCase
function getNoteById()  // camelCase
async function handleSave() // async prefix not required

// ✅ Components
function NoteCard()     // PascalCase
function QuickCaptureModal() // PascalCase

// ✅ Hooks
function useNotes()     // camelCase with 'use' prefix
function useDebounce()  // camelCase with 'use' prefix

// ✅ Constants
const API_CONFIG        // UPPER_SNAKE_CASE
const MAX_RETRIES       // UPPER_SNAKE_CASE
const NOTES_QUERY_KEY   // UPPER_SNAKE_CASE

// ✅ Types/Interfaces
type NoteWithRelations  // PascalCase
interface CreateNoteInput // PascalCase
```

### 7. Import Order

```typescript
// 1. External libraries
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

// 2. Next.js imports
import { useRouter } from "next/navigation";
import Link from "next/link";

// 3. Components
import { Button } from "@/components/ui/button";
import { NoteCard } from "@/components/notes/note-card";

// 4. Hooks
import { useNotes } from "@/hooks/use-notes";

// 5. Actions
import { createNote } from "@/actions/noteActions";

// 6. Utils/Lib
import { cn } from "@/lib/utils";

// 7. Types
import type { Note } from "@prisma/client";
import type { NoteWithRelations } from "@/types/noteTypes";

// 8. Styles (if any)
import "./styles.css";
```

### 8. Comments Style

```typescript
// ✅ Explain "why", not "what"
// Bad:
// Set user to null
setUser(null);

// Good:
// Clear user state to trigger re-authentication flow
setUser(null);

// ✅ Document complex logic
/**
 * Calculate folder depth with circular reference prevention
 *
 * Traverses parent chain until reaching root or detecting cycle.
 * Max depth is 2 (3 levels: 0, 1, 2).
 *
 * @throws Error if circular reference detected
 */
function calculateFolderDepth(folder, allFolders, visited = new Set()) {
  // Implementation
}

// ✅ Mark TODOs clearly
// TODO(yourname): Add pagination for large note lists
// FIXME: Race condition when updating note tags
// HACK: Temporary workaround until Prisma supports nested upserts
```

---

## 🧭 Navigation & Routing

### Route Structure

```
/                          → Redirects to /notes
/sign-in                   → Clerk sign-in page
/sign-up                   → Clerk sign-up page

/notes                     → All notes (default view)
/notes?folder=xyz          → Folder view (SOFT NAV)
/notes?tag=xyz             → Tag view (SOFT NAV)
/notes?favorites=true      → Favorites view (SOFT NAV)
/notes/:id                 → Note editor (HARD NAV)
/notes/new                 → Create note (HARD NAV)
/notes/new?folder=xyz      → Pre-fill folder
```

### Navigation Pattern

**Soft Navigation (Query Params):**

- Same route, different query params
- No page reload
- Instant content swap
- Browser back/forward works
- Bookmarkable URLs

```typescript
// Sidebar folder click
<Link href={`/notes?folder=${folder.id}`}>{folder.name}</Link>

// Result: URL changes, content updates, NO reload ⚡
```

**Hard Navigation (Route Change):**

- Different routes
- Page loads
- Used for major context switches (list → editor)

```typescript
// Note card click
<Link href={`/notes/${note.id}`}>{note.title}</Link>

// Result: New page loads (editor mode)
```

### Click Behaviors

| Element                 | Action                  | Nav Type                        |
| ----------------------- | ----------------------- | ------------------------------- |
| Sidebar folder          | `/notes?folder=xyz`     | Soft ⚡                         |
| Sidebar tag             | `/notes?tag=xyz`        | Soft ⚡                         |
| Sidebar favorite (card) | `/notes/:id`            | Hard                            |
| Sidebar "View All"      | `/notes?favorites=true` | Soft ⚡                         |
| Logo                    | `/notes`                | Soft (if on /notes)             |
| Note card               | `/notes/:id`            | Hard                            |
| [+ New] button          | `/notes/new`            | Hard                            |
| Quick Capture → Save    | `/notes/:id`            | Hard (navigate to created note) |

### Keyboard Shortcuts

```
/           → Focus local search
Cmd/Ctrl+K  → Open global search modal
Esc         → Close modals
```

---

## 🔑 Key Implementation Details

### 1. Folder Path Matching (Quick Capture)

**Problem:** AI suggests paths like "Algorithms/Sorting", but DB stores flat structure with `parentId`.

**Solution:** Build paths dynamically and match

```typescript
// Build full path from folder object
function buildFolderPath(
  folder: FolderOption,
  allFolders: FolderOption[]
): string {
  if (!folder.parentId) return folder.name; // Root

  const parent = allFolders.find((f) => f.id === folder.parentId);
  if (!parent) return folder.name;

  // Recursive: "Parent/Child" or "GrandParent/Parent/Child"
  return `${buildFolderPath(parent, allFolders)}/${folder.name}`;
}

// Find folder by AI-suggested path
function findFolderByPath(
  folderPath: string,
  folders: FolderOption[]
): FolderOption | null {
  const normalizedPath = folderPath.toLowerCase().trim();

  // Build paths for all folders
  const matches = folders
    .map((folder) => ({
      folder,
      path: buildFolderPath(folder, folders).toLowerCase(),
    }))
    .filter(({ path }) => path === normalizedPath);

  if (matches.length === 0) return null;

  // Return deepest match (most specific)
  matches.sort((a, b) => b.folder.depth - a.folder.depth);
  return matches[0].folder;
}

// Usage in Quick Capture
const matchedFolder = findFolderByPath("Algorithms/Sorting", folders);
// Returns: { id: "...", name: "Sorting", parentId: "...", depth: 1 }
```

### 2. Tag Normalization

**Rules:**

- Always lowercase
- Hyphenated multi-word tags
- Case-insensitive duplicate prevention

```typescript
// In createNote action
async function createNote(input: CreateNoteInput) {
  // ... auth, validation ...

  // Process tags
  const tagNames = input.tags.map((t) => t.toLowerCase().trim());
  const uniqueTags = Array.from(new Set(tagNames));

  // Find or create tags (parallel)
  const tagRecords = await Promise.all(
    uniqueTags.map(async (tagName) => {
      return await prisma.tag.upsert({
        where: {
          userId_name: { userId, name: tagName },
        },
        create: { name: tagName, userId },
        update: {}, // No-op if exists
      });
    })
  );

  // Create note with tag links
  const note = await prisma.note.create({
    data: {
      title,
      content,
      userId,
      folderId,
      tags: {
        create: tagRecords.map((tag) => ({
          tagId: tag.id,
        })),
      },
    },
    include: { tags: { include: { tag: true } } },
  });

  return note;
}
```

### 3. Auto-Save Debouncing

**Problem:** Save on every keystroke = too many API calls

**Solution:** Debounce with 2-second delay

```typescript
// In NoteEditor component
const [formState, dispatch] = useReducer(noteFormReducer, initialState);
const [lastSaved, setLastSaved] = useState<Date | null>(null);

useEffect(() => {
  // Skip if note hasn't been created yet
  if (!createdNoteId || !isDataLoaded) return;

  // Skip if no content
  if (!formState.title || !formState.content) return;

  // Debounce: wait 2 seconds after last change
  const timer = setTimeout(async () => {
    const result = await updateNote({
      id: createdNoteId,
      ...formState,
    });

    if (result.success) {
      setLastSaved(new Date());
    }
  }, 2000);

  // Cleanup: cancel timer if user types again
  return () => clearTimeout(timer);
}, [formState.title, formState.content, formState.folderId, formState.tags]);
```

### 4. Optimistic Updates Pattern

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

### 5. Content Truncation for AI

```typescript
function truncateContent(
  content: string,
  maxLength = 10000
): {
  content: string;
  wasTruncated: boolean;
  originalLength: number;
} {
  if (content.length <= maxLength) {
    return {
      content,
      wasTruncated: false,
      originalLength: content.length,
    };
  }

  // Truncate and add notice for AI
  const truncated = content.substring(0, maxLength);
  const withNotice = truncated + "\n\n[TRUNCATED: Original content was longer]";

  return {
    content: withNotice,
    wasTruncated: true,
    originalLength: content.length,
  };
}
```

### 6. HTML Stripping for Embeddings

```typescript
// Strip HTML tags to get plain text for embeddings
function stripHtml(html: string): string {
  // Remove all HTML tags
  let text = html.replace(/<[^>]*>/g, "");

  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Normalize whitespace
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

// Usage
const plainText = stripHtml(note.content);
// Input:  "<h1>Hello</h1><p>World</p>"
// Output: "Hello World"
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

### 🚧 Not Implemented

- Bulk operations (multi-select, batch delete/move)
- Export functionality (Markdown, PDF, JSON)
- Collaboration features (sharing, permissions)
- Version history / undo
- Dark mode toggle (uses system preference)
- Keyboard shortcuts (beyond / and Cmd+K)
- Note templates
- Reminders/due dates
- Links between notes
- Graph view

---

## 🎯 Quick Reference

### Adding a New Feature - Checklist

1. **Database:**

   - [ ] Update Prisma schema if needed
   - [ ] Run migration: `npx prisma migrate dev`
   - [ ] Update types: `npx prisma generate`

2. **Validation:**

   - [ ] Create Zod schema in `src/schemas/`
   - [ ] Export type: `type Input = z.infer<typeof schema>`

3. **Server Action:**

   - [ ] Create action in `src/actions/`
   - [ ] Use ActionResult pattern
   - [ ] Add authentication: `const userId = await requireAuth()`
   - [ ] Validate input: `const validated = schema.parse(input)`
   - [ ] Revalidate cache if needed: `revalidatePath('/')`

4. **React Query Hook:**

   - [ ] Add query key to `lib/query-keys.ts`
   - [ ] Create hook in `src/hooks/`
   - [ ] Add optimistic updates for mutations
   - [ ] Invalidate related queries in `onSettled`

5. **Component:**

   - [ ] Create component in appropriate folder
   - [ ] Use proper TypeScript types
   - [ ] Handle loading/error states
   - [ ] Add toast notifications

6. **Testing:**
   - [ ] Test happy path
   - [ ] Test error cases
   - [ ] Test optimistic updates
   - [ ] Verify cache invalidation

### Common Tasks

**Add new folder color:**

```prisma
// 1. Update schema
enum FolderColor {
  // ... existing colors
  ORANGE  // New color
}

// 2. Run migration
// 3. Update FolderModal color picker
```

**Add new server action:**

```typescript
// src/actions/noteActions.ts
export async function myAction(
  input: MyInput
): Promise<ActionResult<MyOutput>> {
  try {
    const userId = await requireAuth();
    const validated = mySchema.parse(input);
    const result = await prisma.note.doSomething(validated);
    revalidatePath("/notes");
    return createSuccessResult(result);
  } catch (error) {
    return createErrorResult({ error: "Failed" });
  }
}
```

**Add new React Query hook:**

```typescript
// src/hooks/use-notes.ts
export function useMyQuery() {
  return useQuery({
    queryKey: ["my-data"],
    queryFn: myAction,
  });
}

export function useMyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: myAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-data"] });
      toast.success("Success!");
    },
    onError: () => {
      toast.error("Failed!");
    },
  });
}
```

---

## 📚 Resources & References

**Documentation:**

- [Next.js 14 Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [Tiptap Docs](https://tiptap.dev)
- [Clerk Docs](https://clerk.com/docs)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)

**Key Dependencies:**

```json
{
  "dependencies": {
    "next": "^14.x",
    "react": "^18.x",
    "typescript": "^5.x",
    "@tanstack/react-query": "^5.x",
    "@prisma/client": "^5.x",
    "@clerk/nextjs": "^4.x",
    "@tiptap/react": "^2.x",
    "@tiptap/starter-kit": "^2.x",
    "openai": "^4.x",
    "zod": "^3.x",
    "zustand": "^4.x",
    "sonner": "^1.x",
    "lowlight": "^3.x"
  }
}
```

**Environment Variables Required:**

```env
# Database
DATABASE_URL="postgresql://..."

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
CLERK_WEBHOOK_SECRET="whsec_..."

# OpenAI
OPENAI_API_KEY="sk-..."

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 🎓 Learning from This Codebase

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

---

## 🔄 Data Flow Examples

### Example 1: Creating a Note

```
User clicks [+ New Note]
    ↓
Navigate to /notes/new
    ↓
NoteEditor mounts in "create" mode
    ↓
User types title + content
    ↓
User selects folder, adds tags
    ↓
User clicks [Save] or auto-save triggers
    ↓
Call createNote() server action
    ↓
Server: Authenticate user
    ↓
Server: Validate input (Zod)
    ↓
Server: Create note in DB
    ↓
Server: Process tags (find or create)
    ↓
Server: Link tags to note
    ↓
Server: Return success result
    ↓
React Query: onSuccess callback
    ↓
Invalidate queries (notes, folders, tags)
    ↓
Show success toast
    ↓
Navigate to /notes/:id (edit mode)
    ↓
NoteEditor remounts with note data
```

### Example 2: Quick Capture Flow

```
User opens Quick Capture (Cmd+Shift+C or button)
    ↓
Modal appears (step: "capture")
    ↓
User pastes code/text
    ↓
User clicks [Organize with AI]
    ↓
Modal shows loading (step: "processing")
    ↓
Call analyzeContentForOrganization()
    ↓
Server: Fetch user's folders & tags
    ↓
Server: Build AI prompt with context
    ↓
Server: Call OpenAI (gpt-4o-mini)
    ↓
Server: Parse JSON response
    ↓
Server: Normalize tags (lowercase)
    ↓
Server: Return suggestions
    ↓
Modal shows review (step: "review")
    ↓
findFolderByPath() matches AI suggestion
    ↓
Pre-fill form with AI suggestions
    ↓
User reviews, edits if needed
    ↓
User clicks [Save Note]
    ↓
Modal shows "Formatting..."
    ↓
Call formatContentAction()
    ↓
Server: Format plain text → rich HTML
    ↓
Modal shows "Saving..."
    ↓
Create folder if AI suggested new one
    ↓
Call createNote() with formatted content
    ↓
Server: Create note + tags
    ↓
Success! Navigate to note editor
    ↓
Modal closes
```

### Example 3: Semantic Search

```
User presses Cmd+K
    ↓
SearchModal opens
    ↓
User switches to "AI Search" tab
    ↓
User types: "how to sort arrays"
    ↓
Query debounced (1 second)
    ↓
Call semanticSearchNotes()
    ↓
Server: Fetch all user notes with embeddings
    ↓
Check embedding freshness for each note
    ↓
Identify stale notes (5 need regeneration)
    ↓
Prepare texts for stale notes:
    - Strip HTML from content
    - Combine: title + tags + content
    - Truncate to 8000 chars
    ↓
Generate embeddings (parallel, batch of 10)
    ↓
Call OpenAI: 5 texts → 5 embeddings (1536-dim)
    ↓
Update notes with new embeddings
    ↓
Generate query embedding: "how to sort arrays"
    ↓
Calculate cosine similarity: query vs all notes
    ↓
Filter by threshold (30%)
    ↓
Sort by similarity (highest first)
    ↓
Return top 20 results
    ↓
Save new embeddings to DB (background)
    ↓
UI: Show results with similarity scores
    ↓
User clicks result → navigate to note
```

---

## 🐛 Debugging Tips

### Common Issues

**Issue: "Module not found" error**

```bash
# Solution: Clear Next.js cache
rm -rf .next
npm run dev
```

**Issue: Prisma schema changes not reflecting**

```bash
# Solution: Regenerate Prisma client
npx prisma generate
npx prisma db push  # or migrate dev
```

**Issue: React Query not refetching**

```typescript
// Solution: Check query keys match exactly
queryClient.invalidateQueries({ queryKey: ["notes"] });
// Must match the key used in useQuery
```

**Issue: Server action returns undefined**

```typescript
// Problem: Missing revalidatePath or return statement
export async function myAction() {
  await prisma.note.create({...});
  // Missing: revalidatePath('/notes');
  // Missing: return createSuccessResult(note);
}
```

**Issue: Optimistic update not rolling back**

```typescript
// Problem: Not returning context in onMutate
onMutate: async (newData) => {
  const previous = queryClient.getQueryData(key);
  queryClient.setQueryData(key, newData);
  // Must return context:
  return { previous };
};
```

**Issue: Embeddings not regenerating**

```typescript
// Check contentUpdatedAt is being set
// In noteActions.ts, updateNote():
await prisma.note.update({
  where: { id },
  data: {
    title,
    content,
    contentUpdatedAt: new Date(), // ← Required!
  },
});
```

### Logging Strategy

```typescript
// Development: Verbose logging
if (process.env.NODE_ENV === "development") {
  console.log("🔍 [Debug]", data);
}

// Production: Error logging only
console.error("❌ [Error]", error);

// AI Operations: Always log for debugging
console.log("🤖 [AI Analysis] Query:", query);
console.log("📊 [Similarity] Score:", score);
console.log("✅ [Success] Created note:", noteId);
```

---

## 🚀 Deployment Checklist

### Before Deploying

- [ ] Update environment variables on Vercel
- [ ] Run `npx prisma migrate deploy` on production DB
- [ ] Test authentication flow
- [ ] Verify OpenAI API key has credits
- [ ] Check Clerk webhook is configured
- [ ] Test Quick Capture with real data
- [ ] Test semantic search performance
- [ ] Verify image uploads work (or disable if using base64)
- [ ] Check mobile responsiveness
- [ ] Review error handling/logging

### Post-Deployment

- [ ] Monitor error logs
- [ ] Check API usage (OpenAI costs)
- [ ] Verify database performance
- [ ] Test search with real user content
- [ ] Monitor embedding generation times
- [ ] Check cache invalidation working
- [ ] Verify webhooks firing correctly

---

## 📈 Performance Considerations

### Current Performance

**Fast Operations (< 100ms):**

- Local search/filtering
- Client-side rendering
- Zustand state updates
- Cached React Query data

**Medium Operations (100-500ms):**

- Database queries (with indexes)
- Server actions (simple CRUD)
- Semantic search (cached embeddings)

**Slow Operations (500ms+):**

- AI content analysis (2-5s)
- Content formatting (2-4s)
- First semantic search on note (2-3s per note)
- Batch embedding generation

### Optimization Strategies

**Database:**

- Indexes on frequently queried fields ✅
- Pagination for large lists ❌ (not implemented)
- Connection pooling via Prisma ✅

**Caching:**

- React Query caching (1 min stale time) ✅
- Embedding caching in database ✅
- Static page generation ❌ (using SSR)

**API Calls:**

- Batch embedding generation ✅
- Lazy evaluation for embeddings ✅
- Debounced auto-save ✅
- Query deduplication (React Query) ✅

**Future Improvements:**

- Add pagination for notes list
- Implement virtual scrolling for large lists
- Move images to CDN
- Add service worker for offline support
- Implement incremental static regeneration

---

## 🎯 Design Patterns Summary

### State Management

```
Database State → React Query
UI State (global) → Zustand
Form State (complex) → useReducer
Form State (simple) → useState
```

### Data Flow

```
Component → Hook → Server Action → Database
         ← Hook ← ActionResult ←
```

### Error Handling

```
try/catch → ActionResult → Component checks .success
                          ↓
                    toast.error() or success UI
```

### Caching Strategy

```
React Query:
- Stale time: 1 minute
- Cache time: 5 minutes
- Refetch on window focus: enabled

Database:
- Embeddings cached until content changes
- Folder structure rarely changes (longer cache OK)
```

---

## 💡 Tips for New Developers

### Getting Started

1. **Understand the data flow first**

   - Follow one feature end-to-end
   - Trace from UI → Hook → Action → Database
   - Use console.logs liberally

2. **Start with reading, not writing**

   - Explore existing components
   - See how queries are structured
   - Understand the patterns before changing them

3. **Use TypeScript to your advantage**

   - Let autocomplete guide you
   - Follow type errors to understand relationships
   - Don't use `any` as an escape hatch

4. **Test in the browser first**
   - React Query DevTools (shows cache state)
   - Network tab (see server actions)
   - Console (check logs)

### Common Patterns to Remember

**Creating a new feature:**

```
1. Schema → 2. Server Action → 3. Hook → 4. Component
```

**Adding a field to existing model:**

```
1. Update Prisma schema
2. Migrate database
3. Update Zod schemas
4. Update server actions
5. Update components
```

**Debugging React Query:**

```
1. Check query key matches
2. Verify invalidation happens
3. Check staleTime/cacheTime settings
4. Use React Query DevTools
```

**Debugging optimistic updates:**

```
1. onMutate must return context
2. onError receives context as 3rd arg
3. setQueryData must match getQueryData key
4. onSettled should invalidate queries
```

---

## 📝 Final Notes

### What Makes This Codebase Good

✅ **Type Safety:** Full TypeScript, no `any` types
✅ **Patterns:** Consistent patterns throughout
✅ **Error Handling:** ActionResult pattern prevents throws in UI
✅ **Performance:** Optimistic updates for instant feedback
✅ **AI Integration:** Smart, cost-effective implementation
✅ **Code Organization:** Clear separation of concerns
✅ **Scalability:** Patterns support growth
✅ **Developer Experience:** Good tooling, clear structure

### What Could Be Improved

⚠️ **Testing:** No unit/integration tests yet
⚠️ **Documentation:** Some inline comments missing
⚠️ **Accessibility:** Limited ARIA labels, keyboard nav
⚠️ **Mobile:** Not thoroughly tested
⚠️ **Performance:** No pagination, no lazy loading
⚠️ **Images:** Using base64 (needs cloud storage)
⚠️ **Monitoring:** No error tracking (Sentry, etc.)

---

## 🎉 Conclusion

This documentation covers the complete technical architecture of the Second Brain app. It's designed to be:

- **Comprehensive:** All key systems documented
- **Practical:** Real examples, not just theory
- **Maintainable:** Easy to update as project evolves
- **Onboarding-friendly:** New devs can get started quickly

**For new AI chats:** Copy this entire document to provide full context.

**For ongoing work:** Reference specific sections as needed.

**For debugging:** Use the debugging tips and common issues sections.

---

**Version:** 2.0  
**Last Updated:** October 2025  
**Maintainer:** Project Owner  
**Status:** Production-ready MVP

---

_This documentation is a living document. Update it as the project evolves._

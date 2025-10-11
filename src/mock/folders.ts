/**
 * Mock Folders Data
 * Represents hierarchical folder structure (max 3 levels)
 */

export interface MockFolder {
  id: string;
  name: string;
  noteCount: number;
  isInbox?: boolean; // Special inbox folder
  children?: MockFolder[];
}

export const mockFolders: MockFolder[] = [
  // Inbox - Always first, pinned
  {
    id: "inbox",
    name: "Inbox",
    noteCount: 5,
    isInbox: true,
    children: [],
  },

  // Regular folders with hierarchy
  {
    id: "folder-1",
    name: "CS 101",
    noteCount: 12,
    children: [
      {
        id: "folder-1-1",
        name: "Algorithms",
        noteCount: 8,
        children: [
          {
            id: "folder-1-1-1",
            name: "Sorting",
            noteCount: 3,
            children: [],
          },
        ],
      },
      {
        id: "folder-1-2",
        name: "Data Structures",
        noteCount: 4,
        children: [],
      },
    ],
  },
  {
    id: "folder-2",
    name: "Math 201",
    noteCount: 7,
    children: [
      {
        id: "folder-2-1",
        name: "Calculus",
        noteCount: 7,
        children: [],
      },
    ],
  },
  {
    id: "folder-3",
    name: "Physics 101",
    noteCount: 3,
    children: [],
  },
  {
    id: "folder-4",
    name: "Web Development",
    noteCount: 15,
    children: [
      {
        id: "folder-4-1",
        name: "React",
        noteCount: 9,
        children: [],
      },
      {
        id: "folder-4-2",
        name: "Node.js",
        noteCount: 6,
        children: [],
      },
    ],
  },
];

/**
 * Get inbox folder
 */
export function getInboxFolder(): MockFolder | undefined {
  return mockFolders.find((f) => f.isInbox);
}

/**
 * Get regular folders (excluding inbox)
 */
export function getRegularFolders(): MockFolder[] {
  return mockFolders.filter((f) => !f.isInbox);
}

/**
 * Get total folder count (including nested)
 */
export function getTotalFolderCount(): number {
  const countFolders = (folders: MockFolder[]): number => {
    return folders.reduce((count, folder) => {
      return count + 1 + (folder.children ? countFolders(folder.children) : 0);
    }, 0);
  };
  return countFolders(mockFolders);
}

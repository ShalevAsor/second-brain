/**
 * Mock Tags Data
 * Represents tags/labels used across notes with usage counts
 */

export interface MockTag {
  id: string;
  name: string;
  count: number; // Number of notes with this tag
  color?: string; // Optional color for future use
}

export const mockTags: MockTag[] = [
  {
    id: "tag-1",
    name: "python",
    count: 23,
  },
  {
    id: "tag-2",
    name: "javascript",
    count: 18,
  },
  {
    id: "tag-3",
    name: "algorithms",
    count: 12,
  },
  {
    id: "tag-4",
    name: "react",
    count: 9,
  },
  {
    id: "tag-5",
    name: "calculus",
    count: 7,
  },
  {
    id: "tag-6",
    name: "data-structures",
    count: 6,
  },
  {
    id: "tag-7",
    name: "recursion",
    count: 8,
  },
  {
    id: "tag-8",
    name: "sorting",
    count: 5,
  },
  {
    id: "tag-9",
    name: "physics",
    count: 4,
  },
  {
    id: "tag-10",
    name: "linear-algebra",
    count: 3,
  },
];

/**
 * Get top N tags by usage count
 */
export function getTopTags(limit: number = 5): MockTag[] {
  return [...mockTags].sort((a, b) => b.count - a.count).slice(0, limit);
}

/**
 * Get total number of tags
 */
export function getTotalTagsCount(): number {
  return mockTags.length;
}

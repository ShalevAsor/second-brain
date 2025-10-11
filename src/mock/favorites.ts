/**
 * Mock Favorites Data
 * Represents user's favorited/starred notes for quick access
 */

export interface MockFavorite {
  id: string;
  title: string;
  folder?: string;
  tags?: string[];
  preview?: string;
}

export const mockFavorites: MockFavorite[] = [
  {
    id: "fav-1",
    title: "Recursion Cheat Sheet",
    folder: "CS 101/Algorithms",
    tags: ["important", "algorithms"],
    preview: "Base case: if n <= 1 return...",
  },
  {
    id: "fav-2",
    title: "Binary Search Template",
    folder: "CS 101/Algorithms",
    tags: ["important", "searching"],
    preview: "left = 0, right = len(arr) - 1...",
  },
  {
    id: "fav-3",
    title: "Integration Formulas",
    folder: "Math 201/Calculus",
    tags: ["formulas", "calculus"],
    preview: "∫ x^n dx = x^(n+1)/(n+1) + C",
  },
];

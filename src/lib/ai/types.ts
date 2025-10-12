/**
 * AI Service Type Definitions
 *
 * Centralized types for AI-powered features across the app.
 * Used by Quick Capture, semantic search, and future AI features.
 */

/**
 * Configuration constants for AI services
 */
export const AI_CONFIG = {
  /**
   * Maximum content length for AI analysis
   * Content longer than this will be truncated with a notice
   */
  MAX_CONTENT_LENGTH: 10000, // ~10k characters = ~2.5k tokens
} as const;

/**
 * AI Analysis Result for Quick Capture
 * Contains AI-generated suggestions for organizing captured content
 */
export interface ContentAnalysisResult {
  title: string; // AI-generated title (max 100 chars)
  folderPath: string | null; // Suggested folder path (e.g., "CS 101/Algorithms")
  tags: string[]; // Suggested tag names (lowercase, no duplicates)
  reasoning: string; // AI's explanation of its choices
  confidence: "high" | "medium" | "low"; // AI's confidence level
  wasTruncated?: boolean; // True if content was truncated due to length
}

/**
 * Content truncation metadata
 * Returned when content length is checked/processed
 */
export interface TruncationResult {
  content: string;
  wasTruncated: boolean;
  originalLength: number;
}

/**
 * Truncate content if exceeds maximum length
 * Adds notice to content for AI context
 *
 * @param content - Raw content to check/truncate
 * @returns Processed content with truncation metadata
 */
export function truncateContent(content: string): TruncationResult {
  const maxLength = AI_CONFIG.MAX_CONTENT_LENGTH;

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

/**
 * OpenAI Error Handling
 * Custom error type for AI service failures
 */
export class AIServiceError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = "AIServiceError";
  }
}

/**
 * Text Processing Utilities
 *
 * Functions for processing and preparing text content.
 * Used across AI services for text manipulation.
 */

import { AI_CONFIG } from "../core/config";
import { stripHtml } from "./html-sanitizer";

/**
 * Content truncation metadata
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
 * @param maxLength - Optional max length (defaults to config)
 * @returns Processed content with truncation metadata
 */
export function truncateContent(
  content: string,
  maxLength?: number
): TruncationResult {
  const limit = maxLength || AI_CONFIG.MAX_CONTENT_LENGTH;

  if (content.length <= limit) {
    return {
      content,
      wasTruncated: false,
      originalLength: content.length,
    };
  }

  // Truncate and add notice for AI
  const truncated = content.substring(0, limit);
  const withNotice = truncated + "\n\n[TRUNCATED: Original content was longer]";

  return {
    content: withNotice,
    wasTruncated: true,
    originalLength: content.length,
  };
}

/**
 * Prepare text for embedding
 * Combines title and content, strips HTML, and truncates
 *
 * @param title - Note title
 * @param content - Note content (may contain HTML)
 * @param tags - Note tags to add to the content
 * @returns Prepared plain text ready for embedding
 */
export function prepareTextForEmbedding(
  title: string,
  content: string,
  tags?: string[]
): string {
  // Strip HTML from content first (CRITICAL for embeddings!)
  const plainContent = stripHtml(content);

  let combined: string;

  if (tags && tags.length > 0) {
    const tagText = tags.join(", ");
    combined = `${title}\n\nTags: ${tagText}\n\n${plainContent}`;
  } else {
    combined = `${title}\n\n${plainContent}`;
  }

  // Truncate to max length
  const maxLength = AI_CONFIG.EMBEDDING_MAX_LENGTH;
  console.log("[prepareTextForEmbedding]:Combined:", combined);
  console.log("[prepareTextForEmbedding]:END OF Combined:");
  if (combined.length <= maxLength) {
    return combined;
  }

  return combined.substring(0, maxLength);
}

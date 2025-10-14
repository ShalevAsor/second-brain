/**
 * AI Service Configuration
 *
 * Centralized configuration for all AI-powered features.
 * Adjust these values to tune performance, costs, and quality.
 */

export const AI_CONFIG = {
  /**
   * Content Analysis (Quick Capture)
   */
  MAX_CONTENT_LENGTH: 10000, // Max chars for AI analysis (~2.5k tokens)

  /**
   * Content Formatting
   */
  MAX_FORMATTING_LENGTH: 10000, // Max chars for content formatting

  /**
   * OpenAI Models
   */
  CHAT_MODEL: "gpt-4o-mini" as const, // For analysis & formatting
  EMBEDDING_MODEL: "text-embedding-3-small" as const, // For semantic search

  /**
   * Embedding Configuration
   */
  EMBEDDING_DIMENSIONS: 1536, // text-embedding-3-small dimensions
  EMBEDDING_MAX_LENGTH: 8000, // Max chars per embedding (~2k tokens)

  /**
   * Semantic Search Configuration
   */
  SIMILARITY_THRESHOLD: 0.3, // Min similarity for search results (0.0-1.0)
  MAX_SEARCH_RESULTS: 20, // Max results to return

  /**
   * API Configuration
   */
  API_TIMEOUT: 30000, // Request timeout in ms (30 seconds)
  MAX_RETRIES: 3, // Max retry attempts for failed requests
  RETRY_DELAY: 1000, // Initial retry delay in ms (exponential backoff)
} as const;

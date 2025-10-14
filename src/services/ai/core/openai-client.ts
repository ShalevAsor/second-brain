/**
 * OpenAI Client Singleton
 *
 * Provides a single, reusable OpenAI client instance across the application.
 * This ensures efficient connection pooling and configuration management.
 */

import OpenAI from "openai";
import { AIServiceError } from "./types";

// Singleton instance (created once, reused everywhere)
let openaiInstance: OpenAI | null = null;

/**
 * Get or create OpenAI client instance
 *
 * Uses singleton pattern to avoid creating multiple clients.
 * Throws descriptive error if API key is missing.
 */
export function getOpenAIClient(): OpenAI {
  // Return existing instance if already created
  if (openaiInstance) {
    return openaiInstance;
  }

  // Validate API key exists
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new AIServiceError(
      "OpenAI API key not found. Please set OPENAI_API_KEY in your environment variables."
    );
  }

  // Create and cache new instance
  openaiInstance = new OpenAI({
    apiKey,
    // Timeout for each API request (not instance lifetime)
    timeout: 30000, // 30 seconds per request
  });

  return openaiInstance;
}

/**
 * Reset client instance (useful for testing)
 * Not used in production, but helpful for unit tests
 */
export function resetOpenAIClient(): void {
  openaiInstance = null;
}

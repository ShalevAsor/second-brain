/**
 * Content Formatting Service
 *
 * AI-powered content formatting for rich text editor.
 * Converts plain text to Tiptap-compatible HTML.
 */

import { getOpenAIClient } from "./core/openai-client";
import { buildFormattingPrompt } from "./prompts/formatting-prompt";
import {
  ContentFormattingResult,
  ContentFormattingOptions,
  AIServiceError,
} from "./core/types";
import { AI_CONFIG } from "./core";

/**
 * Format content with AI
 *
 * Takes plain text and returns formatted HTML ready for Tiptap editor.
 * Intelligently detects content type (code, recipe, article, etc.) and formats accordingly.
 *
 * @param content - Plain text content to format
 * @param options - Optional formatting configuration
 * @returns Formatting result with HTML content
 * @throws AIServiceError if formatting fails
 */
export async function formatContentWithAI(
  content: string,
  options: ContentFormattingOptions = {}
): Promise<ContentFormattingResult> {
  // Validate input
  if (!content || content.trim().length === 0) {
    throw new AIServiceError("Content cannot be empty");
  }

  // Check content length
  const maxLength = options.maxLength || AI_CONFIG.MAX_FORMATTING_LENGTH;
  if (content.length > maxLength) {
    return {
      formattedContent: content, // Return original
      wasFormatted: false,
      error: `Content too long to format (max ${maxLength.toLocaleString()} characters)`,
    };
  }

  try {
    // Get OpenAI client
    const client = getOpenAIClient();

    // Build formatting prompt
    const { system, user } = buildFormattingPrompt(content);

    console.log("🎨 [Formatter] Formatting content...");
    console.log("   Length:", content.length, "characters");

    // Call OpenAI API
    const completion = await client.chat.completions.create({
      model: AI_CONFIG.CHAT_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.3, // Low temperature for consistent formatting
      max_completion_tokens: 4000, // Allow longer responses for formatted content
    });

    // Extract response
    const formattedContent = completion.choices[0]?.message?.content;
    if (!formattedContent) {
      throw new AIServiceError("Empty response from OpenAI");
    }

    console.log("✅ [Formatter] Content formatted successfully");
    console.log("   Output length:", formattedContent.length, "characters");

    return {
      formattedContent: formattedContent.trim(),
      wasFormatted: true,
    };
  } catch (error) {
    console.error("❌ [Formatter] Error:", error);

    // Handle specific errors
    if (error instanceof AIServiceError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new AIServiceError(
        `Content formatting failed: ${error.message}`,
        error
      );
    }

    // Unknown error
    throw new AIServiceError(
      "Unexpected error during content formatting",
      error
    );
  }
}

/**
 * Check if content can be formatted
 *
 * Quick validation without calling AI.
 * Useful for showing/hiding format button in UI.
 *
 * @param content - Content to check
 * @param maxLength - Optional max length (defaults to config)
 * @returns Whether content is formattable
 */
export function canFormatContent(content: string, maxLength?: number): boolean {
  const limit = maxLength || AI_CONFIG.MAX_FORMATTING_LENGTH;
  return content.trim().length > 0 && content.length <= limit;
}

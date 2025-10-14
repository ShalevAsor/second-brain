/**
 * Content Analysis Service
 *
 * Core AI functionality for Quick Capture feature.
 * Analyzes user content and returns structured organization suggestions.
 */

import { getOpenAIClient } from "./core/openai-client";
import { ContentAnalysisResult, AIServiceError } from "./core/types";
import type { FolderOption } from "@/types/folderTypes";
import { buildAnalysisPrompt } from "./prompts";

/**
 * Analyze content and generate organization suggestions
 *
 * @param content - Raw text content pasted by user
 * @param userFolders - User's existing folders for context
 * @param userTags - User's existing tags for context
 * @returns AI-generated suggestions (title, folder, tags, reasoning)
 * @throws AIServiceError if analysis fails
 */
export async function analyzeContent(
  content: string,
  userFolders: FolderOption[],
  userTags: string[]
): Promise<ContentAnalysisResult> {
  // Validate input
  if (!content.trim()) {
    throw new AIServiceError("Content cannot be empty");
  }

  try {
    // Get OpenAI client
    const client = getOpenAIClient();

    // Build prompt with user's folder and tag context
    const { system, user } = buildAnalysisPrompt(
      content,
      userFolders,
      userTags
    );

    // Call OpenAI API with structured output
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" }, // Force JSON response
      temperature: 0.7, // Balance creativity and consistency
      max_completion_tokens: 500, // Limit response length (cost optimization)
    });

    // Extract and parse response
    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new AIServiceError("Empty response from OpenAI");
    }

    // Parse JSON response
    const parsed = JSON.parse(responseText) as ContentAnalysisResult;

    // Validate response structure
    if (!parsed.title || !Array.isArray(parsed.tags)) {
      throw new AIServiceError("Invalid response structure from AI");
    }

    // Normalize tags (lowercase, trim whitespace, remove duplicates)
    parsed.tags = Array.from(
      new Set(
        parsed.tags
          .map((tag) => tag.toLowerCase().trim())
          .filter((tag) => tag.length > 0)
      )
    ).slice(0, 5); // Max 5 tags

    // Truncate title if too long
    if (parsed.title.length > 100) {
      parsed.title = parsed.title.substring(0, 97) + "...";
    }

    return parsed;
  } catch (error) {
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      throw new AIServiceError(
        "Failed to parse AI response. Please try again.",
        error
      );
    }

    // Handle OpenAI API errors
    if (error instanceof Error) {
      throw new AIServiceError(`AI analysis failed: ${error.message}`, error);
    }

    // Unknown error
    throw new AIServiceError("Unexpected error during AI analysis", error);
  }
}

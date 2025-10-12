"use server";

/**
 * AI-Powered Server Actions
 *
 * Handles AI features like Quick Capture content analysis.
 * All actions run on the server with proper authentication.
 */

import { analyzeContent } from "@/lib/ai/content-analyzer";
import {
  AIServiceError,
  AI_CONFIG,
  truncateContent,
  type ContentAnalysisResult,
} from "@/lib/ai/types";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSuccessResult, createErrorResult } from "@/lib/actionHelpers";
import type { ActionResult } from "@/types/actionTypes";
import type { FolderOption } from "@/types/folderTypes";

/**
 * Analyze content for Quick Capture
 *
 * Takes raw pasted content and returns AI-generated organization suggestions.
 * Includes user's existing folders and tags as context for better suggestions.
 * Automatically truncates very long content with user notification.
 *
 * @param content - Raw text content pasted by user
 * @returns ActionResult with AI suggestions (includes truncation flag if applicable)
 */
export async function analyzeContentForOrganization(
  content: string
): Promise<ActionResult<ContentAnalysisResult>> {
  try {
    // 1. Authenticate user
    const userId = await requireAuth();

    // 2. Validate input
    if (!content || content.trim().length === 0) {
      return createErrorResult({
        error: "Content cannot be empty",
      });
    }

    // 3. Handle content length with smart truncation
    const {
      content: processedContent,
      wasTruncated,
      originalLength,
    } = truncateContent(content);
    // ✅ LOG: Content info
    console.log(
      "📝 [AI Analysis] Content length:",
      originalLength,
      "| Truncated:",
      wasTruncated
    );

    // 4. Fetch user's folders for AI context
    const folders = await prisma.folder.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        parentId: true,
        isDefault: true,
        depth: true,
      },
      orderBy: [{ depth: "asc" }, { name: "asc" }],
    });

    const folderOptions: FolderOption[] = folders.map((f) => ({
      id: f.id,
      name: f.name,
      parentId: f.parentId,
      isDefault: f.isDefault,
      depth: f.depth,
    }));

    // 5. Fetch user's tags for AI context
    const tags = await prisma.tag.findMany({
      where: { userId },
      select: { name: true },
      orderBy: { name: "asc" },
    });

    const tagNames = tags.map((t) => t.name);

    // ✅ LOG: User context
    console.log("📁 [AI Analysis] User has:", folders.length, "folders");
    console.log(
      "   Folders:",
      folderOptions.map((f) => f.name).join(", ") || "none"
    );
    console.log("🏷️  [AI Analysis] User has:", tags.length, "tags");
    console.log("   Tags:", tagNames.join(", ") || "none");

    // 6. Call AI analyzer with processed content
    const analysis = await analyzeContent(
      processedContent,
      folderOptions,
      tagNames
    );

    // ✅ LOG: AI response
    console.log("🤖 [AI Analysis] AI Response:");
    console.log("   Title:", analysis.title);
    console.log("   Folder:", analysis.folderPath || "null");
    console.log("   Tags:", analysis.tags.join(", ") || "none");
    console.log("   Confidence:", analysis.confidence);
    console.log("   Reasoning:", analysis.reasoning);

    // 7. Create result with truncation info if applicable
    const result: ContentAnalysisResult = {
      ...analysis,
      ...(wasTruncated && {
        wasTruncated: true,
        reasoning: `${
          analysis.reasoning
        }\n\n⚠️ Note: Content was truncated from ${originalLength.toLocaleString()} to ${AI_CONFIG.MAX_CONTENT_LENGTH.toLocaleString()} characters.`,
      }),
    };

    return createSuccessResult(result);
  } catch (error) {
    console.error(
      "❌ [AI Analysis] Error:",
      error instanceof Error ? error.message : "Unknown"
    );

    if (error instanceof AIServiceError) {
      return createErrorResult({ error: error.message });
    }

    console.error("AI analysis error:", error);
    return createErrorResult({
      error: "Failed to analyze content. Please try again.",
    });
  }
}
// "use server";

// /**
//  * AI-Powered Server Actions
//  *
//  * Handles AI features like Quick Capture content analysis.
//  * All actions run on the server with proper authentication.
//  */

// import { analyzeContent } from "@/lib/ai/content-analyzer";
// import {
//   AIServiceError,
//   AI_CONFIG,
//   truncateContent,
//   type ContentAnalysisResult,
// } from "@/lib/ai/types";
// import { requireAuth } from "@/lib/auth";
// import { prisma } from "@/lib/prisma";
// import { createSuccessResult, createErrorResult } from "@/lib/actionHelpers";
// import type { ActionResult } from "@/types/actionTypes";
// import type { FolderOption } from "@/types/folderTypes";

// /**
//  * Analyze content for Quick Capture
//  *
//  * Takes raw pasted content and returns AI-generated organization suggestions.
//  * Includes user's existing folders and tags as context for better suggestions.
//  * Automatically truncates very long content with user notification.
//  *
//  * @param content - Raw text content pasted by user
//  * @returns ActionResult with AI suggestions (includes truncation flag if applicable)
//  */
// export async function analyzeContentForOrganization(
//   content: string
// ): Promise<ActionResult<ContentAnalysisResult>> {
//   try {
//     console.log("🔍 [AI Action] Starting analysis..."); // ✅ Debug log

//     // 1. Authenticate user
//     console.log("🔍 [AI Action] Authenticating user..."); // ✅ Debug log
//     const userId = await requireAuth();
//     console.log("✅ [AI Action] User authenticated:", userId); // ✅ Debug log

//     // 2. Validate input
//     if (!content || content.trim().length === 0) {
//       console.log("❌ [AI Action] Empty content"); // ✅ Debug log
//       return createErrorResult({
//         error: "Content cannot be empty",
//       });
//     }

//     // 3. Handle content length with smart truncation
//     console.log("🔍 [AI Action] Truncating content..."); // ✅ Debug log
//     const {
//       content: processedContent,
//       wasTruncated,
//       originalLength,
//     } = truncateContent(content);
//     console.log("✅ [AI Action] Content processed:", {
//       originalLength,
//       wasTruncated,
//     }); // ✅ Debug log

//     // 4. Fetch user's folders for AI context
//     console.log("🔍 [AI Action] Fetching folders..."); // ✅ Debug log
//     const folders = await prisma.folder.findMany({
//       where: { userId },
//       select: {
//         id: true,
//         name: true,
//         parentId: true,
//         isDefault: true,
//         depth: true,
//       },
//       orderBy: [{ depth: "asc" }, { name: "asc" }],
//     });
//     console.log("✅ [AI Action] Folders fetched:", folders.length); // ✅ Debug log

//     const folderOptions: FolderOption[] = folders.map((f) => ({
//       id: f.id,
//       name: f.name,
//       parentId: f.parentId,
//       isDefault: f.isDefault,
//       depth: f.depth,
//     }));

//     // 5. Fetch user's tags for AI context
//     console.log("🔍 [AI Action] Fetching tags..."); // ✅ Debug log
//     const tags = await prisma.tag.findMany({
//       where: { userId },
//       select: { name: true },
//       orderBy: { name: "asc" },
//     });
//     console.log("✅ [AI Action] Tags fetched:", tags.length); // ✅ Debug log

//     const tagNames = tags.map((t) => t.name);

//     // 6. Call AI analyzer with processed content
//     console.log("🔍 [AI Action] Calling AI analyzer..."); // ✅ Debug log
//     const analysis = await analyzeContent(
//       processedContent,
//       folderOptions,
//       tagNames
//     );
//     console.log("✅ [AI Action] AI analysis complete:", analysis); // ✅ Debug log

//     // 7. Create result with truncation info if applicable
//     const result: ContentAnalysisResult = {
//       ...analysis,
//       ...(wasTruncated && {
//         wasTruncated: true,
//         reasoning: `${
//           analysis.reasoning
//         }\n\n⚠️ Note: Content was truncated from ${originalLength.toLocaleString()} to ${AI_CONFIG.MAX_CONTENT_LENGTH.toLocaleString()} characters.`,
//       }),
//     };

//     console.log("✅ [AI Action] Returning success result"); // ✅ Debug log
//     return createSuccessResult(result);
//   } catch (error) {
//     // ✅ Enhanced error logging
//     console.error("❌ [AI Action] Error occurred:", error);
//     console.error("❌ [AI Action] Error type:", error?.constructor?.name);
//     console.error(
//       "❌ [AI Action] Error message:",
//       error instanceof Error ? error.message : "Unknown"
//     );
//     console.error(
//       "❌ [AI Action] Error stack:",
//       error instanceof Error ? error.stack : "No stack"
//     );

//     if (error instanceof AIServiceError) {
//       return createErrorResult({ error: error.message });
//     }

//     return createErrorResult({
//       error: "Failed to analyze content. Please try again.",
//     });
//   }
// }

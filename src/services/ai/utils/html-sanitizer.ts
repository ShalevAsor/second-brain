/**
 * HTML Sanitization Utilities
 *
 * Functions for stripping and processing HTML content.
 * Used for preparing content for embeddings and AI processing.
 */

/**
 * Strip all HTML tags from content
 * Preserves text content and whitespace structure
 *
 * @param html - HTML string to strip
 * @returns Plain text without HTML tags
 */
export function stripHtml(html: string): string {
  if (!html) return "";

  // Remove script and style tags completely (including content)
  let text = html.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ""
  );
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

  // Replace common block-level elements with newlines
  text = text.replace(
    /<\/?(div|p|br|h[1-6]|li|tr|blockquote|pre)[^>]*>/gi,
    "\n"
  );

  // Replace list items with bullet points
  text = text.replace(/<li[^>]*>/gi, "\n• ");

  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, "");

  // Decode HTML entities
  text = decodeHtmlEntities(text);

  // Clean up whitespace
  text = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");

  return text.trim();
}

/**
 * Decode common HTML entities
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    "&lt;": "<",
    "&gt;": ">",
    "&amp;": "&",
    "&quot;": '"',
    "&#039;": "'",
    "&apos;": "'",
    "&nbsp;": " ",
  };

  return text.replace(/&[#\w]+;/g, (entity) => {
    return entities[entity] || entity;
  });
}

/**
 * Sanitize HTML for safe display (keeps structure, removes scripts)
 * Use this when you want to keep HTML but make it safe
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";

  // Remove dangerous tags
  let clean = html.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ""
  );
  clean = clean.replace(
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    ""
  );
  clean = clean.replace(/on\w+="[^"]*"/gi, ""); // Remove inline event handlers

  return clean;
}

/**
 * Escape HTML special characters
 * Use this when converting plain text to HTML
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };

  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Simple markdown parser for question text
 * Converts **bold** to <strong> and *italic* to <em>
 */
export function parseSimpleMarkdown(text: string): string {
  if (!text) return "";

  // Convert **bold** to <strong>bold</strong>
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  // Convert *italic* to <em>italic</em> (but not if already part of **)
  text = text.replace(/(?<![*])\*([^*]+)\*(?![*])/g, "<em>$1</em>");

  return text;
}

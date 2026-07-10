/** Stable slugs — shared by routes, runners, and Playwright matrix. */
export const TOOL_IDS = [
  "jpg-to-pdf",
  "compress",
  "grayscale",
  "linearize",
  "merge",
  "split",
  "rotate",
  "organize",
  "crop",
  "protect",
  "unlock",
  "watermark",
  "sign",
  "halve",
  "n-up",
  "page-numbers",
  "header-footer",
  "form-fill",
  "native-text-edit",
  "apply-edits",
  "redact",
  "repair",
  "pdf-to-jpeg",
  "pdf-to-text",
  "extract-images",
  "extract-text-runs",
  "pdf-to-word",
  "pdf-to-excel",
  "pdf-to-ppt",
  "pdf-to-epub",
  "analyze",
  "html-to-pdf",
  "markdown-to-html",
] as const;

export type ToolId = (typeof TOOL_IDS)[number];

export function isToolId(value: string): value is ToolId {
  return (TOOL_IDS as readonly string[]).includes(value);
}

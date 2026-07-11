import type { ToolId } from "./toolIds";

/** How the demo page collects input and shows output — one kind per real feature shape. */
export type DemoKind =
  | "pdf-transform"
  | "merge"
  | "jpg-to-pdf"
  | "pdf-to-jpeg"
  | "extract-images"
  | "pdf-to-text"
  | "json-export"
  | "blob-export"
  | "password-pdf"
  | "sign-pdf"
  | "html-to-pdf"
  | "markdown-to-html";

const PDF_TRANSFORM: ToolId[] = [
  "grayscale",
  "linearize",
  "split",
  "rotate",
  "organize",
  "crop",
  "watermark",
  "halve",
  "n-up",
  "page-numbers",
  "header-footer",
  "form-fill",
  "native-text-edit",
  "apply-edits",
  "redact",
  "repair",
];

const BLOB_EXPORT: ToolId[] = ["pdf-to-word", "pdf-to-excel", "pdf-to-ppt", "pdf-to-epub"];

const JSON_EXPORT: ToolId[] = ["analyze", "extract-text-runs"];

const KIND_BY_TOOL = new Map<ToolId, DemoKind>([
  ...PDF_TRANSFORM.map((id) => [id, "pdf-transform"] as const),
  ...BLOB_EXPORT.map((id) => [id, "blob-export"] as const),
  ...JSON_EXPORT.map((id) => [id, "json-export"] as const),
  ["merge", "merge"],
  ["jpg-to-pdf", "jpg-to-pdf"],
  ["pdf-to-jpeg", "pdf-to-jpeg"],
  ["extract-images", "extract-images"],
  ["pdf-to-text", "pdf-to-text"],
  ["protect", "password-pdf"],
  ["unlock", "password-pdf"],
  ["sign", "sign-pdf"],
  ["html-to-pdf", "html-to-pdf"],
  ["markdown-to-html", "markdown-to-html"],
]);

export function demoKindFor(toolId: ToolId): DemoKind {
  const kind = KIND_BY_TOOL.get(toolId);
  if (!kind) {
    throw new Error(`No demo kind for tool: ${toolId}`);
  }
  return kind;
}

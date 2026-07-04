import DOMPurify from "dompurify";

let purifyInstance: any = null;

function getPurify() {
  if (purifyInstance) return purifyInstance;

  console.error("DOMPurify imported:", DOMPurify, "typeof DOMPurify:", typeof DOMPurify);
  if (typeof DOMPurify === "function") {
    const win = typeof globalThis !== "undefined" ? (globalThis as any).window : null;
    console.error("win is:", win ? "defined" : "null", "win.document:", win?.document ? "defined" : "null");
    if (win) {
      purifyInstance = DOMPurify(win);
      return purifyInstance;
    }
  }
  purifyInstance = DOMPurify;
  return purifyInstance;
}

export const TEXT_EXPORT_FORMAT = {
  TXT: "txt",
  RTF: "rtf",
  HTML: "html",
} as const;

export type TextExportFormat = (typeof TEXT_EXPORT_FORMAT)[keyof typeof TEXT_EXPORT_FORMAT];

export interface ExtractedPageText {
  pageNumber: number;
  lines: string[];
}

const RTF_SPECIAL = /[\\{}]/g;

function escapeRtf(text: string): string {
  return text.replace(RTF_SPECIAL, (char) => {
    if (char === "\\") return "\\\\";
    if (char === "{") return "\\{";
    return "\\}";
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Join extracted pages into plain text with page separators. */
export function pagesToPlainText(pages: ExtractedPageText[]): string {
  return pages
    .map((page) => {
      const body = page.lines.join("\n").trim();
      return body ? `--- Page ${page.pageNumber} ---\n${body}` : "";
    })
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

/** Build minimal RTF readable by WordPad / TextEdit. */
export function pagesToRtf(pages: ExtractedPageText[]): string {
  const chunks = pages.flatMap((page) => {
    if (page.lines.length === 0) return [];
    return [
      `{\\b Page ${page.pageNumber}}\\par`,
      ...page.lines.map((line) => `${escapeRtf(line)}\\par`),
      "\\par",
    ];
  });

  return `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}\\f0\\fs24\n${chunks.join("\n")}\n}`;
}

export interface HtmlExportOptions {
  title?: string;
  includeImages?: boolean;
  pageImages?: string[];
}

/** Build semantic HTML from extracted lines; caller should run sanitizeHtml before use. */
export function pagesToHtml(pages: ExtractedPageText[], options: HtmlExportOptions = {}): string {
  const title = escapeHtml(options.title ?? "Extracted PDF");
  const sections = pages.map((page) => {
    const paragraphs = page.lines
      .map((line) => `    <p>${escapeHtml(line)}</p>`)
      .join("\n");
    const image =
      options.includeImages && options.pageImages?.[page.pageNumber - 1]
        ? `    <figure><img src="${options.pageImages[page.pageNumber - 1]}" alt="Page ${page.pageNumber}" /></figure>\n`
        : "";

    return `  <section id="page-${page.pageNumber}">\n    <h2>Page ${page.pageNumber}</h2>\n${image}${paragraphs}\n  </section>`;
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body { font-family: system-ui, sans-serif; line-height: 1.6; max-width: 48rem; margin: 2rem auto; padding: 0 1rem; }
    section { margin-bottom: 2rem; }
    img { max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>${title}</h1>
${sections.join("\n")}
</body>
</html>`;
}

/** Strip unsafe markup from generated HTML. */
export function sanitizeHtml(html: string): string {
  return getPurify().sanitize(html, { USE_PROFILES: { html: true } });
}

export function mimeTypeForFormat(format: TextExportFormat): string {
  if (format === TEXT_EXPORT_FORMAT.RTF) return "application/rtf";
  if (format === TEXT_EXPORT_FORMAT.HTML) return "text/html;charset=utf-8";
  return "text/plain;charset=utf-8";
}

export function extensionForFormat(format: TextExportFormat): string {
  if (format === TEXT_EXPORT_FORMAT.RTF) return ".rtf";
  if (format === TEXT_EXPORT_FORMAT.HTML) return ".html";
  return ".txt";
}

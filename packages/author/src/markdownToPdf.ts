import { marked } from "marked";
import { sanitizeHtml } from "./htmlToPdf";

/** GitHub-flavoured base stylesheet applied around compiled Markdown. */
export const MARKDOWN_STYLE = `
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 15px; line-height: 1.6; color: #1f2328; word-wrap: break-word;
`;

/** Compile Markdown to sanitized HTML ready for preview or htmlToPdf(). */
export async function markdownToHtml(source: string): Promise<string> {
    const raw = await marked.parse(source, { gfm: true, breaks: false });
    const body = sanitizeHtml(raw);
    return `<div style="${MARKDOWN_STYLE}" class="markdown-body">${body}</div>`;
}

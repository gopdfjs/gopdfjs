import { describe, it, expect } from "vitest";
import {
  pagesToHtml,
  pagesToPlainText,
  pagesToRtf,
  sanitizeHtml,
  TEXT_EXPORT_FORMAT,
} from "../pdfToText/formatters";

describe("pdfToText formatters", () => {
  const pages = [
    { pageNumber: 1, lines: ["Line one", "Line two"] },
    { pageNumber: 2, lines: ["Second page"] },
  ];

  it("builds plain text with page separators", () => {
    const text = pagesToPlainText(pages);
    expect(text).toContain("--- Page 1 ---");
    expect(text).toContain("Line one");
    expect(text).toContain("--- Page 2 ---");
  });

  it("builds valid RTF with escaped braces", () => {
    const rtf = pagesToRtf([{ pageNumber: 1, lines: ["Brace {test}"] }]);
    expect(rtf.startsWith("{\\rtf1")).toBe(true);
    expect(rtf).toContain("\\{test\\}");
  });

  it("builds HTML and sanitizes unsafe tags", () => {
    const html = pagesToHtml(pages, { title: "Sample" });
    const dirty = html.replace("</h1>", '</h1><script>alert(1)</script>');
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toContain("<script>");
    expect(clean).toContain("Line one");
  });
});

import fs from "node:fs";
import { describe, it, expect } from "vitest";
import { PDF_FIXTURES } from "@gopdfjs/fixtures";
import { pdfToText } from "../pdfToText/index";
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
    // Generate plaintext string from ExtractedPageText array
    const text = pagesToPlainText(pages);
    expect(text).toContain("--- Page 1 ---");
    expect(text).toContain("Line one");
    expect(text).toContain("--- Page 2 ---");
  });

  it("builds valid RTF with escaped braces", () => {
    // Generate RTF markup
    const rtf = pagesToRtf([{ pageNumber: 1, lines: ["Brace {test}"] }]);
    expect(rtf.startsWith("{\\rtf1")).toBe(true);
    expect(rtf).toContain("\\{test\\}");
  });

  it("builds HTML and sanitizes unsafe tags", () => {
    // Generate HTML content and verify purification
    const html = pagesToHtml(pages, { title: "Sample" });
    const dirty = html.replace("</h1>", '</h1><script>alert(1)</script>');
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toContain("<script>");
    expect(clean).toContain("Line one");
  });
});

describe("pdfToText integration", () => {
  it("extracts text from a real PDF fixture in plain text format", async () => {
    // Read the binary content of a verified basic PDF fixture
    const pdfBytes = new Uint8Array(fs.readFileSync(PDF_FIXTURES.BMAUPIN_BASIC));
    // Execute pdfToText and capture the plain text output
    const text = await pdfToText(pdfBytes, { format: TEXT_EXPORT_FORMAT.TXT });
    expect(text).toContain("--- Page 1 ---");
    expect(text).toContain("Hello World");
  });

  it("extracts text from a real PDF fixture in HTML format with page images", async () => {
    // Read the binary content of a verified basic PDF fixture
    const pdfBytes = new Uint8Array(fs.readFileSync(PDF_FIXTURES.BMAUPIN_BASIC));
    // Execute pdfToText with HTML format and embed page visual images
    const html = await pdfToText(pdfBytes, {
      format: TEXT_EXPORT_FORMAT.HTML,
      includeImagesInHtml: true,
    });
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Page 1");
    // Should embed rendered base64 snapshot image
    expect(html).toContain("data:image/jpeg;base64,");
  });
});

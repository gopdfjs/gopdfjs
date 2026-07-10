import { describe, it, expect } from "vitest";
import {
  buildChapterXhtml,
  buildContentOpf,
  buildNavXhtml,
  cssForDevicePreset,
  EPUB_DEVICE_PRESET,
} from "../pdfToEpub/buildEpub";
import { packEpubFromChapters } from "../pdfToEpub";

describe("buildEpub helpers", () => {
  it("escapes XML in chapter XHTML", () => {
    const xhtml = buildChapterXhtml("Title", ['Say "hello" & <go>']);
    expect(xhtml).toContain("&quot;hello&quot;");
    expect(xhtml).toContain("&amp;");
    expect(xhtml).toContain("&lt;go&gt;");
  });

  it("builds nav and OPF with chapter ids", () => {
    const nav = buildNavXhtml([{ title: "Intro", chapterId: "chapter-1" }]);
    expect(nav).toContain('href="chapter-1.xhtml"');

    const opf = buildContentOpf(
      { title: "Book", author: "Author" },
      ["chapter-1"],
      false,
    );
    expect(opf).toContain("<dc:title>Book</dc:title>");
    expect(opf).toContain('idref="chapter-1"');
  });

  it("returns device-specific CSS", () => {
    expect(cssForDevicePreset(EPUB_DEVICE_PRESET.KINDLE)).toContain("Georgia");
  });
});

describe("packEpubFromChapters", () => {
  it("produces an EPUB zip blob", async () => {
    const blob = await packEpubFromChapters(
      { title: "Demo", author: "Tester" },
      [{ id: "chapter-1", title: "Page 1", paragraphs: ["Hello EPUB"] }],
    );
    expect(blob.type).toBe("application/epub+zip");
    expect(blob.size).toBeGreaterThan(100);
  });
});

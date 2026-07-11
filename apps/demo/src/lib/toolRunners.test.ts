import { describe, expect, it, vi } from "vitest";
import type { Gopdf } from "@gopdfjs/engine";
import { runToolDemo, toolInputKind } from "./toolRunners";

function mockEngine(): Gopdf {
  const bytes = new Uint8Array([37, 80, 68, 70]);
  const stub = async () => bytes;
  return {
    compressPdf: stub,
    linearizePdf: stub,
    pdfToJpeg: async () => [{ bytes, page: 1 }],
    pdfToText: async () => "text",
    ocr: async () => "ocr",
    grayscalePdf: async () => ({
      bytes,
      inputPages: 1,
      outputPages: 1,
      inputBytes: 4,
      outputBytes: 4,
    }),
    redactPdf: stub,
    mergePdfs: stub,
    splitPdf: async () => [bytes],
    rotatePdf: stub,
    protectPdf: stub,
    unlockPdf: stub,
    organizePdf: stub,
    cropPdf: stub,
    jpgToPdf: stub,
    watermarkPdf: stub,
    signPdf: stub,
    halvePdf: stub,
    nUpPdf: stub,
    addHeaderFooter: stub,
    addPageNumbers: stub,
    repairPdf: async () =>
      ({
        bytes,
        report: {
          strategy: "none",
          inputPages: 1,
          outputPages: 1,
          warnings: [],
          validated: true,
        },
      }) as never,
    repairPdfBatch: async () => ({ items: [], successCount: 0, failureCount: 0 }),
    extractImages: async () => [],
    extractPdfTextRuns: async () => [],
    pdfToWord: async () => new Blob(),
    analyzePdf: async () =>
      ({
        pages: 1,
        fileName: "x.pdf",
        fileSizeStr: "1kb",
        title: "",
        author: "",
        creator: "",
        producer: "",
        creationDate: "",
        modDate: "",
        isEncrypted: false,
        version: "1.4",
        isLinearized: false,
        fontCount: 0,
        imageCount: 0,
        formCount: 0,
        imageRawSizeMb: "0",
        pageDetails: [],
        fonts: [],
        permissions: {
          printing: "allowed",
          modifying: "allowed",
          copying: "allowed",
          annotating: "allowed",
        },
      }) as never,
    applyEdits: stub,
    applyNativeTextEdits: stub,
    fillPdfForm: stub,
    pdfToExcel: async () => ({ blob: new Blob(), analysis: {} }),
    pdfToPpt: async () => new Blob(),
    pdfToEpub: async () => new Blob(),
    htmlToPdf: async () => ({ bytes, pageCount: 1, truncated: false }),
    markdownToHtml: async () => "<p>ok</p>",
    comparePdfText: async () => ({ equal: true, diff: "" }),
    createCompareSession: async () => ({}) as never,
    visualDiffCanvases: async () => ({}) as never,
  };
}

describe("toolRunners", () => {
  it("maps pdf tools to engine methods", async () => {
    const engine = mockEngine();
    const input = new Uint8Array([1, 2, 3]);
    const linearize = vi.spyOn(engine, "linearizePdf");
    await runToolDemo(engine, "linearize", { pdfBytes: input });
    expect(linearize).toHaveBeenCalledWith(input);
  });

  it("runs author html tool", async () => {
    const engine = mockEngine();
    const htmlToPdf = vi.spyOn(engine, "htmlToPdf");
    await runToolDemo(engine, "html-to-pdf", { textSource: "<p>x</p>" });
    expect(htmlToPdf).toHaveBeenCalled();
  });

  it("uses uploaded images for jpg-to-pdf", async () => {
    const engine = mockEngine();
    const jpgToPdf = vi.spyOn(engine, "jpgToPdf");
    const imageBytes = new Uint8Array([255, 216, 255]);
    await runToolDemo(engine, "jpg-to-pdf", {
      images: [{ bytes: imageBytes, mimeType: "image/jpeg", name: "a.jpg" }],
    });
    expect(jpgToPdf).toHaveBeenCalledWith([{ bytes: imageBytes, mimeType: "image/jpeg" }]);
  });

  it("classifies input kinds", () => {
    expect(toolInputKind("merge")).toBe("pdf");
    expect(toolInputKind("html-to-pdf")).toBe("html");
    expect(toolInputKind("markdown-to-html")).toBe("markdown");
  });
});

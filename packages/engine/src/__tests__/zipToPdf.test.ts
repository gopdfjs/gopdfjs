import { PDFDocument, StandardFonts } from "pdf-lib";
import JSZip from "jszip";
import { describe, expect, it, vi } from "vitest";
import type { GopdfAdapter } from "@gopdfjs/adapter/gopdf";
import { ZIP_ENTRY_STATUS, ZIP_TO_PDF_MODE } from "@gopdfjs/adapter/gopdf";
import { createEngine } from "../createEngine";
import {
  ZipToPdfError,
  convertZipToPdf,
  normalizeZipEntryPath,
  type ZipToPdfPorts,
} from "../zipToPdf";

const ONE_PX_PNG = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  ),
);

async function tinyPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([200, 80]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  page.drawText("zip", { x: 12, y: 40, size: 12, font });
  return doc.save();
}

async function zipOf(files: Record<string, Uint8Array>): Promise<Uint8Array> {
  const zip = new JSZip();
  for (const [name, bytes] of Object.entries(files)) {
    zip.file(name, bytes);
  }
  return zip.generateAsync({ type: "uint8array" });
}

function stubPorts(overrides: Partial<ZipToPdfPorts> = {}): ZipToPdfPorts {
  return {
    imageToPdf: async () => tinyPdf(),
    documentToPdf: async () => tinyPdf(),
    markdownToHtml: async (source) => `<p>${source}</p>`,
    mergePdfs: async (inputs) => {
      const doc = await PDFDocument.create();
      for (const input of inputs) {
        const src = await PDFDocument.load(input);
        const pages = await doc.copyPages(src, src.getPageIndices());
        for (const page of pages) doc.addPage(page);
      }
      return doc.save();
    },
    assertPdf: async (bytes) => {
      await PDFDocument.load(bytes);
    },
    ...overrides,
  };
}

function mockAdapter(): GopdfAdapter {
  return {
    engine: {
      compressPdf: async () => new Uint8Array(),
      encodeImages: async () => new Uint8Array(),
      grayscalePdf: async () => new Uint8Array(),
      linearizePdf: async () => new Uint8Array(),
    },
    pdfjs: {
      loadDocument: async () => ({ numPages: 0, getPage: async () => ({}) as never }),
      getOps: async () => ({}),
    },
    canvas: {
      create: async () => ({
        width: 1,
        height: 1,
        getContext2d: () => ({}) as CanvasRenderingContext2D,
        toImageBytes: async () => new Uint8Array(),
        dispose: async () => undefined,
      }),
    },
  };
}

describe("normalizeZipEntryPath", () => {
  it("keeps nested relative paths and drops dot segments", () => {
    expect(normalizeZipEntryPath("notes\\sub\\a.txt")).toBe("notes/sub/a.txt");
    expect(normalizeZipEntryPath("notes/./a.txt")).toBe("notes/a.txt");
  });

  it("rejects traversal and absolute paths", () => {
    expect(normalizeZipEntryPath("../secret.txt")).toBeNull();
    expect(normalizeZipEntryPath("/tmp/a.txt")).toBeNull();
    expect(normalizeZipEntryPath("C:/a.txt")).toBeNull();
  });
});

describe("convertZipToPdf", () => {
  it("converts nested files in code-point order and preserves PDF names", async () => {
    const seen: string[] = [];
    const ports = stubPorts({
      imageToPdf: async () => {
        seen.push("image");
        return tinyPdf();
      },
      assertPdf: async () => {
        seen.push("pdf");
      },
      documentToPdf: async (html) => {
        seen.push(html);
        return tinyPdf();
      },
    });
    const pdf = await tinyPdf();
    const archive = await zipOf({
      "z/b.txt": new TextEncoder().encode("zeta"),
      "a/c.png": ONE_PX_PNG,
      "a/a.pdf": pdf,
    });

    const result = await convertZipToPdf(archive, { mode: ZIP_TO_PDF_MODE.individual }, ports);
    expect(result.entries.map((entry) => entry.path)).toEqual(["a/a.pdf", "a/c.png", "z/b.txt"]);
    expect(result.entries.map((entry) => entry.outputPath)).toEqual([
      "a/a.pdf",
      "a/c.pdf",
      "z/b.pdf",
    ]);
    expect(seen).toEqual(["pdf", "image", "<pre>zeta</pre>"]);

    const packed = await JSZip.loadAsync(result.bytes);
    expect(Object.keys(packed.files).sort()).toEqual(["a/a.pdf", "a/c.pdf", "z/b.pdf"]);
  });

  it("merges successful PDFs and keeps going after unsupported or corrupt entries", async () => {
    const pdf = await tinyPdf();
    const archive = await zipOf({
      "good.pdf": pdf,
      "slide.docx": new TextEncoder().encode("office"),
      "broken.pdf": new Uint8Array([1, 2, 3, 4]),
      "photo.png": ONE_PX_PNG,
      "empty.txt": new Uint8Array(),
    });
    const calls: string[] = [];
    const ports = stubPorts({
      imageToPdf: async () => {
        calls.push("png");
        return tinyPdf();
      },
    });

    const result = await convertZipToPdf(archive, { mode: ZIP_TO_PDF_MODE.combined }, ports);
    const byPath = Object.fromEntries(result.entries.map((entry) => [entry.path, entry.status]));
    expect(byPath).toEqual({
      "broken.pdf": ZIP_ENTRY_STATUS.failed,
      "empty.txt": ZIP_ENTRY_STATUS.failed,
      "good.pdf": ZIP_ENTRY_STATUS.converted,
      "photo.png": ZIP_ENTRY_STATUS.converted,
      "slide.docx": ZIP_ENTRY_STATUS.unsupported,
    });
    expect(calls).toEqual(["png"]);

    const merged = await PDFDocument.load(result.bytes);
    expect(merged.getPageCount()).toBe(2);
    expect(result.entries.find((entry) => entry.path === "slide.docx")?.outputPath).toBeUndefined();
  });

  it("converts one entry at a time", async () => {
    let active = 0;
    let maxActive = 0;
    const ports = stubPorts({
      documentToPdf: async () => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => setTimeout(resolve, 5));
        active -= 1;
        return tinyPdf();
      },
    });
    const archive = await zipOf({
      "b.txt": new TextEncoder().encode("b"),
      "a.txt": new TextEncoder().encode("a"),
    });
    await convertZipToPdf(archive, { mode: ZIP_TO_PDF_MODE.individual }, ports);
    expect(maxActive).toBe(1);
  });

  it("reports an unsafe path without stopping the next file", async () => {
    const archive = await zipOf({
      "../secret.txt": new TextEncoder().encode("nope"),
      "ok.txt": new TextEncoder().encode("yes"),
    });
    const result = await convertZipToPdf(
      archive,
      { mode: ZIP_TO_PDF_MODE.individual },
      stubPorts(),
    );
    const secret = result.entries.find((entry) => entry.path.includes("secret"));
    const ok = result.entries.find((entry) => entry.path === "ok.txt");
    expect(secret?.status).toBe(ZIP_ENTRY_STATUS.failed);
    expect(ok?.status).toBe(ZIP_ENTRY_STATUS.converted);
    expect(ok?.outputPath).toBe("ok.pdf");
  });

  it("disambiguates output names that would collide", async () => {
    const archive = await zipOf({
      "a.txt": new TextEncoder().encode("t"),
      "a.md": new TextEncoder().encode("# t"),
    });
    const result = await convertZipToPdf(
      archive,
      { mode: ZIP_TO_PDF_MODE.individual },
      stubPorts(),
    );
    expect(result.entries.map((entry) => entry.outputPath).sort()).toEqual(["a-2.pdf", "a.pdf"]);
  });

  it("returns an empty individual ZIP and an empty combined PDF when nothing converts", async () => {
    const archive = await zipOf({});
    const individual = await convertZipToPdf(
      archive,
      { mode: ZIP_TO_PDF_MODE.individual },
      stubPorts(),
    );
    const combined = await convertZipToPdf(archive, { mode: ZIP_TO_PDF_MODE.combined }, stubPorts());
    const emptyZip = await JSZip.loadAsync(individual.bytes);
    expect(Object.keys(emptyZip.files)).toEqual([]);
    const emptyPdf = await PDFDocument.load(combined.bytes);
    expect(emptyPdf.getPageCount()).toBe(0);
    expect(individual.entries).toEqual([]);
  });

  it("rejects a corrupt archive", async () => {
    await expect(
      convertZipToPdf(new Uint8Array([1, 2, 3]), { mode: ZIP_TO_PDF_MODE.combined }, stubPorts()),
    ).rejects.toBeInstanceOf(ZipToPdfError);
  });

  it("uses real image and PDF converters through the engine facade", async () => {
    const pdf = await tinyPdf();
    const archive = await zipOf({
      "nested/scan.png": ONE_PX_PNG,
      "nested/already.pdf": pdf,
      "notes/page.txt": new TextEncoder().encode("hello"),
    });
    const engine = createEngine(mockAdapter());
    const progress = vi.fn();
    const individual = await engine.zipToPdf(archive, {
      mode: ZIP_TO_PDF_MODE.individual,
      onEntry: progress,
    });

    const png = individual.entries.find((entry) => entry.path === "nested/scan.png");
    const existing = individual.entries.find((entry) => entry.path === "nested/already.pdf");
    const text = individual.entries.find((entry) => entry.path === "notes/page.txt");
    expect(png?.status).toBe(ZIP_ENTRY_STATUS.converted);
    expect(png?.outputPath).toBe("nested/scan.pdf");
    expect(existing?.status).toBe(ZIP_ENTRY_STATUS.converted);
    expect(text?.status).toBe(ZIP_ENTRY_STATUS.failed);

    const packed = await JSZip.loadAsync(individual.bytes);
    const scan = await packed.file("nested/scan.pdf")?.async("uint8array");
    const already = await packed.file("nested/already.pdf")?.async("uint8array");
    expect(scan && (await PDFDocument.load(scan)).getPageCount()).toBe(1);
    expect(already && (await PDFDocument.load(already)).getPageCount()).toBe(1);
    expect(packed.file("notes/page.pdf")).toBeNull();
    expect(progress).toHaveBeenCalledTimes(3);

    const combined = await engine.zipToPdf(archive, { mode: ZIP_TO_PDF_MODE.combined });
    const merged = await PDFDocument.load(combined.bytes);
    expect(merged.getPageCount()).toBe(2);
  });
});

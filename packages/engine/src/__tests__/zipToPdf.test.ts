import { PDFDocument, StandardFonts } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import JSZip from "jszip";
import { describe, expect, it, vi } from "vitest";
import type { GopdfAdapter } from "@gopdfjs/adapter/gopdf";
import {
  ZIP_ENTRY_STATUS,
  ZIP_TO_PDF_DEFAULT_LIMITS,
  ZIP_TO_PDF_MODE,
  ZipToPdfError,
  createEngine,
} from "../index";
import {
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

// Minimal 1x1 JPEG for exercising real JPEG entry conversion.
const ONE_PX_JPEG = Uint8Array.from(
  Buffer.from(
    "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=",
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

async function zipOf(
  files: Record<string, Uint8Array>,
  compression: "STORE" | "DEFLATE" = "STORE",
): Promise<Uint8Array> {
  const zip = new JSZip();
  for (const [name, bytes] of Object.entries(files)) {
    zip.file(name, bytes, { compression });
  }
  return zip.generateAsync({ type: "uint8array", compression });
}

/** Patch central-directory declared uncompressed size(s) (PK\x01\x02 + 24). */
function spoofZipDeclaredUncompressedSizes(
  bytes: Uint8Array,
  spoofedSize: number,
  entryIndices?: number[],
): Uint8Array {
  const patched = bytes.slice();
  const view = new DataView(patched.buffer, patched.byteOffset, patched.byteLength);
  let headerIndex = 0;
  for (let offset = 0; offset <= patched.length - 46; offset += 1) {
    if (
      patched[offset] === 0x50 &&
      patched[offset + 1] === 0x4b &&
      patched[offset + 2] === 0x01 &&
      patched[offset + 3] === 0x02
    ) {
      if (!entryIndices || entryIndices.includes(headerIndex)) {
        view.setUint32(offset + 24, spoofedSize, true);
      }
      headerIndex += 1;
    }
  }
  return patched;
}

/** Corrupt compressed data inside the first local file entry (PK\x03\x04) so pako fails on inflate. */
function corruptFirstZipEntryData(bytes: Uint8Array): Uint8Array {
  const patched = bytes.slice();
  const view = new DataView(patched.buffer, patched.byteOffset, patched.byteLength);
  for (let offset = 0; offset <= patched.length - 30; offset += 1) {
    if (
      patched[offset] === 0x50 &&
      patched[offset + 1] === 0x4b &&
      patched[offset + 2] === 0x03 &&
      patched[offset + 3] === 0x04
    ) {
      const nameLen = view.getUint16(offset + 26, true);
      const extraLen = view.getUint16(offset + 28, true);
      const dataStart = offset + 30 + nameLen + extraLen;
      patched[dataStart] ^= 0xff;
      patched[dataStart + 1] ^= 0xff;
      break;
    }
  }
  return patched;
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
      const src = await PDFDocument.load(bytes);
      const tmp = await PDFDocument.create();
      await tmp.copyPages(src, src.getPageIndices());
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

  it("rejects traversal, empty paths, and absolute paths", () => {
    expect(normalizeZipEntryPath("../secret.txt")).toBeNull();
    expect(normalizeZipEntryPath("/tmp/a.txt")).toBeNull();
    expect(normalizeZipEntryPath("C:/a.txt")).toBeNull();
    expect(normalizeZipEntryPath("./")).toBeNull();
  });
});

describe("convertZipToPdf", () => {
  it("exports ZipToPdfError and ZIP_TO_PDF_DEFAULT_LIMITS from @gopdfjs/engine", () => {
    expect(ZIP_TO_PDF_DEFAULT_LIMITS).toEqual({
      maxEntries: 500,
      maxEntryBytes: 50 * 1024 * 1024,
      maxTotalUncompressedBytes: 200 * 1024 * 1024,
    });
    expect(new ZipToPdfError("boom").name).toBe("ZipToPdfError");
  });

  it("converts nested files in Unicode code-point order and preserves PDF names", async () => {
    const seen: string[] = [];
    const ports = stubPorts({
      imageToPdf: async (_bytes, mimeType) => {
        seen.push(mimeType);
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
      "m/doc.md": new TextEncoder().encode("# hi"),
      "h/page.html": new TextEncoder().encode("<p>html</p>"),
      "a/photo.jpg": ONE_PX_JPEG,
      "a/c.png": ONE_PX_PNG,
      "a/a.pdf": pdf,
    });

    const result = await convertZipToPdf(archive, { mode: ZIP_TO_PDF_MODE.individual }, ports);
    expect(result.entries.map((entry) => entry.path)).toEqual([
      "a/a.pdf",
      "a/c.png",
      "a/photo.jpg",
      "h/page.html",
      "m/doc.md",
      "z/b.txt",
    ]);
    expect(result.entries.map((entry) => entry.outputPath)).toEqual([
      "a/a.pdf",
      "a/c.pdf",
      "a/photo.pdf",
      "h/page.pdf",
      "m/doc.pdf",
      "z/b.pdf",
    ]);
    expect(seen).toEqual([
      "pdf",
      "image/png",
      "image/jpeg",
      "<p>html</p>",
      "<p># hi</p>",
      "<pre>zeta</pre>",
    ]);

    const packed = await JSZip.loadAsync(result.bytes);
    expect(Object.keys(packed.files).sort()).toEqual([
      "a/a.pdf",
      "a/c.pdf",
      "a/photo.pdf",
      "h/page.pdf",
      "m/doc.pdf",
      "z/b.pdf",
    ]);
  });

  it("orders BMP and astral Unicode entry paths by true code point", async () => {
    const archive = await zipOf({
      "😀b.txt": new TextEncoder().encode("emoji-b"),
      "😀a.txt": new TextEncoder().encode("emoji-a"),
      "a.txt": new TextEncoder().encode("lower"),
      "～.txt": new TextEncoder().encode("fullwidth"),
      "A.txt": new TextEncoder().encode("upper"),
      "notes\\dup.txt": new TextEncoder().encode("backslash"),
      "notes/dup.txt": new TextEncoder().encode("slash"),
    });

    const result = await convertZipToPdf(archive, { mode: ZIP_TO_PDF_MODE.individual }, stubPorts());
    expect(result.entries.map((entry) => entry.path)).toEqual([
      "A.txt",
      "a.txt",
      "notes/dup.txt",
      "notes/dup.txt",
      "～.txt",
      "😀a.txt",
      "😀b.txt",
    ]);
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

  it("disambiguates output names deterministically including case-insensitive collisions", async () => {
    const archive = await zipOf({
      "a.txt": new TextEncoder().encode("t"),
      "a.md": new TextEncoder().encode("# t"),
      "A.txt": new TextEncoder().encode("upper"),
      "a-2.txt": new TextEncoder().encode("dash2"),
      "Docs/Report.png": ONE_PX_PNG,
      "docs/report.pdf": await tinyPdf(),
    });
    const result = await convertZipToPdf(
      archive,
      { mode: ZIP_TO_PDF_MODE.individual },
      stubPorts(),
    );

    // Verify exact code-point order and case-insensitive uniqueness inside packed ZIP.
    expect(result.entries.map((entry) => [entry.path, entry.outputPath])).toEqual([
      ["A.txt", "A.pdf"],
      ["Docs/Report.png", "Docs/Report.pdf"],
      ["a-2.txt", "a-2.pdf"],
      ["a.md", "a-3.pdf"],
      ["a.txt", "a-4.pdf"],
      ["docs/report.pdf", "docs/report-2.pdf"],
    ]);

    const packed = await JSZip.loadAsync(result.bytes);
    expect(Object.keys(packed.files).sort()).toEqual([
      "A.pdf",
      "Docs/Report.pdf",
      "a-2.pdf",
      "a-3.pdf",
      "a-4.pdf",
      "docs/report-2.pdf",
    ]);
  });

  it("returns fresh valid single-page combined PDFs and an empty individual ZIP when nothing converts", async () => {
    const zip = new JSZip();
    zip.folder("empty-dir");
    const archive = await zip.generateAsync({ type: "uint8array" });

    const individual = await convertZipToPdf(
      archive,
      { mode: ZIP_TO_PDF_MODE.individual },
      stubPorts(),
    );
    const firstCombined = await convertZipToPdf(
      archive,
      { mode: ZIP_TO_PDF_MODE.combined },
      stubPorts(),
    );
    const firstSnapshot = firstCombined.bytes.slice();
    firstCombined.bytes[0] ^= 0xff;

    const secondCombined = await convertZipToPdf(
      archive,
      { mode: ZIP_TO_PDF_MODE.combined },
      stubPorts(),
    );

    const emptyZip = await JSZip.loadAsync(individual.bytes);
    expect(Object.keys(emptyZip.files)).toEqual([]);
    expect(individual.entries).toEqual([]);

    expect(secondCombined.bytes[0]).toBe(firstSnapshot[0]);
    expect(secondCombined.bytes).not.toBe(firstCombined.bytes);

    const pdfLibDoc = await PDFDocument.load(secondCombined.bytes);
    expect(pdfLibDoc.getPageCount()).toBe(1);

    const pdfJsDoc = await pdfjsLib.getDocument({
      data: secondCombined.bytes.slice(),
      useSystemFonts: true,
    }).promise;
    expect(pdfJsDoc.numPages).toBe(1);
    await pdfJsDoc.destroy();
  });

  it("rejects invalid mode, corrupt archives, and invalid resource limits with ZipToPdfError", async () => {
    await expect(
      convertZipToPdf(
        new Uint8Array(),
        { mode: "unknown" as (typeof ZIP_TO_PDF_MODE)["combined"] },
        stubPorts(),
      ),
    ).rejects.toBeInstanceOf(ZipToPdfError);

    await expect(
      convertZipToPdf(new Uint8Array([1, 2, 3]), { mode: ZIP_TO_PDF_MODE.combined }, stubPorts()),
    ).rejects.toBeInstanceOf(ZipToPdfError);

    const archive = await zipOf({ "a.txt": new TextEncoder().encode("ok") });
    for (const limits of [
      { maxEntries: 0 },
      { maxEntryBytes: -1 },
      { maxTotalUncompressedBytes: Number.NaN },
      { maxEntries: 1.5 },
    ]) {
      await expect(
        convertZipToPdf(archive, { mode: ZIP_TO_PDF_MODE.combined, limits }, stubPorts()),
      ).rejects.toBeInstanceOf(ZipToPdfError);
    }
  });

  it("rejects archives exceeding maxEntries, maxEntryBytes, or maxTotalUncompressedBytes before inflating or converting", async () => {
    const convertSpy = vi.fn(async () => tinyPdf());
    const ports = stubPorts({ documentToPdf: convertSpy });

    const threeFiles = await zipOf({
      "a.txt": new TextEncoder().encode("1"),
      "b.txt": new TextEncoder().encode("2"),
      "c.txt": new TextEncoder().encode("3"),
    });
    await expect(
      convertZipToPdf(
        threeFiles,
        { mode: ZIP_TO_PDF_MODE.combined, limits: { maxEntries: 2 } },
        ports,
      ),
    ).rejects.toThrow(ZipToPdfError);

    const largeEntry = await zipOf({ "big.txt": new Uint8Array(1024).fill(65) }, "DEFLATE");
    await expect(
      convertZipToPdf(
        largeEntry,
        { mode: ZIP_TO_PDF_MODE.combined, limits: { maxEntryBytes: 512 } },
        ports,
      ),
    ).rejects.toThrow(ZipToPdfError);

    const aggregateArchive = await zipOf({
      "1.txt": new Uint8Array(600).fill(65),
      "2.txt": new Uint8Array(600).fill(66),
    });
    await expect(
      convertZipToPdf(
        aggregateArchive,
        {
          mode: ZIP_TO_PDF_MODE.combined,
          limits: { maxEntryBytes: 1000, maxTotalUncompressedBytes: 1000 },
        },
        ports,
      ),
    ).rejects.toThrow(ZipToPdfError);

    expect(convertSpy).not.toHaveBeenCalled();
  });

  it("enforces streaming entry and aggregate limits even when central-directory sizes are spoofed", async () => {
    const convertSpy = vi.fn(async () => tinyPdf());
    const ports = stubPorts({ documentToPdf: convertSpy });

    const singleBomb = spoofZipDeclaredUncompressedSizes(
      await zipOf({ "bomb.txt": new Uint8Array(2048).fill(65) }, "DEFLATE"),
      1,
    );
    await expect(
      convertZipToPdf(
        singleBomb,
        { mode: ZIP_TO_PDF_MODE.combined, limits: { maxEntryBytes: 1024 } },
        ports,
      ),
    ).rejects.toThrow(/maxEntryBytes/);

    const aggregateBomb = spoofZipDeclaredUncompressedSizes(
      await zipOf(
        {
          "a.txt": new Uint8Array(600).fill(65),
          "b.txt": new Uint8Array(600).fill(66),
        },
        "DEFLATE",
      ),
      1,
      [1],
    );
    await expect(
      convertZipToPdf(
        aggregateBomb,
        {
          mode: ZIP_TO_PDF_MODE.combined,
          limits: { maxEntryBytes: 1024, maxTotalUncompressedBytes: 1000 },
        },
        ports,
      ),
    ).rejects.toThrow(/maxTotalUncompressedBytes/);

    expect(convertSpy).toHaveBeenCalledTimes(1);
  });

  it("isolates corrupt compressed stream errors to that entry without halting unrelated entries", async () => {
    const badFirst = corruptFirstZipEntryData(
      await zipOf(
        {
          "a-corrupt.txt": new TextEncoder().encode("this stream will be corrupted before inflate"),
          "b-valid.txt": new TextEncoder().encode("still converts"),
        },
        "DEFLATE",
      ),
    );

    const result = await convertZipToPdf(badFirst, { mode: ZIP_TO_PDF_MODE.individual }, stubPorts());
    expect(result.entries[0]?.path).toBe("a-corrupt.txt");
    expect(result.entries[0]?.status).toBe(ZIP_ENTRY_STATUS.failed);
    expect(result.entries[1]).toEqual({
      path: "b-valid.txt",
      status: ZIP_ENTRY_STATUS.converted,
      outputPath: "b-valid.pdf",
    });
  });

  it("isolates throwing onEntry callbacks and reports callbackError without losing entries", async () => {
    const archive = await zipOf({
      "a.txt": new TextEncoder().encode("1"),
      "b.txt": new TextEncoder().encode("2"),
      "c.txt": new TextEncoder().encode("3"),
    });
    const seenIndices: number[] = [];

    const result = await convertZipToPdf(
      archive,
      {
        mode: ZIP_TO_PDF_MODE.individual,
        onEntry: (entry, index) => {
          seenIndices.push(index);
          entry.status = ZIP_ENTRY_STATUS.failed;
          if (index === 0) throw new Error("ui crash");
          if (index === 1) throw "string warning";
        },
      },
      stubPorts(),
    );

    expect(seenIndices).toEqual([0, 1, 2]);
    expect(result.entries).toEqual([
      {
        path: "a.txt",
        status: ZIP_ENTRY_STATUS.converted,
        outputPath: "a.pdf",
        callbackError: "ui crash",
      },
      {
        path: "b.txt",
        status: ZIP_ENTRY_STATUS.converted,
        outputPath: "b.pdf",
        callbackError: "string warning",
      },
      {
        path: "c.txt",
        status: ZIP_ENTRY_STATUS.converted,
        outputPath: "c.pdf",
      },
    ]);

    const packed = await JSZip.loadAsync(result.bytes);
    expect(Object.keys(packed.files).sort()).toEqual(["a.pdf", "b.pdf", "c.pdf"]);
  });

  it("isolates combined-mode merge failures per entry and preserves unaffected entries", async () => {
    const pdf1 = await tinyPdf();
    const pdf3 = await tinyPdf();

    // Use distinct text byte lengths so badPdfBytes is uniquely identifiable in stub merge.
    const doc2 = await PDFDocument.create();
    const p2 = doc2.addPage([300, 120]);
    p2.drawText("unmergeable-entry", { x: 10, y: 20, size: 12 });
    const badPdfBytes = await doc2.save();

    const threeArchive = await zipOf({
      "01.pdf": pdf1,
      "02.pdf": badPdfBytes,
      "03.pdf": pdf3,
    });
    const partialResult = await convertZipToPdf(
      threeArchive,
      { mode: ZIP_TO_PDF_MODE.combined },
      stubPorts({
        mergePdfs: async (inputs) => {
          if (inputs.some((input) => input.byteLength === badPdfBytes.byteLength)) {
            throw new Error("bad page tree during merge");
          }
          return stubPorts().mergePdfs(inputs);
        },
      }),
    );
    expect(partialResult.entries).toEqual([
      { path: "01.pdf", status: ZIP_ENTRY_STATUS.converted, outputPath: "01.pdf" },
      { path: "02.pdf", status: ZIP_ENTRY_STATUS.failed, message: "bad page tree during merge" },
      { path: "03.pdf", status: ZIP_ENTRY_STATUS.converted, outputPath: "03.pdf" },
    ]);
    expect((await PDFDocument.load(partialResult.bytes)).getPageCount()).toBe(2);

    // Single converted entry failing merge returns a valid 1-page empty PDF.
    const singleArchive = await zipOf({ "only.pdf": pdf1 });
    const singleFail = await convertZipToPdf(
      singleArchive,
      { mode: ZIP_TO_PDF_MODE.combined },
      stubPorts({
        mergePdfs: async () => {
          throw new Error("single merge boom");
        },
      }),
    );
    expect(singleFail.entries).toEqual([
      { path: "only.pdf", status: ZIP_ENTRY_STATUS.failed, message: "single merge boom" },
    ]);
    expect((await PDFDocument.load(singleFail.bytes)).getPageCount()).toBe(1);

    // Multiple entries where only 1 survives and where 0 survive.
    const twoArchive = await zipOf({ "a.pdf": pdf1, "b.pdf": badPdfBytes });
    const oneSurvivor = await convertZipToPdf(
      twoArchive,
      { mode: ZIP_TO_PDF_MODE.combined },
      stubPorts({
        mergePdfs: async (inputs) => {
          if (inputs.some((input) => input.byteLength === badPdfBytes.byteLength)) {
            throw new Error("b failed");
          }
          return stubPorts().mergePdfs(inputs);
        },
      }),
    );
    expect(oneSurvivor.entries).toEqual([
      { path: "a.pdf", status: ZIP_ENTRY_STATUS.converted, outputPath: "a.pdf" },
      { path: "b.pdf", status: ZIP_ENTRY_STATUS.failed, message: "b failed" },
    ]);
    expect((await PDFDocument.load(oneSurvivor.bytes)).getPageCount()).toBe(1);

    const zeroSurvivors = await convertZipToPdf(
      twoArchive,
      { mode: ZIP_TO_PDF_MODE.combined },
      stubPorts({
        mergePdfs: async () => {
          throw 42;
        },
      }),
    );
    expect(zeroSurvivors.entries.every((e) => e.status === ZIP_ENTRY_STATUS.failed)).toBe(true);
    expect((await PDFDocument.load(zeroSurvivors.bytes)).getPageCount()).toBe(1);

    // Cross-document merge failure: each passes singly, combining entry 2 with entry 1 fails.
    let batchAttempts = 0;
    const crossDocResult = await convertZipToPdf(
      await zipOf({ "01.pdf": pdf1, "02.pdf": badPdfBytes, "03.pdf": pdf3 }),
      { mode: ZIP_TO_PDF_MODE.combined },
      stubPorts({
        mergePdfs: async (inputs) => {
          if (inputs.length === 1) return stubPorts().mergePdfs(inputs);
          if (inputs.length === 3 && batchAttempts === 0) {
            batchAttempts += 1;
            throw new Error("batch conflict");
          }
          if (inputs.some((input) => input.byteLength === badPdfBytes.byteLength)) {
            throw new Error("cross-doc merge conflict");
          }
          return stubPorts().mergePdfs(inputs);
        },
      }),
    );
    expect(crossDocResult.entries).toEqual([
      { path: "01.pdf", status: ZIP_ENTRY_STATUS.converted, outputPath: "01.pdf" },
      {
        path: "02.pdf",
        status: ZIP_ENTRY_STATUS.failed,
        message: "cross-doc merge conflict",
      },
      { path: "03.pdf", status: ZIP_ENTRY_STATUS.converted, outputPath: "03.pdf" },
    ]);
    expect((await PDFDocument.load(crossDocResult.bytes)).getPageCount()).toBe(2);
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

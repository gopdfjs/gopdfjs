import { describe, it, vi } from "vitest";
import type { Gopdf } from "@gopdfjs/adapter/gopdf";
import type { GopdfAdapter } from "@gopdfjs/adapter/gopdf";
import { assertPdfBytesReadable, detachArrayBuffer } from "@gopdfjs/adapter/bytes";
import { detachIncomingBytes } from "./helpers/detachIncomingBytes";

const { mockFn, STUB_BYTES, STUB_GRAY, STUB_REPAIR, STUB_BATCH, STUB_BLOB } = vi.hoisted(() => {
  const bytes = new Uint8Array([37, 80, 68, 70]);
  const gray = {
    bytes,
    inputPages: 1,
    outputPages: 1,
    inputBytes: 4,
    outputBytes: 4,
  };
  const repair = { bytes, report: { strategy: "none" as const, pages: 1 } };
  const batch = { items: [], successCount: 0, failureCount: 0 };
  const blob = new Blob([bytes]);

  const fn = <T>(result: T) =>
    vi.fn(async (...args: unknown[]) => {
      detachIncomingBytes(args);
      return result;
    });

  return {
    mockFn: fn,
    STUB_BYTES: bytes,
    STUB_GRAY: gray,
    STUB_REPAIR: repair,
    STUB_BATCH: batch,
    STUB_BLOB: blob,
  };
});

vi.mock("@gopdfjs/plugin-shrink", () => ({ compressPdf: mockFn(STUB_BYTES) }));
vi.mock("@gopdfjs/plugin-grayscale", () => ({ grayscalePdf: mockFn(STUB_GRAY) }));
vi.mock("@gopdfjs/plugin-redact", () => ({ redactPdf: mockFn(STUB_BYTES) }));
vi.mock("@gopdfjs/plugin-repair", () => ({
  repairPdf: mockFn(STUB_REPAIR),
  repairPdfBatch: mockFn(STUB_BATCH),
}));
vi.mock("@gopdfjs/plugin-extract", () => ({
  extractImages: mockFn([]),
  extractPdfTextRuns: mockFn([]),
  pdfToWord: mockFn(STUB_BLOB),
  pdfToExcel: mockFn({ blob: STUB_BLOB, analysis: {} }),
  pdfToPpt: mockFn(STUB_BLOB),
  pdfToEpub: mockFn(STUB_BLOB),
}));
vi.mock("@gopdfjs/plugin-inspect", () => ({
  analyzePdf: mockFn({ pageCount: 1, textRuns: [], images: [] }),
}));
vi.mock("@gopdfjs/plugin-annotate", () => ({ applyEdits: mockFn(STUB_BYTES) }));
vi.mock("@gopdfjs/plugin-author", () => ({
  htmlToPdf: mockFn({ bytes: STUB_BYTES, pageCount: 1 }),
  markdownToHtml: mockFn("<p>x</p>"),
}));
vi.mock("@gopdfjs/plugin-struct", () => ({
  mergePdfs: mockFn(STUB_BYTES),
  splitPdf: mockFn([STUB_BYTES]),
  rotatePdf: mockFn(STUB_BYTES),
  protectPdf: mockFn(STUB_BYTES),
  unlockPdf: mockFn(STUB_BYTES),
  organizePdf: mockFn(STUB_BYTES),
  cropPdf: mockFn(STUB_BYTES),
  jpgToPdf: mockFn(STUB_BYTES),
  watermarkPdf: mockFn(STUB_BYTES),
  signPdf: mockFn(STUB_BYTES),
  halvePdf: mockFn(STUB_BYTES),
  nUpPdf: mockFn(STUB_BYTES),
  fillPdfForm: mockFn(STUB_BYTES),
  addHeaderFooter: mockFn(STUB_BYTES),
  addPageNumbers: mockFn(STUB_BYTES),
  applyNativeTextEdits: mockFn(STUB_BYTES),
}));

import { createEngine } from "../createEngine";

const mockPage = {
  getViewport: () => ({ width: 100, height: 100 }),
  render: () => ({ promise: Promise.resolve() }),
  getTextContent: async () => ({ items: [] }),
};

function createDetachingAdapter(): GopdfAdapter {
  return {
    engine: {
      compressPdf: async (bytes) => {
        detachArrayBuffer(bytes);
        return STUB_BYTES;
      },
      encodeImages: async () => new Uint8Array(),
      grayscalePdf: async (bytes) => {
        detachArrayBuffer(bytes);
        return STUB_BYTES;
      },
      linearizePdf: async (bytes) => {
        detachArrayBuffer(bytes);
        return STUB_BYTES;
      },
    },
    pdfjs: {
      loadDocument: async (bytes) => {
        detachArrayBuffer(bytes);
        return { numPages: 1, getPage: async () => mockPage };
      },
      getOps: async () => ({}),
    },
    canvas: {
      create: async () => ({
        width: 1,
        height: 1,
        getContext2d: () => ({}) as CanvasRenderingContext2D,
        toImageBytes: async () => new Uint8Array([255]),
        dispose: async () => undefined,
      }),
    },
    ocr: { recognize: async () => "ocr" },
  };
}

type FacadeCase = {
  name: string;
  run: (engine: Gopdf, host: Uint8Array) => Promise<unknown>;
};

const HOST = new Uint8Array([37, 80, 68, 70, 45, 49, 46, 52]);
const PNG_STUB = new Uint8Array([137, 80, 78, 71]);

const FACADE_CASES: FacadeCase[] = [
  { name: "linearizePdf", run: (e, h) => e.linearizePdf(h) },
  { name: "analyzePdf", run: (e, h) => e.analyzePdf(h) },
  { name: "compressPdf", run: (e, h) => e.compressPdf(h, "recommended") },
  { name: "grayscalePdf", run: (e, h) => e.grayscalePdf(h, { mode: "grayscale" }) },
  { name: "redactPdf", run: (e, h) => e.redactPdf(h, []) },
  { name: "repairPdf", run: (e, h) => e.repairPdf(h) },
  {
    name: "repairPdfBatch",
    run: (e, h) => e.repairPdfBatch([{ bytes: h, fileName: "a.pdf" }]),
  },
  { name: "pdfToJpeg", run: (e, h) => e.pdfToJpeg(h) },
  { name: "pdfToText", run: (e, h) => e.pdfToText(h, { format: "txt" }) },
  { name: "ocr", run: (e, h) => e.ocr(h) },
  { name: "extractImages", run: (e, h) => e.extractImages(h) },
  { name: "extractPdfTextRuns", run: (e, h) => e.extractPdfTextRuns(h) },
  { name: "pdfToWord", run: (e, h) => e.pdfToWord(h) },
  {
    name: "pdfToExcel",
    run: (e, h) => e.pdfToExcel(h, { format: "csv" }),
  },
  {
    name: "pdfToPpt",
    run: (e, h) => e.pdfToPpt(h, { pageIndices: [0], slideLayout: "16x9", template: "editable-only" }),
  },
  {
    name: "pdfToEpub",
    run: (e, h) => e.pdfToEpub(h, { metadata: { title: "t", author: "a" } }),
  },
  { name: "mergePdfs", run: (e, h) => e.mergePdfs([h, h]) },
  { name: "splitPdf", run: (e, h) => e.splitPdf(h, [[0, 0]]) },
  { name: "rotatePdf", run: (e, h) => e.rotatePdf(h, 90, "all") },
  { name: "protectPdf", run: (e, h) => e.protectPdf(h, "secret") },
  { name: "unlockPdf", run: (e, h) => e.unlockPdf(h, "") },
  { name: "organizePdf", run: (e, h) => e.organizePdf(h, [0]) },
  { name: "cropPdf", run: (e, h) => e.cropPdf(h, { top: 0, bottom: 0, left: 0, right: 0 }) },
  {
    name: "jpgToPdf",
    run: (e, h) => e.jpgToPdf([{ bytes: h, mimeType: "image/jpeg" }]),
  },
  {
    name: "watermarkPdf",
    run: (e, h) =>
      e.watermarkPdf(h, { text: "x" }, { fontSize: 12, opacity: 0.5, rotation: 0, color: "#000", tile: false, position: "center" }),
  },
  {
    name: "signPdf",
    run: (e, h) => e.signPdf(h, PNG_STUB, { pageIndex: 0, x: 0, y: 0, width: 10, height: 10 }),
  },
  { name: "halvePdf", run: (e, h) => e.halvePdf(h, { orientation: "vertical" }) },
  { name: "nUpPdf", run: (e, h) => e.nUpPdf(h, { layout: "2x2" }) },
  { name: "fillPdfForm", run: (e, h) => e.fillPdfForm(h, {}) },
  {
    name: "addHeaderFooter",
    run: (e, h) => e.addHeaderFooter(h, { header: "h", footer: "f", fontSize: 10, color: "#000", margin: 12 }),
  },
  {
    name: "addPageNumbers",
    run: (e, h) =>
      e.addPageNumbers(h, {
        position: "bottom-center",
        startNumber: 1,
        fontSize: 10,
        prefix: "",
        suffix: "",
      }),
  },
  {
    name: "applyNativeTextEdits",
    run: (e, h) =>
      e.applyNativeTextEdits(h, [
        { pageIndex: 0, x: 0, y: 0, width: 10, height: 10, fontSize: 12, text: "hi" },
      ]),
  },
  { name: "analyzePdf", run: (e, h) => e.analyzePdf(h) },
  { name: "applyEdits", run: (e, h) => e.applyEdits(h, []) },
];

describe("createEngine facade byte pressure (RFC 0058 §2.4)", () => {
  for (const { name, run } of FACADE_CASES) {
    it(`${name} — host buffer survives downstream detach`, async () => {
      const host = new Uint8Array(HOST);
      const engine = createEngine(createDetachingAdapter());
      try {
        await run(engine, host);
      } catch {
        // junk fixture bytes may fail tool logic — ownership must still hold
      }
      assertPdfBytesReadable(host);
    });
  }

  it("signPdf — both host and png buffers survive", async () => {
    const host = new Uint8Array(HOST);
    const png = new Uint8Array(PNG_STUB);
    const engine = createEngine(createDetachingAdapter());
    try {
      await engine.signPdf(host, png, { pageIndex: 0, x: 0, y: 0, width: 10, height: 10 });
    } catch {
      // ignore tool errors
    }
    assertPdfBytesReadable(host);
    assertPdfBytesReadable(png);
  });

  it("chained calls on same host reference", async () => {
    const host = new Uint8Array(HOST);
    const engine = createEngine(createDetachingAdapter());

    try {
      await engine.analyzePdf(host);
    } catch {
      // ignore junk fixture tool errors
    }
    assertPdfBytesReadable(host);

    try {
      await engine.grayscalePdf(host, { mode: "grayscale" });
    } catch {
      // ignore
    }
    assertPdfBytesReadable(host);

    try {
      await engine.compressPdf(host, "recommended");
    } catch {
      // ignore
    }
    assertPdfBytesReadable(host);

    try {
      await engine.analyzePdf(host);
    } catch {
      // ignore
    }
    assertPdfBytesReadable(host);
  });
});

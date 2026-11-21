import {
  ZIP_ENTRY_STATUS,
  ZIP_TO_PDF_DEFAULT_LIMITS,
  ZIP_TO_PDF_MODE,
  ZipToPdfError,
  type ZipToPdfEntryResult,
  type ZipToPdfLimits,
  type ZipToPdfMode,
  type ZipToPdfOptions,
  type ZipToPdfResult,
} from "@gopdfjs/adapter/gopdf";
import { htmlToPdf, markdownToHtml, sanitizeHtml } from "@gopdfjs/plugin-author";
import { jpgToPdf, mergePdfs } from "@gopdfjs/plugin-struct";
import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";

export { ZIP_TO_PDF_DEFAULT_LIMITS, ZipToPdfError };

const MIME_JPEG = "image/jpeg";
const MIME_PNG = "image/png";
const PDF_EXTENSION = ".pdf";
const EMPTY_FILE_MESSAGE = "Empty file";
const UNSUPPORTED_MESSAGE = "Unsupported file type";
const UNSAFE_PATH_MESSAGE = "Unsafe archive path";
const INVALID_ZIP_MESSAGE = "ZIP archive could not be read";
const INVALID_MODE_MESSAGE = "ZIP to PDF mode must be combined or individual";
const CONVERSION_FAILED_MESSAGE = "Conversion failed";
const CALLBACK_FAILED_MESSAGE = "Entry callback failed";
const MERGE_FAILED_MESSAGE = "PDF merge failed";

const KIND_JPEG = "jpeg";
const KIND_PNG = "png";
const KIND_PDF = "pdf";
const KIND_PLAIN_TEXT = "plain-text";
const KIND_MARKDOWN = "markdown";
const KIND_HTML = "html";
const KIND_UNSUPPORTED = "unsupported";

const EXTENSION_KIND = {
  ".jpg": KIND_JPEG,
  ".jpeg": KIND_JPEG,
  ".png": KIND_PNG,
  ".pdf": KIND_PDF,
  ".txt": KIND_PLAIN_TEXT,
  ".text": KIND_PLAIN_TEXT,
  ".md": KIND_MARKDOWN,
  ".markdown": KIND_MARKDOWN,
  ".html": KIND_HTML,
  ".htm": KIND_HTML,
} as const;

type EntryKind = (typeof EXTENSION_KIND)[keyof typeof EXTENSION_KIND] | typeof KIND_UNSUPPORTED;

export type ZipToPdfPorts = {
  imageToPdf: (bytes: Uint8Array, mimeType: string) => Promise<Uint8Array>;
  documentToPdf: (html: string) => Promise<Uint8Array>;
  markdownToHtml: (source: string) => Promise<string>;
  mergePdfs: (inputs: Uint8Array[]) => Promise<Uint8Array>;
  assertPdf: (bytes: Uint8Array) => Promise<void>;
};

type ResolvedLimits = Required<ZipToPdfLimits>;

type JsZipInternalStream = {
  on(event: "data", listener: (chunk: Uint8Array) => void): JsZipInternalStream;
  on(event: "error", listener: (error: unknown) => void): JsZipInternalStream;
  on(event: "end", listener: () => void): JsZipInternalStream;
  resume(): JsZipInternalStream;
  pause(): JsZipInternalStream;
};

type JsZipInternalEntry = JSZip.JSZipObject & {
  unsafeOriginalName?: string;
  _data?: { uncompressedSize?: number };
  internalStream(type: "uint8array"): JsZipInternalStream;
};

type ArchiveItem = {
  rawPath: string;
  displayPath: string;
  safePath: string | null;
  entry: JSZip.JSZipObject;
};

type ConvertedItem = {
  entryIndex: number;
  outputPath: string;
  pdf: Uint8Array;
};

type EntryOutcome = {
  pdf?: Uint8Array;
  status: ZipToPdfEntryResult["status"];
  message?: string;
  inflatedBytes: number;
};

function formatErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.length > 0) return error.message;
  if (typeof error === "string" && error.length > 0) return error;
  return fallback;
}

function extensionOf(path: string): string {
  const slash = path.lastIndexOf("/");
  const base = slash >= 0 ? path.slice(slash + 1) : path;
  const dot = base.lastIndexOf(".");
  if (dot <= 0) return "";
  return base.slice(dot).toLowerCase();
}

function kindForExtension(extension: string): EntryKind {
  return EXTENSION_KIND[extension as keyof typeof EXTENSION_KIND] ?? KIND_UNSUPPORTED;
}

/** Reject absolute paths and `..` so output names stay inside the archive tree. */
export function normalizeZipEntryPath(name: string): string | null {
  const slashed = name.replace(/\\/g, "/");
  if (slashed.startsWith("/") || /^[A-Za-z]:/.test(slashed)) return null;
  const parts: string[] = [];
  for (const part of slashed.split("/")) {
    if (part === "" || part === ".") continue;
    if (part === "..") return null;
    parts.push(part);
  }
  if (parts.length === 0) return null;
  return parts.join("/");
}

function pdfOutputPath(entryPath: string): string {
  const slash = entryPath.lastIndexOf("/");
  const dir = slash >= 0 ? entryPath.slice(0, slash + 1) : "";
  const base = slash >= 0 ? entryPath.slice(slash + 1) : entryPath;
  const dot = base.lastIndexOf(".");
  const stem = dot > 0 ? base.slice(0, dot) : base;
  return `${dir}${stem}${PDF_EXTENSION}`;
}

function uniqueOutputPath(desired: string, usedLower: Set<string>): string {
  const desiredKey = desired.toLowerCase();
  if (!usedLower.has(desiredKey)) {
    usedLower.add(desiredKey);
    return desired;
  }
  const slash = desired.lastIndexOf("/");
  const dir = slash >= 0 ? desired.slice(0, slash + 1) : "";
  const file = slash >= 0 ? desired.slice(slash + 1) : desired;
  const stem = file.slice(0, -PDF_EXTENSION.length);
  let suffix = 2;
  let candidate = `${dir}${stem}-${suffix}${PDF_EXTENSION}`;
  while (usedLower.has(candidate.toLowerCase())) {
    suffix += 1;
    candidate = `${dir}${stem}-${suffix}${PDF_EXTENSION}`;
  }
  usedLower.add(candidate.toLowerCase());
  return candidate;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Sort strings in deterministic Unicode code-point order (BMP and astral characters). */
function compareCodePoints(left: string, right: string): number {
  let leftIndex = 0;
  let rightIndex = 0;
  while (leftIndex < left.length && rightIndex < right.length) {
    const leftCp = left.codePointAt(leftIndex)!;
    const rightCp = right.codePointAt(rightIndex)!;
    if (leftCp !== rightCp) return leftCp - rightCp;
    leftIndex += leftCp > 0xffff ? 2 : 1;
    rightIndex += rightCp > 0xffff ? 2 : 1;
  }
  return left.length - right.length;
}

async function createEmptyPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.addPage();
  return doc.save();
}

function assertPositiveInt(name: keyof ResolvedLimits, value: number): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new ZipToPdfError(`ZIP to PDF limit ${name} must be a positive integer`);
  }
  return value;
}

function resolveLimits(limits?: ZipToPdfLimits): ResolvedLimits {
  return {
    maxEntries: assertPositiveInt(
      "maxEntries",
      limits?.maxEntries ?? ZIP_TO_PDF_DEFAULT_LIMITS.maxEntries,
    ),
    maxEntryBytes: assertPositiveInt(
      "maxEntryBytes",
      limits?.maxEntryBytes ?? ZIP_TO_PDF_DEFAULT_LIMITS.maxEntryBytes,
    ),
    maxTotalUncompressedBytes: assertPositiveInt(
      "maxTotalUncompressedBytes",
      limits?.maxTotalUncompressedBytes ?? ZIP_TO_PDF_DEFAULT_LIMITS.maxTotalUncompressedBytes,
    ),
  };
}

function readDeclaredSize(entry: JSZip.JSZipObject): number | null {
  const size = (entry as JsZipInternalEntry)._data?.uncompressedSize;
  return typeof size === "number" && Number.isFinite(size) && size >= 0 ? size : null;
}

function enforcePreFlightLimits(items: ArchiveItem[], limits: ResolvedLimits): void {
  if (items.length > limits.maxEntries) {
    throw new ZipToPdfError(
      `ZIP archive has ${items.length} entries, exceeding maxEntries (${limits.maxEntries})`,
    );
  }
  let declaredTotalBytes = 0;
  for (const item of items) {
    const declaredSize = readDeclaredSize(item.entry);
    if (declaredSize === null) continue;
    if (declaredSize > limits.maxEntryBytes) {
      throw new ZipToPdfError(
        `ZIP entry "${item.displayPath}" declares ${declaredSize} bytes, exceeding maxEntryBytes (${limits.maxEntryBytes} bytes)`,
      );
    }
    declaredTotalBytes += declaredSize;
    if (declaredTotalBytes > limits.maxTotalUncompressedBytes) {
      throw new ZipToPdfError(
        `ZIP total declared uncompressed size (${declaredTotalBytes} bytes) exceeds maxTotalUncompressedBytes (${limits.maxTotalUncompressedBytes} bytes)`,
      );
    }
  }
}

async function listArchiveEntries(bytes: Uint8Array, limits: ResolvedLimits): Promise<ArchiveItem[]> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(bytes);
  } catch (error) {
    const detail = formatErrorMessage(error, INVALID_ZIP_MESSAGE);
    throw new ZipToPdfError(`${INVALID_ZIP_MESSAGE}: ${detail}`);
  }

  const items: ArchiveItem[] = [];
  for (const [name, entry] of Object.entries(zip.files)) {
    if (!entry || entry.dir) continue;
    const rawPath = (entry as JsZipInternalEntry).unsafeOriginalName ?? name;
    const safePath = normalizeZipEntryPath(rawPath);
    items.push({
      rawPath,
      displayPath: safePath ?? rawPath,
      safePath,
      entry,
    });
  }

  items.sort(
    (left, right) =>
      compareCodePoints(left.displayPath, right.displayPath) ||
      compareCodePoints(left.rawPath, right.rawPath),
  );
  enforcePreFlightLimits(items, limits);
  return items;
}

function concatChunks(chunks: Uint8Array[], totalBytes: number): Uint8Array {
  const out = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

function inflateEntryBounded(
  item: ArchiveItem,
  limits: ResolvedLimits,
  inflatedSoFar: number,
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    let entryBytes = 0;
    let settled = false;
    const stream = (item.entry as JsZipInternalEntry).internalStream("uint8array");

    const abort = (error: Error) => {
      if (settled) return;
      settled = true;
      chunks.length = 0;
      stream.pause();
      reject(error);
    };

    stream
      .on("data", (chunk: Uint8Array) => {
        if (settled) return;
        entryBytes += chunk.byteLength;
        if (entryBytes > limits.maxEntryBytes) {
          abort(
            new ZipToPdfError(
              `ZIP entry "${item.displayPath}" exceeds maxEntryBytes (${limits.maxEntryBytes} bytes)`,
            ),
          );
          return;
        }
        if (inflatedSoFar + entryBytes > limits.maxTotalUncompressedBytes) {
          abort(
            new ZipToPdfError(
              `ZIP total uncompressed size exceeds maxTotalUncompressedBytes (${limits.maxTotalUncompressedBytes} bytes)`,
            ),
          );
          return;
        }
        chunks.push(chunk);
      })
      .on("error", (error: unknown) => {
        abort(
          error instanceof Error
            ? error
            : new Error(formatErrorMessage(error, CONVERSION_FAILED_MESSAGE)),
        );
      })
      .on("end", () => {
        if (settled) return;
        settled = true;
        resolve(concatChunks(chunks, entryBytes));
      })
      .resume();
  });
}

function assertMode(mode: string): asserts mode is ZipToPdfMode {
  if (mode !== ZIP_TO_PDF_MODE.combined && mode !== ZIP_TO_PDF_MODE.individual) {
    throw new ZipToPdfError(INVALID_MODE_MESSAGE);
  }
}

async function convertEntry(
  item: ArchiveItem,
  limits: ResolvedLimits,
  inflatedSoFar: number,
  ports: ZipToPdfPorts,
): Promise<EntryOutcome> {
  if (!item.safePath) {
    return { status: ZIP_ENTRY_STATUS.failed, message: UNSAFE_PATH_MESSAGE, inflatedBytes: 0 };
  }

  const kind = kindForExtension(extensionOf(item.safePath));
  if (kind === KIND_UNSUPPORTED) {
    return { status: ZIP_ENTRY_STATUS.unsupported, message: UNSUPPORTED_MESSAGE, inflatedBytes: 0 };
  }

  let fileBytes: Uint8Array;
  try {
    fileBytes = await inflateEntryBounded(item, limits, inflatedSoFar);
  } catch (error) {
    if (error instanceof ZipToPdfError) throw error;
    return {
      status: ZIP_ENTRY_STATUS.failed,
      message: formatErrorMessage(error, CONVERSION_FAILED_MESSAGE),
      inflatedBytes: 0,
    };
  }

  const inflatedBytes = fileBytes.byteLength;
  if (inflatedBytes === 0) {
    return { status: ZIP_ENTRY_STATUS.failed, message: EMPTY_FILE_MESSAGE, inflatedBytes };
  }

  try {
    if (kind === KIND_JPEG) {
      return {
        status: ZIP_ENTRY_STATUS.converted,
        pdf: await ports.imageToPdf(fileBytes, MIME_JPEG),
        inflatedBytes,
      };
    }
    if (kind === KIND_PNG) {
      return {
        status: ZIP_ENTRY_STATUS.converted,
        pdf: await ports.imageToPdf(fileBytes, MIME_PNG),
        inflatedBytes,
      };
    }
    if (kind === KIND_PDF) {
      await ports.assertPdf(fileBytes);
      return { status: ZIP_ENTRY_STATUS.converted, pdf: fileBytes, inflatedBytes };
    }

    const text = new TextDecoder("utf-8", { fatal: true }).decode(fileBytes);
    const html =
      kind === KIND_MARKDOWN
        ? await ports.markdownToHtml(text)
        : kind === KIND_HTML
          ? text
          : `<pre>${escapeHtml(text)}</pre>`;
    return {
      status: ZIP_ENTRY_STATUS.converted,
      pdf: await ports.documentToPdf(html),
      inflatedBytes,
    };
  } catch (error) {
    return {
      status: ZIP_ENTRY_STATUS.failed,
      message: formatErrorMessage(error, CONVERSION_FAILED_MESSAGE),
      inflatedBytes,
    };
  }
}

function markEntryMergeFailed(entry: ZipToPdfEntryResult, error: unknown): void {
  entry.status = ZIP_ENTRY_STATUS.failed;
  delete entry.outputPath;
  entry.message = formatErrorMessage(error, MERGE_FAILED_MESSAGE);
}

async function mergeConvertedPdfs(
  converted: ConvertedItem[],
  entries: ZipToPdfEntryResult[],
  ports: ZipToPdfPorts,
): Promise<Uint8Array> {
  if (converted.length === 0) {
    return createEmptyPdf();
  }

  try {
    return await ports.mergePdfs(converted.map((item) => item.pdf));
  } catch (batchError) {
    if (converted.length === 1) {
      markEntryMergeFailed(entries[converted[0]!.entryIndex]!, batchError);
      return createEmptyPdf();
    }
  }

  const survivors: { item: ConvertedItem; singleMerged: Uint8Array }[] = [];
  for (const item of converted) {
    try {
      const singleMerged = await ports.mergePdfs([item.pdf]);
      survivors.push({ item, singleMerged });
    } catch (error) {
      markEntryMergeFailed(entries[item.entryIndex]!, error);
    }
  }

  if (survivors.length === 0) {
    return createEmptyPdf();
  }
  if (survivors.length === 1) {
    return survivors[0]!.singleMerged;
  }

  if (survivors.length < converted.length) {
    try {
      return await ports.mergePdfs(survivors.map((survivor) => survivor.item.pdf));
    } catch {
      // Fall through to incremental merge to isolate cross-document merge failures.
    }
  }

  let merged = survivors[0]!.singleMerged;
  for (let index = 1; index < survivors.length; index += 1) {
    const next = survivors[index]!;
    try {
      merged = await ports.mergePdfs([merged, next.item.pdf]);
    } catch (error) {
      markEntryMergeFailed(entries[next.item.entryIndex]!, error);
    }
  }
  return merged;
}

async function packageResult(
  mode: ZipToPdfMode,
  converted: ConvertedItem[],
  entries: ZipToPdfEntryResult[],
  ports: ZipToPdfPorts,
): Promise<Uint8Array> {
  if (mode === ZIP_TO_PDF_MODE.individual) {
    const zip = new JSZip();
    for (const item of converted) {
      zip.file(item.outputPath, item.pdf, { createFolders: false });
    }
    return zip.generateAsync({ type: "uint8array" });
  }
  return mergeConvertedPdfs(converted, entries, ports);
}

function notifyEntry(
  onEntry: ZipToPdfOptions["onEntry"],
  entry: ZipToPdfEntryResult,
  index: number,
  total: number,
): void {
  if (!onEntry) return;
  try {
    onEntry({ ...entry }, index, total);
  } catch (error) {
    entry.callbackError = formatErrorMessage(error, CALLBACK_FAILED_MESSAGE);
  }
}

export function createDefaultZipToPdfPorts(): ZipToPdfPorts {
  return {
    imageToPdf: async (bytes, mimeType) => jpgToPdf([{ bytes, mimeType }]),
    documentToPdf: async (html) => {
      const result = await htmlToPdf(sanitizeHtml(html));
      return result.bytes;
    },
    markdownToHtml,
    mergePdfs,
    assertPdf: async (bytes) => {
      const source = await PDFDocument.load(bytes);
      const target = await PDFDocument.create();
      await target.copyPages(source, source.getPageIndices());
    },
  };
}

/**
 * Unzip, convert supported entries one at a time in Unicode code-point path order,
 * and either merge the PDFs or pack them under the original relative paths.
 */
export async function convertZipToPdf(
  bytes: Uint8Array,
  options: ZipToPdfOptions,
  ports: ZipToPdfPorts = createDefaultZipToPdfPorts(),
): Promise<ZipToPdfResult> {
  assertMode(options.mode);
  const limits = resolveLimits(options.limits);
  const items = await listArchiveEntries(bytes, limits);
  const entries: ZipToPdfEntryResult[] = [];
  const converted: ConvertedItem[] = [];
  const usedLowerNames = new Set<string>();
  const total = items.length;
  let inflatedSoFar = 0;

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index]!;
    const outcome = await convertEntry(item, limits, inflatedSoFar, ports);
    inflatedSoFar += outcome.inflatedBytes;
    const outputPath =
      outcome.status === ZIP_ENTRY_STATUS.converted
        ? uniqueOutputPath(pdfOutputPath(item.displayPath), usedLowerNames)
        : undefined;
    const entry: ZipToPdfEntryResult = {
      path: item.displayPath,
      status: outcome.status,
      ...(outputPath ? { outputPath } : {}),
      ...(outcome.message ? { message: outcome.message } : {}),
    };
    entries.push(entry);
    if (outcome.pdf && outputPath) {
      converted.push({ entryIndex: index, outputPath, pdf: outcome.pdf });
    }
    notifyEntry(options.onEntry, entry, index, total);
  }

  return {
    mode: options.mode,
    bytes: await packageResult(options.mode, converted, entries, ports),
    entries,
  };
}

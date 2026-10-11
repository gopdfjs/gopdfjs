import {
  ZIP_ENTRY_STATUS,
  ZIP_TO_PDF_MODE,
  type ZipToPdfEntryResult,
  type ZipToPdfMode,
  type ZipToPdfOptions,
  type ZipToPdfResult,
} from "@gopdfjs/adapter/gopdf";
import { htmlToPdf, markdownToHtml, sanitizeHtml } from "@gopdfjs/plugin-author";
import { jpgToPdf, mergePdfs } from "@gopdfjs/plugin-struct";
import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";

const MIME_JPEG = "image/jpeg";
const MIME_PNG = "image/png";
const PDF_EXTENSION = ".pdf";
const EMPTY_FILE_MESSAGE = "Empty file";
const UNSUPPORTED_MESSAGE = "Unsupported file type";
const UNSAFE_PATH_MESSAGE = "Unsafe archive path";
const INVALID_ZIP_MESSAGE = "ZIP archive could not be read";
const INVALID_MODE_MESSAGE = "ZIP to PDF mode must be combined or individual";

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

/** Thrown when the container itself is not a readable ZIP or the mode is unknown. */
export class ZipToPdfError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ZipToPdfError";
  }
}

type ArchiveFile = {
  path: string;
  bytes: Uint8Array;
};

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

function uniqueOutputPath(desired: string, used: Set<string>): string {
  if (!used.has(desired)) {
    used.add(desired);
    return desired;
  }
  const slash = desired.lastIndexOf("/");
  const dir = slash >= 0 ? desired.slice(0, slash + 1) : "";
  const file = slash >= 0 ? desired.slice(slash + 1) : desired;
  const stem = file.slice(0, -PDF_EXTENSION.length);
  let suffix = 2;
  let candidate = `${dir}${stem}-${suffix}${PDF_EXTENSION}`;
  while (used.has(candidate)) {
    suffix += 1;
    candidate = `${dir}${stem}-${suffix}${PDF_EXTENSION}`;
  }
  used.add(candidate);
  return candidate;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function comparePaths(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

const EMPTY_PDF_BYTES = new TextEncoder().encode(
  "%PDF-1.7\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\nxref\n0 3\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \ntrailer\n<< /Size 3 /Root 1 0 R >>\nstartxref\n109\n%%EOF",
);

async function readArchive(bytes: Uint8Array): Promise<ArchiveFile[]> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(bytes);
  } catch (error) {
    const detail = error instanceof Error ? error.message : INVALID_ZIP_MESSAGE;
    throw new ZipToPdfError(`${INVALID_ZIP_MESSAGE}: ${detail}`);
  }

  const files: ArchiveFile[] = [];
  const names = Object.keys(zip.files).sort(comparePaths);
  for (const name of names) {
    const entry = zip.files[name];
    if (!entry || entry.dir) continue;
    const rawPath = (entry as { unsafeOriginalName?: string }).unsafeOriginalName ?? name;
    files.push({ path: rawPath, bytes: await entry.async("uint8array") });
  }
  return files.sort((left, right) => comparePaths(left.path, right.path));
}

function assertMode(mode: string): asserts mode is ZipToPdfMode {
  if (mode !== ZIP_TO_PDF_MODE.combined && mode !== ZIP_TO_PDF_MODE.individual) {
    throw new ZipToPdfError(INVALID_MODE_MESSAGE);
  }
}

async function convertEntry(
  file: ArchiveFile,
  ports: ZipToPdfPorts,
): Promise<{ pdf?: Uint8Array; status: ZipToPdfEntryResult["status"]; message?: string }> {
  const safePath = normalizeZipEntryPath(file.path);
  if (!safePath) {
    return { status: ZIP_ENTRY_STATUS.failed, message: UNSAFE_PATH_MESSAGE };
  }
  if (file.bytes.byteLength === 0) {
    return { status: ZIP_ENTRY_STATUS.failed, message: EMPTY_FILE_MESSAGE };
  }

  const kind = kindForExtension(extensionOf(safePath));
  if (kind === KIND_UNSUPPORTED) {
    return { status: ZIP_ENTRY_STATUS.unsupported, message: UNSUPPORTED_MESSAGE };
  }

  try {
    if (kind === KIND_JPEG) {
      return { status: ZIP_ENTRY_STATUS.converted, pdf: await ports.imageToPdf(file.bytes, MIME_JPEG) };
    }
    if (kind === KIND_PNG) {
      return { status: ZIP_ENTRY_STATUS.converted, pdf: await ports.imageToPdf(file.bytes, MIME_PNG) };
    }
    if (kind === KIND_PDF) {
      await ports.assertPdf(file.bytes);
      return { status: ZIP_ENTRY_STATUS.converted, pdf: file.bytes };
    }

    const text = new TextDecoder("utf-8", { fatal: true }).decode(file.bytes);
    const html =
      kind === KIND_MARKDOWN
        ? await ports.markdownToHtml(text)
        : kind === KIND_HTML
          ? text
          : `<pre>${escapeHtml(text)}</pre>`;
    return { status: ZIP_ENTRY_STATUS.converted, pdf: await ports.documentToPdf(html) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Conversion failed";
    return { status: ZIP_ENTRY_STATUS.failed, message };
  }
}

async function packageResult(
  mode: ZipToPdfMode,
  converted: { outputPath: string; pdf: Uint8Array }[],
  ports: ZipToPdfPorts,
): Promise<Uint8Array> {
  if (mode === ZIP_TO_PDF_MODE.individual) {
    const zip = new JSZip();
    for (const item of converted) {
      zip.file(item.outputPath, item.pdf, { createFolders: false });
    }
    return zip.generateAsync({ type: "uint8array" });
  }
  if (converted.length === 0) {
    return EMPTY_PDF_BYTES;
  }
  return ports.mergePdfs(converted.map((item) => item.pdf));
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
      await PDFDocument.load(bytes);
    },
  };
}

/**
 * Unzip, convert supported entries one at a time in code-point path order,
 * and either merge the PDFs or pack them under the original relative paths.
 */
export async function convertZipToPdf(
  bytes: Uint8Array,
  options: ZipToPdfOptions,
  ports: ZipToPdfPorts = createDefaultZipToPdfPorts(),
): Promise<ZipToPdfResult> {
  assertMode(options.mode);
  const files = await readArchive(bytes);
  const entries: ZipToPdfEntryResult[] = [];
  const converted: { outputPath: string; pdf: Uint8Array }[] = [];
  const usedNames = new Set<string>();
  const total = files.length;

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index]!;
    const safePath = normalizeZipEntryPath(file.path) ?? file.path;
    const outcome = await convertEntry({ ...file, path: safePath }, ports);
    const outputPath =
      outcome.status === ZIP_ENTRY_STATUS.converted
        ? uniqueOutputPath(pdfOutputPath(safePath), usedNames)
        : undefined;
    const entry: ZipToPdfEntryResult = {
      path: safePath,
      status: outcome.status,
      ...(outputPath ? { outputPath } : {}),
      ...(outcome.message ? { message: outcome.message } : {}),
    };
    entries.push(entry);
    if (outcome.pdf && outputPath) {
      converted.push({ outputPath, pdf: outcome.pdf });
    }
    options.onEntry?.(entry, index, total);
  }

  return {
    mode: options.mode,
    bytes: await packageResult(options.mode, converted, ports),
    entries,
  };
}

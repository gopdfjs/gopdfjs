import JSZip from "jszip";
import type { TextItem } from "pdfjs-dist/types/src/display/api";
import { pdfjs } from "@gopdfjs/render";
import { TEXT_RUN_LINE_Y_TOLERANCE_PT } from "../textRuns";
import {
  buildChapterXhtml,
  buildContentOpf,
  buildNavXhtml,
  cssForDevicePreset,
  EPUB_CONTAINER_XML,
  EPUB_DEVICE_PRESET,
  EPUB_MIMETYPE,
  type EpubChapter,
  type EpubDevicePreset,
  type EpubMetadata,
  type EpubOutlineEntry,
} from "./buildEpub";

export {
  EPUB_DEVICE_PRESET,
  buildChapterXhtml,
  buildContentOpf,
  buildNavXhtml,
  cssForDevicePreset,
  type EpubChapter,
  type EpubDevicePreset,
  type EpubMetadata,
  type EpubOutlineEntry,
} from "./buildEpub";

export interface PdfToEpubOptions {
  metadata: EpubMetadata;
  devicePreset?: EpubDevicePreset;
  coverImage?: Uint8Array;
}

function groupItemsIntoParagraphs(items: TextItem[]): string[] {
  const lines: Array<{ y: number; parts: Array<{ x: number; text: string }> }> = [];

  for (const item of items) {
    if (!item.str.trim()) continue;
    const y = item.transform[5];
    const x = item.transform[4];
    const existing = lines.find((line) => Math.abs(line.y - y) <= TEXT_RUN_LINE_Y_TOLERANCE_PT);
    if (existing) {
      existing.parts.push({ x, text: item.str });
    } else {
      lines.push({ y, parts: [{ x, text: item.str }] });
    }
  }

  lines.sort((a, b) => b.y - a.y);
  return lines
    .map((line) => {
      line.parts.sort((a, b) => a.x - b.x);
      return line.parts.map((part) => part.text).join(" ").trim();
    })
    .filter(Boolean);
}

interface PdfOutlineItem {
  title: string;
  dest?: unknown;
  items?: PdfOutlineItem[];
}

async function resolveOutline(
  pdf: Awaited<ReturnType<typeof pdfjs.getDocument>>["promise"] extends Promise<infer T> ? T : never,
): Promise<EpubOutlineEntry[]> {
  const raw = (await pdf.getOutline()) as PdfOutlineItem[] | null;
  if (!raw?.length) return [];

  const entries: EpubOutlineEntry[] = [];
  const walk = (items: PdfOutlineItem[]) => {
    for (const item of items) {
      if (item.title?.trim()) {
        const chapterId = `chapter-${entries.length + 1}`;
        entries.push({ title: item.title.trim(), chapterId });
      }
      if (item.items?.length) walk(item.items);
    }
  };
  walk(raw);
  return entries;
}

/** Convert PDF pages to a reflowable EPUB 3 package (MOBI not supported client-side). */
export async function pdfToEpub(
  file: File,
  options: PdfToEpubOptions,
  onProgress?: (current: number, total: number) => void,
): Promise<Blob> {
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const chapters: EpubChapter[] = [];
  const preset = options.devicePreset ?? EPUB_DEVICE_PRESET.GENERIC;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    onProgress?.(pageNum, pdf.numPages);
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent({ includeMarkedContent: false });
    const items = content.items.filter(
      (item): item is TextItem => "str" in item && item.str.trim().length > 0,
    );
    chapters.push({
      id: `chapter-${pageNum}`,
      title: `Page ${pageNum}`,
      paragraphs: groupItemsIntoParagraphs(items),
    });
  }

  let outline = await resolveOutline(pdf);
  if (outline.length === 0) {
    outline = chapters.map((chapter) => ({ title: chapter.title, chapterId: chapter.id }));
  } else {
    outline = outline.slice(0, chapters.length).map((entry, index) => ({
      title: entry.title,
      chapterId: chapters[index]?.id ?? `chapter-${index + 1}`,
    }));
  }

  const zip = new JSZip();
  zip.file("mimetype", EPUB_MIMETYPE, { compression: "STORE" });
  zip.folder("META-INF")?.file("container.xml", EPUB_CONTAINER_XML);

  const oebps = zip.folder("OEBPS");
  if (!oebps) throw new Error("Failed to create EPUB folder structure");

  oebps.file("content.opf", buildContentOpf(options.metadata, chapters.map((c) => c.id), Boolean(options.coverImage)));
  oebps.file("nav.xhtml", buildNavXhtml(outline));
  oebps.folder("styles")?.file("main.css", cssForDevicePreset(preset));

  const textFolder = oebps.folder("text");
  for (const chapter of chapters) {
    textFolder?.file(
      `${chapter.id}.xhtml`,
      buildChapterXhtml(chapter.title, chapter.paragraphs.length ? chapter.paragraphs : [" "]),
    );
  }

  if (options.coverImage) {
    oebps.folder("images")?.file("cover.jpg", options.coverImage);
  }

  const bytes = await zip.generateAsync({ type: "uint8array", mimeType: EPUB_MIMETYPE });
  return new Blob([bytes], { type: EPUB_MIMETYPE });
}

/** Pack pre-built chapters into an EPUB blob (used in unit tests). */
export async function packEpubFromChapters(
  metadata: EpubMetadata,
  chapters: EpubChapter[],
  options: { devicePreset?: EpubDevicePreset; coverImage?: Uint8Array } = {},
): Promise<Blob> {
  const preset = options.devicePreset ?? EPUB_DEVICE_PRESET.GENERIC;
  const outline: EpubOutlineEntry[] = chapters.map((chapter) => ({
    title: chapter.title,
    chapterId: chapter.id,
  }));

  const zip = new JSZip();
  zip.file("mimetype", EPUB_MIMETYPE, { compression: "STORE" });
  zip.folder("META-INF")?.file("container.xml", EPUB_CONTAINER_XML);

  const oebps = zip.folder("OEBPS");
  if (!oebps) throw new Error("Failed to create EPUB folder structure");

  oebps.file("content.opf", buildContentOpf(metadata, chapters.map((c) => c.id), Boolean(options.coverImage)));
  oebps.file("nav.xhtml", buildNavXhtml(outline));
  oebps.folder("styles")?.file("main.css", cssForDevicePreset(preset));

  const textFolder = oebps.folder("text");
  for (const chapter of chapters) {
    textFolder?.file(`${chapter.id}.xhtml`, buildChapterXhtml(chapter.title, chapter.paragraphs));
  }

  if (options.coverImage) {
    oebps.folder("images")?.file("cover.jpg", options.coverImage);
  }

  const bytes = await zip.generateAsync({ type: "uint8array", mimeType: EPUB_MIMETYPE });
  return new Blob([bytes], { type: EPUB_MIMETYPE });
}

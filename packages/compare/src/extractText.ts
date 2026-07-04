import type { ComparePdfDocument, ComparePdfPage, CompareTextContentItem } from "./pdfTypes";
import type { PositionedWord } from "./types";

function fontSizeFromTransform(transform: number[]): number {
    return Math.sqrt(transform[2] ** 2 + transform[3] ** 2);
}

function isTextItem(item: CompareTextContentItem): item is Required<Pick<CompareTextContentItem, "str" | "transform">> & CompareTextContentItem {
    return typeof item.str === "string" && item.str.trim().length > 0 && Array.isArray(item.transform);
}

function splitItemIntoWords(
    item: Required<Pick<CompareTextContentItem, "str" | "transform">> & CompareTextContentItem,
    pageIndex: number,
    startOffset: number,
): { words: PositionedWord[]; nextOffset: number } {
    const text = item.str;
    const parts = text.split(/(\s+)/).filter((p) => p.length > 0);
    const x = item.transform[4];
    const y = item.transform[5];
    const h = fontSizeFromTransform(item.transform);
    const totalChars = text.length || 1;
    const charW = (item.width ?? 0) / totalChars;

    const words: PositionedWord[] = [];
    let offset = startOffset;
    let cursorX = x;

    for (const part of parts) {
        if (/^\s+$/.test(part)) {
            cursorX += charW * part.length;
            offset += part.length;
            continue;
        }
        const w = charW * part.length;
        words.push({
            str: part,
            x: cursorX,
            y,
            w,
            h,
            pageIndex,
            charOffset: offset,
        });
        cursorX += w;
        offset += part.length;
    }

    return { words, nextOffset: offset };
}

/** Extract positioned words from one page (PDF point space). */
export async function extractPageWords(
    doc: ComparePdfDocument,
    pageIndex: number,
): Promise<PositionedWord[]> {
    const page = await doc.getPage(pageIndex + 1);
    const content = await page.getTextContent({ includeMarkedContent: false });
    const items = content.items.filter(isTextItem);

    const words: PositionedWord[] = [];
    let docOffset = 0;

    for (const item of items) {
        const { words: itemWords, nextOffset } = splitItemIntoWords(item, pageIndex, docOffset);
        words.push(...itemWords);
        docOffset = nextOffset + 1;
    }

    return words;
}

/** Extract all words in document order with global char offsets. */
export async function extractDocumentWords(doc: ComparePdfDocument): Promise<PositionedWord[]> {
    const all: PositionedWord[] = [];
    let globalBase = 0;

    for (let i = 0; i < doc.numPages; i++) {
        const pageWords = await extractPageWords(doc, i);
        const pageText = pageWords.map((w) => w.str).join(" ");

        for (const w of pageWords) {
            all.push({ ...w, charOffset: globalBase + w.charOffset });
        }

        globalBase += pageText.length > 0 ? pageText.length + 1 : 0;
    }

    return all;
}

export function wordsToPlainText(words: PositionedWord[]): string {
    if (words.length === 0) return "";
    return words.map((w) => w.str).join(" ");
}

export function buildWordStartOffsets(words: PositionedWord[]): number[] {
    return words.map((w) => w.charOffset);
}

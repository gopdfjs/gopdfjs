import { diff_match_patch } from "diff-match-patch";
import type { PdfRect, PositionedWord, TextChangeItem, TextDiffResult } from "./types";
import {
    buildWordStartOffsets,
    extractDocumentWords,
    wordsToPlainText,
} from "./extractText";
import type { ComparePdfDocument } from "./pdfTypes";

const dmp = new diff_match_patch();

function mergeLineRects(words: PositionedWord[], displayScale: number): PdfRect[] {
    if (words.length === 0) return [];

    const sorted = [...words].sort((a, b) => a.y - b.y || a.x - b.x);
    const rects: PdfRect[] = [];
    let group: PositionedWord[] = [sorted[0]];

    const flush = () => {
        if (group.length === 0) return;
        const minX = Math.min(...group.map((w) => w.x));
        const maxX = Math.max(...group.map((w) => w.x + w.w));
        const minY = Math.min(...group.map((w) => w.y));
        const maxH = Math.max(...group.map((w) => w.h));
        rects.push({
            x: minX * displayScale,
            y: minY * displayScale,
            width: (maxX - minX) * displayScale,
            height: maxH * displayScale,
            pageIndex: group[0].pageIndex,
        });
        group = [];
    };

    for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const cur = sorted[i];
        const sameLine = Math.abs(cur.y - prev.y) <= prev.h * 0.5;
        if (sameLine) {
            group.push(cur);
        } else {
            flush();
            group = [cur];
        }
    }
    flush();
    return rects;
}

function findWordsByOffsetRange(
    words: PositionedWord[],
    _offsets: number[],
    start: number,
    length: number,
): PositionedWord[] {
    if (length <= 0) return [];
    const end = start + length;
    return words.filter((word) => {
        const wordEnd = word.charOffset + word.str.length;
        return word.charOffset < end && wordEnd > start;
    });
}

/** Whole-document text diff with rectangle mapping per pane. */
export async function diffPdfText(
    docA: ComparePdfDocument,
    docB: ComparePdfDocument,
    displayScale: number,
): Promise<TextDiffResult> {
    const wordsA = await extractDocumentWords(docA);
    const wordsB = await extractDocumentWords(docB);
    const textA = wordsToPlainText(wordsA);
    const textB = wordsToPlainText(wordsB);

    const hasTextLayer = textA.length > 0 || textB.length > 0;
    if (!hasTextLayer) {
        return { rectsA: [], rectsB: [], changes: [], hasTextLayer: false };
    }

    const offsetsA = buildWordStartOffsets(wordsA);
    const offsetsB = buildWordStartOffsets(wordsB);
    const diffs = dmp.diff_main(textA, textB);
    dmp.diff_cleanupSemantic(diffs);

    const rectsA: PdfRect[] = [];
    const rectsB: PdfRect[] = [];
    const changes: TextChangeItem[] = [];
    let posA = 0;
    let posB = 0;

    for (const [op, chunk] of diffs) {
        if (op === 0) {
            posA += chunk.length;
            posB += chunk.length;
            continue;
        }
        if (op === -1) {
            const covered = findWordsByOffsetRange(wordsA, offsetsA, posA, chunk.length);
            rectsA.push(...mergeLineRects(covered, displayScale));
            const pageIndex = covered[0]?.pageIndex ?? 0;
            changes.push({ pageIndex, kind: "delete", text: chunk.trim() });
            posA += chunk.length;
            continue;
        }
        const covered = findWordsByOffsetRange(wordsB, offsetsB, posB, chunk.length);
        rectsB.push(...mergeLineRects(covered, displayScale));
        const pageIndex = covered[0]?.pageIndex ?? 0;
        changes.push({ pageIndex, kind: "insert", text: chunk.trim() });
        posB += chunk.length;
    }

    return { rectsA, rectsB, changes, hasTextLayer: true };
}

/** Map diff op offsets to words — exported for unit tests. */
export { findWordsByOffsetRange, mergeLineRects };

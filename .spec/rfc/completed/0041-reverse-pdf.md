# RFC 0041 - Reverse PDF Pages

- **Status**: Completed
- **Author**: Antigravity / Cursor
- **Date**: 2026-03-22
- **Updated**: 2026-07-03
- **Completed**: 2026-07-03

## 1. Objective

Reverse the order of all pages in a PDF (first page becomes last, etc.) in one action — client-side, single file, no reorder UI. Typical use: scanned documents uploaded upside-down in page sequence, or prep for booklet workflows.

**Non-goals for this RFC:** arbitrary reorder / delete / rotate (existing **Organize PDF** tool), partial range reverse (pages 5–10 only), reverse + merge batch, rewriting `/PageLabels` or logical page numbers in content streams.

## 2. Problem

| Approach | Issue |
|---|---|
| Manual drag in Organize | Works but heavy for “flip entire document” — many thumbnails, easy to mis-drop |
| `Array.reverse()` on `PDFPage[]` | **Wrong** — mutates in-memory handles; does not define output order for `copyPages`; confusing and fragile |
| External desktop tools | Violates client-only product constraint |

Users want a **one-click “Reverse pages”** with O(n) page copy, same as organize’s engine but fixed permutation.

## 3. Overlap with Organize PDF

Existing implementation (`packages/plugin-struct/src/organize.ts`):

```typescript
export async function organizePdf(file: File, order: number[]): Promise<Uint8Array> {
  const bytes = await readFileAsArrayBuffer(file);
  const src = await PDFDocument.load(bytes);
  const doc = await PDFDocument.create();
  const pages = await doc.copyPages(src, order);
  pages.forEach((p) => doc.addPage(p));
  return doc.save();
}
```

**Reverse is exactly:** `order = [n-1, n-2, …, 0]` where `n = src.getPageCount()`.

| Option | Pros | Cons |
|---|---|---|
| A. Web-only: call `organizePdf(file, reversedIndices)` | Zero new API | Reloads/parses file twice if helper recomputed in UI; logic lives in React |
| B. `reversePdf` wrapper calling shared `copyPagesInOrder(src, order)` | Single load, discoverable API, testable | ~15 lines new code |
| C. Organize UI only: “Reverse order” button sets thumbnail order | No new route/slug | Poor discoverability; still requires Save click; doesn’t match “single-purpose tool” catalog pattern |

**Decision (RFC):** **Option B** — add `reversePdf(file)` to `@gopdfjs/plugin-struct` that performs one load and `copyPages` with reversed indices. Implementation may inline the same loop as `organizePdf` or extract private `reorderPdfPages(src, order)` used by both — **must not** call `organizePdf` internally (double file read).

```typescript
/** Build descending page index order [n-1, …, 0]. */
export function reversePageOrder(pageCount: number): number[] {
  return Array.from({ length: pageCount }, (_, i) => pageCount - 1 - i);
}

export async function reversePdf(file: File): Promise<Uint8Array> {
  const bytes = await readFileAsArrayBuffer(file);
  const src = await PDFDocument.load(bytes);
  const order = reversePageOrder(src.getPageCount());
  const doc = await PDFDocument.create();
  const pages = await doc.copyPages(src, order);
  pages.forEach((p) => doc.addPage(p));
  return doc.save();
}
```

**Not:** `src.getPages().reverse()` — that reverses a JS array of handles without building a new document in correct order.

## 4. Package placement

| Layer | Path | Responsibility |
|---|---|---|
| Pure logic | `@gopdfjs/plugin-struct` — `reverse.ts` (or add to `organize.ts`) | `reversePageOrder`, `reversePdf` |
| Thin re-export | `apps/web/lib/tools/reverse.ts` | re-export |
| Tailwind UI | `apps/web/app/[locale]/tools/reverse/` | Standalone single-button tool + first/last preview |

**Recommendation:** New file `reverse.ts` exported from index — keeps organize.ts unchanged for bisect; reverse is one exported concern.

**Why not new package:** Trivial pdf-lib reorder; same as organize.

**Refactor rule:** Extract shared `reorderPdfPages` only if organize is refactored in the **same** commit; otherwise duplicate the loop — DRY is not an excuse for a mega-PR.

## 5. Dependencies

| Package | Role |
|---|---|
| `pdf-lib` | `copyPages`, `addPage`, `save` — processing pipeline |
| `@gopdf/browser-files` | File → bytes via `readFileAsArrayBuffer` |
| `@gopdf/page-render` (web only) | pdf.js for first/last page thumbnail preview via `@/lib/pdfWorker` + `PageThumbnail` |

Processing stays pdf-lib only; pdf.js is preview-only in the web layer.

## 6. Data model

```typescript
// No options in v1 — full document reverse only. No ReverseOptions type.
export function reversePageOrder(pageCount: number): number[];
export async function reversePdf(file: File): Promise<Uint8Array>;
```

**Validation:** `pageCount === 0` → return empty PDF (0 pages) or throw — match organize behavior (organize with `[]` yields empty doc). **Single page:** no-op order `[0]` — valid.

**Complexity:** O(n) `copyPages` + O(n) addPage — linear in page count. Memory: full file in memory twice during copy (same as organize).

## 7. Pipeline

```
PDF File
  └─ readFileAsArrayBuffer → PDFDocument.load(src)
       └─ order = reversePageOrder(src.getPageCount())
       └─ doc = PDFDocument.create()
       └─ pages = doc.copyPages(src, order)   // one batch call
       └─ pages.forEach(p => doc.addPage(p))
       └─ doc.save() → Uint8Array
```

**Preserved:** page content streams, annotations on pages (copied with page), bookmarks pointing to page indices (order changes — bookmark page numbers follow PDF page index, not printed labels).

**Not rewritten v1:** `/PageLabels` (e.g. “i, ii, iii”) — visual folio order in content is unchanged; only physical page sequence changes.

## 8. Web UI

**v1 ships standalone** `/tools/reverse` — thin page: drop, first/last pdf.js thumbnail preview, one button, download.

| Approach | UX | Catalog / SEO | Maintenance |
|---|---|---|---|
| **Standalone** `/tools/reverse` (§13) | Drop → preview → one button → download | New slug, home grid, smoke e2e | ~80 lines page.tsx |
| **Organize shortcut** (§13, same PR) | “Reverse all” → immediate download via `reversePdf` | Reuses existing organize route | One button in `organize/page.tsx` |

Rationale for standalone (required in §13):

1. **Discoverability** — “Reverse PDF” is a common search intent (iLovePDF-style catalog).
2. **Consistency** — halve, rotate, merge are single-purpose routes; reverse is same class.
3. **Organize stays complex** — drag grid for partial reorder; reverse is atomic.

### 8.1 Standalone flow (`/{locale}/tools/reverse`)

1. Drop single PDF
2. **Preview row** — after load, show **first page** and **last page** thumbnails side by side (pdf.js via existing `PageThumbnail` + `@/lib/pdfWorker`); labels “Page 1” / “Page N”; single-page PDF shows one thumbnail + `singlePageNote`
3. Single primary button **Reverse pages**
4. Download `reversed.pdf` + history

Preview is read-only confirmation before apply — not a full page grid.

### 8.2 Components

| File | Role |
|---|---|
| `page.tsx` | ToolShell, DropZone, preview row, `reversePdf`, DownloadButton |
| `apps/web/app/components/PageThumbnail.tsx` | Reuse existing component (static import) |

### 8.3 Organize shortcut (§13, same PR)

| File | Role |
|---|---|
| `organize/page.tsx` | “Reverse all” button → `reversePdf(file)` → download (bypasses thumbnail grid) |

Ships in the **same PR** as standalone `/tools/reverse`. Button appears when a PDF is loaded; calls `reversePdf` directly — no thumbnail reorder step.

## 9. Registration & i18n

| Step | Location |
|---|---|
| Slug registry | `apps/web/lib/toolSlugRegistry.json` → `"reverse": "reverse"` |
| Header | `optimize` group (alongside `organize`, `merge`, `split`) |
| Home grid | `HOME_TOOL_SLUGS` + `ArrowDownUp` icon |
| Smoke e2e | `e2e/tests/smoke.spec.ts` |

**Message keys** (`.claude/skills/i18n-sync/specs/reverse.json`):

| Key | English |
|---|---|
| `Tools.reverse` | Reverse PDF |
| `ToolsCatalog.reverse.title` | Reverse PDF |
| `ToolsCatalog.reverse.homeDesc` | Flip page order instantly |
| `ToolsCatalog.reverse.pageDesc` | Reverse all pages in a PDF — first becomes last, client-side |
| `ToolPages.reverse.previewFirst` | First page |
| `ToolPages.reverse.previewLast` | Last page |
| `ToolPages.reverse.previewCaption` | Preview before reversing |
| `ToolPages.reverse.action` | Reverse pages |
| `ToolPages.reverse.processing` | Reversing pages… |
| `ToolPages.reverse.download` | Download reversed PDF |
| `ToolPages.reverse.singlePageNote` | Single-page PDFs stay unchanged. |
| `ToolPages.reverse.errorApply` | Reverse failed. The PDF may be encrypted or unreadable. |
| `ToolPages.organize.reverseAll` | Reverse all pages |

`ToolPages.organize.reverseAll` lives in the reverse i18n spec (organize page imports it via same namespace pattern as existing organize keys — add to spec so `translate_locales.js` covers 11 locales).

RFC 0071 workflow: `translate_locales.js` → 11 locales → `pnpm check:i18n`.

## 10. Tests

**Test-first order:** write `reversePageOrder` tests, then one integration test — two tests total cover the domain logic.

| File | Coverage |
|---|---|
| `packages/plugin-struct/src/__tests__/reverse.test.ts` | (1) `reversePageOrder(5)` → `[4,3,2,1,0]`; `reversePageOrder(0)` → `[]`; `reversePageOrder(1)` → `[0]`. (2) `reversePdf` on 3-page mock — page count 3, content order verified via distinct page markers |
| `apps/web/lib/__tests__/toolSlugToMessageKey.test.ts` | `reverse` slug |
| `e2e/tests/reverse.spec.ts` | shell, preview region + button visible after file drop, zh-CN |
| `e2e/tests/smoke.spec.ts` | `/en-US/tools/reverse` |
| Organize e2e or manual | “Reverse all” button visible on organize page when PDF loaded; triggers download |

**Integration verification:** `createMockPdf(3)` with distinct page sizes or embedded text per page index; after reverse, page 0 size matches original page 2.

## 11. File tree (implementation)

```
packages/plugin-struct/src/
  reverse.ts
  __tests__/reverse.test.ts
  index.ts

apps/web/
  lib/tools/reverse.ts
  app/[locale]/tools/reverse/page.tsx
  app/[locale]/tools/organize/page.tsx   # "Reverse all" button (§13)
  lib/toolSlugRegistry.json
  app/components/Header.tsx
  app/[locale]/page.tsx

.claude/skills/i18n-sync/specs/reverse.json
e2e/tests/reverse.spec.ts
```

No optional files — organize shortcut is §13 in the same PR.

## 12. Limitations

| Case | Behavior |
|---|---|
| Partial reverse | Use Organize |
| Encrypted PDF | Fails load |
| `/PageLabels` | Not updated |
| Cross-page link destinations | Rare; may point to old indices — same as organize reorder |
| Multi-file batch | Out of scope |
| Full page grid preview | Out of scope — first/last only |

## 13. Success criteria

- [x] `reversePdf` + `reversePageOrder` in `@gopdfjs/plugin-struct`; uses `copyPages` with index array, **not** `PDFPage[]` reverse
- [x] Single-load pipeline (no double `readFileAsArrayBuffer` via organizePdf wrapper)
- [x] **Standalone** route `/{locale}/tools/reverse`, ToolShell, drop → **first/last page pdf.js thumbnail preview** → single button → download
- [x] **Organize** route: “Reverse all” button on `organize/page.tsx` → `reversePdf(file)` → download (same PR)
- [x] Slug `"reverse": "reverse"`; Header optimize group; home grid; smoke e2e
- [x] i18n 11 locales via spec + `translate_locales.js`; `pnpm check:i18n` passes
- [x] Two domain tests in `reverse.test.ts` + slug test; `@gopdfjs/plugin-struct test` green
- [x] `pnpm --filter @gopdf/web build` passes
- [x] Client-side only

## 14. Related RFCs

| RFC | Relationship |
|---|---|
| **Organize** (shipped) | General reorder; reverse is fixed permutation |
| **0071** | Registry + i18n |
| **0040** | Independent geometry tool |

## 15. Follow-up RFCs (out of scope)

| Topic | Notes |
|---|---|
| Reverse page range | e.g. reverse pages 3–7 only |
| Rewrite `/PageLabels` when reversing | Edge case for roman numerals |
| Full page grid preview | Organize tool already covers arbitrary reorder UI |

---

## 16. Persona review

### Linus Torvalds — merge bar & simplicity

**Verdict: Approve with changes.**

The code is five lines of substance. `reversePageOrder` + one `copyPages` call — fine. Extract shared `reorderPdfPages` only if you refactor organize in the **same** commit; otherwise duplicate the loop and move on. **Standalone route vs organize button:** catalog sprawl for a one-liner makes me itchy — prefer organize page “Reverse order” for merge bar. If product insists on standalone, keep it thin. **Preview thumbnails:** pdf.js load for two thumbs is ceremony on a one-liner — skip preview in v1.

### Kent Beck — YAGNI & test-first

**Verdict: Approve with changes.**

Test list: (1) `reversePageOrder`, (2) three-page integration. That’s the whole story. YAGNI: no first/last preview, no extra slug until someone searches for it. **Smallest slice:** ship `reversePdf` + organize button only — skips registry, Header, home grid, e2e slug. If standalone tool is marketing-required, still one page, one button. Write tests before `reversePdf`. Do not add `ReverseOptions` type for v1.

### Martin Fowler — architecture boundaries

**Verdict: Approve.**

`reversePdf` belongs in `@gopdfjs/plugin-struct` next to `organizePdf`; optionally same module with shared private helper — boundary is “page order mutations,” not a new package. Standalone vs organize is a **product** boundary, not technical: both call the same function. Export `reversePdf` from document; web gets thin wrapper; Organize may call it later without duplicating. If standalone route exists, it’s just another entry point — acceptable duplication at UI layer, zero duplication at domain layer. Refactor `organizePdf` + `reversePdf` to shared internal only when a third reorder variant appears (rotate pages is different).

### Final product decisions

| Decision | Persona recommendation | Final product decision |
|---|---|---|
| Standalone `/tools/reverse` | Organize shortcut preferred (Linus, Kent) | **v1 ships standalone route** — not organize-only |
| First/last page preview | Skip (Linus, Kent) | **v1 includes** pdf.js first/last thumbnails via `PageThumbnail` |
| Organize “Reverse all” shortcut | Kent smallest slice | **v1 required in same PR** — §13 item on `organize/page.tsx` |
| Domain API | `reversePdf` in `@gopdfjs/plugin-struct` (all) | **`reversePdf` + `reversePageOrder`** — single load, no `PDFPage[]` reverse |
| `ReverseOptions` type | Do not add (Kent) | **No options type in v1** |

**Consensus:** Proceed to implementation when §13 is checked. Persona concerns on catalog sprawl and preview ceremony are noted; product owner chose **both** standalone route and organize shortcut for discoverability and power-user flow. First/last preview stays on standalone route. Domain logic stays in `@gopdfjs/plugin-struct`; preview is web-only via existing pdf.js stack.

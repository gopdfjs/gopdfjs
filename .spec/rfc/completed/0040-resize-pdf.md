# RFC 0040 - Resize PDF Pages

- **Status**: Completed
- **Author**: Antigravity / Cursor
- **Date**: 2026-03-22
- **Updated**: 2026-07-03
- **Completed**: 2026-07-03

## 1. Objective

Change the **physical page size** of every page in a PDF (e.g. US Letter → A4, or custom width × height) by scaling page content onto a new MediaBox. Users pick a target paper preset or custom dimensions in millimeters, choose how content maps to the new size (fit / fill / stretch), choose uniform or per-page target scope for mixed-size documents, and download a new PDF — client-side only.

**Non-goals for this RFC:** interactive per-page crop UI (RFC 0011 / crop tool), N-up tiling (RFC 0030), batch ZIP of multiple files, annotation/hyperlink coordinate remapping (follow-up RFC), password-protected PDF unlock (existing unlock tool first), progress callbacks.

## 2. Problem

| User need | Existing tool | Gap |
|---|---|---|
| Trim margins | Crop | Changes CropBox/MediaBox clip — does **not** scale content to a new paper size |
| Tile pages | N-up | Combines multiple source pages onto one sheet — opposite of resize |
| Change orientation | Rotate | Rotates in place — does not change page dimensions |
| Letter → A4 for print | — | No tool |
| Mixed Letter + Legal scan → consistent preset | — | No per-page target scope |

Users expect “resize to A4” to mean: **new page dimensions + content scaled** (with letterboxing or center-crop), not margin trim.

## 3. Package placement

Same lib pattern as RFC 0029 / 0030 / 0071:

| Layer | Path | Responsibility |
|---|---|---|
| Pure logic | `@gopdfjs/plugin-struct` — `resize.ts` | Presets, scale math, `resizePdf` pipeline |
| Thin re-export | `apps/web/lib/tools/resize.ts` | `export * from "@gopdfjs/plugin-struct"` (resize exports) |
| Tailwind UI | `apps/web/app/[locale]/tools/resize/` | Drop zone, preset picker, scope toggle, mode toggle, apply |

**Why `@gopdfjs/plugin-struct`:** Same family as `nUpPdf`, `halvePdf`, `cropPdf` — single-file pdf-lib transforms on page geometry. No pdf.js raster, no new package.

**Why not `@gopdf/shrink` or `@gopdf/page-render`:** Resize is vector embed + drawPage, not image recompression or canvas render.

**Merge scope:** One PR — `resize.ts` + unit tests + thin web shell + **live before/after pdf.js preview** + i18n. No annotation remapping, no shared-units extraction in this merge.

## 4. Dependencies

| Package | Role |
|---|---|
| `pdf-lib` | `PDFDocument.create`, `embedPage`, `drawPage`, `addPage`, `save` |
| `@gopdf/browser-files` | (transitive via `readFile.ts`) File → bytes |

| `@gopdf/page-render` (web only) | pdf.js for live before/after preview via `@/lib/pdfWorker` |

Processing stays pdf-lib only; pdf.js is preview-only in the web layer.

## 5. Data model

All dimensions in **PDF points** internally (1 pt = 1/72 in). UI exposes presets by name and custom size in **millimeters** (import `mmToPt` from `crop.ts` — do **not** extract `@gopdf/units` for one constant).

```typescript
/** Named ISO / US paper presets. Dimensions in PDF points (width × height). */
export type PaperPresetId = "a4" | "letter" | "legal" | "tabloid" | "custom";

export type ResizeMode = "fit" | "fill" | "stretch";

/** Uniform: same target box for every page. Per-page: target derived per source page (mixed sizes). */
export type ResizeScope = "uniform" | "perPage";

export type ResizeTarget =
  | { preset: Exclude<PaperPresetId, "custom"> }
  | { preset: "custom"; widthMm: number; heightMm: number };

export type ResizePdfOptions = {
  target: ResizeTarget;
  mode: ResizeMode;
  scope: ResizeScope;
};
```

**v1 scope:**

- **`uniform` (default):** every output page uses the **same** target `(tw, th)` from preset/custom.
- **`perPage`:** for each source page, `resolveTargetSizeForPage` picks target dimensions from the same preset/custom definition, **swapping width/height when the source page is landscape** (`sw > sh`). Mixed Letter/Legal scans each get a correctly oriented target box before `computeResizeDrawRect` runs.

### 5.1 Paper presets (v1)

Constants in `resize.ts` — single source of truth:

| Preset ID | Width (pt) | Height (pt) | Notes |
|---|---|---|---|
| `a4` | 595.28 | 841.89 | ISO 210 × 297 mm |
| `letter` | 612 | 792 | US Letter 8.5 × 11 in |
| `legal` | 612 | 1008 | US Legal 8.5 × 14 in |
| `tabloid` | 792 | 1224 | US Tabloid 11 × 17 in |
| `custom` | `mmToPt(widthMm)` | `mmToPt(heightMm)` | User input; clamp 10–1000 mm per edge |

Export `PAPER_PRESETS: Record<Exclude<PaperPresetId, "custom">, { width: number; height: number; labelKey: string }>` for UI labels (i18n keys reference preset id).

**Out of scope v1:** A0–A10 full series, explicit landscape/portrait swap toggle beyond per-page auto-orientation (user picks custom W×H if needed). Follow-up RFC if product demands full ISO table.

### 5.2 Resize modes (semantics)

Given source page size `(sw, sh)` and target MediaBox `(tw, th)`:

| Mode | Scale | Draw rect | User-visible behavior |
|---|---|---|---|
| `fit` | `s = min(tw/sw, th/sh)` | Content scaled by `s`, **centered** on target page; margins empty (letterbox) | Entire page visible; may have white bars |
| `fill` | `s = max(tw/sw, th/sh)` | Content scaled by `s`, **center-cropped** to `(tw, th)` | Page fills target; edges may clip |
| `stretch` | `sx = tw/sw`, `sy = th/sh` | `drawPage` with independent width/height | Fills target exactly; aspect ratio may distort |

All three modes ship in v1 — radio group, no `ResizeStrategy` class hierarchy.

Pure functions (testable without pdf-lib):

```typescript
resolveTargetSize(target: ResizeTarget): { width: number; height: number }
resolveTargetSizeForPage(
  target: ResizeTarget,
  srcW: number,
  srcH: number,
  scope: ResizeScope,
): { width: number; height: number }
computeResizeDrawRect(mode: ResizeMode, srcW: number, srcH: number, targetW: number, targetH: number): PdfRect
```

`computeResizeDrawRect` returns `{ x, y, width, height }` for `drawPage` in PDF user space (origin bottom-left). For `fit`/`fill`, `width/height` are uniform scale; position centers the drawn content so crop happens symmetrically for `fill`.

## 6. pdf-lib limits (honest v1 scope)

`embedPage` + `drawPage` **re-draws page content as a form XObject**. pdf-lib does **not** remaps:

- Link annotations (`/Annot /Subtype /Link`)
- Form field widgets (`/AcroForm`)
- Internal document outline destinations tied to page coordinates

| Artifact | v1 behavior |
|---|---|
| Vector text & graphics | Preserved via embed (same as N-up) |
| Hyperlinks | **Lost or wrong** — not remapped to new scale/position |
| Form fields | **Lost or wrong** |
| Bookmarks / named destinations | Page order preserved; intra-page zoom targets may drift |
| Page labels (`/PageLabels`) | Not rewritten |

**§13 must not claim link/form preservation.** UI copy (`ToolPages.resize.limitationsNote`) states annotations and links may not work after resize. Follow-up RFC 0040a for annotation-aware resize if product requires it.

## 7. Pipeline

```
PDF File
  └─ readFileAsArrayBuffer → PDFDocument.load(src)
       └─ resizePdf(file, options)
            └─ out = PDFDocument.create()
            └─ for each srcPage[i]:
                 ├─ (sw, sh) = srcPage.getSize()
                 ├─ (tw, th) = resolveTargetSizeForPage(target, sw, sh, scope)
                 ├─ destPage = out.addPage([tw, th])
                 ├─ draw = computeResizeDrawRect(mode, sw, sh, tw, th)
                 ├─ embedded = await out.embedPage(srcPage)
                 └─ destPage.drawPage(embedded, draw)
            └─ out.save() → Uint8Array
```

**Page count:** unchanged (1:1). **Mixed page sizes:** each page processed independently; `uniform` applies one target box to all pages, `perPage` orients target per source page.

### 7.1 Public API

```typescript
export const PAPER_PRESETS: ...;
export function mmToPt(mm: number): number;  // re-export from crop.ts
export function resolveTargetSize(target: ResizeTarget): { width: number; height: number };
export function resolveTargetSizeForPage(
  target: ResizeTarget,
  srcW: number,
  srcH: number,
  scope: ResizeScope,
): { width: number; height: number };
export function computeResizeDrawRect(mode: ResizeMode, srcW: number, srcH: number, targetW: number, targetH: number): PdfRect;
export async function resizePdf(file: File, options: ResizePdfOptions): Promise<Uint8Array>;
```

No `onProgress` callback in v1.

## 8. Web UI

Route: `/[locale]/tools/resize`

### 8.1 Flow

1. **Drop single PDF** → show filename + remove
2. **Target paper** — preset chips: A4, Letter, Legal, Tabloid; “Custom” reveals width/height mm inputs
3. **Scope** — Uniform (same size for all pages) | Per-page (orient target per page for mixed sizes) — radio group with one-line hint
4. **Resize mode** — Fit (letterbox) | Fill (crop center) | Stretch — radio group with one-line hint each
5. **Live preview (page 1)** — side-by-side before/after row (see §8.2); regenerates when preset, custom mm, scope, or mode change
6. **Apply** → download `resized.pdf` + history entry

No progress bar.

### 8.2 Live before/after preview (web-only)

After upload, show **page 1** original vs simulated resize side by side — same pattern as RFC 0028 grayscale preview row.

| Column | Source | Implementation |
|---|---|---|
| **Before** | Original page 1 | `PageThumbnail` with `pdfBytes` from uploaded file |
| **After** | Simulated resize of page 1 | pdf.js render via `@/lib/pdfWorker`, then canvas draw using `computeResizeDrawRect` + `resolveTargetSizeForPage` from `@/lib/tools/resize` (re-export of `@gopdfjs/plugin-struct` pure functions) |

**Helper:** `apps/web/lib/resizePreview.ts` — `renderResizePreviewPair(file, options, pageIndex = 0) → Promise<{ beforeDataUrl: string; afterDataUrl: string }>`. Renders source page to canvas, applies same scale/center math as pdf-lib pipeline, exports data URLs for `<img>` tags (matches grayscale preview UX).

**React wiring:** `useEffect` on `[file, target, mode, scope]` calls helper; show loading state while regenerating. Import `pdfjs` only from `@/lib/pdfWorker` (static import). Reuse `PageThumbnail` for the “before” column **or** use both columns as `<img>` from data URLs for consistent sizing.

**Scope note:** Preview uses page 1 source dimensions; when `scope === "perPage"`, after-column still simulates page 1 with per-page orientation rules so user sees how mixed-orientation docs behave.

### 8.3 Components

| File | Role |
|---|---|
| `page.tsx` | ToolShell, state, preview row, `resizePdf`, download |
| `apps/web/lib/resizePreview.ts` | `renderResizePreviewPair` — pdf.js + `computeResizeDrawRect` canvas sim |
| `apps/web/app/components/PageThumbnail.tsx` | Reuse for “before” column (static import) |

### 8.4 UX copy constraints

- Clarify resize **scales content**, unlike crop which **clips**
- Warn that **links and form fields may break** (§6)
- Custom mm validation: 10–1000 mm, width/height > 0
- Per-page scope hint: for scans mixing Letter/Legal or portrait/landscape pages

## 9. Registration & i18n

| Step | Location |
|---|---|
| Slug registry | `apps/web/lib/toolSlugRegistry.json` → `"resize": "resize"` |
| Header | `edit` group (with crop, halve, n-up) |
| Home grid | `HOME_TOOL_SLUGS` + `Maximize2` or `Scaling` icon (lucide) |
| Smoke e2e | `e2e/tests/smoke.spec.ts` — `/tools/resize` loads |

Workflow per RFC 0071: spec → `translate_locales.js` → 11 locales → `pnpm check:i18n`.

**Message keys** (spec `.claude/skills/i18n-sync/specs/resize.json`):

| Key | English |
|---|---|
| `Tools.resize` | Resize PDF |
| `ToolsCatalog.resize.title` | Resize PDF |
| `ToolsCatalog.resize.homeDesc` | Change page size to A4, Letter, or custom |
| `ToolsCatalog.resize.pageDesc` | Scale PDF pages to standard paper sizes — fit, fill, or stretch |
| `ToolPages.resize.presetLabel` | Target paper size |
| `ToolPages.resize.preset.a4` | A4 (210 × 297 mm) |
| `ToolPages.resize.preset.letter` | US Letter |
| `ToolPages.resize.preset.legal` | US Legal |
| `ToolPages.resize.preset.tabloid` | US Tabloid |
| `ToolPages.resize.preset.custom` | Custom size |
| `ToolPages.resize.customWidthLabel` | Width (mm) |
| `ToolPages.resize.customHeightLabel` | Height (mm) |
| `ToolPages.resize.scopeLabel` | Page scope |
| `ToolPages.resize.scope.uniform` | Same size for all pages |
| `ToolPages.resize.scope.uniformHint` | Every page uses the target paper size you pick |
| `ToolPages.resize.scope.perPage` | Per page (mixed sizes) |
| `ToolPages.resize.scope.perPageHint` | Each page gets the target size in its own orientation — for mixed Letter/Legal scans |
| `ToolPages.resize.modeLabel` | Scaling mode |
| `ToolPages.resize.mode.fit` | Fit (letterbox) |
| `ToolPages.resize.mode.fitHint` | Whole page visible; empty margins if aspect differs |
| `ToolPages.resize.mode.fill` | Fill (crop center) |
| `ToolPages.resize.mode.fillHint` | Page fills target; edges may be cropped |
| `ToolPages.resize.mode.stretch` | Stretch |
| `ToolPages.resize.mode.stretchHint` | Fills target exactly; may distort aspect ratio |
| `ToolPages.resize.limitationsNote` | Links and form fields may not work correctly after resize. |
| `ToolPages.resize.previewLabel` | Preview (page 1) |
| `ToolPages.resize.previewBefore` | Original |
| `ToolPages.resize.previewAfter` | Resized |
| `ToolPages.resize.previewLoading` | Updating preview… |
| `ToolPages.resize.processing` | Resizing pages… |
| `ToolPages.resize.action` | Resize PDF |
| `ToolPages.resize.download` | Download resized PDF |
| `ToolPages.resize.errorInvalidSize` | Enter valid width and height (10–1000 mm). |
| `ToolPages.resize.errorApply` | Resize failed. The PDF may be encrypted or unreadable. |

## 10. Tests

**Test-first order:** write `computeResizeDrawRect` table-driven tests before touching pdf-lib integration.

| File | Coverage |
|---|---|
| `packages/plugin-struct/src/__tests__/resize.test.ts` | **First:** `computeResizeDrawRect` for fit/fill/stretch (e.g. 100×200 → 300×300 known rects). **Then:** `resolveTargetSize` for presets + custom mm; `resolveTargetSizeForPage` for `uniform` vs `perPage` on landscape vs portrait source. **Finally:** `resizePdf` integration — page count unchanged; uniform A4 output; per-page mixed-size mock preserves distinct output boxes |
| `apps/web/lib/__tests__/toolSlugToMessageKey.test.ts` | `resize` slug |
| `e2e/tests/resize.spec.ts` | shell loads, preset/scope/mode controls visible, **preview row after file drop**, zh-CN route |
| `e2e/tests/smoke.spec.ts` | `/en-US/tools/resize` |

Use `createMockPdf` from `testUtils` (existing). Assert output page 0 `getSize()` within tolerance of preset points.

## 11. File tree (implementation)

```
packages/plugin-struct/src/
  resize.ts
  __tests__/resize.test.ts
  index.ts                    # export * from "./resize"

apps/web/
  lib/tools/resize.ts
  lib/resizePreview.ts          # renderResizePreviewPair (web-only pdf.js preview)
  app/[locale]/tools/resize/page.tsx
  lib/toolSlugRegistry.json   # add slug
  app/components/Header.tsx   # edit group
  app/[locale]/page.tsx       # HOME_TOOL_SLUGS

.claude/skills/i18n-sync/specs/resize.json

e2e/tests/resize.spec.ts
```

## 12. Limitations

| Case | Behavior |
|---|---|
| Hyperlinks / forms | Not remapped — see §6 |
| Encrypted PDF | Load fails → `errorApply` |
| Very large page count | Sequential embed — may block UI; acceptable v1 |
| Rotated page `/Rotate` | pdf-lib `getSize()` used; drawPage respects page rotation metadata |
| Batch multi-file ZIP | Out of scope |
| Preview page selection | Page 1 only in v1 — no page picker |

## 13. Success criteria

- [x] `resizePdf` in `@gopdfjs/plugin-struct` with presets A4, Letter, Legal, Tabloid, custom mm
- [x] Modes: **fit, fill, stretch** — `computeResizeDrawRect` tested **first** (table-driven, no strategy class hierarchy)
- [x] Scope: **uniform + perPage** — `resolveTargetSizeForPage` tested; per-page orients target per source page for mixed sizes
- [x] Pipeline: new doc, embedPage + drawPage per page, 1:1 page count
- [x] Route `/{locale}/tools/resize`, ToolShell, preset + **scope** + mode UI
- [x] **Live before/after pdf.js preview** on page 1 — side-by-side row; updates when preset/custom mm/scope/mode change; via `@/lib/pdfWorker` + `renderResizePreviewPair`
- [x] Limitations copy visible (links/forms)
- [x] Slug `"resize": "resize"` in registry; Header edit group; home grid; smoke e2e
- [x] i18n spec + `translate_locales.js` → 11 locales; `pnpm check:i18n` passes
- [x] Unit tests `resize.test.ts` + slug test; `@gopdfjs/plugin-struct test` green
- [x] `pnpm --filter @gopdf/web build` passes
- [x] Client-side only; no §13 claim for annotation remapping or link preservation
- [x] One PR: `resize.ts` + tests + thin web shell + **live preview helper** + i18n — no units extraction in this merge

## 14. Related RFCs

| RFC | Relationship |
|---|---|
| **0011** | Crop — clip margins, not scale-to-paper |
| **0030** | N-up — shares embedPage/drawPage math (`computeDrawRect` similar to fit) |
| **0029** | Halve — page geometry in `@gopdfjs/plugin-struct` |
| **0071** | Registry + i18n ship list |

## 15. Follow-up RFCs (out of scope for 0040)

| RFC | Topic |
|---|---|
| 0040a (future) | Annotation / hyperlink remapping after geometry transforms |
| 0040c (future) | Batch resize multiple PDFs → ZIP |
| 0040e (future) | Shared `scaleToRect(src, dest, mode)` helper extracted from `resize.ts` and `nup.ts` **after** resize ships — not a v1 blocker |
| 0040f (future) | Preview page picker (choose which page to preview) |

---

## 16. Persona review

### Linus Torvalds — merge bar & simplicity

**Verdict: Approve with changes.**

Good: stays in `@gopdfjs/plugin-struct` beside n-up and halve; pure functions separated from IO; §6 honestly admits embedPage kills links instead of lying in success criteria. Concern: per-page scope is the kind of knob that ships unused — default uniform and hide per-page behind advanced until proven. Do **not** extract `@gopdf/units` for one `mmToPt` — import from `crop.ts` or duplicate the constant once. One PR: `resize.ts` + tests + thin web shell. No live preview in the same merge.

### Kent Beck — YAGNI & test-first

**Verdict: Approve with changes.**

Write `computeResizeDrawRect` tests **first** — table-driven fit/fill/stretch on a 100×200 → 300×300 target is enough before touching pdf-lib. YAGNI: defer `onProgress`, defer live preview, defer full A-series presets. Smallest shippable slice would be uniform + A4/Letter + fit + stretch only — Tabloid/custom/per-page add surface area. Integration test: one mock PDF, assert output MediaBox width ≈ 595.28 for A4. Do not add a `ResizeStrategy` class hierarchy — three modes are a switch.

### Martin Fowler — architecture boundaries

**Verdict: Approve.**

Correct package: geometry + pdf-lib assembly belongs in `@gopdfjs/plugin-struct`, not a new package. Reuse `computeDrawRect` **ideas** from `nup.ts` but do not force-share unless you extract a tiny `scaleToRect(src, dest, mode)` used by both — optional refactor **after** resize ships, not a blocker. Shared `mmToPt` might later move to `packages/plugin-struct/src/units.ts` if a third consumer appears; until then, coupling to `crop.ts` is fine. Web layer stays thin re-export; Tailwind only in `apps/web`. Boundary clear: document package knows nothing of i18n or ToolShell.

### Final product decisions

| Decision | Persona recommendation | Final product decision |
|---|---|---|
| Per-page scope for mixed sizes | Defer (Linus, Kent) | **v1 includes** `uniform` + `perPage` scope toggle and `resolveTargetSizeForPage` |
| Resize modes | fit + stretch minimum (Kent) | **v1 includes fit, fill, and stretch** (all three) |
| Paper presets | A4/Letter only (Kent smallest slice) | **v1 includes** A4, Letter, Legal, Tabloid, custom mm |
| Live before/after preview | Defer (all) | **v1 includes** page-1 side-by-side pdf.js preview via `renderResizePreviewPair` |
| Link/form remapping | Honest defer (all) | **Out of scope** — §6 unchanged; RFC 0040a |
| `mmToPt` / units package | Import from `crop.ts` (Linus, Martin) | **Import from `crop.ts`** — no `@gopdf/units` extraction in v1 |
| Merge scope | One PR, no preview (Linus) | **One PR:** logic + tests + thin web shell + **live preview** + i18n |

**Consensus:** Proceed to implementation when §13 is checked. Persona concerns on per-page scope are noted; product owner chose v1 inclusion for mixed-size scans and live before/after preview for user confidence before apply. Annotation remapping and shared scale helper remain follow-up RFCs — not this merge.

# RFC 0040 - Resize PDF Pages

- **Status**: Completed (OSS library)
- **Author**: Antigravity / Cursor
- **Date**: 2026-03-22
- **Updated**: 2026-07-17
- **Completed**: 2026-07-17

## 1. Objective

Change the **physical page size** of every page in a PDF (e.g. US Letter → A4, or custom width × height) by scaling page content onto a new MediaBox. Consumers pick a target paper preset or custom dimensions in millimeters, choose how content maps to the new size (fit / fill / stretch), and choose uniform or per-page target scope for mixed-size documents.

**OSS scope:** `@gopdfjs/plugin-struct` + `@gopdfjs/engine` facade (`resizePdf`). Bytes API: `Uint8Array` in/out.

**Out of scope for this OSS RFC (product / ilovepdf):** Next.js routes, ToolShell, i18n (11 locales), live pdf.js preview UI, slug registry, Header/home grid. Those ship in the product monorepo.

**Non-goals:** interactive per-page crop UI (RFC 0011), N-up tiling (RFC 0030), batch ZIP, annotation/hyperlink coordinate remapping, password unlock, progress callbacks.

## 2. Problem

| User need | Existing tool | Gap |
|---|---|---|
| Trim margins | Crop | Changes CropBox/MediaBox clip — does **not** scale content to a new paper size |
| Tile pages | N-up | Combines multiple source pages onto one sheet — opposite of resize |
| Change orientation | Rotate | Rotates in place — does not change page dimensions |
| Letter → A4 for print | — | No tool |
| Mixed Letter + Legal scan → consistent preset | — | No per-page target scope |

## 3. Package placement

| Layer | Path | Responsibility |
|---|---|---|
| Pure logic | `@gopdfjs/plugin-struct` — `resize.ts` | Presets, scale math, `resizePdf` pipeline |
| Facade | `@gopdfjs/engine` — `createEngine()` | `gopdf.resizePdf(bytes, options)` with `ownPdfBytes` |
| Helpers | `@gopdfjs/plugin-struct` exports | `computeResizeDrawRect`, `resolveTargetSize`, `resolveTargetSizeForPage`, `PAPER_PRESETS`, `mmToPt` (from `crop.ts`) |

**Why plugin-struct:** Same family as `nUpPdf`, `halvePdf`, `cropPdf` — single-file pdf-lib transforms on page geometry.

## 4. Dependencies

| Package | Role |
|---|---|
| `pdf-lib` | `PDFDocument.create`, `embedPage`, `drawPage`, `addPage`, `save` |

## 5. Data model

All dimensions in **PDF points** internally (1 pt = 1/72 in). Custom size accepted in **millimeters** via `mmToPt` from `crop.ts`.

```typescript
export type PaperPresetId = "a4" | "letter" | "legal" | "tabloid" | "custom";
export type ResizeMode = "fit" | "fill" | "stretch";
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

### 5.1 Paper presets (v1)

| Preset ID | Width (pt) | Height (pt) |
|---|---|---|
| `a4` | 595.28 | 841.89 |
| `letter` | 612 | 792 |
| `legal` | 612 | 1008 |
| `tabloid` | 792 | 1224 |
| `custom` | `mmToPt(widthMm)` | `mmToPt(heightMm)` |

### 5.2 Resize modes

| Mode | Scale | Behavior |
|---|---|---|
| `fit` | `min(tw/sw, th/sh)` | Letterbox; entire page visible |
| `fill` | `max(tw/sw, th/sh)` | Center-crop to fill target |
| `stretch` | independent sx/sy | Fill exactly; may distort |

Pure helpers:

```typescript
resolveTargetSize(target): { width; height }
resolveTargetSizeForPage(target, srcW, srcH, scope): { width; height }
computeResizeDrawRect(mode, srcW, srcH, targetW, targetH): PdfRect
```

## 6. pdf-lib limits (honest v1)

`embedPage` + `drawPage` re-draws content as a form XObject. **Not remapped:** link annotations, form field widgets, outline destinations tied to page coordinates. §13 must not claim link/form preservation.

## 7. Pipeline

```
Uint8Array
  └─ PDFDocument.load(src)
       └─ for each srcPage:
            ├─ (tw, th) = resolveTargetSizeForPage(...)
            ├─ destPage = out.addPage([tw, th])
            ├─ draw = computeResizeDrawRect(...)
            ├─ embed + drawPage
       └─ out.save() → Uint8Array
```

Page count unchanged (1:1).

### 7.1 Public API

```typescript
// @gopdfjs/plugin-struct
export async function resizePdf(bytes: Uint8Array, options: ResizePdfOptions): Promise<Uint8Array>;

// @gopdfjs/engine Gopdf
resizePdf(bytes: Uint8Array, options: ResizePdfOptions): Promise<Uint8Array>;
```

## 8. Product UI (ilovepdf) — out of scope for OSS

Route, ToolShell, live before/after preview, i18n, slug registry — **product (ilovepdf)** only. Not part of OSS §13.

## 9. Tests

| File | Coverage |
|---|---|
| `packages/plugin-struct/src/__tests__/resize.test.ts` | `computeResizeDrawRect` fit/fill/stretch; `resolveTargetSize` / `resolveTargetSizeForPage`; `resizePdf` page count + A4 + perPage mixed sizes |

## 10. File tree (OSS)

```
packages/plugin-struct/src/
  resize.ts
  __tests__/resize.test.ts
  index.ts                    # export * from "./resize"

packages/adapter/src/gopdf.ts # Gopdf.resizePdf
packages/engine/src/createEngine.ts
```

## 11. Limitations

| Case | Behavior |
|---|---|
| Hyperlinks / forms | Not remapped — see §6 |
| Encrypted PDF | Load fails |
| Batch multi-file ZIP | Out of scope |

## 12. Success criteria (OSS)

- [x] `resizePdf` in `@gopdfjs/plugin-struct` with presets A4, Letter, Legal, Tabloid, custom mm
- [x] Modes: fit, fill, stretch — `computeResizeDrawRect` tested
- [x] Scope: uniform + perPage — `resolveTargetSizeForPage` tested
- [x] Pipeline: embedPage + drawPage, 1:1 page count; `Uint8Array` API
- [x] Wired on `@gopdfjs/engine` `Gopdf.resizePdf`
- [x] Unit tests green (`pnpm --filter @gopdfjs/plugin-struct test`)
- [x] Client-side / isomorphic; no claim for annotation remapping
- [ ] Product UI / i18n / Next route — **out of scope** (ilovepdf)

## 13. Related RFCs

| RFC | Relationship |
|---|---|
| **0011** | Crop — clip margins, not scale-to-paper |
| **0030** | N-up — shares embedPage/drawPage math |
| **0029** | Halve — page geometry in plugin-struct |
| **0041** | Reverse — independent page-order tool |

## 14. Implementation status (2026-07-17)

| Surface | Package | Runtime | State | Notes |
|---------|---------|---------|-------|-------|
| **npm** | `@gopdfjs/plugin-struct` | isomorphic | **Partial** | `resizePdf` + helpers |
| **Facade** | `@gopdfjs/engine` | isomorphic | **Partial** | `gopdf.resizePdf` |
| **Rust / WASM** | — | — | N/A (pdf-lib) | |
| **Vitest** | plugin-struct | — | **Done** | `resize.test.ts` |
| **ilovepdf** | — | — | out of repo | product UI / i18n |

**Verdict**: **PARTIAL** — OSS library shipped; product surfaces remain in ilovepdf.

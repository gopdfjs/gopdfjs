# RFC 0041 - Reverse PDF Pages

- **Status**: Completed (OSS library)
- **Author**: Antigravity / Cursor
- **Date**: 2026-03-22
- **Updated**: 2026-07-17
- **Completed**: 2026-07-17

## 1. Objective

Reverse the order of all pages in a PDF (first becomes last) in one action — single file, no reorder UI. Typical use: scanned documents uploaded upside-down in page sequence.

**OSS scope:** `@gopdfjs/plugin-struct` + `@gopdfjs/engine` facade (`reversePdf`). Bytes API: `Uint8Array` in/out.

**Out of scope for this OSS RFC (product / ilovepdf):** Next.js `/tools/reverse` route, ToolShell, first/last thumbnails, i18n, Organize “Reverse all” button, slug registry.

**Non-goals:** arbitrary reorder (Organize), partial range reverse, rewrite `/PageLabels`.

## 2. Problem

| Approach | Issue |
|---|---|
| Manual drag in Organize | Heavy for “flip entire document” |
| `Array.reverse()` on `PDFPage[]` | **Wrong** — does not define output order for `copyPages` |
| External desktop tools | Violates client-only constraint |

Reverse is exactly: `order = [n-1, n-2, …, 0]` where `n = src.getPageCount()`.

## 3. Decision

Add `reversePdf(bytes)` that performs one load and `copyPages` with reversed indices. **Must not** call `organizePdf` internally (would double-parse). May share the same loop pattern as `organizePdf`.

```typescript
export function reversePageOrder(pageCount: number): number[] {
  return Array.from({ length: pageCount }, (_, i) => pageCount - 1 - i);
}

export async function reversePdf(bytes: Uint8Array): Promise<Uint8Array> {
  const src = await PDFDocument.load(bytes);
  const order = reversePageOrder(src.getPageCount());
  const doc = await PDFDocument.create();
  const pages = await doc.copyPages(src, order);
  pages.forEach((p) => doc.addPage(p));
  return doc.save();
}
```

**Not:** `src.getPages().reverse()`.

## 4. Package placement

| Layer | Path | Responsibility |
|---|---|---|
| Pure logic | `@gopdfjs/plugin-struct` — `reverse.ts` | `reversePageOrder`, `reversePdf` |
| Facade | `@gopdfjs/engine` | `gopdf.reversePdf(bytes)` |

## 5. Dependencies

| Package | Role |
|---|---|
| `pdf-lib` | `copyPages`, `addPage`, `save` |

## 6. Data model

```typescript
// No options in v1 — full document reverse only.
export function reversePageOrder(pageCount: number): number[];
export async function reversePdf(bytes: Uint8Array): Promise<Uint8Array>;
```

**Complexity:** O(n) copyPages. Single page: no-op order `[0]`.

## 7. Pipeline

```
Uint8Array
  └─ PDFDocument.load(src)
       └─ order = reversePageOrder(pageCount)
       └─ copyPages(src, order) → addPage → save
```

## 8. Product UI (ilovepdf) — out of scope for OSS

Standalone `/tools/reverse`, Organize shortcut, pdf.js first/last preview, i18n — **product (ilovepdf)** only.

## 9. Tests

| File | Coverage |
|---|---|
| `packages/plugin-struct/src/__tests__/reverse.test.ts` | `reversePageOrder(5/0/1)`; `reversePdf` on 3-page mock with distinct sizes |

## 10. File tree (OSS)

```
packages/plugin-struct/src/
  reverse.ts
  __tests__/reverse.test.ts
  index.ts

packages/adapter/src/gopdf.ts
packages/engine/src/createEngine.ts
```

## 11. Limitations

| Case | Behavior |
|---|---|
| Partial reverse | Use Organize |
| Encrypted PDF | Fails load |
| `/PageLabels` | Not updated |

## 12. Success criteria (OSS)

- [x] `reversePdf` + `reversePageOrder` in `@gopdfjs/plugin-struct`; uses `copyPages` with index array, **not** `PDFPage[]` reverse
- [x] Single-load pipeline (no double parse via organizePdf wrapper)
- [x] Wired on `@gopdfjs/engine` `Gopdf.reversePdf`
- [x] Unit tests green
- [ ] Product UI / i18n / Next route — **out of scope** (ilovepdf)

## 13. Related RFCs

| RFC | Relationship |
|---|---|
| **0010** Organize | General reorder; reverse is fixed permutation |
| **0040** Resize | Independent geometry tool |

## 14. Implementation status (2026-07-17)

| Surface | Package | Runtime | State | Notes |
|---------|---------|---------|-------|-------|
| **npm** | `@gopdfjs/plugin-struct` | isomorphic | **Partial** | `reversePdf` + `reversePageOrder` |
| **Facade** | `@gopdfjs/engine` | isomorphic | **Partial** | `gopdf.reversePdf` |
| **Rust / WASM** | — | — | N/A | |
| **Vitest** | plugin-struct | — | **Done** | `reverse.test.ts` |
| **ilovepdf** | — | — | out of repo | product UI / i18n |

**Verdict**: **PARTIAL** — OSS library shipped; product surfaces remain in ilovepdf.

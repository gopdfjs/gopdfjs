---
rfc: "0023"
tier: proposed
verified: false
browser_only: true
tests:
  unit: none
  e2e_playwright: none
---

# RFC 0023 - Web to PDF

- **Status**: Proposed
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Convert live web pages or HTML strings into professionally formatted PDF documents, ideal for archiving research or articles.

## 2. Technical Specification

**Browser-only golden rule**: no server, no `puppeteer`. Render happens **in the user's own browser**. Note arbitrary remote-URL fetch is blocked by CORS from a browser, so it is **not** the primary path — pasted HTML and the current page are.

- **Core Strategy**: Client-side rendering only — pasted HTML or the current document, no headless-browser proxy.
- **Processing Logic**:
    - Input is **pasted HTML / Markdown** or the current page DOM (not an arbitrary fetched URL — CORS prevents reliable client-side fetch).
    - Sanitize HTML in-browser (strip scripts, ads, clutter).
    - Apply `print` media queries and custom CSS for PDF layout.
    - Render to PDF via `window.print()` (browser-native), or html-to-canvas + `pdf-lib`/`jsPDF` for a programmatic path.

## 3. User Experience & Interface
- **Input**: HTML/Markdown code editor (primary). Optional URL input only works for same-origin / CORS-permitted pages — surface this limit in the UI.
- **Presets**: "Article Mode" (text-focused), "Full Page" (visual-focused), and "Screenshot Mode".
- **Options**: Custom margins, header/footer inclusion, and background image toggles.

## 4. Verification & Success Criteria
- [ ] Conversion runs entirely in-browser; no server / no headless-browser proxy.
- [ ] Correct rendering of CSS styles and web fonts.
- [ ] UI clearly states arbitrary-URL fetch is limited by browser CORS.

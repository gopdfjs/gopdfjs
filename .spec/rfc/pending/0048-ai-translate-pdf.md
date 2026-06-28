---
rfc: "0048"
tier: pending
verified: false
browser_only: true
tests:
  unit: none
  e2e_playwright: none
---

# RFC 0048 - AI PDF Translator

- **Status**: Pending (browser-only in-browser model path; deferred)
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Enable users to automatically translate the text content within a PDF document while attempting to preserve the original visual layout and formatting.

## 2. Technical Specification

**Browser-only golden rule**: translation runs **in-browser** via a WASM machine-translation model (e.g. transformers.js NMT, or Bergamot/Firefox-Translations WASM). No text sent to Google Translate / DeepL or any server.

- **Core Logic**: Text Extraction + **in-browser MT model** + Formatting Reconstruction.
- **Processing Logic**:
    - Parse PDF to extract text runs and their positions/fonts.
    - Translate text runs with the **in-browser MT model** inside a Web Worker.
    - Insert the translated text back into the PDF at the same coordinates, scaling the font size if the translated string is longer/shorter.
- **Model loading**: per-language-pair models downloaded on demand and cached; surface download size + capability check.

## 3. User Experience & Interface
- **Setup**: Source and Target language selectors (limited to language pairs with an available in-browser model).
- **Preview**: Dual-pane "Source" and "Target" PDF viewer for verification.
- **First-run notice**: language-pair model download size + "runs entirely on your device".

## 4. Verification & Success Criteria
- [ ] Translation is accurate and contextually appropriate.
- [ ] Original layout remains mostly intact with minimal overlap.
- [ ] Support for complex scripts (RTL, CJK) where applicable.

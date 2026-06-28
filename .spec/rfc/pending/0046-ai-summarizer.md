---
rfc: "0046"
tier: pending
verified: false
browser_only: true
tests:
  unit: none
  e2e_playwright: none
---

# RFC 0046 - AI PDF Summarizer

- **Status**: Pending (browser-only in-browser model path; deferred)
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Leverage large language models (LLMs) to provide concise, structured summaries of long and complex PDF documents.

## 2. Technical Specification

**Browser-only golden rule**: no document text leaves the browser. Inference runs **in-browser via WASM / WebGPU** (e.g. WebLLM or transformers.js). No cloud LLM endpoint.

- **Core Logic**: Text Extraction + **in-browser LLM** (WebLLM / transformers.js WASM).
- **Processing Logic**:
    - Extract text from PDF via `pdf.js`.
    - Chunk text to stay within the local model's context window.
    - Run summarization on the in-browser model inside a Web Worker (no main-thread block).
    - Output result as Markdown format.
- **Model loading**: weights downloaded once, cached (Cache Storage / IndexedDB). First run is slow; show download progress + a WebGPU-preferred / WASM-fallback capability check.

## 3. User Experience & Interface
- **Detail Settings**: Short (Paragraph), Medium (Bullet points), or Long (Chapter-wise).
- **Format**: Markdown preview with a "Copy to Clipboard" button.
- **First-run notice**: one-time model download size + "runs entirely on your device".

## 4. Verification & Success Criteria
- [ ] Document text never leaves the browser (no network request carries PDF content).
- [ ] Summary accurately reflects the document's core message.
- [ ] Graceful message on devices without WebGPU or with insufficient memory.

---
rfc: "0047"
tier: pending
verified: false
browser_only: true
tests:
  unit: none
  e2e_playwright: none
---

# RFC 0047 - Chat with PDF

- **Status**: Pending (browser-only in-browser model path; deferred)
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Create a conversational interface allowing users to ask natural-language questions directly to their PDF document content.

## 2. Technical Specification

**Browser-only golden rule**: the whole RAG loop — embeddings, vector store, and generation — runs **in-browser**. No document text or query leaves the device.

- **Core Logic**: RAG (Retrieval-Augmented Generation), fully client-side.
- **Processing Logic**:
    - Parse PDF into text chunks.
    - Generate vector embeddings **in-browser** (transformers.js embedding model, WASM/WebGPU).
    - Store in a client-side vector store (in-memory / IndexedDB).
    - On user query: embed query locally, retrieve top-K chunks, feed to the **in-browser LLM** (WebLLM / transformers.js) for the answer.
- **Model loading**: embedding + chat models cached after first download; show progress and a WebGPU/WASM capability check.

## 3. User Experience & Interface
- **Chat Window**: Sidebar dialog for Q&A.
- **Citations**: Highlight source sentences in the original PDF after an answer.
- **First-run notice**: model download size + "runs entirely on your device".

## 4. Verification & Success Criteria
- [ ] No PDF text or query leaves the browser (no network call carries content).
- [ ] Answers are strictly based on document content.
- [ ] Ability to cite specific page numbers for every claim.

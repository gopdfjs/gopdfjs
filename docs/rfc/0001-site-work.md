# RFC 0001 - Defining Site Work for iLovePDF Clone

- **Status**: Draft
- **Date**: 2026-03-22
- **Author**: Antigravity

## Context
The current implementation provides a solid foundation with many PDF tools, all running in the browser. **Host stack**: **`pdf-lib`** and **`pdfjs-dist`** for structure/render；**计算密集型**能力逐步收敛到 **`@gopdfjs/pdf-wasm`**（Rust/WASM + Worker，见 RFC 0057、0058）。The implementation remains improvable in UI/UX, functional depth, and polish.

## Objectives
1.  **Premium UI/UX**: Transition from a basic template to a high-end, responsive, and visually stunning interface.
2.  **Functional Depth**: Enhance each tool with interactive previews, granular options, and better conversion logic.
3.  **Site Integrity**: Implement missing global features like navigation, history, and robust error handling.
4.  **Performance & SEO**: Optimize for fast loading, accessibility, and search engine visibility.

## Current Tool Status
All 16 tools listed in the Home page have basic implementations in `lib/tools`.
- **Merge/Split/Compress**: Functional but lack advanced options (e.g., compression levels, visual split points).
- **Edit/Sign/Watermark**: Basic implementations that could benefit from a more interactive canvas-based editor.
- **Convert**: PDF to Word is currently text-extraction only; needs better layout preservation.

## Proposed "Site Work"

### 1. UI/UX Refinement
- **Interactive Previews**: Every tool should provide a real-time preview of the PDF before processing.
- **Modular Component Library**: Refactor components to be more reusable and premium (e.g., better modals, buttons, and progress indicators).
- **Responsive Layouts**: Ensure all tools are fully accessible on mobile devices.
- **Visual Polish**: Implement subtle micro-animations, better typography, and a cohesive color palette.

### 2. Functional Enhancements
- **Advanced Merge**: Drag-and-drop reordering with thumbnail previews.
- **Visual Split**: A "scrubber" or grid view to select specific pages for extraction.
- **Enhanced Conversion**: Integrate more sophisticated PDF parsing to preserve layouts in Word conversion.
- **OCR (Optical Character Recognition)**: Add a tool for extracting text from scanned PDFs (using `tesseract.js`).

### 3. Technical Improvements
- **State Management**: Use a global state (e.g., Zustand) for handling file processing history and user preferences.
- **Web Workers**: Move all PDF processing to background workers to prevent UI freezes for large files.
- **Comprehensive Testing**: Add unit tests for `lib/tools` and integration tests for crucial user flows.
- **PWA Support**: Support offline usage for privacy-conscious users.

### 4. SEO & Performance
- **Dynamic Metadata**: SEO-optimized titles and descriptions for each tool page.
- **Asset Optimization**: Use **Vite** + React 19 in `site/` for static-friendly bundles; WASM loaded via ES module Workers（RFC 0057）。

## Next Steps
1.  **Approval**: Seek user feedback on these proposed areas.
2.  **Prioritization**: Categorize work into phases (e.g., Phase 1: Core Tool Refinement, Phase 2: Advanced Features).
3.  **Execution**: Begin incremental updates starting with the most used tools (Merge, Compress, Split).

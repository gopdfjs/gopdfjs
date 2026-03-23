# RFC 0025 - PDF to PPT

- **Status**: Proposed
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Convert PDF pages into editable PowerPoint slides (.pptx), preserving visual layouts and background elements.

## 2. Technical Specification
- **Core Library**: `pdfjs-dist` + `PptxGenJS`
- **Processing Logic**: 
    - Extract images and text groups as separate "slide objects".
    - Map PDF page dimensions to PPT slide master (16:9 or 4:3).
    - Reconstruct background layers as master images and overlay editable text boxes.

## 3. User Experience & Interface
- **Selection**: Choose specific pages for slide generation.
- **Templates**: Ability to map extracted content to specific PPT layouts.

## 4. Verification & Success Criteria
- [ ] Text remains editable within the resulting PPTX file.
- [ ] Image assets are crisp and positioned accurately.
- [ ] Slide transitions and master styles are applied correctly.

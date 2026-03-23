# RFC 0014 - Watermark PDF

- **Status**: Implemented
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Protect intellectual property by overlaying semi-transparent text or branding images across PDF pages.

## 2. Technical Specification
- **Core Library**: `pdf-lib`
- **Processing Logic**: 
    - Set the `graphicsState` for opacity.
    - Calculate placement (Center, Mosaic/Grid, or manual coordinates).
    - Draw the watermark onto the top layer of each selected page.

## 3. User Experience & Interface
- **Inputs**: Custom text string or direct file upload for logo watermarks.
- **Options**: Opacity slider (0-100%), Rotation angle, and specific page range selection.

## 4. Success Criteria
- [x] Watermark appears on every specified page.
- [x] Opacity level allows for readability of the underlying content.
- [x] Logo watermarks maintain their original aspect ratio.

# RFC 0052 - Set Viewer Preferences

- **Status**: Proposed
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Define how a PDF document should explicitly open in standard viewers (e.g., Zoom level, Sidebars visibility, Full-screen mode).

## 2. Technical Specification
- **Core Strategy**: Modify the PDF Catalog.
- **Processing Logic**: 
    - Access the `/ViewerPreferences` and `OpenAction` dictionaries.
    - Set boolean flags for `HideToolbar`, `HideMenubar`, `FitWindow`.
    - Set the `PageLayout` (SinglePage, TwoColumnRight, etc.) and Initial Zoom.

## 3. User Experience & Interface
- **Dropdowns**: Layout (Single, Continuous, Side-by-side), Initial Zoom (Actual Size, Fit Width, 100%).
- **Toggles**: Hide Reader Toolbars, Hide Reader Menubars.

## 4. Verification & Success Criteria
- [ ] Adobe Acrobat and Chrome Preview respect the defined "Initial View" settings.
- [ ] No corruption of main document content during metadata injection.
- [ ] Accessibility: Does not interfere with Screen Reader initial settings.

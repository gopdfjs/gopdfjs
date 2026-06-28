---
rfc: "0038"
tier: proposed
verified: false
browser_only: true
tests:
  unit: none
  e2e_playwright: none
---

# RFC 0038 - Markdown/LaTeX to PDF

- **Status**: Proposed
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Provide a developer-friendly tool to convert Markdown or LaTeX source files into professionally formatted PDF documents.

## 2. Technical Specification

**Browser-only golden rule**: all rendering in-browser. **No server TeX (texlive) engine.** "LaTeX" support is limited to **math via MathJax/KaTeX**, not full document-class / package compilation — full LaTeX requires a server and is out of scope. State this in product copy.

- **Core Library**: `marked` / `MathJax` (or KaTeX) + `pdf-lib`
- **Processing Logic**:
    - Parse Markdown into HTML.
    - Render math equations via MathJax/KaTeX (in-browser).
    - Export the resulting DOM to a PDF layout using a standard stylesheet (e.g., GitHub-style or Academic).
    - Image references: **local / data URI** work directly; **remote URLs** are subject to browser CORS and may fail — surface this limit.

## 3. User Experience & Interface
- **Editor**: Side-by-side Live Preview.
- **Templates**: Choice of Themes (Simple, Academic, Modern).
- **Control**: Syntax highlighting for code blocks.

## 4. Verification & Success Criteria
- [ ] Correct rendering of complex mathematical formulas.
- [ ] Table of Contents is auto-generated from Markdown headers.
- [ ] Math (MathJax/KaTeX) renders correctly; full LaTeX preamble/packages explicitly **out of scope** (no server TeX).

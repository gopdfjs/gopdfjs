/** Raster DPI factor for pdf.js fallback pages. */
export const REPAIR_RENDER_SCALE = 2;

/** Stream scan for PDF object headers. */
export const OBJ_MARKER_RE = /(\d+)\s+(\d+)\s+obj\b/g;

export const ENDOBJ_MARKER = "endobj";
export const STARTXREF_MARKER = "startxref";
export const TRAILER_MARKER = "trailer";

export const REPAIR_STRATEGY = {
  PDF_LIB_REBUILD: "pdf-lib-rebuild",
  XREF_SURGERY_REBUILD: "xref-surgery-rebuild",
  PDFJS_RASTER_REBUILD: "pdfjs-raster-rebuild",
  FAILED: "failed",
} as const;

export const WARN_PDF_LIB_FAILED = "Structure rebuild failed; trying xref surgery.";
export const WARN_XREF_SURGERY_FAILED = "Xref surgery failed; trying visual rebuild.";

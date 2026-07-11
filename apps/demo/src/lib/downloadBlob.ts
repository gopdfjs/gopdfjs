const PDF_MIME = "application/pdf" as const;

/** Trigger a browser download for PDF bytes. */
export function downloadPdfBytes(data: Uint8Array, filename: string): void {
  const copy = new Uint8Array(data);
  const blob = new Blob([copy], { type: PDF_MIME });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

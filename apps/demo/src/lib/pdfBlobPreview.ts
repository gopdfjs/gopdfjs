const PDF_MIME = "application/pdf" as const;

/** Blob URL for in-browser PDF preview (iframe). Caller must revoke when done. */
export function createPdfPreviewUrl(bytes: Uint8Array): string | null {
  if (!bytes.byteLength) {
    return null;
  }
  const blob = new Blob([new Uint8Array(bytes)], { type: PDF_MIME });
  return URL.createObjectURL(blob);
}

/** Safe revoke for preview object URLs. */
export function revokePreviewUrl(url: string | null | undefined): void {
  if (url) {
    URL.revokeObjectURL(url);
  }
}

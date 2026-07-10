/** Rectangle in PDF point space (origin bottom-left). */
export type RedactRegion = {
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type RedactPatternKey = "ssn" | "creditCard" | "email";

export type RedactPdfOptions = {
  /** Remove title, author, subject, keywords, creator, producer. */
  scrubMetadata?: boolean;
};

export type ViewportRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

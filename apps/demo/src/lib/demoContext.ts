/** User-provided inputs for a browser tool demo run. */
export type DemoImageInput = {
  bytes: Uint8Array;
  mimeType: string;
  name: string;
};

export type DemoContext = {
  pdfBytes?: Uint8Array;
  pdfBytesList?: Uint8Array[];
  images?: DemoImageInput[];
  stampBytes?: Uint8Array;
  password?: string;
  textSource?: string;
};

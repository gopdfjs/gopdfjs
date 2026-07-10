import type { GopdfRuntime } from "@gopdfjs/runtime";

/** Minimal `GopdfRuntime` stub for repair unit tests (pdf-lib rebuild path). */
export function createMockRuntime(bytes: Uint8Array): GopdfRuntime {
  const page = {
    getViewport: ({ scale }: { scale: number }) => ({
      width: 200 * scale,
      height: 200 * scale,
    }),
    render: () => ({ promise: Promise.resolve() }),
    getTextContent: async () => ({ items: [] }),
  };

  return {
    loadDocument: async () => ({
      numPages: 1,
      getPage: async () => page,
    }),
    getPdfOps: async () => ({}),
    createCanvas: async () => ({
      width: 200,
      height: 200,
      getContext2d: () => ({}) as CanvasRenderingContext2D,
      toImageBytes: async () => new Uint8Array([255]),
      dispose: async () => undefined,
    }),
  };
}

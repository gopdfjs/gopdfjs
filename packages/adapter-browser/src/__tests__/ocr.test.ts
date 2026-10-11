import { describe, expect, it, vi } from "vitest";

vi.mock("tesseract.js", () => ({
  createWorker: vi.fn(async () => ({
    recognize: vi.fn(async () => ({ data: { text: "hello" } })),
    terminate: vi.fn(async () => undefined),
  })),
}));

import { createBrowserOcrPort } from "../ocr";

describe("createBrowserOcrPort", () => {
  it("recognizes text from image bytes", async () => {
    const ocr = await createBrowserOcrPort();
    await expect(ocr.recognize(new Uint8Array([1, 2, 3]), "eng")).resolves.toBe("hello");
  });
});

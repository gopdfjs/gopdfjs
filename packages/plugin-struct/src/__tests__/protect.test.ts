import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { protectPdf } from "../protect";
import { unlockPdf } from "../unlock";
import { getRealPdf } from "./testUtils";

describe("protect and unlock", () => {
  it("should encrypt a real PDF and then unlock it", async () => {
    const pdf = await getRealPdf();
    const password = "test-password";
    
    const protectedBytes = await protectPdf(pdf, password);
    const unlockedBytes = await unlockPdf(new Uint8Array(protectedBytes), password);
    const doc = await PDFDocument.load(unlockedBytes);
    expect(doc.getPageCount()).toBe(1);
  });
});

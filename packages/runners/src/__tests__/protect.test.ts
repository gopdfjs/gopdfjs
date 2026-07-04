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
    const protectedFile = new File([new Uint8Array(protectedBytes)], "protected.pdf", { type: "application/pdf" });

    // Verify it's protected (trying to load without password should fail)
    await expect(PDFDocument.load(protectedBytes)).rejects.toThrow();

    // Unlock it
    const unlockedBytes = await unlockPdf(protectedFile, password);
    const doc = await PDFDocument.load(unlockedBytes);
    expect(doc.getPageCount()).toBe(1);
  });
});

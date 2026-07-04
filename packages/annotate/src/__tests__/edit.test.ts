import { describe, it, expect, vi } from "vitest";
import { applyEdits, type Annotation } from "../edit";
import { PDFDocument } from "pdf-lib";

// Mocking @gopdfjs/files since it might not be available in the test environment
vi.mock("@gopdfjs/files", () => ({
  readFileAsArrayBuffer: async (file: File) => {
    return new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  },
}));

describe("edit tool", () => {
    it("should apply text and shape annotations to a PDF", async () => {
        // 1. Create a dummy PDF
        const pdfDoc = await PDFDocument.create();
        pdfDoc.addPage([600, 400]);
        const pdfBytes = await pdfDoc.save();
        const file = new File([pdfBytes], "test.pdf", { type: "application/pdf" });

        // 2. Define annotations
        const annotations: Annotation[] = [
            {
                id: "1",
                type: "text",
                pageIndex: 0,
                x: 50,
                y: 350,
                text: "Hello World",
                fontSize: 20,
                color: "#ff0000",
            },
            {
                id: "2",
                type: "rect",
                pageIndex: 0,
                x: 100,
                y: 100,
                width: 200,
                height: 100,
                color: "#00ff00",
                strokeColor: "#000000",
                strokeWidth: 2,
            },
            {
                id: "3",
                type: "ellipse",
                pageIndex: 0,
                x: 350,
                y: 100,
                width: 100,
                height: 100,
                color: "#0000ff",
                strokeColor: "#000000",
                strokeWidth: 1,
            },
            {
                id: "4",
                type: "line",
                pageIndex: 0,
                x: 50,
                y: 50,
                width: 500,
                height: 0,
                color: "#ff00ff",
                strokeWidth: 5,
            }
        ];

        // 3. Apply edits
        const result = await applyEdits(file, annotations);

        // 4. Verify result
        expect(result).toBeDefined();
        expect(result.length).toBeGreaterThan(pdfBytes.length);

        // Optional: reload and check
        const editedDoc = await PDFDocument.load(result);
        expect(editedDoc.getPageCount()).toBe(1);
    });
});

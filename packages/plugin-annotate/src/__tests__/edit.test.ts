import { describe, it, expect } from "vitest";
import { applyEdits, type Annotation } from "../edit";
import { PDFDocument } from "pdf-lib";

describe("edit tool", () => {
  it("should apply text and shape annotations to a PDF", async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([600, 400]);
    const pdfBytes = await pdfDoc.save();

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
      },
    ];

    const result = await applyEdits(pdfBytes, annotations);

    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(pdfBytes.length);

    const editedDoc = await PDFDocument.load(result);
    expect(editedDoc.getPageCount()).toBe(1);
  });
});

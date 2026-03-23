"use client";

import { useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PdfViewer() {
  const [file, setFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageWidth, setPageWidth] = useState<number>(800);
  const [isDragging, setIsDragging] = useState(false);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handleFile = (f: File) => {
    if (f.type === "application/pdf") setFile(f);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-5xl mx-auto px-4 py-8">
      {/* Upload area */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`w-full border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer
          ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400 bg-gray-50"}`}
        onClick={() => document.getElementById("pdf-input")?.click()}
      >
        <input
          id="pdf-input"
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <p className="text-gray-500 text-sm">
          {file ? (
            <span className="text-gray-800 font-medium">{file.name}</span>
          ) : (
            <>
              <span className="font-medium text-blue-600">Click to upload</span> or drag &amp; drop a PDF
            </>
          )}
        </p>
      </div>

      {/* Width slider */}
      {file && (
        <div className="flex items-center gap-3 w-full">
          <span className="text-sm text-gray-500 whitespace-nowrap">Page width</span>
          <input
            type="range"
            min={400}
            max={1200}
            step={50}
            value={pageWidth}
            onChange={(e) => setPageWidth(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm text-gray-500 w-14">{pageWidth}px</span>
        </div>
      )}

      {/* PDF pages */}
      {file && (
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          className="flex flex-col items-center gap-4"
          loading={<p className="text-gray-400 text-sm">Loading PDF…</p>}
          error={<p className="text-red-500 text-sm">Failed to load PDF.</p>}
        >
          {Array.from({ length: numPages }, (_, i) => (
            <div key={i} className="shadow-lg rounded overflow-hidden">
              <Page
                pageNumber={i + 1}
                width={pageWidth}
                renderTextLayer
                renderAnnotationLayer
              />
            </div>
          ))}
        </Document>
      )}
    </div>
  );
}

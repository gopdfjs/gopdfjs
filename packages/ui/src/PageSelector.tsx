"use client";
import { useEffect, useState } from "react";
import PageThumbnail from "./PageThumbnail";

interface Props {
  pdfBytes: Uint8Array;
  selectedPages: number[];
  onTogglePage: (index: number) => void;
}

export default function PageSelector({ pdfBytes, selectedPages, onTogglePage }: Props) {
  const [numPages, setNumPages] = useState(0);

  useEffect(() => {
    (async () => {
      const { pdfjs } = await import("@/lib/pdfWorker");
      const pdf = await pdfjs.getDocument({ data: pdfBytes }).promise;
      setNumPages(pdf.numPages);
    })();
  }, [pdfBytes]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6">
      {Array.from({ length: numPages }).map((_, i) => {
        const isSelected = selectedPages.includes(i);
        return (
          <button
            key={i}
            onClick={() => onTogglePage(i)}
            className={`relative group bg-white border rounded-lg overflow-hidden transition-all text-left flex flex-col aspect-3/4
              ${isSelected ? "ring-2 ring-brand border-brand" : "hover:border-gray-400"}`}
          >
            <div className="flex-1 bg-gray-50 flex items-center justify-center overflow-hidden">
              <PageThumbnail pdfBytes={pdfBytes} pageIndex={i} width={120} />
            </div>
            <div className={`p-1.5 text-center text-[10px] font-bold ${isSelected ? "bg-brand text-white" : "bg-white text-gray-500"}`}>
              Page {i + 1}
            </div>
            {isSelected && (
              <div className="absolute top-1 right-1 w-5 h-5 bg-brand text-white rounded-full flex items-center justify-center shadow-sm">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

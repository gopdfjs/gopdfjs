"use client";
import { useEffect, useState } from "react";
import { readFileAsArrayBuffer } from "@/lib/readFile";
import PageThumbnail from "./PageThumbnail";

interface Props {
  file: File;
  onRemove: () => void;
}

export default function FileThumbnail({ file, onRemove }: Props) {
  const [bytes, setBytes] = useState<Uint8Array | null>(null);

  useEffect(() => {
    readFileAsArrayBuffer(file).then(b => setBytes(new Uint8Array(b)));
  }, [file]);

  return (
    <div className="relative group bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow aspect-3/4 flex flex-col">
      <div className="flex-1 bg-gray-50 flex items-center justify-center overflow-hidden">
        {bytes ? (
          <PageThumbnail pdfBytes={bytes} pageIndex={0} width={200} />
        ) : (
          <div className="w-full h-full animate-pulse bg-gray-200" />
        )}
      </div>
      <div className="p-2 border-t bg-white">
        <p className="text-[10px] font-medium text-gray-700 truncate">{file.name}</p>
        <p className="text-[9px] text-gray-400">{(file.size / 1024).toFixed(0)} KB</p>
      </div>
      <button 
        onClick={(e) => { e.preventDefault(); onRemove(); }}
        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-sm hover:bg-red-600"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

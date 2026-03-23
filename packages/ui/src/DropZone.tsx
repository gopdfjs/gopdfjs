"use client";
import { useCallback, useState } from "react";

interface Props {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  label?: string;
}

export default function DropZone({ onFiles, accept = "application/pdf", multiple = false, label }: Props) {
  const [dragging, setDragging] = useState(false);

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    onFiles(Array.from(list));
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }, []);

  return (
    <div
      onDrop={onDrop}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onClick={() => document.getElementById("dz-input")?.click()}
      className={`w-full border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors
        ${dragging ? "border-[#f97316] bg-[#fff7ed]" : "border-gray-300 hover:border-[#f97316] hover:bg-[#fff5f5]"}`}
    >
      <input
        id="dz-input"
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="flex flex-col items-center gap-3">
        <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-gray-500 text-sm">
          <span className="font-semibold text-[#f97316]">Click to select</span> or drag &amp; drop
        </p>
        <p className="text-gray-400 text-xs">{label ?? "PDF files only"}</p>
      </div>
    </div>
  );
}

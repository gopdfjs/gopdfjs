"use client";
import React from "react";
import { Download } from "lucide-react";

interface Props {
  data: Uint8Array | Blob;
  filename: string;
  label: string;
  className?: string;
}

export default function DownloadButton({ data, filename, label, className = "" }: Props) {
  const download = () => {
    // Cast to any to avoid buffer compatibility issues in some TS environments
    const blob = data instanceof Blob ? data : new Blob([data as any], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={download}
      className={`w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl ${className}`}
    >
      <Download className="w-5 h-5" />
      {label}
    </button>
  );
}

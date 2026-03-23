"use client";
import React from "react";
import { Link } from "@gopdfjs/i18n";
import { useTranslations } from "use-intl";

interface Props {
  title: string;
  description: string;
  children: React.ReactNode;
}

export default function ToolShell({ title, description, children }: Props) {
  const t = useTranslations("ToolShell");
  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gray-50 flex flex-col items-center">
      <div className="w-full bg-white border-b py-12 px-4 shadow-sm">
        <div className="max-w-3xl mx-auto text-center relative">
          <Link href="/" className="absolute -top-6 left-0 text-gray-400 hover:text-brand transition-colors flex items-center gap-1 text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t("backToTools")}
          </Link>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">{title}</h1>
          <p className="mt-2 text-gray-500 font-medium">{description}</p>
        </div>
      </div>
      
      <div className="w-full max-w-3xl mx-auto px-4 py-12 flex-1">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden min-h-[400px] flex flex-col p-8 md:p-12">
          {children}
        </div>
        <p className="text-center text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-8">
          {t("privacyFooter")}
        </p>
      </div>
    </div>
  );
}

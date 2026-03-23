"use client";
import { useLocale } from "use-intl";
import { useRouter, usePathname, locales, type AppLocale } from "@gopdfjs/i18n";
import { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
const localeNames: Record<string, string> = {
  "en-US": "English (US)",
  "en-GB": "English (UK)",
  "en-CA": "English (CA)",
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  "ja": "日本語",
  "ko": "한국어",
  "fr": "Français",
  "es": "Español",
  "de": "Deutsch",
  "ru": "Русский"
};
export default function LanguagePicker() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const select = (l: string) => {
    setOpen(false);
    router.replace(pathname, { locale: l as AppLocale });
  };
 
  return (
    <div ref={ref} className="relative">
      <button 
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium text-gray-600"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{localeNames[locale] || locale}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white border rounded-xl shadow-xl p-2 z-50 max-h-80 overflow-y-auto">
          {locales.map((l) => (
            <button
              key={l}
              onClick={() => select(l)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-brand-light hover:text-brand rounded-lg transition-colors group"
            >
              <span>{localeNames[l]}</span>
              {locale === l && <Check className="w-4 h-4 text-brand" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";
import { Link, useRouter } from "@gopdfjs/i18n";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";
import { useTranslations } from "use-intl";
import BuyMeCoffeeButton from "./BuyMeCoffeeButton";
import LanguagePicker from "./LanguagePicker";
import { ChevronDown, LogOut } from "lucide-react";

const toolGroups = [
  { groupKey: "convert", tools: [{ slug: "pdf-to-jpg", nameKey: "pdfToJpg" }, { slug: "jpg-to-pdf", nameKey: "jpgToPdf" }, { slug: "pdf-to-word", nameKey: "pdfToWord" }] },
  { groupKey: "optimize", tools: [{ slug: "compress", nameKey: "compress" }, { slug: "merge", nameKey: "merge" }, { slug: "split", nameKey: "split" }, { slug: "organize", nameKey: "organize" }] },
  { groupKey: "edit", tools: [{ slug: "edit", nameKey: "edit" }, { slug: "rotate", nameKey: "rotate" }, { slug: "crop", nameKey: "crop" }, { slug: "watermark", nameKey: "watermark" }, { slug: "header-footer", nameKey: "headerFooter" }, { slug: "page-numbers", nameKey: "pageNumbers" }] },
  { groupKey: "security", tools: [{ slug: "protect", nameKey: "protect" }, { slug: "unlock", nameKey: "unlock" }] },
  { groupKey: "sign", tools: [{ slug: "sign", nameKey: "sign" }] },
] as const;

export default function Header() {
  const t = useTranslations("Navigation");
  const tNav = useTranslations("NavGroups");
  const tTools = useTranslations("Tools");
  const { user, logout } = useAuth();
  const router = useRouter();
  const [toolsOpen, setToolsOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) setToolsOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <img 
            src="/logo.png" 
            alt="GoPDF Logo" 
            className="w-9 h-9 rounded-xl shadow-lg shadow-brand/20 group-hover:scale-105 transition-transform object-cover" 
          />
          <span className="font-black text-gray-900 text-lg tracking-tighter">GoPDF<span className="text-brand">.fyi</span></span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {/* Tools dropdown */}
          <div ref={toolsRef} className="relative">
            <button onClick={() => setToolsOpen((o) => !o)}
              className="flex items-center gap-1 px-4 py-2 text-sm font-bold text-gray-600 hover:text-brand hover:bg-brand-light rounded-xl transition-all">
              {t("allTools")}
              <ChevronDown className={`w-4 h-4 transition-transform ${toolsOpen ? "rotate-180" : ""}`} />
            </button>
            {toolsOpen && (
              <div className="absolute top-full left-0 mt-2 w-[600px] bg-white border border-gray-100 rounded-2xl shadow-2xl p-6 grid grid-cols-3 gap-8 animate-in fade-in zoom-in-95 duration-200"
                onClick={() => setToolsOpen(false)}>
                {toolGroups.map((g) => (
                  <div key={g.groupKey}>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{tNav(g.groupKey)}</p>
                    <ul className="space-y-2">
                      {g.tools.map((tool) => (
                        <li key={tool.slug}>
                          <Link href={`/tools/${tool.slug}`}
                            className="text-sm font-medium text-gray-600 hover:text-brand flex items-center gap-2 transition-colors">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-200 group-hover:bg-brand" />
                            {tTools(tool.nameKey)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          <LanguagePicker />

          <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" />

          {user ? (
            <div ref={userRef} className="relative">
              <button onClick={() => setUserOpen((o) => !o)}
                className="w-9 h-9 rounded-xl bg-brand text-white text-sm font-black flex items-center justify-center shadow-lg shadow-brand/20 hover:scale-105 transition-transform">
                {user.name[0].toUpperCase()}
              </button>
              {userOpen && (
                <div className="absolute right-0 top-full mt-3 w-56 bg-white border border-gray-100 rounded-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-gray-50 mb-1">
                    <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                  </div>
                  <button onClick={() => { logout(); setUserOpen(false); router.push("/"); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                    <LogOut className="w-4 h-4" />
                    {t("signout")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <BuyMeCoffeeButton />
          )}
        </div>
      </div>
    </header>
  );
}

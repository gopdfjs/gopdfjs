import { useCallback, useMemo, useState } from "react";
import { Link, Route, Routes } from "react-router-dom";
import {
  compressPdf,
  grayscalePdf,
  linearizePdf,
  type CompressionLevel,
} from "@gopdfjs/engine";
import {
  compareReadingMethods,
  COST_USD_PER_MILLION_INPUT_TOKENS,
} from "@gopdfjs/extract/tokenEstimate";
import CompressToolPage from "./CompressToolPage";
import { downloadPdfBytes } from "./downloadBlob";
import { getPdfPageCount } from "./pdfjsPageCount";

// ==========================================
// CONSTANTS (Strictly defined to avoid raw strings)
// ==========================================

// Brand Identity
const BRAND_NAME = "GoPDF";
const BRAND_SUFFIX = ".js";
const BRAND_VERSION = "v0.1.0-beta";
const BRAND_EXECUTION_MODE = "100% Client-Side Local Execution";
const BRAND_SUBTITLE = "The Open-Source Local Node & CLI PDF Toolsuite & MCP Server";

// Color Palette
const COLOR_BG = "#030712"; // Deep slate-950
const COLOR_CARD_BG = "#0f172a"; // Slate-900
const COLOR_BORDER = "#1e293b"; // Slate-800
const COLOR_TEXT_PRIMARY = "#f8fafc"; // Slate-50
const COLOR_TEXT_SECONDARY = "#94a3b8"; // Slate-400
const COLOR_ORANGE = "#f97316"; // GoPDF Orange
const COLOR_BLUE = "#06b6d4"; // Cyan accent
const COLOR_GREEN = "#10b981"; // Success green
const COLOR_RED = "#ef4444"; // Warning red
const COLOR_YELLOW = "#eab308"; // Warning yellow

// Token estimates — shared with `gopdf compare-tokens` via @gopdfjs/extract/tokenEstimate

// Installation Commands
const CMD_BREW = "brew tap gopdfjs/tap && brew install gopdf";
const CMD_CURL = "curl -fsSL https://raw.githubusercontent.com/systembugtj/gopdfjs/main/scripts/install.js | node";
const CMD_NPM = "npm install -g @gopdfjs/pdf-cli";
const CMD_MCP_INSTALL_CLAUDE = "gopdf install claude";
const CMD_MCP_INSTALL_CURSOR_PROJECT = "gopdf install cursor --project";
const CMD_MCP_CONFIG = `{
  "mcpServers": {
    "gopdf": {
      "command": "gopdf",
      "args": ["mcp"]
    }
  }
}`;

const ACCEPT_PDF = "application/pdf" as const;
const COMPRESS_LEVELS: CompressionLevel[] = ["low", "recommended", "extreme"];

// ==========================================
// SUB-COMPONENTS
// ==========================================

/** Sleek Badge Component */
interface BadgeProps {
  text: string;
  variant?: "orange" | "blue" | "green" | "gray";
}

function Badge({ text, variant = "gray" }: BadgeProps) {
  const getColors = () => {
    switch (variant) {
      case "orange":
        return {
          bg: "rgba(249, 115, 22, 0.1)",
          color: COLOR_ORANGE,
          border: `1px solid rgba(249, 115, 22, 0.2)`,
        };
      case "blue":
        return {
          bg: "rgba(6, 182, 212, 0.1)",
          color: COLOR_BLUE,
          border: `1px solid rgba(6, 182, 212, 0.2)`,
        };
      case "green":
        return {
          bg: "rgba(16, 185, 129, 0.1)",
          color: COLOR_GREEN,
          border: `1px solid rgba(16, 185, 129, 0.2)`,
        };
      default:
        return {
          bg: "rgba(148, 163, 184, 0.1)",
          color: COLOR_TEXT_SECONDARY,
          border: `1px solid rgba(148, 163, 184, 0.2)`,
        };
    }
  };

  const colors = getColors();

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 12px",
        borderRadius: "9999px",
        fontSize: "0.75rem",
        fontWeight: 600,
        backgroundColor: colors.bg,
        color: colors.color,
        border: colors.border,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
      }}
    >
      {text}
    </span>
  );
}

/** Copy Button Component */
interface CopyButtonProps {
  textToCopy: string;
}

function CopyButton({ textToCopy }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [textToCopy]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      style={{
        background: copied ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 255, 255, 0.05)",
        border: `1px solid ${copied ? COLOR_GREEN : "rgba(255, 255, 255, 0.1)"}`,
        color: copied ? COLOR_GREEN : COLOR_TEXT_SECONDARY,
        padding: "6px 12px",
        borderRadius: "6px",
        fontSize: "0.75rem",
        fontWeight: 600,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        transition: "all 0.2s ease",
        outline: "none",
      }}
    >
      {copied ? (
        <>
          <span style={{ color: COLOR_GREEN }}>✔</span> Copied!
        </>
      ) : (
        <>
          <span>📋</span> Copy
        </>
      )}
    </button>
  );
}

/** Code Block Component */
interface CodeBlockProps {
  code: string;
  language?: string;
}

function CodeBlock({ code, language = "bash" }: CodeBlockProps) {
  return (
    <div
      style={{
        position: "relative",
        backgroundColor: "#090d16",
        border: `1px solid ${COLOR_BORDER}`,
        borderRadius: "8px",
        padding: "16px",
        fontFamily: "Fira Code, JetBrains Mono, source-code-pro, Menlo, Monaco, Consolas, monospace",
        fontSize: "0.85rem",
        color: "#38bdf8",
        overflowX: "auto",
        margin: "8px 0",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          zIndex: 10,
        }}
      >
        <CopyButton textToCopy={code} />
      </div>
      <pre style={{ margin: 0, paddingRight: "70px", lineHeight: 1.5 }}>
        <code>
          {language === "json" ? (
            <span style={{ color: "#34d399" }}>{code}</span>
          ) : (
            code.split(" ").map((word, i) => {
              if (word.startsWith("gopdf") || word.startsWith("brew") || word.startsWith("curl") || word.startsWith("npm")) {
                return <span key={i} style={{ color: COLOR_ORANGE, fontWeight: "bold" }}>{word} </span>;
              }
              if (word.startsWith("-") || word.startsWith("--")) {
                return <span key={i} style={{ color: COLOR_BLUE }}>{word} </span>;
              }
              return <span key={i} style={{ color: "#f8fafc" }}>{word} </span>;
            })
          )}
        </code>
      </pre>
    </div>
  );
}

// ==========================================
// MAIN HOMEPAGE COMPONENT
// ==========================================

function HomePage() {
  const [pages, setPages] = useState<number>(50);
  const [targetPages, setTargetPages] = useState<number>(2);

  // State for Wasm Demo Tab
  const [fileName, setFileName] = useState<string | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [pdfjsPages, setPdfjsPages] = useState<number | null>(null);
  const [wasmNote, setWasmNote] = useState<string | null>(null);
  const [lastWasmOut, setLastWasmOut] = useState<Uint8Array | null>(null);

  // Terminal active tab for installation
  const [installTab, setInstallTab] = useState<"brew" | "curl" | "npm">("brew");

  const pushLog = useCallback((line: string) => {
    setLog((prev) => [...prev.slice(-40), line]);
  }, []);

  const onPickFile = useCallback(
    async (file: File | null) => {
      setPdfjsPages(null);
      setWasmNote(null);
      setLastWasmOut(null);
      setLog([]);
      if (!file) {
        setFileName(null);
        setBytes(null);
        return;
      }
      if (file.type && file.type !== ACCEPT_PDF) {
        pushLog(`Skip non-PDF type: ${file.type}`);
      }
      const buf = new Uint8Array(await file.arrayBuffer());
      setFileName(file.name);
      setBytes(buf);
      pushLog(`Loaded ${file.name} (${buf.byteLength} bytes)`);
    },
    [pushLog],
  );

  const runPdfjs = useCallback(async () => {
    if (!bytes) {
      pushLog("pdf.js: no file");
      return;
    }
    setBusy("pdf.js");
    setPdfjsPages(null);
    try {
      const n = await getPdfPageCount(bytes);
      setPdfjsPages(n);
      pushLog(`pdf.js: numPages = ${n}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      pushLog(`pdf.js error: ${msg}`);
    } finally {
      setBusy(null);
    }
  }, [bytes, pushLog]);

  const runWasm = useCallback(
    async (
      op: "compress" | "grayscale" | "linearize",
      level?: CompressionLevel,
    ) => {
      if (!bytes) {
        pushLog("wasm: no file");
        return;
      }
      setWasmNote(null);
      setBusy(`wasm:${op}`);
      const t0 = performance.now();
      try {
        let out: Uint8Array;
        if (op === "compress") {
          out = await compressPdf(bytes, level ?? "recommended", (f) => {
            const pct = Math.round(f * 100);
            if (pct === 0 || pct === 50 || pct === 100) {
              pushLog(`compress progress ${pct}%`);
            }
          });
        } else if (op === "grayscale") {
          out = await grayscalePdf(bytes);
        } else {
          out = await linearizePdf(bytes);
        }
        const ms = Math.round(performance.now() - t0);
        pushLog(
          `wasm ${op}: ${bytes.byteLength} → ${out.byteLength} bytes (${ms} ms)`,
        );
        setWasmNote(
          `Last ${op}: ${out.byteLength} bytes — use Download to save.`,
        );
        setLastWasmOut(out);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        pushLog(`wasm ${op} error: ${msg}`);
        if (
          msg.includes("Failed to fetch") ||
          msg.includes("pkg/") ||
          msg.includes("gopdf_wasm")
        ) {
          pushLog(
            "Hint: run `pnpm build:wasm` from repo root.",
          );
        }
      } finally {
        setBusy(null);
      }
    },
    [bytes, pushLog],
  );

  const downloadLast = useCallback(() => {
    if (!lastWasmOut) {
      pushLog("Download: run a wasm op first");
      return;
    }
    const base = fileName?.replace(/\.pdf$/i, "") ?? "out";
    downloadPdfBytes(lastWasmOut, `${base}-wasm.pdf`);
  }, [fileName, lastWasmOut, pushLog]);

  // ==========================================
  // CALCULATOR VARIABLES
  // ==========================================
  const tokenComparison = useMemo(
    () => compareReadingMethods({ pageCount: pages, targetPages }),
    [pages, targetPages],
  );

  const tokensA = tokenComparison.methods.multimodal.tokens;
  const costA = tokenComparison.methods.multimodal.estimatedCostUsd;
  const tokensB = tokenComparison.methods.dumpAll.tokens;
  const costB = tokenComparison.methods.dumpAll.estimatedCostUsd;
  const tokensC = tokenComparison.methods.smartMcp.tokens;
  const costC = tokenComparison.methods.smartMcp.estimatedCostUsd;
  const tokenSavingsPct = Math.round(tokenComparison.savingsVsMultimodal.smartMcpPercent);
  const costSavingsPct = tokenSavingsPct;

  // Relative widths for horizontal bar charts
  const maxWidthTokens = tokensA;
  const widthA = 100;
  const widthB = (tokensB / maxWidthTokens) * 100;
  const widthC = (tokensC / maxWidthTokens) * 100;

  return (
    <div
      style={{
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        backgroundColor: COLOR_BG,
        color: COLOR_TEXT_PRIMARY,
        minHeight: "100vh",
        lineHeight: 1.6,
        paddingBottom: "80px",
      }}
    >
      {/* Injecting CSS for Animations, Custom Slider, Hover effects */}
      <style>{`
        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 0 25px rgba(249, 115, 22, 0.15);
          }
          50% {
            box-shadow: 0 0 40px rgba(249, 115, 22, 0.3);
          }
        }
        .glow-card-orange {
          animation: pulseGlow 5s infinite;
        }
        .hover-lift {
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .hover-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.5);
        }
        .slider-custom {
          -webkit-appearance: none;
          width: 100%;
          height: 8px;
          border-radius: 4px;
          background: #1e293b;
          outline: none;
          margin: 16px 0;
        }
        .slider-custom::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: ${COLOR_ORANGE};
          cursor: pointer;
          box-shadow: 0 0 10px rgba(249, 115, 22, 0.6);
          transition: transform 0.1s ease;
        }
        .slider-custom::-webkit-slider-thumb:hover {
          transform: scale(1.25);
        }
        .text-gradient-orange {
          background: linear-gradient(135deg, ${COLOR_ORANGE} 0%, #fdba74 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .text-gradient-blue {
          background: linear-gradient(135deg, ${COLOR_BLUE} 0%, #67e8f9 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .grid-responsive-3 {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
        }
        .grid-responsive-2 {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
          gap: 32px;
        }
        /* Custom Scrollbar for debugger log */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #090d16;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      `}</style>

      {/* 1. BRAND IDENTITY & HEADER */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          backgroundColor: "rgba(3, 7, 18, 0.8)",
          borderBottom: `1px solid ${COLOR_BORDER}`,
          padding: "16px 24px",
          transition: "all 0.3s ease",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link to="/" style={{ textDecoration: "none" }}>
              <h1
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 900,
                  margin: 0,
                  color: COLOR_TEXT_PRIMARY,
                  letterSpacing: "-0.03em",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {BRAND_NAME}
                <span style={{ color: COLOR_ORANGE }}>{BRAND_SUFFIX}</span>
              </h1>
            </Link>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <Badge text={BRAND_VERSION} variant="orange" />
              <Badge text={BRAND_EXECUTION_MODE} variant="blue" />
            </div>
          </div>
          <div>
            <Link
              to="/tools/compress"
              style={{
                background: `linear-gradient(135deg, ${COLOR_ORANGE} 0%, #ea580c 100%)`,
                color: "#ffffff",
                padding: "10px 20px",
                borderRadius: "8px",
                fontWeight: 700,
                textDecoration: "none",
                fontSize: "0.9rem",
                boxShadow: "0 4px 14px 0 rgba(249, 115, 22, 0.3)",
                display: "inline-block",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 6px 20px 0 rgba(249, 115, 22, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "0 4px 14px 0 rgba(249, 115, 22, 0.3)";
              }}
            >
              Open Web Compressor
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "80px 24px 48px 24px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Ambient background glows */}
        <div
          style={{
            position: "absolute",
            top: "-10%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "600px",
            height: "300px",
            background: `radial-gradient(circle, rgba(249, 115, 22, 0.08) 0%, rgba(6, 182, 212, 0.03) 70%, transparent 100%)`,
            zIndex: -1,
            filter: "blur(50px)",
          }}
        />

        <Badge text="The Future of PDF Processing" variant="orange" />
        <h2
          style={{
            fontSize: "3.5rem",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            marginTop: "24px",
            marginBottom: "16px",
            lineHeight: 1.15,
          }}
        >
          The Local, <span className="text-gradient-orange">AI-Native PDF Engine</span> <br />
          Built for Modern Developers
        </h2>
        <p
          style={{
            fontSize: "1.25rem",
            color: COLOR_TEXT_SECONDARY,
            maxWidth: "800px",
            margin: "0 auto 40px auto",
            fontWeight: 400,
          }}
        >
          {BRAND_SUBTITLE}. Stop wasting millions of LLM tokens on heavy image uploads.
          Analyze, slice, and extract PDF data 100% locally with zero data leaks.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
          <a
            href="#install"
            style={{
              backgroundColor: COLOR_CARD_BG,
              border: `1px solid ${COLOR_BORDER}`,
              color: COLOR_TEXT_PRIMARY,
              padding: "12px 28px",
              borderRadius: "8px",
              fontWeight: 600,
              textDecoration: "none",
              fontSize: "1rem",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = COLOR_ORANGE;
              e.currentTarget.style.backgroundColor = "rgba(249, 115, 22, 0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = COLOR_BORDER;
              e.currentTarget.style.backgroundColor = COLOR_CARD_BG;
            }}
          >
            🚀 Get Started CLI
          </a>
          <a
            href="#calculator"
            style={{
              backgroundColor: "rgba(6, 182, 212, 0.1)",
              border: `1px solid rgba(6, 182, 212, 0.2)`,
              color: COLOR_BLUE,
              padding: "12px 28px",
              borderRadius: "8px",
              fontWeight: 600,
              textDecoration: "none",
              fontSize: "1rem",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(6, 182, 212, 0.15)";
              e.currentTarget.style.borderColor = COLOR_BLUE;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(6, 182, 212, 0.1)";
              e.currentTarget.style.borderColor = "rgba(6, 182, 212, 0.2)";
            }}
          >
            📊 Token Saving Calculator
          </a>
        </div>
      </section>

      {/* 2. AI TOKEN-SAVING INTERACTIVE CALCULATOR */}
      <section
        id="calculator"
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "60px 24px",
        }}
      >
        <div
          className="glow-card-orange"
          style={{
            backgroundColor: COLOR_CARD_BG,
            border: `1px solid ${COLOR_BORDER}`,
            borderRadius: "16px",
            padding: "40px",
            position: "relative",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <Badge text="Token Efficiency Engine" variant="blue" />
            <h3 style={{ fontSize: "2rem", fontWeight: 800, marginTop: "12px", marginBottom: "8px" }}>
              AI Token-Saving Calculator
            </h3>
            <p style={{ color: COLOR_TEXT_SECONDARY, fontSize: "1rem", maxWidth: "600px", margin: "0 auto" }}>
              See how GoPDF Smart MCP page-by-page selective slicing slashes your API bills compared to traditional methods.
            </p>
          </div>

          {/* Interactive Slider */}
          <div
            style={{
              backgroundColor: "#090d16",
              border: `1px solid ${COLOR_BORDER}`,
              borderRadius: "12px",
              padding: "24px",
              marginBottom: "32px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <label htmlFor="page-count-slider" style={{ fontWeight: 600, color: COLOR_TEXT_PRIMARY, cursor: "pointer" }}>Number of PDF Pages:</label>
              <span
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  color: COLOR_ORANGE,
                  backgroundColor: "rgba(249, 115, 22, 0.1)",
                  padding: "4px 16px",
                  borderRadius: "8px",
                  border: `1px solid rgba(249, 115, 22, 0.2)`,
                }}
              >
                {pages} Pages
              </span>
            </div>
            <input
              type="range"
              id="page-count-slider"
              title="Number of PDF Pages"
              min="5"
              max="500"
              value={pages}
              onChange={(e) => setPages(parseInt(e.target.value, 10))}
              className="slider-custom"
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: COLOR_TEXT_SECONDARY }}>
              <span>5 Pages</span>
              <span>100 Pages</span>
              <span>200 Pages</span>
              <span>300 Pages</span>
              <span>400 Pages</span>
              <span>500 Pages</span>
            </div>
            <label style={{ display: "block", marginTop: 20 }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: COLOR_TEXT_SECONDARY }}>
                Smart MCP target pages: {targetPages}
              </span>
              <input
                type="number"
                min={1}
                max={20}
                value={targetPages}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  if (Number.isFinite(next)) {
                    setTargetPages(Math.min(20, Math.max(1, next)));
                  }
                }}
                style={{
                  marginTop: 8,
                  width: "100%",
                  maxWidth: 120,
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: `1px solid ${COLOR_BORDER}`,
                  background: COLOR_CARD_BG,
                  color: COLOR_TEXT_PRIMARY,
                }}
              />
            </label>
            <p style={{ marginTop: 12, fontSize: "0.75rem", color: COLOR_TEXT_SECONDARY }}>
              Formulas match <code>gopdf compare-tokens</code> (${COST_USD_PER_MILLION_INPUT_TOKENS}/M input tokens).
            </p>
          </div>

          {/* Visual Comparison Chart */}
          <div
            style={{
              backgroundColor: "#090d16",
              border: `1px solid ${COLOR_BORDER}`,
              borderRadius: "12px",
              padding: "24px",
              marginBottom: "32px",
            }}
          >
            <h4 style={{ fontSize: "1rem", fontWeight: 700, marginTop: 0, marginBottom: 16, color: COLOR_TEXT_PRIMARY }}>
              Visual Token Consumption Comparison (Lower is Better)
            </h4>

            {/* Bar A */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "4px" }}>
                <span style={{ fontWeight: 600 }}>Method A: Multimodal Reading (All Pages to Images)</span>
                <span style={{ color: COLOR_RED, fontWeight: "bold" }}>{tokensA.toLocaleString()} tokens</span>
              </div>
              <div style={{ height: "12px", backgroundColor: "#1e293b", borderRadius: "6px", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${widthA}%`,
                    backgroundColor: COLOR_RED,
                    borderRadius: "6px",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>

            {/* Bar B */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "4px" }}>
                <span style={{ fontWeight: 600 }}>Method B: Dumb Context Dump (Entire Raw Text Block)</span>
                <span style={{ color: COLOR_YELLOW, fontWeight: "bold" }}>{tokensB.toLocaleString()} tokens</span>
              </div>
              <div style={{ height: "12px", backgroundColor: "#1e293b", borderRadius: "6px", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${widthB}%`,
                    backgroundColor: COLOR_YELLOW,
                    borderRadius: "6px",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>

            {/* Bar C */}
            <div style={{ marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "4px" }}>
                <span style={{ fontWeight: "bold", color: COLOR_GREEN }}>Method C: GoPDF Smart MCP (Analyze + Selective Slicing)</span>
                <span style={{ color: COLOR_GREEN, fontWeight: "bold" }}>{tokensC.toLocaleString()} tokens</span>
              </div>
              <div style={{ height: "12px", backgroundColor: "#1e293b", borderRadius: "6px", overflow: "hidden", display: "flex", alignItems: "center" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${Math.max(widthC, 1.5)}%`,
                    backgroundColor: COLOR_GREEN,
                    borderRadius: "6px",
                    transition: "width 0.3s ease",
                    boxShadow: "0 0 10px rgba(16, 185, 129, 0.8)",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Side-by-Side Method Cards */}
          <div className="grid-responsive-3">
            {/* Method A */}
            <div
              style={{
                backgroundColor: "#090d16",
                border: `1px solid ${COLOR_BORDER}`,
                borderRadius: "12px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <h5 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: COLOR_TEXT_PRIMARY }}>Method A: Multimodal</h5>
                  <span style={{ color: COLOR_RED, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase" }}>Slowest</span>
                </div>
                <p style={{ fontSize: "0.8rem", color: COLOR_TEXT_SECONDARY, margin: "0 0 16px 0" }}>
                  Converts every single page to a high-res image frame and feeds it directly into multimodal LLMs.
                </p>
              </div>
              <div style={{ borderTop: `1px solid ${COLOR_BORDER}`, paddingTop: "16px", marginTop: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "0.8rem", color: COLOR_TEXT_SECONDARY }}>Tokens:</span>
                  <span style={{ fontSize: "0.9rem", fontWeight: 700, color: COLOR_RED }}>{tokensA.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "0.8rem", color: COLOR_TEXT_SECONDARY }}>Est. Cost:</span>
                  <span style={{ fontSize: "0.9rem", fontWeight: 700, color: COLOR_TEXT_PRIMARY }}>${costA.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.8rem", color: COLOR_TEXT_SECONDARY }}>Speed:</span>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: COLOR_RED }}>Very Slow (30s+)</span>
                </div>
              </div>
            </div>

            {/* Method B */}
            <div
              style={{
                backgroundColor: "#090d16",
                border: `1px solid ${COLOR_BORDER}`,
                borderRadius: "12px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <h5 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: COLOR_TEXT_PRIMARY }}>Method B: Dumb Dump</h5>
                  <span style={{ color: COLOR_YELLOW, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase" }}>Diluted</span>
                </div>
                <p style={{ fontSize: "0.8rem", color: COLOR_TEXT_SECONDARY, margin: "0 0 16px 0" }}>
                  Dumps the entire raw text block of the document into the prompt window. Suffers from severe context dilution.
                </p>
              </div>
              <div style={{ borderTop: `1px solid ${COLOR_BORDER}`, paddingTop: "16px", marginTop: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "0.8rem", color: COLOR_TEXT_SECONDARY }}>Tokens:</span>
                  <span style={{ fontSize: "0.9rem", fontWeight: 700, color: COLOR_YELLOW }}>{tokensB.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "0.8rem", color: COLOR_TEXT_SECONDARY }}>Est. Cost:</span>
                  <span style={{ fontSize: "0.9rem", fontWeight: 700, color: COLOR_TEXT_PRIMARY }}>${costB.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.8rem", color: COLOR_TEXT_SECONDARY }}>Speed:</span>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: COLOR_YELLOW }}>Slow (15s-45s)</span>
                </div>
                <div style={{ marginTop: "8px", fontSize: "0.7rem", color: COLOR_YELLOW, fontStyle: "italic", textAlign: "center" }}>
                  ⚠️ Lost-in-the-middle risk
                </div>
              </div>
            </div>

            {/* Method C */}
            <div
              style={{
                backgroundColor: "rgba(16, 185, 129, 0.03)",
                border: `1px solid rgba(16, 185, 129, 0.2)`,
                boxShadow: "0 0 15px rgba(16, 185, 129, 0.05)",
                borderRadius: "12px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "-10px",
                  right: "12px",
                  backgroundColor: COLOR_GREEN,
                  color: "#000000",
                  fontSize: "0.65rem",
                  fontWeight: 800,
                  padding: "2px 8px",
                  borderRadius: "4px",
                  textTransform: "uppercase",
                }}
              >
                Recommended
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <h5 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: COLOR_GREEN }}>Method C: GoPDF Smart MCP</h5>
                  <span style={{ color: COLOR_GREEN, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase" }}>Ultra-Fast</span>
                </div>
                <p style={{ fontSize: "0.8rem", color: COLOR_TEXT_SECONDARY, margin: "0 0 16px 0" }}>
                  AI agent runs local `analyze` (100t) and selectively reads only targeted pages (2,400t). Optimal focus.
                </p>
              </div>
              <div style={{ borderTop: `1px solid rgba(16, 185, 129, 0.2)`, paddingTop: "16px", marginTop: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "0.8rem", color: COLOR_TEXT_SECONDARY }}>Tokens:</span>
                  <span style={{ fontSize: "0.9rem", fontWeight: 700, color: COLOR_GREEN }}>{tokensC.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "0.8rem", color: COLOR_TEXT_SECONDARY }}>Est. Cost:</span>
                  <span style={{ fontSize: "0.9rem", fontWeight: 700, color: COLOR_GREEN }}>~${costC.toFixed(3)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.8rem", color: COLOR_TEXT_SECONDARY }}>Speed:</span>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: COLOR_GREEN }}>Instant (~1.5s)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Savings Highlight */}
          <div
            style={{
              marginTop: "32px",
              backgroundColor: "rgba(16, 185, 129, 0.08)",
              border: `1px solid rgba(16, 185, 129, 0.2)`,
              borderRadius: "12px",
              padding: "20px",
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: "0.85rem", color: COLOR_TEXT_SECONDARY, display: "block", textTransform: "uppercase", fontWeight: 600 }}>Token Reduction</span>
              <span style={{ fontSize: "2.25rem", fontWeight: 900, color: COLOR_GREEN }}>{tokenSavingsPct}% Less</span>
            </div>
            <div style={{ width: "1px", height: "40px", backgroundColor: "rgba(16, 185, 129, 0.2)", display: "none" }} className="md:block" />
            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: "0.85rem", color: COLOR_TEXT_SECONDARY, display: "block", textTransform: "uppercase", fontWeight: 600 }}>API Bill Savings</span>
              <span style={{ fontSize: "2.25rem", fontWeight: 900, color: COLOR_GREEN }}>{costSavingsPct}% Saved</span>
            </div>
            <div style={{ width: "1px", height: "40px", backgroundColor: "rgba(16, 185, 129, 0.2)", display: "none" }} className="md:block" />
            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: "0.85rem", color: COLOR_TEXT_SECONDARY, display: "block", textTransform: "uppercase", fontWeight: 600 }}>Privacy Protection</span>
              <span style={{ fontSize: "1.5rem", fontWeight: 800, color: COLOR_BLUE }}>100% Local</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. "HOW AI AGENTS READ PDFS: CLI VS REGULAR WAY" COMPARISON */}
      <section
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "60px 24px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <Badge text="Architecture Paradigm" variant="orange" />
          <h3 style={{ fontSize: "2.25rem", fontWeight: 800, marginTop: "12px", marginBottom: "8px" }}>
            How AI Agents Read PDFs
          </h3>
          <p style={{ color: COLOR_TEXT_SECONDARY, fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto" }}>
            Compare the traditional, inefficient remote processing method with the modern, local-first GoPDF approach.
          </p>
        </div>

        <div className="grid-responsive-2">
          {/* The Dumb Way */}
          <div
            className="hover-lift"
            style={{
              backgroundColor: COLOR_CARD_BG,
              border: `1px solid rgba(239, 68, 68, 0.2)`,
              borderRadius: "16px",
              padding: "32px",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "24px",
                right: "24px",
                fontSize: "2rem",
                opacity: 0.2,
              }}
            >
              ❌
            </div>
            <h4 style={{ fontSize: "1.25rem", fontWeight: 800, color: COLOR_RED, marginTop: 0, marginBottom: "20px" }}>
              The Dumb Way (Traditional)
            </h4>
            <ul style={{ padding: 0, listStyle: "none", margin: 0 }}>
              <li style={{ display: "flex", gap: "12px", marginBottom: "16px", alignItems: "flex-start" }}>
                <span style={{ color: COLOR_RED, fontWeight: "bold" }}>✕</span>
                <div>
                  <strong style={{ color: COLOR_TEXT_PRIMARY, display: "block" }}>Heavy Image Frames</strong>
                  <span style={{ fontSize: "0.85rem", color: COLOR_TEXT_SECONDARY }}>
                    Converts every single page to a heavy image frame and uploads it to multimodal LLMs, wasting bandwidth and tokens.
                  </span>
                </div>
              </li>
              <li style={{ display: "flex", gap: "12px", marginBottom: "16px", alignItems: "flex-start" }}>
                <span style={{ color: COLOR_RED, fontWeight: "bold" }}>✕</span>
                <div>
                  <strong style={{ color: COLOR_TEXT_PRIMARY, display: "block" }}>Third-Party Uploads</strong>
                  <span style={{ fontSize: "0.85rem", color: COLOR_TEXT_SECONDARY }}>
                    Requires uploading proprietary, sensitive documents to third-party cloud APIs, posing severe compliance and privacy risks.
                  </span>
                </div>
              </li>
              <li style={{ display: "flex", gap: "12px", marginBottom: "16px", alignItems: "flex-start" }}>
                <span style={{ color: COLOR_RED, fontWeight: "bold" }}>✕</span>
                <div>
                  <strong style={{ color: COLOR_TEXT_PRIMARY, display: "block" }}>Astronomical API Bills</strong>
                  <span style={{ fontSize: "0.85rem", color: COLOR_TEXT_SECONDARY }}>
                    Paying $15.00/M tokens for repetitive document parsing, leading to massive, unpredictable monthly billing bills.
                  </span>
                </div>
              </li>
              <li style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <span style={{ color: COLOR_RED, fontWeight: "bold" }}>✕</span>
                <div>
                  <strong style={{ color: COLOR_TEXT_PRIMARY, display: "block" }}>Slow Parsing Times</strong>
                  <span style={{ fontSize: "0.85rem", color: COLOR_TEXT_SECONDARY }}>
                    Waiting minutes for remote servers to parse, render, and return results, breaking the seamless flow of AI agent execution.
                  </span>
                </div>
              </li>
            </ul>
          </div>

          {/* The Smart Way */}
          <div
            className="hover-lift"
            style={{
              backgroundColor: COLOR_CARD_BG,
              border: `1px solid rgba(16, 185, 129, 0.2)`,
              borderRadius: "16px",
              padding: "32px",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "24px",
                right: "24px",
                fontSize: "2rem",
                opacity: 0.2,
              }}
            >
              🚀
            </div>
            <h4 style={{ fontSize: "1.25rem", fontWeight: 800, color: COLOR_GREEN, marginTop: 0, marginBottom: "20px" }}>
              The Smart Way (GoPDF CLI & MCP)
            </h4>
            <ul style={{ padding: 0, listStyle: "none", margin: 0 }}>
              <li style={{ display: "flex", gap: "12px", marginBottom: "16px", alignItems: "flex-start" }}>
                <span style={{ color: COLOR_GREEN, fontWeight: "bold" }}>✔</span>
                <div style={{ width: "100%" }}>
                  <strong style={{ color: COLOR_TEXT_PRIMARY, display: "block" }}>1. Structural Analysis First</strong>
                  <span style={{ fontSize: "0.85rem", color: COLOR_TEXT_SECONDARY, display: "block", marginBottom: "6px" }}>
                    Fetch outline and page metrics in just 100 tokens.
                  </span>
                  <CodeBlock code="gopdf analyze ./file.pdf" />
                </div>
              </li>
              <li style={{ display: "flex", gap: "12px", marginBottom: "16px", alignItems: "flex-start" }}>
                <span style={{ color: COLOR_GREEN, fontWeight: "bold" }}>✔</span>
                <div style={{ width: "100%" }}>
                  <strong style={{ color: COLOR_TEXT_PRIMARY, display: "block" }}>2. Selective Slicing</strong>
                  <span style={{ fontSize: "0.85rem", color: COLOR_TEXT_SECONDARY, display: "block", marginBottom: "6px" }}>
                    Retrieve targeted page text on-demand in 2,000 tokens.
                  </span>
                  <CodeBlock code="gopdf pdf-to-text ./file.pdf --start 12 --end 15" />
                </div>
              </li>
              <li style={{ display: "flex", gap: "12px", marginBottom: "16px", alignItems: "flex-start" }}>
                <span style={{ color: COLOR_GREEN, fontWeight: "bold" }}>✔</span>
                <div style={{ width: "100%" }}>
                  <strong style={{ color: COLOR_TEXT_PRIMARY, display: "block" }}>3. On-Demand Visuals</strong>
                  <span style={{ fontSize: "0.85rem", color: COLOR_TEXT_SECONDARY, display: "block", marginBottom: "6px" }}>
                    Grab specific charts as single JPEGs only if explicitly requested.
                  </span>
                  <CodeBlock code="gopdf pdf-to-jpg ./file.pdf --page 14" />
                </div>
              </li>
              <li style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <span style={{ color: COLOR_GREEN, fontWeight: "bold" }}>✔</span>
                <div>
                  <strong style={{ color: COLOR_TEXT_PRIMARY, display: "block" }}>4. 100% Local & Private</strong>
                  <span style={{ fontSize: "0.85rem", color: COLOR_TEXT_SECONDARY }}>
                    Zero data uploads, completely private, fully local bindings powered by compiled Rust and `@napi-rs/canvas`.
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 4. POLISHED INSTALLATION TERMINAL CARDS */}
      <section
        id="install"
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "60px 24px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <Badge text="Developer Setup" variant="blue" />
          <h3 style={{ fontSize: "2.25rem", fontWeight: 800, marginTop: "12px", marginBottom: "8px" }}>
            Instant Local Installation
          </h3>
          <p style={{ color: COLOR_TEXT_SECONDARY, fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto" }}>
            Install the standalone `gopdf` CLI or configure the MCP server under Cursor/Claude Desktop in seconds.
          </p>
        </div>

        <div className="grid-responsive-2">
          {/* CLI Installation Card */}
          <div
            style={{
              backgroundColor: COLOR_CARD_BG,
              border: `1px solid ${COLOR_BORDER}`,
              borderRadius: "16px",
              padding: "32px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <h4 style={{ fontSize: "1.25rem", fontWeight: 800, marginTop: 0, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>💻</span> Standalone CLI Setup
            </h4>

            {/* Terminal Tabs */}
            <div
              style={{
                display: "flex",
                borderBottom: `1px solid ${COLOR_BORDER}`,
                gap: "8px",
                marginBottom: "20px",
              }}
            >
              <button
                type="button"
                onClick={() => setInstallTab("brew")}
                style={{
                  padding: "10px 16px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: installTab === "brew" ? COLOR_ORANGE : COLOR_TEXT_SECONDARY,
                  border: "none",
                  background: "none",
                  borderBottom: installTab === "brew" ? `2px solid ${COLOR_ORANGE}` : "2px solid transparent",
                  cursor: "pointer",
                  outline: "none",
                  transition: "all 0.2s ease",
                }}
              >
                Homebrew
              </button>
              <button
                type="button"
                onClick={() => setInstallTab("curl")}
                style={{
                  padding: "10px 16px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: installTab === "curl" ? COLOR_ORANGE : COLOR_TEXT_SECONDARY,
                  border: "none",
                  background: "none",
                  borderBottom: installTab === "curl" ? `2px solid ${COLOR_ORANGE}` : "2px solid transparent",
                  cursor: "pointer",
                  outline: "none",
                  transition: "all 0.2s ease",
                }}
              >
                Standalone Script
              </button>
              <button
                type="button"
                onClick={() => setInstallTab("npm")}
                style={{
                  padding: "10px 16px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: installTab === "npm" ? COLOR_ORANGE : COLOR_TEXT_SECONDARY,
                  border: "none",
                  background: "none",
                  borderBottom: installTab === "npm" ? `2px solid ${COLOR_ORANGE}` : "2px solid transparent",
                  cursor: "pointer",
                  outline: "none",
                  transition: "all 0.2s ease",
                }}
              >
                NPM Global
              </button>
            </div>

            {/* Tab Contents */}
            <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              {installTab === "brew" && (
                <div>
                  <p style={{ fontSize: "0.9rem", color: COLOR_TEXT_SECONDARY, marginTop: 0, marginBottom: "12px" }}>
                    Install the native compiled binary via Homebrew (macOS & Linux):
                  </p>
                  <CodeBlock code={CMD_BREW} />
                </div>
              )}
              {installTab === "curl" && (
                <div>
                  <p style={{ fontSize: "0.9rem", color: COLOR_TEXT_SECONDARY, marginTop: 0, marginBottom: "12px" }}>
                    Install using our standalone Node.js installer script:
                  </p>
                  <CodeBlock code={CMD_CURL} />
                </div>
              )}
              {installTab === "npm" && (
                <div>
                  <p style={{ fontSize: "0.9rem", color: COLOR_TEXT_SECONDARY, marginTop: 0, marginBottom: "12px" }}>
                    Install globally via Node Package Manager:
                  </p>
                  <CodeBlock code={CMD_NPM} />
                </div>
              )}
            </div>

            <div
              style={{
                marginTop: "24px",
                backgroundColor: "#090d16",
                border: `1px solid ${COLOR_BORDER}`,
                borderRadius: "8px",
                padding: "12px 16px",
                fontSize: "0.8rem",
                color: COLOR_TEXT_SECONDARY,
              }}
            >
              💡 <strong>Tip:</strong> After installation, verify by running <code>gopdf --help</code> in your terminal.
            </div>
          </div>

          {/* MCP Configuration Card */}
          <div
            style={{
              backgroundColor: COLOR_CARD_BG,
              border: `1px solid ${COLOR_BORDER}`,
              borderRadius: "16px",
              padding: "32px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <h4 style={{ fontSize: "1.25rem", fontWeight: 800, marginTop: 0, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>🤖</span> MCP Server Configuration
            </h4>
            <p style={{ fontSize: "0.9rem", color: COLOR_TEXT_SECONDARY, marginTop: 0, marginBottom: "16px" }}>
              Run one command to merge gopdf into your agent config, or paste the JSON block manually:
            </p>

            <div style={{ marginBottom: "16px" }}>
              <CodeBlock code={CMD_MCP_INSTALL_CLAUDE} />
              <div style={{ height: "8px" }} />
              <CodeBlock code={CMD_MCP_INSTALL_CURSOR_PROJECT} />
            </div>

            <p style={{ fontSize: "0.85rem", color: COLOR_TEXT_SECONDARY, marginTop: 0, marginBottom: "12px" }}>
              Manual config (<code>cursor.json</code> or <code>claude_desktop_config.json</code>):
            </p>

            <div style={{ flexGrow: 1 }}>
              <CodeBlock code={CMD_MCP_CONFIG} language="json" />
            </div>

            <div
              style={{
                marginTop: "16px",
                backgroundColor: "rgba(6, 182, 212, 0.05)",
                border: `1px solid rgba(6, 182, 212, 0.15)`,
                borderRadius: "8px",
                padding: "12px 16px",
                fontSize: "0.8rem",
                color: COLOR_BLUE,
              }}
            >
              ⚡ <strong>Registered Tools:</strong> <code>compress_pdf</code>, <code>grayscale_pdf</code>, <code>linearize_pdf</code>, <code>pdf_to_jpg</code>, <code>ocr_pdf</code>, <code>analyze_pdf</code>, <code>compare_pdf_tokens</code>.
            </div>
          </div>
        </div>
      </section>

      {/* 5. REFINED BROWSER-WASM SMOKE TEST SECTION */}
      <section
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "60px 24px",
        }}
      >
        <div
          style={{
            backgroundColor: COLOR_CARD_BG,
            border: `1px solid ${COLOR_BORDER}`,
            borderRadius: "16px",
            padding: "40px",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <Badge text="WASM Sandbox" variant="green" />
            <h3 style={{ fontSize: "2rem", fontWeight: 800, marginTop: "12px", marginBottom: "8px" }}>
              Local WASM Debugger Console
            </h3>
            <p style={{ color: COLOR_TEXT_SECONDARY, fontSize: "1rem", maxWidth: "600px", margin: "0 auto" }}>
              Verify browser-WASM engine compatibility in real-time. Drag & drop a PDF file to run local operations inside your browser sandbox.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "32px",
            }}
          >
            {/* Controller Panel */}
            <div
              style={{
                backgroundColor: "#090d16",
                border: `1px solid ${COLOR_BORDER}`,
                borderRadius: "12px",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h4 style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: 0, marginBottom: "16px", color: COLOR_TEXT_PRIMARY }}>
                  Debugger Controls
                </h4>

                {/* File Picker */}
                <div
                  style={{
                    border: `2px dashed ${bytes ? COLOR_GREEN : COLOR_BORDER}`,
                    backgroundColor: bytes ? "rgba(16, 185, 129, 0.02)" : "rgba(255, 255, 255, 0.01)",
                    borderRadius: "8px",
                    padding: "24px",
                    textAlign: "center",
                    cursor: "pointer",
                    position: "relative",
                    transition: "all 0.2s ease",
                    marginBottom: "24px",
                  }}
                  onMouseEnter={(e) => {
                    if (!bytes) e.currentTarget.style.borderColor = COLOR_ORANGE;
                  }}
                  onMouseLeave={(e) => {
                    if (!bytes) e.currentTarget.style.borderColor = COLOR_BORDER;
                  }}
                >
                  <input
                    type="file"
                    id="pdf-file-picker"
                    title="Select PDF File"
                    accept={ACCEPT_PDF}
                    onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      opacity: 0,
                      cursor: "pointer",
                    }}
                  />
                  <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📄</div>
                  <label htmlFor="pdf-file-picker" style={{ fontWeight: 600, display: "block", color: COLOR_TEXT_PRIMARY, cursor: "pointer" }}>
                    {fileName ? "Change PDF File" : "Choose PDF File"}
                  </label>
                  <span style={{ fontSize: "0.75rem", color: COLOR_TEXT_SECONDARY, display: "block", marginTop: "4px" }}>
                    PDF files are processed 100% locally.
                  </span>
                  {fileName && (
                    <div
                      style={{
                        marginTop: "12px",
                        color: COLOR_GREEN,
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        backgroundColor: "rgba(16, 185, 129, 0.1)",
                        padding: "4px 12px",
                        borderRadius: "4px",
                        display: "inline-block",
                        border: `1px solid rgba(16, 185, 129, 0.2)`,
                      }}
                    >
                      ✔ {fileName} ({bytes ? (bytes.byteLength / 1024).toFixed(1) : 0} KB)
                    </div>
                  )}
                </div>

                {/* PDF.js Page Count */}
                <div style={{ marginBottom: "24px" }}>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <button
                      type="button"
                      disabled={!bytes || busy !== null}
                      onClick={() => void runPdfjs()}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "6px",
                        border: `1px solid ${COLOR_BORDER}`,
                        background: bytes ? COLOR_CARD_BG : "rgba(255, 255, 255, 0.02)",
                        color: bytes ? COLOR_TEXT_PRIMARY : "rgba(255, 255, 255, 0.3)",
                        cursor: bytes ? "pointer" : "not-allowed",
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {busy === "pdf.js" ? "Running…" : "Count pages (pdf.js)"}
                    </button>
                    {pdfjsPages !== null && (
                      <span
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: 700,
                          color: COLOR_GREEN,
                          backgroundColor: "rgba(16, 185, 129, 0.1)",
                          padding: "4px 12px",
                          borderRadius: "4px",
                          border: `1px solid rgba(16, 185, 129, 0.2)`,
                        }}
                      >
                        Pages: {pdfjsPages}
                      </span>
                    )}
                  </div>
                </div>

                {/* WASM Operations */}
                <div>
                  <strong style={{ display: "block", fontSize: "0.85rem", textTransform: "uppercase", color: COLOR_TEXT_SECONDARY, marginBottom: "12px", letterSpacing: "0.05em" }}>
                    Run Local Web-WASM Operations:
                  </strong>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {COMPRESS_LEVELS.map((level) => (
                        <button
                          key={level}
                          type="button"
                          disabled={!bytes || busy !== null}
                          onClick={() => void runWasm("compress", level)}
                          style={{
                            flexGrow: 1,
                            padding: "8px 12px",
                            borderRadius: "6px",
                            background: bytes ? COLOR_ORANGE : "rgba(249, 115, 22, 0.2)",
                            color: bytes ? "#ffffff" : "rgba(255, 255, 255, 0.3)",
                            border: "none",
                            cursor: bytes ? "pointer" : "not-allowed",
                            fontWeight: 600,
                            fontSize: "0.8rem",
                            transition: "all 0.2s ease",
                          }}
                        >
                          Compress ({level})
                        </button>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        type="button"
                        disabled={!bytes || busy !== null}
                        onClick={() => void runWasm("grayscale")}
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          borderRadius: "6px",
                          background: bytes ? "#334155" : "rgba(51, 65, 85, 0.2)",
                          color: bytes ? COLOR_TEXT_PRIMARY : "rgba(255, 255, 255, 0.3)",
                          border: "none",
                          cursor: bytes ? "pointer" : "not-allowed",
                          fontWeight: 600,
                          fontSize: "0.8rem",
                          transition: "all 0.2s ease",
                        }}
                      >
                        Grayscale
                      </button>
                      <button
                        type="button"
                        disabled={!bytes || busy !== null}
                        onClick={() => void runWasm("linearize")}
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          borderRadius: "6px",
                          background: bytes ? "#334155" : "rgba(51, 65, 85, 0.2)",
                          color: bytes ? COLOR_TEXT_PRIMARY : "rgba(255, 255, 255, 0.3)",
                          border: "none",
                          cursor: bytes ? "pointer" : "not-allowed",
                          fontWeight: 600,
                          fontSize: "0.8rem",
                          transition: "all 0.2s ease",
                        }}
                      >
                        Linearize
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Download Output */}
              <div style={{ marginTop: "24px", borderTop: `1px solid ${COLOR_BORDER}`, paddingTop: "20px" }}>
                <button
                  type="button"
                  disabled={!lastWasmOut}
                  onClick={downloadLast}
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    borderRadius: "6px",
                    border: `1px solid ${lastWasmOut ? COLOR_GREEN : COLOR_BORDER}`,
                    background: lastWasmOut ? "rgba(16, 185, 129, 0.1)" : "transparent",
                    color: lastWasmOut ? COLOR_GREEN : "rgba(255, 255, 255, 0.2)",
                    cursor: lastWasmOut ? "pointer" : "not-allowed",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    transition: "all 0.2s ease",
                  }}
                >
                  📥 Download Output File
                </button>
                {wasmNote && (
                  <p style={{ marginTop: "12px", color: COLOR_GREEN, fontWeight: 600, fontSize: "0.8rem", textAlign: "center", margin: "12px 0 0 0" }}>
                    {wasmNote}
                  </p>
                )}
              </div>
            </div>

            {/* Monospace Output Log Terminal */}
            <div
              style={{
                backgroundColor: "#090d16",
                border: `1px solid ${COLOR_BORDER}`,
                borderRadius: "12px",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                height: "400px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div style={{ display: "flex", gap: "6px" }}>
                  <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: COLOR_RED }} />
                  <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: COLOR_YELLOW }} />
                  <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: COLOR_GREEN }} />
                </div>
                <span style={{ fontSize: "0.75rem", fontFamily: "monospace", color: COLOR_TEXT_SECONDARY }}>
                  gopdf_wasm_debugger.log
                </span>
              </div>

              <div
                className="custom-scrollbar"
                style={{
                  flexGrow: 1,
                  overflowY: "auto",
                  fontFamily: "Fira Code, JetBrains Mono, source-code-pro, Menlo, Monaco, Consolas, monospace",
                  fontSize: "0.8rem",
                  color: "#38bdf8",
                  lineHeight: 1.5,
                  padding: "12px",
                  backgroundColor: "rgba(0, 0, 0, 0.3)",
                  borderRadius: "6px",
                  border: "1px solid rgba(255, 255, 255, 0.02)",
                }}
              >
                {log.length ? (
                  log.map((line, idx) => {
                    let color = "#38bdf8";
                    if (line.includes("error")) color = COLOR_RED;
                    else if (line.includes("progress")) color = COLOR_ORANGE;
                    else if (line.includes("Loaded") || line.includes("numPages")) color = COLOR_GREEN;

                    return (
                      <div key={idx} style={{ color, marginBottom: "4px" }}>
                        <span style={{ color: "rgba(255, 255, 255, 0.15)", marginRight: "8px" }}>
                          {(idx + 1).toString().padStart(2, "0")}
                        </span>
                        {line}
                      </div>
                    );
                  })
                ) : (
                  <div style={{ color: "rgba(255, 255, 255, 0.2)", fontStyle: "italic" }}>
                    // Waiting for action...
                    <br />
                    // Select a PDF file to begin local WASM execution.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          borderTop: `1px solid ${COLOR_BORDER}`,
          padding: "40px 24px 0 24px",
          textAlign: "center",
          fontSize: "0.85rem",
          color: COLOR_TEXT_SECONDARY,
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <p style={{ margin: "0 0 12px 0" }}>
          GoPDF.js is a community-owned MIT project. Build, compress, diagnostic, and optimize PDFs seamlessly with zero privacy risks.
        </p>
        <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.2)" }}>
          © {new Date().getFullYear()} GoPDF.js. All rights reserved. 100% Client-Side Local Execution.
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/tools/compress" element={<CompressToolPage />} />
    </Routes>
  );
}

import { useCallback, useState } from "react";
import { Link, Route, Routes } from "react-router-dom";
import {
  compressPdf,
  grayscalePdf,
  linearizePdf,
  type CompressionLevel,
} from "@gopdfjs/engine";
import CompressToolPage from "./CompressToolPage";
import { downloadPdfBytes } from "./downloadBlob";
import { getPdfPageCount } from "./pdfjsPageCount";

const ACCEPT_PDF = "application/pdf" as const;
const COMPRESS_LEVELS: CompressionLevel[] = ["low", "recommended", "extreme"];

function HomePage() {
  const [activeTab, setActiveTab] = useState<"cli" | "mcp" | "demo">("cli");

  // State for Wasm Demo Tab
  const [fileName, setFileName] = useState<string | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [pdfjsPages, setPdfjsPages] = useState<number | null>(null);
  const [wasmNote, setWasmNote] = useState<string | null>(null);
  const [lastWasmOut, setLastWasmOut] = useState<Uint8Array | null>(null);

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

  return (
    <div
      style={{
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        maxWidth: 960,
        margin: "0 auto",
        padding: "48px 24px",
        lineHeight: 1.6,
        color: "#1f2937",
      }}
    >
      {/* Header / Brand */}
      <header style={{ marginBottom: 40, borderBottom: "1px solid #e5e7eb", paddingBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "2.25rem", fontWeight: 800, margin: 0, color: "#111827", letterSpacing: "-0.025em" }}>
              GoPDF<span style={{ color: "#f97316" }}>.js</span>
            </h1>
            <p style={{ color: "#4b5563", fontSize: "1.1rem", marginTop: 4, marginBottom: 0 }}>
              The Open-Source Local Node & CLI PDF Toolsuite
            </p>
          </div>
          <div>
            <Link
              to="/tools/compress"
              style={{
                background: "#f97316",
                color: "#ffffff",
                padding: "8px 16px",
                borderRadius: 8,
                fontWeight: 600,
                textDecoration: "none",
                fontSize: "0.95rem",
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                display: "inline-block",
              }}
            >
              Open Web Compressor
            </Link>
          </div>
        </div>
      </header>

      {/* Main Intro Grid */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 48 }}>
        <div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: 0, marginBottom: 16 }}>
            Run PDF Diagnostics & Modifications 100% Locally
          </h2>
          <p style={{ fontSize: "1rem", color: "#374151" }}>
            GoPDF.js is a modular, ultra-fast toolsuite powered by compiled Rust/WASM engines and robust Node.js environments. 
            All files are processed entirely on your machine.
          </p>
          <ul style={{ paddingLeft: 20, color: "#4b5563", marginBottom: 24 }}>
            <li style={{ marginBottom: 8 }}><strong>Zero Uploads</strong>: Your documents never leave your local device.</li>
            <li style={{ marginBottom: 8 }}><strong>AI-Native Integrations</strong>: Includes a built-in MCP server for large language model execution.</li>
            <li style={{ marginBottom: 8 }}><strong>High Performance</strong>: Native execution via `@napi-rs/canvas` and local OCR engines.</li>
          </ul>
        </div>

        <div style={{ backgroundColor: "#f3f4f6", padding: 24, borderRadius: 12, border: "1px solid #e5e7eb" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginTop: 0, marginBottom: 12 }}>
            Instant Local Installation
          </h3>
          <p style={{ fontSize: "0.9rem", color: "#4b5563", marginBottom: 16 }}>
            Choose the installation method that fits your workflow:
          </p>
          
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", color: "#4b5563" }}>Homebrew (macOS / Linux)</span>
            <pre style={{ backgroundColor: "#1e293b", color: "#38bdf8", padding: 12, borderRadius: 6, fontSize: "0.85rem", overflowX: "auto", margin: "4px 0" }}>
              brew tap gopdfjs/tap && brew install gopdf
            </pre>
          </div>

          <div>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", color: "#4b5563" }}>Standalone Node Shell</span>
            <pre style={{ backgroundColor: "#1e293b", color: "#38bdf8", padding: 12, borderRadius: 6, fontSize: "0.85rem", overflowX: "auto", margin: "4px 0" }}>
              curl -fsSL https://raw.githubusercontent.com/systembugtj/gopdfjs/main/scripts/install.js | node
            </pre>
          </div>
        </div>
      </section>

      {/* Interactive Tabs Section */}
      <section style={{ marginBottom: 48 }}>
        <div style={{ display: "flex", borderBottom: "2px solid #e5e7eb", gap: 16, marginBottom: 24 }}>
          <button
            type="button"
            onClick={() => setActiveTab("cli")}
            style={{
              padding: "10px 16px",
              fontSize: "1rem",
              fontWeight: 600,
              color: activeTab === "cli" ? "#f97316" : "#4b5563",
              border: "none",
              background: "none",
              borderBottom: activeTab === "cli" ? "3px solid #f97316" : "3px solid transparent",
              cursor: "pointer",
              outline: "none",
            }}
          >
            Standalone CLI Commands
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("mcp")}
            style={{
              padding: "10px 16px",
              fontSize: "1rem",
              fontWeight: 600,
              color: activeTab === "mcp" ? "#f97316" : "#4b5563",
              border: "none",
              background: "none",
              borderBottom: activeTab === "mcp" ? "3px solid #f97316" : "3px solid transparent",
              cursor: "pointer",
              outline: "none",
            }}
          >
            AI Model Context Protocol (MCP)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("demo")}
            style={{
              padding: "10px 16px",
              fontSize: "1rem",
              fontWeight: 600,
              color: activeTab === "demo" ? "#f97316" : "#4b5563",
              border: "none",
              background: "none",
              borderBottom: activeTab === "demo" ? "3px solid #f97316" : "3px solid transparent",
              cursor: "pointer",
              outline: "none",
            }}
          >
            Browser Wasm Smoke Test
          </button>
        </div>

        {/* Tab 1: Standalone CLI */}
        {activeTab === "cli" && (
          <div style={{ backgroundColor: "#fafafa", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24 }}>
            <h3 style={{ marginTop: 0, fontSize: "1.2rem", fontWeight: 700 }}>Power Up Your Terminal with `gopdf`</h3>
            <p style={{ color: "#4b5563", fontSize: "0.95rem" }}>
              Our dedicated CLI handles common document tasks natively, using highly-optimized bindings.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <strong style={{ display: "block", fontSize: "0.9rem", color: "#374151", marginBottom: 4 }}>Compression</strong>
                <pre style={{ backgroundColor: "#1e293b", color: "#f8fafc", padding: 12, borderRadius: 6, fontSize: "0.8rem", margin: 0 }}>
                  gopdf compress doc.pdf -o out.pdf --level extreme
                </pre>
              </div>
              <div>
                <strong style={{ display: "block", fontSize: "0.9rem", color: "#374151", marginBottom: 4 }}>Grayscale & Optimization</strong>
                <pre style={{ backgroundColor: "#1e293b", color: "#f8fafc", padding: 12, borderRadius: 6, fontSize: "0.8rem", margin: 0 }}>
                  gopdf grayscale doc.pdf && gopdf linearize doc.pdf
                </pre>
              </div>
              <div>
                <strong style={{ display: "block", fontSize: "0.9rem", color: "#374151", marginBottom: 4 }}>Render Pages to Images</strong>
                <pre style={{ backgroundColor: "#1e293b", color: "#f8fafc", padding: 12, borderRadius: 6, fontSize: "0.8rem", margin: 0 }}>
                  gopdf pdf-to-jpg doc.pdf -o ./output/page --scale 2
                </pre>
              </div>
              <div>
                <strong style={{ display: "block", fontSize: "0.9rem", color: "#374151", marginBottom: 4 }}>Native High-Accuracy OCR</strong>
                <pre style={{ backgroundColor: "#1e293b", color: "#f8fafc", padding: 12, borderRadius: 6, fontSize: "0.8rem", margin: 0 }}>
                  gopdf ocr doc.pdf -o doc-text.txt --lang eng
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: MCP Integration */}
        {activeTab === "mcp" && (
          <div style={{ backgroundColor: "#fafafa", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24 }}>
            <h3 style={{ marginTop: 0, fontSize: "1.2rem", fontWeight: 700 }}>🤖 AI Agent Native Execution with MCP</h3>
            <p style={{ color: "#4b5563", fontSize: "0.95rem" }}>
              By integrating Model Context Protocol, any compatible AI (like Cursor, Claude Desktop, or Claude Code) can natively interact with your local PDFs. 
              Instead of converting documents remotely and consuming thousands of multimodal AI tokens, the AI can call local tools to run compression, OCR, and page rendering directly.
            </p>
            <p style={{ fontWeight: 600 }}>Start the Stdio Server Transport:</p>
            <pre style={{ backgroundColor: "#1e293b", color: "#a5f3fc", padding: 12, borderRadius: 6, fontSize: "0.85rem", display: "inline-block", margin: "4px 0" }}>
              gopdf mcp
            </pre>
            <h4 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 8, marginTop: 16 }}>Available AI Tools Registered automatically:</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ borderLeft: "4px solid #f97316", paddingLeft: 12 }}>
                <strong>`compress_pdf`</strong>
                <span style={{ fontSize: "0.85rem", color: "#4b5563", display: "block" }}>Local PDF compression level mapping</span>
              </div>
              <div style={{ borderLeft: "4px solid #f97316", paddingLeft: 12 }}>
                <strong>`grayscale_pdf` & `linearize_pdf`</strong>
                <span style={{ fontSize: "0.85rem", color: "#4b5563", display: "block" }}>Fast color reduction and web-optimizations</span>
              </div>
              <div style={{ borderLeft: "4px solid #f97316", paddingLeft: 12 }}>
                <strong>`pdf_to_jpg`</strong>
                <span style={{ fontSize: "0.85rem", color: "#4b5563", display: "block" }}>Isomorphic render to local JPEG files</span>
              </div>
              <div style={{ borderLeft: "4px solid #f97316", paddingLeft: 12 }}>
                <strong>`ocr_pdf` & `analyze_pdf`</strong>
                <span style={{ fontSize: "0.85rem", color: "#4b5563", display: "block" }}>Text extraction & structure diagnostic analysis</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Smoke Test */}
        {activeTab === "demo" && (
          <div style={{ backgroundColor: "#fafafa", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24 }}>
            <h3 style={{ marginTop: 0, fontSize: "1.2rem", fontWeight: 700 }}>Live Browser-WASM API Smoke Test</h3>
            <p style={{ color: "#4b5563", fontSize: "0.95rem" }}>
              Upload a test PDF file to run local web-WASM tasks inside your current tab. This verifies browser runtime engine compatibilities.
            </p>

            <div style={{ marginTop: 20 }}>
              <label style={{ fontWeight: 600, marginRight: 12 }}>Select PDF: </label>
              <input
                type="file"
                accept={ACCEPT_PDF}
                onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
              />
              {fileName ? (
                <span style={{ marginLeft: 8, color: "#16a34a", fontWeight: 600 }}>✔ {fileName}</span>
              ) : null}
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              <button
                type="button"
                disabled={!bytes || busy !== null}
                onClick={() => void runPdfjs()}
                style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}
              >
                {busy === "pdf.js" ? "Running…" : "Count pages (pdf.js)"}
              </button>
              {pdfjsPages !== null ? (
                <span style={{ display: "flex", alignItems: "center" }}>
                  <strong>Pages: {pdfjsPages}</strong>
                </span>
              ) : null}
            </div>

            <div style={{ marginTop: 24 }}>
              <strong style={{ display: "block", marginBottom: 8 }}>Run Local Web-WASM Operations:</strong>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {COMPRESS_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    disabled={!bytes || busy !== null}
                    onClick={() => void runWasm("compress", level)}
                    style={{ padding: "8px 12px", borderRadius: 6, background: "#f97316", color: "#fff", border: "none", cursor: "pointer" }}
                  >
                    Compress ({level})
                  </button>
                ))}
                <button
                  type="button"
                  disabled={!bytes || busy !== null}
                  onClick={() => void runWasm("grayscale")}
                  style={{ padding: "8px 12px", borderRadius: 6, background: "#4b5563", color: "#fff", border: "none", cursor: "pointer" }}
                >
                  Grayscale
                </button>
                <button
                  type="button"
                  disabled={!bytes || busy !== null}
                  onClick={() => void runWasm("linearize")}
                  style={{ padding: "8px 12px", borderRadius: 6, background: "#4b5563", color: "#fff", border: "none", cursor: "pointer" }}
                >
                  Linearize
                </button>
                <button
                  type="button"
                  onClick={downloadLast}
                  style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #999", cursor: "pointer" }}
                >
                  Download Output
                </button>
              </div>
              {wasmNote ? (
                <p style={{ marginTop: 12, color: "#16a34a", fontWeight: 600 }}>{wasmNote}</p>
              ) : null}
            </div>

            <div style={{ marginTop: 24 }}>
              <strong style={{ display: "block", marginBottom: 4 }}>Log:</strong>
              <pre
                style={{
                  background: "#1e293b",
                  color: "#38bdf8",
                  padding: 16,
                  borderRadius: 8,
                  fontSize: "0.8rem",
                  maxHeight: 200,
                  overflowY: "auto",
                  margin: 0,
                }}
              >
                {log.length ? log.join("\n") : "Waiting for action..."}
              </pre>
            </div>
          </div>
        )}
      </section>

      <footer style={{ borderTop: "1px solid #e5e7eb", paddingTop: 20, textAlign: "center", fontSize: "0.85rem", color: "#6b7280" }}>
        GoPDF.js is a community-owned MIT project. Build, compress, diagnostic, and optimize PDFs seamlessly with zero privacy risks.
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

import { useCallback, useState } from "react";
import {
  compressPdf,
  grayscalePdf,
  linearizePdf,
  type CompressionLevel,
} from "@gopdfjs/pdf-wasm";
import { downloadPdfBytes } from "./downloadBlob";
import { getPdfPageCount } from "./pdfjsPageCount";

const ACCEPT_PDF = "application/pdf" as const;

const COMPRESS_LEVELS: CompressionLevel[] = ["low", "recommended", "extreme"];

export default function App() {
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
          msg.includes("pdf_wasm")
        ) {
          pushLog(
            "Hint: run `pnpm --filter=@gopdfjs/pdf-wasm build:wasm` from repo root.",
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
        fontFamily: "system-ui, sans-serif",
        maxWidth: 720,
        margin: "0 auto",
        padding: 24,
        lineHeight: 1.5,
      }}
    >
      <h1 style={{ fontSize: "1.35rem" }}>pdf.js vs @gopdfjs/pdf-wasm</h1>
      <p style={{ color: "#444" }}>
        主站大量能力走 <strong>pdf.js / pdf-lib</strong>；压缩、线性化、整册灰度等由{" "}
        <strong>Rust → WASM</strong>（<code>@gopdfjs/pdf-wasm</code>
        ）完成。本页用于本地验证两条链路是否都正常。
      </p>

      <section style={{ marginTop: 20 }}>
        <label style={{ fontWeight: 600 }}>PDF 文件 </label>
        <input
          type="file"
          accept={ACCEPT_PDF}
          onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
        />
        {fileName ? (
          <span style={{ marginLeft: 8, color: "#666" }}>{fileName}</span>
        ) : null}
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: "1.05rem" }}>1) pdf.js（解析 / 页数）</h2>
        <button type="button" disabled={!bytes || busy !== null} onClick={() => void runPdfjs()}>
          {busy === "pdf.js" ? "Running…" : "Count pages"}
        </button>
        {pdfjsPages !== null ? (
          <span style={{ marginLeft: 12 }}>
            <strong>{pdfjsPages}</strong> pages
          </span>
        ) : null}
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: "1.05rem" }}>2) pdf-wasm（Worker + Rust）</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {COMPRESS_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              disabled={!bytes || busy !== null}
              onClick={() => void runWasm("compress", level)}
            >
              Compress ({level})
            </button>
          ))}
          <button
            type="button"
            disabled={!bytes || busy !== null}
            onClick={() => void runWasm("grayscale")}
          >
            Grayscale
          </button>
          <button
            type="button"
            disabled={!bytes || busy !== null}
            onClick={() => void runWasm("linearize")}
          >
            Linearize
          </button>
          <button type="button" onClick={downloadLast}>
            Download last wasm output
          </button>
        </div>
        {wasmNote ? (
          <p style={{ marginTop: 8, color: "#0a0" }}>{wasmNote}</p>
        ) : null}
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: "1.05rem" }}>Log</h2>
        <pre
          style={{
            background: "#f6f6f6",
            padding: 12,
            borderRadius: 8,
            fontSize: 12,
            maxHeight: 280,
            overflow: "auto",
          }}
        >
          {log.length ? log.join("\n") : "…"}
        </pre>
      </section>
    </div>
  );
}

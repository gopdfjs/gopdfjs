import type { CompressionLevel } from "@gopdfjs/engine";
import { useCallback, useState } from "react";
import { EmptyState, LogPanel } from "../components/LogPanel";
import { FileDropzone } from "../components/FileDropzone";
import { Icon } from "../components/Icon";
import { downloadPdfBytes } from "../lib/downloadBlob";
import { getBrowserEngine } from "../lib/engine";
import { formatBytes } from "../lib/formatBytes";
import { probePageCount } from "../lib/probePageCount";

const COMPRESS_LEVELS: CompressionLevel[] = ["low", "recommended", "extreme"];

type SmokeMetric = {
  label: string;
  value: string;
  accent?: boolean;
};

export default function HomePage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<SmokeMetric[]>([]);
  const [lastOut, setLastOut] = useState<Uint8Array | null>(null);
  const [lastOp, setLastOp] = useState<string | null>(null);

  const pushLog = useCallback((line: string) => {
    const stamp = new Date().toISOString().slice(11, 19);
    setLog((prev) => [...prev.slice(-60), `[${stamp}] ${line}`]);
  }, []);

  const onPickFile = useCallback(
    async (file: File | null) => {
      setMetrics([]);
      setLastOut(null);
      setLastOp(null);
      setLog([]);
      if (!file) {
        setFileName(null);
        setBytes(null);
        return;
      }
      const buf = new Uint8Array(await file.arrayBuffer());
      setFileName(file.name);
      setBytes(buf);
      setMetrics([{ label: "Input", value: formatBytes(buf.byteLength) }]);
      pushLog(`Loaded ${file.name} (${buf.byteLength} bytes)`);
    },
    [pushLog],
  );

  const runPageCount = useCallback(async () => {
    if (!bytes) return;
    setBusy("analyzePdf");
    try {
      const pages = await probePageCount(bytes);
      pushLog(`engine.analyzePdf → ${pages} page(s)`);
      setMetrics((prev) => [
        ...prev.filter((m) => m.label !== "Pages"),
        { label: "Pages", value: String(pages), accent: true },
      ]);
    } catch (e) {
      pushLog(`analyzePdf error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(null);
    }
  }, [bytes, pushLog]);

  const runEngine = useCallback(
    async (op: "compress" | "grayscale" | "linearize", level?: CompressionLevel) => {
      if (!bytes) return;
      const label = level ? `${op}:${level}` : op;
      setBusy(label);
      const t0 = performance.now();
      try {
        const engine = await getBrowserEngine();
        let out: Uint8Array;
        if (op === "compress") {
          out = await engine.compressPdf(bytes, level ?? "recommended", (fraction) => {
            const pct = Math.round(fraction * 100);
            if (pct % 25 === 0) pushLog(`compress ${pct}%`);
          });
        } else if (op === "grayscale") {
          const result = await engine.grayscalePdf(bytes, { mode: "grayscale" });
          out = result.bytes;
        } else {
          out = await engine.linearizePdf(bytes);
        }
        const ms = Math.round(performance.now() - t0);
        pushLog(`${label}: ${bytes.byteLength} → ${out.byteLength} bytes (${ms} ms)`);
        setLastOut(out);
        setLastOp(label);
        setMetrics((prev) => [
          ...prev.filter((m) => !m.label.startsWith("Output") && m.label !== "Duration"),
          { label: "Output", value: formatBytes(out.byteLength), accent: true },
          { label: "Duration", value: `${ms} ms` },
        ]);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        pushLog(`${label} error: ${msg}`);
        if (msg.includes("pdf_wasm") || msg.includes("pkg/")) {
          pushLog("Hint: run pnpm build:wasm from repo root");
        }
      } finally {
        setBusy(null);
      }
    },
    [bytes, pushLog],
  );

  const downloadLast = useCallback(() => {
    if (!lastOut) {
      pushLog("Nothing to download");
      return;
    }
    const base = fileName?.replace(/\.pdf$/i, "") ?? "output";
    downloadPdfBytes(lastOut, `${base}-${lastOp ?? "out"}.pdf`);
  }, [fileName, lastOp, lastOut, pushLog]);

  const engineReady = bytes != null && busy === null;

  return (
    <div className="stack">
      <header className="page-hero">
        <div className="page-hero-eyebrow">Acceptance</div>
        <h1>Engine smoke</h1>
        <p>
          Validates <code>createEngine(await createBrowserAdapter())</code> — adapter wiring, consumer{" "}
          <code>engine.*</code> probes, and WASM passthrough before per-tool Playwright specs.
        </p>
      </header>

      <div className="page-grid page-grid-2">
        <section className="card">
          <div className="card-header">
            <div className="card-header-text">
              <h2>Fixture</h2>
              <p>Load a PDF to unlock probes.</p>
            </div>
          </div>
          <div className="card-body card-body-tight">
            <FileDropzone fileName={fileName} onPick={onPickFile} />
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <div className="card-header-text">
              <h2>Metrics</h2>
              <p>Latest successful readouts.</p>
            </div>
          </div>
          <div className="card-body card-body-tight">
            {metrics.length ? (
              <div className="stats-grid">
                {metrics.map((metric) => (
                  <div key={metric.label} className="stat-tile">
                    <div className="stat-tile-label">{metric.label}</div>
                    <div className={`stat-tile-value${metric.accent ? " muted" : ""}`}>
                      {metric.value}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No fixture loaded" />
            )}
          </div>
        </section>
      </div>

      <section className="card">
        <div className="card-header">
          <div className="card-header-text">
            <h2>Probes</h2>
            <p>Run individual checks against the loaded fixture.</p>
          </div>
        </div>
        <div className="card-body stack">
          <div className="probe-grid">
            <button
              type="button"
              className={`probe-btn${busy === "analyzePdf" ? " running" : ""}`}
              disabled={!engineReady}
              onClick={() => void runPageCount()}
            >
              <span className="probe-btn-label">analyzePdf</span>
              <span className="probe-btn-meta">page count</span>
            </button>
            {COMPRESS_LEVELS.map((lvl) => (
              <button
                key={lvl}
                type="button"
                className={`probe-btn${busy === `compress:${lvl}` ? " running" : ""}`}
                disabled={!engineReady}
                onClick={() => void runEngine("compress", lvl)}
              >
                <span className="probe-btn-label">compress</span>
                <span className="probe-btn-meta">{lvl}</span>
              </button>
            ))}
            <button
              type="button"
              className={`probe-btn${busy === "grayscale" ? " running" : ""}`}
              disabled={!engineReady}
              onClick={() => void runEngine("grayscale")}
            >
              <span className="probe-btn-label">grayscale</span>
              <span className="probe-btn-meta">Raster pipeline</span>
            </button>
            <button
              type="button"
              className={`probe-btn${busy === "linearize" ? " running" : ""}`}
              disabled={!engineReady}
              onClick={() => void runEngine("linearize")}
            >
              <span className="probe-btn-label">linearize</span>
              <span className="probe-btn-meta">WASM passthrough</span>
            </button>
          </div>
          <div className="actions-row">
            <button type="button" className="btn btn-sm" disabled={!lastOut} onClick={downloadLast}>
              <Icon name="download" size={14} />
              Download last output
            </button>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <div className="card-header-text">
            <h2>Event log</h2>
            <p>Timestamped trace for manual debugging.</p>
          </div>
        </div>
        <div className="card-body card-body-tight">
          <LogPanel lines={log} />
        </div>
      </section>
    </div>
  );
}

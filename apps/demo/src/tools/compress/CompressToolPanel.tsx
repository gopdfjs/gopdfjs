import type { CompressionLevel } from "@gopdfjs/engine";
import { FileDropzone } from "../../components/FileDropzone";
import { Icon } from "../../components/Icon";
import { formatBytes } from "../../lib/formatBytes";
import {
  COMPRESS_LEVELS,
  formatCompressionSavedLabel,
  type CompressionStats,
} from "./useCompressTool";

type CompressToolPanelProps = {
  fileName: string | null;
  level: CompressionLevel;
  busy: boolean;
  progress: number;
  error: string | null;
  stats: CompressionStats | null;
  canCompress: boolean;
  onPickFile: (file: File | null) => void;
  onLevelChange: (level: CompressionLevel) => void;
  onCompress: () => void;
  onDownload: () => void;
};

export function CompressToolPanel({
  fileName,
  level,
  busy,
  progress,
  error,
  stats,
  canCompress,
  onPickFile,
  onLevelChange,
  onCompress,
  onDownload,
}: CompressToolPanelProps) {
  return (
    <div className="stack">
      <header className="page-hero">
        <div className="page-hero-eyebrow">RFC 0008</div>
        <h1>Compress PDF</h1>
        <p>
          End-to-end browser acceptance for <code>engine.compressPdf()</code>. Output stays on
          device — safe for CI and local QA.
        </p>
      </header>

      <div className="page-grid page-grid-compress">
        <section className="card">
          <div className="card-header">
            <div className="card-header-text">
              <h2>Configure</h2>
              <p>Select input and compression level.</p>
            </div>
          </div>
          <div className="card-body stack">
            <div>
              <span className="field-label">Input PDF</span>
              <FileDropzone
                fileName={fileName}
                hint="pdf-lib compatible documents"
                onPick={onPickFile}
              />
            </div>

            <div>
              <span className="field-label">Level</span>
              <div className="segmented" role="group" aria-label="Compression level">
                {COMPRESS_LEVELS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={level === item ? "active" : ""}
                    onClick={() => onLevelChange(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!canCompress}
                onClick={() => void onCompress()}
              >
                {busy ? `Compressing… ${progress}%` : "Compress"}
              </button>
              {busy ? (
                <div className="progress" aria-hidden>
                  <div className="progress-bar" style={{ width: `${progress}%` }} />
                </div>
              ) : null}
            </div>

            {error ? <div className="alert alert-error">{error}</div> : null}
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <div className="card-header-text">
              <h2>Result</h2>
              <p>Byte stats and download for assertions.</p>
            </div>
          </div>
          <div className="card-body">
            {stats ? (
              <>
                <div className="result-banner">
                  <Icon name="check" size={16} />
                  Compression complete
                </div>
                <div className="stats-grid">
                  <div className="stat-tile">
                    <div className="stat-tile-label">Before</div>
                    <div className="stat-tile-value">
                      <strong>Before:</strong> {formatBytes(stats.inputBytes)}
                    </div>
                  </div>
                  <div className="stat-tile">
                    <div className="stat-tile-label">After</div>
                    <div className="stat-tile-value">
                      <strong>After:</strong> {formatBytes(stats.outputBytes)}
                    </div>
                  </div>
                  <div className="stat-tile">
                    <div className="stat-tile-label">Saved</div>
                    <div className="stat-tile-value muted">
                      {formatCompressionSavedLabel(stats.savedRatio)}
                    </div>
                  </div>
                </div>
                <div className="actions-row">
                  <button type="button" className="btn btn-primary" onClick={onDownload}>
                    <Icon name="download" size={14} />
                    Download compressed PDF
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Icon name="compress" size={18} />
                </div>
                Run compress to see before/after stats
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

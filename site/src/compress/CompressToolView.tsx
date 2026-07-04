import type { CompressionLevel } from "@gopdfjs/engine";
import {
  formatCompressionSavedLabel,
  type CompressionStats,
} from "./compressHelpers";
import { COMPRESS_LEVELS, PDF_ACCEPT } from "./useCompressTool";

const pageStyle = {
  fontFamily: "system-ui, sans-serif",
  maxWidth: 640,
  margin: "0 auto",
  padding: 24,
  lineHeight: 1.5,
} as const;

type CompressToolViewProps = {
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

export function CompressToolView({
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
}: CompressToolViewProps) {
  return (
    <div style={pageStyle}>
      <p style={{ marginBottom: 8 }}>
        <a href="/" style={{ color: "#666", fontSize: 14 }}>
          ← Back to wasm demo
        </a>
      </p>
      <h1 style={{ fontSize: "1.5rem", marginBottom: 4 }}>Compress PDF</h1>
      <p style={{ color: "#555", marginBottom: 24 }}>
        Browser-local Flate stream recompression (RFC 0008 Phase 1). Files never
        leave your device.
      </p>

      <section style={{ marginBottom: 20 }}>
        <label style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>
          PDF file
        </label>
        <input
          type="file"
          accept={PDF_ACCEPT}
          onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
        />
        {fileName ? (
          <span style={{ marginLeft: 8, color: "#666" }}>{fileName}</span>
        ) : null}
      </section>

      <section style={{ marginBottom: 20 }}>
        <label style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>
          Level
        </label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {COMPRESS_LEVELS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => onLevelChange(l)}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: level === l ? "2px solid #f97316" : "1px solid #ccc",
                background: level === l ? "#fff7ed" : "#fff",
                cursor: "pointer",
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </section>

      <button
        type="button"
        disabled={!canCompress}
        onClick={() => void onCompress()}
        style={{
          padding: "10px 20px",
          borderRadius: 10,
          border: "none",
          background: "#f97316",
          color: "#fff",
          fontWeight: 600,
          cursor: canCompress ? "pointer" : "not-allowed",
          opacity: canCompress ? 1 : 0.6,
        }}
      >
        {busy ? `Compressing… ${progress}%` : "Compress"}
      </button>

      {error ? (
        <p style={{ color: "#b91c1c", marginTop: 16 }}>{error}</p>
      ) : null}

      {stats ? (
        <div
          style={{
            marginTop: 24,
            padding: 16,
            background: "#f6f6f6",
            borderRadius: 12,
          }}
        >
          <p style={{ margin: "0 0 8px" }}>
            <strong>Before:</strong> {stats.inputLabel} ({stats.inputBytes}{" "}
            bytes)
          </p>
          <p style={{ margin: "0 0 8px" }}>
            <strong>After:</strong> {stats.outputLabel} ({stats.outputBytes}{" "}
            bytes)
          </p>
          <p style={{ margin: 0 }}>
            <strong>Saved:</strong> {formatCompressionSavedLabel(stats.savedRatio)}
          </p>
          <button
            type="button"
            onClick={onDownload}
            style={{
              marginTop: 12,
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #ccc",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Download compressed PDF
          </button>
        </div>
      ) : null}
    </div>
  );
}

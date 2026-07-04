import { useMemo, useState } from "react";
import {
  compareReadingMethods,
  COST_USD_PER_MILLION_INPUT_TOKENS,
} from "@gopdfjs/extract/tokenEstimate";

const PAGE_COUNT_MIN = 1;
const PAGE_COUNT_MAX = 200;
const TARGET_PAGES_MIN = 1;
const TARGET_PAGES_MAX = 20;

type MethodBar = {
  key: "multimodal" | "dumpAll" | "smartMcp";
  label: string;
  tokens: number;
  costUsd: number;
  color: string;
};

function formatTokens(value: number): string {
  return value.toLocaleString("en-US");
}

function formatUsd(value: number): string {
  return `$${value.toFixed(4)}`;
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export default function TokenComparisonCalculator() {
  const [pageCount, setPageCount] = useState(25);
  const [targetPages, setTargetPages] = useState(2);

  const comparison = useMemo(
    () =>
      compareReadingMethods({
        pageCount,
        targetPages,
      }),
    [pageCount, targetPages],
  );

  const bars: MethodBar[] = useMemo(
    () => [
      {
        key: "multimodal",
        label: "A · All pages as images",
        tokens: comparison.methods.multimodal.tokens,
        costUsd: comparison.methods.multimodal.estimatedCostUsd,
        color: "#ef4444",
      },
      {
        key: "dumpAll",
        label: "B · Dump all text",
        tokens: comparison.methods.dumpAll.tokens,
        costUsd: comparison.methods.dumpAll.estimatedCostUsd,
        color: "#f97316",
      },
      {
        key: "smartMcp",
        label: "C · Smart MCP path",
        tokens: comparison.methods.smartMcp.tokens,
        costUsd: comparison.methods.smartMcp.estimatedCostUsd,
        color: "#16a34a",
      },
    ],
    [comparison],
  );

  const maxTokens = Math.max(...bars.map((bar) => bar.tokens), 1);

  return (
    <section
      style={{
        background: "linear-gradient(180deg, #fff7ed 0%, #ffffff 100%)",
        border: "1px solid #fed7aa",
        borderRadius: 16,
        padding: 28,
        marginBottom: 48,
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "#111827" }}>
          AI Token Savings Calculator
        </h2>
        <p style={{ margin: "8px 0 0", color: "#4b5563", maxWidth: 720 }}>
          Compare estimated input tokens when an AI reads PDFs as images, as full text,
          or via a smart MCP workflow (analyze + selective pages). Uses the same formulas
          as <code style={{ fontSize: "0.9em" }}>gopdf compare-tokens</code>.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 20,
          marginBottom: 24,
        }}
      >
        <label style={{ display: "grid", gap: 8 }}>
          <span style={{ fontWeight: 600, color: "#374151" }}>
            Document pages: {pageCount}
          </span>
          <input
            type="range"
            min={PAGE_COUNT_MIN}
            max={PAGE_COUNT_MAX}
            value={pageCount}
            onChange={(event) => setPageCount(Number(event.target.value))}
          />
        </label>

        <label style={{ display: "grid", gap: 8 }}>
          <span style={{ fontWeight: 600, color: "#374151" }}>
            Smart path target pages
          </span>
          <input
            type="number"
            min={TARGET_PAGES_MIN}
            max={TARGET_PAGES_MAX}
            value={targetPages}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (Number.isFinite(next)) {
                setTargetPages(
                  Math.min(
                    TARGET_PAGES_MAX,
                    Math.max(TARGET_PAGES_MIN, next),
                  ),
                );
              }
            }}
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
            }}
          />
        </label>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <MetricCard
          title="Smart MCP savings"
          value={formatPercent(comparison.savingsVsMultimodal.smartMcpPercent)}
          subtitle="vs sending every page as an image"
          accent="#16a34a"
        />
        <MetricCard
          title="Smart MCP tokens"
          value={formatTokens(comparison.methods.smartMcp.tokens)}
          subtitle={formatUsd(comparison.methods.smartMcp.estimatedCostUsd)}
          accent="#111827"
        />
        <MetricCard
          title="Multimodal tokens"
          value={formatTokens(comparison.methods.multimodal.tokens)}
          subtitle={formatUsd(comparison.methods.multimodal.estimatedCostUsd)}
          accent="#ef4444"
        />
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        {bars.map((bar) => (
          <div key={bar.key}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 6,
                fontSize: "0.92rem",
                color: "#374151",
              }}
            >
              <strong>{bar.label}</strong>
              <span>
                {formatTokens(bar.tokens)} tokens · {formatUsd(bar.costUsd)}
              </span>
            </div>
            <div
              style={{
                height: 14,
                background: "#f3f4f6",
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${(bar.tokens / maxTokens) * 100}%`,
                  height: "100%",
                  background: bar.color,
                  borderRadius: 999,
                  transition: "width 180ms ease",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <p style={{ margin: "18px 0 0", fontSize: "0.85rem", color: "#6b7280" }}>
        Pricing assumption: ${COST_USD_PER_MILLION_INPUT_TOKENS} / 1M input tokens.
        Run <code>gopdf compare-tokens your.pdf</code> for measured text from a real PDF.
      </p>
    </section>
  );
}

type MetricCardProps = {
  title: string;
  value: string;
  subtitle: string;
  accent: string;
};

function MetricCard({ title, value, subtitle, accent }: MetricCardProps) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 16,
      }}
    >
      <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#6b7280" }}>
        {title}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: "1.6rem",
          fontWeight: 800,
          color: accent,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div style={{ marginTop: 4, fontSize: "0.85rem", color: "#4b5563" }}>
        {subtitle}
      </div>
    </div>
  );
}

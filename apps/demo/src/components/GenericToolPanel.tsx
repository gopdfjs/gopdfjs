import type { ToolDef } from "../config/tools";
import { FileDropzone } from "./FileDropzone";
import { Icon } from "./Icon";
import { EmptyState } from "./LogPanel";
import type { GenericToolActions, GenericToolState } from "../hooks/useGenericTool";

type GenericToolPanelProps = ToolDef & GenericToolState & GenericToolActions;

export function GenericToolPanel({
  label,
  rfc,
  description,
  engineMethod,
  e2eRunLabel,
  fileName,
  textSource,
  busy,
  error,
  result,
  canRun,
  inputKind,
  onPickFile,
  onTextChange,
  onRun,
  onDownload,
}: GenericToolPanelProps) {
  const runLabel = busy ? "Running…" : e2eRunLabel;

  return (
    <div className="stack">
      <header className="page-hero">
        {rfc ? <div className="page-hero-eyebrow">{rfc}</div> : null}
        <h1>{label}</h1>
        <p>
          Browser acceptance for <code>{engineMethod}()</code> via{" "}
          <code>createBrowserGopdf()</code>.
        </p>
        <p className="muted">{description}</p>
      </header>

      <div className="page-grid page-grid-2">
        <section className="card">
          <div className="card-header">
            <div className="card-header-text">
              <h2>Input</h2>
              <p>{inputKind === "pdf" ? "Upload a PDF fixture." : "Edit source text."}</p>
            </div>
          </div>
          <div className="card-body stack">
            {inputKind === "pdf" ? (
              <FileDropzone fileName={fileName} onPick={onPickFile} />
            ) : (
              <textarea
                className="tool-textarea"
                value={textSource}
                rows={8}
                onChange={(e) => onTextChange(e.target.value)}
                aria-label="Author source"
              />
            )}

            <button
              type="button"
              className="btn btn-primary"
              disabled={!canRun}
              data-testid="tool-run"
              onClick={() => void onRun()}
            >
              {runLabel}
            </button>

            {error ? (
              <div className="alert alert-error" data-testid="tool-error">
                {error}
              </div>
            ) : null}
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <div className="card-header-text">
              <h2>Result</h2>
              <p>Output summary for Playwright assertions.</p>
            </div>
          </div>
          <div className="card-body">
            {result ? (
              <>
                <div className="result-banner" data-testid="tool-success">
                  <Icon name="check" size={16} />
                  {result.summary}
                </div>
                {result.kind === "text" ? (
                  <pre className="tool-text-preview">{result.text.slice(0, 800)}</pre>
                ) : null}
                {result.kind === "json" ? (
                  <pre className="tool-text-preview">
                    {JSON.stringify(result.data, null, 2).slice(0, 800)}
                  </pre>
                ) : null}
                {result.kind === "pdf" || result.kind === "blob" ? (
                  <div className="actions-row">
                    <button type="button" className="btn btn-primary" onClick={onDownload}>
                      <Icon name="download" size={14} />
                      Download output
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <EmptyState message="Run the tool to see output" />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

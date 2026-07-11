import type { ToolDef } from "../config/tools";
import { FileDropzone, PDF_ACCEPT } from "./FileDropzone";
import { Icon } from "./Icon";
import { ImageThumbGrid } from "./ImageThumbGrid";
import { EmptyState } from "./LogPanel";
import { MultiFileDropzone } from "./MultiFileDropzone";
import { PdfComparePreview } from "./PdfComparePreview";
import { PdfEmbedPreview } from "./PdfEmbedPreview";
import { DEMO_PASSWORD_DEFAULT, IMAGE_ACCEPT, type ToolDemoActions, type ToolDemoState } from "../hooks/useToolDemo";

type ToolDemoPanelProps = ToolDef & ToolDemoState & ToolDemoActions;

function PasswordField({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <label className="stack gap-sm">
      <span className="field-label">{label}</span>
      <input
        type="text"
        className="text-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        data-testid="tool-password"
      />
    </label>
  );
}

function ResultBody({
  result,
  previews,
  demoKind,
  onDownload,
}: Pick<ToolDemoPanelProps, "result" | "previews" | "demoKind" | "onDownload">) {
  if (!result) {
    return <EmptyState message="Run the tool to see output" />;
  }

  return (
    <>
      <div className="result-banner" data-testid="tool-success">
        <Icon name="check" size={16} />
        {result.summary}
      </div>

      {demoKind === "pdf-transform" ? (
        <PdfComparePreview beforeUrl={previews.inputPdfUrl} afterUrl={previews.outputPdfUrl} />
      ) : null}

      {demoKind === "html-to-pdf" ? (
        <PdfEmbedPreview
          url={previews.outputPdfUrl}
          title="Generated PDF"
          emptyLabel="No PDF preview"
          testId="pdf-preview-after"
        />
      ) : null}

      {demoKind === "merge" && result.kind === "pdf" ? (
        <PdfEmbedPreview
          url={previews.outputPdfUrl}
          title="Merged PDF"
          emptyLabel="No preview"
          testId="pdf-preview-after"
        />
      ) : null}

      {demoKind === "jpg-to-pdf" && result.kind === "pdf" ? (
        <PdfEmbedPreview
          url={previews.outputPdfUrl}
          title="Image album PDF"
          emptyLabel="No preview"
          testId="pdf-preview-after"
        />
      ) : null}

      {demoKind === "sign-pdf" && result.kind === "pdf" ? (
        <PdfComparePreview beforeUrl={previews.inputPdfUrl} afterUrl={previews.outputPdfUrl} />
      ) : null}

      {demoKind === "password-pdf" && result.kind === "pdf" ? (
        <PdfEmbedPreview
          url={previews.outputPdfUrl}
          title="Output PDF"
          emptyLabel="No preview"
          testId="pdf-preview-after"
        />
      ) : null}

      {demoKind === "pdf-to-jpeg" ? (
        <ImageThumbGrid images={previews.jpegThumbs} emptyLabel="No JPEG pages yet" />
      ) : null}

      {demoKind === "extract-images" ? (
        <ImageThumbGrid images={previews.imageThumbs} emptyLabel="No embedded images found" />
      ) : null}

      {result.kind === "text" ? (
        <pre className="tool-text-preview" data-testid="tool-text-output">
          {result.text.slice(0, 4000)}
        </pre>
      ) : null}

      {result.kind === "json" ? (
        <pre className="tool-text-preview" data-testid="tool-json-output">
          {JSON.stringify(result.data, null, 2).slice(0, 4000)}
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
  );
}

function InputSection(props: ToolDemoPanelProps) {
  const { demoKind } = props;

  switch (demoKind) {
    case "merge":
      return (
        <MultiFileDropzone
          accept={PDF_ACCEPT}
          fileNames={props.fileNames}
          emptyTitle="Add PDFs to merge"
          loadedTitle={`${props.fileNames.length} PDF(s) queued`}
          hint="Pick two or more PDFs — order is preserved"
          onPickMany={(files) => void props.onPickPdfs(files)}
          onClear={props.onClearPdfs}
        />
      );

    case "jpg-to-pdf":
      return (
        <MultiFileDropzone
          accept={IMAGE_ACCEPT}
          fileNames={props.imageNames}
          emptyTitle="Add images"
          loadedTitle={`${props.imageNames.length} image(s) queued`}
          hint="JPEG, PNG, or WebP — each image becomes a PDF page"
          onPickMany={(files) => void props.onPickImages(files)}
          onClear={props.onClearImages}
        />
      );

    case "sign-pdf":
      return (
        <div className="stack">
          <div>
            <span className="field-label">Input PDF</span>
            <FileDropzone fileName={props.fileName} onPick={(f) => void props.onPickPdf(f)} />
          </div>
          <div>
            <span className="field-label">PNG stamp (optional)</span>
            <FileDropzone
              accept="image/png"
              fileName={props.stampFileName}
              hint="PNG signature or stamp — defaults to 1×1 px if omitted"
              onPick={(f) => void props.onPickStamp(f)}
            />
          </div>
        </div>
      );

    case "password-pdf":
      return (
        <div className="stack">
          <div>
            <span className="field-label">Input PDF</span>
            <FileDropzone fileName={props.fileName} onPick={(f) => void props.onPickPdf(f)} />
          </div>
          <PasswordField
            label={`Password (default ${DEMO_PASSWORD_DEFAULT})`}
            value={props.password}
            onChange={props.onPasswordChange}
          />
        </div>
      );

    case "html-to-pdf":
    case "markdown-to-html":
      return (
        <textarea
          className="tool-textarea"
          value={props.textSource}
          rows={10}
          onChange={(e) => props.onTextChange(e.target.value)}
          aria-label="Author source"
          data-testid="tool-text-source"
        />
      );

    default:
      return (
        <FileDropzone
          fileName={props.fileName}
          hint="Upload a PDF fixture for this tool"
          onPick={(f) => void props.onPickPdf(f)}
        />
      );
  }
}

function inputHint(demoKind: ToolDemoPanelProps["demoKind"]): string {
  switch (demoKind) {
    case "merge":
      return "Multi-PDF merge — real inputs, real combined output.";
    case "jpg-to-pdf":
      return "Images in → PDF out (not a PDF upload).";
    case "pdf-to-jpeg":
      return "PDF in → rendered JPEG page thumbnails.";
    case "extract-images":
      return "PDF in → embedded image blobs.";
    case "pdf-to-text":
      return "PDF in → plain text extraction.";
    case "json-export":
      return "PDF in → structured JSON for inspection.";
    case "blob-export":
      return "PDF in → office/ebook blob download.";
    case "password-pdf":
      return "PDF + password — encrypt or decrypt.";
    case "sign-pdf":
      return "PDF + optional PNG stamp overlay.";
    case "html-to-pdf":
      return "HTML source → PDF preview.";
    case "markdown-to-html":
      return "Markdown source → HTML output.";
    default:
      return "Single PDF transform — before/after preview when applicable.";
  }
}

export function ToolDemoPanel(props: ToolDemoPanelProps) {
  const runLabel = props.busy ? "Running…" : props.e2eRunLabel;

  return (
    <div className="stack">
      <header className="page-hero">
        {props.rfc ? <div className="page-hero-eyebrow">{props.rfc}</div> : null}
        <h1>{props.label}</h1>
        <p>
          Browser acceptance for <code>{props.engineMethod}()</code> via{" "}
          <code>createBrowserGopdf()</code>.
        </p>
        <p className="muted">{props.description}</p>
      </header>

      <div className="page-grid page-grid-2">
        <section className="card">
          <div className="card-header">
            <div className="card-header-text">
              <h2>Input</h2>
              <p>{inputHint(props.demoKind)}</p>
            </div>
          </div>
          <div className="card-body stack">
            <InputSection {...props} />

            <button
              type="button"
              className="btn btn-primary"
              disabled={!props.canRun}
              data-testid="tool-run"
              onClick={() => void props.onRun()}
            >
              {runLabel}
            </button>

            {props.error ? (
              <div className="alert alert-error" data-testid="tool-error">
                {props.error}
              </div>
            ) : null}
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <div className="card-header-text">
              <h2>Result</h2>
              <p>Feature-shaped output for manual QA and Playwright.</p>
            </div>
          </div>
          <div className="card-body">
            <ResultBody
              result={props.result}
              previews={props.previews}
              demoKind={props.demoKind}
              onDownload={props.onDownload}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

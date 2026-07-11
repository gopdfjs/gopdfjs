type PdfComparePreviewProps = {
  beforeUrl: string | null;
  afterUrl: string | null;
};

export function PdfComparePreview({ beforeUrl, afterUrl }: PdfComparePreviewProps) {
  return (
    <div className="pdf-compare-preview" data-testid="pdf-compare-preview">
      <figure className="pdf-preview-frame">
        <figcaption>Before</figcaption>
        {beforeUrl ? (
          <iframe
            src={beforeUrl}
            title="Before PDF preview"
            className="pdf-preview-embed"
            data-testid="pdf-preview-before"
          />
        ) : (
          <div className="pdf-preview-placeholder">Upload a PDF</div>
        )}
      </figure>
      <figure className="pdf-preview-frame">
        <figcaption>After</figcaption>
        {afterUrl ? (
          <iframe
            src={afterUrl}
            title="After PDF preview"
            className="pdf-preview-embed"
            data-testid="pdf-preview-after"
          />
        ) : (
          <div className="pdf-preview-placeholder">Run tool to preview output</div>
        )}
      </figure>
    </div>
  );
}

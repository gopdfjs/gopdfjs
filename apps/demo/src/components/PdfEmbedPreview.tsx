type PdfEmbedPreviewProps = {
  url: string | null;
  title: string;
  emptyLabel: string;
  testId?: string;
};

export function PdfEmbedPreview({ url, title, emptyLabel, testId }: PdfEmbedPreviewProps) {
  return (
    <figure className="pdf-preview-frame pdf-preview-frame-single">
      <figcaption>{title}</figcaption>
      {url ? (
        <iframe src={url} title={title} className="pdf-preview-embed" data-testid={testId} />
      ) : (
        <div className="pdf-preview-placeholder">{emptyLabel}</div>
      )}
    </figure>
  );
}

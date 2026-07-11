type ImageThumb = {
  url: string;
  label: string;
};

type ImageThumbGridProps = {
  images: ImageThumb[];
  emptyLabel: string;
};

export function ImageThumbGrid({ images, emptyLabel }: ImageThumbGridProps) {
  return (
    <div data-testid="image-result">
      {images.length === 0 ? (
        <div className="pdf-preview-placeholder" data-testid="image-thumb-empty">
          {emptyLabel}
        </div>
      ) : (
        <div className="image-thumb-grid" data-testid="image-thumb-grid">
          {images.map((item) => (
            <figure key={item.url} className="image-thumb">
              <img src={item.url} alt={item.label} />
              <figcaption>{item.label}</figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}

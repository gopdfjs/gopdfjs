export const EPUB_DEVICE_PRESET = {
  GENERIC: "generic",
  KINDLE: "kindle",
  KOBO: "kobo",
  IPAD: "ipad",
} as const;

export type EpubDevicePreset = (typeof EPUB_DEVICE_PRESET)[keyof typeof EPUB_DEVICE_PRESET];

export interface EpubMetadata {
  title: string;
  author: string;
  language?: string;
}

export interface EpubChapter {
  id: string;
  title: string;
  paragraphs: string[];
}

export interface EpubOutlineEntry {
  title: string;
  chapterId: string;
}

const DEVICE_STYLES: Record<EpubDevicePreset, string> = {
  generic: "body { font-family: serif; font-size: 1em; line-height: 1.6; margin: 1.5em; }",
  kindle: "body { font-family: Georgia, serif; font-size: 1.05em; line-height: 1.55; margin: 1.2em; }",
  kobo: "body { font-family: Palatino, serif; font-size: 1em; line-height: 1.65; margin: 1.4em; }",
  ipad: "body { font-family: -apple-system, sans-serif; font-size: 1.1em; line-height: 1.7; margin: 2em; }",
};

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Build one XHTML chapter document. */
export function buildChapterXhtml(title: string, paragraphs: string[]): string {
  const body = paragraphs.map((p) => `    <p>${escapeXml(p)}</p>`).join("\n");
  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <title>${escapeXml(title)}</title>
  <link rel="stylesheet" type="text/css" href="../styles/main.css"/>
</head>
<body>
  <h1>${escapeXml(title)}</h1>
${body}
</body>
</html>`;
}

/** Build EPUB 3 navigation document from outline entries. */
export function buildNavXhtml(outline: EpubOutlineEntry[]): string {
  const items = outline
    .map(
      (entry) =>
        `      <li><a href="${entry.chapterId}.xhtml">${escapeXml(entry.title)}</a></li>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>Table of Contents</title></head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Contents</h1>
    <ol>
${items}
    </ol>
  </nav>
</body>
</html>`;
}

/** Build package document (content.opf). */
export function buildContentOpf(
  metadata: EpubMetadata,
  chapterIds: string[],
  hasCover: boolean,
): string {
  const uuid = `urn:uuid:gopdf-${Date.now()}`;
  const manifestItems = [
    '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
    '<item id="style" href="styles/main.css" media-type="text/css"/>',
    ...chapterIds.map(
      (id) =>
        `<item id="${id}" href="text/${id}.xhtml" media-type="application/xhtml+xml"/>`,
    ),
  ];
  if (hasCover) {
    manifestItems.unshift(
      '<item id="cover-image" href="images/cover.jpg" media-type="image/jpeg" properties="cover-image"/>',
    );
  }

  const spineItems = chapterIds.map((id) => `<itemref idref="${id}"/>`).join("\n      ");

  return `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="book-id">${uuid}</dc:identifier>
    <dc:title>${escapeXml(metadata.title)}</dc:title>
    <dc:creator>${escapeXml(metadata.author)}</dc:creator>
    <dc:language>${escapeXml(metadata.language ?? "en")}</dc:language>
    <meta property="dcterms:modified">${new Date().toISOString().slice(0, 19)}Z</meta>
  </metadata>
  <manifest>
    ${manifestItems.join("\n    ")}
  </manifest>
  <spine>
      ${spineItems}
  </spine>
</package>`;
}

export function cssForDevicePreset(preset: EpubDevicePreset): string {
  return `${DEVICE_STYLES[preset]}\nh1 { font-size: 1.4em; margin-bottom: 0.75em; }\np { margin: 0 0 0.75em; }`;
}

export const EPUB_CONTAINER_XML = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;

export const EPUB_MIMETYPE = "application/epub+zip";

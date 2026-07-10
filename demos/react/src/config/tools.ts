import type { ToolIcon } from "../components/icons";
import { TOOL_IDS, type ToolId } from "./toolIds";
import { toolInputKind } from "../lib/toolRunners";

export type ToolDef = {
  id: ToolId;
  path: string;
  label: string;
  icon: ToolIcon;
  rfc?: string;
  description: string;
  engineMethod: string;
  /** Playwright: primary run button label (regex-friendly). */
  e2eRunLabel: string;
  e2eTimeoutMs?: number;
};

const META: Record<
  Exclude<ToolId, "compress">,
  Omit<ToolDef, "id" | "path" | "icon"> & { icon?: ToolIcon }
> = {
  grayscale: {
    label: "Grayscale",
    rfc: "RFC 0028",
    description: "engine.grayscalePdf",
    engineMethod: "grayscalePdf",
    e2eRunLabel: "Run grayscale",
  },
  linearize: {
    label: "Linearize",
    rfc: "RFC 0042",
    description: "engine.linearizePdf",
    engineMethod: "linearizePdf",
    e2eRunLabel: "Run linearize",
  },
  merge: {
    label: "Merge PDF",
    rfc: "RFC 0006",
    description: "engine.mergePdfs",
    engineMethod: "mergePdfs",
    e2eRunLabel: "Run merge",
  },
  split: {
    label: "Split PDF",
    rfc: "RFC 0007",
    description: "engine.splitPdf",
    engineMethod: "splitPdf",
    e2eRunLabel: "Run split",
  },
  rotate: {
    label: "Rotate PDF",
    rfc: "RFC 0009",
    description: "engine.rotatePdf",
    engineMethod: "rotatePdf",
    e2eRunLabel: "Run rotate",
  },
  organize: {
    label: "Organize PDF",
    rfc: "RFC 0010",
    description: "engine.organizePdf",
    engineMethod: "organizePdf",
    e2eRunLabel: "Run organize",
  },
  crop: {
    label: "Crop PDF",
    rfc: "RFC 0011",
    description: "engine.cropPdf",
    engineMethod: "cropPdf",
    e2eRunLabel: "Run crop",
  },
  protect: {
    label: "Protect PDF",
    rfc: "RFC 0021",
    description: "engine.protectPdf",
    engineMethod: "protectPdf",
    e2eRunLabel: "Run protect",
  },
  unlock: {
    label: "Unlock PDF",
    rfc: "RFC 0022",
    description: "engine.unlockPdf",
    engineMethod: "unlockPdf",
    e2eRunLabel: "Run unlock",
  },
  watermark: {
    label: "Watermark PDF",
    rfc: "RFC 0014",
    description: "engine.watermarkPdf",
    engineMethod: "watermarkPdf",
    e2eRunLabel: "Run watermark",
  },
  sign: {
    label: "Sign PDF",
    rfc: "RFC 0013",
    description: "engine.signPdf",
    engineMethod: "signPdf",
    e2eRunLabel: "Run sign",
  },
  halve: {
    label: "Halve PDF",
    rfc: "RFC 0029",
    description: "engine.halvePdf",
    engineMethod: "halvePdf",
    e2eRunLabel: "Run halve",
  },
  "n-up": {
    label: "N-up PDF",
    rfc: "RFC 0030",
    description: "engine.nUpPdf",
    engineMethod: "nUpPdf",
    e2eRunLabel: "Run n-up",
  },
  "page-numbers": {
    label: "Page numbers",
    rfc: "RFC 0015",
    description: "engine.addPageNumbers",
    engineMethod: "addPageNumbers",
    e2eRunLabel: "Run page-numbers",
  },
  "header-footer": {
    label: "Header / footer",
    rfc: "RFC 0016",
    description: "engine.addHeaderFooter",
    engineMethod: "addHeaderFooter",
    e2eRunLabel: "Run header-footer",
  },
  "form-fill": {
    label: "Form fill",
    rfc: "RFC 0031",
    description: "engine.fillPdfForm",
    engineMethod: "fillPdfForm",
    e2eRunLabel: "Run form-fill",
  },
  "native-text-edit": {
    label: "Native text edit",
    rfc: "RFC 0032",
    description: "engine.applyNativeTextEdits",
    engineMethod: "applyNativeTextEdits",
    e2eRunLabel: "Run native-text-edit",
  },
  "apply-edits": {
    label: "Apply edits",
    rfc: "RFC 0012",
    description: "engine.applyEdits",
    engineMethod: "applyEdits",
    e2eRunLabel: "Run apply-edits",
  },
  redact: {
    label: "Redact PDF",
    rfc: "RFC 0026",
    description: "engine.redactPdf",
    engineMethod: "redactPdf",
    e2eRunLabel: "Run redact",
  },
  repair: {
    label: "Repair PDF",
    rfc: "RFC 0027",
    description: "engine.repairPdf",
    engineMethod: "repairPdf",
    e2eRunLabel: "Run repair",
  },
  "pdf-to-jpeg": {
    label: "PDF → JPEG",
    rfc: "RFC 0018",
    description: "engine.pdfToJpeg",
    engineMethod: "pdfToJpeg",
    e2eRunLabel: "Run pdf-to-jpeg",
    e2eTimeoutMs: 180_000,
  },
  "pdf-to-text": {
    label: "PDF → text",
    rfc: "RFC 0033",
    description: "engine.pdfToText",
    engineMethod: "pdfToText",
    e2eRunLabel: "Run pdf-to-text",
    e2eTimeoutMs: 180_000,
  },
  "extract-images": {
    label: "Extract images",
    rfc: "RFC 0035",
    description: "engine.extractImages",
    engineMethod: "extractImages",
    e2eRunLabel: "Run extract-images",
    e2eTimeoutMs: 180_000,
  },
  "extract-text-runs": {
    label: "Extract text runs",
    description: "engine.extractPdfTextRuns",
    engineMethod: "extractPdfTextRuns",
    e2eRunLabel: "Run extract-text-runs",
    e2eTimeoutMs: 180_000,
  },
  "pdf-to-word": {
    label: "PDF → Word",
    rfc: "RFC 0019",
    description: "engine.pdfToWord",
    engineMethod: "pdfToWord",
    e2eRunLabel: "Run pdf-to-word",
    e2eTimeoutMs: 180_000,
  },
  "pdf-to-excel": {
    label: "PDF → Excel",
    rfc: "RFC 0024",
    description: "engine.pdfToExcel",
    engineMethod: "pdfToExcel",
    e2eRunLabel: "Run pdf-to-excel",
    e2eTimeoutMs: 180_000,
  },
  "pdf-to-ppt": {
    label: "PDF → PPT",
    rfc: "RFC 0025",
    description: "engine.pdfToPpt",
    engineMethod: "pdfToPpt",
    e2eRunLabel: "Run pdf-to-ppt",
    e2eTimeoutMs: 180_000,
  },
  "pdf-to-epub": {
    label: "PDF → EPUB",
    rfc: "RFC 0034",
    description: "engine.pdfToEpub",
    engineMethod: "pdfToEpub",
    e2eRunLabel: "Run pdf-to-epub",
    e2eTimeoutMs: 180_000,
  },
  analyze: {
    label: "Analyze PDF",
    rfc: "RFC 0061",
    description: "engine.analyzePdf",
    engineMethod: "analyzePdf",
    e2eRunLabel: "Run analyze",
    e2eTimeoutMs: 180_000,
  },
  "html-to-pdf": {
    label: "HTML → PDF",
    rfc: "RFC 0023",
    description: "engine.htmlToPdf",
    engineMethod: "htmlToPdf",
    e2eRunLabel: "Run html-to-pdf",
    e2eTimeoutMs: 180_000,
  },
  "markdown-to-html": {
    label: "Markdown → HTML",
    rfc: "RFC 0038",
    description: "engine.markdownToHtml",
    engineMethod: "markdownToHtml",
    e2eRunLabel: "Run markdown-to-html",
  },
  "jpg-to-pdf": {
    label: "JPG → PDF",
    rfc: "RFC 0017",
    description: "engine.jpgToPdf",
    engineMethod: "jpgToPdf",
    e2eRunLabel: "Run jpg-to-pdf",
  },
};

function buildTool(id: ToolId): ToolDef {
  if (id === "compress") {
    return {
      id,
      path: "/tools/compress",
      label: "Compress PDF",
      icon: "compress",
      rfc: "RFC 0008",
      description: "engine.compressPdf",
      engineMethod: "compressPdf",
      e2eRunLabel: "Compress",
    };
  }
  const meta = META[id];
  return {
    id,
    path: `/tools/${id}`,
    icon: meta.icon ?? "tool",
    ...meta,
  };
}

/** Sidebar entries: engine smoke hub + one route per tool. */
export const SMOKE_ROUTE = {
  path: "/",
  label: "Engine smoke",
  icon: "engine" as ToolIcon,
  description: "createBrowserGopdf probes",
};

export const TOOL_REGISTRY: readonly ToolDef[] = TOOL_IDS.map(buildTool);

export const NAV_ENTRIES = [SMOKE_ROUTE, ...TOOL_REGISTRY] as const;

export function findToolByPath(pathname: string): ToolDef | typeof SMOKE_ROUTE | undefined {
  if (pathname === SMOKE_ROUTE.path) return SMOKE_ROUTE;
  return TOOL_REGISTRY.find((tool) => tool.path === pathname);
}

export function findToolById(id: string): ToolDef | undefined {
  return TOOL_REGISTRY.find((tool) => tool.id === id && tool.path !== "/");
}

/** Routes that use the generic PDF/author runner (excludes compress dedicated page). */
export const GENERIC_TOOL_ROUTES = TOOL_REGISTRY.filter(
  (tool) => tool.path.startsWith("/tools/") && tool.id !== "compress",
);

export function listE2eTools(): ToolDef[] {
  return [...TOOL_REGISTRY];
}

export function assertToolCoverage(): void {
  const registered = new Set(TOOL_REGISTRY.map((t) => t.id));
  for (const id of TOOL_IDS) {
    if (!registered.has(id)) {
      throw new Error(`Missing tool registry entry: ${id}`);
    }
  }
  for (const tool of GENERIC_TOOL_ROUTES) {
    toolInputKind(tool.id);
  }
}

assertToolCoverage();

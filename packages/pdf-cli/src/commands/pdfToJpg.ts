import fs from "node:fs";
import path from "node:path";
import { pdfToImages } from "@gopdfjs/extract";

const USAGE = `Usage: gopdf pdf-to-jpg <input.pdf> [-o out_prefix] [--quality 0.92] [--scale 2]

Options:
  -o, --output    Output base name or folder (default: <input>-page-<num>.jpg)
  --quality       JPEG quality from 0.0 to 1.0 (default: 0.92)
  --scale         Render scale (default: 2)`;

type PdfToJpgOptions = {
  input: string;
  outputPrefix: string;
  quality: number;
  scale: number;
};

function defaultOutputPrefix(input: string): string {
  const parsed = path.parse(input);
  return path.join(parsed.dir, parsed.name);
}

export function parsePdfToJpgArgv(argv: string[]): PdfToJpgOptions | null {
  let input: string | undefined;
  let output: string | undefined;
  let quality = 0.92;
  let scale = 2;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "-o" || arg === "--output") {
      output = argv[++i];
      continue;
    }
    if (arg === "--quality") {
      const qVal = parseFloat(argv[++i] || "");
      if (isNaN(qVal) || qVal < 0 || qVal > 1) {
        console.error("Invalid --quality. Expected number between 0.0 and 1.0");
        return null;
      }
      quality = qVal;
      continue;
    }
    if (arg === "--scale") {
      const sVal = parseFloat(argv[++i] || "");
      if (isNaN(sVal) || sVal <= 0) {
        console.error("Invalid --scale. Expected positive number");
        return null;
      }
      scale = sVal;
      continue;
    }
    if (arg.startsWith("-")) {
      console.error(`Unknown option: ${arg}`);
      return null;
    }
    if (!input) {
      input = arg;
    }
  }

  if (!input) {
    console.log(USAGE);
    return null;
  }

  if (!fs.existsSync(input)) {
    console.error(`[ERROR] File not found: ${input}`);
    return null;
  }

  return {
    input,
    outputPrefix: output ?? defaultOutputPrefix(input),
    quality,
    scale,
  };
}

export async function runPdfToJpg(argv: string[]): Promise<number> {
  const opts = parsePdfToJpgArgv(argv);
  if (!opts) {
    return 1;
  }

  const inputBytes = new Uint8Array(fs.readFileSync(opts.input));
  console.log(`Converting PDF pages to JPEG: ${opts.input} (scale=${opts.scale}, quality=${opts.quality})…`);

  const results = await pdfToImages(inputBytes, opts.quality, opts.scale);

  fs.mkdirSync(path.dirname(path.resolve(opts.outputPrefix)), { recursive: true });

  for (const { bytes, page } of results) {
    let pagePath: string;
    const lower = opts.outputPrefix.toLowerCase();
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
      const ext = path.extname(opts.outputPrefix);
      const base = opts.outputPrefix.slice(0, -ext.length);
      pagePath = `${base}-page-${page}${ext}`;
    } else {
      pagePath = `${opts.outputPrefix}-page-${page}.jpg`;
    }

    fs.writeFileSync(pagePath, bytes);
    console.log(`Wrote: ${pagePath}`);
  }

  return 0;
}

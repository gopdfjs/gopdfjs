import fs from "node:fs";
import path from "node:path";
import { ocrPdf } from "@gopdfjs/extract";

const USAGE = `Usage: gopdf ocr <input.pdf> [-o out.txt] [--lang eng]

Options:
  -o, --output   Output path (default: <input>.txt)
  --lang         OCR language (default: eng)`;

type OcrOptions = {
  input: string;
  output: string;
  lang: string;
};

function defaultOutputPath(input: string): string {
  const parsed = path.parse(input);
  const base = parsed.name || "output";
  return path.join(parsed.dir, `${base}.txt`);
}

export function parseOcrArgv(argv: string[]): OcrOptions | null {
  let input: string | undefined;
  let output: string | undefined;
  let lang = "eng";

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "-o" || arg === "--output") {
      output = argv[++i];
      continue;
    }
    if (arg === "--lang") {
      lang = argv[++i] || "eng";
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
    output: output ?? defaultOutputPath(input),
    lang,
  };
}

export async function runOcr(argv: string[]): Promise<number> {
  const opts = parseOcrArgv(argv);
  if (!opts) {
    return 1;
  }

  const inputBytes = new Uint8Array(fs.readFileSync(opts.input));
  console.log(`Running OCR on ${opts.input} (lang=${opts.lang})…`);

  const text = await ocrPdf(inputBytes, opts.lang, (progress) => {
    const pct = Math.round(progress * 100);
    process.stderr.write(`\rOCR progress… ${pct}%`);
  });
  process.stderr.write("\n");

  fs.mkdirSync(path.dirname(path.resolve(opts.output)), { recursive: true });
  fs.writeFileSync(opts.output, text, "utf8");

  console.log(`OCR complete! Wrote full text to: ${opts.output}`);
  return 0;
}

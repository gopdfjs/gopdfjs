import fs from "node:fs";
import path from "node:path";
import { compressPdf } from "@gopdfjs/engine";
import {
  COMPRESSION_LEVELS,
  isCompressionLevel,
  type CompressionLevel,
} from "../constants.ts";

const DEFAULT_LEVEL: CompressionLevel = "recommended";

const USAGE = `Usage: gopdf compress <input.pdf> [-o out.pdf] [--level low|recommended|extreme]

Options:
  -o, --output   Output path (default: <input>-compressed.pdf)
  --level        Compression level (default: ${DEFAULT_LEVEL})`;

type CompressOptions = {
  input: string;
  output: string;
  level: CompressionLevel;
};

function defaultOutputPath(input: string): string {
  const parsed = path.parse(input);
  const base = parsed.name || "output";
  return path.join(parsed.dir, `${base}-compressed.pdf`);
}

export function parseCompressArgv(argv: string[]): CompressOptions | null {
  let input: string | undefined;
  let output: string | undefined;
  let level: CompressionLevel = DEFAULT_LEVEL;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "-o" || arg === "--output") {
      output = argv[++i];
      continue;
    }
    if (arg === "--level") {
      const next = argv[++i];
      if (!next || !isCompressionLevel(next)) {
        console.error(`Invalid --level. Expected: ${COMPRESSION_LEVELS.join("|")}`);
        return null;
      }
      level = next;
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
    level,
  };
}

export async function runCompress(argv: string[]): Promise<number> {
  const opts = parseCompressArgv(argv);
  if (!opts) {
    return 1;
  }

  const inputBytes = new Uint8Array(fs.readFileSync(opts.input));
  const inputSize = inputBytes.byteLength;

  const outputBytes = await compressPdf(inputBytes, opts.level, (fraction) => {
    const pct = Math.round(fraction * 100);
    if (pct % 25 === 0 || pct === 100) {
      process.stderr.write(`\rCompressing… ${pct}%`);
    }
  });
  process.stderr.write("\n");

  fs.mkdirSync(path.dirname(path.resolve(opts.output)), { recursive: true });
  fs.writeFileSync(opts.output, outputBytes);

  const saved = inputSize - outputBytes.byteLength;
  const ratio = inputSize > 0 ? ((saved / inputSize) * 100).toFixed(1) : "0.0";

  console.log(`Input:  ${inputSize.toLocaleString()} bytes`);
  console.log(`Output: ${outputBytes.byteLength.toLocaleString()} bytes`);
  console.log(`Saved:  ${saved.toLocaleString()} bytes (${ratio}%)`);
  console.log(`Wrote:  ${opts.output}`);

  return 0;
}

import fs from "node:fs";
import path from "node:path";
import { grayscalePdf } from "@gopdfjs/engine";

const USAGE = `Usage: gopdf grayscale <input.pdf> [-o out.pdf]

Options:
  -o, --output   Output path (default: <input>.grayscaled.pdf)`;

type GrayscaleOptions = {
  input: string;
  output: string;
};

function defaultOutputPath(input: string): string {
  const parsed = path.parse(input);
  const base = parsed.name || "output";
  return path.join(parsed.dir, `${base}.grayscaled.pdf`);
}

export function parseGrayscaleArgv(argv: string[]): GrayscaleOptions | null {
  let input: string | undefined;
  let output: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "-o" || arg === "--output") {
      output = argv[++i];
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
  };
}

export async function runGrayscale(argv: string[]): Promise<number> {
  const opts = parseGrayscaleArgv(argv);
  if (!opts) {
    return 1;
  }

  const inputBytes = new Uint8Array(fs.readFileSync(opts.input));
  console.log(`Processing grayscale for ${opts.input}…`);
  const outputBytes = await grayscalePdf(inputBytes);

  fs.mkdirSync(path.dirname(path.resolve(opts.output)), { recursive: true });
  fs.writeFileSync(opts.output, outputBytes);

  console.log(`Wrote: ${opts.output}`);
  return 0;
}

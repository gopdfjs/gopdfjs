import fs from "node:fs";
import path from "node:path";
import { linearizePdf } from "@gopdfjs/engine";

const USAGE = `Usage: gopdf linearize <input.pdf> [-o out.pdf]

Options:
  -o, --output   Output path (default: <input>.linearized.pdf)`;

type LinearizeOptions = {
  input: string;
  output: string;
};

function defaultOutputPath(input: string): string {
  const parsed = path.parse(input);
  const base = parsed.name || "output";
  return path.join(parsed.dir, `${base}.linearized.pdf`);
}

export function parseLinearizeArgv(argv: string[]): LinearizeOptions | null {
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

export async function runLinearize(argv: string[]): Promise<number> {
  const opts = parseLinearizeArgv(argv);
  if (!opts) {
    return 1;
  }

  const inputBytes = new Uint8Array(fs.readFileSync(opts.input));
  console.log(`Processing linearization for ${opts.input}…`);
  const outputBytes = await linearizePdf(inputBytes);

  fs.mkdirSync(path.dirname(path.resolve(opts.output)), { recursive: true });
  fs.writeFileSync(opts.output, outputBytes);

  console.log(`Wrote: ${opts.output}`);
  return 0;
}

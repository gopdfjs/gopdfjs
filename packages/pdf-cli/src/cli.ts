import { BIN_NAME } from "./constants.ts";
import { runAnalyze } from "./commands/analyze.ts";
import { runCompress } from "./commands/compress.ts";
import { runGrayscale } from "./commands/grayscale.ts";
import { runLinearize } from "./commands/linearize.ts";
import { runPdfToJpg } from "./commands/pdfToJpg.ts";
import { runOcr } from "./commands/ocr.ts";
import { runMcpServer } from "./commands/mcp.ts";

const HELP = `${BIN_NAME} — local PDF tools (no upload)

Usage:
  gopdf compress <input.pdf> [-o out.pdf] [--level low|recommended|extreme]
  gopdf grayscale <input.pdf> [-o out.pdf]
  gopdf linearize <input.pdf> [-o out.pdf]
  gopdf analyze <input.pdf>
  gopdf pdf-to-jpg <input.pdf> [-o out_prefix] [--quality 0.92] [--scale 2]
  gopdf ocr <input.pdf> [-o out.txt] [--lang eng]
  gopdf mcp

Examples:
  gopdf compress ./doc.pdf
  gopdf compress ./doc.pdf -o ./doc.small.pdf --level extreme
  gopdf grayscale ./doc.pdf
  gopdf linearize ./doc.pdf
  gopdf analyze ./doc.pdf
  gopdf pdf-to-jpg ./doc.pdf -o ./images/page
  gopdf ocr ./doc.pdf -o ./output.txt --lang eng
  gopdf mcp`;

export async function runCli(argv: string[]): Promise<number> {
  const [cmd, ...rest] = argv;

  if (!cmd || cmd === "help" || cmd === "--help" || cmd === "-h") {
    console.log(HELP);
    return 0;
  }

  switch (cmd) {
    case "compress":
      return runCompress(rest);
    case "grayscale":
      return runGrayscale(rest);
    case "linearize":
      return runLinearize(rest);
    case "analyze":
      return runAnalyze(rest);
    case "pdf-to-jpg":
      return runPdfToJpg(rest);
    case "ocr":
      return runOcr(rest);
    case "mcp":
      return runMcpServer();
    default:
      console.error(`Unknown command: ${cmd}\n`);
      console.log(HELP);
      return 1;
  }
}

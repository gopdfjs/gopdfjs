import { analyzePdf, printAnalyzeReport } from "../analyze.ts";

const USAGE = `Usage: gopdf analyze <input.pdf>`;

export async function runAnalyze(argv: string[]): Promise<number> {
  const input = argv[0];
  if (!input) {
    console.log(USAGE);
    return 1;
  }

  const report = await analyzePdf(input);
  printAnalyzeReport(report);
  return 0;
}

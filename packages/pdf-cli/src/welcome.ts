import { BIN_NAME, BUY_ME_A_COFFEE_URL } from "./constants.ts";

const WELCOME_LINE = `Thanks for using ${BIN_NAME}! If you like this CLI, buy me a coffee:` as const;

/** Help-only invocations that may show the support message (not real tool commands). */
export function shouldShowWelcomeMessage(argv: string[]): boolean {
  if (argv.includes("--json")) {
    return false;
  }

  const [cmd] = argv;
  return !cmd || cmd === "help" || cmd === "--help" || cmd === "-h";
}

/** One-line thanks + link on stderr so piped stdout stays clean. */
export function printWelcomeMessage(
  write: (message: string) => void = (message) => console.error(message),
): void {
  write(`${WELCOME_LINE}\n${BUY_ME_A_COFFEE_URL}\n`);
}

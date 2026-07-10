const UNITS = ["B", "KB", "MB", "GB"] as const;

/** Human-readable byte size for test UI. */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const exp = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), UNITS.length - 1);
  const value = bytes / 1024 ** exp;
  return `${value >= 10 || exp === 0 ? value.toFixed(0) : value.toFixed(1)} ${UNITS[exp]}`;
}

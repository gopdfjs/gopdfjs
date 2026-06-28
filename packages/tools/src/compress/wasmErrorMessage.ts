const WASM_BUILD_HINT = "run pnpm build:wasm from repo root." as const;

const WASM_LOAD_MARKERS = ["Failed to fetch", "pkg/", "pdf_wasm"] as const;

/** 将 WASM 加载/构建失败消息附加上下文提示（纯函数）。 */
export function formatCompressWasmError(raw: string): string {
  const needsHint = WASM_LOAD_MARKERS.some((marker) => raw.includes(marker));
  return needsHint ? `${raw} — ${WASM_BUILD_HINT}` : raw;
}

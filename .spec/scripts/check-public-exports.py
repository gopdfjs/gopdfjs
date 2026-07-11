#!/usr/bin/env env python3
"""Guard public entrypoints — no accidental adapter/WASM/plugin leakage (RFC 0058)."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

ENGINE_EXPORTS_ONLY_DOT = ROOT / "packages/engine/package.json"

ENGINE_INDEX_FORBIDDEN = [
    r"\bGopdfAdapter\b",
    r"\bGopdfEngine\b",
    r"\bsplitEncodedImages\b",
    r"\brenderPageTo",
    r'from "@gopdfjs/plugin-',
]

ADAPTER_INDEX_FORBIDDEN = [
    r"export\s*\{[^}]*\bcreateEngine\b",
    r"export\s*\{[^}]*\bcreateBrowserEngine\b",
    r"export\s*\{[^}]*\bcreateBrowserCanvasPort\b",
    r"export\s*\{[^}]*\bcreateBrowserPdfJsRuntime\b",
    r"export\s*\{[^}]*\bcreateNodeEngine\b",
    r"export\s*\{[^}]*\bcreateNodeCanvasPort\b",
    r"export\s*\{[^}]*\bcreateNodePdfJsRuntime\b",
    r"export\s*\{[^}]*\bcreateNodeOcrPort\b",
    r'export\s+\*\s+from\s+"@gopdfjs/engine"',
]


def main() -> int:
    errors: list[str] = []

    engine_pkg = json.loads(ENGINE_EXPORTS_ONLY_DOT.read_text())
    exports = engine_pkg.get("exports", {})
    if set(exports.keys()) != {"."}:
        errors.append(
            f"packages/engine/package.json: exports must be {{'.': ...}} only, got {sorted(exports.keys())}"
        )

    engine_index = (ROOT / "packages/engine/src/index.ts").read_text()
    for pattern in ENGINE_INDEX_FORBIDDEN:
        if re.search(pattern, engine_index):
            errors.append(f"packages/engine/src/index.ts: forbidden `{pattern}`")

    for rel in ("packages/adapter-browser/src/index.ts", "packages/adapter-node/src/index.ts"):
        text = (ROOT / rel).read_text()
        for pattern in ADAPTER_INDEX_FORBIDDEN:
            if re.search(pattern, text):
                errors.append(f"{rel}: forbidden export `{pattern}`")

    if errors:
        print("Public export check FAILED:\n", file=sys.stderr)
        for line in errors:
            print(f"  - {line}", file=sys.stderr)
        return 1

    print("Public export check OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

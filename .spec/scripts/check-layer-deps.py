#!/usr/bin/env env python3
"""Enforce plugin → runtime → adapter dependency direction (RFC 0058 §2.3)."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PACKAGES = ROOT / "packages"

PLUGIN_FORBIDDEN = {
    "@gopdfjs/adapter",
    "@gopdfjs/adapter-browser",
    "@gopdfjs/adapter-node",
    "@gopdfjs/engine",
}

RUNTIME_FORBIDDEN = {"@gopdfjs/adapter", "@gopdfjs/adapter-browser", "@gopdfjs/adapter-node", "@gopdfjs/engine"}

ADAPTER_FORBIDDEN = {"@gopdfjs/runtime"}


def read_deps(pkg_json: Path) -> dict[str, list[str]]:
    data = json.loads(pkg_json.read_text())
    return {
        "dependencies": list((data.get("dependencies") or {}).keys()),
        "devDependencies": list((data.get("devDependencies") or {}).keys()),
    }


def main() -> int:
    errors: list[str] = []

    for pkg_dir in sorted(PACKAGES.iterdir()):
        pkg_json = pkg_dir / "package.json"
        if not pkg_json.is_file():
            continue
        name = json.loads(pkg_json.read_text()).get("name", pkg_dir.name)
        deps = read_deps(pkg_json)
        prod = deps["dependencies"]

        if name.startswith("@gopdfjs/plugin-"):
            for bad in PLUGIN_FORBIDDEN:
                if bad in prod:
                    errors.append(f"{name}: forbidden prod dep {bad} (plugin → runtime only)")

        if name == "@gopdfjs/runtime":
            for bad in RUNTIME_FORBIDDEN:
                if bad in prod:
                    errors.append(f"{name}: forbidden prod dep {bad} (runtime must not import adapter)")

        if name == "@gopdfjs/adapter":
            for bad in ADAPTER_FORBIDDEN:
                if bad in prod:
                    errors.append(f"{name}: forbidden prod dep {bad} (adapter must not import runtime)")

    if errors:
        print("Layer dependency check FAILED:\n", file=sys.stderr)
        for line in errors:
            print(f"  - {line}", file=sys.stderr)
        return 1

    print("Layer dependency check OK (plugin → runtime → adapter)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

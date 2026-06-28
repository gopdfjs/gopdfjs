#!/usr/bin/env python3
"""Reorganize .spec/rfc into lifecycle folders, add frontmatter, fix links."""

from __future__ import annotations

import os
import re
from pathlib import Path

RFC_ROOT = Path(__file__).resolve().parent.parent / "rfc"

CHARTER = {"0001", "0002", "0003", "0004", "0005", "0057", "0058"}
IMPLEMENTED = {
    "0006", "0007", "0009", "0010", "0011", "0012", "0013", "0014",
    "0015", "0016", "0017", "0018", "0020", "0021", "0022",
}
PENDING = {"0046", "0047", "0048"}
READY = {"0008"}

LINK_PAT = re.compile(r"\]\(\./(\d{4}-[^)]+\.md)\)")


def rfc_num(name: str) -> str | None:
    m = re.match(r"^(\d{4})-", name)
    return m.group(1) if m else None


def tier_for(num: str) -> str:
    if num in READY:
        return "ready"
    if num in CHARTER:
        return "charter"
    if num in IMPLEMENTED:
        return "implemented"
    if num in PENDING:
        return "pending"
    return "proposed"


def add_frontmatter(text: str, num: str, tier: str) -> str:
    if text.startswith("---\n"):
        return text
    verified = "true" if num in READY else "false"
    unit = "full" if num in READY else ("partial" if num == "0008" else "none")
    e2e = "full" if num in READY else "none"
    fm = (
        "---\n"
        f'rfc: "{num}"\n'
        f"tier: {tier}\n"
        f"verified: {verified}\n"
        "browser_only: true\n"
        "tests:\n"
        f"  unit: {unit}\n"
        f"  e2e_playwright: {e2e}\n"
        "---\n\n"
    )
    text = text.replace("docs/rfc/", ".spec/rfc/")
    if num in IMPLEMENTED:
        text = re.sub(
            r"- \*\*Status\*\*: Implemented[^\n]*",
            "- **Status**: Implemented (unverified — see frontmatter `verified`)",
            text,
            count=1,
        )
    return fm + text


def fix_links(text: str, from_path: Path, index: dict[str, Path]) -> str:
    def repl(m: re.Match[str]) -> str:
        tnum = rfc_num(m.group(1))
        if not tnum or tnum not in index:
            return m.group(0)
        rel = os.path.relpath(index[tnum], from_path.parent).replace("\\", "/")
        return f"]({rel})"

    return LINK_PAT.sub(repl, text)


def main() -> None:
    for name in ("charter", "ready", "implemented", "proposed", "pending"):
        (RFC_ROOT / name).mkdir(parents=True, exist_ok=True)

    sources: list[Path] = []
    sources.extend(RFC_ROOT.glob("*.md"))
    sources.extend((RFC_ROOT / "pending").glob("*.md"))

    for p in list(sources):
        num = rfc_num(p.name)
        if not num or p.name in ("README.md", "_template.md"):
            continue
        dest = RFC_ROOT / tier_for(num) / p.name
        if p.resolve() != dest.resolve():
            dest.parent.mkdir(parents=True, exist_ok=True)
            if dest.exists():
                p.unlink()
            else:
                p.rename(dest)

    index: dict[str, Path] = {}
    for p in RFC_ROOT.rglob("*.md"):
        if p.name in ("README.md", "_template.md"):
            continue
        num = rfc_num(p.name)
        if num:
            index[num] = p

    for p in index.values():
        num = rfc_num(p.name)
        assert num
        text = p.read_text(encoding="utf-8")
        text = fix_links(text, p, index)
        text = add_frontmatter(text, num, tier_for(num))
        p.write_text(text, encoding="utf-8")

    print(f"Reorganized {len(index)} RFC files under {RFC_ROOT}")


if __name__ == "__main__":
    main()

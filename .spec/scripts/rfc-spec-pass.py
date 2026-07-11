#!/usr/bin/env python3
"""RFC spec pass: normalize §5/§6 implementation blocks (runtime model)."""

from __future__ import annotations

import re
from dataclasses import dataclass
from enum import Enum
from pathlib import Path

RFC_ROOT = Path(__file__).resolve().parent.parent / "rfc"


class RuntimeKind(str, Enum):
    ISOMORPHIC = "isomorphic"
    ENGINE_SINGLE = "engine_single"
    HYBRID_RUNNERS_ENGINE = "hybrid_runners_engine"
    HYBRID_RENDER_ENGINE = "hybrid_render_engine"
    EXTRACT_SINGLE = "extract_single"
    INSPECT_ENGINE = "inspect_engine"


@dataclass(frozen=True)
class ToolSpec:
    kind: RuntimeKind
    api: str
    cli: str
    vitest: str
    wasm: str
    isomorphic_pkg: str | None = None
    browser_pkg: str | None = None
    node_pkg: str | None = None


TOOL_SPECS: dict[str, ToolSpec] = {
    "0006-merge-pdf": ToolSpec(
        RuntimeKind.ISOMORPHIC,
        "`mergePdfs()`",
        "gopdf-cli merge",
        "packages/plugin-struct",
        "N/A (pdf-lib)",
        isomorphic_pkg="@gopdfjs/plugin-struct",
    ),
    "0007-split-pdf": ToolSpec(
        RuntimeKind.ISOMORPHIC,
        "split helpers",
        "gopdf-cli split",
        "packages/plugin-struct",
        "N/A",
        isomorphic_pkg="@gopdfjs/plugin-struct",
    ),
    "0009-rotate-pdf": ToolSpec(
        RuntimeKind.ISOMORPHIC,
        "rotate pages",
        "gopdf-cli rotate",
        "packages/plugin-struct",
        "N/A",
        isomorphic_pkg="@gopdfjs/plugin-struct",
    ),
    "0010-organize-pdf": ToolSpec(
        RuntimeKind.ISOMORPHIC,
        "reorder pages",
        "gopdf-cli organize",
        "packages/plugin-struct",
        "N/A",
        isomorphic_pkg="@gopdfjs/plugin-struct",
    ),
    "0011-crop-pdf": ToolSpec(
        RuntimeKind.ISOMORPHIC,
        "crop pages",
        "gopdf-cli crop",
        "packages/plugin-struct",
        "N/A",
        isomorphic_pkg="@gopdfjs/plugin-struct",
    ),
    "0012-edit-pdf": ToolSpec(
        RuntimeKind.ISOMORPHIC,
        "annotation edit",
        "gopdf-cli edit",
        "packages/plugin-annotate",
        "N/A",
        isomorphic_pkg="@gopdfjs/plugin-annotate",
    ),
    "0013-sign-pdf": ToolSpec(
        RuntimeKind.ISOMORPHIC,
        "image signature field",
        "gopdf-cli sign",
        "packages/plugin-struct",
        "N/A",
        isomorphic_pkg="@gopdfjs/plugin-struct",
    ),
    "0014-watermark-pdf": ToolSpec(
        RuntimeKind.ISOMORPHIC,
        "`watermarkPdf()`",
        "gopdf-cli watermark",
        "packages/plugin-struct",
        "N/A",
        isomorphic_pkg="@gopdfjs/plugin-struct",
    ),
    "0015-page-numbers": ToolSpec(
        RuntimeKind.ISOMORPHIC,
        "page numbers",
        "gopdf-cli page-numbers",
        "packages/plugin-struct",
        "N/A",
        isomorphic_pkg="@gopdfjs/plugin-struct",
    ),
    "0016-header-footer": ToolSpec(
        RuntimeKind.ISOMORPHIC,
        "header/footer",
        "gopdf-cli header-footer",
        "packages/plugin-struct",
        "N/A",
        isomorphic_pkg="@gopdfjs/plugin-struct",
    ),
    "0017-jpg-to-pdf": ToolSpec(
        RuntimeKind.HYBRID_RUNNERS_ENGINE,
        "`encodeImages` + pdf-lib assembly",
        "gopdf-cli jpg-to-pdf",
        "packages/plugin-struct + packages/engine",
        "Hybrid encode leg",
    ),
    "0018-pdf-to-jpg": ToolSpec(
        RuntimeKind.HYBRID_RENDER_ENGINE,
        "render + encode",
        "gopdf-cli pdf-to-jpg",
        "packages/engine (renderPage.ts internal)",
        "Hybrid",
    ),
    "0020-ocr-pdf": ToolSpec(
        RuntimeKind.ISOMORPHIC,
        "OCR pipeline",
        "gopdf-cli ocr",
        "packages/plugin-extract",
        "N/A (tesseract.js)",
        isomorphic_pkg="@gopdfjs/plugin-extract",
    ),
    "0021-protect-pdf": ToolSpec(
        RuntimeKind.ISOMORPHIC,
        "`protectPdf()`",
        "gopdf-cli protect",
        "packages/plugin-struct",
        "Web Crypto (Node + browser)",
        isomorphic_pkg="@gopdfjs/plugin-struct",
    ),
    "0022-unlock-pdf": ToolSpec(
        RuntimeKind.ISOMORPHIC,
        "`unlockPdf()`",
        "gopdf-cli unlock",
        "packages/plugin-struct",
        "N/A",
        isomorphic_pkg="@gopdfjs/plugin-struct",
    ),
    "0028-grayscale-pdf": ToolSpec(
        RuntimeKind.ENGINE_SINGLE,
        "`grayscalePdf()`",
        "gopdf-cli grayscale",
        "packages/engine",
        "Partial stub",
        isomorphic_pkg="@gopdfjs/engine",
    ),
    "0042-web-optimize": ToolSpec(
        RuntimeKind.ENGINE_SINGLE,
        "`linearizePdf()`",
        "gopdf-cli linearize",
        "packages/engine",
        "Partial stub",
        isomorphic_pkg="@gopdfjs/engine",
    ),
    "0035-extract-images": ToolSpec(
        RuntimeKind.EXTRACT_SINGLE,
        "image extract",
        "gopdf-cli extract-images",
        "packages/plugin-extract",
        "N/A (pdfjs)",
        isomorphic_pkg="@gopdfjs/plugin-extract",
    ),
    "0061-understand-pdf": ToolSpec(
        RuntimeKind.INSPECT_ENGINE,
        "metadata / analyze",
        "gopdf-cli inspect",
        "packages/plugin-inspect + packages/engine",
        "Planned `analyze_pdf`",
        isomorphic_pkg="@gopdfjs/plugin-inspect",
    ),
    "0008-compress-pdf": ToolSpec(
        RuntimeKind.ENGINE_SINGLE,
        "`compressPdf()`",
        "gopdf-cli compress",
        "packages/engine",
        "P1 Done",
        isomorphic_pkg="@gopdfjs/engine",
    ),
    "0019-pdf-to-word": ToolSpec(
        RuntimeKind.ENGINE_SINGLE,
        "`pdfToDocx()` (planned)",
        "gopdf-cli pdf-to-word",
        "packages/engine (planned)",
        "Not started",
        isomorphic_pkg="@gopdfjs/engine",
    ),
}

IMPL_STATUS_RE = re.compile(
    r"## \d+\. Implementation status \(2026-06-28\)\n\n"
    r"(?:\|[^\n]+\|\n)+"
    r"\n\*\*Verdict\*\*:[^\n]+\n",
    re.MULTILINE,
)

VERDICT = (
    "**Verdict**: {verdict} — OSS gate only ([`docs/PUBLISHING.md`](../../docs/PUBLISHING.md)). "
    "**Not** gated on `gopdf-cli` (separate repo)."
)

# Demo registry tools covered by apps/demo/e2e/tools/all-tools.spec.ts (not OCR).
E2E_ALL_TOOLS = {
    "0006-merge-pdf",
    "0007-split-pdf",
    "0009-rotate-pdf",
    "0010-organize-pdf",
    "0011-crop-pdf",
    "0012-edit-pdf",
    "0013-sign-pdf",
    "0014-watermark-pdf",
    "0015-page-numbers",
    "0016-header-footer",
    "0017-jpg-to-pdf",
    "0018-pdf-to-jpg",
    "0021-protect-pdf",
    "0022-unlock-pdf",
}

MERGE_RE = re.compile(
    r"^<<<<<<<<[^\n]*\n(?:.*?\n)*?========\n>>>>>>>>[^\n]*\n",
    re.MULTILINE,
)


def strip_merge_markers(text: str) -> str:
    return MERGE_RE.sub("", text)


def e2e_slug(stem: str) -> str:
    return re.sub(r"^\d{4}-", "", stem)


def implementation_block(stem: str, section: str = "6", e2e_done: bool | None = None) -> str:
    spec = TOOL_SPECS.get(stem)
    if e2e_done is None:
        e2e_done = stem in E2E_ALL_TOOLS
    slug = e2e_slug(stem)
    e2e_path = (
        "apps/demo/e2e/tools/all-tools.spec.ts"
        if stem in E2E_ALL_TOOLS
        else f"apps/demo/e2e/tools/{slug}.spec.ts"
    )
    e2e_state = "**Done**" if e2e_done else "**Not done**"

    if stem == "0008-compress-pdf":
        e2e_done = True
        e2e_state = "**Done**"
        e2e_path = "apps/demo/e2e/tools/compress.spec.ts"

    if not spec:
        spec = ToolSpec(
            RuntimeKind.ISOMORPHIC,
            "TBD",
            "gopdf-cli TBD",
            "packages/TBD",
            "TBD",
            isomorphic_pkg="@gopdfjs/TBD",
        )

    rows: list[str] = [
        "| Surface | Package | Runtime | State | Notes |",
        "|---------|---------|---------|-------|-------|",
    ]

    if spec.kind == RuntimeKind.ISOMORPHIC:
        rows.append(
            f"| **npm** | `{spec.isomorphic_pkg}` | isomorphic | **Partial** | {spec.api} — one pkg, Node + browser |"
        )
    elif spec.kind == RuntimeKind.ENGINE_SINGLE:
        state = "**Done** (P1)" if stem == "0008-compress-pdf" else (
            "**Not started**" if stem == "0019-pdf-to-word" else "**Partial**"
        )
        rows.append(
            f"| **npm** | `@gopdfjs/engine` | isomorphic (target) | {state} | {spec.api} — browser Worker today; Node in same pkg; split `-node` only if blocked |"
        )
    elif spec.kind == RuntimeKind.HYBRID_RUNNERS_ENGINE:
        rows.append(
            "| **npm** | `@gopdfjs/plugin-struct` | isomorphic | **Partial** | pdf-lib assembly — one pkg |"
        )
        rows.append(
            "| **npm** | `@gopdfjs/engine` | isomorphic (target) | **Partial** | `encodeImages` — one pkg with runners |"
        )
    elif spec.kind == RuntimeKind.HYBRID_RENDER_ENGINE:
        rows.append(
            "| **npm** | `@gopdfjs/engine` | isomorphic (target) | **Partial** | pdf.js render via adapter canvas (`renderPage.ts` internal) + WASM encode |"
        )
    elif spec.kind == RuntimeKind.EXTRACT_SINGLE:
        rows.append(
            f"| **npm** | `{spec.isomorphic_pkg}` | isomorphic (target) | **Not started** | {spec.api} — one pkg; pdfjs inside; split only if Node blocked |"
        )
    elif spec.kind == RuntimeKind.INSPECT_ENGINE:
        rows.append(
            f"| **npm** | `{spec.isomorphic_pkg}` | isomorphic | **Partial** | JS metadata until L1 lands |"
        )
        rows.append(
            "| **npm** | `@gopdfjs/engine` | isomorphic (target) | **Not started** | planned `analyzePdf()` in same engine pkg |"
        )

    rows.append(
        f"| **CLI** | `{spec.cli}` | node | **Out of repo** | [`gopdf-cli`](https://github.com/gopdfjs/gopdf-cli) — not OSS gate |"
    )
    rows.append(
        f"| **Rust / WASM** | — | — | {spec.wasm} | per RFC + [0057](completed/0057-rust-wasm-engine-architecture.md) |"
    )
    rows.append(
        f"| **Vitest** | — | — | **Partial** | `{spec.vitest}` |"
    )
    rows.append(
        f"| **Browser e2e** | — | browser | {e2e_state} | `{e2e_path}` |"
    )
    rows.append(
        "| **ilovepdf** | — | — | out of repo | consumes npm; not OSS gate |"
    )

    verdict = "**PARTIAL**"
    if stem == "0019-pdf-to-word":
        verdict = "**NOT STARTED** (L1)"
    elif stem == "0035-extract-images":
        verdict = "**NOT STARTED**"

    body = "\n".join(rows)
    return f"""## {section}. Implementation status (2026-06-28)

{body}

{VERDICT.format(verdict=verdict)}
"""


def replace_impl_status(text: str, stem: str, section: str = "6", e2e_done: bool | None = None) -> str:
    block = implementation_block(stem, section=section, e2e_done=e2e_done)
    if IMPL_STATUS_RE.search(text):
        return IMPL_STATUS_RE.sub(block, text, count=1)
    return text


def fix_0019_delivery(text: str) -> str:
    old = re.compile(
        r"## 3\. Delivery \(RFC 0058 §2\.2(?: / §2\.3)?\)\n\n"
        r"\| Surface \| Package(?: / entry)? \| (?:Runtime \| )?Notes \|\n"
        r"\|[-| ]+\|\n"
        r"(?:\|[^\n]+\|\n)+",
        re.MULTILINE,
    )
    new = """## 3. Delivery (RFC 0058 §2.2 / §2.3)

| Surface | Package | Runtime | Notes |
|---------|---------|---------|-------|
| **npm** | `@gopdfjs/engine` | isomorphic (target) | `pdfToDocx()` — one pkg; browser Worker + Node WASM; split `-node` only if blocked |
| **CLI** | `gopdf-cli pdf-to-word` | node | **Out of repo** | not OSS gate |
| **ilovepdf** | consumes npm | — | UI out of repo |

"""
    return old.sub(new, text, count=1)


def main() -> None:
    section_by_stem = {
        "0061-understand-pdf": "5",
        "0035-extract-images": "5",
        "0019-pdf-to-word": "9",
    }

    for path in sorted(RFC_ROOT.rglob("*.md")):
        if path.name.startswith("_template"):
            continue
        stem = path.stem
        if stem not in TOOL_SPECS and stem not in ("0019-pdf-to-word",):
            continue
        if "Implementation status (2026-06-28)" not in path.read_text(encoding="utf-8"):
            if stem != "0019-pdf-to-word":
                continue

        text = path.read_text(encoding="utf-8")
        original = text
        text = strip_merge_markers(text)

        section = section_by_stem.get(stem, "6")

        if "Implementation status (2026-06-28)" in text:
            text = replace_impl_status(text, stem, section=section)
        elif stem == "0019-pdf-to-word":
            text = text.rstrip() + "\n\n" + implementation_block(stem, section="9")

        if stem == "0019-pdf-to-word":
            text = fix_0019_delivery(text)

        if text != original:
            path.write_text(text, encoding="utf-8")
            print(f"updated {path.relative_to(RFC_ROOT.parent)}")


if __name__ == "__main__":
    main()

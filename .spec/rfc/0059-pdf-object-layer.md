# RFC 0059 - PDF Object Layer

- **Status**: Proposed
- **Author**: GoPDF maintainers
- **Date**: 2026-07-11
- **Split from**: [RFC 0058](completed/0058-engine-plugin-charter.md) §5 — parent was mono RFC; implementation split on close

## 1. Objective

Self-built PDF object layer in `crates/gopdf-*` (xref-as-index, lazy objects, incremental write-back, size budget). **Not** lopdf.

Unlocks:

| Blocked work | RFC |
|--------------|-----|
| Image re-encode in compress | [0008](0008-compress-pdf.md) P2 |
| Full WASM grayscale | [0028](0028-grayscale-pdf.md) |
| Full WASM linearize | [0042](0042-web-optimize.md) |
| `analyze_pdf` WASM op | [0061](0061-understand-pdf.md) L1 |

## 2. Milestones

| Item | Status |
|------|--------|
| `pdf/xref.rs` + `parser.rs` + `writer.rs` | Not started |
| RFC 0008 P2 image re-encode | Blocked |
| RFC 0061 `analyze_pdf` WASM | Planned |

## 3. Non-goals

- Full PDF reader / print color management
- Replacing pdf-lib for L3 struct tools

## 4. Related

- [RFC 0058](completed/0058-engine-plugin-charter.md) — closed charter; architecture accepted
- [RFC 0057](completed/0057-rust-wasm-engine-architecture.md) — WASM build + `GopdfEngine`
- [TASK_TRACKING.md](../TASK_TRACKING.md) — P2 WASM depth

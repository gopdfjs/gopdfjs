# Rust workspace (`crates/`)

Host-testable PDF algorithms in **`crates/gopdf-*`** (`rlib` only).

**WASM bindgen + npm artifacts** live in **`@gopdfjs/wasm`** (`packages/wasm/`):

| Path | Role |
|------|------|
| `packages/wasm/rust/` | `gopdf-wasm` cdylib — wasm-bindgen exports → `crates/gopdf-*` |
| `packages/wasm/pkg/` | single wasm-pack `--target web` build; **one** `.wasm` + glue |

One shared `.wasm`; adapters decide init: browser `init()` fetches the co-located binary, Node feeds `.wasm` bytes to the same `init()`. No per-host JS duplication.

`packages/engine/` is **JavaScript only**. Adapters **init** `@gopdfjs/wasm` (shared binary); engine builds runtime from adapter ports.

## Commands

```bash
cargo test --workspace              # Rust unit tests (crates + packages/wasm/rust)
pnpm build:wasm                     # → pnpm --filter=@gopdfjs/wasm build:wasm
pnpm --filter=@gopdfjs/wasm build:wasm
```

Use rustup (`~/.cargo/bin` on `PATH`); Homebrew `rustc` alone lacks `wasm32-unknown-unknown`.

## Adding a new L1 capability

1. Create `crates/gopdf-<feature>/` with algorithm + `#[cfg(test)]`.
2. Register in root `Cargo.toml` `[workspace].members` and `[workspace.dependencies]`.
3. Wire export in `packages/wasm/rust/src/lib.rs`; `pnpm build:wasm`.
4. Update RFC 0057 §5.3 and 0058 §4.

# Rust workspace (`crates/`)

All PDF algorithms live in **`crates/gopdf-*`** as host-testable `rlib` crates.  
**`crates/gopdf-wasm`** is the only `cdylib` (wasm-bindgen); build it from the **repo root**.

## Layout

| Crate | Role |
|-------|------|
| `gopdf-compress` | RFC 0008 Phase 1 |
| `gopdf-image` | RFC 0017 / 0018 / 0028 |
| `gopdf-linearize` | RFC 0042 |
| `gopdf-wasm` | Thin WASM exports → delegates to `gopdf-*` |

`packages/engine/` is **JavaScript only** (Worker + thin proxy). **Do not** add `Cargo.toml` or `.rs` files there.

## Commands (always from repo root)

```bash
cargo test --workspace          # Rust unit tests (all gopdf-* + gopdf-wasm rlib)
pnpm build:wasm                 # wasm-pack → packages/engine/pkg/
```

`wasm-pack` must target **`crates/gopdf-wasm`** with output **`../../packages/engine/pkg/`** (from crate root; use `pnpm build:wasm` at repo root).
Use rustup (`~/.cargo/bin` on `PATH`); Homebrew `rustc` alone lacks `wasm32-unknown-unknown`.

## Adding a new L1 capability

1. Create `crates/gopdf-<feature>/` with algorithm + `#[cfg(test)]`.
2. Register in root `Cargo.toml` `[workspace].members` and `[workspace.dependencies]`.
3. Wire export in `crates/gopdf-wasm/src/lib.rs` + `packages/engine/worker.ts` + `index.ts`.
4. Update RFC 0057 §5.2 and 0058 §4.

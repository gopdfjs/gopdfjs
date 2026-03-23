# RFC 0057 - Rust/WASM Web Worker Architecture

- **Status**: Accepted
- **Author**: Antigravity (revised for `@gopdfjs` + Vite)
- **Date**: 2026-03-21

## 1. Objective

定义 GoPDF 中 **Rust → WebAssembly → ES module Web Worker** 的标准构建与运行时集成方式。所有选择 WASM 加速的工具以本节与 **§6 决策矩阵** 为准。

**库目标与分层**见 **RFC 0058**（WASM PDF library charter）。

## 2. Why Rust/WASM (and When Not To)

### When WASM wins

浏览器 JS 单线程且受 GC 影响。对 **大字节缓冲** 的流重压缩、整册图像遍历、对象图重写等，Rust WASM 在线性内存上更可预测。

### When to stay with JavaScript

若瓶颈是 **I/O、交互或算法复杂度** 而非原始吞吐量，保留 **pdf-lib** / **pdf.js**。矩阵见 §6。

### SubtleCrypto exception

密码学操作使用浏览器 **`SubtleCrypto`**（硬件加速）；不要用 WASM 重造 AES。

## 3. Package structure

Workspace 包名：**`@gopdfjs/pdf-wasm`**。

```
packages/pdf-wasm/
  src/
    lib.rs          # wasm-bindgen 导出（compress_pdf, encode_images, grayscale_pdf, linearize_pdf）
    compress.rs
    image_ops.rs
    linearize.rs
    utils.rs
  Cargo.toml
  pkg/              # wasm-pack 生成（gitignore）
  worker.ts         # Worker：import pkg，路由 { id, op, payload }
  index.ts          # 主线程：单例 Worker + Promise + 进度事件
  package.json      # "name": "@gopdfjs/pdf-wasm"
```

## 4. Build pipeline

### 4.1 Prerequisites

```bash
rustup target add wasm32-unknown-unknown
# wasm-pack: https://rustwasm.github.io/wasm-pack/installer/
```

### 4.2 Build（仓库根目录）

```bash
pnpm --filter=@gopdfjs/pdf-wasm build:wasm
# 或 release 等同：wasm-pack build --target web --out-dir pkg --release
```

`--target web` 产出 ES module，供 Worker `import` 使用。

### 4.3 Vite 消费方配置（`site/`、`demos/react/`）

宿主应用为 **Vite + React**，不再使用 Next/Turbopack。消费 `@gopdfjs/pdf-wasm` 时在应用的 `vite.config.ts` 中：

- 使用 **`vite-plugin-wasm`** 与 **`vite-plugin-top-level-await`**（与 `pdf-wasm` 包内 library build 一致）。
- **`optimizeDeps.exclude`** 中包含 `@gopdfjs/pdf-wasm`，避免预打包破坏 Worker + `.wasm` 解析。
- **`worker.format: 'es'`**，并在 `worker.plugins` 中重复挂载 wasm / top-level-await 插件。
- 若需从 workspace 读取 `pkg/*.wasm`，为 `server.fs.allow` 配置 monorepo 根（见 `demos/react/vite.config.ts`）。

**canvas**：pdf.js 在浏览器侧仍需 stub 时，在应用 Vite 配置 `resolve.alias` 指向本地 `canvas-stub.ts`（与旧 Next 别名目的相同）。

### 4.4 `package.json`（节选）

```json
{
  "name": "@gopdfjs/pdf-wasm",
  "type": "module",
  "main": "./index.ts",
  "exports": {
    ".": "./index.ts",
    "./worker": "./worker.ts"
  }
}
```

## 5. Worker integration（与当前实现一致）

### 5.1 Worker 协议

- **Host → Worker**：`{ id: number, op: string, payload: object }`，`ArrayBuffer` 列在 `transfer` 中。
- **Worker → Host**：
  - 进度：`{ id, ok: true, progress: number }`（0–1）
  - 完成：`{ id, ok: true, result: Uint8Array }`，`transfer: [result.buffer]`
  - 失败：`{ id, ok: false, error: string }`

### 5.2 已实现的 `op` 与 Rust 符号

| `op` | Rust | 说明 |
|------|------|------|
| `compress` | `compress_pdf` | RFC 0008 |
| `encode_images` | `encode_images` | 多帧 RGBA → JPEG/PNG，长度前缀打包 |
| `grayscale` | `grayscale_pdf` | RFC 0028 |
| `linearize` | `linearize_pdf` | RFC 0042 |

源码以仓库中 `packages/pdf-wasm/worker.ts`、`packages/pdf-wasm/src/lib.rs` 为准。

### 5.3 主机 API（`index.ts`）

应用侧只依赖公开函数，不直接管理 Worker 生命周期：

```ts
import {
  compressPdf,
  encodeImages,
  splitEncodedImages,
  grayscalePdf,
  linearizePdf,
} from "@gopdfjs/pdf-wasm";

// 压缩（支持进度）
const out = await compressPdf(bytes, "recommended", (f) => {
  console.log(Math.round(f * 100), "%");
});

// 多帧 RGBA 编码；再用 splitEncodedImages 拆包
const packed = await encodeImages(pixelsFlat, widths, heights, "jpeg", 92);
const parts = splitEncodedImages(packed);
```

**禁止**在文档中引用尚未实现的 Worker 操作名（如 `images_to_pdf`、`pdf_to_images`）作为当前 API；若新增，须先落地代码再改 RFC。

## 6. Tool decision matrix

| RFC | Tool | Decision | Reason |
|-----|------|----------|--------|
| 0008 | Compress PDF | **Rust/WASM** | Flate 流重压缩；`compressPdf` |
| 0017 | JPG to PDF | **Hybrid** | 产品侧 pdf-lib 组版常见；**批量 JPEG/PNG 重编码**用 `encodeImages`（Worker）。整册 Rust 侧 PDF mux **未在 crate 中** 前，不得写「单一 `imagesToPdf`」为已实现 API。 |
| 0018 | PDF to JPG | **Hybrid** | **渲染** pdfjs；**出图编码**用 `encodeImages` 替代大规模 `canvas.toBlob`。 |
| 0028 | Grayscale PDF | **Rust/WASM** | `grayscalePdf` |
| 0042 | Web Optimize | **Rust/WASM** | `linearizePdf`；pdf-lib 不做 linearization |
| 0006 | Merge PDF | **JS (pdf-lib)** | 结构合并，非 CPU 热点 |
| 0007 | Split PDF | **JS (pdf-lib)** | 同上 |
| 0019 | PDF to Word | **Rust/WASM 优先** | **L1**：`pdf_to_docx`（`packages/pdf-wasm`）；Worker 仅编排与进度。见 **RFC 0019** |
| 0020 | OCR PDF | **JS (tesseract.js)** | 已有 WASM |
| 0021 | Protect PDF | **JS (SubtleCrypto)** | 硬件加速 |
| all others | Various | **JS** | 无充分证据前不升 WASM |

## 7. Progress reporting

长任务在 Worker 内多次 `postMessage` 进度；主机 `index.ts` 根据是否带 `result` 区分进度与完成（当前 `compress` 路径已支持）。

## 8. Testing strategy

- Rust：`wasm-bindgen-test` / `wasm-pack test`（按需）。
- 前端：`demos/react` 提供 pdf.js 与 `@gopdfjs/pdf-wasm` 的最小对照；集成测试可用 Vitest + Mock Worker。
- 微基准：Rust `criterion`；端到端：`performance.now()`。

## 9. Success criteria

- [x] `wasm-pack build` 成功生成 `pkg/`
- [ ] Worker 处理 10 MB 级 PDF 稳定（按工具覆盖）
- [ ] 压缩等工具相对纯 JS 路径明显降延迟（以产品页实测为准）
- [ ] WASM 处理期间主线程无明显卡顿
- [ ] `pdf_wasm_bg.wasm` gzip 后体积目标 &lt; 1 MB（持续监控）

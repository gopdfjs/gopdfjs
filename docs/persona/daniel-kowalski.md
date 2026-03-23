# Daniel Kowalski — Rust & WebAssembly（GoPDF L1）

**Daniel Kowalski** 是 GoPDF 在 **Rust 与 WebAssembly** 方向的责任专家：`wasm-bindgen`、`wasm-pack`、浏览器内 **实例化成本、包体大小、Worker 与线程模型**；以及 PDF 相关 Rust 依赖（如 `lopdf`、流/图像栈）的 **选型与边界**。

## 职责

- 维护 **L1** 契约：输入/输出 buffer、`op` 名、错误码、是否可转移；与 **RFC 0057** Worker 协议一致。
- 推动 **可拆分 wasm 产物**（按能力族），避免单一巨型模块拖累首包；`pkg/` 不入库，构建与仓库约定一致。
- **安全与可审计**：`unsafe` 仅在有理由处使用；对外 API **明确所有权**（谁释放 buffer、是否可转移）；避免在 JS 与 WASM 间 **隐式复制大数组**。

## 与 Linus Torvalds 的协作

- **Linus Torvalds** 从 **合并门槛与长期维护** 挑战大改动与抽象；Daniel 负责 **实现与选型**。二者互补：实现 vs.「该不该合、该不该拆」。

## 与 Albert Li 的协作

- **Albert Li** 为 GoPDF 总责；**Daniel Kowalski** 在 Rust/WASM 实现上提供深度结论，与 Albert 对齐。

## 与 Maya Okonkwo 的协作

- Daniel 实现 **字节层与性能**；Maya 确认 **PDF 语义与有损/无损**。
- 若「上云」能换性能，先列出 **纯本地方案** 与 **披露后的云方案**，默认不假设上传。

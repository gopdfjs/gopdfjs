# Maya Okonkwo — PDF & document engines（GoPDF）

**Maya Okonkwo** 是 GoPDF 在 **PDF 与浏览器内文档处理** 方向的责任专家：ISO 32000 常见子集、对象模型、流与过滤器、线性化、页树与资源字典；以及 **在用户设备上** 的边界（`ArrayBuffer`、Worker、内存与大文件体验）。

## 职责

- 定 **工具语义**：何种操作为无损/有损、失败时用户看到什么、加密与损坏文件如何处理（不静默丢数据）。
- 定 **分层**：预览与渲染走 **pdf.js**；轻量结构编辑走 **pdf-lib** 一类路径；重缓冲与算力走 **Rust WASM + Worker**（对齐 RFC 0057 / 0058）。
- 定 **隐私默认**：用户 PDF **默认不上传**至 GoPDF 自有服务；若设计中出现上传或第三方 API，必须能说出 **目的、保留期、最小化**，并在 RFC/产品中可审计。

## 与 Albert Li 的协作

- **Albert Li** 为 GoPDF 总责；**Maya Okonkwo** 在 PDF 语义与工具行为上提供深度结论，与 Albert 对齐。

## 与 Daniel Kowalski 的协作

- Maya 给出 **PDF 是否正确、是否允许、错误语义**；Daniel 给出 **Rust/WASM 是否合适、API 与体积**。
- 冲突时以 **数据不离开浏览器** 为默认，除非产品书面例外。

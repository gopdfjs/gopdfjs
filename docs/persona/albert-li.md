# Albert Li — GoPDF

**Albert Li** 是 **GoPDF** 的负责人与产品/隐私上的最终责任人：方向为 **完全浏览器端处理 PDF、默认不上传、隐私优先**。PDF 深度与 Rust/WASM 深度分别由 **[Maya Okonkwo](./maya-okonkwo.md)**、**[Daniel Kowalski](./daniel-kowalski.md)** 主笔；**[Linus Torvalds](./linus-torvalds.md)** 在**大规模或破坏性**底层改动上提供 **系统层与维护者视角** 的评审参考。Albert 与前三者对齐并拍板。

## 职责（总责）

- **北极星**：隐私、工具矩阵与 RFC 级承诺一致。
- **拍板**：PDF 与 WASM 分工争议时的最终产品决策（与 Maya、Daniel 协作）。

## PDF 与浏览器文档（与 Maya 对齐）

- 工具语义、分层、隐私默认的 **细节** 见 **Maya Okonkwo**；Albert 确保与 GoPDF 承诺一致。

## Rust / WASM（与 Daniel 对齐）

- L1 **crate、wasm、Worker** 的 **细节** 见 **Daniel Kowalski**；Albert 确保与 RFC 0057/0058、产品承诺一致。

## 决策顺序（自问）

1. 数据是否离开本机？  
2. 这一步落在 JS、Worker 还是 WASM（见 0057 矩阵）？  
3. 与隐私冲突时：**默认不上传**，除非产品书面例外。

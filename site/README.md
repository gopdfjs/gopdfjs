# @gopdfjs/site

GoPDF.js 官网与示例站：**从 [wsxjs/site](https://github.com/wsxjs/wsxjs/tree/main/site) 完整同步**后改为 **GoPDF** 品牌与仓库链接，依赖全部使用 npm 上的 `@wsxjs/*`（无 wsxjs monorepo 源码 alias）。

## 栈

- WSX（`.wsx`）+ `@wsxjs/wsx-vite-plugin` + UnoCSS + `wsx-press` 文档
- i18next + `@wsxjs/wsx-i18next`，多语言 JSON 在 `public/locales/`
- EditorJS / Marked / SlideJS / CalendarJS 等示例与上游 site 一致

## 根元素

- 自定义元素标签名：`gopdf-app`（原 `wsx-app`）

## GitHub Pages

- 默认子路径：`/gopdf/`（`GOPDF_PAGES_BASE` 可覆盖）
- `build:pages` / `build:pages:domain` 与 monorepo 根脚本一致

```bash
pnpm install
pnpm --filter=@gopdfjs/site dev
pnpm --filter=@gopdfjs/site build
pnpm --filter=@gopdfjs/site build:pages
```

## 与上游同步

若需再次对齐 wsxjs 官网，可在本机执行（注意先提交或备份）：

```bash
rsync -a --delete \
  --exclude node_modules --exclude dist --exclude .turbo --exclude .wsx-press \
  /path/to/wsxjs/site/ ./site/
```

然后重新应用本目录内的 **GoPDF 品牌化** 与 **`vite.config.ts`（npm 依赖、无 alias）** 等补丁。

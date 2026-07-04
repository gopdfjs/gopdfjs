import { describe, it, expect } from "vitest";
import { markdownToHtml, MARKDOWN_STYLE } from "../markdownToPdf";

describe("markdownToHtml", () => {
  it("renders GFM tables, task lists, code, and strikethrough", async () => {
    const html = await markdownToHtml(`| A | B |
| - | - |
| 1 | 2 |

- [x] done
- [ ] todo

\`\`\`js
console.log("hi");
\`\`\`

~~strike~~`);

    expect(html).toMatch(/<table/i);
    expect(html).toMatch(/type="checkbox"/);
    expect(html).toMatch(/<code/);
    expect(html).toMatch(/<del>/);
  });

  it("strips script smuggled via raw HTML in Markdown", async () => {
    const html = await markdownToHtml('<script>alert(1)</script>\n\n# Safe');
    expect(html).not.toMatch(/<script/i);
    expect(html).toContain("<h1");
  });

  it("wraps compiled body in markdown-body container with base style", async () => {
    const html = await markdownToHtml("# Hello");
    expect(html).toContain('class="markdown-body"');
    expect(html).toContain(MARKDOWN_STYLE.trim().slice(0, 20));
    expect(html).toContain("<h1");
  });
});

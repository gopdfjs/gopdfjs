import { describe, it, expect } from "vitest";
import {
  DEFAULT_OPTIONS,
  findCutLine,
  pageGeometry,
  sanitizeHtml,
  MAX_PAGES,
} from "../htmlToPdf";

describe("sanitizeHtml", () => {
  it("strips script, iframe, and inline handlers", () => {
    const out = sanitizeHtml(
      `<p onclick="alert(1)">Hi</p><script>alert('x')</script><iframe></iframe>`,
    );
    expect(out).not.toMatch(/<script|<iframe|onclick/i);
    expect(out).toContain("Hi");
  });

  it("preserves safe formatting tags", () => {
    const out = sanitizeHtml("<h1>Title</h1><p><strong>Bold</strong></p><style>h1{color:red}</style>");
    expect(out).toContain("<h1>");
    expect(out).toContain("<strong>");
    expect(out).toContain("<style>");
  });
});

describe("pageGeometry", () => {
  it("computes A4 portrait content box with normal margins", () => {
    const geo = pageGeometry({ ...DEFAULT_OPTIONS, pageSize: "a4", orientation: "portrait", margin: "normal" });
    expect(geo.widthPt).toBeCloseTo(595.28, 1);
    expect(geo.marginPt).toBe(42.5);
    expect(geo.contentWidthPx).toBeGreaterThan(600);
    expect(geo.contentHeightPx).toBeGreaterThan(900);
  });

  it("swaps dimensions for landscape letter wide margin", () => {
    const portrait = pageGeometry({ ...DEFAULT_OPTIONS, pageSize: "letter", orientation: "portrait", margin: "wide" });
    const landscape = pageGeometry({ ...DEFAULT_OPTIONS, pageSize: "letter", orientation: "landscape", margin: "wide" });
    expect(landscape.widthPt).toBeCloseTo(portrait.heightPt, 0);
    expect(landscape.marginPt).toBe(72);
  });

  it("uses full page width when margin is none", () => {
    const geo = pageGeometry({ ...DEFAULT_OPTIONS, margin: "none" });
    expect(geo.marginPt).toBe(0);
    expect(geo.contentWidthPt).toBe(geo.widthPt);
  });
});

describe("findCutLine", () => {
  it("prefers the nearest uniform row within the scan band", () => {
    const uniformRows = new Set([98, 99]);
    expect(findCutLine((y) => uniformRows.has(y), 100, 40)).toBe(99);
  });

  it("falls back to targetY when no uniform row exists", () => {
    expect(findCutLine(() => false, 200, 40)).toBe(200);
  });

  it("never returns below zero", () => {
    expect(findCutLine(() => false, 10, 40)).toBe(10);
  });
});

describe("MAX_PAGES", () => {
  it("caps output at 50 pages per RFC", () => {
    expect(MAX_PAGES).toBe(50);
  });
});

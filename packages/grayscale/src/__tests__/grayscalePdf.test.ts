import { describe, it, expect, vi, beforeEach } from "vitest";
import { grayscalePdf } from "../grayscalePdf";
import { GRAYSCALE_MODE } from "../constants";

const mockPage = {};
const mockGetPage = vi.fn().mockResolvedValue(mockPage);
const mockLoadPdf = vi.fn().mockResolvedValue({
  numPages: 2,
  getPage: mockGetPage,
});

vi.mock("@gopdfjs/render", () => ({
  loadPdfFromFile: (...args: unknown[]) => mockLoadPdf(...args),
}));

const mockRasterize = vi.fn().mockResolvedValue({
  jpegBytes: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]),
  widthPt: 200,
  heightPt: 200,
});

vi.mock("../rasterizeGrayscalePage", () => ({
  rasterizeGrayscalePage: (...args: unknown[]) => mockRasterize(...args),
}));

const mockSave = vi.fn();
const mockEmbedJpg = vi.fn();
const mockAddPage = vi.fn();
const mockDrawImage = vi.fn();

vi.mock("pdf-lib", async (importOriginal) => {
  const actual = await importOriginal<typeof import("pdf-lib")>();
  return {
    ...actual,
    PDFDocument: {
      ...actual.PDFDocument,
      create: vi.fn().mockImplementation(async () => ({
        embedJpg: mockEmbedJpg.mockResolvedValue({ width: 200, height: 200 }),
        addPage: mockAddPage.mockReturnValue({ drawImage: mockDrawImage }),
        save: mockSave.mockResolvedValue(new Uint8Array([37, 80, 68, 70, 45])),
      })),
    },
  };
});

function createMockPdf(): File {
  return new File([new Uint8Array([1, 2, 3])], "mock.pdf", { type: "application/pdf" });
}

describe("grayscalePdf", () => {
  beforeEach(() => {
    mockGetPage.mockClear();
    mockLoadPdf.mockClear();
    mockRasterize.mockClear();
    mockSave.mockClear();
    mockEmbedJpg.mockClear();
    mockAddPage.mockClear();
    mockDrawImage.mockClear();
  });

  it("converts a mock PDF preserving page count", async () => {
    const file = createMockPdf();
    const result = await grayscalePdf(file, { mode: GRAYSCALE_MODE.GRAYSCALE });

    expect(mockLoadPdf).toHaveBeenCalledWith(file);
    expect(mockGetPage).toHaveBeenCalledTimes(2);
    expect(mockRasterize).toHaveBeenCalledTimes(2);
    expect(mockEmbedJpg).toHaveBeenCalledTimes(2);
    expect(result.inputPages).toBe(2);
    expect(result.outputPages).toBe(2);
    expect(result.outputBytes).toBeGreaterThan(0);
  });

  it("reports progress per page", async () => {
    const file = createMockPdf();
    const progress: Array<{ current: number; total: number }> = [];
    await grayscalePdf(file, { mode: GRAYSCALE_MODE.BW }, (current, total) => {
      progress.push({ current, total });
    });

    expect(progress).toEqual([
      { current: 1, total: 2 },
      { current: 2, total: 2 },
    ]);
  });
});

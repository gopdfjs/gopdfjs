import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { DemoKind } from "../../src/config/demoKind";
import { TOOL_REGISTRY } from "../../src/config/tools";
import { PDF_FIXTURES } from "@gopdfjs/fixtures";
import { DEMO_PASSWORD_DEFAULT } from "../../src/hooks/useToolDemo";

const E2E_DIR = path.dirname(fileURLToPath(import.meta.url));
const ONE_PX_PNG = path.join(E2E_DIR, "../fixtures/one-pixel.png");
const PROTECTED_PDF_PATH = path.join(E2E_DIR, "../.tmp-protected.pdf");

async function prepareUnlockInput(page: Page): Promise<string> {
  await page.goto("/tools/protect");
  await page.locator('input[type="file"]').first().setInputFiles(PDF_FIXTURES.BMAUPIN_BASIC);
  await page.getByTestId("tool-run").click();
  await expect(page.getByTestId("tool-success")).toBeVisible({ timeout: 120_000 });

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download output" }).click();
  const download = await downloadPromise;
  await download.saveAs(PROTECTED_PDF_PATH);
  return PROTECTED_PDF_PATH;
}

async function seedToolInput(page: Page, tool: (typeof TOOL_REGISTRY)[number]): Promise<void> {
  switch (tool.demoKind) {
    case "merge":
      await page.locator('input[type="file"]').setInputFiles([
        PDF_FIXTURES.BMAUPIN_BASIC,
        PDF_FIXTURES.BMAUPIN_MINIMAL,
      ]);
      await expect(page.getByTestId("file-chip-list")).toBeVisible();
      break;

    case "jpg-to-pdf":
      await page.locator('input[type="file"]').setInputFiles(ONE_PX_PNG);
      await expect(page.getByTestId("file-chip-list")).toBeVisible();
      break;

    case "html-to-pdf":
    case "markdown-to-html":
      await expect(page.getByTestId("tool-text-source")).toBeVisible();
      break;

    case "password-pdf":
      await page.locator('input[type="file"]').first().setInputFiles(PDF_FIXTURES.BMAUPIN_BASIC);
      await expect(page.getByText("PDF loaded")).toBeVisible();
      break;

    default:
      await page.locator('input[type="file"]').first().setInputFiles(PDF_FIXTURES.BMAUPIN_BASIC);
      await expect(page.getByText("PDF loaded")).toBeVisible();
  }
}

/** Assert demo UI shows feature-shaped output — not just a generic success string. */
async function assertDemoOutput(
  page: Page,
  demoKind: DemoKind,
  timeoutMs: number,
): Promise<void> {
  switch (demoKind) {
    case "pdf-transform":
      await expect(page.getByTestId("pdf-compare-preview")).toBeVisible({ timeout: timeoutMs });
      await expect(page.getByTestId("pdf-preview-before")).toBeVisible({ timeout: timeoutMs });
      await expect(page.getByTestId("pdf-preview-after")).toBeVisible({ timeout: timeoutMs });
      break;
    case "merge":
    case "jpg-to-pdf":
    case "html-to-pdf":
    case "password-pdf":
      await expect(page.getByTestId("pdf-preview-after")).toBeVisible({ timeout: timeoutMs });
      break;
    case "sign-pdf":
      await expect(page.getByTestId("pdf-compare-preview")).toBeVisible({ timeout: timeoutMs });
      await expect(page.getByTestId("pdf-preview-before")).toBeVisible({ timeout: timeoutMs });
      await expect(page.getByTestId("pdf-preview-after")).toBeVisible({ timeout: timeoutMs });
      break;
    case "pdf-to-jpeg":
      await expect(page.getByTestId("image-thumb-grid")).toBeVisible({ timeout: timeoutMs });
      break;
    case "extract-images":
      await expect(page.getByTestId("image-result")).toBeVisible({ timeout: timeoutMs });
      break;
    case "pdf-to-text":
    case "markdown-to-html":
      await expect(page.getByTestId("tool-text-output")).toBeVisible({ timeout: timeoutMs });
      break;
    case "json-export":
      await expect(page.getByTestId("tool-json-output")).toBeVisible({ timeout: timeoutMs });
      break;
    case "blob-export":
      await expect(page.getByRole("button", { name: "Download output" })).toBeVisible({
        timeout: timeoutMs,
      });
      break;
  }
}

for (const tool of TOOL_REGISTRY) {
  if (tool.id === "compress") continue;

  test.describe(`RFC browser — ${tool.id}`, () => {
    test(`${tool.label} → demo input + feature output`, async ({ page }) => {
      test.setTimeout(tool.e2eTimeoutMs ?? 120_000);

      if (tool.id === "unlock") {
        const protectedPdf = await prepareUnlockInput(page);
        await page.goto(tool.path);
        await expect(page.getByRole("heading", { name: tool.label, exact: true })).toBeVisible();
        await page.locator('input[type="file"]').first().setInputFiles(protectedPdf);
        await page.getByTestId("tool-password").fill(DEMO_PASSWORD_DEFAULT);
      } else {
        await page.goto(tool.path);
        await expect(page.getByRole("heading", { name: tool.label, exact: true })).toBeVisible();
        await seedToolInput(page, tool);
      }

      await page.getByTestId("tool-run").click();
      await expect(page.getByTestId("tool-success")).toBeVisible({
        timeout: tool.e2eTimeoutMs ?? 120_000,
      });
      await expect(page.getByTestId("tool-error")).toHaveCount(0);
      await assertDemoOutput(page, tool.demoKind, tool.e2eTimeoutMs ?? 120_000);
    });
  });
}

import { expect, test } from "@playwright/test";
import { PDF_FIXTURES } from "@gopdfjs/fixtures";

test.describe("RFC 0008 — Compress PDF (browser)", () => {
  test("upload → compress → stats visible", async ({ page }) => {
    await page.goto("/tools/compress");
    await expect(page.getByRole("heading", { name: "Compress PDF" })).toBeVisible();

    await page.locator('input[type="file"]').setInputFiles(PDF_FIXTURES.BMAUPIN_BASIC);
    await expect(page.getByTestId("pdf-preview-before")).toBeVisible();
    await page.getByRole("button", { name: "Compress", exact: true }).click();

    await expect(page.getByText("Before:")).toBeVisible({ timeout: 90_000 });
    await expect(page.getByText("After:")).toBeVisible();
    await expect(page.getByTestId("pdf-preview-before")).toBeVisible();
    await expect(page.getByTestId("pdf-preview-after")).toBeVisible({ timeout: 90_000 });
    await expect(page.getByRole("button", { name: "Download compressed PDF" })).toBeVisible();
  });
});

import { expect, test } from "@playwright/test";
import { PDF_FIXTURES } from "@gopdfjs/fixtures";

test.describe("Engine smoke — byte reuse pressure", () => {
  test("upload → analyzePdf → grayscale → compress → linearize on same fixture", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Engine smoke" })).toBeVisible();

    await page.locator('input[type="file"]').setInputFiles(PDF_FIXTURES.BMAUPIN_BASIC);
    await expect(page.getByText("PDF loaded")).toBeVisible();

    await page.getByRole("button", { name: /analyzePdf/i }).click();
    await expect(page.getByText("Pages", { exact: false })).toBeVisible({ timeout: 60_000 });

    await page.getByRole("button", { name: /grayscale/i }).click();
    await expect(page.getByText("Duration", { exact: false })).toBeVisible({ timeout: 120_000 });

    await page.getByRole("button", { name: /compress/i }).first().click();
    await expect(page.getByText("Duration", { exact: false })).toBeVisible({ timeout: 120_000 });

    await page.getByRole("button", { name: /linearize/i }).click();
    await expect(page.getByText("Duration", { exact: false })).toBeVisible({ timeout: 120_000 });

    const log = page.locator(".log-panel");
    await expect(log).not.toContainText("error", { timeout: 5_000 });
    await expect(log).not.toContainText("detached", { timeout: 5_000 });
  });
});

import { expect, test } from "@playwright/test";
import path from "node:path";

const FIXTURE = path.join(
  process.cwd(),
  ".spec/e2e/fixtures/flate-sample.pdf",
);

test.describe("RFC 0008 — Compress PDF (browser-only)", () => {
  test("upload → compress → stats visible", async ({ page }) => {
    await page.goto("/tools/compress");
    await expect(page.getByRole("heading", { name: "Compress PDF" })).toBeVisible();

    await page.locator('input[type="file"]').setInputFiles(FIXTURE);
    await page.getByRole("button", { name: "Compress", exact: true }).click();

    await expect(page.getByText("Before:")).toBeVisible({ timeout: 90_000 });
    await expect(page.getByText("After:")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Download compressed PDF" }),
    ).toBeVisible();
  });
});

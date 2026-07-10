import { expect, test } from "@playwright/test";
import { PDF_FIXTURES } from "@gopdfjs/fixtures";
import { TOOL_REGISTRY } from "../../src/config/tools";
import { toolInputKind } from "../../src/lib/toolRunners";

for (const tool of TOOL_REGISTRY) {
  if (tool.id === "compress") continue;

  test.describe(`RFC browser — ${tool.id}`, () => {
    test(`${tool.label} → success banner`, async ({ page }) => {
      test.setTimeout(tool.e2eTimeoutMs ?? 120_000);

      await page.goto(tool.path);
      await expect(page.getByRole("heading", { name: tool.label, exact: true })).toBeVisible();

      const inputKind = toolInputKind(tool.id);
      if (inputKind === "pdf") {
        await page.locator('input[type="file"]').setInputFiles(PDF_FIXTURES.BMAUPIN_BASIC);
        await expect(page.getByText("PDF loaded")).toBeVisible();
      }

      await page.getByTestId("tool-run").click();
      await expect(page.getByTestId("tool-success")).toBeVisible({
        timeout: tool.e2eTimeoutMs ?? 120_000,
      });
      await expect(page.getByTestId("tool-error")).toHaveCount(0);
    });
  });
}

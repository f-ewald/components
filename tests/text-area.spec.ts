import { test, expect } from "@playwright/test";

test.describe("text-area", () => {
  test("accepts typed input and fires the input event", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#text-area-demo");
    const textarea = el.locator("textarea");
    await textarea.fill("Hello there");
    await expect(textarea).toHaveValue("Hello there");
  });

  test("readonly variant shows its value but rejects edits", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#text-area-readonly-demo");
    const textarea = el.locator("textarea");
    await expect(textarea).toHaveAttribute("readonly", "");
    await expect(textarea).toHaveValue(
      "Error code: 429 - No deployments available for selected model.",
    );
  });
});

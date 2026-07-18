import { test, expect } from "@playwright/test";

test.describe("ui-button", () => {
  test("renders variants, a slotted icon, a busy spinner, and a link variant", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("#button-primary")).toHaveText(/New property/);
    await expect(page.locator("#button-primary button")).toHaveClass(/primary/);
    await expect(page.locator("#button-secondary button")).toHaveClass(/secondary/);
    await expect(page.locator("#button-danger button")).toHaveClass(/danger/);

    await expect(page.locator("#button-busy button")).toBeDisabled();
    await expect(page.locator("#button-busy .spin")).toBeVisible();

    const link = page.locator("#button-link a");
    await expect(link).toHaveAttribute("href", "#ui-button");
  });

  test("type=\"submit\" submits the ancestor form via ElementInternals, respecting native validation", async ({ page }) => {
    await page.goto("/");
    const form = page.locator("#button-form");
    const input = form.locator('input[name="note"]');
    const result = page.locator("#button-form-result");
    const submitBtn = form.locator("ui-button button");

    // Empty required field: native validation blocks submission.
    await submitBtn.click();
    await expect(result).toHaveText("");

    await input.fill("hello");
    await submitBtn.click();
    await expect(result).toHaveText("Submitted: hello");
  });
});

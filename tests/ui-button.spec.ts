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

  test("disabled links suppress keyboard navigation and reduced motion stops the spinner", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const host = page.locator("#button-link");
    const link = host.locator("a");
    await host.evaluate((element) => {
      (element as HTMLElement & { disabled: boolean }).disabled = true;
    });
    await expect(link).toHaveAttribute("aria-disabled", "true");
    await link.focus();
    await link.press("Enter");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("#button-busy .spin")).toHaveCSS("animation-name", "none");
  });

  test("uses tokenized standard button control metrics", async ({ page }) => {
    await page.goto("/");
    const btn = page.locator("#button-primary button.btn");
    await expect(btn).toHaveCSS("font-size", "12px");
    await expect(btn).toHaveCSS("font-weight", "500");
    await expect(btn).toHaveCSS("padding", "8px 16px");
    await expect(btn).toHaveCSS("border-radius", "4px");
    await expect(btn).toHaveCSS("height", "32px");
    await expect(btn).toHaveCSS("line-height", "15px");
  });

  test("size=\"sm\" shrinks the control without affecting the default size", async ({ page }) => {
    await page.goto("/");
    const smBtn = page.locator("#button-sm button.btn");
    await expect(smBtn).toHaveClass(/\bsm\b/);
    await expect(smBtn).toHaveCSS("height", "24px");
    await expect(smBtn).toHaveCSS("padding", "4px 8px");

    const mdBtn = page.locator("#button-primary button.btn");
    await expect(mdBtn).toHaveCSS("height", "32px");
  });

  test("pill renders fully rounded corners", async ({ page }) => {
    await page.goto("/");
    const pillBtn = page.locator("#button-pill button.btn");
    await expect(pillBtn).toHaveClass(/\bpill\b/);
    await expect(pillBtn).toHaveCSS("border-radius", "999px");

    const primaryBtn = page.locator("#button-primary button.btn");
    await expect(primaryBtn).not.toHaveCSS("border-radius", "999px");
  });
});

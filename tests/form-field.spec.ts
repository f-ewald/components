import { test, expect } from "@playwright/test";

test.describe("form-field", () => {
  test("renders label and hint text", async ({ page }) => {
    await page.goto("/");
    const field = page.locator("#field-select").locator("..");
    await expect(field.locator(".label-text")).toHaveText("Task state");
    await expect(field.locator(".message")).toHaveText("Only affects your own view");
  });

  test("required marker present, error replaces hint, and toggles back", async ({ page }) => {
    await page.goto("/");
    const wrap = page.locator("#field-checkbox-wrap");

    await expect(wrap.locator(".required-mark")).toHaveText("*");
    await expect(wrap.locator(".message")).toHaveCount(0);

    await page.locator("#field-error-toggle").click();
    await expect(wrap.locator(".message.error")).toHaveText("You must accept to continue");
    await expect(wrap.locator(".message")).toHaveAttribute("role", "alert");

    await page.locator("#field-error-toggle").click();
    await expect(wrap.locator(".message")).toHaveCount(0);
  });

  test("composes an arbitrary slotted control (autocomplete-input)", async ({ page }) => {
    await page.goto("/");
    const input = page.locator("#field-autocomplete input");
    await expect(input).toBeVisible();
    await input.fill("Type");
    await expect(page.locator("#field-autocomplete li", { hasText: "TypeScript" })).toBeVisible();
  });
});

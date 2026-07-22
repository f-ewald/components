import { test, expect } from "@playwright/test";

test.describe("radio-pills", () => {
  test("renders options, reflects the selected value, and fires change", async ({ page }) => {
    await page.goto("/");
    const pills = page.locator("#radio-pills-demo");

    await expect(pills.locator(".pill")).toHaveCount(4);
    await expect(pills.locator(".pill").nth(0).locator("input")).toBeChecked();

    await pills.locator(".pill").nth(2).click();
    await expect(pills.locator(".pill").nth(2).locator("input")).toBeChecked();
    await expect(pills.locator(".pill").nth(0).locator("input")).not.toBeChecked();
    await expect(page.locator("#radio-pills-selected")).toHaveText("outdoors");
  });

  test("preserves native keyboard focus and disabled behavior", async ({ page }) => {
    await page.goto("/");
    const pills = page.locator("#radio-pills-demo");
    const first = pills.locator("input").first();
    await first.focus();
    expect(
      await pills.locator(".pill").first().evaluate((element) => getComputedStyle(element).boxShadow),
    ).not.toBe("none");
    await first.press("ArrowRight");
    await expect(pills.locator("input").nth(1)).toBeChecked();

    await pills.evaluate((element) => {
      (element as HTMLElement & { disabled: boolean }).disabled = true;
    });
    await expect(pills.locator("input:disabled")).toHaveCount(4);
  });

  test("uses compact-pill metrics and 1rem radio inputs", async ({ page }) => {
    await page.goto("/");
    const pills = page.locator("#radio-pills-demo");
    const pill = pills.locator(".pill").first();
    await expect(pill).toHaveCSS("padding", "4px 8px");
    await expect(pill).toHaveCSS("gap", "8px");
    await expect(pill).toHaveCSS("min-height", "32px");
    await expect(pill).toHaveCSS("line-height", "15px");

    const input = pill.locator("input");
    await expect(input).toHaveCSS("width", "16px");
    await expect(input).toHaveCSS("height", "16px");
  });
});

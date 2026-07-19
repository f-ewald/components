import { test, expect } from "@playwright/test";

test.describe("editable-text", () => {
  test("click swaps to an input, Enter commits and fires change, Escape restores", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#editable-title");
    const display = el.locator(".display");

    await expect(display).toHaveText("Write the quarterly report");
    await display.click();

    const input = el.locator("input");
    await expect(input).toBeFocused();
    await input.fill("Write the annual report");
    await input.press("Enter");

    await expect(el.locator(".display")).toHaveText("Write the annual report");
    await expect(page.locator("#editable-change-log")).toHaveText(
      "editable-title: Write the annual report",
    );

    // Escape restores the previous value without committing.
    await el.locator(".display").click();
    await el.locator("input").fill("Something else entirely");
    await el.locator("input").press("Escape");
    await expect(el.locator(".display")).toHaveText("Write the annual report");
  });

  test("multiline renders a textarea and plain Enter does not commit", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#editable-description");

    await el.locator(".display").click();
    const textarea = el.locator("textarea");
    await expect(textarea).toBeFocused();
    await textarea.fill("Line one");
    await textarea.press("Enter");
    await textarea.type("Line two");

    // Still editing — Enter inserted a newline instead of committing.
    await expect(el.locator("textarea")).toBeVisible();
    await expect(el.locator("textarea")).toHaveValue("Line one\nLine two");
  });
});

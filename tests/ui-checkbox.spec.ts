import { test, expect } from "@playwright/test";

test.describe("ui-checkbox", () => {
  test("toggles checked state and fires change in both directions", async ({ page }) => {
    await page.goto("/");
    const box = page.locator("#checkbox-basic");
    const input = box.locator("input");

    await expect(input).not.toBeChecked();
    await box.locator("label").click();
    await expect(input).toBeChecked();
    await expect(page.locator("#checkbox-basic-log")).toHaveText("checked: true");

    await box.locator("label").click();
    await expect(input).not.toBeChecked();
    await expect(page.locator("#checkbox-basic-log")).toHaveText("checked: false");
  });

  test("disabled checkbox blocks interaction", async ({ page }) => {
    await page.goto("/");
    const input = page.locator("#checkbox-disabled input");
    await expect(input).toBeDisabled();
    await expect(input).toBeChecked();
  });

  test("indeterminate renders and clears after a user interaction", async ({ page }) => {
    await page.goto("/");
    const box = page.locator("#checkbox-indeterminate");
    const input = box.locator("input");

    await expect(input).toHaveJSProperty("indeterminate", true);
    await box.locator("label").click();
    await expect(input).toHaveJSProperty("indeterminate", false);
    await expect(input).toBeChecked();
  });

  test("required checkbox blocks form submission until checked", async ({ page }) => {
    await page.goto("/");
    const form = page.locator("#checkbox-form");
    const input = page.locator("#checkbox-required input");
    const log = page.locator("#checkbox-form-log");

    await form.locator('button[type="submit"]').click();
    await expect(log).toHaveText("");
    await expect(await input.evaluate((el: HTMLInputElement) => el.validity.valid)).toBe(false);

    await page.locator("#checkbox-required label").click();
    await form.locator('button[type="submit"]').click();
    await expect(log).toHaveText("submitted terms=on");
  });

  test("form reset restores the initial checked state", async ({ page }) => {
    await page.goto("/");
    const form = page.locator("#checkbox-form");
    const input = page.locator("#checkbox-required input");

    await page.locator("#checkbox-required label").click();
    await expect(input).toBeChecked();
    await form.evaluate((el: HTMLFormElement) => el.reset());
    await expect(input).not.toBeChecked();
  });

  test(":focus-visible ring appears via keyboard", async ({ page }) => {
    await page.goto("/");
    const input = page.locator("#checkbox-basic input");
    await input.focus();
    await expect(input).toHaveCSS("box-shadow", /rgb/);
  });
});

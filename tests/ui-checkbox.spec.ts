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

  test("icon renders inside the clickable label and toggling still works", async ({ page }) => {
    await page.goto("/");
    const box = page.locator("#checkbox-icon");
    const input = box.locator("input");

    await expect(box.locator(".checkbox-icon svg")).toBeVisible();
    await expect(input).not.toBeChecked();
    await box.locator(".checkbox-icon").click();
    await expect(input).toBeChecked();
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

  test("slotted label renders, stays clickable, and names the checkbox", async ({ page }) => {
    await page.goto("/");
    const box = page.locator("#checkbox-slotted");
    const input = box.locator("input");

    // The slotted markup is projected into the shadow <label>, so it both
    // names the control and stays part of its click target.
    await expect(input).toHaveAccessibleName("Enable beta features");
    await box.getByText("beta").click();
    await expect(input).toBeChecked();
    await expect(page.locator("#checkbox-slotted-log")).toHaveText("checked: true");
  });

  test("slotted label wins over the label property", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(async () => {
      const box = document.createElement("ui-checkbox") as HTMLElement & {
        label: string;
        updateComplete: Promise<unknown>;
      };
      box.id = "checkbox-precedence";
      box.label = "From property";
      box.textContent = "From slot";
      document.body.append(box);
      await box.updateComplete;
    });
    const input = page.locator("#checkbox-precedence input");

    await expect(input).toHaveAccessibleName("From slot");
    // The property is only the slot's fallback: with the slot filled the
    // fallback stays unrendered, so it never shows alongside the slotted label.
    const fallbackRendered = await page
      .locator("#checkbox-precedence")
      .evaluate((el) => el.shadowRoot!.querySelector("slot")!.assignedNodes().length === 0);
    expect(fallbackRendered).toBe(false);
  });

  test(":focus-visible ring appears via keyboard", async ({ page }) => {
    await page.goto("/");
    const input = page.locator("#checkbox-basic input");
    await input.focus();
    await expect(input).toHaveCSS("box-shadow", /rgb/);
  });
});

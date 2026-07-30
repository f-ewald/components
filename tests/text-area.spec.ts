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

  test("floating form-field labels respond to focus and programmatic values", async ({
    page,
  }) => {
    await page.goto("/");
    await page.evaluate(() => {
      const field = document.createElement("form-field") as HTMLElement & {
        floatingLabel: boolean;
        label: string;
      };
      field.id = "floating-text-area-field";
      field.floatingLabel = true;
      field.label = "Description";
      const textArea = document.createElement("text-area") as HTMLElement & {
        placeholder: string;
        value: string;
      };
      textArea.id = "floating-text-area";
      textArea.placeholder = "Add details";
      field.append(textArea);
      document.body.append(field);
    });

    const control = page.locator("#floating-text-area");
    const textarea = control.locator("textarea");
    const label = control.locator(".floating-label");
    await expect(label).toHaveCSS("top", "8px");
    expect(
      await textarea.evaluate((element) => getComputedStyle(element, "::placeholder").opacity),
    ).toBe("0");

    await label.click();
    await expect(textarea).toBeFocused();
    await expect(label).toHaveCSS("top", "4px");
    await control.evaluate((element) => {
      (element as HTMLElement & { value: string }).value = "Programmatic details";
    });
    await textarea.blur();
    await expect(label).toHaveCSS("top", "4px");
    await expect(textarea).toHaveValue("Programmatic details");
  });
});

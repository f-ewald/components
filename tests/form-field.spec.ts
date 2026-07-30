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

  test("floating-label moves a native input label on focus and retains it for content", async ({
    page,
  }) => {
    await page.goto("/");
    await page.evaluate(() => {
      const field = document.createElement("form-field") as HTMLElement & {
        floatingLabel: boolean;
        label: string;
        required: boolean;
      };
      field.id = "floating-native-field";
      field.floatingLabel = true;
      field.label = "Email";
      field.required = true;
      const input = document.createElement("input");
      input.id = "floating-native-input";
      input.type = "email";
      input.placeholder = "name@example.com";
      field.append(input);
      document.body.append(field);
    });

    const field = page.locator("#floating-native-field");
    const input = page.locator("#floating-native-input");
    const label = field.locator(".label-text");
    await expect(input).toHaveCSS("height", "48px");
    expect(
      await field
        .locator(".control-label")
        .evaluate((element) => getComputedStyle(element).boxShadow),
    ).not.toBe("none");
    await expect(label).toHaveCSS("position", "absolute");
    await expect(label).toHaveCSS("top", "24px");
    await expect(label).toHaveCSS("font-size", "12px");
    await expect(label.locator(".required-mark")).toHaveText("*");
    await expect(input).toHaveAttribute("aria-label", "Email (required)");
    await expect(input).toHaveAttribute("placeholder", "");

    await label.click();
    await expect(input).toBeFocused();
    await expect(label).toHaveCSS("top", "4px");
    await expect(label).toHaveCSS("font-size", "11px");
    await expect(input).toHaveAttribute("placeholder", "name@example.com");

    await input.fill("person@example.com");
    await input.blur();
    await expect(label).toHaveCSS("top", "4px");

    await input.fill("");
    await input.blur();
    await expect(label).toHaveCSS("top", "24px");

    await input.evaluate((element) => {
      element.value = "autofilled@example.com";
      element.dispatchEvent(
        new AnimationEvent("animationstart", {
          animationName: "form-field-autofill",
          bubbles: true,
          composed: true,
        }),
      );
    });
    await expect(label).toHaveCSS("top", "4px");
  });

  test("floating-label automatically configures package text controls", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      const controls = [
        document.createElement("autocomplete-input"),
        document.createElement("address-autocomplete"),
        document.createElement("text-area"),
      ];
      for (const [index, control] of controls.entries()) {
        const field = document.createElement("form-field") as HTMLElement & {
          floatingLabel: boolean;
          label: string;
        };
        field.id = `delegated-field-${index}`;
        field.floatingLabel = true;
        field.label = ["Language", "Address", "Notes"][index];
        control.id = `delegated-control-${index}`;
        field.append(control);
        document.body.append(field);
      }

      const nativeTextareaField = document.createElement("form-field") as HTMLElement & {
        floatingLabel: boolean;
        label: string;
      };
      nativeTextareaField.id = "floating-native-textarea-field";
      nativeTextareaField.floatingLabel = true;
      nativeTextareaField.label = "Biography";
      nativeTextareaField.append(document.createElement("textarea"));
      document.body.append(nativeTextareaField);
    });

    for (const [index, label] of ["Language", "Address", "Notes"].entries()) {
      const field = page.locator(`#delegated-field-${index}`);
      await expect(field.locator(".label-text")).toHaveCount(0);
      await expect(page.locator(`#delegated-control-${index} .floating-label`)).toHaveText(label);
    }
    await expect(page.locator("#delegated-control-0 input")).toHaveCSS("height", "48px");
    await expect(page.locator("#delegated-control-1 input")).toHaveCSS("height", "48px");
    expect(
      await page.locator("#delegated-control-2 textarea").evaluate((element) =>
        parseFloat(getComputedStyle(element).minHeight),
      ),
    ).toBeGreaterThanOrEqual(48);
    await expect(
      page.locator("#floating-native-textarea-field .control-label"),
    ).toHaveClass(/multiline/);
  });

  test("floating-label falls back to the external label for unsupported controls", async ({
    page,
  }) => {
    await page.goto("/");
    await page.evaluate(() => {
      const field = document.createElement("form-field") as HTMLElement & {
        floatingLabel: boolean;
        label: string;
      };
      field.id = "floating-unsupported-field";
      field.floatingLabel = true;
      field.label = "State";
      field.append(document.createElement("form-select"));
      document.body.append(field);
    });

    const field = page.locator("#floating-unsupported-field");
    await expect(field.locator(".label-text")).toHaveText("State");
    await expect(field.locator(".control-label")).not.toHaveClass(/floating-native/);
  });

  test("floating labels remove transitions for reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.evaluate(() => {
      const field = document.createElement("form-field") as HTMLElement & {
        floatingLabel: boolean;
        label: string;
      };
      field.id = "reduced-floating-field";
      field.floatingLabel = true;
      field.label = "Search";
      field.append(document.createElement("autocomplete-input"));
      document.body.append(field);
    });

    await expect(
      page.locator("#reduced-floating-field autocomplete-input .floating-label"),
    ).toHaveCSS("transition-duration", "0s");
  });
});

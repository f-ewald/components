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
    await expect(pillBtn).toHaveCSS("border-radius", "9999px");

    const primaryBtn = page.locator("#button-primary button.btn");
    await expect(primaryBtn).not.toHaveCSS("border-radius", "9999px");
  });

  test("ai draws an animated ring without altering the variant's fill", async ({ page }) => {
    await page.goto("/");
    const aiBtn = page.locator("#button-ai button.btn");
    await expect(aiBtn).toHaveClass(/\bai\b/);

    const ring = (selector: string, pseudo: string, property: string) =>
      page.locator(selector).evaluate(
        (element, [pseudoElement, prop]) =>
          getComputedStyle(element, pseudoElement).getPropertyValue(prop),
        [pseudo, property],
      );

    // Both layers sweep in lockstep: ::before is the blurred bloom that fades
    // out to transparent, ::after the crisp edge on top of it.
    for (const pseudo of ["::before", "::after"]) {
      expect(await ring("#button-ai button.btn", pseudo, "animation-name")).toBe("ai-sweep");
      expect(await ring("#button-ai button.btn", pseudo, "animation-duration")).toBe("4s");
      // Busy keeps sweeping (faster) rather than freezing like a plain disabled button.
      expect(await ring("#button-ai-busy button.btn", pseudo, "animation-duration")).toBe("1.5s");
    }
    expect(await ring("#button-ai button.btn", "::before", "filter")).toContain("blur");
    expect(await ring("#button-ai button.btn", "::after", "filter")).toBe("none");

    // The ring is purely additive: fill and geometry match the plain equivalents.
    await expect(aiBtn).toHaveCSS(
      "background-color",
      await page.locator("#button-pill button.btn").evaluate((el) => getComputedStyle(el).backgroundColor),
    );
    await expect(aiBtn).toHaveCSS("height", "32px");

    // Toggling the property off removes the ring entirely.
    await page.locator("#button-ai-toggle button").click();
    await expect(aiBtn).not.toHaveClass(/\bai\b/);
    expect(await ring("#button-ai button.btn", "::before", "animation-name")).toBe("none");
    expect(await ring("#button-ai button.btn", "::after", "animation-name")).toBe("none");
  });

  test("the ai ring holds still under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const animations = await page
      .locator("#button-ai button.btn")
      .evaluate((element) => [
        getComputedStyle(element, "::before").animationName,
        getComputedStyle(element, "::after").animationName,
      ]);
    expect(animations).toEqual(["none", "none"]);
  });
});

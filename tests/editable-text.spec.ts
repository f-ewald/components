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

  test("inactive multiline display is flush and contains no template blank lines", async ({
    page,
  }) => {
    await page.goto("/");
    const el = page.locator("#editable-description");
    const display = el.locator(".display");

    // Inactive multiline drops both halves of the inset; related states keep both.
    await expect(display).toHaveCSS("padding", "0px");
    await expect(display).toHaveCSS("margin", "0px");
    const titleDisplay = page.locator("#editable-title .display");
    await expect(titleDisplay).toHaveCSS("padding", "4px");
    await expect(titleDisplay).toHaveCSS("margin", "-4px");

    // Removing padding and negative margin together keeps the display aligned to its host.
    const hostBox = await el.boundingBox();
    const displayFootprint = await display.boundingBox();
    expect(displayFootprint!.x).toBeCloseTo(hostBox!.x, 0);
    expect(displayFootprint!.width).toBeCloseTo(hostBox!.width, 0);

    // Derive height from computed styles so template whitespace cannot add hidden blank lines.
    const { lineHeight, verticalPadding } = await display.evaluate((node) => {
      const cs = getComputedStyle(node);
      return {
        lineHeight: parseFloat(cs.lineHeight),
        verticalPadding: parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom),
      };
    });
    const singleLineHeight = lineHeight + verticalPadding;

    const emptyBox = await display.boundingBox();
    expect(emptyBox!.height).toBeCloseTo(singleLineHeight, 0);

    // Two lines grow by exactly one line-height.
    await el.evaluate((node) => {
      (node as HTMLElement & { value: string }).value = "Line one\nLine two";
    });
    const twoLineBox = await display.boundingBox();
    expect(twoLineBox!.height).toBeCloseTo(singleLineHeight + lineHeight, 0);

    // Active textarea keeps its larger editing area.
    await display.click();
    const textarea = el.locator("textarea");
    await expect(textarea).toHaveCSS("padding", "4px");
    await expect(textarea).toHaveCSS("margin", "-4px");
    const activeBox = await textarea.boundingBox();
    expect(activeBox!.height).toBeGreaterThan(twoLineBox!.height);
    await textarea.press("Escape");

    await expect(titleDisplay).not.toHaveCSS("white-space", "pre-wrap");
    await expect(display).toHaveCSS("white-space", "pre-wrap");
  });

  test("display has native keyboard activation and readonly uses native disabled semantics", async ({
    page,
  }) => {
    await page.goto("/");
    const el = page.locator("#editable-title");
    const display = el.locator(".display");

    await display.focus();
    await display.press("Enter");
    await expect(el.locator("input")).toBeFocused();
    await el.locator("input").press("Escape");

    await el.evaluate((element) => {
      (element as HTMLElement & { readonly: boolean }).readonly = true;
    });
    await expect(el.locator(".display")).toBeDisabled();
    await el.locator(".display").click({ force: true });
    await expect(el.locator("input")).toHaveCount(0);
  });
});

import { test, expect } from "@playwright/test";

test.describe("button-group", () => {
  test("renders options, reflects the selected value, and fires change", async ({ page }) => {
    await page.goto("/");
    const group = page.locator("#button-group-demo");

    await expect(group.locator(".segment")).toHaveCount(3);
    await expect(group.locator(".segment").nth(0).locator("input")).toBeChecked();

    await group.locator(".segment").nth(1).click();
    await expect(group.locator(".segment").nth(1).locator("input")).toBeChecked();
    await expect(group.locator(".segment").nth(0).locator("input")).not.toBeChecked();
    await expect(page.locator("#button-group-selected")).toHaveText("kanban");
  });

  test("preserves native keyboard focus and disabled behavior", async ({ page }) => {
    await page.goto("/");
    const group = page.locator("#button-group-demo");
    const first = group.locator("input").first();
    await first.focus();
    expect(
      await group.locator(".segment").first().evaluate((element) => getComputedStyle(element).boxShadow),
    ).not.toBe("none");
    await first.press("ArrowRight");
    await expect(group.locator("input").nth(1)).toBeChecked();

    await group.evaluate((element) => {
      (element as HTMLElement & { disabled: boolean }).disabled = true;
    });
    await expect(group.locator("input:disabled")).toHaveCount(3);
  });

  test("joins segments into one shared-border strip with canceled inner radii", async ({
    page,
  }) => {
    await page.goto("/");
    const group = page.locator("#button-group-demo");
    const segment = group.locator(".segment").first();
    await expect(segment).toHaveCSS("height", "32px");

    const first = group.locator(".segment").nth(0);
    const middle = group.locator(".segment").nth(1);
    const last = group.locator(".segment").nth(2);

    // The middle segment has no radius of its own — only the group's outer
    // corners (first/last segment) should be rounded.
    expect(
      await middle.evaluate((el) => getComputedStyle(el).borderRadius),
    ).toBe("0px");
    expect(
      await first.evaluate((el) => getComputedStyle(el).borderTopLeftRadius),
    ).not.toBe("0px");
    expect(
      await last.evaluate((el) => getComputedStyle(el).borderTopRightRadius),
    ).not.toBe("0px");
  });
});

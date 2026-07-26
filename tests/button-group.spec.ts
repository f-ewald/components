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

  test("icon-only mode hides labels visually but keeps them as the accessible name", async ({
    page,
  }) => {
    await page.goto("/");
    const group = page.locator("#button-group-icon-only");

    await expect(group.locator(".segment")).toHaveCount(2);
    // Label text is present in the DOM (sr-only) but not visually rendered.
    const label = group.locator(".segment").nth(0).locator("span");
    await expect(label).toHaveText("List");
    // sr-only clip technique: present in the a11y tree but visually a 1px box.
    const box = await label.boundingBox();
    expect(box?.width).toBeLessThanOrEqual(1);
    expect(box?.height).toBeLessThanOrEqual(1);

    // Accessible name still resolves to the label via aria-label.
    await expect(group.getByRole("radio", { name: "List" })).toHaveCount(1);
    await expect(group.getByRole("radio", { name: "Kanban" })).toHaveCount(1);

    await group.getByRole("radio", { name: "Kanban" }).click();
    await expect(page.locator("#button-group-icon-only-selected")).toHaveText("kanban");
  });
});

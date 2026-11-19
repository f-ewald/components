import { test, expect } from "@playwright/test";

test.describe("ui-tooltip", () => {
  test("hover shows the tooltip after the delay, describes the trigger, and stays open over the tooltip", async ({
    page,
  }) => {
    await page.goto("/");
    const host = page.getByTestId("tooltip-button");
    const trigger = host.getByRole("button", { name: "Copy link" });
    const tooltip = host.getByRole("tooltip");
    await host.scrollIntoViewIfNeeded();

    await expect(trigger).toHaveAccessibleDescription("Copies a shareable link to this view");
    await expect(host).not.toHaveAttribute("tabindex");
    await expect(tooltip).toBeHidden();

    await trigger.hover();
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveCSS("background-color", "rgb(15, 23, 42)");
    const [triggerBox, tipBox] = await Promise.all([trigger.boundingBox(), tooltip.boundingBox()]);
    expect(tipBox!.y + tipBox!.height).toBeLessThanOrEqual(triggerBox!.y);

    await tooltip.hover();
    await page.waitForTimeout(200);
    await expect(tooltip).toBeVisible();

    await page.mouse.move(0, 0);
    await expect(tooltip).toBeHidden();
  });

  test("a plain-text trigger makes the host focusable; focus shows it and Escape closes it", async ({ page }) => {
    await page.goto("/");
    const host = page.getByTestId("tooltip-text");
    const tooltip = host.getByRole("tooltip");

    await expect(host).toHaveAttribute("tabindex", "0");
    await expect(host).toHaveAccessibleDescription(/3 work items pending/);

    await host.focus();
    await expect(tooltip).toBeVisible();
    await expect(host.locator('[slot="content"] li')).toHaveCount(3);
    const [hostBox, tipBox] = await Promise.all([host.boundingBox(), tooltip.boundingBox()]);
    expect(tipBox!.y).toBeGreaterThanOrEqual(hostBox!.y + hostBox!.height);

    await page.keyboard.press("Escape");
    await expect(tooltip).toBeHidden();
    await expect(host).toBeFocused();
  });

  test("flips to the side with room and is suppressed while disabled", async ({ page }) => {
    await page.goto("/");
    const host = page.getByTestId("tooltip-button");
    const tooltip = host.getByRole("tooltip");
    // Pinned to the top edge to force a flip, but away from the pointer's (0, 0) start so it isn't hovered.
    await page.mouse.move(0, 0);
    await host.evaluate((el) => {
      el.style.position = "fixed";
      el.style.top = "0";
      el.style.left = "50vw";
    });

    await host.getByRole("button").focus();
    await expect(tooltip).toBeVisible();
    const [hostBox, tipBox] = await Promise.all([host.boundingBox(), tooltip.boundingBox()]);
    expect(tipBox!.y).toBeGreaterThanOrEqual(hostBox!.y + hostBox!.height);
    expect(tipBox!.x).toBeGreaterThanOrEqual(0);

    await host.getByRole("button").blur();
    await expect(tooltip).toBeHidden();
    await page.getByTestId("tooltip-disabled").click();
    await host.getByRole("button").focus();
    await host.getByRole("button").hover();
    await page.waitForTimeout(400);
    await expect(tooltip).toBeHidden();
  });
});

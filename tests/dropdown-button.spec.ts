import { test, expect } from "@playwright/test";

test.describe("dropdown-button", () => {
  test("click opens the menu, picking an action fires select and closes", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#dropdown-resolve");
    const trigger = el.locator("button.trigger");

    await expect(trigger).toHaveText("Resolve…");
    await trigger.click();

    const options = el.locator("li[role='menuitem']");
    await expect(options).toHaveCount(3);
    const menuId = await el.getByRole("menu").getAttribute("id");
    await expect(trigger).toHaveAttribute("aria-controls", menuId!);
    await expect(trigger).toHaveAttribute(
      "aria-activedescendant",
      await options.first().getAttribute("id")!,
    );
    await options.filter({ hasText: "Retry" }).click();

    await expect(page.locator("#dropdown-select-log")).toHaveText("dropdown-resolve: retry");
    await expect(el.locator("ul.options")).toHaveCount(0);
  });

  test("Escape closes the menu without firing select", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#dropdown-resolve");
    const trigger = el.locator("button.trigger");

    await trigger.click();
    await expect(el.locator("ul.options")).toBeVisible();
    await trigger.press("Escape");
    await expect(el.locator("ul.options")).toHaveCount(0);
  });

  test("a disabled dropdown-button does not open on click", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#dropdown-disabled");
    await el.locator("button.trigger").click({ force: true });
    await expect(el.locator("ul.options")).toHaveCount(0);
  });

  test("the icon variant hides the label, exposes it as the accessible name, and still opens", async ({
    page,
  }) => {
    await page.goto("/");
    const el = page.locator("#dropdown-icon");
    const trigger = el.locator("button.trigger");

    await expect(trigger).toHaveText("");
    await expect(trigger).toHaveAttribute("aria-label", "Row actions");
    await expect(el.locator(".chevron")).toHaveCount(0);
    await expect(el.locator(".icon svg")).toBeVisible();
    // Borderless square target, not the primary-filled text trigger.
    await expect(trigger).toHaveCSS("width", "32px");
    await expect(trigger).toHaveCSS("padding", "0px");

    await trigger.click();
    await el.locator("li[role='menuitem']").filter({ hasText: "Delete" }).click();
    await expect(page.locator("#dropdown-select-log")).toHaveText("dropdown-icon: delete");
  });

  test("the text-icon variant renders the icon, the label and the chevron", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#dropdown-text-icon");
    const trigger = el.locator("button.trigger");

    await expect(trigger).toHaveText("Actions");
    await expect(el.locator(".icon svg")).toBeVisible();
    await expect(el.locator(".chevron")).toHaveCount(1);
    // Keeps the primary-filled metrics of the default text variant.
    await expect(trigger).toHaveCSS("padding", "8px 16px");
  });

  test("a danger menu item renders in the danger color", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#dropdown-icon");
    await el.locator("button.trigger").click();
    const items = el.locator("li[role='menuitem']");
    await expect(items.filter({ hasText: "Delete" })).toHaveCSS("color", "rgb(220, 38, 38)");
    await expect(items.filter({ hasText: "Rename" })).toHaveCSS("color", "rgb(15, 23, 42)");
  });

  test("removes chevron motion when reduced motion is requested", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator("#dropdown-resolve .chevron")).toHaveCSS(
      "transition-duration",
      "0s",
    );
  });

  test("uses tokenized button trigger and list-row control metrics", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#dropdown-resolve");
    const trigger = el.locator("button.trigger");
    await expect(trigger).toHaveCSS("font-weight", "500");
    await expect(trigger).toHaveCSS("padding", "8px 16px");
    await expect(trigger).toHaveCSS("height", "32px");
    await expect(trigger).toHaveCSS("line-height", "15px");

    await trigger.click();
    const firstItem = el.locator("li[role='menuitem']").first();
    await expect(firstItem).toHaveCSS("padding", "8px 12px");
    await expect(firstItem).toHaveCSS("font-size", "12px");
  });
});

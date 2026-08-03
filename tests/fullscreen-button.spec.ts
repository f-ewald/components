import { test, expect } from "@playwright/test";

test.describe("fullscreen-button", () => {
  test("renders a labelled icon button that starts in the enter state", async ({ page }) => {
    await page.goto("/");
    const button = page.locator("#fullscreen-page button");
    await expect(button).toHaveAttribute("aria-label", "Enter full screen");
    await expect(button.locator("svg")).toBeVisible();
    await expect(page.getByTestId("fullscreen-state")).toHaveText("Not fullscreen.");
  });

  test("follows the real fullscreen state rather than its own clicks", async ({ page }) => {
    await page.goto("/");
    const button = page.locator("#fullscreen-page button");

    // Fullscreen can be left without the button — Escape, or browser chrome —
    // so the icon and label are driven by the document's change event.
    await page.evaluate(() => document.dispatchEvent(new Event("fullscreenchange")));
    await expect(page.getByTestId("fullscreen-state")).toHaveText("Not fullscreen.");
    await expect(button).toHaveAttribute("aria-label", "Enter full screen");
  });

  test("reads the shared secondary-button tokens so a gradient theme carries over", async ({
    page,
  }) => {
    await page.goto("/");
    const button = page.locator("#fullscreen-page button");
    const background = () => button.evaluate((el) => getComputedStyle(el).backgroundImage);

    expect(await background()).not.toContain("gradient");

    await page.evaluate(() => {
      document.documentElement.style.setProperty(
        "--ui-button-secondary-background",
        "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
      );
    });
    expect(await background()).toContain("linear-gradient");
  });

  test("targets a specific element when one is set", async ({ page }) => {
    await page.goto("/");
    const scoped = await page
      .locator("#fullscreen-scoped")
      .evaluate((el) => (el as HTMLElement & { target: HTMLElement | null }).target?.id ?? null);
    expect(scoped).toBe("fullscreen-target");
  });
});

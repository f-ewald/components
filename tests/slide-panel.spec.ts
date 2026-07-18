import { test, expect } from "@playwright/test";

test.describe("slide-panel", () => {
  test("the open attribute slides the panel in and the close button fires panel-close", async ({ page }) => {
    await page.goto("/");
    const panel = page.locator("#panel-demo");
    const panelInner = panel.locator(".panel");
    await expect(panelInner).not.toHaveClass(/open/);

    await page.locator("#panel-open").click();
    await expect(panelInner).toHaveClass(/open/);

    await page.evaluate(() => {
      document.getElementById("panel-demo")!.addEventListener("panel-close", () => {
        document.body.setAttribute("data-panel-closed", "true");
      });
    });
    await panelInner.locator(".close-btn").click();
    await expect(page.locator("body")).toHaveAttribute("data-panel-closed", "true");
  });
});

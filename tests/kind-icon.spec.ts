import { test, expect } from "@playwright/test";

test.describe("kind-icon", () => {
  test("shows each kind's icon, color, and label, and toggles labels and size", async ({ page }) => {
    await page.goto("/");
    const service = page.locator('kind-icon.kind-icon-labeled[kind="service"]');
    await expect(service.locator(".label")).toHaveText("Service");
    await expect(service.locator(".icon")).toHaveAttribute("aria-hidden", "true");
    await expect(service.locator(".icon")).toHaveCSS("color", "rgb(66, 105, 208)");
    await expect(service.locator(".icon svg")).toHaveAttribute("width", "14");
    await expect(page.locator('kind-icon.kind-icon-labeled[kind="package"] .label')).toHaveText("External package");

    await page.getByTestId("kind-icon-labels").click();
    await expect(service.locator(".label")).toHaveCount(0);
    await expect(service.getByRole("img", { name: "Service" })).toBeVisible();

    await page.getByTestId("kind-icon-large").click();
    await expect(service.locator(".icon svg")).toHaveAttribute("width", "18");
  });

  test("icon-only kinds are named images, and unknown kinds render nothing", async ({ page }) => {
    await page.goto("/");
    const inline = page.getByTestId("kind-icon-inline");
    await expect(inline.getByRole("img", { name: "Service" })).toBeVisible();
    await expect(inline.getByRole("img", { name: "External package" })).toBeVisible();

    const icon = inline.locator("kind-icon").first();
    await icon.evaluate((el: HTMLElement & { kind: string }) => {
      el.kind = "missing";
    });
    await expect(icon.locator(".icon, .label")).toHaveCount(0);
  });
});

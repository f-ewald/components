import { test, expect } from "@playwright/test";

test.describe("split-hero", () => {
  test("renders the user-supplied photo and the slotted form", async ({ page }) => {
    await page.goto("/");
    const host = page.locator("#split-hero-demo");
    const img = host.locator(".visual img");
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute("src", /golden-gate\.jpg$/);
    await expect(img).toHaveAttribute("alt", "Aerial view of a winding coastal road");

    const form = page.locator('[data-testid="split-hero-form"]');
    await expect(form).toBeVisible();
    await expect(form.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("toggling the photo off removes the visual half and falls back to a single column", async ({
    page,
  }) => {
    await page.goto("/");
    const host = page.locator("#split-hero-demo");
    await expect(host.locator(".visual")).toBeAttached();

    await page.locator("#split-hero-toggle-photo").click();
    await expect(host.locator(".visual")).not.toBeAttached();
    await expect(page.locator('[data-testid="split-hero-form"]')).toBeVisible();

    await page.locator("#split-hero-toggle-photo").click();
    await expect(host.locator(".visual")).toBeAttached();
  });

  test("below the shared 48rem breakpoint, the photo becomes a decorative blurred backdrop behind a solid card", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 700, height: 800 });
    await page.goto("/");
    const host = page.locator("#split-hero-demo");
    await expect(host.locator(".visual")).not.toBeVisible();

    const backdrop = host.locator(".backdrop");
    await expect(backdrop).toBeVisible();
    await expect(backdrop).toHaveAttribute("aria-hidden", "true");
    await expect(backdrop).toHaveAttribute("alt", "");
    await expect(backdrop).toHaveCSS("filter", /blur/);

    const card = host.locator(".content-inner");
    await expect(card).toHaveClass(/card/);
    await expect(card).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(page.locator('[data-testid="split-hero-form"]')).toBeVisible();
  });

  test("without a photo, no backdrop or card chrome renders at any width", async ({ page }) => {
    await page.setViewportSize({ width: 700, height: 800 });
    await page.goto("/");
    await page.locator("#split-hero-toggle-photo").click();

    const host = page.locator("#split-hero-demo");
    await expect(host.locator(".backdrop")).not.toBeAttached();
    await expect(host.locator(".content-inner")).not.toHaveClass(/card/);
    await expect(page.locator('[data-testid="split-hero-form"]')).toBeVisible();
  });
});

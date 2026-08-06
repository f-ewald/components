import { test, expect } from "@playwright/test";

test.describe("app-shell", () => {
  test("arranges the sidebar, main list, and footer pager", async ({ page }) => {
    await page.goto("/");
    const shell = page.locator("#app-shell-demo");
    await expect(shell.locator("#app-shell-table")).toContainText("Ada Lovelace");
    await expect(shell.locator("#app-shell-pager")).toContainText("Page 1 of 5");
    await expect(shell.locator("#app-shell-sidebar")).toContainText("Members");
  });

  test("the built-in toggle opens/closes the sidebar overlay, which overlaps the top bar's corner on desktop, and the toggle itself stays clickable", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.emulateMedia({ reducedMotion: "reduce" }); // skip the slide-in transition for a stable bounding box
    await page.goto("/");
    const shell = page.locator("#app-shell-demo");
    await expect(shell).not.toHaveAttribute("sidebar-open", ""); // closed by default

    await shell.locator(".nav-toggle").click();
    await expect(shell).toHaveAttribute("sidebar-open", "");

    const sidebarBox = (await shell.locator("aside.sidebar").boundingBox())!;
    const topbarBox = (await shell.locator(".topbar").boundingBox())!;
    expect(sidebarBox.y).toBeLessThanOrEqual(topbarBox.y);
    expect(sidebarBox.x).toBe(topbarBox.x);

    // The crux of the fix: clicking the toggle must land on the real button,
    // not be intercepted by the sidebar overlay it just opened.
    await shell.locator(".nav-toggle").click();
    await expect(shell).not.toHaveAttribute("sidebar-open", "");
    await shell.locator(".nav-toggle").click();
    await expect(shell).toHaveAttribute("sidebar-open", "");
  });

  test("toggling the detail reveals the right-hand pane", async ({ page }) => {
    await page.goto("/");
    const shell = page.locator("#app-shell-demo");
    const detail = page.locator('[data-testid="app-shell-detail"]');
    await expect(detail).toBeHidden();
    await page.locator("#app-shell-toggle-detail").click();
    await expect(shell).toHaveAttribute("detail-open", "");
    await expect(detail).toBeVisible();
  });

  test("pressing [ toggles the sidebar, but not while typing in a field", async ({ page }) => {
    await page.goto("/");
    const shell = page.locator("#app-shell-demo");
    await expect(shell).not.toHaveAttribute("sidebar-open", ""); // closed by default

    await page.keyboard.press("[");
    await expect(shell).toHaveAttribute("sidebar-open", "");
    await page.keyboard.press("[");
    await expect(shell).not.toHaveAttribute("sidebar-open", "");

    // Typing "[" inside the search field must not toggle the sidebar.
    const search = shell.locator("autocomplete-input input");
    await search.click();
    await search.press("[");
    await expect(shell).not.toHaveAttribute("sidebar-open", "");
    await expect(search).toHaveValue("[");
  });

  test("reveals the shortcut in a tooltip on hover, not as permanent chrome", async ({ page }) => {
    await page.goto("/");
    const shell = page.locator("#app-shell-demo");
    const tip = shell.locator(".nav-tip");
    await expect(tip).toBeHidden();

    await shell.locator(".nav-toggle").hover();
    await expect(tip).toBeVisible();
    await expect(tip).toContainText("Show navigation");
    await expect(tip).toContainText("[");
  });

  test("a mobile viewport dims the page and the sidebar dismisses via scrim click or Escape", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await page.goto("/");
    const shell = page.locator("#app-shell-demo");

    await shell.locator(".nav-toggle").click();
    await expect(shell).toHaveAttribute("sidebar-open", "");
    const scrim = shell.locator(".scrim");
    await expect(scrim).toBeVisible();

    await scrim.click();
    await expect(shell).not.toHaveAttribute("sidebar-open", "");
    await expect(scrim).toBeHidden();

    await shell.locator(".nav-toggle").click();
    await expect(shell).toHaveAttribute("sidebar-open", "");
    await page.keyboard.press("Escape");
    await expect(shell).not.toHaveAttribute("sidebar-open", "");
  });

  test("desktop shows the sidebar overlay with no dimming scrim and no Escape-dismiss", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto("/");
    const shell = page.locator("#app-shell-demo");

    await shell.locator(".nav-toggle").click();
    await expect(shell).toHaveAttribute("sidebar-open", "");
    await expect(shell.locator(".scrim")).toBeHidden();

    await page.keyboard.press("Escape");
    await expect(shell).toHaveAttribute("sidebar-open", ""); // Escape doesn't close it on desktop
  });

  test("sidebar-mode=push reserves a grid column (reflows main/footer) while the top bar stays full width", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const shell = page.locator("#app-shell-demo");
    const mainBoxClosed = (await shell.locator(".main").boundingBox())!;

    await page.locator("#app-shell-toggle-sidebar").click();
    await page.locator("#app-shell-toggle-sidebar-mode").click();
    await expect(shell).toHaveAttribute("sidebar-mode", "push");

    const shellBox = (await shell.boundingBox())!;
    const topbarBox = (await shell.locator(".topbar").boundingBox())!;
    const sidebarBox = (await shell.locator("aside.sidebar").boundingBox())!;
    const mainBoxOpen = (await shell.locator(".main").boundingBox())!;

    // Top bar spans the full shell width regardless of push mode.
    expect(Math.round(topbarBox.width)).toBe(Math.round(shellBox.width));
    // Main content reflows to start after the reserved sidebar column (not overlaid).
    expect(mainBoxOpen.x).toBeGreaterThanOrEqual(Math.round(sidebarBox.x + sidebarBox.width) - 1);
    expect(mainBoxOpen.x).toBeGreaterThan(mainBoxClosed.x);
  });

  test("sidebar-width=icon narrows the sidebar to a rail and collapses the slotted app-sidebar, in both overlay and push mode", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const shell = page.locator("#app-shell-demo");

    await page.locator("#app-shell-toggle-sidebar").click(); // open, overlay mode (default)
    const fullWidthBox = (await shell.locator("aside.sidebar").boundingBox())!;

    await page.locator("#app-shell-toggle-sidebar-width").click();
    await expect(shell).toHaveAttribute("sidebar-width", "icon");
    const iconOverlayBox = (await shell.locator("aside.sidebar").boundingBox())!;
    expect(iconOverlayBox.width).toBeLessThan(fullWidthBox.width);
    await expect(page.locator("#app-shell-sidebar")).toHaveAttribute("collapsed", "");

    await page.locator("#app-shell-toggle-sidebar-mode").click(); // switch to push, still icon width
    await expect(shell).toHaveAttribute("sidebar-mode", "push");
    const iconPushBox = (await shell.locator("aside.sidebar").boundingBox())!;
    expect(iconPushBox.width).toBeLessThan(fullWidthBox.width);
    await expect(page.locator("#app-shell-sidebar")).toHaveAttribute("collapsed", "");
  });

  test("mobile ignores sidebar-mode/sidebar-width and always renders a full-screen, dismissible overlay", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await page.goto("/");
    const shell = page.locator("#app-shell-demo");

    await page.locator("#app-shell-toggle-sidebar").click();
    await page.locator("#app-shell-toggle-sidebar-mode").click();
    await page.locator("#app-shell-toggle-sidebar-width").click();
    await expect(shell).toHaveAttribute("sidebar-mode", "push");
    await expect(shell).toHaveAttribute("sidebar-width", "icon");

    const sidebarBox = (await shell.locator("aside.sidebar").boundingBox())!;
    const shellBox = (await shell.boundingBox())!;
    expect(Math.round(sidebarBox.width)).toBeGreaterThanOrEqual(Math.round(shellBox.width) - 1);
    await expect(shell.locator(".scrim")).toBeVisible();
  });
});

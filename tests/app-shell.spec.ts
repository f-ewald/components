import { test, expect } from "@playwright/test";

test.describe("app-shell", () => {
  test("arranges the sidebar, main list, and footer pager", async ({ page }) => {
    await page.goto("/");
    const shell = page.locator("#app-shell-demo");
    await expect(shell.locator("#app-shell-table")).toContainText("Ada Lovelace");
    await expect(shell.locator("#app-shell-pager")).toContainText("Page 1 of 5");
    await expect(shell.locator("#app-shell-sidebar")).toContainText("Members");
  });

  test("the built-in toggle collapses the sidebar to a rail on desktop", async ({ page }) => {
    await page.goto("/");
    const shell = page.locator("#app-shell-demo");
    await shell.locator(".nav-toggle").click();
    await expect(shell).toHaveAttribute("sidebar-collapsed", "");
    // The rail state propagates to the slotted sidebar so its labels hide.
    await expect(shell.locator("#app-shell-sidebar")).toHaveAttribute("collapsed", "");
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
    await expect(shell).not.toHaveAttribute("sidebar-collapsed", "");

    await page.keyboard.press("[");
    await expect(shell).toHaveAttribute("sidebar-collapsed", "");
    await page.keyboard.press("[");
    await expect(shell).not.toHaveAttribute("sidebar-collapsed", "");

    // Typing "[" inside the search field must not toggle the sidebar.
    const search = shell.locator("autocomplete-input input");
    await search.click();
    await search.press("[");
    await expect(shell).not.toHaveAttribute("sidebar-collapsed", "");
    await expect(search).toHaveValue("[");
  });

  test("reveals the shortcut in a tooltip on hover, not as permanent chrome", async ({ page }) => {
    await page.goto("/");
    const shell = page.locator("#app-shell-demo");
    const tip = shell.locator(".nav-tip");
    await expect(tip).toBeHidden();

    await shell.locator(".nav-toggle").hover();
    await expect(tip).toBeVisible();
    await expect(tip).toContainText("Collapse sidebar");
    await expect(tip).toContainText("[");
  });
});

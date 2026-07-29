import { test, expect } from "@playwright/test";

test.describe("tab-bar", () => {
  test("clicking a tab selects it, hides the others, and fires change", async ({ page }) => {
    await page.goto("/");
    const host = page.locator("#tab-bar-demo");
    const overviewTab = host.getByRole("tab", { name: "Overview" });
    const activityTab = host.getByRole("tab", { name: "Activity" });

    await expect(overviewTab).toHaveAttribute("aria-selected", "true");
    await expect(page.getByText("Project overview content goes here.")).toBeVisible();
    await expect(page.getByText("Recent activity content goes here.")).not.toBeVisible();

    await activityTab.click();
    await expect(activityTab).toHaveAttribute("aria-selected", "true");
    await expect(overviewTab).toHaveAttribute("aria-selected", "false");
    await expect(page.getByText("Recent activity content goes here.")).toBeVisible();
    await expect(page.getByText("Project overview content goes here.")).not.toBeVisible();
    await expect(page.locator("#tab-bar-log")).toHaveText("Active tab: activity");
  });

  test("clicking the already-active tab does not re-fire change", async ({ page }) => {
    await page.goto("/");
    const host = page.locator("#tab-bar-demo");
    await host.getByRole("tab", { name: "Overview" }).click();
    await expect(page.locator("#tab-bar-log")).toHaveText("Active tab: overview");
  });

  test("arrow keys move focus and selection with wraparound; Home/End jump to the ends", async ({ page }) => {
    await page.goto("/");
    const host = page.locator("#tab-bar-demo");
    const overviewTab = host.getByRole("tab", { name: "Overview" });
    const activityTab = host.getByRole("tab", { name: "Activity" });
    const settingsTab = host.getByRole("tab", { name: "Settings" });

    await overviewTab.focus();
    await page.keyboard.press("ArrowRight");
    await expect(activityTab).toHaveAttribute("aria-selected", "true");
    await expect(activityTab).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(settingsTab).toHaveAttribute("aria-selected", "true");

    await page.keyboard.press("ArrowRight");
    await expect(overviewTab).toHaveAttribute("aria-selected", "true");

    await page.keyboard.press("ArrowLeft");
    await expect(settingsTab).toHaveAttribute("aria-selected", "true");

    await page.keyboard.press("Home");
    await expect(overviewTab).toHaveAttribute("aria-selected", "true");

    await page.keyboard.press("End");
    await expect(settingsTab).toHaveAttribute("aria-selected", "true");
  });

  test("only the selected tab is in the tab order (roving tabindex)", async ({ page }) => {
    await page.goto("/");
    const host = page.locator("#tab-bar-demo");
    await expect(host.getByRole("tab", { name: "Overview" })).toHaveAttribute("tabindex", "0");
    await expect(host.getByRole("tab", { name: "Activity" })).toHaveAttribute("tabindex", "-1");
    await expect(host.getByRole("tab", { name: "Settings" })).toHaveAttribute("tabindex", "-1");
  });

  test("uses the primary-color active underline and a shared border line beneath the strip", async ({ page }) => {
    await page.goto("/");
    const tablist = page.locator("#tab-bar-demo .tablist");
    await expect(tablist).toHaveCSS("border-bottom-color", "rgb(226, 232, 240)");
    const activeTab = page.locator("#tab-bar-demo").getByRole("tab", { name: "Overview" });
    await expect(activeTab).toHaveCSS("border-bottom-color", "rgb(79, 70, 229)");
  });
});

import { test, expect } from "@playwright/test";

test.describe("layout templates", () => {
  test("list-only renders the shell, the list, and the pager", async ({ page }) => {
    await page.goto("/demo/layouts/list-only.html");
    await expect(page.locator("app-shell")).toBeVisible();
    await expect(page.locator('[data-testid="tpl-table"]')).toContainText("Ada Lovelace");
    await expect(page.locator("pagination-nav")).toContainText("Page 1 of 6");
  });

  test("list-only's topbar popover opens on click and dismisses on Escape", async ({ page }) => {
    await page.goto("/demo/layouts/list-only.html");
    const popover = page.locator('[data-testid="tpl-quick-actions-popover"]');
    await expect(popover).not.toBeVisible();

    await page.locator('[data-testid="tpl-quick-actions-trigger"]').click();
    await expect(popover).toBeVisible();
    await expect(popover).toContainText("Export CSV");

    await page.keyboard.press("Escape");
    await expect(popover).not.toBeVisible();
  });

  test("list-only's topbar fullscreen report opens on click and dismisses on Escape", async ({
    page,
  }) => {
    await page.goto("/demo/layouts/list-only.html");
    const report = page.locator('[data-testid="tpl-fullscreen-report"]');
    const dialog = report.getByRole("dialog");
    await expect(dialog).not.toBeVisible();

    await page.locator('[data-testid="tpl-fullscreen-report-open"]').click();
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAccessibleName("Members — full report");
    await expect(report).toHaveAttribute("size", "fullscreen");
    await expect(report.locator("data-table")).toContainText("Ada Lovelace");

    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });

  test("list + detail opens the detail pane for the selected row", async ({ page }) => {
    await page.goto("/demo/layouts/list-detail.html");
    await page.locator('[data-testid="tpl-table"]').getByText("Ada Lovelace").click();
    await expect(page.locator("app-shell")).toHaveAttribute("detail-open", "");
    await expect(page.locator("[data-tpl-detail-body]")).toContainText("ada@acme.test");
  });

  test("detail-only puts the primary action in the header and has no form footer", async ({
    page,
  }) => {
    await page.goto("/demo/layouts/detail-only.html");
    await expect(page.locator('[data-testid="tpl-page-header"]')).toContainText("Ada Lovelace");
    await expect(page.locator("frame-box").first()).toContainText("ada@acme.test");
    // The record's main action is the prominent primary, in the header...
    await expect(page.locator('[data-testid="tpl-edit"]')).toHaveAttribute("variant", "primary");
    // ...and a read view has no redundant form-actions footer.
    await expect(page.locator("form-actions")).toHaveCount(0);
  });

  test("record + metadata rail places the metadata to the right of the body on desktop", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto("/demo/layouts/record-detail.html");
    const bodyEl = page.locator(".ticket-body");
    const meta = page.locator('[data-testid="tpl-meta"]');
    await expect(page.locator("app-shell")).toBeVisible();
    await expect(meta).toContainText("In Progress");
    await expect(meta).toContainText("Ada Lovelace");

    const bodyBox = await bodyEl.boundingBox();
    const metaBox = await meta.boundingBox();
    expect(metaBox!.x).toBeGreaterThan(bodyBox!.x);
  });

  test("form page keeps the submit on the page and reports it", async ({ page }) => {
    await page.goto("/demo/layouts/form-page.html");
    await page.locator('[data-testid="tpl-form"] ui-button[type="submit"]').click();
    await expect(page.locator('[data-tpl-form-status]')).toHaveText("Saved.");
  });
});

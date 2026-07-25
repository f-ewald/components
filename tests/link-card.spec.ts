import { test, expect } from "@playwright/test";

test.describe("link-card", () => {
  test("renders as a link with target/rel when href is set", async ({ page }) => {
    await page.goto("/");
    const card = page.locator("#link-logo");

    await expect(card.locator("a.card")).toHaveCount(1);
    await expect(card.locator("a.card")).toHaveAttribute("href", "https://grafana.example.com");
    await expect(card.locator("a.card")).toHaveAttribute("target", "_blank");
    await expect(card.locator("a.card")).toHaveAttribute("rel", "noopener noreferrer");
    await expect(card.locator(".heading")).toHaveText("Grafana");
    await expect(card.locator(".description")).toHaveText("Metrics dashboards.");
  });

  test("renders as a non-interactive tile when href is unset", async ({ page }) => {
    await page.goto("/");
    const card = page.locator("#link-no-href");

    await expect(card.locator("a.card")).toHaveCount(0);
    await expect(card.locator("div.card")).toHaveCount(1);
    await expect(card.locator(".heading")).toHaveText("Internal Notes");
  });

  test("shows a logo image when set", async ({ page }) => {
    await page.goto("/");
    const card = page.locator("#link-logo");

    await expect(card.locator(".logo img")).toBeVisible();
    await expect(card.locator(".initial")).toHaveCount(0);
  });

  test("falls back to an initial letter when no logo is set", async ({ page }) => {
    await page.goto("/");
    const card = page.locator("#link-initial");

    await expect(card.locator(".logo img")).toHaveCount(0);
    await expect(card.locator(".initial")).toHaveText("P");
  });

  test("falls back to an initial letter when the logo URL fails to load", async ({ page }) => {
    await page.goto("/");
    const card = page.locator("#link-broken-logo");

    await expect(card.locator(".logo img")).toHaveCount(0);
    await expect(card.locator(".initial")).toHaveText("U");
  });

  test("renders a status dot with the correct color and accessible label per status", async ({ page }) => {
    await page.goto("/");

    const up = page.locator("#link-logo .status");
    await expect(up).toHaveAccessibleName("Reachable");
    await expect(up).toHaveCSS("background-color", "rgb(22, 163, 74)"); // --ui-success

    const down = page.locator("#link-initial .status");
    await expect(down).toHaveAccessibleName("Unreachable");
    await expect(down).toHaveCSS("background-color", "rgb(220, 38, 38)"); // --ui-danger

    const checking = page.locator("#link-checking .status");
    await expect(checking).toHaveAccessibleName("Checking…");
    await expect(checking).toHaveCSS("background-color", "rgb(100, 116, 139)"); // --ui-text-muted
  });

  test("renders no status dot when status is unset", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#link-no-href .status")).toHaveCount(0);
  });
});

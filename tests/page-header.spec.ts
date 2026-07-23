import { test, expect } from "@playwright/test";

test.describe("page-header", () => {
  test("renders the heading, breadcrumb, and right-aligned actions", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("#page-header-demo");
    await expect(header.locator(".title")).toHaveText("Team members");
    await expect(header).toContainText("Home / Settings / Members");

    const action = page.locator('[data-testid="page-header-action"]');
    const title = header.locator(".title");
    const actionBox = await action.boundingBox();
    const titleBox = await title.boundingBox();
    expect(actionBox!.x).toBeGreaterThan(titleBox!.x);
  });

  test("collapses the breadcrumb row when nothing is slotted into it", async ({ page }) => {
    await page.goto("/");
    const display = await page.evaluate(async () => {
      const header = document.createElement("page-header") as HTMLElement & {
        updateComplete: Promise<unknown>;
      };
      header.setAttribute("heading", "Bare");
      document.body.append(header);
      await header.updateComplete;
      const crumb = header.shadowRoot!.querySelector(".breadcrumb")!;
      const value = getComputedStyle(crumb).display;
      header.remove();
      return value;
    });
    expect(display).toBe("none");
  });
});

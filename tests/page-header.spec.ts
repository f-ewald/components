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

  test("renders the description under the heading", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("#page-header-demo");
    const description = header.locator(".description");
    await expect(description).toContainText("Everyone with access to this workspace");

    const titleBox = await header.locator(".title").boundingBox();
    const descriptionBox = await description.boundingBox();
    expect(descriptionBox!.y).toBeGreaterThan(titleBox!.y);
  });

  test("keeps the actions on the title row, not beside the description", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("#page-header-demo");
    const titleBox = (await header.locator(".title").boundingBox())!;
    const actionBox = (await page.locator('[data-testid="page-header-action"]').boundingBox())!;
    const descriptionBox = (await header.locator(".description").boundingBox())!;

    // Centered on the heading — so its position is a function of the title
    // alone and never shifts when the description wraps to another line.
    const titleCenter = titleBox.y + titleBox.height / 2;
    const actionCenter = actionBox.y + actionBox.height / 2;
    expect(Math.abs(actionCenter - titleCenter)).toBeLessThanOrEqual(1);
    expect(actionBox.y + actionBox.height).toBeLessThanOrEqual(descriptionBox.y + 1);
  });

  test("omits the description entirely when none is given", async ({ page }) => {
    await page.goto("/");
    const count = await page.evaluate(async () => {
      const header = document.createElement("page-header") as HTMLElement & {
        updateComplete: Promise<unknown>;
      };
      header.setAttribute("heading", "Bare");
      document.body.append(header);
      await header.updateComplete;
      const value = header.shadowRoot!.querySelectorAll(".description").length;
      header.remove();
      return value;
    });
    expect(count).toBe(0);
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

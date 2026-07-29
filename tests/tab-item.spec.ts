import { test, expect } from "@playwright/test";

test.describe("tab-item", () => {
  test("is hidden by default, exposes the tabpanel role, and becomes visible when selected", async ({
    page,
  }) => {
    await page.goto("/");
    const created = await page.evaluate(() => {
      const item = document.createElement("tab-item");
      item.id = "standalone-tab-item";
      item.textContent = "Standalone panel content";
      document.body.append(item);
      return { role: item.getAttribute("role"), tabindex: item.getAttribute("tabindex") };
    });
    expect(created.role).toBe("tabpanel");
    expect(created.tabindex).toBe("0");

    const item = page.locator("#standalone-tab-item");
    await expect(item).not.toBeVisible();

    await page.evaluate(() => {
      (document.getElementById("standalone-tab-item") as HTMLElement & { selected: boolean }).selected =
        true;
    });
    await expect(item).toBeVisible();
    await expect(item).toHaveText("Standalone panel content");
  });

  test("auto-assigns a unique id when none is set", async ({ page }) => {
    await page.goto("/");
    const ids = await page.evaluate(() => {
      const a = document.createElement("tab-item");
      const b = document.createElement("tab-item");
      document.body.append(a, b);
      return [a.id, b.id];
    });
    expect(ids[0]).toMatch(/^tab-item-\d+$/);
    expect(ids[1]).toMatch(/^tab-item-\d+$/);
    expect(ids[0]).not.toBe(ids[1]);
  });
});

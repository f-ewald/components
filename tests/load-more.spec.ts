import { test, expect } from "@playwright/test";

test.describe("load-more", () => {
  test("bottom click fires load-more with direction, shows busy, then loads and eventually exhausts", async ({
    page,
  }) => {
    await page.goto("/");
    const btn = page.locator("#load-more-bottom");
    const list = page.locator("#load-more-list li");

    const detailPromise = btn.evaluate(
      (el) => new Promise((resolve) => el.addEventListener("load-more", (e) => resolve((e as CustomEvent).detail), { once: true })),
    );
    await btn.locator("button").click();
    expect(await detailPromise).toEqual({ direction: "bottom" });

    await expect(list).toHaveCount(5);
    await btn.locator("button").click();
    await expect(list).toHaveCount(7);
    await expect(btn.locator("button")).toBeDisabled();
    await expect(btn.locator("ui-button")).toHaveText("No more results");
  });

  test("top direction fires load-more with direction: top and reaches exhausted after one load", async ({
    page,
  }) => {
    await page.goto("/");
    const btn = page.locator("#load-more-top");
    const list = page.locator("#load-more-list li");
    const countBefore = await list.count();

    const detailPromise = btn.evaluate(
      (el) => new Promise((resolve) => el.addEventListener("load-more", (e) => resolve((e as CustomEvent).detail), { once: true })),
    );
    await btn.locator("button").click();
    expect(await detailPromise).toEqual({ direction: "top" });

    await expect(list).toHaveCount(countBefore + 1);
    await expect(list.first()).toHaveText("Item 0 (older)");
    await expect(btn.locator("button")).toBeDisabled();
    await expect(btn.locator("ui-button")).toHaveText("No more results");
  });
});

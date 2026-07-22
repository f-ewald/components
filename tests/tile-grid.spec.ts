import { test, expect } from "@playwright/test";

test.describe("tile-grid", () => {
  test("renders one tile per item", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#grid-files");

    await expect(el.locator(".tile")).toHaveCount(2);
    await expect(el.locator(".tile")).toHaveText(["notes.txt", "photo.jpg"]);
  });

  test("clicking a tile navigates via itemHref", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#grid-files");

    await el.locator(".tile").first().click();
    await expect(page).toHaveURL(/#fil_1$/);
  });

  test("clickable tiles expose link semantics and keyboard activation", async ({ page }) => {
    await page.goto("/");
    const tile = page.locator("#grid-files .tile").first();

    await expect(tile).toHaveAttribute("role", "link");
    await expect(tile).toHaveAttribute("tabindex", "0");
    await tile.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#fil_1$/);
  });

  test("nested controls do not activate their clickable tile", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(async () => {
      const grid = document.getElementById("grid-files") as HTMLElement & {
        renderTile: () => unknown;
        updateComplete: Promise<boolean>;
      };
      grid.renderTile = () => {
        const button = document.createElement("button");
        button.textContent = "Nested action";
        return button;
      };
      await grid.updateComplete;
    });

    await page.locator("#grid-files .tile").first().getByRole("button").click();
    await expect(page).not.toHaveURL(/#fil_1$/);
  });

  test("file-icon renders a decorative document icon per tile", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#grid-files");

    const icons = el.locator(".tile .tile-icon");
    await expect(icons).toHaveCount(2);
    // The filename already identifies the tile, so the exact document glyph is decorative.
    await expect(icons.first()).toHaveAttribute("aria-hidden", "true");
    const icon = icons.first().locator("svg");
    await expect(icon).toHaveAttribute("aria-hidden", "true");
    await expect(icon).toHaveAttribute("width", "14");
    await expect(icon).toHaveAttribute("height", "14");
    await expect(icon).toHaveAttribute("stroke", "currentColor");
    await expect(icon.locator("path")).toHaveAttribute(
      "d",
      "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z",
    );
  });

  test("file-icon does not override the tile's accessible name", async ({ page }) => {
    await page.goto("/");
    const tile = page.locator("#grid-files .tile").first();

    await expect(tile).toHaveAccessibleName("notes.txt");
  });

  test("fileIcon=false renders no icon and no extra wrapper markup", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(async () => {
      const grid = document.getElementById("grid-files") as HTMLElement & {
        fileIcon: boolean;
        updateComplete: Promise<boolean>;
      };
      grid.fileIcon = false;
      await grid.updateComplete;
    });

    const el = page.locator("#grid-files");
    await expect(el.locator(".tile-icon")).toHaveCount(0);
    await expect(el.locator(".tile-body")).toHaveCount(0);
    await expect(el.locator(".tile")).toHaveText(["notes.txt", "photo.jpg"]);
  });
});

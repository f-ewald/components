import { test, expect } from "@playwright/test";

test.describe("tree-view", () => {
  test("renders top-level nodes with folders collapsed by default", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#tree-files");

    // Only the two top-level rows (docs, readme.md) — the nested notes.txt stays hidden.
    await expect(el.locator(".row")).toHaveCount(2);
    await expect(el.locator(".row")).toHaveText(["docs", "readme.md"]);
  });

  test("clicking a folder row expands it and shows its children", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#tree-files");

    await el.locator(".row").filter({ hasText: "docs" }).click();
    await expect(el.locator(".row")).toHaveCount(3);
    await expect(el.locator(".row").nth(1)).toHaveText("notes.txt");
  });

  test("clicking an expanded folder row collapses it again", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#tree-files");
    const folder = el.locator(".row").filter({ hasText: "docs" });

    await folder.click();
    await expect(el.locator(".row")).toHaveCount(3);
    await folder.click();
    await expect(el.locator(".row")).toHaveCount(2);
  });

  test("clicking a leaf row fires node-click and does not toggle anything", async ({ page }) => {
    await page.goto("/");

    await page.locator("#tree-files .row").filter({ hasText: "readme.md" }).click();
    await expect(page).toHaveURL(/#fil_2$/);
  });

  test("folder rows expose aria-expanded and keyboard activation", async ({ page }) => {
    await page.goto("/");
    const folder = page.locator("#tree-files .row").filter({ hasText: "docs" });

    await expect(folder).toHaveAttribute("role", "button");
    await expect(folder).toHaveAttribute("aria-expanded", "false");
    await folder.focus();
    await page.keyboard.press("Enter");
    await expect(folder).toHaveAttribute("aria-expanded", "true");
  });

  test("leaf rows expose link role and keyboard activation", async ({ page }) => {
    await page.goto("/");
    const leaf = page.locator("#tree-files .row").filter({ hasText: "readme.md" });

    await expect(leaf).toHaveAttribute("role", "link");
    await leaf.focus();
    await page.keyboard.press(" ");
    await expect(page).toHaveURL(/#fil_2$/);
  });

  test("default-expanded starts every folder open", async ({ page }) => {
    // A fresh element, not #tree-files — defaultExpanded only governs a node's
    // FIRST nodes assignment, so it must be set before nodes is ever set.
    await page.goto("/");
    await page.evaluate(async () => {
      const tree = document.createElement("tree-view") as HTMLElement & {
        nodes: unknown;
        defaultExpanded: boolean;
        updateComplete: Promise<boolean>;
      };
      tree.id = "tree-fresh";
      tree.defaultExpanded = true;
      tree.nodes = [
        { id: "docs", label: "docs", children: [{ id: "fil_1", label: "notes.txt" }] },
      ];
      document.body.appendChild(tree);
      await tree.updateComplete;
    });

    const el = page.locator("#tree-fresh");
    await expect(el.locator(".row")).toHaveCount(2);
    await expect(el.locator(".row").nth(1)).toHaveText("notes.txt");
  });

  test("nested controls do not activate their row", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(async () => {
      const tree = document.getElementById("tree-files") as HTMLElement & {
        renderNode: (node: unknown) => unknown;
        updateComplete: Promise<boolean>;
      };
      tree.renderNode = (node) => {
        const button = document.createElement("button");
        button.textContent = (node as { label: string }).label;
        return button;
      };
      await tree.updateComplete;
    });

    await page
      .locator("#tree-files .row")
      .filter({ hasText: "readme.md" })
      .getByRole("button")
      .click();
    await expect(page).not.toHaveURL(/#fil_2$/);
  });

  test("nested rows indent deeper than their parent", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#tree-files");
    await el.locator(".row").filter({ hasText: "docs" }).click();

    const parentPadding = await el
      .locator(".row")
      .filter({ hasText: "docs" })
      .evaluate((node) => (node as HTMLElement).style.paddingLeft);
    const childPadding = await el
      .locator(".row")
      .filter({ hasText: "notes.txt" })
      .evaluate((node) => (node as HTMLElement).style.paddingLeft);
    expect(parseFloat(childPadding)).toBeGreaterThan(parseFloat(parentPadding));
  });
});

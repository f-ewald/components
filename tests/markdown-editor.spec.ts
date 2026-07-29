import { test, expect } from "@playwright/test";

test.describe("markdown-editor", () => {
  test("the Write tab is active by default and holds the seeded raw value", async ({ page }) => {
    await page.goto("/");
    const host = page.locator("#markdown-editor-demo");
    await expect(host.getByRole("tab", { name: "Write" })).toHaveAttribute("aria-selected", "true");
    const textarea = host.locator("text-area textarea");
    await expect(textarea).toBeVisible();
    await expect(textarea).toHaveValue(/title: Weekly status/);
  });

  test("typing in Write updates value and fires input", async ({ page }) => {
    await page.goto("/");
    const host = page.locator("#markdown-editor-demo");
    const textarea = host.locator("text-area textarea");

    await page.evaluate(() => {
      document.getElementById("markdown-editor-demo")!.addEventListener("input", (e) => {
        document.body.dataset.mdInputLength = String((e as CustomEvent<{ value: string }>).detail.value.length);
      });
    });

    await textarea.fill("# Replaced\n\nBrand new content.");
    const value = await host.evaluate((el) => (el as HTMLElement & { value: string }).value);
    expect(value).toBe("# Replaced\n\nBrand new content.");
    await expect(page.locator("body")).toHaveAttribute("data-md-input-length", String(value.length));
  });

  test("Preview shows the parsed front-matter table and the rendered markdown body", async ({ page }) => {
    await page.goto("/");
    const host = page.locator("#markdown-editor-demo");
    await host.getByRole("tab", { name: "Preview" }).click();

    await expect(host.getByRole("tab", { name: "Preview" })).toHaveAttribute("aria-selected", "true");
    const frontMatter = host.locator("frame-box");
    await expect(frontMatter).toContainText("title");
    await expect(frontMatter).toContainText("Weekly status");
    await expect(frontMatter).toContainText("author");
    await expect(frontMatter).toContainText("Ada Lovelace");
    await expect(frontMatter).toContainText("tags");
    await expect(frontMatter).toContainText("engineering, updates");

    await expect(host.locator("markdown-view").getByRole("heading", { name: "Weekly status" })).toBeVisible();
  });

  test("a document without front matter shows no front-matter block", async ({ page }) => {
    await page.goto("/");
    const host = page.locator("#markdown-editor-demo");
    await host.evaluate((el) => {
      (el as HTMLElement & { value: string }).value = "# Just a heading\n\nNo front matter here.";
    });
    await host.getByRole("tab", { name: "Preview" }).click();

    await expect(host.locator("frame-box")).toHaveCount(0);
    await expect(
      host.locator("markdown-view").getByRole("heading", { name: "Just a heading" }),
    ).toBeVisible();
  });
});

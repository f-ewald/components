import { test, expect } from "@playwright/test";

test.describe("markdown-view", () => {
  test("renders a heading, a fenced code block, and a table from the markdown source", async ({
    page,
  }) => {
    await page.goto("/");
    const view = page.locator("#markdown-view-demo");

    await expect(view.locator("h2")).toHaveText("Release notes");
    await expect(view.locator("pre code")).toContainText('el.markdown = "# Hello"');
    await expect(view.locator("table th").first()).toHaveText("Component");
    await expect(view.locator("table td").first()).toHaveText("markdown-view");
    await expect(view.locator("a")).toHaveAttribute("href", "#markdown-view");
  });

  test("strips a <script> tag in the markdown source via DOMPurify", async ({ page }) => {
    await page.goto("/");
    const view = page.locator("#markdown-view-demo");

    // The demo content includes a literal `<script>` inside an inline-code
    // span (as text, escaped by marked) — assert no live <script> element
    // exists inside the rendered shadow DOM.
    const scriptCount = await view.evaluate(
      (el) => el.shadowRoot?.querySelectorAll("script").length ?? 0,
    );
    expect(scriptCount).toBe(0);

    // Directly verify the sanitizer itself against a real <script> element,
    // not just marked's own escaping of inline code.
    const strippedDirectly = await page.evaluate(async () => {
      const el = document.createElement("markdown-view") as HTMLElement & { markdown: string };
      el.markdown = '<script>window.__xss = true;</script>\n\n# Safe heading';
      document.body.appendChild(el);
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const html = el.shadowRoot?.querySelector(".body")?.innerHTML ?? "";
      el.remove();
      return !html.includes("<script") && html.includes("Safe heading");
    });
    expect(strippedDirectly).toBe(true);
  });
});

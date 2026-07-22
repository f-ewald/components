import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const indexHtml = readFileSync(path.join(root, "index.html"), "utf8");
const sectionIds = [
  ...indexHtml.matchAll(/^        <section id="([^"]+)"/gm),
].map((match) => match[1]);

/** Parses one literal token map from src/tokens.ts. */
function tokenMap(name: "tokenValues" | "darkTokenValues"): Record<string, string> {
  const source = readFileSync(path.join(root, "src/tokens.ts"), "utf8");
  const marker = source.indexOf(`export const ${name}`);
  const start = source.indexOf("{", marker);
  const end = source.indexOf("\n};", start);
  if (marker < 0 || start < 0 || end < 0) throw new Error(`${name} not found`);
  const literal = source.slice(start, end + 2).replace(/\/\/.*$/gm, "");
  return Function(`"use strict"; return (${literal});`)() as Record<string, string>;
}

const lightTokens = tokenMap("tokenValues");
const darkTokens = { ...lightTokens, ...tokenMap("darkTokenValues") };

test.beforeEach(async ({ page }, testInfo) => {
  await page.clock.install({ time: new Date("2026-07-20T12:00:00Z") });
  await page.addInitScript(() => {
    let seed = 0x12345678;
    Math.random = () => {
      seed = (1664525 * seed + 1013904223) >>> 0;
      return seed / 0x100000000;
    };
  });
  await page.goto("/");

  const tokens = testInfo.project.name === "dark" ? darkTokens : lightTokens;
  const declarations = Object.entries(tokens)
    .map(([name, value]) => `${name}: ${value};`)
    .join("\n");
  const darkChrome =
    testInfo.project.name === "dark"
      ? `
        body { background: #020617 !important; color: #f1f5f9 !important; }
        main section > div {
          background: #0f172a !important;
          border-color: #334155 !important;
          color: #f1f5f9 !important;
        }
      `
      : "";
  await page.addStyleTag({
    content: `
      :root { ${declarations} }
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        caret-color: transparent !important;
      }
      ${darkChrome}
    `,
  });
});

for (const sectionId of sectionIds) {
  test(`${sectionId} default`, async ({ page }) => {
    const liveExample = page.locator(`#${sectionId} > div`).first();
    await expect(liveExample).toBeVisible();
    await expect(liveExample).toHaveScreenshot(`${sectionId}.png`);
  });
}

test("open overlays and menus", async ({ page }) => {
  await page.locator("#confirm-open").click();
  await expect(page.locator("#confirm-demo .dialog")).toHaveScreenshot(
    "confirm-dialog-open.png",
  );
  await page.keyboard.press("Escape");

  await page.locator("#panel-open").click();
  await expect(page.locator("#panel-demo .panel")).toHaveScreenshot(
    "slide-panel-open.png",
  );
  await page.locator("#panel-demo .close-btn").click();

  await page.locator("#popover-open").click();
  await expect(page.locator("#popover-demo .panel")).toHaveScreenshot(
    "popover-panel-open.png",
  );

  await page.locator("#select-state button.trigger").click();
  await expect(page.locator("#select-state ul.options")).toHaveScreenshot(
    "form-select-open.png",
  );
});

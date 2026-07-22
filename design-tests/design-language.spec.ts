import { expect, test } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const metadataOnly = new Set([
  "calendar-entry",
  "gallery-item",
  "gallery-item-variant",
]);
const styleless = new Set([
  "distance-value",
  "live-timer",
  "relative-time",
  "roman-numeral",
]);

interface ManifestDeclaration {
  customElement?: boolean;
  tagName?: string;
}

interface ManifestModule {
  path: string;
  declarations?: ManifestDeclaration[];
}

interface CustomElementsManifest {
  modules: ManifestModule[];
}

/** Returns whitespace-insensitive CSS values while retaining meaningful punctuation. */
function normalizeCssValue(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ");
}

/** Parses the literal tokenValues object without importing TypeScript at runtime. */
function tokenValues(): Record<string, string> {
  const source = readFileSync(path.join(root, "src/tokens.ts"), "utf8");
  const marker = source.indexOf("export const tokenValues");
  const start = source.indexOf("{", marker);
  const end = source.indexOf("\n};", start);
  if (marker < 0 || start < 0 || end < 0) throw new Error("tokenValues object not found");
  const objectLiteral = source
    .slice(start, end + 2)
    .replace(/\/\/.*$/gm, "");
  return Function(`"use strict"; return (${objectLiteral});`)() as Record<string, string>;
}

/** Extracts `var(--ui-*, fallback)` usages with balanced nested functions. */
function tokenUsages(source: string): Array<{ token: string; fallback: string | null }> {
  const usages: Array<{ token: string; fallback: string | null }> = [];
  const pattern = /var\((--ui-[\w-]+)/g;
  for (const match of source.matchAll(pattern)) {
    let cursor = match.index + match[0].length;
    while (/\s/.test(source[cursor] ?? "")) cursor++;
    if (source[cursor] !== ",") {
      usages.push({ token: match[1], fallback: null });
      continue;
    }
    cursor++;
    const fallbackStart = cursor;
    let depth = 1;
    while (cursor < source.length && depth > 0) {
      if (source[cursor] === "(") depth++;
      else if (source[cursor] === ")") depth--;
      cursor++;
    }
    usages.push({
      token: match[1],
      fallback: source.slice(fallbackStart, cursor - 1),
    });
  }
  return usages;
}

test("public tags have tests/docs and an alphabetized playground catalog", () => {
  const manifest = JSON.parse(
    readFileSync(path.join(root, "custom-elements.json"), "utf8"),
  ) as CustomElementsManifest;
  const tags = manifest.modules
    .flatMap((module) =>
      (module.declarations ?? [])
        .filter((declaration) => declaration.customElement && declaration.tagName)
        .map((declaration) => declaration.tagName!),
    )
    .sort();

  for (const tag of tags) {
    expect(existsSync(path.join(root, `tests/${tag}.spec.ts`)), `${tag} test`).toBe(true);
    expect(existsSync(path.join(root, `docs/${tag}.md`)), `${tag} docs`).toBe(true);
  }

  const html = readFileSync(path.join(root, "index.html"), "utf8");
  const navIds = [...html.matchAll(/^          <a[^\n]+href="#([^"]+)"[^\n]*<\/a>$/gm)]
    .map((match) => match[1]);
  const sectionIds = [...html.matchAll(/^        <section id="([^"]+)"/gm)]
    .map((match) => match[1]);
  const expected = tags.filter((tag) => !metadataOnly.has(tag));

  expect(navIds).toEqual(expected);
  expect(sectionIds).toEqual(expected);
});

test("component sources follow shared style and import contracts", () => {
  const manifest = JSON.parse(
    readFileSync(path.join(root, "custom-elements.json"), "utf8"),
  ) as CustomElementsManifest;
  for (const module of manifest.modules) {
    const tags = (module.declarations ?? [])
      .filter((declaration) => declaration.customElement && declaration.tagName)
      .map((declaration) => declaration.tagName!);
    if (tags.length === 0) continue;
    const source = readFileSync(path.join(root, module.path), "utf8");

    for (const tag of tags) {
      if (styleless.has(tag)) {
        expect(source, `${tag} remains intentionally styleless`).not.toContain(
          "static override styles",
        );
      } else {
        expect(source, `${tag} imports shared tokens`).toContain(
          'import { tokens } from "./tokens.js";',
        );
        expect(source, `${tag} puts tokens first`).toMatch(
          /static override styles\s*=\s*\[\s*tokens\s*,/,
        );
      }
    }

    for (const relativeImport of source.matchAll(/from\s+["'](\.[^"']+)["']/g)) {
      expect(relativeImport[1], `${module.path} import`).toMatch(/\.js$/);
    }
  }
});

test("UI token usages have known tokens and exact fallbacks", () => {
  const values = tokenValues();
  const sourceFiles = readFileSync(path.join(root, "custom-elements.json"), "utf8");
  const manifest = JSON.parse(sourceFiles) as CustomElementsManifest;

  for (const module of manifest.modules) {
    if (!(module.declarations ?? []).some((declaration) => declaration.customElement)) {
      continue;
    }
    const source = readFileSync(path.join(root, module.path), "utf8");
    for (const usage of tokenUsages(source)) {
      expect(values, `${module.path} token ${usage.token}`).toHaveProperty(usage.token);
      expect(usage.fallback, `${module.path} ${usage.token} fallback`).not.toBeNull();
      expect(normalizeCssValue(usage.fallback!)).toBe(
        normalizeCssValue(values[usage.token]),
      );
    }
  }
});

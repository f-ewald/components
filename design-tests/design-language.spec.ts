import { expect, test } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const metadataOnly = new Set([
  "calendar-entry",
  "gallery-item",
  "gallery-item-variant",
  "kanban-card",
  "kanban-column",
  "timeline-entry",
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

/** Returns the manifest module paths that define at least one custom element. */
function componentModulePaths(): string[] {
  const manifest = JSON.parse(
    readFileSync(path.join(root, "custom-elements.json"), "utf8"),
  ) as CustomElementsManifest;
  return manifest.modules
    .filter((module) =>
      (module.declarations ?? []).some((declaration) => declaration.customElement),
    )
    .map((module) => module.path);
}

/** Collapses whitespace so multi-line CSS values compare as single tokens. */
function collapse(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

/** Returns whitespace-collapsed values of every `prop: value;` CSS declaration. */
function cssDeclarationValues(source: string, prop: string): string[] {
  const pattern = new RegExp(`\\b${prop}:\\s*([^;{}]+);`, "g");
  return [...source.matchAll(pattern)].map((match) => collapse(match[1]));
}

/** Returns one component source by manifest-relative path. */
function componentSource(modulePath: string): string {
  return readFileSync(path.join(root, modulePath), "utf8");
}

/** Escapes text for inclusion in a regular expression. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Asserts that a CSS selector's rule includes an exact declaration. */
function expectRuleDeclaration(
  modulePath: string,
  selectorPattern: string,
  property: string,
  value: string,
): void {
  const source = componentSource(modulePath);
  const rule = source.match(new RegExp(`${selectorPattern}\\s*\\{([^}]*)\\}`, "s"));
  expect(rule, `${modulePath} rule ${selectorPattern}`).not.toBeNull();
  expect(
    rule![1],
    `${modulePath} ${selectorPattern} ${property}`,
  ).toMatch(
    new RegExp(`\\b${escapeRegExp(property)}:\\s*${escapeRegExp(value)};`),
  );
}

/**
 * Migration allowlists — see docs/design-language.md "Measurement contracts and
 * migration waves". Each maps a component source path to the EXACT list of
 * literal declarations still awaiting tokenization by a later wave. The
 * contracts assert the live inventory equals these lists exactly, so entries
 * can only be removed (never added) as waves migrate each file. Empty means the
 * axis is fully migrated and now strictly enforced everywhere.
 */
const migration = {
  // Wave: font-weight → var(--ui-font-weight-regular|medium|semibold|bold, N)
  fontWeight: {} as Record<string, string[]>,
  // Wave: line-height → var(--ui-line-height-glyph|tight|normal, N). Values with
  // no matching token (1.15, 1.4, 1.45) are reconciled to the nearest token or
  // documented as domain geometry during migration.
  lineHeight: {
    "src/calendar-month.ts": ["1.15", "1.15"],
  } as Record<string, string[]>,
  // Wave: letter-spacing → var(--ui-tracking-normal|wide, …). 0.05em has no
  // token and is reconciled to --ui-tracking-wide during migration.
  tracking: {} as Record<string, string[]>,
  // Wave: font-family → var(--ui-font | --ui-font-mono, …) (empty: fully migrated).
  fontFamily: {} as Record<string, string[]>,
  // Wave: padding/margin/gap onto the 0.25rem grid.
  spacing: {} as Record<string, string[]>,
};

/**
 * Asserts, for every component module, that the literal declarations still
 * awaiting migration equal the axis allowlist exactly (order-independent).
 * `collect` returns the unmigrated literals for one source; anything it returns
 * that is not allowlisted fails as a new violation, and any allowlist entry it
 * no longer returns fails as a stale entry that a migration must delete.
 */
function assertMigrationInventory(
  allowlist: Record<string, string[]>,
  collect: (source: string) => string[],
): void {
  const paths = componentModulePaths();
  for (const stale of Object.keys(allowlist)) {
    expect(paths, `allowlisted ${stale} is a known component module`).toContain(stale);
  }
  for (const modulePath of paths) {
    const source = readFileSync(path.join(root, modulePath), "utf8");
    const actual = collect(source).sort();
    const expected = [...(allowlist[modulePath] ?? [])].sort();
    expect(actual, `${modulePath} unmigrated inventory`).toEqual(expected);
  }
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

test("font-weight is tokenized outside the migration allowlist", () => {
  assertMigrationInventory(migration.fontWeight, (source) =>
    cssDeclarationValues(source, "font-weight").filter(
      (value) => !value.startsWith("var(--ui-font-weight") && value !== "inherit",
    ),
  );
});

test("line-height is tokenized outside the migration allowlist", () => {
  // `line-height: 0` is a domain-geometry inline-box reset, not a type choice.
  assertMigrationInventory(migration.lineHeight, (source) =>
    cssDeclarationValues(source, "line-height").filter(
      (value) =>
        !value.startsWith("var(--ui-line-height") &&
        value !== "inherit" &&
        value !== "0",
    ),
  );
});

test("letter-spacing is tokenized outside the migration allowlist", () => {
  assertMigrationInventory(migration.tracking, (source) =>
    cssDeclarationValues(source, "letter-spacing").filter(
      (value) =>
        !value.startsWith("var(--ui-tracking") &&
        value !== "normal" &&
        value !== "0",
    ),
  );
});

test("font-family is tokenized outside the migration allowlist", () => {
  const inheritAllowed = new Set(["src/editable-text.ts"]);
  for (const modulePath of componentModulePaths()) {
    const source = componentSource(modulePath);
    const familyViolations = cssDeclarationValues(source, "font-family").filter(
      (value) =>
        !/^var\(\s*--ui-font/.test(value) &&
        !(value === "inherit" && inheritAllowed.has(modulePath)),
    );
    const shorthandViolations = cssDeclarationValues(source, "font").filter(
      (value) => !(value === "inherit" && inheritAllowed.has(modulePath)),
    );
    expect(
      [...familyViolations, ...shorthandViolations],
      `${modulePath} font ownership`,
    ).toEqual(migration.fontFamily[modulePath] ?? []);
  }
});

test("padding/margin/gap stay on the 0.25rem grid outside the migration allowlist", () => {
  // 0.125rem optical nudges are an allowed exception; non-rem units (px borders,
  // percentages, SVG/canvas geometry) are not spacing-grid declarations.
  const offGrid = (source: string): string[] => {
    const found: string[] = [];
    for (const prop of ["padding", "margin", "gap"]) {
      const pattern = new RegExp(`\\b${prop}(?:-[a-z]+)?:\\s*([^;{}]+);`, "g");
      for (const match of source.matchAll(pattern)) {
        for (const length of match[1].matchAll(/([0-9]*\.?[0-9]+)rem/g)) {
          const rem = Number.parseFloat(length[1]);
          if (rem === 0.125) continue;
          const steps = rem / 0.25;
          if (Math.abs(steps - Math.round(steps)) > 1e-9) {
            found.push(`${prop}: ${length[1]}rem`);
          }
        }
      }
    }
    return found;
  };
  assertMigrationInventory(migration.spacing, offGrid);
});

test("font-size uses the approved xs/sm/base/lg scale", () => {
  for (const modulePath of componentModulePaths()) {
    const source = componentSource(modulePath);
    const violations = cssDeclarationValues(source, "font-size").filter(
      (value) =>
        !value.startsWith("var(--ui-font-size") &&
        !(value === "inherit" && modulePath === "src/editable-text.ts"),
    );
    expect(violations, `${modulePath} font-size scale`).toEqual([]);
  }

  for (const modulePath of [
    "src/calendar-month.ts",
    "src/popover-panel.ts",
    "src/slide-panel.ts",
  ]) {
    expect(componentSource(modulePath), `${modulePath} uses the lg title tier`).toContain(
      "font-size: var(--ui-font-size-lg, 1rem);",
    );
  }
});

test("component icon calls use the approved inline and standalone sizes", () => {
  for (const modulePath of componentModulePaths()) {
    const source = componentSource(modulePath);
    for (const call of source.matchAll(/\bicon[A-Z][A-Za-z0-9]*\(\s*(\d+)\s*\)/g)) {
      expect([14, 18], `${modulePath} ${call[0]}`).toContain(Number(call[1]));
    }
  }

  const requiredCalls: Record<string, string[]> = {
    "src/chat-message.ts": ["iconChevronRight(14)"],
    "src/confirm-dialog.ts": ["iconArrowPath(14)"],
    "src/copy-link-button.ts": ["iconLink(18)"],
    "src/dropdown-button.ts": ["iconChevronRight(14)"],
    "src/form-select.ts": ["iconChevronRight(14)"],
    "src/photo-gallery.ts": ["iconChevronLeft(18)", "iconChevronRight(18)"],
    "src/popover-panel.ts": ["iconX(18)"],
    "src/slide-panel.ts": ["iconX(18)"],
    "src/status-pill.ts": ["iconArrowPath(14)"],
    "src/tile-grid.ts": ["iconDocument(14)"],
    "src/toast-notification.ts": ["iconX(18)"],
    "src/ui-button.ts": ["iconArrowPath(14)"],
  };
  for (const [modulePath, calls] of Object.entries(requiredCalls)) {
    const source = componentSource(modulePath);
    for (const call of calls) {
      expect(source, `${modulePath} contains ${call}`).toContain(call);
    }
  }
});

test("interactive controls use the approved 2rem target", () => {
  const exactHeightRules: Array<[string, string]> = [
    ["src/address-autocomplete.ts", "input"],
    ["src/autocomplete-input.ts", "input"],
    ["src/copy-link-button.ts", "button"],
    ["src/dropdown-button.ts", "button\\.trigger"],
    ["src/form-select.ts", "button\\.trigger"],
    ["src/form-select.ts", "\\.search-trigger"],
    ["src/icon-button.ts", "button"],
    ["src/photo-gallery.ts", "\\.arrow-button"],
    ["src/photo-gallery.ts", "\\.indicator"],
    ["src/photo-gallery.ts", "\\.autoplay-button"],
    ["src/popover-panel.ts", "\\.close-btn"],
    ["src/reveal-button.ts", "button"],
    ["src/slide-panel.ts", "\\.close-btn"],
    ["src/toast-notification.ts", "\\.close"],
    ["src/ui-button.ts", "\\.btn"],
  ];
  for (const [modulePath, selector] of exactHeightRules) {
    expectRuleDeclaration(modulePath, selector, "height", "2rem");
  }

  expectRuleDeclaration("src/chat-message.ts", "button\\.header", "min-height", "2rem");
  expectRuleDeclaration("src/radio-pills.ts", "\\.pill", "min-height", "2rem");
  expect(componentSource("src/confirm-dialog.ts"), "confirm-dialog button height").toMatch(
    /\.btn-cancel,\s*\.btn-danger,\s*\.btn-primary\s*\{[^}]*\bheight:\s*2rem;/s,
  );
});

test("panels and surface chrome use the approved measurements", () => {
  const slide = componentSource("src/slide-panel.ts");
  expect(slide).toContain("width: 20rem;");
  expect(slide).toContain("@media (max-width: 48rem)");
  expectRuleDeclaration("src/slide-panel.ts", "\\.panel-header", "padding", "0.75rem");

  const popover = componentSource("src/popover-panel.ts");
  expect(popover).toContain("width: 20rem;");
  expect(popover).toContain("width: 25rem;");
  expect(popover).toContain("max-width: calc(100vw - 2rem);");
  expectRuleDeclaration("src/popover-panel.ts", "\\.panel-header", "padding", "0.75rem");

  const confirm = componentSource("src/confirm-dialog.ts");
  expect(confirm).toContain("max-width: min(25rem, calc(100vw - 2rem));");
  expect(confirm).toContain("@media (max-width: 48rem)");
  expectRuleDeclaration("src/confirm-dialog.ts", "\\.dialog", "padding", "1rem");

  expectRuleDeclaration("src/chat-message.ts", "\\.body-card", "padding", "0.75rem");
  expectRuleDeclaration("src/frame-box.ts", "\\.frame", "padding", "0.75rem");
  expectRuleDeclaration("src/tile-grid.ts", "\\.tile", "padding", "0.75rem");
  expectRuleDeclaration("src/toast-notification.ts", "\\.toast", "padding", "0.75rem");

  for (const modulePath of componentModulePaths()) {
    const source = componentSource(modulePath);
    for (const match of source.matchAll(/@media\s*\(max-width:\s*([0-9.]+)rem\)/g)) {
      expect(match[1], `${modulePath} responsive breakpoint`).toBe("48");
    }
  }
});

test("value-entry form fields fill their container by default", () => {
  // The host is display:block and the inner control is width:100%, so a field
  // fills the column it lives in; shrink-to-fit stays an opt-in host override.
  const fields: Array<{ module: string; control: string }> = [
    { module: "src/autocomplete-input.ts", control: "input" },
    { module: "src/address-autocomplete.ts", control: "input" },
    { module: "src/editable-text.ts", control: "\\.display" },
    { module: "src/form-select.ts", control: "button\\.trigger" },
    { module: "src/multi-select.ts", control: "button\\.trigger" },
  ];
  for (const { module, control } of fields) {
    expectRuleDeclaration(module, ":host", "display", "block");
    expectRuleDeclaration(module, control, "width", "100%");
  }
});

test("layout components use the documented shell and pager metrics", () => {
  const shell = componentSource("src/app-shell.ts");
  expect(shell).toContain("var(--component-sidebar-width, 16rem)");
  expect(shell).toContain("var(--component-sidebar-rail-width, 3.5rem)");
  expect(shell).toContain("var(--component-topbar-height, 3rem)");
  expect(shell).toContain("@media (max-width: 48rem)");

  expectRuleDeclaration("src/pagination-nav.ts", "button", "width", "2rem");
  expectRuleDeclaration("src/pagination-nav.ts", "button", "height", "2rem");
});

#!/usr/bin/env node
// Reads the compiled tokenValues/darkTokenValues maps and writes
// dist/tokens.css, the optional consumer-facing stylesheet for overriding
// design tokens. Dark values apply by default under
// `prefers-color-scheme: dark`, overridable in either direction via a
// `data-theme="dark"|"light"` attribute on <html> (a manual toggle wins over
// the OS preference).
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { tokenValues, darkTokenValues } = await import(
  path.join(__dirname, "../dist/tokens.js")
);

const block = (values, indent = "  ") =>
  Object.entries(values)
    .map(([name, value]) => `${indent}${name}: ${value};`)
    .join("\n");

const css = `:root {
  color-scheme: light;
${block(tokenValues)}
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
${block(darkTokenValues, "    ")}
  }
}

:root[data-theme="dark"] {
  color-scheme: dark;
${block(darkTokenValues)}
}

:root[data-theme="light"] {
  color-scheme: light;
}
`;

await writeFile(path.join(__dirname, "../dist/tokens.css"), css, "utf8");
console.log("Wrote dist/tokens.css");

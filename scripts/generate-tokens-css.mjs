#!/usr/bin/env node
// Reads the compiled tokenValues map and writes dist/tokens.css, the
// optional consumer-facing stylesheet for overriding design tokens.
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { tokenValues } = await import(
  path.join(__dirname, "../dist/tokens.js")
);

const lines = Object.entries(tokenValues).map(
  ([name, value]) => `  ${name}: ${value};`
);

const css = `:root {\n${lines.join("\n")}\n}\n`;

await writeFile(path.join(__dirname, "../dist/tokens.css"), css, "utf8");
console.log("Wrote dist/tokens.css");

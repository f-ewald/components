#!/usr/bin/env node
// Reads the compiled tokenValues/darkTokenValues/gradientTokenValues/
// metroTokenValues/blueprintTokenValues maps and writes dist/tokens.css, the
// optional consumer-facing stylesheet for overriding design tokens. Dark
// values apply by default under `prefers-color-scheme: dark`, overridable via
// a `data-theme` attribute on <html>: "dark"|"light" force one of the two flat
// palettes (a manual toggle wins over the OS preference), "gradient" layers a
// glossy button/toast look on top of the light palette, "metro" flattens the
// light palette's corners and shadows over a blue accent, and "blueprint"
// restyles it as a monospace spec sheet ruled by hairlines. Every theme
// built on the light palette is excluded from the dark media query (see
// lightThemes below), so the OS dark preference can't override it.
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { buildTokensCss } from "./tokens-css.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const {
  tokenValues,
  darkTokenValues,
  gradientTokenValues,
  metroTokenValues,
  blueprintTokenValues,
} = await import(path.join(__dirname, "../dist/tokens.js"));

// Themes built on the light palette. Each entry produces both a [data-theme]
// block and an exclusion from the dark media query — see buildTokensCss.
const lightThemes = [
  ["light", {}],
  ["gradient", gradientTokenValues],
  ["metro", metroTokenValues],
  ["blueprint", blueprintTokenValues],
];

const css = buildTokensCss({ tokenValues, darkTokenValues, lightThemes });

await writeFile(path.join(__dirname, "../dist/tokens.css"), css, "utf8");
console.log("Wrote dist/tokens.css");

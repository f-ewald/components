// Pure builder for dist/tokens.css, kept separate from
// generate-tokens-css.mjs (which owns reading dist/ and writing the file) so
// design-tests can exercise this logic without a build step or a side effect —
// dist/ is gitignored and CI runs the test suites before any build.

const block = (values, indent = "  ") =>
  Object.entries(values)
    .map(([name, value]) => `${indent}${name}: ${value};`)
    .join("\n");

/**
 * Builds the tokens.css text.
 *
 * `lightThemes` is a list of `[name, values]` pairs for every theme layered on
 * the light palette. Each pair produces both a `:root[data-theme="name"]` block
 * and a `:not([data-theme="name"])` clause on the dark media query — the two
 * are derived from the same list because they must stay in step. Without the
 * exclusion the media query's `:root:not(...):not(...)` selector (0,3,0)
 * outranks a bare `:root[data-theme="x"]` (0,2,0), so under an OS dark
 * preference the dark palette silently wins on every token the theme shares
 * with it, leaving a half-themed hybrid rather than the theme.
 *
 * `darkThemes` is the equivalent list for themes that are *already* dark —
 * `"dark"` itself (values `{}`, since it's exactly `darkTokenValues`) plus any
 * other true dark palette (e.g. `"developer-dark"`). Each pair produces only
 * its own explicit `:root[data-theme="name"]` block layered over
 * `darkTokenValues`, with no media-query exclusion: a `:root[data-theme="x"]`
 * block (0,2,0) already outranks the bare `:root` (0,1,0) the dark media query
 * types into regardless of the reader's OS preference, so there is no
 * "silently loses to the dark media query" failure mode for these to guard
 * against the way there is for a light-based theme.
 */
export function buildTokensCss({ tokenValues, darkTokenValues, lightThemes, darkThemes = [] }) {
  const darkExclusion = lightThemes.map(([name]) => `:not([data-theme="${name}"])`).join("");

  const themeBlocks = lightThemes
    .map(([name, values]) => {
      const body = Object.keys(values).length > 0 ? `\n${block(values)}` : "";
      return `:root[data-theme="${name}"] {\n  color-scheme: light;${body}\n}`;
    })
    .join("\n\n");

  const darkThemeBlocks = darkThemes
    .map(([name, values]) => {
      const merged = { ...darkTokenValues, ...values };
      return `:root[data-theme="${name}"] {\n  color-scheme: dark;\n${block(merged)}\n}`;
    })
    .join("\n\n");

  return `:root {
  color-scheme: light;
${block(tokenValues)}
}

@media (prefers-color-scheme: dark) {
  :root${darkExclusion} {
    color-scheme: dark;
${block(darkTokenValues, "    ")}
  }
}

${darkThemeBlocks}

${themeBlocks}
`;
}

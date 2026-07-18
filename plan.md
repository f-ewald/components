# Plan: Modernize `@f-ewald/components` into a token-styled, individually-importable Lit component library

## Context

`/Users/fe/Development/components` (git: `f-ewald/components`, branch `main`, clean) is a stale
Lit starter-kit repo with 3 components (`animate-confetti`, `reveal-button`, `roman-numeral`)
and a 2022-era toolchain (Rollup 2, Eleventy 1, web-dev-server, web-test-runner,
webcomponentsjs polyfills). The sibling app `/Users/fe/Development/real-estate-map` has grown
several genuinely reusable Lit components that should live here instead.

Goal: one npm package `@f-ewald/components` (currently **unpublished** — `npm view` 404s) of
self-contained Lit web components that share a Tailwind-inspired design language, are
individually importable via subpath exports, have a Vite playground, Playwright tests, and
LLM-consumable docs.

Decisions already made with the user — do not re-litigate:
- **Styling**: design-tokens-only. Components use Lit `css` with `var(--ui-*, <fallback>)`
  custom properties whose values are taken from Tailwind's default palette. Tailwind v4 itself
  is a devDependency (used for playground chrome + as the token value reference). No utility
  classes inside shadow DOM.
- **Components to port**: core UI set + all four charts + `address-autocomplete`.
  **Charts may keep their d3 dependencies** (`d3-scale`, `d3-shape`, `d3-array`) — no rewrite.
- **LLM docs**: files only (`llms.txt`, `custom-elements.json`, per-component markdown).
  **No MCP server now** (evaluation written up in WP7).
- **Publishing**: manual `npm publish` from the maintainer's machine; no CI release workflow.

Environment: Node v26.0.0, npm 11.12.1, macOS. `node_modules` is currently absent.
Playwright browsers are likely already installed (used by real-estate-map); if not,
`npx playwright install chromium`.

---

## Work packages

Execute in order. Each WP ends with its acceptance check passing.

### WP0 — Baseline build validation (requirement 1)

1. `npm install` in `/Users/fe/Development/components`. The devDeps are old (Eleventy 1,
   Rollup 2) and may fail to install or emit warnings on Node 26 — that is acceptable; the
   whole toolchain is replaced in WP1. If `npm install` fails outright, fall back to
   `npm install typescript lit --no-save` just to validate compilation.
2. `npm run build` (this is plain `tsc`). Record the result in the final report.
3. Do **not** try to fix legacy-toolchain problems (eleventy/rollup/wtr); only the `tsc`
   compile of `src/` matters as the baseline.

**Accept**: `tsc` compiles `src/*.ts` without errors (or failures are documented and clearly
caused by the legacy toolchain, not the component sources).

### WP1 — Toolchain replacement (requirements 2, 6)

**Delete** (git rm): `rollup.config.js`, `.eleventy.cjs`, `web-dev-server.config.js`,
`web-test-runner.config.js`, `docs-src/` (whole dir), `dev/` (whole dir), `.eslintrc.json`,
`.eslintignore`, `.npmignore` (replaced by `files` in package.json). Keep `.prettierrc.json`
(editor formatting only — prettier is not reinstalled as a dep). Keep `LICENSE`,
`CHANGELOG.md`.

**Rewrite `package.json`** (keep name `@f-ewald/components`, author, license BSD-3-Clause;
bump version to `0.1.0`):

- Runtime `dependencies`: `lit`, `d3-scale`, `d3-shape`, `d3-array` (d3 is user-approved,
  charts-only; note in README that non-chart imports tree-shake it away entirely).
- `devDependencies` (install each with `@latest`, let npm resolve exact versions):
  `typescript`, `vite`, `tailwindcss`, `@tailwindcss/vite`, `heroicons`, `@playwright/test`,
  `@custom-elements-manifest/analyzer`, `@types/d3-scale`, `@types/d3-shape`,
  `@types/d3-array`. **Nothing else** — no eslint, lit-analyzer, prettier, rimraf, rollup,
  eleventy, wds/wtr, webcomponentsjs.
- Scripts:
  ```json
  {
    "dev": "vite",
    "build": "rm -rf dist && tsc && node scripts/generate-tokens-css.mjs",
    "build:demo": "vite build",
    "analyze": "cem analyze --litelement --globs \"src/**/*.ts\"",
    "docs": "npm run analyze && node scripts/generate-docs.mjs",
    "icons": "node scripts/generate-icons.mjs",
    "test": "playwright test",
    "prepublishOnly": "npm run build && npm run docs && npm run test"
  }
  ```
- Entry/exports (npm artifact = **unbundled tsc output**, Lit best practice — Vite is only
  the dev server / demo bundler):
  ```json
  "type": "module",
  "main": "dist/index.js",
  "module": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
    "./*.js": { "types": "./dist/*.d.ts", "default": "./dist/*.js" },
    "./tokens.css": "./dist/tokens.css",
    "./custom-elements.json": "./custom-elements.json",
    "./llms.txt": "./llms.txt"
  },
  "files": ["dist", "custom-elements.json", "llms.txt", "docs"],
  "sideEffects": ["./dist/**/*.js"],
  "publishConfig": { "access": "public" },
  "customElements": "custom-elements.json"
  ```
  `sideEffects` must list the dist modules: importing a component registers a custom element —
  if marked side-effect-free, consumer bundlers drop the registration.

**Rewrite `tsconfig.json`**: target `es2022`, module `esnext`, moduleResolution `bundler`,
`experimentalDecorators: true`, **`useDefineForClassFields: false`** (critical: with target
≥ es2022 the default flips to `true`, which breaks Lit's `@property` decorators), keep
`declaration`, `declarationMap`, `sourceMap`, `inlineSources`, `outDir ./dist`,
`rootDir ./src`, `strict` plus the existing extra strictness flags, add `skipLibCheck: true`.
Remove `"types": ["mocha"]` and the `ts-lit-plugin` entry. `include: ["src"]` only — demo and
tests are type-handled by Vite/Playwright, not this build.

**`vite.config.ts`** (new, repo root): `@tailwindcss/vite` plugin; default root serving
`index.html` (the playground, WP5); `build.outDir: "demo-dist"` (git-ignored) for
`build:demo`. Update `.gitignore`: keep `/node_modules/`, `dist/`, add `demo-dist/`,
`test-results/`, `playwright-report/`; **remove** the stale `/test/` and
`custom-elements.json` lines (manifest becomes checked in / shipped).

**Accept**: `npm install` clean on Node 26; `npm run build` emits `dist/*.js` + `.d.ts` for
the 3 existing components (they compile unchanged under the new tsconfig; fix trivial breaks
only).

### WP2 — Design tokens (requirement 4)

Create `src/tokens.ts` — the single source of truth:

1. Export `const tokenValues: Record<string, string>` mapping token name → value, values
   copied from Tailwind v4's default theme (document the Tailwind name in a comment per line).
   Minimum set:
   - Colors: `--ui-primary` (indigo-600 `#4f46e5`), `--ui-primary-hover` (indigo-700),
     `--ui-danger` (red-600 `#dc2626`), `--ui-danger-hover` (red-700), `--ui-success`
     (green-600), `--ui-text` (slate-900 `#0f172a`), `--ui-text-muted` (slate-500),
     `--ui-border` (slate-200 `#e2e8f0`), `--ui-surface` (white), `--ui-surface-muted`
     (slate-50), `--ui-overlay` (`rgb(15 23 42 / 0.45)`).
   - Shape/depth: `--ui-radius` (0.5rem = rounded-lg), `--ui-radius-sm` (0.25rem),
     `--ui-shadow` (Tailwind shadow-md), `--ui-shadow-lg` (shadow-xl),
     `--ui-focus-ring` (`0 0 0 3px rgb(79 70 229 / 0.35)`).
   - Type: `--ui-font` (Tailwind's default sans stack), `--ui-font-size` (0.875rem),
     `--ui-font-size-sm` (0.75rem).
2. Export `const tokens = css\`:host { ... }\`` generated from that record **with the value
   baked in as fallback**: every component style uses `var(--ui-primary, #4f46e5)` form so
   components work with zero external CSS. Provide a helper so authors write
   `t("primary")` → `var(--ui-primary, #4f46e5)` if that keeps styles readable — otherwise
   plain `var()` strings are fine; keep it simple.
3. `scripts/generate-tokens-css.mjs`: reads `tokenValues` (import from `dist/tokens.js`,
   which is why the build script runs it after `tsc`) and writes `dist/tokens.css` containing
   `:root { --ui-primary: #4f46e5; ... }` — the optional consumer-side theming/override file.

Spacing rule (convention, not tokens): use Tailwind's 4px scale literally in component CSS
(`0.25rem` steps); no spacing custom properties.

**Accept**: `npm run build` also produces `dist/tokens.css`; `src/tokens.ts` compiles and is
exported from `src/index.ts`.

### WP3 — Icons from Heroicons (requirement 6)

The real-estate-map has hand-inlined Heroicons in `src/icons.ts` (~40 icons as
`(size) => html\`<svg …>\`` functions). Replace hand-maintenance with codegen:

1. `scripts/generate-icons.mjs`: reads a curated icon-name list (start with every icon
   currently exported by `/Users/fe/Development/real-estate-map/src/icons.ts` — enumerate
   `export const icon(\w+)` there), loads the matching SVGs from
   `node_modules/heroicons/24/outline/*.svg`, and writes `src/icons.ts` containing one
   exported arrow function per icon, exactly in the existing shape
   (`export const iconX = (size = 18) => svg\`…\`` using lit's `svg` tag, `stroke="currentColor"`,
   `width/height=${size}`, `aria-hidden="true"`). Per-icon exports keep tree-shaking.
2. The generated `src/icons.ts` is **checked in** (heroicons stays a devDependency; consumers
   never need it). Header comment: "GENERATED by scripts/generate-icons.mjs — do not edit;
   add names to the list in the script and re-run `npm run icons`."

**Accept**: `npm run icons` regenerates the file byte-stable; `dist/icons.js` exports compile.

### WP4 — Port components from real-estate-map (requirement 3) + restyle everything (requirement 4)

Source dir: `/Users/fe/Development/real-estate-map/src/`. Copy each file into
`/Users/fe/Development/components/src/`, then apply the listed genericization. Every ported
AND existing component gets restyled to the WP2 tokens: replace hard-coded colors
(`#3f3d9c` → `var(--ui-primary,…)`, `#c0392b` → `var(--ui-danger,…)`, `#1c1c1c`/`#333` →
`var(--ui-text,…)`, greys → border/muted tokens, `font: 13px … system-ui` →
`var(--ui-font…)`, radii → `var(--ui-radius…)`, shadows → `var(--ui-shadow…)`), and add
`static styles = [tokens, css\`…\`]`. Preserve each component's existing JSDoc style
(`@element`, `@fires`, `/** */` on every public member) and the
`declare global { interface HTMLElementTagNameMap … }` block — add both to any component
missing them (the 3 legacy ones).

Ported files and their required changes:

| Source | Target | Genericization |
|---|---|---|
| `components/toast-notification.ts` | `src/toast-notification.ts` | Icon import → `./icons.ts`. Port `src/toast.ts` helpers into the same file as exported `notifySuccess/notifyError/notifyInfo(message)` functions (they `document.querySelector("toast-notification")` and no-op if absent). |
| `components/confirm-dialog.ts` | `src/confirm-dialog.ts` | Icon import path only. |
| `components/slide-panel.ts` | `src/slide-panel.ts` | Icon import path. **Rename `title` property to `heading`** (`@property() heading = ""`) — `title` collides with the global tooltip attribute; this is a fresh public API, so fix it now. |
| `components/copy-link-button.ts` | `src/copy-link-button.ts` | Icon import path; toast import → `./toast-notification.ts` helpers. Additionally dispatch `copy-success` / `copy-error` CustomEvents so consumers without a toast element can react. |
| `components/relative-time.ts` + `utils/time.ts` | `src/relative-time.ts`, `src/utils/time.ts` | Import path only. |
| `components/distance-value.ts` + `utils/distance.ts` | `src/distance-value.ts`, `src/utils/distance.ts` | Import path only. |
| `components/price-history-chart.ts` | `src/price-history-chart.ts` | Keeps d3. Restyle colors to tokens. No API change. |
| `components/distribution-chart.ts` | `src/distribution-chart.ts` | Keeps d3. Replace `COMPARISON_COLORS` import (from `types/comparison.ts`) with a `@property({attribute:false}) markerColors: string[]` defaulting to a 4-color token-aligned palette (indigo/amber/teal/rose 600s). |
| `components/race-chart.ts` | `src/percent-bar-chart.ts`, tag **`percent-bar-chart`**, class `PercentBarChart` | Keeps d3-scale. Rename only — the component is already a generic "labeled percentage rows" chart; update JSDoc to say so. |
| `components/weight-bar-chart.ts` | `src/weight-bar-chart.ts` | Remove `quiz/questions.ts` import. New input: `@property({attribute:false}) items: { id: string; label: string; value: number }[]` (fractions summing to ~1); keep the sort/animate/repeat-keyed behavior. |
| `components/address-autocomplete.ts` | `src/address-autocomplete.ts` | Remove `config/geo.ts` import. New properties: `endpoint` (URL template, default Mapbox Geocoding v6 forward URL), `accessToken` (required), `bbox: string` (optional, comma-separated), `proximity: string` (optional), keep debounce/min-length as properties with current defaults. Keep form-associated behavior and `address-select` event. |
| `src/icons.ts` | — | Superseded by WP3 codegen. |

**Do not port** (app-specific): statusBadge, comparison-*, quiz-*, map/layer/detail/admin/
help/login/profile/app-shell/property-manager/score-breakdown.

Update `src/index.ts` to export every component class + the toast helpers + `tokens`/
`tokenValues` + all icons (`export * from "./icons.js"`). NB: relative imports in source must
use `.js` specifiers (not `.ts`) so the tsc-emitted `dist/` resolves for consumers — the
real-estate-map sources use `.ts` extensions (Vite-only convention); rewrite them while
porting.

Also do light cleanup of the 3 legacy components while restyling: type the `any`s in
`roman-numeral.ts`/`animate-confetti.ts` (`Record<string, number>`, a `Particle` interface),
`var` → `const/let`. No behavior changes.

**Accept**: `npm run build` clean; every component importable individually
(`import "@f-ewald/components/confirm-dialog.js"` resolves in dist terms).

### WP5 — Playground (requirement 8)

- Root `index.html` (replaces the current stub): Vite entry, loads `demo/main.ts` and
  `demo/demo.css` (`@import "tailwindcss";` — compiled by @tailwindcss/vite for **page chrome
  only**).
- `demo/main.ts`: imports every component from `../src/index.ts` (dev-time source import =
  live HMR while developing components).
- Layout: sticky sidebar nav (one anchor per component) + one `<section id="<tag-name>">` per
  component containing: component name, one-line description, a live rendered example with
  interactive controls where it makes sense (button to `show()` a toast, open the
  confirm-dialog / slide-panel, sample data for the four charts, a fake-token +
  `page.route`-mockable address-autocomplete, inputs driving roman-numeral / relative-time /
  distance-value, trigger for animate-confetti), and a `<pre>` usage snippet.
- Give sections stable ids/`data-testid`s — WP6's Playwright specs target this page.
- Style the chrome with Tailwind utilities to match tailwindcss.com's aesthetic (slate text,
  indigo accents, generous whitespace).

**Accept**: `npm run dev` serves the playground; every component renders and its
interactions work by hand; `npm run build:demo` produces a static `demo-dist/`.

### WP6 — Playwright tests (requirement 9)

- `playwright.config.ts` at root, modeled on
  `/Users/fe/Development/real-estate-map/playwright.config.ts`: `testDir: "./tests"`,
  chromium-only project, `reporter: "list"`, `use.baseURL: "http://localhost:5173"`,
  `webServer: { command: "npm run dev", url: "http://localhost:5173",
  reuseExistingServer: !process.env.CI }`.
- One spec file per component, `tests/<tag-name>.spec.ts`, happy-path assertions against the
  playground (Playwright locators pierce shadow DOM automatically). Minimum assertions:
  - `roman-numeral`: renders `MMIV` for 2004; changing the input updates the numeral.
  - `reveal-button`: hidden slot content appears after click.
  - `animate-confetti`: canvas element attaches after trigger.
  - `confirm-dialog`: opens; Confirm/Cancel clicks fire events (assert via a demo-page
    counter or `page.evaluate` listener); `busy` disables buttons.
  - `toast-notification`: `show()` renders toast; ✕ dismisses; auto-dismiss after short
    duration.
  - `slide-panel`: open attribute slides panel in (visibility assertion); ✕ fires
    `panel-close`.
  - `copy-link-button`: grant `clipboard-read`/`clipboard-write` permissions in the config's
    `use.contextOptions`; click, then read clipboard back via `page.evaluate`.
  - `relative-time`: given a datetime 3h ago renders "3 hours ago"; title attr has locale
    string.
  - `distance-value`: `miles=0.1` renders feet; `miles=5` renders "5.0 mi".
  - charts (4): render an `<svg>` with at least one `path`/`rect` given the demo sample
    data; `percent-bar-chart` shows the labels; `weight-bar-chart` sorts rows descending.
  - `address-autocomplete`: `page.route` the geocoder URL pattern with a fixture response;
    type 3+ chars, expect suggestions; click one → input filled + `address-select` fired.
- If chromium is missing, run `npx playwright install chromium` once.

**Accept**: `npm run test` green locally, starting its own dev server.

### WP7 — LLM documentation + MCP evaluation (requirement 7)

1. `npm run analyze` → `custom-elements.json` (cem analyzer already configured in WP1).
   Check the manifest in; it ships in the package and is referenced by the `customElements`
   package.json field.
2. `scripts/generate-docs.mjs`: reads `custom-elements.json` and writes:
   - `docs/<tag-name>.md` per component: description, import line
     (`import "@f-ewald/components/<file>.js"`), attributes/properties table (name, type,
     default, description), events, slots, CSS custom properties (list the `--ui-*` tokens it
     consumes), and one copy-paste HTML usage example (source these examples from a small
     `examples` map inside the script, reusing the playground snippets).
   - `llms.txt` at repo root: header (what the package is, install command, the two import
     patterns — whole library vs individual), the theming model in 3 lines (tokens +
     `tokens.css`), then one `## <tag-name>` block per component with its one-paragraph
     summary + example inline. Target: complete enough that an LLM with only this file can
     use any component correctly.
3. Rewrite `README.md` for humans: badges, install, quick start, component table linking to
   `docs/*.md`, theming section, playground/dev instructions, publishing instructions
   (`npm version <bump> && npm publish` — first publish already handled), contribution notes.
4. **MCP evaluation** — write as `docs/mcp-evaluation.md` (~half page): Recommendation:
   **do not build an MCP server now.** Rationale: the catalog is ~14 components; `llms.txt`
   ships in the package and is fetchable from unpkg/GitHub raw, so any LLM/agent can load
   the full API surface in one small file — an MCP server would duplicate that behind a
   process with its own versioning/packaging burden. Revisit when (a) the catalog outgrows
   comfortable single-file context (~30+ components), or (b) consumers want live search/
   examples. Upgrade path: a thin stdio server exposing `list_components` /
   `get_component_docs` backed by the same `custom-elements.json` — no new data source needed.
5. Create repo `CLAUDE.md` (< 200 lines): repo purpose, layout, the token/styling rules,
   "how to add a component" checklist (source file with JSDoc + HTMLElementTagNameMap →
   index.ts export → playground section → Playwright spec → `npm run docs`), command list,
   publishing steps, and the `.js`-specifier import rule.
6. Update `CHANGELOG.md` (0.1.0 entry summarizing the modernization).

**Accept**: `npm run docs` regenerates manifest + docs deterministically; `llms.txt` exists
and covers all components.

### WP8 — Publish readiness & end-to-end verification (requirements 1, 5, 6)

1. `npm pack --dry-run` — verify contents: `dist/**` (js, d.ts, maps, tokens.css),
   `custom-elements.json`, `llms.txt`, `docs/*.md`, README, LICENSE; **no** src/, demo/,
   tests/, configs.
2. Consumer smoke test in the scratchpad dir: `npm pack` the tarball, then a throwaway Vite
   app that (a) imports only `@f-ewald/components/confirm-dialog.js` + `roman-numeral.js`,
   renders both, and `vite build`s — grep the output bundle to confirm **no d3 code** was
   pulled in; (b) imports `price-history-chart.js` and confirms it renders. This proves
   requirement 5 (individual imports) and the d3-isolation claim.
3. Full gate: `npm run build && npm run docs && npm run test` all green (this is also
   `prepublishOnly`).
4. **Stop before publishing.** The implementing agent must not run any publish command.
   Leave the repo in a ready-to-publish state and say so in the final report.

   > **Note — first publish:** `@f-ewald/components` is not yet on the npm registry
   > (`npm view` returned 404, verified 2026-07-17). The first publish is done manually by
   > the user from their machine: `npm login` if needed, then `npm publish --access public`
   > — scoped packages default to private without the flag (WP1's
   > `publishConfig.access: "public"` also covers this, but state it explicitly in the
   > README). Subsequent releases: `npm version <bump> && npm publish`.

---

## Final dependency surface (requirement 6 — the checklist)

- dependencies: `lit`, `d3-scale`, `d3-shape`, `d3-array` (user-approved, chart-only)
- devDependencies: `typescript`, `vite`, `tailwindcss`, `@tailwindcss/vite`, `heroicons`,
  `@playwright/test`, `@custom-elements-manifest/analyzer`, `@types/d3-{scale,shape,array}`
- Anything else in package.json is a defect.

## Verification (overall)

1. `npm run build` → clean dist.
2. `npm run dev` → playground renders all ~14 components, hand-tested interactions.
3. `npm run test` → all Playwright specs pass.
4. `npm pack --dry-run` → correct artifact contents.
5. Scratch consumer app: individual import works; non-chart bundle contains no d3.
6. Repo docs present: README, CLAUDE.md, docs/*.md, llms.txt, docs/mcp-evaluation.md,
   CHANGELOG entry.

## Component inventory after this plan (14 tags)

animate-confetti, reveal-button, roman-numeral, confirm-dialog, toast-notification,
slide-panel, copy-link-button, relative-time, distance-value, price-history-chart,
distribution-chart, percent-bar-chart, weight-bar-chart, address-autocomplete
(+ icons module, tokens module, toast notify helpers).

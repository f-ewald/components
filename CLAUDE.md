# CLAUDE.md

## Purpose

`@f-ewald/components` is an npm package of self-contained [Lit](https://lit.dev)
web components sharing a Tailwind-inspired design token system. Each
component is individually importable via a subpath export
(`@f-ewald/components/<tag-name>.js`), so consumers only pay for what they
use — non-chart components pull in zero `d3` code.

## Layout

- `src/` — component sources, one file per component (e.g. `src/confirm-dialog.ts`).
  - `src/index.ts` — barrel export of every component class, the toast
    helpers, `tokens`/`tokenValues`, and all icons.
  - `src/tokens.ts` — the design token source of truth (`tokenValues` map +
    the shared `tokens` `css` stylesheet).
  - `src/icons.ts` — **generated**, do not hand-edit (see below).
  - `src/utils/` — small pure helpers shared by a couple of components
    (`time.ts`, `distance.ts`).
  - `src/mcp-server.ts` — stdio MCP server (see "MCP server" below), compiled
    to `dist/mcp-server.js` by the normal `tsc` build like everything else in
    `src/`.
- `demo/` + root `index.html` — the Vite playground. Imports component
  *sources* directly (`../src/index.ts`) for live HMR while developing.
- `tests/` — one Playwright spec per component tag, run against the
  playground.
- `docs/` — **generated** per-component markdown, plus the hand-written
  `mcp-evaluation.md`.
- `site/` — hand-written static styling for the generated GitHub Pages
  documentation.
- `site-tests/` + `playwright.site.config.ts` — smoke tests for the complete
  Pages artifact.
- `scripts/` — codegen: `generate-icons.mjs`, `generate-tokens-css.mjs`,
  `generate-docs.mjs`.
- `.github/workflows/pages.yml` — read-only source build that deploys the
  generated Pages artifact after both Playwright suites pass.
- `dist/` — **generated** `tsc` build output; this is the npm-published
  artifact (unbundled JS + `.d.ts` + source maps + `tokens.css`).
- `demo-dist/` — **generated**, ignored standalone playground build.
- `pages-dist/` — **generated**, ignored GitHub Pages artifact: documentation
  at the root and the Vite playground under `playground/`.

## Styling / token rules

- [`docs/design-language.md`](./docs/design-language.md) is the canonical
  visual, interaction, accessibility, and validation contract. Read it before
  adding or restyling a component.
- No utility classes and no Tailwind inside shadow DOM. Components use Lit
  `css` only.
- Every component's `static styles` starts with the shared `tokens` import
  from `./tokens.js`, followed by component-specific `css`:
  ```ts
  static override styles = [tokens, css`...`];
  ```
- Colors, radii, shadows, and fonts use `var(--ui-*, <fallback>)` — never a
  bare hex/px value in a CSS declaration that's covered by an existing
  token. The fallback makes the component render correctly with zero
  external CSS; `tokens.ts` is the single source of truth for what those
  fallback values are. Any new `--ui-*` usage must carry the exact fallback
  from `tokenValues`.
- Type is tokenized: sizes (`--ui-font-size`, `-sm`, `-xs`, `-lg` = `1rem`),
  weights (`--ui-font-weight-regular|medium|semibold|bold` = 400/500/600/700),
  line heights (`--ui-line-height-glyph|tight|normal` = 1/1.25/1.5), and
  tracking (`--ui-tracking-normal|wide` = 0/0.04em). Families stay
  `--ui-font` / `--ui-font-mono`; `font-family: inherit` is reserved for
  editable-text and inline formatters. SVG presentation attributes and
  `line-height: 0` icon resets are exempt (see the design contract).
- Spacing is *not* tokenized—`padding`, `margin`, and `gap` use literal
  `0.25rem` steps only. Exceptions are 1px borders, SVG/canvas geometry,
  percentages, timing, proportional math, `0.125rem` optical alignment, and
  domain geometry. Convert layout pixels to rems.
- Interactive controls use a 2rem target; text controls follow the canonical
  field/button/pill padding roles. Inline icons are 14px, standalone action
  icons are 18px, side/floating panels are 20rem, centered/dialog panels are
  25rem, and the shared responsive breakpoint is 48rem.
- SVG presentation attributes (`fill="..."`, `stroke="..."`) can't take
  `var()` — those stay as plain hex, matching the token's fallback value.
- Every interactive component needs coherent hover, selected, disabled,
  focus-visible/forced-colors, keyboard, and reduced-motion behavior.
- Metadata-only and styleless component exceptions are listed in the design
  contract; do not add empty styles merely for uniformity.

## The `.js`-specifier import rule

All relative imports inside `src/` **must** use a `.js` extension, even
though the file on disk is `.ts`:

```ts
import { tokens } from "./tokens.js"; // correct
import { tokens } from "./tokens";    // wrong — breaks dist/ resolution
```

`tsc` emits `.js` files but doesn't rewrite import specifiers, so this is
required for the compiled `dist/` output to resolve under plain Node/browser
ESM resolution.

## How to add a component

**Every new component must be added to the playground.** This is not
optional — a component without a playground section (step 3) is treated as
incomplete, the same as a component without tests.

1. Add `src/<tag-name>.ts`: JSDoc on the class (`@element`, `@fires` per
   event), JSDoc on every public member, `static styles = [tokens, css\`...\`]`,
   and a `declare global { interface HTMLElementTagNameMap { ... } }` block.
2. Export the class (and any exported types) from `src/index.ts`.
3. Add the component to the playground in alphabetical nav/section order:
   - A nav link in `index.html`'s `<nav class="demo-nav">`.
   - A `<section id="<tag-name>">` with a live, rendered example, and a
     `<pre class="usage">` copy-paste snippet.
   - Wiring in `demo/main.ts` (sample data, event listeners, interactive
     controls) so every property/event/mode is actually exercised by hand.
4. Add `tests/<tag-name>.spec.ts` with at least one happy-path assertion
   against the playground section added in step 3.
5. Run `npm run docs` to regenerate `custom-elements.json`, `docs/<tag-name>.md`,
   and `llms.txt`. If the docs generator's `EXAMPLES` map
   (`scripts/generate-docs.mjs`) would otherwise fall back to a bare
   `<tag-name></tag-name>` snippet, add a real example there too.
6. Add a row to the component table in `README.md`.

Metadata-only tags listed in `docs/design-language.md` are demonstrated through
their parent rather than receiving a standalone section.

The same applies when adding a significant new capability to an *existing*
component (e.g. a new suggestion source, a new mode): update its playground
section/wiring to demonstrate the new capability, not just the source file.

## Icons

`src/icons.ts` is generated by `scripts/generate-icons.mjs` from the
`heroicons` devDependency (never a runtime dependency — icons are inlined as
Lit `svg` templates). To add an icon, add an entry to the `ICONS` map in the
script and run `npm run icons`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Playground with HMR. |
| `npm run typecheck` | Fast TypeScript check without writing `dist/`. |
| `npm run build` | `tsc` → `dist/` + `dist/tokens.css`, `chmod +x dist/mcp-server.js`. |
| `npm run build:demo` | Static playground build → `demo-dist/`. |
| `npm run build:site` | Static docs + nested playground build → `pages-dist/`; writes no tracked files. |
| `npm run preview:site` | Preview `pages-dist/` locally. |
| `npm run icons` | Regenerate `src/icons.ts`. |
| `npm run analyze` | Regenerate `custom-elements.json`. |
| `npm run docs` | `analyze` + regenerate `docs/*.md` and `llms.txt`. |
| `npm run mcp` | Run the MCP server directly (`node dist/mcp-server.js`) — mostly for manual smoke-testing; consumers launch it the same way via `.mcp.json`. |
| `npm run test` | Playwright suite (auto-starts the dev server). |
| `npm run test:design` | Static catalog/token/style/accessibility contracts. |
| `npm run test:site` | Playwright smoke suite against the built `pages-dist/` artifact. |
| `npm run prepublishOnly` | `build` + `docs` + `test` — runs automatically before `npm publish`. |

During implementation, run `typecheck` plus all touched component specs in one
invocation. Run docs after APIs stabilize; run the design and full gates once
at the end. See `docs/design-language.md` for the deterministic validation tiers.

## GitHub Pages

The public documentation is at `https://f-ewald.github.io/components/`; the
live playground is under `/components/playground/`. `npm run build:site`
invokes `generate-docs.mjs --site`, which reads the checked-in
`custom-elements.json` and `llms.txt`, writes static HTML only beneath
`pages-dist/`, then builds the existing Vite playground into
`pages-dist/playground/` with relative asset URLs. It does **not** run
`npm run docs` or modify tracked generated documentation.

`.github/workflows/pages.yml` deploys on pushes to `main` and manual dispatch.
It uses only GitHub-authored actions, checks out with
`persist-credentials: false`, has `contents: read` rather than write, and
gates on component, design-contract, and site tests before upload. It
fails if the build changes tracked or staged files. Its only write permission
is in the deploy job for the GitHub Pages deployment; it cannot commit, push,
tag, open pull requests, publish releases, or change repository settings.
Pages must be manually configured to use **GitHub Actions** as its source
before the first run.

## MCP server

`src/mcp-server.ts` is a thin stdio MCP server exposing the component catalog
to AI coding assistants, per the upgrade path in `docs/mcp-evaluation.md`. It
adds no new data source — it's read-only over the same `custom-elements.json`
and `docs/*.md` that `npm run docs` already generates and ships.

Two tools:
- `list_components` — every tag + one-line description.
- `get_component_docs(tag)` — the full generated Markdown doc for one tag.

Consuming projects (currently `real-estate-map`, `slowmo`) wire it up via a
`.mcp.json` at their repo root pointing `node` at this repo's built
`dist/mcp-server.js` by absolute path — no npm publish or `npm link` needed,
since it's just a script invocation, not a package import:

```json
{
  "mcpServers": {
    "f-ewald-components": {
      "command": "node",
      "args": ["/Users/fe/Development/components/dist/mcp-server.js"]
    }
  }
}
```

Run `npm run build` here after any change to `src/mcp-server.ts`,
`custom-elements.json`, or `docs/*.md` for consumers to see the update (they
spawn the compiled `dist/mcp-server.js` fresh per session, no reinstall
needed). If this is ever published, a `bin` entry
(`f-ewald-components-mcp` → `dist/mcp-server.js`) is already in place for
consumers that prefer `npx @f-ewald/components f-ewald-components-mcp`
instead of the absolute local path.

## Testing changes against a consumer before publishing

When a change here (new component, bugfix) needs to be verified in a
consuming project (e.g. `real-estate-map`), **always test via `npm link`
first — never publish speculatively to find out if something works.**

```bash
cd ~/Development/components && npm run build && npm link
cd <consumer-repo> && npm link @f-ewald/components
rm -rf node_modules/.vite   # clear Vite's dep pre-bundle cache — it will
                             # otherwise keep serving the pre-link version
```

`npm link @f-ewald/components` in a consumer can produce a broken relative
symlink (observed pointing at the wrong directory) instead of erroring —
verify with `ls -la node_modules/@f-ewald/components` (must show `lrwxr-xr-x
... -> /absolute/path/to/components`) and `grep` the resolved
`dist/<file>.js` for the expected fix before trusting the link. If it's
wrong, `rm -rf node_modules/@f-ewald/components` and `ln -s
/Users/fe/Development/components node_modules/@f-ewald/components` manually.

Only publish once the linked consumer round-trips the actual behavior
end-to-end (not just unit tests here). Then use the tagged release workflow
below; never run `npm publish` speculatively or manually.

## Publishing

`.github/workflows/npm-publish.yml` publishes to npmjs from GitHub-hosted
Actions whenever a strict `vX.Y.Z` tag is pushed. It validates that the tag,
`package.json`, and both package-lock version fields agree; runs
`prepublishOnly`; requires a clean tracked diff; then publishes through npm
Trusted Publishing (OIDC) with automatic provenance. It has read-only source
permissions, no persisted Git credentials, and no long-lived npm token.

One-time npmjs setup for `@f-ewald/components`:

1. Open the package's **Settings → Trusted Publisher** on npmjs.
2. Choose **GitHub Actions**.
3. Set owner `f-ewald`, repository `components`, and workflow
   `npm-publish.yml`; leave environment blank.
4. Set **Allowed actions** to **npm publish** (not stage-only).
5. After verifying the first release, prefer **Require two-factor
   authentication and disallow tokens** under Publishing access.

**Every version bump must have a matching annotated `vX.Y.Z` tag on the same
commit, starting with `v1.0.0`.** Never edit package versions directly or
push a version commit without its tag. Create releases only after all release
changes and generated docs are committed:

```bash
npm version <patch|minor|major>  # updates manifests, commits, creates vX.Y.Z
test "$(git rev-list -n 1 "v$(node -p "require('./package.json').version")")" = "$(git rev-parse HEAD)"
git push origin main --follow-tags
```

Pushing the tag is the publish action; do not run `npm publish` manually.
The initial local `v1.0.0` tag was recreated on the commit that introduced
this workflow before its first push. Never move or recreate a release tag
after it has been pushed.

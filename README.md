# @f-ewald/components

[![npm](https://img.shields.io/npm/v/@f-ewald/components)](https://www.npmjs.com/package/@f-ewald/components)
[![license](https://img.shields.io/badge/license-BSD--3--Clause-blue)](./LICENSE)

[Documentation](https://f-ewald.github.io/components/) ·
[Playground](https://f-ewald.github.io/components/playground/)

A collection of self-contained [Lit](https://lit.dev) web components sharing a
Tailwind-inspired design token system. Every component is individually
importable and ships its own TypeScript types plus a checked-in
[`custom-elements.json`](./custom-elements.json) manifest.

## Install

```bash
npm install @f-ewald/components
```

## Quick start

Import the whole library (registers every component):

```js
import "@f-ewald/components";
```

...or import components individually — this tree-shakes everything else,
including the `d3` dependency used only by the chart components:

```js
import "@f-ewald/components/confirm-dialog.js";
import "@f-ewald/components/roman-numeral.js";
```

```html
<confirm-dialog open confirm-label="Delete" cancel-label="Cancel">
  Are you sure you want to delete this item?
</confirm-dialog>
<roman-numeral value="2004"></roman-numeral>
```

## Components

| Component | Docs |
| --- | --- |
| `<action-bar>` | [API reference](https://f-ewald.github.io/components/docs/action-bar.html) |
| `<address-autocomplete>` | [API reference](https://f-ewald.github.io/components/docs/address-autocomplete.html) |
| `<animate-confetti>` | [API reference](https://f-ewald.github.io/components/docs/animate-confetti.html) |
| `<app-shell>` | [API reference](https://f-ewald.github.io/components/docs/app-shell.html) |
| `<app-sidebar>` | [API reference](https://f-ewald.github.io/components/docs/app-sidebar.html) |
| `<audio-player>` | [API reference](https://f-ewald.github.io/components/docs/audio-player.html) |
| `<auto-scroll>` | [API reference](https://f-ewald.github.io/components/docs/auto-scroll.html) |
| `<autocomplete-input>` | [API reference](https://f-ewald.github.io/components/docs/autocomplete-input.html) |
| `<blink-cursor>` | [API reference](https://f-ewald.github.io/components/docs/blink-cursor.html) |
| `<breadcrumb-nav>` | [API reference](https://f-ewald.github.io/components/docs/breadcrumb-nav.html) |
| `<button-group>` | [API reference](https://f-ewald.github.io/components/docs/button-group.html) |
| `<calendar-day>` | [API reference](https://f-ewald.github.io/components/docs/calendar-day.html) |
| `<calendar-entry>` | [API reference](https://f-ewald.github.io/components/docs/calendar-entry.html) |
| `<calendar-month>` | [API reference](https://f-ewald.github.io/components/docs/calendar-month.html) |
| `<calendar-week>` | [API reference](https://f-ewald.github.io/components/docs/calendar-week.html) |
| `<calendar-year>` | [API reference](https://f-ewald.github.io/components/docs/calendar-year.html) |
| `<card-grid>` | [API reference](https://f-ewald.github.io/components/docs/card-grid.html) |
| `<chat-message>` | [API reference](https://f-ewald.github.io/components/docs/chat-message.html) |
| `<chevron-panel>` | [API reference](https://f-ewald.github.io/components/docs/chevron-panel.html) |
| `<code-diff>` | [API reference](https://f-ewald.github.io/components/docs/code-diff.html) |
| `<comment-composer>` | [API reference](https://f-ewald.github.io/components/docs/comment-composer.html) |
| `<comment-label>` | [API reference](https://f-ewald.github.io/components/docs/comment-label.html) |
| `<confirm-dialog>` | [API reference](https://f-ewald.github.io/components/docs/confirm-dialog.html) |
| `<content-divider>` | [API reference](https://f-ewald.github.io/components/docs/content-divider.html) |
| `<copy-link-button>` | [API reference](https://f-ewald.github.io/components/docs/copy-link-button.html) |
| `<countdown-timer>` | [API reference](https://f-ewald.github.io/components/docs/countdown-timer.html) |
| `<cron-schedule>` | [API reference](https://f-ewald.github.io/components/docs/cron-schedule.html) |
| `<data-table>` | [API reference](https://f-ewald.github.io/components/docs/data-table.html) |
| `<distance-value>` | [API reference](https://f-ewald.github.io/components/docs/distance-value.html) |
| `<distribution-chart>` | [API reference](https://f-ewald.github.io/components/docs/distribution-chart.html) |
| `<dropdown-button>` | [API reference](https://f-ewald.github.io/components/docs/dropdown-button.html) |
| `<editable-text>` | [API reference](https://f-ewald.github.io/components/docs/editable-text.html) |
| `<empty-state>` | [API reference](https://f-ewald.github.io/components/docs/empty-state.html) |
| `<form-actions>` | [API reference](https://f-ewald.github.io/components/docs/form-actions.html) |
| `<form-field>` | [API reference](https://f-ewald.github.io/components/docs/form-field.html) |
| `<form-select>` | [API reference](https://f-ewald.github.io/components/docs/form-select.html) |
| `<frame-box>` | [API reference](https://f-ewald.github.io/components/docs/frame-box.html) |
| `<fullscreen-button>` | [API reference](https://f-ewald.github.io/components/docs/fullscreen-button.html) |
| `<gallery-item>` | [API reference](https://f-ewald.github.io/components/docs/gallery-item.html) |
| `<gallery-item-variant>` | [API reference](https://f-ewald.github.io/components/docs/gallery-item-variant.html) |
| `<icon-button>` | [API reference](https://f-ewald.github.io/components/docs/icon-button.html) |
| `<kanban-board>` | [API reference](https://f-ewald.github.io/components/docs/kanban-board.html) |
| `<kanban-card>` | [API reference](https://f-ewald.github.io/components/docs/kanban-card.html) |
| `<kanban-column>` | [API reference](https://f-ewald.github.io/components/docs/kanban-column.html) |
| `<kbd-hint>` | [API reference](https://f-ewald.github.io/components/docs/kbd-hint.html) |
| `<link-card>` | [API reference](https://f-ewald.github.io/components/docs/link-card.html) |
| `<live-timer>` | [API reference](https://f-ewald.github.io/components/docs/live-timer.html) |
| `<load-more>` | [API reference](https://f-ewald.github.io/components/docs/load-more.html) |
| `<loading-dots>` | [API reference](https://f-ewald.github.io/components/docs/loading-dots.html) |
| `<loading-spinner>` | [API reference](https://f-ewald.github.io/components/docs/loading-spinner.html) |
| `<map-circle>` | [API reference](https://f-ewald.github.io/components/docs/map-circle.html) |
| `<map-pin>` | [API reference](https://f-ewald.github.io/components/docs/map-pin.html) |
| `<markdown-editor>` | [API reference](https://f-ewald.github.io/components/docs/markdown-editor.html) |
| `<markdown-view>` | [API reference](https://f-ewald.github.io/components/docs/markdown-view.html) |
| `<modal-dialog>` | [API reference](https://f-ewald.github.io/components/docs/modal-dialog.html) |
| `<multi-select>` | [API reference](https://f-ewald.github.io/components/docs/multi-select.html) |
| `<page-header>` | [API reference](https://f-ewald.github.io/components/docs/page-header.html) |
| `<pagination-nav>` | [API reference](https://f-ewald.github.io/components/docs/pagination-nav.html) |
| `<percent-bar-chart>` | [API reference](https://f-ewald.github.io/components/docs/percent-bar-chart.html) |
| `<photo-gallery>` | [API reference](https://f-ewald.github.io/components/docs/photo-gallery.html) |
| `<popover-panel>` | [API reference](https://f-ewald.github.io/components/docs/popover-panel.html) |
| `<price-history-chart>` | [API reference](https://f-ewald.github.io/components/docs/price-history-chart.html) |
| `<progress-bar>` | [API reference](https://f-ewald.github.io/components/docs/progress-bar.html) |
| `<radio-cards>` | [API reference](https://f-ewald.github.io/components/docs/radio-cards.html) |
| `<radio-pills>` | [API reference](https://f-ewald.github.io/components/docs/radio-pills.html) |
| `<range-slider>` | [API reference](https://f-ewald.github.io/components/docs/range-slider.html) |
| `<relative-time>` | [API reference](https://f-ewald.github.io/components/docs/relative-time.html) |
| `<reveal-button>` | [API reference](https://f-ewald.github.io/components/docs/reveal-button.html) |
| `<roman-numeral>` | [API reference](https://f-ewald.github.io/components/docs/roman-numeral.html) |
| `<scroll-dots>` | [API reference](https://f-ewald.github.io/components/docs/scroll-dots.html) |
| `<scroll-to-bottom>` | [API reference](https://f-ewald.github.io/components/docs/scroll-to-bottom.html) |
| `<scroll-to-top>` | [API reference](https://f-ewald.github.io/components/docs/scroll-to-top.html) |
| `<skip-link>` | [API reference](https://f-ewald.github.io/components/docs/skip-link.html) |
| `<slide-panel>` | [API reference](https://f-ewald.github.io/components/docs/slide-panel.html) |
| `<spec-list>` | [API reference](https://f-ewald.github.io/components/docs/spec-list.html) |
| `<split-hero>` | [API reference](https://f-ewald.github.io/components/docs/split-hero.html) |
| `<stat-meter>` | [API reference](https://f-ewald.github.io/components/docs/stat-meter.html) |
| `<stat-strip>` | [API reference](https://f-ewald.github.io/components/docs/stat-strip.html) |
| `<status-banner>` | [API reference](https://f-ewald.github.io/components/docs/status-banner.html) |
| `<status-pill>` | [API reference](https://f-ewald.github.io/components/docs/status-pill.html) |
| `<step-ladder>` | [API reference](https://f-ewald.github.io/components/docs/step-ladder.html) |
| `<tab-bar>` | [API reference](https://f-ewald.github.io/components/docs/tab-bar.html) |
| `<tab-item>` | [API reference](https://f-ewald.github.io/components/docs/tab-item.html) |
| `<terminal-block>` | [API reference](https://f-ewald.github.io/components/docs/terminal-block.html) |
| `<text-area>` | [API reference](https://f-ewald.github.io/components/docs/text-area.html) |
| `<tile-grid>` | [API reference](https://f-ewald.github.io/components/docs/tile-grid.html) |
| `<timeline-container>` | [API reference](https://f-ewald.github.io/components/docs/timeline-container.html) |
| `<timeline-entry>` | [API reference](https://f-ewald.github.io/components/docs/timeline-entry.html) |
| `<toast-notification>` | [API reference](https://f-ewald.github.io/components/docs/toast-notification.html) |
| `<tree-view>` | [API reference](https://f-ewald.github.io/components/docs/tree-view.html) |
| `<ui-admonition>` | [API reference](https://f-ewald.github.io/components/docs/ui-admonition.html) |
| `<ui-button>` | [API reference](https://f-ewald.github.io/components/docs/ui-button.html) |
| `<ui-checkbox>` | [API reference](https://f-ewald.github.io/components/docs/ui-checkbox.html) |
| `<user-avatar>` | [API reference](https://f-ewald.github.io/components/docs/user-avatar.html) |
| `<video-player>` | [API reference](https://f-ewald.github.io/components/docs/video-player.html) |
| `<vote-control>` | [API reference](https://f-ewald.github.io/components/docs/vote-control.html) |
| `<weight-bar-chart>` | [API reference](https://f-ewald.github.io/components/docs/weight-bar-chart.html) |
| `<window-chrome>` | [API reference](https://f-ewald.github.io/components/docs/window-chrome.html) |

Each doc lists the component's attributes/properties, events, slots, and the
`--ui-*` CSS custom properties it consumes. For a machine-readable summary of
the whole library in one file, see [`llms.txt`](./llms.txt).

## Theming

Components use Lit `css` with `var(--ui-*, <fallback>)` custom properties, so
they render correctly out of the box with **zero external CSS** — every
token has a sensible default baked in as the `var()` fallback.

To retheme, override any `--ui-*` custom property on `:root` (or a closer
ancestor):

```css
:root {
  --ui-primary: #0ea5e9;
  --ui-radius: 0.75rem;
}
```

Or import the generated stylesheet as a starting point and edit it:

```js
import "@f-ewald/components/tokens.css";
```

### Dark mode

`tokens.css` also ships a dark palette (see `darkTokenValues` in
[`src/tokens.ts`](./src/tokens.ts)), applied automatically via
`@media (prefers-color-scheme: dark)`. A consumer can force either mode
regardless of the OS preference by setting `data-theme="dark"` or
`data-theme="light"` on `<html>` — that attribute wins in both directions.
Components need no changes to support this: every token is read via
`var(--ui-x, fallback)` at its point of use, so it just follows whatever
`:root` resolves to. (Note: `tokens` — the `:host` stylesheet component
files import alongside their own `css` block — intentionally declares no
custom properties itself; an earlier version re-declared them there as
`--ui-x: var(--ui-x, fallback)`, which computed to the guaranteed-invalid
value instead of the inherited one, silently discarding whatever `:root`
set. Don't reintroduce that pattern.)

### Gradient theme

Setting `data-theme="gradient"` on `<html>` layers a glossy gradient look
onto `ui-button` (primary, danger, and secondary variants) and
`toast-notification` (all four variants: success, error, info, warning) on
top of the flat light palette, plus the secondary muted surface shared by
`button-group`, `pagination-nav`, `radio-cards`, and `radio-pills` — see
`gradientTokenValues` in
[`src/tokens.ts`](./src/tokens.ts). Every other token stays at its light-mode
value. It takes precedence over the
OS dark preference (like `data-theme="light"` does), since the gradient's
color stops are hardcoded for a light surface.

### Metro theme

Setting `data-theme="metro"` on `<html>` flattens the light palette: square
corners, hairline separators in place of drop shadows, and a blue accent — see
`metroTokenValues` in [`src/tokens.ts`](./src/tokens.ts). Like
`data-theme="gradient"`, it is built on the light palette and so takes
precedence over the OS dark preference.

This is the one theme that overrides **shape** rather than only color. It
squares every corner in the design system, including the deliberate pill and
circle shapes — chips, avatars, dots, slider thumbs — which read
`--ui-radius-pill`/`--ui-radius-circle` for exactly that reason. Two notes:

- If you add a component, route any pill or circle through those tokens rather
  than a literal `9999px`/`50%`; a literal silently opts that shape out of every
  theme. A design-language contract test enforces this.
- One residual is out of reach: `price-history-chart` rounds its bars with an
  SVG `rx` presentation attribute, which cannot take a `var()`.
- `--ui-shadow`/`--ui-shadow-lg` become a hard 1px ring rather than `none`.
  Removing them outright would leave `slide-panel` — the only overlay with no
  border of its own — as an invisible white-on-white edge.

### Blueprint theme

Setting `data-theme="blueprint"` on `<html>` restyles the light palette as a
technical catalog / spec sheet: warm near-black ink on white paper, one pure
blue accent, square corners, monospace type, and structure carried entirely by
1.5px hairline rules instead of shadows — see `blueprintTokenValues` in
[`src/tokens.ts`](./src/tokens.ts). Like `gradient` and `metro`, it is built on
the light palette and so takes precedence over the OS dark preference.

It is the widest theme in the system, and the only one to reach three axes
beyond color and shape:

- `--ui-border-width` goes to `1.5px`. Every border here does the work a shadow
  does elsewhere, and at 1px those rules read as a faint table rather than as
  drawn structure.
- `--ui-label-transform` goes to `uppercase`, so chrome micro-labels — spec
  keys, table headers, group labels — read as signage. It never applies to
  user content.
- `--ui-numeric` goes to `tabular-nums`, so figures line up in a column.
- `--ui-font` is retargeted to a monospace stack led by `"Space Mono"`. Load
  that webfont yourself for the exact reference face; with no external CSS at
  all it falls through to the same system mono stack `--ui-font-mono` uses, so
  the theme still renders correctly on its own.

Type *metrics* — size, weight, line height, tracking — are not themed here or
anywhere else; they encode hierarchy rather than style.

Two deliberate departures from the look it is modelled on:

- Primary buttons are **ink**, not the accent, and only turn blue on hover.
  `--ui-primary` stays pure blue because it drives accents everywhere else
  (active tab underlines, selected states, links); a large blue button beside
  blue accents would flatten the two roles into one.
- `danger`/`success`/`warning` keep their usual red/green/amber. They encode
  meaning rather than style, and a blue-only palette is an editorial choice a
  component library cannot make on your behalf. `--ui-info` is the exception —
  "neutral notice" *is* the accent in this theme.

The faint dot grid and film grain in the playground are page-level backdrops,
not part of the theme: a component library has no business painting outside its
own shadow roots. Copy the two rules from
[`demo/demo.css`](./demo/demo.css) if you want them.

The full token set is defined in [`src/tokens.ts`](./src/tokens.ts).
Typography, spacing, control, icon, radius, panel, chart, and accessibility
measurements follow the canonical
[`docs/design-language.md`](./docs/design-language.md) contract and are checked
by `npm run test:design`.

## MCP server

`npm run mcp` (or `node dist/mcp-server.js` after `npm run build`) starts a
stdio [MCP](https://modelcontextprotocol.io) server exposing the component
catalog to AI coding assistants, with five tools:

- `list_components` — every tag + one-line description.
- `get_component_docs(tag)` — the full generated Markdown doc for one tag
  (install snippet, usage example, attributes/properties, events, slots,
  CSS custom properties).
- `list_layouts` — every page template (layout recipe) + a one-line summary.
- `get_layout(name)` — the full recipe for one page template (which components
  fill which `app-shell` slots and how, plus markup and notes — or, for a
  shell-less page like a marketing landing page, the section-by-section
  component composition instead).
- `list_icons` — every icon in `icons.js`, its default size, and its intended
  use case (e.g. delete vs. edit vs. close), for consistent icon choices
  across apps. See [`docs/icons.md`](./docs/icons.md) for the same catalog.

It's read-only over the same `custom-elements.json`/`docs/*.md` this package
already generates via `npm run docs`, plus the authored `docs/layouts/*.md`
recipes — no separate data source to maintain.
A consuming project wires it up with a `.mcp.json` at its repo root:

```json
{
  "mcpServers": {
    "f-ewald-components": {
      "command": "node",
      "args": ["/absolute/path/to/components/dist/mcp-server.js"]
    }
  }
}
```

See the "MCP server" section in [`CLAUDE.md`](./CLAUDE.md) for more, and
[`docs/mcp-evaluation.md`](./docs/mcp-evaluation.md) for why this was built
now rather than earlier.

## Playground / development

```bash
npm install
npm run dev
```

Opens a live playground (`index.html`) with a rendered, hand-testable example
of every component, plus a copy-paste usage snippet for each. Component
sources are imported directly from `src/`, so edits hot-reload.

The theme picker writes the chosen theme to the URL as a `?theme=` parameter,
so the address bar is always shareable — for example
[`?theme=blueprint#button-group`](https://f-ewald.github.io/components/playground/?theme=blueprint#button-group)
opens `button-group` under the blueprint theme. A theme in the link takes
precedence over the reader's own remembered choice.

```bash
npm run build:demo   # static build of the playground, into demo-dist/
npm run build:site   # docs + playground Pages artifact, into pages-dist/
npm run preview:site # preview the exact Pages artifact locally
npm run test:site    # smoke-test the built documentation and playground
```

The combined site is deployed automatically from `main` to
[GitHub Pages](https://f-ewald.github.io/components/). The workflow reads the
repository and publishes `pages-dist/`; it has no permission or persisted
credential capable of changing repository files, branches, tags, or pull
requests.

## Development commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite playground with HMR. |
| `npm run typecheck` | Check TypeScript without writing build output. |
| `npm run build` | Compile `src/` with `tsc` into `dist/`, and generate `dist/tokens.css`. |
| `npm run build:demo` | Build the static playground into `demo-dist/`. |
| `npm run build:site` | Build the static documentation and nested playground into `pages-dist/`. |
| `npm run preview:site` | Preview the built Pages artifact locally. |
| `npm run icons` | Regenerate `src/icons.ts` from the Heroicons package. |
| `npm run analyze` | Regenerate `custom-elements.json` via the custom-elements-manifest analyzer. |
| `npm run docs` | Regenerate the manifest, `docs/*.md`, and `llms.txt`. |
| `npm run mcp` | Run the MCP server (`dist/mcp-server.js`) directly, for manual testing. |
| `npm run test` | Run the Playwright suite against the playground. |
| `npm run test:design` | Check catalog ordering, token fallbacks, and source design contracts. |
| `npm run test:site` | Run the Playwright smoke suite against `pages-dist/`. |

## Contributing

- New components live in `src/`, are exported from `src/index.ts`, restyled
  to the `--ui-*` design tokens, and get a playground section (`index.html`)
  and a Playwright spec (`tests/`). See [`CLAUDE.md`](./CLAUDE.md) for the
  full checklist.
- Relative imports within `src/` must use `.js` specifiers (not `.ts`), so
  the `tsc`-emitted `dist/` output resolves correctly for consumers.
- Run `npm run docs` after changing any component's public API so the
  generated docs and `llms.txt` stay in sync.
- `npm run build:site` only reads those checked-in documentation inputs and
  writes ignored `pages-dist/`; it never updates tracked generated files.
- Component styling and interaction changes follow
  [`docs/design-language.md`](./docs/design-language.md).

## Publishing

Releases are published automatically by
[`.github/workflows/npm-publish.yml`](./.github/workflows/npm-publish.yml)
when a strict `vX.Y.Z` tag is pushed. The workflow validates the tag against
both package manifests, runs the full `prepublishOnly` gate, and publishes via
npm Trusted Publishing with provenance—no `NPM_TOKEN` repository secret.

Configure the `@f-ewald/components` npmjs package once with a GitHub Actions
Trusted Publisher for owner `f-ewald`, repository `components`, workflow
`npm-publish.yml`, no environment, and **Allowed actions: npm publish**. Then
release only after all source and generated-doc changes are committed:

```bash
npm version <patch|minor|major>
git push origin main --follow-tags
```

`npm version` must create the matching annotated `vX.Y.Z` tag on the version
commit; every version bump requires that tag, beginning with `v1.0.0`. The
initial local `v1.0.0` tag was moved to the release-workflow commit before
its first push; published tags must never be moved.

## License

[BSD-3-Clause](./LICENSE)

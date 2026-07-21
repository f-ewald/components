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
| `<address-autocomplete>` | [API reference](https://f-ewald.github.io/components/docs/address-autocomplete.html) |
| `<animate-confetti>` | [API reference](https://f-ewald.github.io/components/docs/animate-confetti.html) |
| `<autocomplete-input>` | [API reference](https://f-ewald.github.io/components/docs/autocomplete-input.html) |
| `<calendar-entry>` | [API reference](https://f-ewald.github.io/components/docs/calendar-entry.html) |
| `<calendar-month>` | [API reference](https://f-ewald.github.io/components/docs/calendar-month.html) |
| `<calendar-year>` | [API reference](https://f-ewald.github.io/components/docs/calendar-year.html) |
| `<chat-message>` | [API reference](https://f-ewald.github.io/components/docs/chat-message.html) |
| `<confirm-dialog>` | [API reference](https://f-ewald.github.io/components/docs/confirm-dialog.html) |
| `<copy-link-button>` | [API reference](https://f-ewald.github.io/components/docs/copy-link-button.html) |
| `<data-table>` | [API reference](https://f-ewald.github.io/components/docs/data-table.html) |
| `<distance-value>` | [API reference](https://f-ewald.github.io/components/docs/distance-value.html) |
| `<distribution-chart>` | [API reference](https://f-ewald.github.io/components/docs/distribution-chart.html) |
| `<dropdown-button>` | [API reference](https://f-ewald.github.io/components/docs/dropdown-button.html) |
| `<editable-text>` | [API reference](https://f-ewald.github.io/components/docs/editable-text.html) |
| `<form-select>` | [API reference](https://f-ewald.github.io/components/docs/form-select.html) |
| `<frame-box>` | [API reference](https://f-ewald.github.io/components/docs/frame-box.html) |
| `<gallery-item>` | [API reference](https://f-ewald.github.io/components/docs/gallery-item.html) |
| `<gallery-item-variant>` | [API reference](https://f-ewald.github.io/components/docs/gallery-item-variant.html) |
| `<icon-button>` | [API reference](https://f-ewald.github.io/components/docs/icon-button.html) |
| `<live-timer>` | [API reference](https://f-ewald.github.io/components/docs/live-timer.html) |
| `<map-circle>` | [API reference](https://f-ewald.github.io/components/docs/map-circle.html) |
| `<map-pin>` | [API reference](https://f-ewald.github.io/components/docs/map-pin.html) |
| `<percent-bar-chart>` | [API reference](https://f-ewald.github.io/components/docs/percent-bar-chart.html) |
| `<photo-gallery>` | [API reference](https://f-ewald.github.io/components/docs/photo-gallery.html) |
| `<popover-panel>` | [API reference](https://f-ewald.github.io/components/docs/popover-panel.html) |
| `<price-history-chart>` | [API reference](https://f-ewald.github.io/components/docs/price-history-chart.html) |
| `<radio-cards>` | [API reference](https://f-ewald.github.io/components/docs/radio-cards.html) |
| `<radio-pills>` | [API reference](https://f-ewald.github.io/components/docs/radio-pills.html) |
| `<relative-time>` | [API reference](https://f-ewald.github.io/components/docs/relative-time.html) |
| `<reveal-button>` | [API reference](https://f-ewald.github.io/components/docs/reveal-button.html) |
| `<roman-numeral>` | [API reference](https://f-ewald.github.io/components/docs/roman-numeral.html) |
| `<slide-panel>` | [API reference](https://f-ewald.github.io/components/docs/slide-panel.html) |
| `<stat-meter>` | [API reference](https://f-ewald.github.io/components/docs/stat-meter.html) |
| `<status-pill>` | [API reference](https://f-ewald.github.io/components/docs/status-pill.html) |
| `<tile-grid>` | [API reference](https://f-ewald.github.io/components/docs/tile-grid.html) |
| `<toast-notification>` | [API reference](https://f-ewald.github.io/components/docs/toast-notification.html) |
| `<ui-button>` | [API reference](https://f-ewald.github.io/components/docs/ui-button.html) |
| `<user-avatar>` | [API reference](https://f-ewald.github.io/components/docs/user-avatar.html) |
| `<weight-bar-chart>` | [API reference](https://f-ewald.github.io/components/docs/weight-bar-chart.html) |

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

The full token set is defined in [`src/tokens.ts`](./src/tokens.ts).

## MCP server

`npm run mcp` (or `node dist/mcp-server.js` after `npm run build`) starts a
stdio [MCP](https://modelcontextprotocol.io) server exposing the component
catalog to AI coding assistants, with two tools:

- `list_components` — every tag + one-line description.
- `get_component_docs(tag)` — the full generated Markdown doc for one tag
  (install snippet, usage example, attributes/properties, events, slots,
  CSS custom properties).

It's read-only over the same `custom-elements.json`/`docs/*.md` this package
already generates via `npm run docs` — no separate data source to maintain.
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
| `npm run build` | Compile `src/` with `tsc` into `dist/`, and generate `dist/tokens.css`. |
| `npm run build:demo` | Build the static playground into `demo-dist/`. |
| `npm run build:site` | Build the static documentation and nested playground into `pages-dist/`. |
| `npm run preview:site` | Preview the built Pages artifact locally. |
| `npm run icons` | Regenerate `src/icons.ts` from the Heroicons package. |
| `npm run analyze` | Regenerate `custom-elements.json` via the custom-elements-manifest analyzer. |
| `npm run docs` | Regenerate the manifest, `docs/*.md`, and `llms.txt`. |
| `npm run mcp` | Run the MCP server (`dist/mcp-server.js`) directly, for manual testing. |
| `npm run test` | Run the Playwright suite against the playground. |
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

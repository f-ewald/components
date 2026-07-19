# @f-ewald/components

[![npm](https://img.shields.io/npm/v/@f-ewald/components)](https://www.npmjs.com/package/@f-ewald/components)
[![license](https://img.shields.io/badge/license-BSD--3--Clause-blue)](./LICENSE)

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
| `<address-autocomplete>` | [docs/address-autocomplete.md](./docs/address-autocomplete.md) |
| `<animate-confetti>` | [docs/animate-confetti.md](./docs/animate-confetti.md) |
| `<autocomplete-input>` | [docs/autocomplete-input.md](./docs/autocomplete-input.md) |
| `<chat-message>` | [docs/chat-message.md](./docs/chat-message.md) |
| `<confirm-dialog>` | [docs/confirm-dialog.md](./docs/confirm-dialog.md) |
| `<copy-link-button>` | [docs/copy-link-button.md](./docs/copy-link-button.md) |
| `<distance-value>` | [docs/distance-value.md](./docs/distance-value.md) |
| `<distribution-chart>` | [docs/distribution-chart.md](./docs/distribution-chart.md) |
| `<editable-text>` | [docs/editable-text.md](./docs/editable-text.md) |
| `<live-timer>` | [docs/live-timer.md](./docs/live-timer.md) |
| `<map-circle>` | [docs/map-circle.md](./docs/map-circle.md) |
| `<map-pin>` | [docs/map-pin.md](./docs/map-pin.md) |
| `<map-point>` | [docs/map-point.md](./docs/map-point.md) |
| `<percent-bar-chart>` | [docs/percent-bar-chart.md](./docs/percent-bar-chart.md) |
| `<price-history-chart>` | [docs/price-history-chart.md](./docs/price-history-chart.md) |
| `<radio-cards>` | [docs/radio-cards.md](./docs/radio-cards.md) |
| `<radio-pills>` | [docs/radio-pills.md](./docs/radio-pills.md) |
| `<relative-time>` | [docs/relative-time.md](./docs/relative-time.md) |
| `<reveal-button>` | [docs/reveal-button.md](./docs/reveal-button.md) |
| `<roman-numeral>` | [docs/roman-numeral.md](./docs/roman-numeral.md) |
| `<slide-panel>` | [docs/slide-panel.md](./docs/slide-panel.md) |
| `<stat-meter>` | [docs/stat-meter.md](./docs/stat-meter.md) |
| `<status-pill>` | [docs/status-pill.md](./docs/status-pill.md) |
| `<toast-notification>` | [docs/toast-notification.md](./docs/toast-notification.md) |
| `<ui-button>` | [docs/ui-button.md](./docs/ui-button.md) |
| `<user-avatar>` | [docs/user-avatar.md](./docs/user-avatar.md) |
| `<weight-bar-chart>` | [docs/weight-bar-chart.md](./docs/weight-bar-chart.md) |

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

The full token set is defined in [`src/tokens.ts`](./src/tokens.ts).

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
```

## Development commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite playground with HMR. |
| `npm run build` | Compile `src/` with `tsc` into `dist/`, and generate `dist/tokens.css`. |
| `npm run build:demo` | Build the static playground into `demo-dist/`. |
| `npm run icons` | Regenerate `src/icons.ts` from the Heroicons package. |
| `npm run analyze` | Regenerate `custom-elements.json` via the custom-elements-manifest analyzer. |
| `npm run docs` | Regenerate the manifest, `docs/*.md`, and `llms.txt`. |
| `npm run test` | Run the Playwright suite against the playground. |

## Contributing

- New components live in `src/`, are exported from `src/index.ts`, restyled
  to the `--ui-*` design tokens, and get a playground section (`index.html`)
  and a Playwright spec (`tests/`). See [`CLAUDE.md`](./CLAUDE.md) for the
  full checklist.
- Relative imports within `src/` must use `.js` specifiers (not `.ts`), so
  the `tsc`-emitted `dist/` output resolves correctly for consumers.
- Run `npm run docs` after changing any component's public API so the
  generated docs and `llms.txt` stay in sync.

## Publishing

First publish (package is not yet on the npm registry):

```bash
npm login    # if needed
npm publish --access public
```

Subsequent releases:

```bash
npm version <patch|minor|major>
npm publish
```

`prepublishOnly` runs `build`, `docs`, and `test` automatically before every
publish.

## License

[BSD-3-Clause](./LICENSE)

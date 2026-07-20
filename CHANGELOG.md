# @f-ewald/components

## Unreleased

- Added `tile-grid`: a generic grid shell mirroring `data-table`'s headless
  pattern — `items`, `renderTile(item)` (default: stringify), optional
  `itemHref(item)` clickable-tile support with the same nested-`a`/`button`
  click-hijack guard as `data-table.rowHref`.
- Added icons: `chevron-down`, `document`, `squares-2x2`,
  `chat-bubble-left-right`.
- `popover-panel` gained a `centered` mode: set the `centered` attribute to
  render a screen-centered modal with a translucent backdrop instead of the
  default anchored placement; clicking the backdrop closes it like an
  outside click would.
- `user-avatar`'s `size` prop now also accepts named presets (`xs`=18,
  `sm`=24, `md`=32, `lg`=48) in addition to a pixel number.

## 0.4.0

- Added `map-point`: a small plain-colored map marker (gradient fill, thin
  white ring, no slotted content) for dense point layers — transit stops,
  amenities, hazard points, etc. Unlike `map-pin`/`map-circle`, it carries no
  per-marker content, since it's meant to be rasterized once per color and
  used as a Mapbox `icon-image` on a `symbol` layer rather than mounted as
  individual DOM markers.

## 0.2.1

- Fixed `ui-button`: `type="submit"`/`"reset"` now actually submits/resets
  the ancestor `<form>`. The real `<button>` lives in `ui-button`'s shadow
  root, which native HTML form association doesn't cross into from an
  ancestor light-DOM `<form>` — clicking it was a silent no-op. Now wired
  through `ElementInternals.form` (the same mechanism `address-autocomplete`
  uses), which also preserves native constraint validation (e.g. `required`
  fields still block submission).

## 0.2.0

- Added `user-avatar`: circular avatar with an image/initial/generic-icon
  fallback chain (an expired or unset photo URL never leaves a blank
  circle).
- Added `radio-cards`: single-select group of labeled cards with an optional
  description, for a handful of meaningfully different choices.
- Added `radio-pills`: single-select group of compact pills, for many short,
  same-shaped choices (e.g. a basemap style).
- Added `ui-button`: a button (or, with `href` set, a link styled the same
  way) with an optional leading icon, in `primary`/`secondary`/`danger`
  variants and a `busy` spinner state.

## 0.1.0

Modernization: token-styled, individually-importable component library.

- Replaced the toolchain: Vite (dev server + demo build) and plain `tsc`
  (npm build artifact) replace Rollup, Eleventy, web-dev-server, and
  web-test-runner. Playwright replaces the old test setup.
- Added a design-token system (`src/tokens.ts`): components use
  `var(--ui-*, <fallback>)` custom properties sourced from Tailwind's
  default palette, so every component renders correctly with zero external
  CSS and is retheme-able via CSS custom properties.
- Added subpath exports so every component, `tokens.css`,
  `custom-elements.json`, and `llms.txt` are importable individually.
- Ported and restyled 10 components from a sibling project:
  `confirm-dialog`, `toast-notification` (+ `notifySuccess`/`notifyError`/
  `notifyInfo` helpers), `slide-panel`, `copy-link-button`, `relative-time`,
  `distance-value`, `price-history-chart`, `distribution-chart`,
  `percent-bar-chart` (renamed from `race-chart`), `weight-bar-chart`,
  `address-autocomplete` (supports both an `endpoint`-based geocoding API
  and a locally-supplied `suggestions` array, filtered client-side with no
  network request).
- Added `autocomplete-input`: a generic, form-associated autocomplete for
  any `{key, value}` option list, supporting the same two suggestion
  sources as `address-autocomplete` (an `endpoint` returning
  `[{key, value}]`, or a locally-supplied `options` array).
- Added a generated icon set (`src/icons.ts`, from the `heroicons` package)
  and a Vite-based playground (`index.html`) covering all 15 components.
- Added generated LLM-consumable docs: `custom-elements.json`, `docs/*.md`
  per component, and `llms.txt`.
- Cleaned up the 3 original components (`animate-confetti`, `reveal-button`,
  `roman-numeral`): typed, restyled to tokens, no behavior changes.

## 0.0.1

Initial release.
- `<animate-confetti>`
- `<reveal-button>`

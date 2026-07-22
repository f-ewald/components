# @f-ewald/components

## 1.0.2

- Generate canonical visual baselines on the GitHub-hosted runner so screenshot
  gates are stable across local CPU architectures and CI font environments.

## 1.0.1

- `tile-grid` gained an opt-in `fileIcon` (`file-icon`) property that
  prefixes each tile with a decorative Heroicons `document` glyph, for grids
  of file-like items; off by default, so it adds no markup or layout space
  unless enabled. Existing behavior remains unchanged until the additive
  property is enabled.
- Standardized the component design language across tokens, semantic colors,
  spacing, focus/disabled/forced-colors states, dark mode, and reduced motion;
  added a canonical design contract plus deterministic catalog/style contracts
  and light/dark component screenshot baselines.
- Improved keyboard and screen-reader behavior across comboboxes, dialogs,
  panels, popovers, clickable tables/tiles, radio groups, charts, and layered
  overlays. Added additive disabled radio-group semantics and `data-table`
  `rowLabel` support for custom rendered rows.
- Added `kbd-hint`: platform-aware boxed keyboard shortcut hints with
  `+`-separated key tokens, automatic or explicit macOS modifier glyphs,
  accessible spoken labels, and `currentColor` styling for neutral or accent
  controls.
- `weight-bar-chart` bars now use a `--ui-primary`-driven vertical gradient
  matching `map-circle`, with a lighter top and darker bottom. No public API
  changes.
- `user-avatar` initial and icon fallbacks now use the same vertical gradient
  while keeping image avatars untinted. No public API changes.
- `percent-bar-chart` and `stat-meter` fills now use the same lighter-top,
  darker-bottom vertical gradient while preserving data-driven and custom
  colors. No public API changes.
- Tightened inactive multiline `editable-text` descriptions by removing
  template-generated blank lines and the read-state editor inset. Active
  textarea spacing is unchanged.

## 1.0.0

- **Breaking:** Removed `<map-point>` and the
  `@f-ewald/components/map-point.js` subpath. Use
  `<map-circle size="14" ring-width="3">` instead; it provides the same
  gradient circle and white ring while also supporting badge content and
  `highlighted` state when needed.
- Added opt-in autocomplete to `form-select` via the `searchable` attribute:
  typing filters predefined option labels with case-insensitive infix
  matching, while only an explicit option selection can change `value`.
  `SelectOption` also accepts an optional pre-rendered `icon` and square
  `iconSize`, rendered before labels without reserving space for iconless
  options.
- Fixed `calendar-month` event fills so continuous entries keep one uniform
  color across weekdays, weekends, and today rows. Hovering or focusing
  either linked segment now highlights the complete title/body entry, and
  title, detail, and footer text share the same left edge.

## 0.9.0

- Added `calendar-entry`, `calendar-month`, and `calendar-year`: a
  read-only calendar built from three composable pieces. `calendar-month`
  renders one month as a top-to-bottom day list, with weekends and today
  highlighted; `calendar-year` composes twelve of them from declarative
  `calendar-entry` children (`start`/`end`/`label`/`color`/`href`) with
  optional plain-text `title`, repeatable `detail`, and ending `footer`
  slots. Multi-day entries use continuous lane-spanning bodies with
  multiline clamping, footer priority, full-box links, and subtle linked
  hover/focus highlights; overlapping entries stack into aligned lanes and
  clip cleanly across month and year boundaries.
- Added `frame-box`: a titled frame around a slot — a gray border with a
  small uppercase, muted label overlapping the top edge (fieldset/legend
  style). Generic; built for slowmo to fence off dev-only "Debug" chrome
  from the product UI, but the label text is entirely up to the consumer.
- `popover-panel` gained a new `actions` named slot, rendered in the header
  between the title and the close button, for extra controls like an
  icon+label link. `form-select`'s trigger button now fills its host's
  width (`justify-content: space-between` keeps the chevron pinned to the
  far edge); the host itself is still `display: inline-block`, so existing
  auto-width usages are unaffected — set `form-select { width: 100%; }` on
  the host to actually go full-width. Added the `ArrowTopRightOnSquare`
  heroicon.
- Added `icon-button`: a borderless button wrapping a passed-in icon
  (`icon: TemplateResult | null`, same pattern as slowmo's `nav-item.icon`
  prop), with a rounded hover-highlight background and a required `label`
  applied as `aria-label`/`title`. Built to replace a bordered `ui-button`
  for low-emphasis row actions (e.g. an Edit pencil).
- Added `dropdown-button`: a primary-styled button with a label and chevron
  that opens an anchored menu of actions, firing `select` with `{ value }`.
  Essentially `form-select` minus "current value" semantics — a menu, not a
  select. Built for slowmo's failed-task Retry/Close/Backlog action, reusing
  `form-select`'s popover/outside-click/Escape/keyboard-nav pattern.
- Added a stdio MCP server (`src/mcp-server.ts` → `dist/mcp-server.js`,
  `npm run mcp`) exposing the component catalog to AI coding assistants:
  `list_components` and `get_component_docs(tag)`, backed by the existing
  `custom-elements.json`/`docs/*.md`. See the "MCP server" section in
  `CLAUDE.md` and `docs/mcp-evaluation.md` for design details and how
  consuming projects wire it up via `.mcp.json`.

## 0.6.0

- Added `photo-gallery`: a responsive, accessible image carousel composed
  from declarative `gallery-item` (image slide, with an optional
  `gallery-item-variant` per breakpoint/object-fit) children — prev/next
  controls, a current/total counter, clickable indicators, autoplay with an
  optional pause/play control, and swipe/keyboard navigation, firing
  `slide-change` with the active index and the reason it changed.
- Added `data-table`: a generic, presentational table shell — renders a
  `<thead>` from `columns` and one `<tr>` per `rows` entry, with each cell
  produced by `renderCell` (default: plain property lookup). Optional
  `rowHref` makes whole rows clickable without hijacking clicks on nested
  interactive elements a cell's content might contain.
- Added `form-select`: a styled dropdown select — a trigger button showing
  the current option's label, opening a listbox popover on click, firing
  `change` with `{ value }`. Drop-in generic replacement for a native
  `<select>` wherever consistent cross-browser styling is wanted.
- Added `popover-panel`: a generic anchored popover shell, positioned
  relative to its nearest `position: relative` ancestor, closing on outside
  click or Escape. Shares `slide-panel`'s header/close-button API so either
  can be swapped in for the other. Also gained a `centered` mode: set the
  `centered` attribute to render as a screen-centered modal with a
  translucent backdrop instead of the default anchored placement; clicking
  the backdrop closes it like an outside click would.
- Added `tile-grid`: a generic grid shell mirroring `data-table`'s headless
  pattern — `items`, `renderTile(item)` (default: stringify), optional
  `itemHref(item)` clickable-tile support with the same nested-`a`/`button`
  click-hijack guard as `data-table.rowHref`.
- Added icons: `chevron-down`, `document`, `squares-2x2`,
  `chat-bubble-left-right`.
- `user-avatar`'s `size` prop now also accepts named presets (`xs`=18,
  `sm`=24, `md`=32, `lg`=48) in addition to a pixel number.
- Fixed a dark-mode bug in the shared token stylesheet: every component's
  `:host` block re-declared each `--ui-*` custom property as
  `--ui-x: var(--ui-x, fallback)`, which computed to the guaranteed-invalid
  value instead of inheriting `:root`'s value — silently discarding any
  consumer override, including the new dark palette. Only unnoticed because
  every fallback happened to equal the light-mode default. Replaced with
  plain inheritance (nothing redeclared on `:host`) plus a `darkTokenValues`
  palette applied via `tokens.css`'s `@media (prefers-color-scheme: dark)` /
  `[data-theme]` rules.

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

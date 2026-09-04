# Component design language

This is the canonical visual, interaction, and accessibility contract for
`@f-ewald/components`. `CLAUDE.md` carries the short always-on rules; this file
defines the details used when creating or reviewing components.

## Principles

- Components are compact, calm, and content-first.
- Shared UI chrome uses design tokens; data-driven visuals may use consumer
  colors when color conveys domain meaning.
- Every component works with no external CSS and follows inherited light/dark
  tokens when a consumer supplies them.
- Native semantics and keyboard behavior come before custom ARIA.
- Pointer, keyboard, focus, disabled, loading, empty, error, and reduced-motion
  states are part of the design—not optional polish.

## Tokens and colors

- Use `var(--ui-*, exact-fallback)` for reusable colors, fonts, type metrics,
  radii, shadows, and focus rings. `tokens.ts` (`tokenValues`) is the single
  source of truth; every `var(--ui-*, …)` usage must repeat that token's exact
  fallback, and any newly introduced `--ui-*` usage must add/carry one too.
- Themes are single-valued and mutually exclusive, selected by `data-theme` on
  `<html>`: `dark` and `light` force one of the two flat palettes, `gradient`
  glosses buttons and toasts, `metro` squares corners and flattens shadows over
  a blue accent, and `blueprint` restyles the palette as a monospace technical
  spec sheet — ink on paper, one pure-blue accent, square corners, and
  structure carried by 1.5px hairline rules instead of shadows. `dark` aside,
  each is layered on the light palette and
  must be excluded from `tokens.css`'s `prefers-color-scheme: dark` media query
  — that selector outranks a bare `[data-theme]`, so a missing exclusion yields
  a half-dark hybrid rather than an outright failure. Adding a theme therefore
  means adding it to `lightThemes` in `generate-tokens-css.mjs`, which derives
  both the block and the exclusion from that one list.
- Colors are the normal subject of a theme. Three other axes are themeable, each
  introduced by exactly one theme and each defaulting to the behavior that
  predates it:
  - **Shape** — `metro` and `blueprint` set every `--ui-radius*` to `0`.
  - **Border weight** — `--ui-border-width` (`1px`), which `blueprint` takes to
    `1.5px`. Every genuine surface or control border reads it; see "Borders"
    below for what is deliberately excluded.
  - **Label case** — `--ui-label-transform` (`none`), which `blueprint` takes to
    `uppercase`, and `--ui-numeric` (`normal`), which it takes to
    `tabular-nums`.
  - **Type family** — `--ui-font` only. `blueprint` retargets it to a monospace
    stack led by "Space Mono", which falls through to the system mono stack when
    no webfont is loaded, so the theme still renders correctly with zero
    external CSS.
  Type *metrics* — size, weight, line height, tracking — are never themed in any
  theme: they encode hierarchy rather than style.
- Semantic states use `primary`, `info`, `success`, `warning`, and `danger`.
- Foregrounds on solid semantic fills use `--ui-on-accent`.
- Elevated dark tooltips use `--ui-tooltip`; modal backdrops use
  `--ui-overlay` and are not interchangeable.
- Static chart axes, labels, grids, skeletons, and default series use tokenized
  SVG CSS classes. Consumer/data-series colors remain data.
- Plain SVG presentation attributes may use literal token fallback values when
  CSS variables are not practical. User-provided marker/chart colors are an
  explicit exception.
- White map rings, image-overlay controls, avatar foregrounds, and celebratory
  confetti may remain literal when their contrast is intentionally independent
  of the surrounding theme.
- There is no dedicated secondary accent color. `tab-bar`'s inactive-tab
  indicator reuses `--ui-border` (a shared line beneath the whole strip, with
  the active tab's `--ui-primary` line drawn on top of it) rather than
  introducing a new token — the same precedent as `ui-button`'s `secondary`
  variant, which is realized via `--ui-border`/`--ui-text-muted`, not a hue.
- `--ui-ai-1`…`--ui-ai-4` are the one multi-hue family: the stops of
  `ui-button[ai]`'s animated ring, where the rainbow itself is the meaning
  ("this action is AI-powered") rather than a semantic state. They are only
  ever used together, as a sweep around a control's edge — never as a fill,
  text, or border color.
- The AI ring composes with every variant and both themes with one exception:
  do not pair `ai` with `pill` under the gradient theme. The gradient theme
  defines a button through a darker border edge plus a glossy top highlight,
  and a pill's fully-rounded silhouette sits flush against the ring along its
  whole outline, so that edge and gloss read as part of the rainbow instead
  of the button, and the fill stops reading as a gradient. Gradient-theme AI
  buttons keep the default `--ui-radius-sm` corners; `ai` + `pill` is a flat
  theme combination.

## Typography

Type is fully tokenized; every axis has an exact-fallback `--ui-*` token and
literal values are migrated onto them.

- **Family:** `--ui-font` (system sans stack) for UI text; `--ui-font-mono`
  for code and keycaps. `font-family: inherit` is reserved for components that
  intentionally adopt the host's type — `editable-text` and the inline
  formatters — so an inline edit or formatted value matches surrounding copy.
- **Size:** `--ui-font-size` (`0.875rem`) for body/component text,
  `--ui-font-size-sm` (`0.75rem`) for compact controls/labels,
  `--ui-font-size-xs` (`0.6875rem`) for secondary details/keycaps, and
  `--ui-font-size-lg` (`1rem`) for the largest titles/emphasis.
- **Weight:** only four weights exist —
  `--ui-font-weight-regular` (400), `--ui-font-weight-medium` (500),
  `--ui-font-weight-semibold` (600), and `--ui-font-weight-bold` (700). Body is
  regular, compact controls/labels are medium, section/title emphasis is
  semibold, and bold is reserved for badges or data emphasis.
- **Line height:** `--ui-line-height-glyph` (1) for single-glyph icon/marker
  boxes, `--ui-line-height-tight` (1.25) for headings and compact multi-line
  labels, and `--ui-line-height-normal` (1.5) for running body text.
- **Tracking:** `--ui-tracking-normal` (0) is the default; `--ui-tracking-wide`
  (0.04em) is the single widened step for uppercase micro-labels.
- **Label case:** chrome micro-labels — the small, wide-tracked text that names
  a region, a field, or a column (`spec-list` keys, `data-table` headers,
  `stat-meter` and `cron-schedule` group labels) — carry
  `text-transform: var(--ui-label-transform, none)` so a theme can set them in
  caps. Never apply it to user-supplied content: shouting someone's data is not
  a theme's decision, and `text-transform` is presentational, so the text still
  copies out in its original casing. Components that are uppercase by design in
  every theme (`frame-box`'s legend, `app-sidebar`'s section heading) keep a
  literal `uppercase` — the token exists to *add* caps, not to remove them.
- **Numerals:** figures that change in place or stack into a column
  (`pagination-nav`'s status, `progress-bar`'s value, `vote-control`'s score)
  use `font-variant-numeric: var(--ui-numeric, normal)`. Readouts that must be
  tabular in every theme — a ticking clock, a calendar grid — keep a literal
  `tabular-nums` instead, since the token's default would undo them.
- **Exemptions:** SVG presentation attributes (`font-size="…"`,
  `font-weight="…"`) can't take `var()` and stay literal at the token's
  fallback value; `line-height: 0` used purely to collapse an inline
  icon/SVG box is domain geometry, not a type choice.

## Spacing and geometry

- `padding`, `margin`, and `gap` use literal multiples of `0.25rem`; spacing is
  not tokenized. Convert CSS layout pixels to rems.
- Documented spacing exceptions: SVG/canvas geometry, percentages,
  aspect ratios, animation timing, proportional calculations derived from a
  public size, `0.125rem` optical alignment nudges, and domain geometry.

### Borders

- A surface or control border goes through `--ui-border-width` (`1px`):
  `border: var(--ui-border-width, 1px) solid var(--ui-border, #e2e8f0);`. A
  border is chrome, not layout, which is why it is tokenized while spacing is
  not — under `blueprint` these rules do the work a shadow does elsewhere, and
  at 1px they read as a faint table rather than as drawn structure.
- Three kinds of 1px border stay literal, by design:
  - `@media (forced-colors: active)` borders (`1px solid CanvasText`), which
    answer to the user's palette rather than to a theme.
  - Data-mark geometry — `calendar-month`'s entry-footer rule is drawn in the
    entry's own color and divides one mark's content.
  - Decorative edges whose width is the effect: `range-slider`'s white thumb
    ring, `tab-bar`'s 2px active underline.
- Anything with a fixed height or width *and* a themeable border must also set
  `box-sizing: border-box`, or a heavier border pushes it past the shared `2rem`
  control target.

### Radius

- Use `--ui-radius-sm` (`0.25rem` ≈ 4px) for controls, `--ui-radius`
  (`0.5rem` ≈ 8px) for cards/dialogs/surfaces, and `--ui-radius-pill`
  (`9999px`) / `--ui-radius-circle` (`50%`) for intentional pill and circle
  shapes — a chip, an avatar, a slider thumb, a dot. Those four rem/px values
  are the light palette's, not constants: `data-theme="metro"` sets all four to
  `0`. Always read the token, never inline its current value — a hardcoded
  `0.25rem` or `9999px` silently opts that corner out of the theme, which a
  contract test now rejects.
- Chart bars and their tracks use `--ui-radius-sm` as well — literal `4` on
  SVG `rx` attributes, which can't take `var()` (`percent-bar-chart`,
  `price-history-chart`), or the token in CSS (`distribution-chart`,
  `weight-bar-chart`). A bar is a data mark, not a pill: fully rounded ends
  round away the value being read at short lengths. Genuine pill controls
  (e.g. `range-slider`'s track and thumb) keep their full radius, via
  `--ui-radius-pill`/`--ui-radius-circle`.
- Compact controls must retain a clear hit target and must not reserve layout
  space for optional content that is absent.

### Control metrics

- Standard interactive controls share a single `2rem` height; padding is
  applied by role (inline text, icon-only, standalone) rather than ad hoc.
- An autocomplete's opt-in in-field clear action remains a `2rem` target with
  an 18px standalone icon. It overlays reserved trailing input padding, so
  enabling or showing it never changes the field's outer dimensions.
- `form-field[floating-label]` is the explicit text-field exception: supported
  single-line controls grow to `3rem` so an `--ui-font-size-xs` label and the
  entered value remain distinct. Empty, unfocused labels rest at the normal
  placeholder position; focus or content floats the label to the top-left.
  Native and package text areas reserve equivalent top space but retain their
  row-driven height. Unsupported controls keep the normal external label.
- Icons are `14px` inline (next to text) and `18px` standalone; icon-only tap
  targets are `32px`.
- Icons come from the generated Heroicons catalog (`icons.js`; `docs/icons.md`);
  add new names through `scripts/generate-icons.mjs` and `npm run icons`, not
  ad hoc inline SVGs.
- Control corners use `--ui-radius-sm` (4px); enclosing surfaces use
  `--ui-radius` (8px). Both are theme-overridable — see the radius rule above.
- Side panels use a `20rem` compact / `25rem` comfortable width; the shared
  responsive breakpoint is `48rem`.
- Radio inputs render at `1rem`.
- Value-entry fields fill their container by default: the host is
  `display: block` and the inner control is `width: 100%`. Shrink-to-fit is
  opt-in per instance via the host (`<tag> { display: inline-block; }` or
  `width: fit-content`). This covers `autocomplete-input`,
  `address-autocomplete`, `editable-text`, `form-select`, and `multi-select`,
  and matches the native/reusable-component convention that a field fills the
  stacked column it lives in while staying overridable from outside the shadow
  DOM.
- Charts and metadata-only components keep their own domain geometry and are
  exempt from the control-metric grid.

## Interaction states

- Interactive surfaces provide hover, active/selected, disabled, and
  `:focus-visible` states.
- Focus uses `--ui-focus-ring` plus a real outline fallback in forced-colors.
- Disabled controls use native `disabled` where possible; otherwise use
  `aria-disabled`, suppress activation, and retain understandable contrast.
- If a whole row/tile is clickable, it must have keyboard parity and must not
  hijack nested interactive controls.

## Motion

- Keep transitions between 120ms and 250ms unless the behavior itself defines a
  duration.
- Nonessential transitions and animations must be removed under
  `prefers-reduced-motion: reduce`.
- Floating-label position/type transitions use the normal 120–250ms range and
  become instantaneous under reduced motion.
- Progress spinners may become static indicators in reduced motion.
- Components driven by timers must clean up on disconnect.

## Accessibility

- Prefer buttons, links, inputs, radios, and dialogs over clickable generic
  elements.
- Custom comboboxes expose expanded state, controlled listbox, active option,
  explicit selection, and no-results behavior.
- Modal/centered overlays expose a name, `role="dialog"`, `aria-modal`, initial
  focus, Escape behavior, focus containment, and focus restoration.
- Collapsible controls expose `aria-expanded` and `aria-controls`.
- Tab strips (`tab-bar`/`tab-item`) follow the WAI-ARIA tabs pattern:
  `role="tablist"/"tab"/"tabpanel"`, `aria-selected`, roving tabindex, and
  automatic activation (arrow keys both move focus and select; Home/End jump
  to the first/last tab).
- Charts expose a concise accessible data summary.
- Decorative icons/keycaps inside already-labelled controls are hidden from
  assistive technology; standalone equivalents expose their own name.
- Do not create noisy live regions for per-second timers.

## Component exceptions

- Metadata-only tags may omit standalone playground sections when their full
  behavior is demonstrated through a parent:
  `calendar-entry`, `gallery-item`, `gallery-item-variant`, `kanban-card`,
  `kanban-column`, `tab-item` (shown through `tab-bar`), and `timeline-entry`
  (shown through `timeline-container`).
- Styleless inline formatters may omit empty `static styles`/token imports:
  `distance-value`, `live-timer`, `relative-time`, and `roman-numeral`.
- Domain visuals may deliberately diverge in geometry and data color, but their
  surrounding typography, focus, motion, and accessibility still follow this
  contract.

## Layout and page templates

The layout components compose into dashboard pages: `app-shell` is the grid
backbone, and `app-sidebar`, `action-bar`, `page-header`, `pagination-nav`, and
`form-actions` fill its slots and content.

### Shell grid and metrics

- `app-shell` owns a CSS grid with `topbar`, `sidebar`, `main` (default
  slot), `detail`, and `footer` areas. The top bar always spans the shell's
  full width, in every sidebar state — its grid row spans all three columns,
  while `sidebar`/`main`/`detail` share the row beneath it.
- The sidebar's three properties are independent: `sidebar-open` (visible or
  not, closed by default), `sidebar-width` (`full` 16rem vs. `icon` 3.5rem
  rail), and `sidebar-mode` (`overlay`, the default, vs. `push`). `overlay`
  positions the sidebar with `position: absolute` against `.shell` (not the
  viewport, so the component stays correct when embedded well short of the
  full viewport) at a z-index above the top bar's corner, and its reserved
  grid column width (`--_sidebar-w`) stays `0px` — opening it never resizes
  or reflows `main`/`footer`, it visually covers whatever is underneath.
  `push` instead sets `--_sidebar-w` to the current `sidebar-width` value, so
  the sidebar becomes a real, in-flow grid item and `main`/`footer` reflow
  around it, same as the top bar always doing so above it.
- Below the shared `48rem` breakpoint, `sidebar-mode`/`sidebar-width` are
  ignored entirely — the sidebar is always a full-screen, modal,
  scrim/Escape-dismissible drawer, same as the detail column's mobile
  overlay. Those two properties only affect the desktop presentation.
- Layout dimensions are documented literal rems, not `--ui-*` tokens (widths and
  spacing are constants in this system). A few are exposed as overridable
  `--component-*` custom properties for per-instance tuning:
  - sidebar full width `--component-sidebar-width` = `16rem` (also full
    screen width below the `48rem` breakpoint, regardless of `sidebar-width`);
  - sidebar icon rail width `--component-sidebar-rail-width` = `3.5rem`;
  - top bar `--component-topbar-height` = `3rem`;
  - detail column reuses the `20rem` / `25rem` panel widths (the `detail-width`
    `compact` / `comfortable` attribute);
  - main content is white (`--component-main-background`, default `--ui-surface`)
    and fluid; constrain reading or form pages with a `max-width` on your own
    wrapper (roughly `40rem`–`48rem`).
- `push` mode's width change is an instant snap, not an animated slide —
  `--_sidebar-w` is a plain (unregistered) custom property feeding a grid
  track, and those don't transition smoothly without `@property` syntax
  registration. `overlay` mode's slide is a genuine `transform` transition
  and animates normally.
- Z-index tiering keeps the shell's own chrome under the shared overlay
  stack: `.nav-group` (the built-in toggle) is `41`, `.sidebar`/`.detail` are
  `40`, `.scrim` is `39` — all fixed literals, not `--component-layer-z`,
  since `app-shell` never calls `activateLayer`/`deactivateLayer` from
  `utils/layer-stack.ts`. Any real `modal-dialog`/`confirm-dialog`/
  `popover-panel`/`slide-panel` (all ≥100) must always paint above the
  shell's own chrome. `.topbar` itself deliberately carries no z-index — an
  explicit z-index on a CSS grid item creates a stacking context, which would
  trap the toggle below the sidebar it opens; giving the z-index to the
  toggle's own wrapper (`.nav-group`) instead avoids that trap. Relatedly,
  `.sidebar` itself only gets `grid-area: sidebar` in `push` mode — an
  absolutely-positioned grid item's inset properties resolve against its own
  grid area's box rather than the whole grid container once `grid-area` is
  set, even with explicit (non-`auto`) insets, which would anchor `overlay`
  mode below the top bar's row instead of overlapping it.

### Sidebar

- Visibility, width, and layout mode are three independent `app-shell`
  properties — not a two-mode rail/drawer split. `sidebar-open` (closed by
  default at every breakpoint) is toggled by the built-in top-bar button or
  the `[` keyboard shortcut (ignored while a text field is focused or a
  modifier is held); the shortcut is surfaced in the toggle's hover/focus
  tooltip, not as permanent chrome. `sidebar-width` and `sidebar-mode` have
  no built-in toggle — a consumer sets them directly (e.g. from their own
  settings UI), same as `detail-width`.
- Below `48rem` the open sidebar is always full width and modal — a scrim
  dims the rest of the page and Escape dismisses it, same as the detail
  overlay — regardless of `sidebar-width`/`sidebar-mode`. At or above `48rem`,
  an `overlay`-mode sidebar is non-modal — no scrim, no Escape-dismiss, since
  it reads as an ordinary always-interactive panel, not a blocking dialog;
  only the toggle (or `[`) closes it. A `push`-mode sidebar is even more
  clearly non-modal, since it never covers anything.
- `sidebar-width="icon"` drives the slotted `app-sidebar`'s own `collapsed`
  (rail) attribute to match, in both `overlay` and `push` mode — `app-shell`
  re-syncs it on every `sidebar-width` change and on `slotchange`. Outside of
  that, `app-shell` doesn't otherwise manage `collapsed`; a caller can still
  set it directly on a standalone `app-sidebar`.
- Nav items are the consumer's `<a>`/`<button>` elements with an icon and a
  label; mark the active one with `aria-current="page"`. Each label reads the
  inherited `--app-sidebar-label` custom property so rail mode can hide it
  while its `aria-label` keeps the accessible name.
- The `header` slot holds the brand: a small logo plus a name. Wrap the name
  in a `--app-sidebar-label` element so rail mode shows only the logo,
  centered in line with the nav icons.

### Forms and actions

- The action row above a list uses `action-bar` (`start` = search/filters,
  `end` = record actions). Pagination below a list uses `pagination-nav`, which
  is controlled: the consumer owns the data and moves the page on `page-change`.
- Form button order is fixed: the primary/submit button is rightmost, the
  secondary/cancel button is immediately to its left, and any tertiary or
  destructive action is pinned to the far left. Use `form-actions`, which
  enforces this regardless of source order — never hand-place form buttons in a
  different order.
- Page and record actions live in the `page-header` actions slot, not a footer
  bar: the primary action is the prominent, rightmost button, and destructive or
  rare actions are de-emphasized (a secondary button or an overflow menu, gated
  by a `confirm-dialog`). Never duplicate the primary action in both a header and
  a footer.
- Reserve `form-actions` for the bottom of an actual editable form. Read (detail)
  and edit (form) are distinct modes: a read view acts through its header and has
  no Save/Cancel footer; entering edit shows the form with a `form-actions` bar.
- Fence clearly distinct sections of a detail or form page with `frame-box`.

### Templates

The recipes under `docs/layouts/` compose these into four pages — list-only,
list + detail, detail-only, and form — and the MCP `list_layouts` /
`get_layout` tools serve them. Add a page by adding a `docs/layouts/<name>.md`
recipe and, ideally, a matching full-page demo under `demo/layouts/`.

## Playground and documentation

- Visual/interactive nav links and complete sections are alphabetical and have
  identical ID sets.
- Every visual section includes a live representative state and a copyable
  usage example.
- Every public property/event/mode is exercised in its section or an explicitly
  linked parent section.
- Public API changes update JSDoc, generated docs, `llms.txt`, README when
  relevant, and the changelog.

## Measurement contracts

- `design-tests/design-language.spec.ts` enforces the token, import, catalog,
  and measurement rules deterministically. The measurement contracts cover
  tokenized font family/size/weight/leading/tracking, the `0.25rem` spacing
  grid, 14px/18px icon calls, 2rem interactive targets, surface padding,
  panel widths, and the shared 48rem breakpoint.
- Narrow file-scoped allowlists are permitted only for documented domain
  geometry that cannot use a semantic token. They must equal the live literal
  inventory exactly, so stale entries and new unapproved literals both fail.
- Never add an allowlist entry merely to unblock new work, and never weaken the
  token-fallback, `.js`-import, catalog, or measurement checks.

## Validation tiers

1. Inner loop: `npm run typecheck` and all touched component specs in one
   Playwright invocation.
2. Run docs once after APIs/JSDoc stabilize.
3. Run `npm run test:design` after token/catalog/state changes.
4. Run the complete package/demo/Pages gate once at task completion.
5. Reviewer fixes rerun only affected specs/contracts, followed by one final
   full gate.

## Review checklist

- Shared tokens use exact fallbacks; data-color exceptions are intentional.
- Spacing follows the scale and optional content consumes no empty space.
- Light, dark, forced-colors, and reduced-motion states remain legible.
- Pointer and keyboard behavior are equivalent.
- Empty/error/loading/disabled/selected states are represented where relevant.
- The playground and tests demonstrate the changed public behavior.

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
- **Exemptions:** SVG presentation attributes (`font-size="…"`,
  `font-weight="…"`) can't take `var()` and stay literal at the token's
  fallback value; `line-height: 0` used purely to collapse an inline
  icon/SVG box is domain geometry, not a type choice.

## Spacing and geometry

- `padding`, `margin`, and `gap` use literal multiples of `0.25rem`; spacing is
  not tokenized. Convert CSS layout pixels to rems.
- Documented spacing exceptions: 1px borders, SVG/canvas geometry, percentages,
  aspect ratios, animation timing, proportional calculations derived from a
  public size, `0.125rem` optical alignment nudges, and domain geometry.
- Use `--ui-radius-sm` (`0.25rem` ≈ 4px) for controls, `--ui-radius`
  (`0.5rem` ≈ 8px) for cards/dialogs/surfaces, and an intentional full
  pill/circle radius only for pill/avatar/marker shapes.
- Compact controls must retain a clear hit target and must not reserve layout
  space for optional content that is absent.

### Control metrics

- Standard interactive controls share a single `2rem` height; padding is
  applied by role (inline text, icon-only, standalone) rather than ad hoc.
- Icons are `14px` inline (next to text) and `18px` standalone; icon-only tap
  targets are `32px`.
- Control corners use `--ui-radius-sm` (4px); enclosing surfaces use
  `--ui-radius` (8px).
- Side panels use a `20rem` compact / `25rem` comfortable width; the shared
  responsive breakpoint is `48rem`.
- Radio inputs render at `1rem`.
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
- Charts expose a concise accessible data summary.
- Decorative icons/keycaps inside already-labelled controls are hidden from
  assistive technology; standalone equivalents expose their own name.
- Do not create noisy live regions for per-second timers.

## Component exceptions

- Metadata-only tags may omit standalone playground sections when their full
  behavior is demonstrated through a parent:
  `calendar-entry`, `gallery-item`, and `gallery-item-variant`.
- Styleless inline formatters may omit empty `static styles`/token imports:
  `distance-value`, `live-timer`, `relative-time`, and `roman-numeral`.
- Domain visuals may deliberately diverge in geometry and data color, but their
  surrounding typography, focus, motion, and accessibility still follow this
  contract.

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

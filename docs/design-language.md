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

- Use `var(--ui-*, exact-fallback)` for reusable colors, fonts, radii, shadows,
  and focus rings.
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

- Body/component text: `--ui-font-size` at regular weight.
- Compact controls/labels: `--ui-font-size-sm`, usually weight 500.
- Secondary details/keycaps: `--ui-font-size-xs`.
- Code/keycaps: `--ui-font-mono`.
- Section/title emphasis should normally use weight 600; reserve 700 for badges
  or data emphasis.

## Spacing and geometry

- Layout spacing uses literal multiples of `0.25rem`; spacing is not tokenized.
- Convert CSS layout pixels to rems.
- Exceptions: 1px borders, SVG/canvas geometry, percentages, aspect ratios,
  animation timing, and proportional calculations derived from a public size.
- Use `--ui-radius-sm` for controls, `--ui-radius` for cards/dialogs, and an
  intentional full pill/circle radius only for pill/avatar/marker shapes.
- Compact controls must retain a clear hit target and must not reserve layout
  space for optional content that is absent.

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

- Metadata-only tags may omit standalone playground sections and screenshots
  when their full behavior is demonstrated through a parent:
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

## Validation tiers

1. Inner loop: `npm run typecheck` and all touched component specs in one
   Playwright invocation.
2. Run docs once after APIs/JSDoc stabilize.
3. Run `npm run test:design` after token/catalog/state changes.
4. Run screenshots once after the full design batch.
5. Run the complete package/demo/Pages gate once at task completion.
6. Reviewer fixes rerun only affected specs/contracts, followed by one final
   full gate.

Canonical screenshot baselines are generated in the matching official
Playwright Linux image, never from an arbitrary host platform:

```bash
docker run --rm --ipc=host \
  -v "$PWD":/work -v /work/node_modules -w /work \
  mcr.microsoft.com/playwright:v1.61.1-noble \
  bash -lc "npm ci && npm run test:visual:update"
```

Run `npm run test:visual` natively only when using a matching checked-in
platform baseline; Linux CI is canonical.

## Review checklist

- Shared tokens use exact fallbacks; data-color exceptions are intentional.
- Spacing follows the scale and optional content consumes no empty space.
- Light, dark, forced-colors, and reduced-motion states remain legible.
- Pointer and keyboard behavior are equivalent.
- Empty/error/loading/disabled/selected states are represented where relevant.
- The playground and tests demonstrate the changed public behavior.

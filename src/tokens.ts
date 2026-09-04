import { css } from "lit";

/**
 * Design token values, sourced from Tailwind v4's default theme palette.
 * Each entry maps a `--ui-*` custom property name to its default value.
 * These are the same values baked in as `var(--ui-*, <fallback>)` fallbacks
 * throughout component styles, so components render correctly with zero
 * external CSS. Consumers may override any of these by setting the custom
 * property on `:root` or an ancestor element (see `tokens.css`).
 */
export const tokenValues: Record<string, string> = {
  // Colors
  "--ui-primary": "#4f46e5", // indigo-600
  "--ui-primary-hover": "#4338ca", // indigo-700
  // Button-specific background/border hooks: default to the flat --ui-primary
  // / --ui-danger tokens above unchanged, so those stay the single source of
  // truth for every other component. Overriding just these lets a theme opt
  // ui-button into a gradient (or any other) background without touching
  // component markup; --ui-button-border/--ui-button-danger-border default
  // to transparent (today's look) and are meant to be paired with a shade
  // darker than the gradient's dark stop when one is set. The `-active`
  // variants default to whatever `-background` already resolved to (so a
  // solid override still applies while pressed) — a gradient theme should
  // set them to the same stops in reverse, for a pressed/"indented" look.
  "--ui-button-background": "var(--ui-primary, #4f46e5)",
  "--ui-button-background-hover": "var(--ui-primary-hover, #4338ca)",
  "--ui-button-background-active": "var(--ui-button-background, var(--ui-primary, #4f46e5))",
  "--ui-button-border": "transparent",
  // The bordered, transparent-background secondary variant's equivalents —
  // shared with confirm-dialog's Cancel button, which is the same visual
  // pattern. Defaults reproduce today's literal secondary styling exactly
  // (no background at any state, border colors matching --ui-border /
  // --ui-text-muted), so a theme only needs to override these to make
  // secondary/Cancel buttons match a primary/danger gradient theme.
  "--ui-button-secondary-background": "none",
  "--ui-button-secondary-background-hover": "none",
  "--ui-button-secondary-background-active": "var(--ui-button-secondary-background, none)",
  "--ui-button-secondary-border": "var(--ui-border, #e2e8f0)",
  "--ui-button-secondary-border-hover": "var(--ui-text-muted, #64748b)",
  // A muted-gray surface used wherever something already paints
  // --ui-surface-muted as a state indicator in flat mode — button-group's
  // unchecked-segment hover, pagination-nav's button hover, and
  // radio-cards/radio-pills' checked background — which is a genuinely
  // different default than secondary's borderless flat hover, so it can't
  // reuse --ui-button-secondary-background-hover's "none" default.
  "--ui-button-secondary-surface-muted": "var(--ui-surface-muted, #f8fafc)",
  // Shared by both primary/danger — a purely cosmetic gloss/legibility pair,
  // not color-specific, so one token covers both variants. `-highlight` is a
  // full box-shadow value (e.g. `inset 0 1px 0 rgb(255 255 255 / 0.35)`) for
  // a glossy top edge, defaulting to a fully transparent (so invisible)
  // shadow rather than the keyword `none` — some usages combine it with
  // another literal shadow in a comma-separated list, where a bare `none`
  // item is invalid CSS and would zero out the *whole* declaration.
  // `-text-shadow` is a full text-shadow value for label legibility against
  // a gradient's lighter stop, always used standalone, so it keeps `none`.
  "--ui-button-highlight": "0 0 0 0 transparent",
  "--ui-button-text-shadow": "none",
  // A solid stand-in for the same accent, for spots that can't render a
  // background gradient at all — a native <input>'s accent-color only
  // accepts a plain color, and a hard-stop background gradient (e.g.
  // range-slider's filled track) can't nest another gradient inside its own
  // color-stop list. Consumers that theme the buttons into a gradient should
  // set this to the gradient's dark stop, so these non-button accents (radio
  // selection indicators, the range-slider track/thumb) stay visually
  // coordinated with it even though they can't literally paint a gradient.
  "--ui-button-accent": "var(--ui-primary, #4f46e5)",
  "--ui-info": "#0ea5e9", // sky-500
  "--ui-info-hover": "#0284c7", // sky-600
  "--ui-danger": "#dc2626", // red-600
  "--ui-danger-hover": "#b91c1c", // red-700
  "--ui-button-danger-background": "var(--ui-danger, #dc2626)",
  "--ui-button-danger-background-hover": "var(--ui-danger-hover, #b91c1c)",
  "--ui-button-danger-background-active":
    "var(--ui-button-danger-background, var(--ui-danger, #dc2626))",
  "--ui-button-danger-border": "transparent",
  "--ui-success": "#16a34a", // green-600
  "--ui-warning": "#d97706", // amber-600
  "--ui-warning-hover": "#b45309", // amber-700
  // toast-notification's per-variant background hooks: default to the flat
  // --ui-success/--ui-danger/--ui-info/--ui-warning tokens unchanged, so
  // those stay the single source of truth for every other component —
  // the same pattern as --ui-button-background/--ui-button-danger-background
  // above. `-highlight`/`-text-shadow` are the same glossy-top-edge /
  // legibility-shadow pair as --ui-button-highlight/--ui-button-text-shadow,
  // kept as separate tokens so a theme can gloss toasts and buttons
  // independently.
  "--ui-toast-success-background": "var(--ui-success, #16a34a)",
  "--ui-toast-error-background": "var(--ui-danger, #dc2626)",
  "--ui-toast-info-background": "var(--ui-info, #0ea5e9)",
  "--ui-toast-warning-background": "var(--ui-warning, #d97706)",
  "--ui-toast-highlight": "0 0 0 0 transparent",
  "--ui-toast-text-shadow": "none",
  // AI accent sweep — the four stops of the animated multi-hue ring
  // ui-button's `ai` modifier draws around a button (and the only place a
  // rainbow reads as meaning "this action is AI-powered" rather than a
  // semantic state). Ordered around the color wheel and looping back to
  // stop 1, so the sweep is seamless; --ui-ai-2 is --ui-primary's own
  // indigo, anchoring the ring to the rest of the palette. Overriding these
  // four retunes every AI button at once.
  "--ui-ai-1": "#38bdf8", // sky-400
  "--ui-ai-2": "#6366f1", // indigo-500
  "--ui-ai-3": "#d946ef", // fuchsia-500
  "--ui-ai-4": "#fbbf24", // amber-400
  "--ui-on-accent": "#ffffff",
  "--ui-text": "#0f172a", // slate-900
  "--ui-text-muted": "#64748b", // slate-500
  "--ui-border": "#e2e8f0", // slate-200
  "--ui-surface": "#ffffff", // white
  "--ui-surface-muted": "#f8fafc", // slate-50
  "--ui-highlight": "#fde68a", // amber-200 — transient "just changed" flash
  "--ui-tooltip": "#0f172a", // slate-900
  "--ui-hover-overlay": "rgb(255 255 255 / 0.32)",
  "--ui-overlay": "rgb(15 23 42 / 0.45)", // slate-900 / 45%

  // Shape / depth
  "--ui-radius": "0.5rem", // rounded-lg
  "--ui-radius-sm": "0.25rem", // rounded
  // The width of a themeable surface/control border. Spacing is deliberately
  // untokenized, but a border is chrome rather than layout: the `blueprint`
  // theme's whole structure is carried by hairline rules instead of shadows,
  // and it needs those rules one step heavier than the default. Defaults to
  // the literal 1px every component used before, so nothing renders
  // differently until a theme overrides it. Only genuine surface/control
  // borders read this — forced-colors `CanvasText` borders and purely
  // decorative literals (a slider thumb's white ring, a tab's 2px underline)
  // keep their own widths, since those aren't the theme's structural rules.
  // Anything with a fixed height/width and a themeable border must also set
  // `box-sizing: border-box`, or a heavier border grows it past the shared
  // 2rem control target.
  "--ui-border-width": "1px",
  // Deliberate pill/circle shapes — a chip, an avatar, a slider thumb, a dot.
  // Tokenized rather than hardcoded so a theme that squares the design system
  // (metro) can reach them too; a literal 9999px/50% silently opts that shape
  // out of every theme. Use these only where the shape is the point, not as a
  // heavier --ui-radius.
  "--ui-radius-pill": "9999px",
  "--ui-radius-circle": "50%",
  "--ui-shadow":
    "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)", // shadow-md
  "--ui-shadow-lg":
    "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)", // shadow-xl
  "--ui-focus-ring": "0 0 0 3px rgb(79 70 229 / 0.35)",

  // Type
  "--ui-font":
    'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
  "--ui-font-mono":
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  "--ui-font-size-lg": "1rem", // text-base
  "--ui-font-size": "0.875rem", // text-sm
  "--ui-font-size-sm": "0.75rem", // text-xs
  "--ui-font-size-xs": "0.6875rem",

  // Font weights — the only four weights the system uses.
  "--ui-font-weight-regular": "400",
  "--ui-font-weight-medium": "500",
  "--ui-font-weight-semibold": "600",
  "--ui-font-weight-bold": "700",

  // Line heights — glyph (icon/marker box), tight (headings), normal (body).
  "--ui-line-height-glyph": "1",
  "--ui-line-height-tight": "1.25",
  "--ui-line-height-normal": "1.5",

  // Letter spacing / tracking — default and the single widened step.
  "--ui-tracking-normal": "0",
  "--ui-tracking-wide": "0.04em",

  // Casing of chrome micro-labels — the small, wide-tracked labels that name a
  // region rather than carry content (a `frame-box` legend, an `app-sidebar`
  // section heading, a `stat-meter` caption). Defaults to `none`, today's
  // sentence case, so nothing changes until a theme sets it; the `blueprint`
  // theme sets `uppercase`, where signage-style labels are the point. Never
  // apply this to user-supplied content — shouting someone's data is not a
  // theme's decision, and `text-transform` is a presentational lie that
  // survives copy/paste as the original casing anyway.
  "--ui-label-transform": "none",

  // Numeral rendering for figures that change in place or stack into a column
  // — a score, a page number, a running clock. Defaults to `normal`
  // (proportional, as before); `tabular-nums` stops digits from jittering
  // horizontally as they tick, which the `blueprint` theme's spec-sheet
  // aesthetic wants everywhere.
  "--ui-numeric": "normal",
};

/**
 * Dark-mode overrides for the same `--ui-*` custom properties, applied by
 * `tokens.css` via `@media (prefers-color-scheme: dark)` and `[data-theme]`
 * (see generate-tokens-css.mjs). Same Tailwind slate scale as the light
 * palette, inverted, with primary/danger/success lightened one step (500
 * instead of 600) for sufficient contrast against dark surfaces. Shape/type
 * tokens are theme-independent and not repeated here.
 */
export const darkTokenValues: Record<string, string> = {
  "--ui-primary": "#6366f1", // indigo-500
  "--ui-primary-hover": "#818cf8", // indigo-400
  "--ui-info": "#38bdf8", // sky-400
  "--ui-info-hover": "#7dd3fc", // sky-300
  "--ui-danger": "#ef4444", // red-500
  "--ui-danger-hover": "#f87171", // red-400
  "--ui-success": "#22c55e", // green-500
  "--ui-warning": "#f59e0b", // amber-500
  "--ui-warning-hover": "#fbbf24", // amber-400
  "--ui-on-accent": "#ffffff",
  "--ui-text": "#f1f5f9", // slate-100
  "--ui-text-muted": "#94a3b8", // slate-400
  "--ui-border": "#334155", // slate-700
  "--ui-surface": "#0f172a", // slate-900
  "--ui-surface-muted": "#1e293b", // slate-800
  "--ui-highlight": "#854d0e", // amber-800 — transient "just changed" flash on dark
  "--ui-tooltip": "#020617", // slate-950
  "--ui-hover-overlay": "rgb(255 255 255 / 0.12)",
  "--ui-overlay": "rgb(2 6 23 / 0.6)", // slate-950 / 60%
  "--ui-focus-ring": "0 0 0 3px rgb(99 102 241 / 0.45)",
};

/**
 * "Gradient" theme overrides, applied via `data-theme="gradient"` on `<html>`
 * (see `generate-tokens-css.mjs`) — forces `color-scheme: light` like the
 * `"light"` override and layers a glossy gradient look on top of the flat
 * light palette, using exactly the `--ui-button-*`/`--ui-button-danger-*`/
 * `--ui-button-secondary-*` hooks `ui-button.ts` already reads (see that
 * file's doc comment), plus the `--ui-toast-*` hooks `toast-notification.ts`
 * reads (see its doc comment). Every other token (`--ui-text`, `--ui-surface`,
 * …) is left at its light-mode default — this theme only glosses buttons and
 * toasts by design. Each variant's gradient runs light-to-dark top-to-bottom
 * (`180deg`) across one Tailwind shade step lighter/darker than the flat
 * token so it still reads as "the same color, glossy" rather than a
 * different hue; `-hover` shifts the whole pair one shade lighter, `-active`
 * reverses the two stops for a pressed/"indented" look, and `-border` is a
 * shade darker than the gradient's dark stop for a defining edge.
 */
export const gradientTokenValues: Record<string, string> = {
  "--ui-button-background": "linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)", // indigo-500 -> 600
  "--ui-button-background-hover": "linear-gradient(180deg, #818cf8 0%, #6366f1 100%)", // indigo-400 -> 500
  "--ui-button-background-active": "linear-gradient(180deg, #4f46e5 0%, #6366f1 100%)", // reversed 600 -> 500
  "--ui-button-border": "#4338ca", // indigo-700
  "--ui-button-danger-background": "linear-gradient(180deg, #ef4444 0%, #dc2626 100%)", // red-500 -> 600
  "--ui-button-danger-background-hover": "linear-gradient(180deg, #f87171 0%, #ef4444 100%)", // red-400 -> 500
  "--ui-button-danger-background-active": "linear-gradient(180deg, #dc2626 0%, #ef4444 100%)", // reversed 600 -> 500
  "--ui-button-danger-border": "#b91c1c", // red-700
  // Secondary stays neutral gray rather than a saturated hue, matching its
  // flat "not the primary action" role, but one shade darker than the
  // original white -> slate-50 pairing: at a small button size, that pair
  // read as flat white with no visible gradient at all. slate-50 -> 100
  // keeps enough contrast to actually look like a gradient while still
  // being clearly lighter/quieter than primary/danger. Border stays
  // slate-300 (a step past the flat slate-200) so its edge still reads
  // against the fill.
  "--ui-button-secondary-background": "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)", // slate-50 -> 100
  "--ui-button-secondary-background-hover": "linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)", // slate-100 -> 200
  "--ui-button-secondary-background-active": "linear-gradient(180deg, #f1f5f9 0%, #f8fafc 100%)", // reversed 100 -> 50
  "--ui-button-secondary-border": "#cbd5e1", // slate-300
  "--ui-button-secondary-border-hover": "#94a3b8", // slate-400
  // button-group's unchecked segments, pagination-nav's prev/next buttons, and
  // radio-cards/radio-pills' checked background read this rather than
  // --ui-button-secondary-background (see tokens above). Left flat they were
  // the one "secondary" surface that stayed matte while every actual secondary
  // button turned glossy, so it tracks the hover gradient rather than a
  // separate literal that could drift out of step with it.
  "--ui-button-secondary-surface-muted": "var(--ui-button-secondary-background-hover)",
  "--ui-button-highlight": "inset 0 1px 0 rgb(255 255 255 / 0.35)", // glossy top edge
  "--ui-button-text-shadow": "0 1px 1px rgb(0 0 0 / 0.25)", // legibility on primary/danger
  "--ui-button-accent": "#4338ca", // indigo-700, matches --ui-button-border
  // toast-notification: same light-to-dark, one-shade-step gradient
  // convention as the button variants above; the bottom stop always matches
  // the flat --ui-success/--ui-danger/--ui-info/--ui-warning value exactly.
  "--ui-toast-success-background": "linear-gradient(180deg, #22c55e 0%, #16a34a 100%)", // green-500 -> 600
  "--ui-toast-error-background": "linear-gradient(180deg, #ef4444 0%, #dc2626 100%)", // red-500 -> 600
  "--ui-toast-info-background": "linear-gradient(180deg, #38bdf8 0%, #0ea5e9 100%)", // sky-400 -> 500
  "--ui-toast-warning-background": "linear-gradient(180deg, #f59e0b 0%, #d97706 100%)", // amber-500 -> 600
  "--ui-toast-highlight": "inset 0 1px 0 rgb(255 255 255 / 0.35)", // glossy top edge, same as --ui-button-highlight
  "--ui-toast-text-shadow": "0 1px 1px rgb(0 0 0 / 0.25)", // legibility, same as --ui-button-text-shadow
};

/**
 * "Metro" theme overrides, applied via `data-theme="metro"` on `<html>` (see
 * `generate-tokens-css.mjs`) — forces `color-scheme: light` like the `"light"`
 * and `"gradient"` overrides, and strips the roundness and depth off the flat
 * light palette to leave hard-edged surfaces over a blue accent, after the
 * dense square-cornered look of the early social bookmarking sites.
 *
 * This is the first theme to override shape rather than only color, so the
 * "shape/type tokens are theme-independent" rule `darkTokenValues` notes above
 * holds for every theme except this one (see `docs/design-language.md`).
 * Squaring the design system means squaring the deliberate pill and circle
 * shapes too — chips, avatars, dots, slider thumbs — which is why those read
 * `--ui-radius-pill`/`--ui-radius-circle` rather than hardcoding `9999px`/`50%`
 * (a literal would silently opt that shape out of the theme).
 *
 * One residual is genuinely out of reach: `price-history-chart` rounds its bars
 * with an SVG `rx` presentation attribute, which cannot take a `var()`, so
 * those stay slightly rounded under metro.
 *
 * The shadows flatten to a hairline ring rather than to `none`. Dropping them
 * outright would leave `slide-panel` — the only overlay with no border of its
 * own — as an invisible white-on-white edge; every other consumer of
 * `--ui-shadow*` either pairs it with `1px solid var(--ui-border)` or applies
 * it on hover/active over an already-bordered control. A hard 1px ring keeps
 * that separation while removing the blur and the faked depth.
 */
export const metroTokenValues: Record<string, string> = {
  "--ui-primary": "#3274d0", // the del.icio.us blue; no Tailwind equivalent
  "--ui-primary-hover": "#2559a8",
  "--ui-focus-ring": "0 0 0 2px #3274d0", // solid and crisp, not the default 3px translucent ring
  "--ui-radius": "0",
  "--ui-radius-sm": "0",
  "--ui-radius-pill": "0",
  "--ui-radius-circle": "0",
  // Hairline rings (slate-900 at low alpha) rather than blurred drop shadows:
  // separation without depth. -lg is a touch stronger, matching the default
  // pair's relative weighting.
  "--ui-shadow": "0 0 0 1px rgb(15 23 42 / 0.12)",
  "--ui-shadow-lg": "0 0 0 1px rgb(15 23 42 / 0.18)",
};

/**
 * "Blueprint" theme overrides, applied via `data-theme="blueprint"` on `<html>`
 * (see `generate-tokens-css.mjs`) — forces `color-scheme: light` like every
 * other non-dark theme, and restyles the light palette as a technical catalog
 * / spec sheet: warm near-black ink on white paper, one pure-blue accent,
 * square corners, and structure carried entirely by hairline rules instead of
 * shadows.
 *
 * It is the widest theme in the system, and the reason three token axes exist
 * that no earlier theme needed:
 *
 * - `--ui-font` is retargeted to a monospace stack. `darkTokenValues` notes
 *   that shape and type tokens are theme-independent; `metro` already broke
 *   that for shape, and this breaks it for the type *family* only. Type
 *   *metrics* (size, weight, line height) remain unthemed in every theme —
 *   they encode hierarchy, which is not a stylistic choice. "Space Mono"
 *   leads the stack purely so a consumer who loads that webfont gets the
 *   reference face automatically; with no external CSS at all it falls
 *   straight through to the same system mono stack `--ui-font-mono` uses, so
 *   the theme still renders correctly on its own.
 * - `--ui-border-width` goes to `1.5px`. Every border in this theme is doing
 *   the work a shadow does elsewhere, and at 1px those rules read as a faint
 *   table rather than as drawn structure.
 * - `--ui-label-transform` goes to `uppercase`, which is what makes chrome
 *   micro-labels read as signage/spec-sheet keys. Only labels that name a
 *   region or column carry this — never user content.
 * - `--ui-numeric` goes to `tabular-nums`, so figures line up in a column and
 *   do not jitter as they change.
 *
 * Buttons are deliberately NOT the accent color. `--ui-primary` stays pure
 * blue because it drives accents everywhere else (active tab underlines,
 * selected states, links, the certification-style tints), but the primary
 * button fill is overridden to ink through the `--ui-button-*` hooks and only
 * turns blue on hover — a black-on-white CTA that lights up is the
 * catalog-print look, and a large pure-blue fill next to blue accents would
 * flatten the two roles into one. That split is exactly what those hooks
 * exist for (see `gradientTokenValues` above for the same technique).
 *
 * Semantic `danger`/`success`/`warning` keep their default hues: they encode
 * meaning rather than style, and the reference's blue-only restraint is an
 * editorial choice a component library cannot make on a consumer's behalf.
 * `--ui-info` is the exception — it is "neutral notice", which in this theme
 * is precisely the accent, and the default sky blue would otherwise sit a few
 * degrees off the pure blue beside it and read as a mistake.
 *
 * Shadows flatten to a hard ink ring rather than to `none`, for the same
 * reason `metro` does it: `slide-panel` has no border of its own and would
 * otherwise lose its edge entirely.
 */
export const blueprintTokenValues: Record<string, string> = {
  // Ink over paper. --ui-text-muted is the same ink at ~65% over white rather
  // than a neutral gray, so the quiet text stays in the same warm family
  // instead of turning blue-gray beside the accent.
  "--ui-text": "#17160f",
  "--ui-text-muted": "#686763",
  "--ui-surface": "#ffffff",
  "--ui-surface-muted": "#f0f0f0",
  // ~55% ink over white. Darker than it looks like it needs to be, because a
  // border is often the only thing bounding a white-on-white control, and
  // WCAG 1.4.11 wants 3:1 against both adjacent surfaces for that: this is
  // 3.55:1 on white and 3.12:1 on the muted surface. The lighter ~40% ink
  // (#a2a29f) reads better but only reaches 2.56:1, and 1.5px of extra weight
  // does not buy an exemption. Still short of fully black, which at this width
  // would turn every bordered surface into a hard box.
  "--ui-border": "#898883",
  "--ui-tooltip": "#17160f",
  "--ui-overlay": "rgb(23 22 15 / 0.45)",
  // The "just changed" flash tints toward the accent instead of amber, which
  // is the one warm hue this palette has no room for.
  "--ui-highlight": "#dcdcff",

  "--ui-primary": "#0000ff",
  "--ui-primary-hover": "#0000cc",
  "--ui-info": "#0000ff",
  "--ui-info-hover": "#0000cc",
  "--ui-on-accent": "#ffffff",
  // Solid and crisp at the reference's own 2px, not the default translucent
  // 3px halo — a blurred ring is the one soft edge this theme has nowhere to
  // put.
  "--ui-focus-ring": "0 0 0 2px #0000ff",

  // Ink CTA that lights up blue on hover, and inverts its two stops while
  // pressed. The border is ink at every state so the button keeps a defining
  // edge even once the fill goes blue.
  "--ui-button-background": "#17160f",
  "--ui-button-background-hover": "#0000ff",
  "--ui-button-background-active": "#0000cc",
  "--ui-button-border": "#17160f",
  "--ui-button-danger-border": "#b91c1c",
  // Secondary is the reference's ghost button: no fill, ink border, a paper
  // wash on hover and an accent border to echo the primary's hover.
  "--ui-button-secondary-border": "#17160f",
  "--ui-button-secondary-border-hover": "#0000ff",
  "--ui-button-secondary-background-hover": "#f0f0f0",
  "--ui-button-secondary-surface-muted": "#f0f0f0",
  // Non-button accents that can only take a plain color (a native input's
  // accent-color, range-slider's track/thumb) follow --ui-primary, not the
  // ink button fill — those are selection marks, not calls to action.
  "--ui-button-accent": "#0000ff",

  "--ui-radius": "0",
  "--ui-radius-sm": "0",
  "--ui-radius-pill": "0",
  "--ui-radius-circle": "0",
  "--ui-shadow": "0 0 0 1.5px rgb(23 22 15 / 0.24)",
  "--ui-shadow-lg": "0 0 0 1.5px #17160f",

  "--ui-border-width": "1.5px",
  "--ui-label-transform": "uppercase",
  "--ui-numeric": "tabular-nums",
  "--ui-font":
    '"Space Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
};

/**
 * Historically a shared `:host { --ui-x: var(--ui-x, fallback); } ` block,
 * re-declaring every token on each component's own host element as a
 * "materialize the inherited value, or this fallback" trick. That pattern
 * turned out to be a genuine bug, not a working default: browsers treat
 * `--ui-x: var(--ui-x, ...)` on `:host` as a self-referencing declaration
 * that computes to the guaranteed-invalid value REGARDLESS of what an
 * ancestor (e.g. `:root`) set — the host's own `:host` rule wins the cascade
 * over the ancestor's, so this dropped whatever the app actually set and
 * silently substituted the component's own fallback everywhere. It went
 * unnoticed because every component's fallback happened to equal the
 * intended light-mode value — dark mode (a real, different value at
 * `:root`) exposed it immediately (colors rendering as if no theme were
 * applied at all). Fix: don't redeclare tokens on `:host` — plain
 * inheritance already carries `:root`'s values into every shadow root
 * correctly, and every component already has its own `var(--ui-x, fallback)`
 * at each point of use, so nothing here is needed for the "zero external
 * CSS" default to keep working. Kept as an empty export so the existing
 * `static override styles = [tokens, css\`...\`]` import in every component
 * keeps compiling.
 */
export const tokens = css``;

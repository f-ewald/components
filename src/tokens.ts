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

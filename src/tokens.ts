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
  "--ui-info": "#0ea5e9", // sky-500
  "--ui-info-hover": "#0284c7", // sky-600
  "--ui-danger": "#dc2626", // red-600
  "--ui-danger-hover": "#b91c1c", // red-700
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

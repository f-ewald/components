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
  "--ui-danger": "#dc2626", // red-600
  "--ui-danger-hover": "#b91c1c", // red-700
  "--ui-success": "#16a34a", // green-600
  "--ui-text": "#0f172a", // slate-900
  "--ui-text-muted": "#64748b", // slate-500
  "--ui-border": "#e2e8f0", // slate-200
  "--ui-surface": "#ffffff", // white
  "--ui-surface-muted": "#f8fafc", // slate-50
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
  "--ui-font-size": "0.875rem",
  "--ui-font-size-sm": "0.75rem",
};

/**
 * A shared `:host` stylesheet that establishes the token custom properties
 * with their fallback values. Import and include this in every component's
 * `static styles` array alongside its component-specific `css` block.
 */
export const tokens = css`
  :host {
    --ui-primary: var(--ui-primary, #4f46e5);
    --ui-primary-hover: var(--ui-primary-hover, #4338ca);
    --ui-danger: var(--ui-danger, #dc2626);
    --ui-danger-hover: var(--ui-danger-hover, #b91c1c);
    --ui-success: var(--ui-success, #16a34a);
    --ui-text: var(--ui-text, #0f172a);
    --ui-text-muted: var(--ui-text-muted, #64748b);
    --ui-border: var(--ui-border, #e2e8f0);
    --ui-surface: var(--ui-surface, #ffffff);
    --ui-surface-muted: var(--ui-surface-muted, #f8fafc);
    --ui-overlay: var(--ui-overlay, rgb(15 23 42 / 0.45));
    --ui-radius: var(--ui-radius, 0.5rem);
    --ui-radius-sm: var(--ui-radius-sm, 0.25rem);
    --ui-shadow: var(
      --ui-shadow,
      0 4px 6px -1px rgb(0 0 0 / 0.1),
      0 2px 4px -2px rgb(0 0 0 / 0.1)
    );
    --ui-shadow-lg: var(
      --ui-shadow-lg,
      0 20px 25px -5px rgb(0 0 0 / 0.1),
      0 8px 10px -6px rgb(0 0 0 / 0.1)
    );
    --ui-focus-ring: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
    --ui-font: var(
      --ui-font,
      ui-sans-serif,
      system-ui,
      sans-serif,
      "Apple Color Emoji",
      "Segoe UI Emoji",
      "Segoe UI Symbol",
      "Noto Color Emoji"
    );
    --ui-font-size: var(--ui-font-size, 0.875rem);
    --ui-font-size-sm: var(--ui-font-size-sm, 0.75rem);
  }
`;

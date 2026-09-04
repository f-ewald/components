# `<skip-link>`

"Skip to main content" bypass link — the package's first pure
accessibility-utility component. It renders a real `<a>` that stays
visually hidden (but in the focus order) until it receives keyboard focus,
then pins itself to the top-left of the viewport as a solid, high-contrast
block so a keyboard or screen-reader user can jump straight past repeated
page chrome to the main content.

Activating it moves focus into the target as well as scrolling to it: a
plain fragment link only moves focus when the target is already focusable,
so this applies `tabindex="-1"` to the target on demand rather than making
every consumer remember to. Native navigation is never prevented, so the
hash still updates.

Place it as the very first focusable element on the page, before the app
chrome, and point `href` at the `id` of the main content region.

## Install

```js
import "@f-ewald/components/skip-link.js";
```

## Usage

```html
<skip-link href="#main"></skip-link>
<skip-link href="#results" label="Jump to results"></skip-link>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `href` | `href` | `string` | `"#main"` | The in-page target the link jumps to (the `id` of the main content region). |
| `label` | `label` | `string` | `"Skip to main content"` | Fallback link wording used when nothing is slotted. |

## Events

_None._

## Slots

| Slot | Description |
| --- | --- |
| `(default)` | Optional custom link wording, overriding `label`. |

## CSS custom properties

| Custom property |
| --- |
| `--ui-focus-ring` |
| `--ui-font` |
| `--ui-font-size-sm` |
| `--ui-font-weight-medium` |
| `--ui-line-height-tight` |
| `--ui-on-accent` |
| `--ui-radius-sm` |
| `--ui-shadow` |
| `--ui-text` |

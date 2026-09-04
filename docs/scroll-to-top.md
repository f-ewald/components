# `<scroll-to-top>`

Overlay button that appears once the page (or a given `target` container)
has scrolled more than `threshold` pixels away from the top edge, and
scrolls back to the top on click.

With no `target` (default), the button is `position: fixed` to the
viewport. When `target` is set, the button switches to `position:
absolute` and expects to be placed as a descendant of a `position:
relative` (or otherwise positioned) ancestor that establishes the visual
bounds to float within — typically `target` itself, given `overflow-y:
auto; position: relative`, so the button stays pinned to that container's
own visible corner as its content scrolls, rather than floating over the
whole page.

The control is styled as a standard secondary button (ui-button's
`secondary` variant: 2rem tall, `--ui-radius-sm` corners, the
`--ui-button-secondary-*` background/border tokens, so a gradient theme
carries over) rather than a pill, layered over an opaque `--ui-surface`
base and an elevation shadow, since it floats above scrolled content.

## Install

```js
import "@f-ewald/components/scroll-to-top.js";
```

## Usage

```html
<scroll-to-top></scroll-to-top>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `target` | _(JS property only)_ | `HTMLElement | null` | `null` | Scrollable container to control; `null` (default) scrolls `window`. |
| `threshold` | `threshold` | `number` | `200` | Pixels scrolled away from the top before the button appears. |
| `label` | `label` | `string` | `"Scroll to top"` | Visible button text, and its accessible name. |

## Events

| Event | Description |
| --- | --- |
| `scroll-to-top-triggered` | The button was clicked, just before scrolling; detail: `{ target }`. |

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-border-width` |
| `--ui-button-highlight` |
| `--ui-button-secondary-` |
| `--ui-button-secondary-background` |
| `--ui-button-secondary-background-active` |
| `--ui-button-secondary-background-hover` |
| `--ui-button-secondary-border` |
| `--ui-button-secondary-border-hover` |
| `--ui-focus-ring` |
| `--ui-font` |
| `--ui-font-size-sm` |
| `--ui-font-weight-medium` |
| `--ui-line-height-tight` |
| `--ui-radius-sm` |
| `--ui-shadow` |
| `--ui-surface` |
| `--ui-surface-muted` |
| `--ui-text` |
| `--ui-text-muted` |

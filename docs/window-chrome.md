# `<window-chrome>`

Sticky editor/terminal-style chrome bar for the top edge of a page or panel:
three decorative traffic-light dots, a filename-style label, and a
right-aligned actions slot for controls such as a theme toggle.

The text property is named `label` rather than `title`, matching
`page-header`'s text-property precedent and avoiding confusion with the
global HTML `title` tooltip attribute. The dots are purely decorative, are
hidden from assistive technology, and reuse the semantic `--ui-danger`,
`--ui-warning`, and `--ui-success` tokens rather than introducing
chrome-only colors.

It sticks with `position: sticky; top: 0`, so callers must place it at the
top of the element that actually scrolls. Its `z-index: 1` is a deliberate
plain literal: just enough to keep the bar above in-flow content as it
sticks, while staying far below the shared overlay stack (dialogs/popovers
start at 100), so it does not participate in `utils/layer-stack.ts`.

## Install

```js
import "@f-ewald/components/window-chrome.js";
```

## Usage

```html
<window-chrome label="~/product — README.md">
  <icon-button slot="actions" label="Toggle theme"></icon-button>
</window-chrome>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | `label` | `string` | `""` | Filename-style text shown beside the decorative dots. |

## Events

_None._

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-border-width` |
| `--ui-danger` |
| `--ui-font` |
| `--ui-font-mono` |
| `--ui-font-size-sm` |
| `--ui-font-weight-regular` |
| `--ui-line-height-tight` |
| `--ui-radius-circle` |
| `--ui-success` |
| `--ui-surface-muted` |
| `--ui-text-muted` |
| `--ui-warning` |

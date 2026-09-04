# `<reveal-button>`

Button that reveals hidden slotted content when clicked. Set `size="sm"`
for a compact button one step below the default, matching `ui-button`'s
`sm` size.

## Install

```js
import "@f-ewald/components/reveal-button.js";
```

## Usage

```html
<reveal-button label="Show the secret">
  Surprise! This content was hidden.
</reveal-button>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | `label` | `string` | `"Reveal hidden content"` | Label shown on the button before it's clicked. |
| `disabled` | `disabled` | `boolean` | `false` | Disables revealing the slotted content. |
| `size` | `size` | `"sm" | "md"` | `"md"` | Size — `sm` reduces the button's height/padding/font-size one step below the default. |

## Events

_None._

## Slots

| Slot | Description |
| --- | --- |
| `(default)` | Content to reveal when clicked. |

## CSS custom properties

| Custom property |
| --- |
| `--ui-border-width` |
| `--ui-button-background` |
| `--ui-button-background-active` |
| `--ui-button-background-hover` |
| `--ui-button-border` |
| `--ui-button-highlight` |
| `--ui-button-text-shadow` |
| `--ui-focus-ring` |
| `--ui-font` |
| `--ui-font-size-sm` |
| `--ui-font-size-xs` |
| `--ui-font-weight-medium` |
| `--ui-line-height-tight` |
| `--ui-on-accent` |
| `--ui-primary` |
| `--ui-primary-hover` |
| `--ui-radius-sm` |

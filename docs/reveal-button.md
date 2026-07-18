# `<reveal-button>`

Button that reveals hidden slotted content when clicked.

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

## Events

_None._

## Slots

| Slot | Description |
| --- | --- |
| `(default)` | Content to reveal when clicked. |

## CSS custom properties

| Custom property |
| --- |
| `--ui-font` |
| `--ui-font-size` |
| `--ui-primary` |
| `--ui-primary-hover` |
| `--ui-radius-sm` |

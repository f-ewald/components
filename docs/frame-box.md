# `<frame-box>`

A titled frame around a slot: a gray border with a small uppercase,
muted label overlapping the top edge (fieldset/legend-style). Generic —
the label text is entirely up to the consumer (e.g. "Debug" to visually
fence off dev-only chrome from the product UI).

## Install

```js
import "@f-ewald/components/frame-box.js";
```

## Usage

```html
<frame-box label="Debug">
  Framed content goes here.
</frame-box>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | `label` | `string` | `""` | The overlapping title label, e.g. "Debug". |

## Events

_None._

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-font` |
| `--ui-font-size-xs` |
| `--ui-radius-sm` |
| `--ui-surface` |
| `--ui-text-muted` |

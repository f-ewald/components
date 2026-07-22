# `<map-pin>`

A circular "Apple Maps"-style map pin: a light-to-dark gradient fill with
a slight point at the bottom. Purely a visual primitive — it has no
`mapbox-gl` (or any mapping library) dependency; the consumer positions
it, e.g. via `new mapboxgl.Marker({ element: pinEl })`.

## Install

```js
import "@f-ewald/components/map-pin.js";
```

## Usage

```html
<map-pin color="#1a73e8" size="30">3</map-pin>
<map-pin color="#22c55e" size="26" highlighted>🏠</map-pin>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `color` | `color` | `string` | `"#4f46e5"` | Fill color; the gradient's light (top) and dark (bottom) stops are derived from this. |
| `size` | `size` | `number` | `32` | Diameter of the circular head, in CSS pixels. |
| `highlighted` | `highlighted` | `boolean` | `false` | Scales and glows the pin — a generic emphasis state (e.g. hover, selection). |

## Events

_None._

## Slots

| Slot | Description |
| --- | --- |
| `(default)` | Badge content shown centered on the pin's circular head — a rank number, an emoji, a small icon. |

## CSS custom properties

| Custom property |
| --- |
| `--ui-font` |
| `--ui-font-weight-bold` |
| `--ui-line-height-glyph` |

# `<map-circle>`

A plain circular map marker: a light-to-dark gradient fill with a white
outer ring, no point/tail (unlike `<map-pin>`) — for markers that don't
need to visually "point" at their exact coordinate. Purely a visual
primitive — it has no `mapbox-gl` (or any mapping library) dependency;
the consumer positions it, e.g. via `new mapboxgl.Marker({ element: el })`.
It can also replace the former `<map-point>` dense-layer primitive: use
`size="14" ring-width="3"`, leave the slot empty, and rasterize one marker
per color for use as a map `icon-image`.

## Install

```js
import "@f-ewald/components/map-circle.js";
```

## Usage

```html
<map-circle color="#6b7280"></map-circle>
<map-circle color="#0099D8" size="14" ring-width="3"></map-circle>
<map-circle color="#1a73e8" size="24" ring-width="5" highlighted>1</map-circle>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `color` | `color` | `string` | `"#4f46e5"` | Fill color; the gradient's light (top) and dark (bottom) stops are derived from this. |
| `size` | `size` | `number` | `18` | Diameter, in CSS pixels. |
| `ringWidth` | `ring-width` | `number` | `4` | White outer ring thickness, in the same viewBox units as `size` (scales with it). |
| `highlighted` | `highlighted` | `boolean` | `false` | Scales and glows the circle — a generic emphasis state (e.g. hover, selection). |

## Events

_None._

## Slots

| Slot | Description |
| --- | --- |
| `(default)` | Optional badge content shown centered on the circle — a rank number, an emoji, a small icon. |

## CSS custom properties

| Custom property |
| --- |
| `--ui-font` |
| `--ui-font-weight-bold` |
| `--ui-line-height-glyph` |

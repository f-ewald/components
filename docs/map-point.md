# `<map-point>`

A small plain-colored map marker for dense point layers (transit stops,
amenities, hazard points, etc.): a light-to-dark gradient fill with a thin
white ring, no badge/content slot — every instance on a given layer shares
the same look, so there's nothing to render per-feature (unlike
`<map-pin>`/`<map-circle>`, which carry per-marker slotted content).
Purely a visual primitive — it has no `mapbox-gl` (or any mapping library)
dependency; typically rasterized once per color and used as a Mapbox
`icon-image` on a `symbol` layer rather than mounted as individual DOM
markers, so a whole layer's worth of points shares one icon image.

## Install

```js
import "@f-ewald/components/map-point.js";
```

## Usage

```html
<map-point color="#0099D8"></map-point>
<map-point color="#fb8072" size="10" ring-width="2"></map-point>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `color` | `color` | `string` | `"#4f46e5"` | Fill color; the gradient's light (top) and dark (bottom) stops are derived from this. |
| `size` | `size` | `number` | `14` | Diameter, in CSS pixels. |
| `ringWidth` | `ring-width` | `number` | `3` | White outer ring thickness, in the same viewBox units as `size` (scales with it). |

## Events

_None._

## Slots

_None._

## CSS custom properties

_None._

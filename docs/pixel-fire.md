# `<pixel-fire>`

Pixelated, 8-bit style fire in the manner of old computer games. By default
it is pinned full width to the bottom of the viewport as a decorative,
click-through overlay; `contained` pins it to the bottom of the nearest
positioned ancestor instead.

The strip's height is set with `--pixel-fire-height` (default `8rem`). It
paints at `z-index: 30`, above ordinary page content but below `app-shell`'s
chrome and every dialog or popover. Under `prefers-reduced-motion: reduce`
it draws one still frame instead of animating. The canvas is hidden from
assistive technology.

## Install

```js
import "@f-ewald/components/pixel-fire.js";
```

## Usage

```html
<!-- Full width along the bottom of the viewport -->
<pixel-fire></pixel-fire>

<!-- Along the bottom of a positioned container, chunkier and lower -->
<div style="position: relative; height: 12rem">
  <pixel-fire contained pixel-size="8" intensity="0.6"
    style="--pixel-fire-height: 6rem"></pixel-fire>
</div>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `pixelSize` | `pixel-size` | `number` | `4` | Size of one fire pixel in CSS pixels; larger values look chunkier. |
| `intensity` | `intensity` | `number` | `1` | Heat of the fire's source, from `0` to `1`. Lowering it shortens the flames; `0` lets the fire burn out. |
| `contained` | `contained` | `boolean` | `false` | Pins the fire to the bottom of the nearest positioned ancestor instead of the viewport. |

## Events

_None._

## Slots

_None._

## CSS custom properties

_None._

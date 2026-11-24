# `<blur-background>`

A decorative, soft circular glow of one color — a radial gradient that
fades smoothly to transparent and gently breathes. In `drift` mode it
wanders across the host on its own; in `follow` mode it eases toward the
pointer, and drifts again when the pointer leaves. It moves exactly like
`particle-background`'s ring.

By default it fills the viewport behind the page at `z-index: -1` and never
intercepts the pointer. That only shows through when the page's background
is painted by `<html>` or `<body>` alone (if both paint, the body hides it)
and content between the two is transparent. With `contained` it fills the
nearest positioned ancestor instead; give that ancestor
`isolation: isolate` so the glow stays behind the ancestor's own content.

Set the color with `--blur-background-color` (default `--ui-primary`),
the diameter with `--blur-background-size` (default `90cqmin`, 90% of the
host's shorter side), and the peak opacity with
`--blur-background-opacity` (default `0.5`). The glow follows theme
changes on its own, since it is plain CSS.

Under `prefers-reduced-motion: reduce` the glow rests, still, in the
center. Animation pauses while the host is off-screen or the tab is hidden.
The glow is hidden from assistive technology.

## Install

```js
import "@f-ewald/components/blur-background.js";
```

## Usage

```html
<!-- Behind the whole page, wandering on its own -->
<blur-background></blur-background>

<!-- Behind one positioned box's content, following the pointer -->
<div style="position: relative; isolation: isolate; height: 18rem">
  <blur-background contained mode="follow"
    style="--blur-background-color: teal; --blur-background-size: 60cqmin"></blur-background>
  <h2>Hello</h2>
</div>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `mode` | `mode` | `BlurBackgroundMode` | `"drift"` | How the glow moves: `drift` wanders on its own, `follow` eases toward the pointer while it is over the host. |
| `contained` | `contained` | `boolean` | `false` | Fills the nearest positioned ancestor instead of the viewport. |

## Events

_None._

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-primary` |

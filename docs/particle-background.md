# `<particle-background>`

A decorative field of small, color-shifting particles that swim on layered
noise. A pulsing ring swells and parts the particles it passes: in `drift`
mode it wanders across the field on its own; in `follow` mode it eases
toward the pointer, and drifts again when the pointer leaves.

By default it fills the viewport behind the page at `z-index: -1` and never
intercepts the pointer. That only shows through when the page's background
is painted by `<html>` or `<body>` alone (if both paint, the body hides it)
and content between the two is transparent. With `contained` it fills the
nearest positioned ancestor instead; give that ancestor
`isolation: isolate` so the field stays behind the ancestor's own content.

Particles mix three colors, set with `--particle-background-color-1`
(dominant, default `--ui-primary`), `--particle-background-color-2`
(default `--ui-danger`), and `--particle-background-color-3` (rarest,
default `--ui-warning`). They are re-read when the page theme changes.

Rendering uses WebGL2; where that is unavailable nothing is drawn. Under
`prefers-reduced-motion: reduce` it draws one still frame instead of
animating. Animation pauses while the host is off-screen or the tab is
hidden. The canvas is hidden from assistive technology.

## Install

```js
import "@f-ewald/components/particle-background.js";
```

## Usage

```html
<!-- Behind the whole page, wandering on its own -->
<particle-background></particle-background>

<!-- Behind one positioned box's content, following the pointer -->
<div style="position: relative; isolation: isolate; height: 18rem">
  <particle-background contained mode="follow" spacing="20"
    style="--particle-background-color-1: teal"></particle-background>
  <h2>Hello</h2>
</div>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `mode` | `mode` | `ParticleBackgroundMode` | `"drift"` | How the ring moves: `drift` wanders on its own, `follow` eases toward the pointer while it is over the host. |
| `contained` | `contained` | `boolean` | `false` | Fills the nearest positioned ancestor instead of the viewport. |
| `spacing` | `spacing` | `number` | `34` | Average distance between particles in CSS pixels (minimum `4`). Particle size scales with it. |

## Events

_None._

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-danger` |
| `--ui-primary` |
| `--ui-warning` |

# `<animate-confetti>`

Fullscreen confetti animation overlay, rendered on a fixed-position canvas.
Starts automatically on first render and stops spawning after `duration`
ms; confetti already in flight keeps falling until it leaves the viewport.

## Install

```js
import "@f-ewald/components/animate-confetti.js";
```

## Usage

```html
<animate-confetti duration="6000"></animate-confetti>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `duration` | `duration` | `number` | `6000` | How long new confetti keeps spawning, in ms. |

## Events

| Event | Description |
| --- | --- |
| `confetti-end` | Fired once the last confetti piece has left the viewport (immediately under reduced motion), so the element can be removed. |

## Slots

_None._

## CSS custom properties

_None._
